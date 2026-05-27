import type { BookmarkNode } from "@/types";
import { createFolder } from "@/lib/bookmarks";

const hasTabGroups =
  typeof chrome !== "undefined" && !!chrome.tabGroups && !!chrome.tabs;

export interface ActiveTabGroupTab {
  id: number;
  title: string;
  url: string;
  favIconUrl?: string;
}

export interface ActiveTabGroup {
  id: number;
  title: string;
  /** Chrome tab group color name (grey, blue, red, yellow, green, pink, purple, cyan, orange) */
  color: string;
  collapsed: boolean;
  windowId: number;
  tabs: ActiveTabGroupTab[];
}

/** Map Chrome tab-group color → our internal color palette key */
export function tabGroupColorToInternal(color: string): string {
  const map: Record<string, string> = {
    grey: "slate",
    blue: "sky",
    red: "rose",
    yellow: "amber",
    green: "emerald",
    pink: "pink",
    purple: "violet",
    cyan: "cyan",
    orange: "orange",
  };
  return map[color] || "indigo";
}

export async function getActiveTabGroups(): Promise<ActiveTabGroup[]> {
  if (!hasTabGroups) return [];
  try {
    const groups = await chrome.tabGroups.query({});
    const out: ActiveTabGroup[] = [];
    for (const g of groups) {
      const tabs = await chrome.tabs.query({ groupId: g.id });
      out.push({
        id: g.id,
        title: g.title?.trim() || "(untitled group)",
        color: g.color || "grey",
        collapsed: !!g.collapsed,
        windowId: g.windowId,
        tabs: tabs
          .filter((t) => t.id !== undefined)
          .map((t) => ({
            id: t.id as number,
            title: t.title || t.url || "",
            url: t.url || "",
            favIconUrl: t.favIconUrl,
          })),
      });
    }
    return out;
  } catch (err) {
    console.warn("[tab-groups] query failed", err);
    return [];
  }
}

const NON_BOOKMARKABLE_PREFIXES = [
  "chrome://",
  "chrome-extension://",
  "edge://",
  "about:",
  "devtools://",
  "view-source:",
];

function isBookmarkable(url: string): boolean {
  if (!url) return false;
  return !NON_BOOKMARKABLE_PREFIXES.some((p) => url.startsWith(p));
}

export interface SaveResult {
  folder: BookmarkNode | null;
  saved: number;
  skipped: number;
}

/**
 * Save a tab group as a bookmark subfolder under `parentFolderId`.
 * Skips internal pages (chrome://, etc.) which can't be bookmarked.
 */
export async function saveTabGroupAsBookmarkFolder(
  group: ActiveTabGroup,
  parentFolderId: string,
): Promise<SaveResult> {
  const folder = await createFolder(parentFolderId, group.title);
  if (!folder || !chrome.bookmarks) {
    return { folder: null, saved: 0, skipped: group.tabs.length };
  }
  let saved = 0;
  let skipped = 0;
  for (const tab of group.tabs) {
    if (!isBookmarkable(tab.url)) {
      skipped += 1;
      continue;
    }
    try {
      await chrome.bookmarks.create({
        parentId: folder.id,
        title: tab.title || tab.url,
        url: tab.url,
      });
      saved += 1;
    } catch (err) {
      console.warn("[tab-groups] create bookmark failed", err);
      skipped += 1;
    }
  }
  return { folder: folder as BookmarkNode, saved, skipped };
}
