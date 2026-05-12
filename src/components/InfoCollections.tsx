import type { MouseEvent } from "react";
import {
  ArrowUpRight,
  Check,
  Info,
  Newspaper,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn, faviconOf, hostnameOf } from "@/lib/utils";
import { resolveLanguage } from "@/lib/i18n";
import type { Language } from "@/types";
import { useNewsNowAuth } from "@/hooks/useNewsNowAuth";
import HideWidgetButton from "@/components/HideWidgetButton";

type Copy = {
  zh: string;
  en: string;
};

interface CollectionItem {
  title: string;
  url: string;
  tag: Copy;
  description: Copy;
}

interface CollectionGroup {
  title: Copy;
  subtitle: Copy;
  Icon: LucideIcon;
  accent: string;
  items: CollectionItem[];
}

const NEWSNOW_URL = "https://newsnow.busiyi.world/";
// 0.70 让最窄场景 (xl=1280 屏，三栏 dashboard 下主区 ~720px) 也能达到 NewsNow
// 3 列响应式断点：720 / 0.70 ≈ 1029px 原生宽，刚过 NewsNow 3 列阈值。
// 文字相对 0.74 缩小 ~5%，几乎察觉不到，但能保证「无论屏宽多少 NewsNow 都 3 列」。
// 大屏 (1440+) 主区 880px+ 原生 1257px+，已远超 3 列阈值，scale 偏低也无所谓。
const NEWSNOW_FRAME_SCALE = 0.7;

const COLLECTIONS: CollectionGroup[] = [
  {
    title: { zh: "热点入口", en: "Trend sources" },
    subtitle: {
      zh: "实时热点主屏 + 备用入口",
      en: "Live feed plus backup trend sources",
    },
    Icon: Newspaper,
    accent: "from-sky-500/20 to-cyan-500/20 text-sky-600 dark:text-sky-400",
    items: [
      {
        title: "今日热榜",
        url: "https://tophub.today/c/tech",
        tag: { zh: "技术热榜", en: "Tech feeds" },
        description: {
          zh: "GitHub Trending、Product Hunt、Hacker News 等技术与产品热点",
          en: "GitHub Trending, Product Hunt, Hacker News and product news",
        },
      },
      {
        title: "SoPilot",
        url: "https://sopilot.net/zh/hot-tweets",
        tag: { zh: "X 热帖", en: "X posts" },
        description: {
          zh: "X 热门推文，适合快速看舆论和评论风向",
          en: "Hot X posts for a fast read on public conversation",
        },
      },
    ],
  },
  {
    title: { zh: "信息差工具", en: "Resource tools" },
    subtitle: {
      zh: "AI 中转、公益站与内容检索入口",
      en: "AI relays, public AI sites and useful indexes",
    },
    Icon: Sparkles,
    accent:
      "from-amber-500/20 to-rose-500/20 text-amber-600 dark:text-amber-300",
    items: [
      {
        title: "tokennav.cc",
        url: "https://tokennav.cc",
        tag: { zh: "Token 比价", en: "Token prices" },
        description: {
          zh: "API 中转服务比价入口，适合先看价格区间",
          en: "API relay price comparison for quick market checks",
        },
      },
      {
        title: "aibijia.org",
        url: "https://aibijia.org",
        tag: { zh: "Token 比价", en: "Token prices" },
        description: {
          zh: "同类 API 中转比价，补充价格和供应商参考",
          en: "Another API relay price index for supplier comparison",
        },
      },
      {
        title: "HelpAIO Transit",
        url: "https://www.helpaio.com/transit",
        tag: { zh: "AI 中转合集", en: "AI relays" },
        description: {
          zh: "AI API 中转站合集，适合横向对比可用服务",
          en: "AI API relay collection for comparing available services",
        },
      },
      {
        title: "LDOH 公益站导航",
        url: "https://ldoh.105117.xyz/",
        tag: { zh: "公益站导航", en: "Public AI" },
        description: {
          zh: "AI 公益站与免费体验资源导航",
          en: "Public AI sites and free trial resource navigation",
        },
      },
      {
        title: "wallhaven.cc",
        url: "https://wallhaven.cc/",
        tag: { zh: "图片素材", en: "Wallpapers" },
        description: {
          zh: "高质量壁纸和图片素材检索入口",
          en: "High-quality wallpaper and image discovery",
        },
      },
      {
        title: "greenvideo.cc",
        url: "https://greenvideo.cc",
        tag: { zh: "视频检索", en: "Video search" },
        description: {
          zh: "视频资源检索入口",
          en: "Video resource search entry",
        },
      },
      {
        title: "seedhub.cc",
        url: "https://seedhub.cc",
        tag: { zh: "影视索引", en: "Media index" },
        description: {
          zh: "影视资源索引入口",
          en: "Film and series resource index",
        },
      },
      {
        title: "flacdownloader.com",
        url: "https://flacdownloader.com",
        tag: { zh: "无损音乐", en: "Lossless music" },
        description: {
          zh: "FLAC 音乐资源检索入口",
          en: "FLAC music search entry",
        },
      },
    ],
  },
];

