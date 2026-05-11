import { Clock, Flame, Radio, type LucideIcon } from "lucide-react";
import type { Settings } from "@/types";

/**
 * 首页可隐藏组件的中心注册表。
 * 增加新的首页组件时，只需在此追加一项，即可同步获得：
 *  - Settings 页面「首页组件」分组中的开关
 *  - Dashboard 组件 header 的「隐藏」按钮
 *  - 隐藏后的 toast 提示
 */
export type HomeWidgetKey =
  | "showGithubTrendingWidget"
  | "showInfoCollections"
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
    key: "showInfoCollections",
    titleKey: "settings.showInfoCollections",
    hintKey: "settings.showInfoCollectionsHint",
    shortKey: "home.widgetShort.infoCollections",
    Icon: Radio,
    iconAccent:
      "from-emerald-500/25 to-sky-500/25 text-emerald-600 dark:text-emerald-400",
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

export function isHomeWidgetVisible(
  settings: Settings,
  key: HomeWidgetKey,
): boolean {
  return settings[key] ?? true;
}
