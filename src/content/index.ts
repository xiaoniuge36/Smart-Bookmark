export {};

const SETTINGS_KEY = "smart-bookmark::settings";
const STATE_KEY_POS = "smart-bookmark::edge-tab-top";
const SESSION_HIDE_KEY = "smart-bookmark::session-hidden";

interface MiniSettings {
  floatingBall?: boolean;
  floatingDisabledDomains?: string[];
  language?: "auto" | "zh" | "en";
  searchEngine?: string;
}

const STRINGS = {
  zh: {
    placeholder: "搜索书签或命令…",
    sectionBookmarks: "书签",
    sectionActions: "命令",
    emptyBookmarks: "无匹配书签",
    sidepanel: "打开侧边栏",
    cleaner: "打开清理中心",
    copy: "复制当前 URL",
    qr: "生成二维码",
    hide: "隐藏悬浮球",
    copied: "已复制",
    kbdOpen: "打开",
    kbdNav: "移动",
    menuHideSession: "隐藏直到下一次访问",
    menuDisableSite: "此页面禁用",
    menuDisableGlobal: "全局禁用",
    menuFooterPrefix: "您可以在",
    menuFooterLink: "设置页面",
    menuFooterSuffix: "中重新启用",
  },
  en: {
    placeholder: "Search bookmarks or actions…",
    sectionBookmarks: "Bookmarks",
    sectionActions: "Actions",
    emptyBookmarks: "No matches",
    sidepanel: "Open side panel",
    cleaner: "Open cleaner",
    copy: "Copy current URL",
    qr: "Generate QR code",
    hide: "Hide floating ball",
    copied: "Copied",
    kbdOpen: "Open",
    kbdNav: "Navigate",
    menuHideSession: "Hide until next visit",
    menuDisableSite: "Disable on this site",
    menuDisableGlobal: "Disable globally",
    menuFooterPrefix: "Re-enable in",
    menuFooterLink: "Settings",
    menuFooterSuffix: "",
  },
};

function pickLang(l?: string): "zh" | "en" {
  if (l === "zh" || l === "en") return l;
  const nav = (navigator.language || "en").toLowerCase();
  return nav.startsWith("zh") ? "zh" : "en";
}