interface HidePropsBase {
  /** 如果传入，组件在 hover 时显示「隐藏」按钮，点击触发回调 */
  onHide?: () => void;
  hideLabel?: string;
  hideTooltip?: string;
}

/**
 * 「NewsNow 实时热点」iframe 独立模块。
 *
 * 拆分自旧的 `InfoCollections`：现在 iframe 与下方资源入口卡片各自是独立的
 * 首页组件，可在「设置 → 首页组件」或 hover header 时的「隐藏」按钮中单独隐藏。
 *
 * 布局：组件被设计为可在父容器中以 `flex-1 min-h-0` 拉伸（与三栏布局
 * 右栏 sidebar 等高对齐），内部 iframe 容器 `flex-1` 撑满剩余空间。
 */
export function InfoLiveNews({
  language,
  className,
  onHide,
  hideLabel,
  hideTooltip,
}: {
  language: Language;
  className?: string;
} & HidePropsBase) {
  const lang = resolveLanguage(language);
  return (
    <section
      className={cn(
        "group/widget flex flex-1 min-h-0 flex-col",
        className,
      )}
    >
      <LiveNewsFrame
        lang={lang}
        onHide={onHide}
        hideLabel={hideLabel}
        hideTooltip={hideTooltip}
      />
    </section>
  );
}

/**
 * 「热点资源入口」独立模块：原来位于 NewsNow iframe 下方的
 * 「热点入口 + 信息差工具」chip 链接卡片。
 *
 * 与 {@link InfoLiveNews} 完全解耦，可独立显隐；隐藏按钮以浮层形式落在
 * 卡片右上角（hover 才出现），不占用版面。
 */
export function InfoEntries({
  language,
  className,
  onHide,
  hideLabel,
  hideTooltip,
}: {
  language: Language;
  className?: string;
} & HidePropsBase) {
  const lang = resolveLanguage(language);
  const [trendGroup, toolGroup] = COLLECTIONS;

  return (
    <section
      className={cn(
        "group/widget relative shrink-0 space-y-3 rounded-2xl border bg-card/40 p-3 ring-1 ring-black/[0.02] dark:ring-white/[0.04]",
        className,
      )}
    >
      {onHide && (
        <HideWidgetButton
          onHide={onHide}
          label={hideLabel ?? (lang === "zh" ? "隐藏" : "Hide")}
          tooltip={hideTooltip}
        />
      )}
      <ChipGroup
        label={trendGroup.title[lang]}
        Icon={trendGroup.Icon}
        accentClass="bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300"
        items={trendGroup.items}
        lang={lang}
        chipAccent="trend"
      />
      <div className="h-px bg-border/50" />
      <ChipGroup
        label={toolGroup.title[lang]}
        Icon={toolGroup.Icon}
        accentClass="bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300"
        items={toolGroup.items}
        lang={lang}
        chipAccent="tool"
      />
    </section>
  );
}

