export type BookmarkNode = chrome.bookmarks.BookmarkTreeNode;

export interface FlatBookmark {
  id: string;
  parentId?: string;
  title: string;
  url: string;
  path: string;
  dateAdded?: number;
}

export interface FolderStat {
  id: string;
  title: string;
  path: string;
  count: number;
}

export type IssueKind = "invalid" | "duplicate" | "empty-folder" | "broken-url";

export interface CleanIssue {
  id: string;
  kind: IssueKind;
  title: string;
  detail: string;
  bookmark?: FlatBookmark;
  folderId?: string;
  group?: string;
}

export type SearchEngineId =
  | "google"
  | "baidu"
  | "doubao"
  | "kimi"
  | "deepseek"
  | "qwen"
  | "chatgpt"
  | "gemini"
  | "bing"
  | "duckduckgo"
  | "github"
  | "stackoverflow"
  | "mdn"
  | "felo"
  | "metaso"
  | "perplexity";

export type Language = "auto" | "zh" | "en";

/** 主色/强调色（影响 primary、ring 等） */
export type AccentPreset =
  | "linear"
  | "indigo"
  | "blue"
  | "emerald"
  | "rose"
  | "amber"
  | "violet"
  | "cyan"
  | "orange";

/**
 * 设计主题预设（theme preset）。
 *
 * 叠加在 light/dark 模式之上，每个预设是一套协调的
 * 令牌（主色 / 圆角 / 字体 / 表面色）。与 {@link AccentPreset}
 * 并存：选择非 `default` 的 themePreset 时会覆盖 accentPreset
 * 的主色。详见 `src/lib/themePresets.ts`。
 */
export type ThemePreset =
  | "default"
  | "claude"
  | "linear"
  | "apple"
  | "stripe"
  | "ibm"
  | "meta"
  | "vercel"
  | "sunset"
  | "forest";

export interface CustomEngine {
  id: string;
  name: string;
  url: string;
  icon?: string;
}

export type AiChannelCategory =
  | "gpt-subscription"
  | "api-relay"
  | "account"
  | "tool"
  | "decode"
  | "unknown";

export type AiChannelStatus =
  | "pending"
  | "limited"
  | "active"
  | "watching"
  | "dead"
  | "blocked";

export type AiChannelRisk = "low" | "medium" | "high";

/** Price-tier label for sorting; S=超值 A=推荐 B=备选 C=贵 none=未评 */
export type AiChannelPriceTag = "S" | "A" | "B" | "C" | "none";

