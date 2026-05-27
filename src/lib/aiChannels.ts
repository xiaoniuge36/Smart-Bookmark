import type {
  AiChannelCategory,
  AiChannelRecord,
  AiChannelRisk,
  AiChannelStatus,
  AiChannelStore,
  BookmarkNode,
} from "@/types";
import {
  defaultGroups,
  normalizeGroups,
  suggestedGroupId,
} from "@/lib/aiChannelGroups";

const KEY = "smart-bookmark::ai-channels";
const hasChromeStorage = typeof chrome !== "undefined" && !!chrome.storage?.local;

interface FolderEntry {
  node: BookmarkNode;
  path: string;
}

export interface ResolvedAiChannelSource {
  ref: string;
  folder?: BookmarkNode;
  folderPath?: string;
  count: number;
  reason?: "not-found" | "duplicate-source";
}

interface ScannedBookmark {
  bookmark: BookmarkNode;
  folderPath: string;
  sourceRef: string;
  sourceFolderId: string;
  sourceFolderPath: string;
}

export async function loadAiChannelStore(): Promise<AiChannelStore> {
  if (!hasChromeStorage) {
    const raw = localStorage.getItem(KEY);
    return raw ? normalizeStore(JSON.parse(raw)) : emptyStore();
  }
  const { [KEY]: saved } = await chrome.storage.local.get(KEY);
  return normalizeStore(saved);
}

export async function saveAiChannelStore(
  store: AiChannelStore,
): Promise<AiChannelStore> {
  const next = normalizeStore(store);
  if (hasChromeStorage) {
    await chrome.storage.local.set({ [KEY]: next });
  } else {
    localStorage.setItem(KEY, JSON.stringify(next));
  }
  return next;
}

export function scanAiChannels(
  tree: BookmarkNode[],
  sourceRefs: string[],
  prevStore: AiChannelStore,
  now = Date.now(),
): {
  store: AiChannelStore;
  sources: ResolvedAiChannelSource[];
  scannedCount: number;
} {
  const prev = normalizeStore(prevStore);
  const sources = resolveAiChannelSources(tree, sourceRefs);

  const groups = prev.groups;
  const groupIds = new Set(groups.map((g) => g.id));

  const scanned: ScannedBookmark[] = [];
  const seenIds = new Set<string>();
  for (const source of sources.filter((s) => s.folder && s.folderPath)) {
    collectBookmarksFromFolder(source.folder!, source.folderPath!, source.ref, scanned, seenIds);
  }

  const nextRecords: Record<string, AiChannelRecord> = {};
  for (const item of scanned) {
    const id = item.bookmark.id;
    const existing = prev.recordsById[id];
    const guessed = guessAiChannelMeta(item.bookmark.title, item.bookmark.url ?? "");
    nextRecords[id] = {
      bookmarkId: id,
      title: item.bookmark.title || item.bookmark.url || "(untitled)",
      url: item.bookmark.url ?? "",
      folderId: item.bookmark.parentId,
      folderPath: item.folderPath,
      sourceRef: item.sourceRef,
      sourceFolderId: item.sourceFolderId,
      sourceFolderPath: item.sourceFolderPath,
      category: guessed.category,
      groupId:
        existing?.groupId && groupIds.has(existing.groupId)
          ? existing.groupId
          : suggestedGroupId(groupIds, guessed.category),
      status: existing?.status ?? "active",
      risk: existing?.risk ?? guessed.risk,
      priceTag: existing?.priceTag ?? "none",
      note: existing?.note ?? "",
      firstSeenAt: existing?.firstSeenAt ?? now,
      lastSeenAt: now,
      lastCheckedAt: existing?.lastCheckedAt,
      present: true,
      missingSince: undefined,
      annotationUpdatedAt: existing?.annotationUpdatedAt,
    };
  }

  for (const old of Object.values(prev.recordsById)) {
    if (nextRecords[old.bookmarkId]) continue;
    nextRecords[old.bookmarkId] = {
      ...old,
      present: false,
      missingSince: old.missingSince ?? now,
    };
  }

  return {
    store: { recordsById: nextRecords, groups, lastScanAt: now },
    sources,
    scannedCount: scanned.length,
  };
}

export function resolveAiChannelSources(
  tree: BookmarkNode[],
  sourceRefs: string[],
): ResolvedAiChannelSource[] {
  const folders = listFolders(tree);
  const used = new Set<string>();
  return cleanSourceRefs(sourceRefs).map((ref) => {
    const lower = ref.toLowerCase();
    const match =
      folders.find((f) => f.node.id === ref) ??
      folders.find((f) => f.path.toLowerCase() === lower) ??
      folders.find((f) => (f.node.title || "").toLowerCase() === lower);
    if (!match) return { ref, count: 0, reason: "not-found" };
    if (used.has(match.node.id)) {
      return {
        ref,
        folder: match.node,
        folderPath: match.path,
        count: 0,
        reason: "duplicate-source",
      };
    }
    used.add(match.node.id);
    return {
      ref,
      folder: match.node,
      folderPath: match.path,
      count: countBookmarks(match.node),
    };
  });
}