function LiveNewsFrame({
  lang,
  onHide,
  hideLabel,
  hideTooltip,
}: {
  lang: "zh" | "en";
} & HidePropsBase) {
  // 登录检测放在 LiveNewsFrame 内部：
  // - 未登录 / 无法判定时在「打开」旁多一个 amber 「需登录同步」按钮
  // - 鼠标悬停按钮会出现自定义 tooltip（不是原生 title）
  // - tooltip 里含「我已登录」按钮，作为 cookie 检测失效时的兑底兑底
  const { status: authStatus, dismiss } = useNewsNowAuth();
  const showLoginBtn =
    authStatus === "guest" || authStatus === "unsupported";

  return (
    // 外层用 flex-col + h-full，使 grid 中的 stretch 对齐能传递到子元素；
    // iframe 容器采用 flex-1 + min-h，既保证单列时有足够高度，
    // 双列时会拉伸填充到 sidebar 高度，实现底部对齐。
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm ring-1 ring-black/[0.02] dark:ring-white/[0.04]">
      <div className="flex items-center justify-between gap-3 border-b bg-gradient-to-r from-sky-500/[0.04] via-muted/30 to-transparent px-3.5 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <SectionIcon
            Icon={Newspaper}
            accent="from-sky-500/25 to-indigo-500/25 text-sky-600 dark:text-sky-400"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-semibold tracking-tight">
                NewsNow {lang === "zh" ? "实时热点" : "Live"}
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-300">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                Live
              </span>
            </div>
            <p className="truncate text-[11px] text-muted-foreground">
              {lang === "zh"
                ? "知乎、微博、B站、虎扑、V2EX 等热点聚合"
                : "Zhihu, Weibo, Bilibili, Hupu, V2EX and more"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {showLoginBtn && (
            <LoginPromptButton lang={lang} onDismiss={dismiss} />
          )}
          <a
            href={NEWSNOW_URL}
            target="_blank"
            rel="noreferrer"
            className="group hidden items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition hover:bg-background hover:text-primary sm:inline-flex"
          >
            {lang === "zh" ? "打开" : "Open"}
            <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
          {onHide && (
            <HideWidgetButton
              variant="inline"
              onHide={onHide}
              label={hideLabel ?? (lang === "zh" ? "隐藏" : "Hide")}
              tooltip={hideTooltip}
            />
          )}
        </div>
      </div>
      <div className="relative flex-1 min-h-[460px] overflow-hidden bg-background xl:min-h-[600px] 2xl:min-h-[640px]">
        <iframe
          title="NewsNow"
          src={NEWSNOW_URL}
          loading="lazy"
          referrerPolicy="no-referrer"
          sandbox="allow-forms allow-popups allow-scripts allow-same-origin"
          className="absolute left-0 top-0 bg-background"
          style={{
            height: `${100 / NEWSNOW_FRAME_SCALE}%`,
            transform: `scale(${NEWSNOW_FRAME_SCALE})`,
            transformOrigin: "0 0",
            width: `${100 / NEWSNOW_FRAME_SCALE}%`,
          }}
        />
      </div>
    </div>
  );
}

// 自定义 hover tooltip 形态的「需登录同步」按钮：
// - 主体是 amber 风格的链接按钮，点击在新标签打开 NewsNow 让用户登录
// - 鼠标悬停（或 keyboard focus）时下方弹出 tooltip，含详细说明 + 「我已登录」兜底按钮
// - tooltip 用 CSS group-hover/group-focus-within 控制，无 JS 状态
// - 用 top-full + 内层 mt 让"按钮↔tooltip"之间的 gap 也属于 group 命中范围，
//   防止鼠标移到 tooltip 时短暂掉出 hover 区域导致 tooltip 闪烁/消失
function LoginPromptButton({
  lang,
  onDismiss,
}: {
  lang: "zh" | "en";
  onDismiss: () => void;
}) {
  const handleDismiss = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onDismiss();
  };

  return (
    <div className="group/login-hint relative">
      <a
        href={NEWSNOW_URL}
        target="_blank"
        rel="noreferrer"
        aria-describedby="newsnow-login-tooltip"
        className="inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-700 transition hover:border-amber-500/60 hover:bg-amber-500/15 dark:text-amber-300"
      >
        <Info className="h-3.5 w-3.5" />
        {lang === "zh" ? "需登录同步" : "Sign in"}
      </a>
      <div
        id="newsnow-login-tooltip"
        role="tooltip"
        // top-full：tooltip 容器从按钮底边开始，没有视觉裂缝；
        // 内层 mt-1.5 提供 6px 视觉间距，但 mt 部分仍属于 group 命中区，
        // 鼠标从按钮平移到 tooltip 不会丢失 hover。
        className="invisible absolute right-0 top-full z-30 opacity-0 transition-all duration-150 group-hover/login-hint:visible group-hover/login-hint:opacity-100 group-focus-within/login-hint:visible group-focus-within/login-hint:opacity-100"
      >
        <div className="mt-1.5 w-72 rounded-lg border bg-popover p-3 text-left shadow-xl ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
          <div className="mb-1 flex items-center gap-1.5 text-[12.5px] font-semibold text-foreground">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500/15 text-amber-600 ring-1 ring-amber-500/30 dark:text-amber-400">
              <Info className="h-3 w-3" />
            </span>
            {lang === "zh"
              ? "登录后内容会自动同步"
              : "Sign in to sync the live feeds"}
          </div>
          <p className="mb-2.5 text-[11.5px] leading-relaxed text-muted-foreground">
            {lang === "zh"
              ? "部分热源（微博、知乎、V2EX 等）需要登录账号。点按钮在新标签打开 NewsNow 登录后回到本页，iframe 会自动同步状态并加载对应热点。"
              : "Some sources (Weibo, Zhihu, V2EX, …) need sign-in. Click the button to open NewsNow, log in there, then come back — the iframe will sync automatically."}
          </p>
          <button
            type="button"
            onClick={handleDismiss}
            className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-[11px] font-medium text-foreground transition hover:bg-accent"
          >
            <Check className="h-3 w-3" />
            {lang === "zh" ? "我已登录，不再提示" : "Already signed in"}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 一组 chip 链接的容器：左上角是一个带图标的分组标签，右侧紧跟 chip wrap。
 * 用于在信息差雷达下方分别展示「热点入口」和「信息差工具」两组备用入口。
 */
function ChipGroup({
  label,
  Icon,
  accentClass,
  items,
  lang,
  chipAccent,
}: {
  label: string;
  Icon: LucideIcon;
  // 分组标签的背景色/文字色 className (如 bg-sky-500 的半透明 + text-sky-700 + ring)
  accentClass: string;
  items: CollectionItem[];
  lang: "zh" | "en";
  chipAccent: "trend" | "tool";
}) {
  return (
    <div className="space-y-2">
      {/* 分组标签独占一行，让其下方的卡片网格视觉对齐 */}
      <div className="flex items-center gap-1.5 px-0.5">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ring-1",
            accentClass,
          )}
        >
          <Icon className="h-2.5 w-2.5" />
          {label}
        </span>
      </div>
      {/*
        卡片自适应网格：每张卡片最小 200px，按容器宽度自动 1/2/3/4 列；
        在 main col 720-1300px 区间会自然落到 3-4 列，每张卡片宽度足够显示标题 + 单行描述
      */}
      <div className="grid gap-1.5 [grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]">
        {items.map((it) => (
          <ChipLink key={it.url} item={it} lang={lang} accent={chipAccent} />
        ))}
      </div>
    </div>
  );
}

