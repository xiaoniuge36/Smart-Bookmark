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
  "tabs.discover": "发现",

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
  "dash.searchPlaceholder": "搜索书签或网络…",
  "dash.empty": "无匹配书签。按回车可直接用搜索引擎查询。",
  "dash.dropHint": "松开鼠标放置到这里",
  "dash.dragHint": "按住卡片拖拽可自定义顺序",
  "dash.kbdHint": "Ctrl + Enter 可在全部引擎中打开",
  "dash.searchClear": "清空",
  "dash.matchCount": (n: string) =>
    `匹配 ${n} 个书签 · Enter 走搜索引擎`,
  "dash.matchNone": "无书签匹配 · Enter 走搜索引擎",

  "discover.title": "GitHub 热门",
  "discover.subtitle":
    "基于 GitHub Search：选择「新创建」或「最热门」模式，再按日 / 周 / 月 / 年 设定时间窗口，按创建以来 star 均速排序。",
  "discover.mode.created": "新创建",
  "discover.mode.hottest": "最热门",
  "discover.mode.created.hint": "时间窗内新建的仓库，按创建以来 star 均速排序",
  "discover.mode.hottest.hint": "时间窗内活跃的仓库，按创建以来 star 均速排序",
  "discover.widget.hint": (range: string, days: string) =>
    `已选「${range}」：近 ${days} 天时间窗。`,
  "discover.range.daily": "今日",
  "discover.range.weekly": "本周",
  "discover.range.monthly": "本月",
  "discover.range.yearly": "本年",
  "discover.language.all": "全部语言",
  "discover.refresh": "刷新",
  "discover.loading": "正在拉取热门项目…",
  "discover.empty": "暂无结果，换个条件或稍后再试。",
  "discover.error": "拉取失败",
  "discover.stars": (n: string) => `${n} Stars`,
  "discover.forks": (n: string) => `${n} Forks`,
  "discover.addBookmark": "加到书签",
  "discover.addedBookmark": "已加到书签",
  "discover.copy": "复制链接",
  "discover.open": "打开",
  "discover.more": "查看全部",
  "discover.widget.title": "GitHub 热门",
  "discover.widget.viewAll": "查看全部",
  "discover.injectAi": "注入当前 trending",
  "discover.injectedAi": (n: string) => `已把 ${n} 条热门项目注入 AI 会话。`,
  "discover.updated": (t: string) => `更新于 ${t}`,
  "discover.needToken": "未配置 GitHub Token，未认证请求 60 次/小时。前往设置填入。",
  "discover.cacheHit": "来自缓存",
  "discover.rank.hint": (n: string) => `当前排序第 ${n} 位`,
  "discover.velocity": (n: string) => `均 ${n} ★/天`,
  "discover.velocity.hint":
    "创建以来平均每天获得的 stars，不是所选时间窗内的真实新增。",
  "discover.recentVelocity": (n: string) => `近期 ${n} ★/天`,
  "discover.recentVelocity.hint":
    "基于本地两次刷新之间的真实增量计算的近期速度。",
  "discover.recentVelocity.pending":
    "再刷新一次后才能拿到真实的近期增长速度，当前显示的是创建以来均速。",
  "discover.totalStars.hint": "按总 star 排序：直观的「现在大家用得最多」",
  "discover.gained.hint": (n: string, period: string) =>
    `距上次刷新 ${period}，新增 ${n} stars。`,
  "discover.sort.title": "排序",
  "discover.sort.auto": "自动",
  "discover.sort.auto.hint":
    "新建模式 → 创建以来均速；最热门模式 → 总 star",
  "discover.sort.velocity-since-creation": "创建以来",
  "discover.sort.velocity-since-creation.hint":
    "按 stars / 仓库年龄 排序。适合「新建」模式。",
  "discover.sort.recent-growth": "近期增长",
  "discover.sort.recent-growth.hint":
    "按本地两次刷新之间的真实 ★/天 排序。需先积累快照。",
  "discover.sort.total-stars": "总 star",
  "discover.sort.total-stars.hint": "按总 star 数降序。最直观的「现在最热」。",
  "discover.sort.recentMissing":
    "本地还没有该排序所需的快照，刷新一次后下次再来此排序就生效了。",
  "settings.discover": "发现 / GitHub 热门",
  "settings.githubToken": "GitHub Personal Access Token",
  "settings.githubTokenHint":
    "可选。只需 public_repo 权限即可。填写后 API 限额从 60/h 提升到 5000/h。",
  "settings.discoverDefaults": "默认时段 / 语言",
  "settings.discoverSort": "默认排序",
  "settings.discoverSortHint":
    "「自动」会根据当前模式选合适口径：新建 → 创建以来均速；最热门 → 总 star。「近期增长」需要至少积累一次刷新快照。",
  "settings.homeWidgets": "首页组件",
  "settings.showGithubTrendingWidget": "首页显示 GitHub 热门",
  "settings.showGithubTrendingWidgetHint":
    "关闭后首页不再显示 GitHub 热门；发现页仍可正常使用。",
  "settings.showInfoCollections": "首页显示信息差雷达",
  "settings.showInfoCollectionsHint":
    "关闭后首页不再显示 NewsNow 内嵌热点和资源入口面板。",
  "settings.showInfoLiveNews": "首页显示 NewsNow 实时热点",
  "settings.showInfoLiveNewsHint":
    "关闭后首页不再显示上方的 NewsNow 内嵌实时热点 iframe，下方资源入口卡片不受影响。",
  "settings.showInfoEntries": "首页显示热点资源入口",
  "settings.showInfoEntriesHint":
    "关闭后首页不再显示下方「热点入口 + 信息差工具」资源链接卡片，NewsNow iframe 不受影响。",
  "settings.showTopSites": "首页显示「常去」",
  "settings.showTopSitesHint":
    "关闭后首页不再显示由 Chrome 自动统计的常访问站点小组件。",
  "settings.homeWidgetsHint":
    "勾选要在首页显示的组件。首页组件 header 也可鼠标悬停后点「隐藏」快捷关闭。",
  "home.widgetShort.githubTrending": "GitHub 热门",
  "home.widgetShort.infoCollections": "信息差雷达",
  "home.widgetShort.infoLiveNews": "实时热点",
  "home.widgetShort.infoEntries": "热点资源入口",
  "home.widgetShort.topSites": "常去",
  "home.hideWidget": "隐藏",
  "home.hideWidgetTooltip": (name: string) =>
    `隐藏「${name}」组件（可在设置 → 首页组件中恢复）`,
  "home.widgetHidden": (name: string) =>
    `已隐藏「${name}」，可在设置 → 首页组件中恢复`,
  "settings.githubTokenSave": "保存",
  "settings.githubTokenClear": "清空",
  "settings.githubTokenCreate": "创建 Token",

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

  "common.language": "语言",
  "common.languageAuto": "跟随系统",
  "common.languageZh": "中文",
  "common.languageEn": "English",
  "common.languagePicker": "选择界面语言",
  "common.languageHint": "「跟随系统」会根据浏览器语言自动选择中文或英文。",

  "settings.appearance": "外观",
  "settings.theme": "主题",
  "settings.themeAuto": "跟随系统",
  "settings.themeLight": "浅色",
  "settings.themeDark": "深色",
  "settings.themePreset": "设计主题",
  "settings.themePresetHint":
    "每个主题是一套协调的配色、圆角与字体。切换后整站（看板/侧栏/弹窗）统一生效。",
  "settings.accentDisabledByPreset":
    "当前已启用设计主题，主题色由主题控制；切回「默认」主题后生效。",
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
  "tabs.discover": "Discover",

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
  "dash.searchPlaceholder": "Search bookmarks or the web…",
  "dash.empty":
    "No matching bookmarks. Press Enter to search with your engine.",
  "dash.dropHint": "Drop here",
  "dash.dragHint": "Hold a card and drag to reorder",
  "dash.kbdHint": "Ctrl + Enter to open across all engines",
  "dash.searchClear": "Clear",
  "dash.matchCount": (n: string) =>
    `${n} bookmark matches · Enter to search the web`,
  "dash.matchNone": "No bookmark matches · Enter to search the web",

  "discover.title": "GitHub Trending",
  "discover.subtitle":
    "Uses GitHub Search: choose \"Newly Created\" or \"Hottest\" mode, pick a time window, then sort by average stars per day since creation.",
  "discover.mode.created": "Newly Created",
  "discover.mode.hottest": "Hottest",
  "discover.mode.created.hint": "Repos created within the time window, sorted by average stars per day since creation",
  "discover.mode.hottest.hint": "Active repos within the time window, sorted by average stars per day since creation",
  "discover.widget.hint": (range: string, days: string) =>
    `「${range}」: last ${days} days window.`,
  "discover.range.daily": "Today",
  "discover.range.weekly": "This week",
  "discover.range.monthly": "This month",
  "discover.range.yearly": "This year",
  "discover.language.all": "All languages",
  "discover.refresh": "Refresh",
  "discover.loading": "Loading trending repos…",
  "discover.empty": "No results. Try different filters.",
  "discover.error": "Failed to load",
  "discover.stars": (n: string) => `${n} Stars`,
  "discover.forks": (n: string) => `${n} Forks`,
  "discover.addBookmark": "Bookmark",
  "discover.addedBookmark": "Bookmarked",
  "discover.copy": "Copy link",
  "discover.open": "Open",
  "discover.more": "View all",
  "discover.widget.title": "GitHub Trending",
  "discover.widget.viewAll": "View all",
  "discover.injectAi": "Inject current trending",
  "discover.injectedAi": (n: string) =>
    `Injected ${n} trending repos into AI chat.`,
  "discover.updated": (t: string) => `Updated ${t}`,
  "discover.needToken":
    "No GitHub Token set. Unauthenticated: 60 req/h. Open Settings to add one.",
  "discover.cacheHit": "From cache",
  "discover.rank.hint": (n: string) => `Current rank #${n}`,
  "discover.velocity": (n: string) => `avg ${n} ★/day`,
  "discover.velocity.hint":
    "Average stars gained per day since the repo was created, not the actual gain inside the selected window.",
  "discover.recentVelocity": (n: string) => `recent ${n} ★/day`,
  "discover.recentVelocity.hint":
    "Real growth velocity computed from the delta between two local refreshes.",
  "discover.recentVelocity.pending":
    "Refresh once more to capture real recent growth — falling back to all-time average for now.",
  "discover.totalStars.hint": "Sorted by total stars: the simplest \"what's everyone using\".",
  "discover.gained.hint": (n: string, period: string) =>
    `+${n} stars since last refresh (${period} ago).`,
  "discover.sort.title": "Sort",
  "discover.sort.auto": "Auto",
  "discover.sort.auto.hint":
    "Newly Created → since creation; Hottest → total stars",
  "discover.sort.velocity-since-creation": "Since creation",
  "discover.sort.velocity-since-creation.hint":
    "Sort by stars / repo age. Best for \"Newly Created\" mode.",
  "discover.sort.recent-growth": "Recent growth",
  "discover.sort.recent-growth.hint":
    "Sort by ★/day between the last two local refreshes. Needs snapshots first.",
  "discover.sort.total-stars": "Total stars",
  "discover.sort.total-stars.hint":
    "Sort by total star count desc — the simplest \"hot right now\".",
  "discover.sort.recentMissing":
    "No snapshots locally yet — refresh once and this sort will activate next time.",
  "settings.discover": "Discover / GitHub Trending",
  "settings.githubToken": "GitHub Personal Access Token",
  "settings.githubTokenHint":
    "Optional. Needs only public_repo scope. Raises API quota from 60/h to 5000/h.",
  "settings.discoverDefaults": "Default range / language",
  "settings.discoverSort": "Default sort",
  "settings.discoverSortHint":
    "\"Auto\" picks for you: Newly Created → since-creation; Hottest → total stars. \"Recent growth\" needs at least one refresh to gather snapshots.",
  "settings.homeWidgets": "Home widgets",
  "settings.showGithubTrendingWidget": "Show GitHub Trending on home",
  "settings.showGithubTrendingWidgetHint":
    "When off, the dashboard hides GitHub Trending. The Discover page still works.",
  "settings.showInfoCollections": "Show signal radar on home",
  "settings.showInfoCollectionsHint":
    "When off, the dashboard hides the embedded NewsNow live feed and resource link panels.",
  "settings.showInfoLiveNews": "Show NewsNow live feed on home",
  "settings.showInfoLiveNewsHint":
    "When off, the embedded NewsNow live feed iframe is hidden on the dashboard; the resource entries card below stays visible.",
  "settings.showInfoEntries": "Show resource entries on home",
  "settings.showInfoEntriesHint":
    "When off, the \"Trend sources + Resource tools\" card is hidden on the dashboard; the NewsNow iframe stays visible.",
  "settings.showTopSites": "Show \"Frequent\" on home",
  "settings.showTopSitesHint":
    "When off, the dashboard hides the Chrome top sites widget.",
  "settings.homeWidgetsHint":
    "Pick the widgets to show on the dashboard. You can also hover any widget header on home and click \"Hide\" to remove it from there.",
  "home.widgetShort.githubTrending": "GitHub Trending",
  "home.widgetShort.infoCollections": "Signal radar",
  "home.widgetShort.infoLiveNews": "Live feed",
  "home.widgetShort.infoEntries": "Resource entries",
  "home.widgetShort.topSites": "Frequent",
  "home.hideWidget": "Hide",
  "home.hideWidgetTooltip": (name: string) =>
    `Hide \"${name}\" (restore in Settings → Home widgets)`,
  "home.widgetHidden": (name: string) =>
    `Hid \"${name}\". Restore in Settings → Home widgets.`,
  "settings.githubTokenSave": "Save",
  "settings.githubTokenClear": "Clear",
  "settings.githubTokenCreate": "Create token",

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

  "common.language": "Language",
  "common.languageAuto": "Auto",
  "common.languageZh": "中文",
  "common.languageEn": "English",
  "common.languagePicker": "Pick UI language",
  "common.languageHint":
    "\"Auto\" follows your browser language and picks Chinese or English.",

  "settings.appearance": "Appearance",
  "settings.theme": "Theme",
  "settings.themeAuto": "Auto",
  "settings.themeLight": "Light",
  "settings.themeDark": "Dark",
  "settings.themePreset": "Design theme",
  "settings.themePresetHint":
    "Each theme is a coordinated palette, radius and typography set. Applies across dashboard, side panel and popup.",
  "settings.accentDisabledByPreset":
    "A design theme is active — the primary color is managed by the theme. Switch to Default to use accent presets.",
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