export interface AiChannelGroup {
  id: string;
  name: string;
  color: string;
  collapsed?: boolean;
  /** Keywords for auto-classification (case-insensitive match against title+url) */
  keywords?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface AiChannelGroupPref {
  color?: string;
  collapsed?: boolean;
}

export interface AiChannelRecord {
  bookmarkId: string;
  title: string;
  url: string;
  folderId?: string;
  folderPath: string;
  sourceRef: string;
  sourceFolderId?: string;
  sourceFolderPath: string;
  category: AiChannelCategory;
  groupId?: string;
  status: AiChannelStatus;
  risk: AiChannelRisk;
  priceTag: AiChannelPriceTag;
  note: string;
  firstSeenAt: number;
  lastSeenAt: number;
  lastCheckedAt?: number;
  present: boolean;
  missingSince?: number;
  /** Timestamp (ms) of the last local annotation change (note/status/priceTag/groupId). Used for sync conflict resolution. */
  annotationUpdatedAt?: number;
}

export interface AiChannelStore {
  recordsById: Record<string, AiChannelRecord>;
  /** Derived from Chrome bookmark subfolders during scan — not persisted directly */
  groups: AiChannelGroup[];
  /** Local-only preferences keyed by Chrome folder ID (color, collapsed) */
  groupPrefs?: Record<string, AiChannelGroupPref>;
  lastScanAt?: number;
}

export interface Settings {
  theme: "system" | "light" | "dark";
  accentPreset: AccentPreset;
  /** 设计主题预设。非 `default` 时会覆盖 accentPreset 的主色。 */
  themePreset: ThemePreset;
  rootFolderId?: string;
  wallpaper?: string;
  searchEngine: string;
  aiProvider: "openai" | "anthropic" | "none";
  aiModel: string;
  aiApiKey: string;
  aiBaseUrl: string;
  cardDensity: "comfy" | "compact";
  language: Language;
  floatingBall: boolean;
  /** 禁用悬浮球的域名列表（域名级禁用） */
  floatingDisabledDomains: string[];
  compareEngines: string[];
  customEngines: CustomEngine[];
  expandedFolders: string[];
  pinnedFolderIds: string[];
  collectionBoardName: string;
  aiChannelSources: string[];
  /** GitHub Personal Access Token（用于 Discover 拉 trending 提高配额） */
  githubToken?: string;
  /** Discover 页默认时段 */
  discoverDefaultRange?: TrendingRange;
  /** Discover 页默认模式（created=新建仓库, hottest=近期活跃仓库） */
  discoverDefaultMode?: TrendingMode;
  /** Discover 页默认语言（空=全部） */
  discoverDefaultLanguage?: string;
  /** Discover 页默认排序口径（auto=按 mode 自适应） */
  discoverDefaultSort?: TrendingSort;
  /** 首页是否显示 GitHub Trending 小组件 */
  showGithubTrendingWidget?: boolean;
  /**
   * @deprecated 旧字段：原「信息差雷达」整体开关。
   * 新版本拆成 `showInfoLiveNews`（NewsNow iframe）和 `showInfoEntries`
   * （热点入口 + 信息差工具）两个独立模块。当新字段未显式设置时，会回退
   * 读取此字段作为默认值，确保历史用户的偏好不丢失。
   */
  showInfoCollections?: boolean;
  /** 首页是否显示「NewsNow 实时热点」iframe 模块 */
  showInfoLiveNews?: boolean;
  /** 首页是否显示「热点入口 + 信息差工具」资源入口卡片 */
  showInfoEntries?: boolean;
  /** 首页是否显示「常去」（Chrome topSites）小组件 */
  showTopSites?: boolean;
}

export type TrendingRange = "daily" | "weekly" | "monthly" | "yearly";

/** 热门模式：created = 时间窗内新建的仓库；hottest = 时间窗内活跃的仓库 */
export type TrendingMode = "created" | "hottest";

/**
 * Trending 列表的排序口径。
 *
 * - `velocity-since-creation`：按 `stars / 仓库年龄` 排序。
 *   适合 `created` 模式（候选都是新建仓库，分母受限）。
 *
 * - `recent-growth`：按"自上次本地快照以来的 ★/天"排序。
 *   真实"近期增长"，但需要至少一次刷新积累快照后才有数据。
 *   首次刷新会回退到 `velocity-since-creation`。
 *
 * - `total-stars`：按总 star 降序。最直观的"现在最热"。
 *
 * - `auto`：根据当前 mode 自动选择。
 *   `created` → `velocity-since-creation`；`hottest` → `total-stars`。
 */
export type TrendingSort =
  | "auto"
  | "velocity-since-creation"
  | "recent-growth"
  | "total-stars";

export interface TrendingRepo {
  id: number;
  fullName: string;
  owner: string;
  name: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  url: string;
  avatar: string;
  topics: string[];
  createdAt: string;
  pushedAt: string;
  /** 平均每天新增 stars（= stars / 自创建以来的天数） */
  starsPerDay: number;
  /**
   * 自上次本地快照以来的"近期 ★/天"。
   *
   * 仅当本地存在该仓库前次快照、且时间间隔 ≥ 30 分钟时填充。
   * 这是 `recent-growth` 排序的主键，也是真实反映"时间窗内增长"
   * 的指标（远比 starsPerDay 准确）。
   */
  recentVelocity?: number;
  /** 距上次本地快照以来的 star 变化量，仅当存在历史快照时存在 */
  starsDelta?: {
    stars: number;
    /** 距上次快照的毫秒数 */
    sinceMs: number;
  };
}

export interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
  /** 客户端消息时间戳（不发给 API） */
  at?: number;
}
