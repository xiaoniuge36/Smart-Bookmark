import type { MouseEvent } from "react";
import {
  ArrowUpRight,
  Check,
  ExternalLink,
  Info,
  Newspaper,
  Radio,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn, faviconOf, hostnameOf } from "@/lib/utils";
import { resolveLanguage } from "@/lib/i18n";
import type { Language } from "@/types";
import { useNewsNowAuth } from "@/hooks/useNewsNowAuth";
import HideWidgetButton from "@/components/HideWidgetButton";
import { Tooltip } from "@/components/ui/tooltip";

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

export default function InfoCollections({
  language,
  className,
  onHide,
  hideLabel,
  hideTooltip,
}: {
  language: Language;
  className?: string;
  /** 如果传入，在 header 右侧显示鼠标悬停才出现的「隐藏」按钮 */
  onHide?: () => void;
  hideLabel?: string;
  hideTooltip?: string;
}) {
  const lang = resolveLanguage(language);
  const [trendGroup, toolGroup] = COLLECTIONS;
  const total = 1 + trendGroup.items.length + toolGroup.items.length;

  return (
    <section className={cn("group/widget space-y-3.5", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <SectionIcon
            Icon={Radio}
            accent="from-emerald-500/25 to-sky-500/25 text-emerald-600 dark:text-emerald-400"
            size="lg"
            glow
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[15px] font-semibold tracking-tight">
                {lang === "zh" ? "信息差雷达" : "Signal radar"}
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-300">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                {lang === "zh" ? "实时热点" : "Live trends"}
              </span>
              <span className="rounded-full bg-muted/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-border/60">
                {lang === "zh" ? `${total} 个入口` : `${total} links`}
              </span>
            </div>
            <p className="truncate text-[11.5px] text-muted-foreground">
              {lang === "zh"
                ? "NewsNow 内嵌实时热点，下方备用热榜入口和信息差工具"
                : "NewsNow embedded live, with backup trend feeds and tools below"}
            </p>
          </div>
        </div>
        {onHide && (
          <HideWidgetButton
            variant="inline"
            onHide={onHide}
            label={hideLabel ?? (lang === "zh" ? "隐藏" : "Hide")}
            tooltip={hideTooltip}
          />
        )}
      </div>

      {/*
        单列布局：iframe 占主区全宽 → 触发 NewsNow 内部 3 列响应式；
        下方备用入口/工具链接改为 chip wrap 紧凑横排，作为「补充信息」呈现，
        不再抢主视觉。trendGroup + toolGroup 合并展示，按分组颜色区分。
      */}
      <LiveNewsFrame lang={lang} />

      <div className="rounded-2xl border bg-card/40 p-3 ring-1 ring-black/[0.02] dark:ring-white/[0.04]">
        <div className="mb-2 flex items-center gap-2 px-0.5 text-[11px] font-medium text-muted-foreground">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-md bg-muted/80 ring-1 ring-border/60">
            <Newspaper className="h-2.5 w-2.5" />
          </span>
          {lang === "zh"
            ? "备用热点入口 / 信息差工具"
            : "Backup trends & resource tools"}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {trendGroup.items.map((it) => (
            <ChipLink key={it.url} item={it} lang={lang} accent="trend" />
          ))}
          {toolGroup.items.map((it) => (
            <ChipLink key={it.url} item={it} lang={lang} accent="tool" />
          ))}
        </div>
      </div>
    </section>
  );
}

function LiveNewsFrame({ lang }: { lang: "zh" | "en" }) {
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
 * 紧凑链接药丸：信息差雷达下方备用入口/工具的小卡片
 * - favicon + 标题
 * - hover 时根据分组 accent (trend=sky / tool=amber) 着色边框/背景
 * - hover 弹出 Tooltip 显示完整 tag + 描述 + 域名（避免药丸里塞太多文字）
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
  const accentClass =
    accent === "trend"
      ? "hover:border-sky-500/40 hover:bg-sky-500/[0.06] hover:text-sky-700 dark:hover:text-sky-300"
      : "hover:border-amber-500/40 hover:bg-amber-500/[0.06] hover:text-amber-700 dark:hover:text-amber-300";

  return (
    <Tooltip
      side="bottom"
      align="center"
      content={
        <div className="max-w-[260px] space-y-1 text-left">
          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-foreground">
            <span className="rounded-full bg-muted/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-border/50">
              {item.tag[lang]}
            </span>
            {item.title}
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {item.description[lang]}
          </p>
          <p className="text-[10px] text-muted-foreground/70">
            {hostnameOf(item.url)}
          </p>
        </div>
      }
    >
      <a
        href={item.url}
        target="_blank"
        rel="noreferrer"
        className={cn(
          "group/chip inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-xs font-medium text-foreground/90 shadow-sm ring-1 ring-black/[0.02] transition dark:ring-white/[0.04]",
          accentClass,
        )}
      >
        <img
          src={faviconOf(item.url, 32)}
          alt=""
          className="h-3.5 w-3.5 rounded"
          onError={(e) => (e.currentTarget.style.visibility = "hidden")}
        />
        <span className="truncate">{item.title}</span>
        <ExternalLink className="h-2.5 w-2.5 opacity-0 transition group-hover/chip:opacity-60" />
      </a>
    </Tooltip>
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

