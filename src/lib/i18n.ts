import { useEffect, useState } from "react";
import type { Language } from "@/types";
import { getSettings, onSettingsChange } from "@/lib/storage";

type Entry = string | ((...args: string[]) => string);
type Dict = Record<string, Entry>;

const zh: Dict = {
  "app.title": "Smart Bookmark",
  "app.tagline": "本地优先 · 致敬 LazyCat & TabMark",

  "tabs.dashboard": "看板",
  "tabs.cleaner": "清理",
  "tabs.ai": "AI",
  "tabs.compare": "对比搜索",
  "tabs.backup": "备份",
  "tabs.settings": "设置",

  "common.search": "搜索",
  "common.cancel": "取消",
  "common.confirm": "确定",
  "common.close": "关闭",
  "common.copy": "复制",
  "common.import": "导入",
  "common.export": "导出",
  "common.download": "下载",
  "common.open": "打开",
  "common.save": "保存",
  "common.delete": "删除",
  "common.edit": "编辑",
  "common.reset": "重置",
  "common.all": "全部",
  "common.loading": "加载中…",
  "common.done": "完成",
  "common.copied": "已复制",

  "dash.folders": "书签文件夹",
  "dash.all200": "全部（前 200）",
  "dash.searchPlaceholder": "搜索书签，或按回车用搜索引擎查询…",
  "dash.empty": "无匹配书签。按回车可直接用搜索引擎查询。",
  "dash.dropHint": "松开鼠标放置到这里",
  "dash.dragHint": "按住卡片拖拽可自定义顺序",

  "cleaner.profile": "书签画像",
  "cleaner.total": "书签总数",
  "cleaner.folders": "文件夹数",
  "cleaner.added30": "近 30 天新增",
  "cleaner.topDomain": "最常收藏域名",
  "cleaner.topDomains": "Top 10 域名",
  "cleaner.scan": "一键扫描",
  "cleaner.start": "开始扫描",
  "cleaner.stop": "停止",
  "cleaner.checkInvalid": "检测失效链接（发起网络请求，较慢）",
  "cleaner.phase": "阶段",
  "cleaner.invalid": "失效链接",
  "cleaner.duplicate": "重复书签",
  "cleaner.emptyFolder": "空文件夹",
  "cleaner.brokenUrl": "异常 URL",
  "cleaner.toggleAll": "全选 / 反选",
  "cleaner.selectedOf": (n: string, t: string) => `已选中 ${n} / ${t}`,
  "cleaner.cleanSelected": "清理选中",
  "cleaner.noResult": "还没有扫描结果。点击「开始扫描」开始体检。",
  "cleaner.confirmClean": (n: string) => `确定要清理 ${n} 条吗？此操作不可撤销。`,

  "ai.title": "书签代理",
  "ai.userLabel": "你",
  "ai.assistantLabel": "代理",
  "ai.disabled": "未启用",
  "ai.emptyHeading": "你的书签智能代理",
  "ai.emptyDesc":
    "我能基于你本机的书签做整理、去重、推荐与搜索。点击下面的例子开始，或直接说你想做的事。",
  "ai.placeholder": "问问你的书签…例如「按主题帮我分类」",
  "ai.send": "发送",
  "ai.needKey": "请先在『设置』里选择 AI Provider 并填入 API Key。",
  "ai.suggestOrganize": "按主题帮我整理书签",
  "ai.suggestFindDups": "找出可能重复的书签",
  "ai.suggestRecommend": "根据我的书签推荐相关网站",
  "ai.suggestSummary": "总结我最常收藏的领域",

  "compare.title": "对比搜索",
  "compare.placeholder": "输入查询词，同时在多个搜索引擎中打开…",
  "compare.openAll": "在全部引擎打开",
  "compare.openInNewTab": "在新标签页打开",
  "compare.blocked": "此搜索引擎不允许被嵌入 iframe。",
  "compare.pick": "选择要并排展示的搜索引擎",

  "backup.title": "备份与导出",
  "backup.exportJson": "导出 JSON",
  "backup.exportHtml": "导出为 Netscape HTML",
  "backup.importJson": "导入 JSON",
  "backup.importHtml": "导入 Netscape HTML",
  "backup.importTo": "导入到文件夹",
  "backup.importNotice":
    "导入仅新增，不会覆盖或删除现有书签。重复 URL 会自动跳过。",
  "backup.exported": (n: string) => `已导出 ${n} 条书签`,
  "backup.imported": (n: string, s: string) =>
    `已导入 ${n} 条书签，跳过 ${s} 条重复`,
  "backup.pickFile": "选择文件",

  "settings.appearance": "外观",
  "settings.theme": "主题",
  "settings.themeAuto": "跟随系统",
  "settings.themeLight": "浅色",
  "settings.themeDark": "深色",
  "settings.accent": "主题色",
  "settings.accentLinear": "Linear 紫",
  "settings.accentIndigo": "靛青",
  "settings.accentBlue": "天蓝",
  "settings.accentEmerald": "翠绿",
  "settings.accentRose": "玫红",
  "settings.accentAmber": "琥珀",
  "settings.accentViolet": "紫罗兰",
  "settings.accentCyan": "青蓝",
  "settings.accentOrange": "暖橙",
  "settings.density": "卡片密度",
  "settings.densityComfy": "舒适",
  "settings.densityCompact": "紧凑",
  "settings.wallpaper": "壁纸 URL",
  "settings.wallpaperPh": "https://…（留空使用纯色背景）",
  "settings.search": "搜索",
  "settings.defaultEngine": "默认搜索引擎",
  "settings.ai": "AI 助手",
  "settings.provider": "Provider",
  "settings.providerNone": "未启用",
  "settings.model": "Model",
  "settings.apiKey": "API Key",
  "settings.apiKeyPh": "sk-…（仅存于本地 chrome.storage）",
  "settings.apiKeyNotice":
    "API Key 仅保存在浏览器本地存储，不会上传任何服务端。若你使用受限网络，可能需要自备代理。",
  "settings.extras": "扩展功能",
  "settings.language": "语言",
  "settings.floatingBall": "网页内悬浮标签",
  "settings.floatingBallHint":
    "在任意网页右侧边缘显示一个贴边标签，点击可呼出搜索和命令。",
  "settings.floatingDisabledDomains": "已禁用的网站",
  "settings.floatingDisabledDomainsEmpty": "暂无被禁用的网站",
  "settings.floatingDisabledDomainsRemove": "重新启用",
  "settings.compareEngines": "对比搜索引擎",

  "qr.title": "二维码",
  "qr.scan": "扫码访问",
  "qr.copyUrl": "复制链接",
  "qr.download": "下载 PNG",

  "float.search": "搜索书签",
  "float.openSidePanel": "打开侧边栏",
  "float.openCleaner": "清理中心",
  "float.copyUrl": "复制当前 URL",
  "float.qr": "生成二维码",
  "float.hide": "隐藏悬浮球",

  "side.title": "Smart Bookmark",
  "side.placeholder": "搜索书签…",
  "side.empty": "没有匹配的书签",

  "popup.dashboard": "打开书签看板",
  "popup.cleaner": "书签清理中心",
  "popup.ai": "AI 助手",
  "popup.sidepanel": "打开侧边栏",
  "popup.compare": "对比搜索",
  "popup.backup": "备份 / 导出",
  "popup.shortcut": "快捷键：Alt+B 打开侧边栏，Alt+Shift+C 打开清理中心",
};

