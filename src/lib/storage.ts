import type { Settings } from "@/types";

const KEY = "smart-bookmark::settings";

/** 与 i18n.resolveLanguage 等价的内联实现，避免 storage <-> i18n 循环依赖 */
function resolveLang(lang: Settings["language"]): "zh" | "en" {
  if (lang === "zh" || lang === "en") return lang;
  const nav = (typeof navigator !== "undefined" && navigator.language) || "en";
  return nav.toLowerCase().startsWith("zh") ? "zh" : "en";
}

/** 依语言而定的默认值：仅在用户尚未显式保存该键（首次安装）时生效 */
function localizedDefaults(lang: "zh" | "en"): Pick<
  Settings,
  "collectionBoardName" | "aiChannelSources"
> {
  return lang === "en"
    ? {
        collectionBoardName: "Collection Board",
        aiChannelSources: ["AI", "AI Tool Purchase Links"],
      }
    : {
        collectionBoardName: "收藏工作台",
        aiChannelSources: ["AI", "AI工具购买地址"],
      };
}

function withLocalizedDefaults(saved?: Partial<Settings> | null): Settings {
  const merged: Settings = { ...DEFAULT_SETTINGS, ...(saved ?? {}) };
  const ld = localizedDefaults(resolveLang(merged.language));
  if (saved?.collectionBoardName === undefined) {
    merged.collectionBoardName = ld.collectionBoardName;
  }
  if (saved?.aiChannelSources === undefined) {
    merged.aiChannelSources = ld.aiChannelSources;
  }
  return merged;
}

/** 供设置页「恢复默认」使用：按语言返回默认的 AI 渠道来源文件夹 */
export function defaultAiChannelSources(
  language: Settings["language"],
): string[] {
  return localizedDefaults(resolveLang(language)).aiChannelSources;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  accentPreset: "linear",
  themePreset: "default",
  rootFolderId: undefined,
  wallpaper: undefined,
  searchEngine: "google",
  aiProvider: "none",
  aiModel: "gpt-4o-mini",
  aiApiKey: "",
  aiBaseUrl: "",
  cardDensity: "comfy",
  cardLayout: "vertical",
  language: "auto",
  floatingBall: false,
  floatingDisabledDomains: [],
  compareEngines: ["google", "bing", "duckduckgo"],
  customEngines: [],
  expandedFolders: [],
  pinnedFolderIds: [],
  collectionBoardName: "收藏工作台",
  aiChannelSources: ["AI", "AI工具购买地址"],
  githubToken: "",
  discoverDefaultRange: "weekly",
  discoverDefaultMode: "created",
  discoverDefaultLanguage: "",
  showGithubTrendingWidget: true,
  showInfoCollections: true,
  showInfoLiveNews: true,
  showInfoEntries: true,
  showTopSites: true,
};

const hasChromeStorage = typeof chrome !== "undefined" && !!chrome.storage?.local;

export async function getSettings(): Promise<Settings> {
  if (!hasChromeStorage) {
    const raw = localStorage.getItem(KEY);
    return withLocalizedDefaults(raw ? JSON.parse(raw) : null);
  }
  const { [KEY]: saved } = await chrome.storage.local.get(KEY);
  return withLocalizedDefaults(saved);
}

export async function setSettings(next: Partial<Settings>): Promise<Settings> {
  const prev = await getSettings();
  const merged: Settings = { ...prev, ...next };
  if (hasChromeStorage) {
    await chrome.storage.local.set({ [KEY]: merged });
  } else {
    localStorage.setItem(KEY, JSON.stringify(merged));
  }
  return merged;
}

export function onSettingsChange(handler: (s: Settings) => void): () => void {
  if (!hasChromeStorage) return () => {};
  const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area === "local" && changes[KEY]) {
      handler({ ...DEFAULT_SETTINGS, ...(changes[KEY].newValue ?? {}) });
    }
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
