import type { Settings } from "@/types";

const KEY = "smart-bookmark::settings";

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
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  }
  const { [KEY]: saved } = await chrome.storage.local.get(KEY);
  return { ...DEFAULT_SETTINGS, ...(saved ?? {}) };
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