const ICON = {
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`,
  panel: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/></svg>`,
  sparkles: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3v4M7 5h4M17 11v4M15 13h4"/><path d="M12 7l1.8 4.2L18 13l-4.2 1.8L12 19l-1.8-4.2L6 13l4.2-1.8z"/></svg>`,
  copy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>`,
  qr: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3M21 14v3M14 21h3M21 21h.01"/></svg>`,
  x: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>`,
  bookmark: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
};

let host: HTMLDivElement | null = null;
let root: ShadowRoot | null = null;
let langKey: "zh" | "en" = "en";
let isOpen = false;
let isMenuOpen = false;

function ensureHost() {
  if (host) return;
  host = document.createElement("div");
  host.id = "smart-bookmark-floating-root";
  host.style.all = "initial";
  host.style.position = "fixed";
  host.style.zIndex = "2147483646";
  host.style.width = "0";
  host.style.height = "0";
  host.style.top = "0";
  host.style.left = "0";
  host.style.pointerEvents = "none";
  document.documentElement.appendChild(host);
  root = host.attachShadow({ mode: "open" });
  injectStyles(root);
}

function injectStyles(r: ShadowRoot) {
  const style = document.createElement("style");
  style.textContent = `
  :host { all: initial; }
  .wrap {
    pointer-events: auto;
    position: fixed;
    right: 12px;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Inter", "PingFang SC", "Microsoft YaHei", sans-serif;
  }

  /* ---------- 贴边标签（白色胶囊 + 品牌色图标） ---------- */
  .tab {
    position: relative;
    width: 36px; height: 36px;
    border-radius: 999px;
    background: #ffffff;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; user-select: none;
    transition: transform .2s ease, box-shadow .2s ease;
    box-shadow:
      0 0 0 1px rgba(15,23,42,.06),
      0 6px 20px rgba(15,23,42,.12),
      0 2px 6px rgba(15,23,42,.06);
  }
  .wrap:hover .tab,
  .tab.is-active {
    transform: translateX(-4px) scale(1.04);
    box-shadow:
      0 0 0 1px rgba(99,102,241,.18),
      0 10px 28px rgba(15,23,42,.18),
      0 4px 10px rgba(99,102,241,.18);
  }
  .tab .bm-icon {
    width: 20px; height: 20px;
    pointer-events: none;
    transition: transform .2s ease;
  }
  .wrap:hover .tab .bm-icon {
    transform: scale(1.08);
  }

  /* ---------- 关闭按钮 ---------- */
  .close-btn {
    position: absolute;
    top: -8px; right: -8px;
    width: 22px; height: 22px;
    border-radius: 50%;
    background: #6b7280;
    color: #fff;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    opacity: 0;
    pointer-events: none;
    transform: scale(.75);
    transition: opacity .15s ease, transform .15s ease, background .15s ease;
    box-shadow: 0 2px 6px rgba(15,23,42,.25);
    border: 2px solid #fff;
  }
  .close-btn:hover { background: #374151; }
  .close-btn svg { width: 11px; height: 11px; }
  .wrap:hover .close-btn,
  .close-btn.is-visible {
    opacity: 1;
    pointer-events: auto;
    transform: scale(1);
  }

  /* ---------- 关闭菜单 ---------- */
  .close-menu {
    position: absolute;
    top: 4px; right: 52px;
    min-width: 240px;
    background: #ffffff;
    border-radius: 14px;
    box-shadow:
      0 0 0 1px rgba(15,23,42,.06),
      0 16px 40px rgba(15,23,42,.18),
      0 4px 12px rgba(15,23,42,.08);
    padding: 10px 0 0;
    color: #0f172a;
    display: none;
    animation: slideIn .18s ease;
  }
  .close-menu.is-open { display: block; }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(6px); }
    to { opacity: 1; transform: translateX(0); }
  }
  .close-menu-item {
    padding: 14px 20px;
    cursor: pointer;
    color: #111827;
    font-size: 14px;
    font-weight: 400;
    line-height: 1.35;
    transition: background .12s ease;
  }
  .close-menu-item:hover { background: #f5f6f8; }
  .close-menu-item:active { background: #eceef1; }
  .close-menu-footer {
    padding: 12px 20px 14px;
    margin-top: 6px;
    border-top: 1px solid #eef0f3;
    font-size: 12px;
    color: #6b7280;
    line-height: 1.5;
    background: #fafbfc;
    border-radius: 0 0 14px 14px;
  }
  .close-menu-footer .settings-link {
    color: #6366f1;
    cursor: pointer;
    text-decoration: none;
    font-weight: 500;
  }
  .close-menu-footer .settings-link:hover { text-decoration: underline; }

  /* ---------- 搜索面板（保持原样，稍作适配） ---------- */
  .panel {
    position: fixed;
    min-width: 440px; max-width: 520px;
    background: rgba(13,13,14,.96);
    color: #f4f4f5;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,.08);
    box-shadow:
      0 0 0 1px rgba(255,255,255,.02),
      0 24px 60px rgba(0,0,0,.5);
    backdrop-filter: blur(18px) saturate(140%);
    -webkit-backdrop-filter: blur(18px) saturate(140%);
    overflow: hidden;
    font-family: inherit;
    font-size: 13px;
    letter-spacing: -0.005em;
  }
  .search {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 14px;
    border-bottom: 1px solid rgba(255,255,255,.06);
  }
  .search .icon { flex: 0 0 auto; width: 16px; height: 16px; color: #a1a1aa; display: inline-flex; }
  .search .icon svg { width: 100%; height: 100%; }
  .input {
    flex: 1 1 auto; min-width: 0;
    background: transparent; border: 0; outline: 0;
    color: #f4f4f5; font-size: 14px;
    font-family: inherit; letter-spacing: inherit;
    padding: 2px 0;
  }
  .input::placeholder { color: #71717a; }

  .body {
    max-height: 380px; overflow-y: auto;
    padding: 4px 0 8px;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,.08) transparent;
  }
  .body::-webkit-scrollbar { width: 8px; }
  .body::-webkit-scrollbar-thumb { background: rgba(255,255,255,.08); border-radius: 8px; }

  .section-title {
    padding: 10px 14px 6px;
    font-size: 10.5px; font-weight: 600;
    text-transform: uppercase; letter-spacing: .08em;
    color: #71717a;
  }

  .row {
    display: flex; align-items: center; gap: 10px;
    padding: 7px 10px;
    margin: 0 6px;
    border-radius: 6px;
    cursor: pointer;
    color: #e4e4e7;
  }
  .row .icon {
    flex: 0 0 auto; width: 16px; height: 16px;
    color: #a1a1aa; display: inline-flex;
  }
  .row .icon img { width: 100%; height: 100%; border-radius: 3px; }
  .row .icon svg { width: 100%; height: 100%; }
  .row .label {
    flex: 1 1 auto; min-width: 0;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    font-size: 13px;
  }
  .row .meta {
    flex: 0 0 auto;
    font-size: 11px; color: #71717a;
    max-width: 180px;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .row.is-active {
    background: rgba(255,255,255,.06);
    color: #fafafa;
  }
  .row.is-active .icon,
  .row.is-active .meta { color: #d4d4d8; }

  .empty {
    padding: 14px 16px;
    font-size: 12px; color: #71717a;
    text-align: center;
  }

  .footer {
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 12px;
    border-top: 1px solid rgba(255,255,255,.06);
    font-size: 11px; color: #71717a;
  }
  .footer .group { display: inline-flex; align-items: center; gap: 6px; }
  .kbd {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 18px; height: 18px; padding: 0 5px;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
    font-size: 10.5px;
    background: rgba(255,255,255,.07);
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 4px;
    color: #d4d4d8;
  }

  .toast {
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    background: rgba(13,13,14,.92); color: #fafafa;
    padding: 8px 14px; border-radius: 999px; font-size: 12px;
    pointer-events: none;
    border: 1px solid rgba(255,255,255,.08);
    backdrop-filter: blur(12px);
    box-shadow: 0 10px 30px rgba(0,0,0,.35);
  }
  `;
  r.appendChild(style);
}

interface SimpleBookmark {
  id: string;
  title: string;
  url: string;
}

async function searchBookmarks(q: string): Promise<SimpleBookmark[]> {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(
        { type: "bookmarks-search", query: q },
        (res) => {
          resolve(res?.items ?? []);
        },
      );
    } catch {
      resolve([]);
    }
  });
}

interface TabPos {
  top: number;
}

async function loadPos(): Promise<TabPos> {
  try {
    const saved = await chrome.storage?.local?.get?.(STATE_KEY_POS);
    if (saved?.[STATE_KEY_POS]) return saved[STATE_KEY_POS] as TabPos;
  } catch {}
  return { top: Math.round(window.innerHeight * 0.42) };
}

async function savePos(p: TabPos) {
  try {
    await chrome.storage?.local?.set?.({ [STATE_KEY_POS]: p });
  } catch {}
}

let panelEl: HTMLDivElement | null = null;
let wrapEl: HTMLDivElement | null = null;
let menuEl: HTMLDivElement | null = null;
let mounted = false;

type ItemKind = "bookmark" | "action";
interface FlatItem {
  kind: ItemKind;
  label: string;
  meta?: string;
  iconSvg?: string;
  iconImg?: string;
  onRun: () => void | Promise<void>;
}

function svgSpan(svg: string): HTMLSpanElement {
  const span = document.createElement("span");
  span.className = "icon";
  span.innerHTML = svg;
  return span;
}

function currentHostname(): string {
  try {
    return location.hostname.replace(/^www\./, "");
  } catch {
    return location.hostname || "";
  }
}

async function mount() {
  if (mounted) return;
  ensureHost();
  if (!root) return;

  langKey = pickLang((await loadSettings()).language);
  const S = STRINGS[langKey];

  const wrap = document.createElement("div");
  wrap.className = "wrap";
  const pos = await loadPos();
  wrap.style.top = `${pos.top}px`;

  const tab = document.createElement("div");
  tab.className = "tab";
  tab.title = "Smart Bookmark";
  tab.innerHTML = `
    <svg class="bm-icon" viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="sb-tab-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#3b82f6"/>
          <stop offset="100%" stop-color="#8b5cf6"/>
        </linearGradient>
      </defs>
      <path fill="url(#sb-tab-grad)" d="M7 3h10a2 2 0 0 1 2 2v16l-7-4.2L5 21V5a2 2 0 0 1 2-2z"/>
    </svg>
  `;

  const closeBtn = document.createElement("div");
  closeBtn.className = "close-btn";
  closeBtn.innerHTML = ICON.x;
  closeBtn.title = S.menuHideSession;

  const menu = buildCloseMenu(S);

  const panel = document.createElement("div");
  panel.className = "panel";
  panel.style.display = "none";

  const searchBar = document.createElement("div");
  searchBar.className = "search";
  searchBar.appendChild(svgSpan(ICON.search));
  const input = document.createElement("input");
  input.className = "input";
  input.placeholder = S.placeholder;
  searchBar.appendChild(input);
  panel.appendChild(searchBar);

  const body = document.createElement("div");
  body.className = "body";
  panel.appendChild(body);

  const footer = document.createElement("div");
  footer.className = "footer";
  const footerLeft = document.createElement("div");
  footerLeft.className = "group";
  footerLeft.innerHTML = `<span class="kbd">↵</span>&nbsp;${S.kbdOpen}`;
  const footerRight = document.createElement("div");
  footerRight.className = "group";
  footerRight.innerHTML = `<span class="kbd">↑</span><span class="kbd">↓</span>&nbsp;${S.kbdNav}`;
  footer.appendChild(footerLeft);
  footer.appendChild(footerRight);
  panel.appendChild(footer);

  let items: FlatItem[] = [];
  let activeIndex = 0;

  const togglePanel = (force?: boolean) => {
    isOpen = force ?? !isOpen;
    panel.style.display = isOpen ? "block" : "none";
    tab.classList.toggle("is-active", isOpen);
    if (isOpen) {
      closeMenu();
      const rect = tab.getBoundingClientRect();
      const panelHeight = panel.offsetHeight || 420;
      const panelWidth = panel.offsetWidth || 460;
      const top = Math.max(
        8,
        Math.min(
          window.innerHeight - panelHeight - 8,
          rect.top - panelHeight / 2,
        ),
      );
      const left = Math.max(8, rect.left - panelWidth - 12);
      panel.style.top = `${top}px`;
      panel.style.left = `${left}px`;
      setTimeout(() => {
        input.focus();
        input.select();
      }, 30);
    }
  };

  const openMenu = () => {
    isMenuOpen = true;
    menu.classList.add("is-open");
    closeBtn.classList.add("is-visible");
    togglePanel(false);
  };
  const closeMenu = () => {
    isMenuOpen = false;
    menu.classList.remove("is-open");
    closeBtn.classList.remove("is-visible");
  };

  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (isMenuOpen) closeMenu();
    else openMenu();
  });

  // Right-click on tab also opens the close menu
  tab.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    e.stopPropagation();
    openMenu();
  });

  menu.querySelector<HTMLDivElement>("[data-act='hide-session']")?.addEventListener(
    "click",
    () => {
      closeMenu();
      hideForSession();
    },
  );
  menu.querySelector<HTMLDivElement>("[data-act='disable-site']")?.addEventListener(
    "click",
    async () => {
      closeMenu();
      await disableForSite();
    },
  );
  menu.querySelector<HTMLDivElement>("[data-act='disable-global']")?.addEventListener(
    "click",
    async () => {
      closeMenu();
      await disableGlobal();
    },
  );
  menu.querySelector<HTMLAnchorElement>(".settings-link")?.addEventListener("click", (e) => {
    e.preventDefault();
    try {
      chrome.runtime.sendMessage({ type: "open-settings" });
    } catch {}
  });

  const actionDefs: FlatItem[] = [
    {
      kind: "action",
      label: S.sidepanel,
      iconSvg: ICON.panel,
      onRun: () => {
        chrome.runtime.sendMessage({ type: "open-sidepanel" });
        togglePanel(false);
      },
    },
    {
      kind: "action",
      label: S.cleaner,
      iconSvg: ICON.sparkles,
      onRun: () => {
        chrome.runtime.sendMessage({ type: "open-cleaner" });
        togglePanel(false);
      },
    },
    {
      kind: "action",
      label: S.copy,
      iconSvg: ICON.copy,
      onRun: async () => {
        try {
          await navigator.clipboard.writeText(location.href);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = location.href;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        flash(S.copied);
      },
    },
    {
      kind: "action",
      label: S.qr,
      iconSvg: ICON.qr,
      onRun: () => {
        chrome.runtime.sendMessage({ type: "open-qr", url: location.href });
        togglePanel(false);
      },
    },
  ];

  const setActive = (idx: number) => {
    if (!items.length) {
      activeIndex = 0;
      return;
    }
    activeIndex = Math.max(0, Math.min(items.length - 1, idx));
    const rows = body.querySelectorAll<HTMLDivElement>(".row");
    rows.forEach((r) => r.classList.remove("is-active"));
    const rowEl = body.querySelector<HTMLDivElement>(
      `.row[data-idx="${activeIndex}"]`,
    );
    if (rowEl) {
      rowEl.classList.add("is-active");
      const bodyRect = body.getBoundingClientRect();
      const rRect = rowEl.getBoundingClientRect();
      if (rRect.bottom > bodyRect.bottom) {
        body.scrollTop += rRect.bottom - bodyRect.bottom + 4;
      } else if (rRect.top < bodyRect.top) {
        body.scrollTop -= bodyRect.top - rRect.top + 4;
      }
    }
  };

  const runActive = () => {
    const it = items[activeIndex];
    if (it) it.onRun();
  };

  const appendRow = (it: FlatItem) => {
    const idx = items.length;
    items.push(it);
    const row = document.createElement("div");
    row.className = "row";
    row.setAttribute("data-idx", String(idx));

    if (it.iconImg) {
      const iconWrap = document.createElement("span");
      iconWrap.className = "icon";
      const img = document.createElement("img");
      img.src = it.iconImg;
      img.onerror = () => {
        img.remove();
        iconWrap.innerHTML = ICON.bookmark;
      };
      iconWrap.appendChild(img);
      row.appendChild(iconWrap);
    } else if (it.iconSvg) {
      row.appendChild(svgSpan(it.iconSvg));
    }

    const label = document.createElement("span");
    label.className = "label";
    label.textContent = it.label;
    row.appendChild(label);

    if (it.meta) {
      const meta = document.createElement("span");
      meta.className = "meta";
      meta.textContent = it.meta;
      row.appendChild(meta);
    }

    row.addEventListener("mouseenter", () => setActive(idx));
    row.addEventListener("click", () => {
      activeIndex = idx;
      runActive();
    });
    body.appendChild(row);
  };

  const renderItems = (q: string, bookmarks: SimpleBookmark[]) => {
    body.innerHTML = "";
    items = [];

    if (q) {
      const title = document.createElement("div");
      title.className = "section-title";
      title.textContent = S.sectionBookmarks;
      body.appendChild(title);
      if (!bookmarks.length) {
        const empty = document.createElement("div");
        empty.className = "empty";
        empty.textContent = S.emptyBookmarks;
        body.appendChild(empty);
      } else {
        for (const b of bookmarks) {
          let hostname = "";
          try {
            hostname = new URL(b.url).hostname.replace(/^www\./, "");
          } catch {
            hostname = b.url;
          }
          appendRow({
            kind: "bookmark",
            label: b.title || hostname,
            meta: hostname,
            iconImg: `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`,
            onRun: () => {
              window.location.href = b.url;
            },
          });
        }
      }
    }

    const actTitle = document.createElement("div");
    actTitle.className = "section-title";
    actTitle.textContent = S.sectionActions;
    body.appendChild(actTitle);
    for (const a of actionDefs) appendRow(a);

    setActive(0);
  };

  let inputTimer: any = null;
  input.addEventListener("input", () => {
    const q = input.value.trim();
    if (inputTimer) clearTimeout(inputTimer);
    if (!q) {
      renderItems("", []);
      return;
    }
    inputTimer = setTimeout(async () => {
      const hits = await searchBookmarks(q);
      renderItems(q, hits);
    }, 120);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(activeIndex + 1 >= items.length ? 0 : activeIndex + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(activeIndex - 1 < 0 ? items.length - 1 : activeIndex - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      runActive();
    } else if (e.key === "Escape") {
      e.preventDefault();
      togglePanel(false);
    }
  });

  renderItems("", []);

  // 拖拽：只沿垂直方向移动
  let dragStart: {
    y: number;
    top: number;
    moved: boolean;
  } | null = null;

  tab.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    dragStart = {
      y: e.clientY,
      top: parseInt(wrap.style.top, 10) || 0,
      moved: false,
    };
    const onMove = (ev: MouseEvent) => {
      if (!dragStart) return;
      const dy = ev.clientY - dragStart.y;
      if (Math.abs(dy) > 3) dragStart.moved = true;
      const top = Math.max(
        8,
        Math.min(window.innerHeight - 52, dragStart.top + dy),
      );
      wrap.style.top = `${top}px`;
    };
    const onUp = async () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      if (dragStart) {
        if (dragStart.moved) {
          await savePos({ top: parseInt(wrap.style.top, 10) || 0 });
        } else {
          togglePanel();
        }
      }
      dragStart = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  });

  wrap.appendChild(tab);
  wrap.appendChild(closeBtn);
  wrap.appendChild(menu);
  wrap.appendChild(panel);
  root.appendChild(wrap);

  wrapEl = wrap;
  panelEl = panel;
  menuEl = menu;
  mounted = true;

  document.addEventListener("click", onGlobalClick, true);
}

function buildCloseMenu(S: (typeof STRINGS)["zh"]): HTMLDivElement {
  const menu = document.createElement("div");
  menu.className = "close-menu";
  menu.innerHTML = `
    <div class="close-menu-item" data-act="hide-session">${S.menuHideSession}</div>
    <div class="close-menu-item" data-act="disable-site">${S.menuDisableSite}</div>
    <div class="close-menu-item" data-act="disable-global">${S.menuDisableGlobal}</div>
    <div class="close-menu-footer">
      ${S.menuFooterPrefix} <a class="settings-link" href="#">${S.menuFooterLink}</a> ${S.menuFooterSuffix}
    </div>
  `;
  return menu;
}

function hideForSession() {
  try {
    sessionStorage.setItem(SESSION_HIDE_KEY, "1");
  } catch {}
  unmount();
}

async function disableForSite() {
  const host = currentHostname();
  if (!host) return unmount();
  const s = await loadSettings();
  const list = new Set(s.floatingDisabledDomains ?? []);
  list.add(host);
  await saveSettings({ ...s, floatingDisabledDomains: Array.from(list) });
  // storage change will trigger apply() → unmount
}

async function disableGlobal() {
  const s = await loadSettings();
  await saveSettings({ ...s, floatingBall: false });
}

function onGlobalClick(e: MouseEvent) {
  const path = e.composedPath();
  if (isMenuOpen && menuEl && wrapEl) {
    if (!path.includes(wrapEl)) {
      isMenuOpen = false;
      menuEl.classList.remove("is-open");
    }
  }
  if (isOpen && wrapEl) {
    if (!path.includes(wrapEl)) {
      isOpen = false;
      if (panelEl) panelEl.style.display = "none";
    }
  }
}

function unmount() {
  if (!mounted) return;
  if (host) host.remove();
  host = null;
  root = null;
  panelEl = null;
  wrapEl = null;
  menuEl = null;
  mounted = false;
  isOpen = false;
  isMenuOpen = false;
  document.removeEventListener("click", onGlobalClick, true);
}

function flash(text: string) {
  if (!root) return;
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = text;
  root.appendChild(t);
  setTimeout(() => t.remove(), 1600);
}

async function loadSettings(): Promise<MiniSettings> {
  try {
    const s = await chrome.storage?.local?.get?.(SETTINGS_KEY);
    return s?.[SETTINGS_KEY] ?? {};
  } catch {
    return {};
  }
}

async function saveSettings(next: MiniSettings) {
  try {
    await chrome.storage?.local?.set?.({ [SETTINGS_KEY]: next });
  } catch {}
}

function isSessionHidden(): boolean {
  try {
    return sessionStorage.getItem(SESSION_HIDE_KEY) === "1";
  } catch {
    return false;
  }
}

async function apply() {
  const s = await loadSettings();
  const host = currentHostname();
  const siteDisabled = !!(
    s.floatingDisabledDomains && host && s.floatingDisabledDomains.includes(host)
  );
  const sessionHidden = isSessionHidden();
  if (s.floatingBall && !siteDisabled && !sessionHidden) {
    mount().catch(console.warn);
  } else {
    unmount();
  }
}

apply();

chrome.storage?.onChanged?.addListener?.((changes, area) => {
  if (area !== "local") return;
  if (changes[SETTINGS_KEY]) {
    apply();
  }
});
