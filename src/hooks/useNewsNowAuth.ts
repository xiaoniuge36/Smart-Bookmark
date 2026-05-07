import { useCallback, useEffect, useState } from "react";

// NewsNow 登录状态检测。
//
// NewsNow（busiyi.world 部署版）走 GitHub OAuth，登录成功后会在
// newsnow.busiyi.world 域上 set 至少一个长 token cookie（如 user、session）。
// 我们通过扩展的 chrome.cookies API（配合 host permission https 全域）
// 直接读取该域 cookie；只要存在「名字像 auth、且 value 长度足够」的 cookie，
// 即认为已登录；切回新标签页时（focus 事件）自动复检，
// 让用户在登录完成回来时立刻看到 banner 消失。
//
// 使用前提：manifest 含 cookies 权限。

const NEWSNOW_URL = "https://newsnow.busiyi.world";
// localStorage 键：用户手动点击「我已登录」后记下志，
// 后续检测直接返回 authed（不再依赖 cookie 识别）。
const MANUAL_DISMISS_KEY = "newsnow_auth_manual_dismissed";

// NewsNow / 常见 OAuth + 自托管 SaaS 的认证 cookie 命名模式
const AUTH_COOKIE_PATTERNS: RegExp[] = [
  /^user$/i,
  /^_?user$/i,
  /^session/i,
  /^_?session/i,
  /^auth/i,
  /^_?auth/i,
  /^token/i,
  /^_?token/i,
  /jwt/i,
  /next-auth/i,
  /^sb-/i, // supabase
  /^__Secure-/i, // 通用安全 cookie 前缀
  /^__Host-/i, // 通用主机绑定 cookie 前缀
  /login/i,
  /access[_-]?token/i,
  /refresh[_-]?token/i,
];

// 短于 8 字符基本不可能是 token，避免把 theme=dark 这种偏好误判
const MIN_AUTH_COOKIE_LENGTH = 8;
// 长度 ≥ 24 的随机 cookie 几乎必然是 token（JWT 通常 100+，opaque session id 通常 32+）
const STRONG_TOKEN_LENGTH = 24;

export type NewsNowAuthStatus =
  | "loading" // 初始化中，未确定
  | "authed" // 已登录
  | "guest" // 明确未登录（cookie 检查通过且没找到）
  | "unsupported"; // 非扩展环境 / 缺权限 / API 不可用

export interface NewsNowAuthResult {
  status: NewsNowAuthStatus;
  /** 主动重新检查（例如用户点完登录回到本页） */
  recheck: () => void;
  /** 手动标记为已登录（写入 localStorage），作为检测失效时的兑底 */
  dismiss: () => void;
  /** 清除手动标记 + 重新检测（供设置或调试使用） */
  reset: () => void;
}

function isManuallyDismissed(): boolean {
  try {
    return localStorage.getItem(MANUAL_DISMISS_KEY) === "true";
  } catch {
    return false;
  }
}

function setManualDismiss(value: boolean): void {
  try {
    if (value) localStorage.setItem(MANUAL_DISMISS_KEY, "true");
    else localStorage.removeItem(MANUAL_DISMISS_KEY);
  } catch {
    // localStorage 不可用（隐私模式 / 禁用）时志静默失败
  }
}

function isCookiesApiAvailable(): boolean {
  return (
    typeof chrome !== "undefined" &&
    !!chrome.cookies &&
    typeof chrome.cookies.getAll === "function"
  );
}

function looksLikeAuthCookie(c: chrome.cookies.Cookie): boolean {
  if (!c.value || c.value.length < MIN_AUTH_COOKIE_LENGTH) return false;
  // 强信号 1：HttpOnly cookie 几乎必然是 session/auth/CSRF（JS 取不到，多由后端下发）
  if (c.httpOnly) return true;
  // 强信号 2：长度 ≥ 24 且看起来像 token（base64 / hex / JWT 字符集）
  if (
    c.value.length >= STRONG_TOKEN_LENGTH &&
    /^[A-Za-z0-9._\-=+/%]+$/.test(c.value)
  ) {
    return true;
  }
  // 退化：按命名模式匹配
  return AUTH_COOKIE_PATTERNS.some((pat) => pat.test(c.name));
}

export function useNewsNowAuth(): NewsNowAuthResult {
  const [status, setStatus] = useState<NewsNowAuthStatus>("loading");

  const check = useCallback(async () => {
    // 手动标记最优先：用户明确表达「我已登录」后不再试图识别 cookie
    if (isManuallyDismissed()) {
      setStatus("authed");
      return;
    }
    if (!isCookiesApiAvailable()) {
      console.debug("[useNewsNowAuth] chrome.cookies API 不可用");
      setStatus("unsupported");
      return;
    }
    try {
      // 先按 url 查询（会自动匹配子域规则）
      let cookies = await chrome.cookies.getAll({ url: NEWSNOW_URL });
      // 兜底：按 domain 再查一次（处理某些边界情况下 url 查询返回不全的问题）
      if (cookies.length === 0) {
        cookies = await chrome.cookies.getAll({
          domain: "newsnow.busiyi.world",
        });
      }
      const matched = cookies.filter(looksLikeAuthCookie);
      console.debug("[useNewsNowAuth] cookies", {
        total: cookies.length,
        matched: matched.length,
        names: cookies.map((c) => ({
          name: c.name,
          httpOnly: c.httpOnly,
          valueLen: c.value?.length ?? 0,
        })),
      });
      setStatus(matched.length > 0 ? "authed" : "guest");
    } catch (err) {
      console.debug("[useNewsNowAuth] chrome.cookies.getAll 异常", err);
      setStatus("unsupported");
    }
  }, []);

  useEffect(() => {
    void check();

    // 用户从 NewsNow 登录页切回本页时，window 重新获得 focus，
    // 借此时机重新检查 cookie，让 banner 自动消失。
    const onFocus = () => void check();
    const onVisibility = () => {
      if (document.visibilityState === "visible") void check();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [check]);

  const dismiss = useCallback(() => {
    setManualDismiss(true);
    setStatus("authed");
  }, []);

  const reset = useCallback(() => {
    setManualDismiss(false);
    void check();
  }, [check]);

  return { status, recheck: check, dismiss, reset };
}