/**
 * 链接小卡片：信息差雷达下方分组列表的可点击卡片。
 * - 永久显示 favicon + 标题 + tag 徽章 + 一行描述（不需要 hover）
 * - hover 时按分组 accent (trend=sky / tool=amber) 着色边框 + 微微上浮 + 阴影
 * - 不再用 Tooltip，因为关键信息已直接呈现；hostname 留给原生 title 属性
 */
function ChipLink({
  item,
  lang,
  accent,
}: {
  item: CollectionItem;
  lang: "zh" | "en";
  accent: "trend" | "tool";
}) {
  const hoverBorder =
    accent === "trend"
      ? "hover:border-sky-500/40"
      : "hover:border-amber-500/40";
  const tagClass =
    accent === "trend"
      ? "bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300"
      : "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300";

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      title={`${item.title} · ${hostnameOf(item.url)}`}
      className={cn(
        "group/chipcard flex flex-col gap-1 rounded-xl border bg-card px-2.5 py-2 shadow-sm ring-1 ring-black/[0.02] transition dark:ring-white/[0.04]",
        "hover:-translate-y-px hover:shadow-md",
        hoverBorder,
      )}
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <img
          src={faviconOf(item.url, 32)}
          alt=""
          className="h-3.5 w-3.5 shrink-0 rounded"
          onError={(e) => (e.currentTarget.style.visibility = "hidden")}
        />
        <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold tracking-tight text-foreground">
          {item.title}
        </span>
        <span
          className={cn(
            "shrink-0 rounded-full px-1.5 py-px text-[9.5px] font-medium ring-1",
            tagClass,
          )}
        >
          {item.tag[lang]}
        </span>
      </div>
      <div className="line-clamp-1 text-[10.5px] leading-snug text-muted-foreground">
        {item.description[lang]}
      </div>
    </a>
  );
}

function SectionIcon({
  Icon,
  accent,
  size = "md",
  glow = false,
}: {
  Icon: LucideIcon;
  accent: string;
  /** 图标尺寸：`md` 为面板/链接使用的 28px；`lg` 为 section 标题使用的 32px。 */
  size?: "md" | "lg";
  /** 是否呈现软光晕背景（section 主标题用）。 */
  glow?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ring-1 ring-inset ring-white/30 dark:ring-white/10",
        size === "lg" ? "h-8 w-8" : "h-7 w-7",
        accent,
      )}
    >
      {glow && (
        <span
          aria-hidden="true"
          className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-br from-emerald-400/30 to-sky-400/30 blur-md"
        />
      )}
      <Icon
        className={cn(
          size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5",
        )}
      />
    </div>
  );
}