export function cleanSourceRefs(sourceRefs: string[]): string[] {
  return Array.from(
    new Set(
      sourceRefs
        .flatMap((ref) => ref.split(/[\n,]/))
        .map((ref) => ref.trim())
        .filter(Boolean),
    ),
  );
}

export function guessAiChannelMeta(
  title: string,
  url: string,
): { category: AiChannelCategory; risk: AiChannelRisk } {
  const text = `${title} ${url}`.toLowerCase();
  const has = (patterns: RegExp[]) => patterns.some((p) => p.test(text));
  let category: AiChannelCategory = "unknown";
  if (has([/api/, /中转/, /relay/, /base\s*url/, /proxy/, /openai.*兼容/])) {
    category = "api-relay";
  } else if (has([/plus/, /team/, /chatgpt/, /\bgpt\b/, /claude/, /gemini/, /订阅/])) {
    category = "gpt-subscription";
  } else if (has([/账号/, /account/, /购买/, /代充/, /合租/, /共享/, /成品/])) {
    category = "account";
  } else if (has([/解码/, /decode/, /token/, /密钥/, /key/])) {
    category = "decode";
  } else if (has([/工具/, /tool/, /合集/, /导航/, /collection/, /awesome/])) {
    category = "tool";
  }

  let risk: AiChannelRisk = "low";
  if (has([/低价/, /代充/, /共享/, /合租/, /解码/, /破解/, /黑号/, /成品号/])) {
    risk = "high";
  } else if (has([/中转/, /relay/, /proxy/, /购买/, /account/, /账号/])) {
    risk = "medium";
  }
  return { category, risk };
}

export function statusOrder(status: AiChannelStatus): number {
  const order: Record<AiChannelStatus, number> = {
    pending: 0,
    watching: 1,
    active: 2,
    dead: 3,
    blocked: 4,
  };
  return order[status];
}

function collectBookmarksFromFolder(
  folder: BookmarkNode,
  sourcePath: string,
  sourceRef: string,
  out: ScannedBookmark[],
  seenIds: Set<string>,
) {
  const sourceParts = splitPath(sourcePath);
  const walk = (node: BookmarkNode, parts: string[]) => {
    if (node.url) {
      if (!seenIds.has(node.id)) {
        seenIds.add(node.id);
        out.push({
          bookmark: node,
          folderPath: parts.join(" / ") || sourcePath,
          sourceRef,
          sourceFolderId: folder.id,
          sourceFolderPath: sourcePath,
        });
      }
      return;
    }
    const nextParts = node.title ? [...parts, node.title] : parts;
    for (const child of node.children ?? []) walk(child, nextParts);
  };
  for (const child of folder.children ?? []) walk(child, sourceParts);
}

function listFolders(tree: BookmarkNode[]): FolderEntry[] {
  const out: FolderEntry[] = [];
  const walk = (node: BookmarkNode, parts: string[]) => {
    if (node.url) return;
    const nextParts = node.title ? [...parts, node.title] : parts;
    if (node.id !== "0") out.push({ node, path: nextParts.join(" / ") || "(root)" });
    for (const child of node.children ?? []) walk(child, nextParts);
  };
  for (const node of tree) walk(node, []);
  return out;
}

function emptyStore(): AiChannelStore {
  return { recordsById: {}, groups: defaultGroups(Date.now()) };
}

function normalizeStore(raw: unknown): AiChannelStore {
  if (!raw || typeof raw !== "object") return emptyStore();
  const maybe = raw as Partial<AiChannelStore>;
  const groups = normalizeGroups(maybe.groups, maybe.groups === undefined);
  const groupIds = new Set(groups.map((g) => g.id));
  const recordsById = Object.fromEntries(
    Object.entries(maybe.recordsById ?? {}).map(([id, record]) => {
      const next = record as AiChannelRecord;
      return [
        id,
        {
          ...next,
          bookmarkId: next.bookmarkId ?? id,
          groupId:
            next.groupId && groupIds.has(next.groupId)
              ? next.groupId
              : suggestedGroupId(groupIds, next.category),
        },
      ];
    }),
  );
  return { recordsById, groups, lastScanAt: maybe.lastScanAt };
}

function countBookmarks(node: BookmarkNode): number {
  if (node.url) return 1;
  return (node.children ?? []).reduce((sum, child) => sum + countBookmarks(child), 0);
}

function splitPath(path: string): string[] {
  return path.split("/").map((part) => part.trim()).filter(Boolean);
}