const en: Dict = {
  "app.title": "Smart Bookmark",
  "app.tagline": "Local-first · Inspired by LazyCat & TabMark",

  "tabs.dashboard": "Dashboard",
  "tabs.cleaner": "Cleaner",
  "tabs.ai": "AI",
  "tabs.compare": "Compare",
  "tabs.backup": "Backup",
  "tabs.settings": "Settings",

  "common.search": "Search",
  "common.cancel": "Cancel",
  "common.confirm": "OK",
  "common.close": "Close",
  "common.copy": "Copy",
  "common.import": "Import",
  "common.export": "Export",
  "common.download": "Download",
  "common.open": "Open",
  "common.save": "Save",
  "common.delete": "Delete",
  "common.edit": "Edit",
  "common.reset": "Reset",
  "common.all": "All",
  "common.loading": "Loading…",
  "common.done": "Done",
  "common.copied": "Copied",

  "dash.folders": "Bookmark folders",
  "dash.all200": "All (first 200)",
  "dash.searchPlaceholder":
    "Search bookmarks, or press Enter to search the web…",
  "dash.empty":
    "No matching bookmarks. Press Enter to search with your engine.",
  "dash.dropHint": "Drop here",
  "dash.dragHint": "Hold a card and drag to reorder",

  "cleaner.profile": "Profile",
  "cleaner.total": "Bookmarks",
  "cleaner.folders": "Folders",
  "cleaner.added30": "Added last 30 days",
  "cleaner.topDomain": "Most-saved domain",
  "cleaner.topDomains": "Top 10 domains",
  "cleaner.scan": "Scan",
  "cleaner.start": "Start scan",
  "cleaner.stop": "Stop",
  "cleaner.checkInvalid": "Detect dead links (slow, sends HTTP requests)",
  "cleaner.phase": "Phase",
  "cleaner.invalid": "Dead links",
  "cleaner.duplicate": "Duplicates",
  "cleaner.emptyFolder": "Empty folders",
  "cleaner.brokenUrl": "Broken URLs",
  "cleaner.toggleAll": "Select / deselect all",
  "cleaner.selectedOf": (n: string, t: string) => `Selected ${n} / ${t}`,
  "cleaner.cleanSelected": "Clean selected",
  "cleaner.noResult": "No results yet. Click \"Start scan\" to begin.",
  "cleaner.confirmClean": (n: string) =>
    `Are you sure to remove ${n} bookmarks? This cannot be undone.`,

  "ai.title": "Bookmark Agent",
  "ai.userLabel": "You",
  "ai.assistantLabel": "Agent",
  "ai.disabled": "Disabled",
  "ai.emptyHeading": "Your bookmark-aware agent",
  "ai.emptyDesc":
    "I work on top of your local bookmarks — organizing, deduping, recommending, and searching. Tap a suggestion below or just tell me what you need.",
  "ai.placeholder": "Ask about your bookmarks… e.g. \"Group them by topic\"",
  "ai.send": "Send",
  "ai.needKey": "Pick an AI provider and set the API Key in Settings first.",
  "ai.suggestOrganize": "Group my bookmarks by topic",
  "ai.suggestFindDups": "Find potential duplicate bookmarks",
  "ai.suggestRecommend": "Recommend related sites based on my bookmarks",
  "ai.suggestSummary": "Summarize the domains I save most",

  "compare.title": "Compare search",
  "compare.placeholder":
    "Enter a query to open it across multiple search engines…",
  "compare.openAll": "Open in all engines",
  "compare.openInNewTab": "Open in new tab",
  "compare.blocked": "This search engine cannot be embedded in an iframe.",
  "compare.pick": "Pick engines to show side by side",

  "backup.title": "Backup & export",
  "backup.exportJson": "Export JSON",
  "backup.exportHtml": "Export Netscape HTML",
  "backup.importJson": "Import JSON",
  "backup.importHtml": "Import Netscape HTML",
  "backup.importTo": "Import into folder",
  "backup.importNotice":
    "Import only appends; it never overwrites. Duplicate URLs are skipped.",
  "backup.exported": (n: string) => `Exported ${n} bookmarks`,
  "backup.imported": (n: string, s: string) =>
    `Imported ${n} bookmarks, skipped ${s} duplicates`,
  "backup.pickFile": "Pick file",

  "settings.appearance": "Appearance",
  "settings.theme": "Theme",
  "settings.themeAuto": "Auto",
  "settings.themeLight": "Light",
  "settings.themeDark": "Dark",
  "settings.accent": "Accent color",
  "settings.accentLinear": "Linear",
  "settings.accentIndigo": "Indigo",
  "settings.accentBlue": "Blue",
  "settings.accentEmerald": "Emerald",
  "settings.accentRose": "Rose",
  "settings.accentAmber": "Amber",
  "settings.accentViolet": "Violet",
  "settings.accentCyan": "Cyan",
  "settings.accentOrange": "Orange",
  "settings.density": "Card density",
  "settings.densityComfy": "Comfy",
  "settings.densityCompact": "Compact",
  "settings.wallpaper": "Wallpaper URL",
  "settings.wallpaperPh": "https://… (empty = solid color)",
  "settings.search": "Search",
  "settings.defaultEngine": "Default engine",
  "settings.ai": "AI assistant",
  "settings.provider": "Provider",
  "settings.providerNone": "Disabled",
  "settings.model": "Model",
  "settings.apiKey": "API Key",
  "settings.apiKeyPh": "sk-… (stored only in local chrome.storage)",
  "settings.apiKeyNotice":
    "The API key lives only in local browser storage and is never uploaded to any server.",
  "settings.extras": "Extras",
  "settings.language": "Language",
  "settings.floatingBall": "In-page edge tab",
  "settings.floatingBallHint":
    "Show a slim tab pinned to the right edge of any web page for quick search and commands.",
  "settings.floatingDisabledDomains": "Disabled sites",
  "settings.floatingDisabledDomainsEmpty": "No sites are disabled",
  "settings.floatingDisabledDomainsRemove": "Re-enable",
  "settings.compareEngines": "Compare-search engines",

  "qr.title": "QR code",
  "qr.scan": "Scan to visit",
  "qr.copyUrl": "Copy URL",
  "qr.download": "Download PNG",

  "float.search": "Search bookmarks",
  "float.openSidePanel": "Open side panel",
  "float.openCleaner": "Cleaner",
  "float.copyUrl": "Copy current URL",
  "float.qr": "Generate QR code",
  "float.hide": "Hide floating ball",

  "side.title": "Smart Bookmark",
  "side.placeholder": "Search bookmarks…",
  "side.empty": "No matching bookmarks",

  "popup.dashboard": "Open dashboard",
  "popup.cleaner": "Bookmark cleaner",
  "popup.ai": "AI assistant",
  "popup.sidepanel": "Open side panel",
  "popup.compare": "Compare search",
  "popup.backup": "Backup / export",
  "popup.shortcut":
    "Shortcuts: Alt+B open side panel, Alt+Shift+C open cleaner",
};

