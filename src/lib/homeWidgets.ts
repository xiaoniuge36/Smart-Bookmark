import {
  Clock,
  Flame,
  Newspaper,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { Settings } from "@/types";

/**
 * 首页可隐藏组件的中心注册表。
 * 增加新的首页组件时，只需在此追加一项，即可同步获得：
 *  - Settings 页面「首页组件」分组中的开关
 *  - Dashboard 组件 header 的「隐藏」按钮
 *  - 隐藏后的 toast 提示
 *
 * 注：旧的 `showInfoCollections` 整体开关被拆成
 * `showInfoLiveNews`（NewsNow iframe）和 `showInfoEntries`（资源入口卡片）
 * 两项；旧字段仍保留在 Settings 类型里，并通过 {@link isHomeWidgetVisible}
 * 作为回退默认值，确保历史用户偏好不丢失。
 */
export type HomeWidgetKey =
  | "showGithubTrendingWidget"
  | "showInfoLiveNews"
  | "showInfoEntries"
  | "showTopSites";

export interface HomeWidgetDef {
  /** 对应 Settings 字段名 */
  key: HomeWidgetKey;
  /** 设置项标题 i18n key（长） */
  titleKey: string;
  /** 设置项说明 i18n key */
  hintKey: string;
  /** 首页 toast / 按钮使用的简短名称 i18n key */
  shortKey: string;
  Icon: LucideIcon;
  /**
   * 卡片图标背景色 class，使用 from-* to-* + text-* 三段，
   * 会被外层 `bg-gradient-to-br` 消费。
   */
  iconAccent: string;
}

export const HOME_WIDGETS: HomeWidgetDef[] = [
  {
    key: "showGithubTrendingWidget",
    titleKey: "settings.showGithubTrendingWidget",
    hintKey: "settings.showGithubTrendingWidgetHint",
    shortKey: "home.widgetShort.githubTrending",
    Icon: Flame,
    iconAccent: "from-orange-500/20 to-rose-500/20 text-rose-500",
  },
  {
    key: "showInfoLiveNews",
    titleKey: "settings.showInfoLiveNews",
    hintKey: "settings.showInfoLiveNewsHint",
    shortKey: "home.widgetShort.infoLiveNews",
    Icon: Newspaper,
    iconAccent:
      "from-sky-500/25 to-indigo-500/25 text-sky-600 dark:text-sky-400",
  },
  {
    key: "showInfoEntries",
    titleKey: "settings.showInfoEntries",
    hintKey: "settings.showInfoEntriesHint",
    shortKey: "home.widgetShort.infoEntries",
    Icon: Sparkles,
    iconAccent:
      "from-amber-500/20 to-rose-500/20 text-amber-600 dark:text-amber-300",
  },
  {
    key: "showTopSites",
    titleKey: "settings.showTopSites",
    hintKey: "settings.showTopSitesHint",
    shortKey: "home.widgetShort.topSites",
    Icon: Clock,
    iconAccent: "from-sky-500/20 to-indigo-500/20 text-sky-600 dark:text-sky-400",
  },
];

/**
 * 解析单个首页组件的可见性。
 *
 * - 对于拆分后的 `showInfoLiveNews` / `showInfoEntries`，若用户没有显式设置过新
 *   字段（值为 `undefined`），则回退读取旧的 `showInfoCollections` 总开关，
 *   保持历史用户「关闭整个信息差雷达」的偏好不被新版本误打开。
 * - 其他字段保持原有行为：未设置时默认显示。
 */
export function isHomeWidgetVisible(
  settings: Settings,
  key: HomeWidgetKey,
): boolean {
  if (key === "showInfoLiveNews" || key === "showInfoEntries") {
    const explicit = settings[key];
    if (typeof explicit === "boolean") return explicit;
    return settings.showInfoCollections ?? true;
  }
  return settings[key] ?? true;
}