const DICTS: Record<"zh" | "en", Dict> = { zh, en };

export function resolveLanguage(lang: Language): "zh" | "en" {
  if (lang === "zh" || lang === "en") return lang;
  const nav = (typeof navigator !== "undefined" && navigator.language) || "en";
  return nav.toLowerCase().startsWith("zh") ? "zh" : "en";
}

export function t(key: string, ...args: string[]): string {
  const lang = currentLang;
  const dict = DICTS[lang] ?? DICTS.en;
  const val = dict[key] ?? DICTS.en[key] ?? key;
  if (typeof val === "function") {
    return val(...args);
  }
  return val;
}

let currentLang: "zh" | "en" = "zh";
const listeners = new Set<(l: "zh" | "en") => void>();

export async function initI18n() {
  const s = await getSettings();
  currentLang = resolveLanguage(s.language);
  document.documentElement.lang = currentLang === "zh" ? "zh-CN" : "en";
  onSettingsChange((next) => {
    const nl = resolveLanguage(next.language);
    if (nl !== currentLang) {
      currentLang = nl;
      document.documentElement.lang = currentLang === "zh" ? "zh-CN" : "en";
      listeners.forEach((l) => l(currentLang));
    }
  });
}

export function useT() {
  const [, setLang] = useState(currentLang);
  useEffect(() => {
    const fn = (l: "zh" | "en") => setLang(l);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return t;
}
