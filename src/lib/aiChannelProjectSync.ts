import type {
  AiChannelCategory,
  AiChannelGroup,
  AiChannelPriceTag,
  AiChannelRecord,
  AiChannelRisk,
  AiChannelStatus,
  AiChannelStore,
} from "../types";
import { normalizeUrl } from "./utils";

export const PROJECT_SYNC_FILE_VERSION = 1;
export const PROJECT_SYNC_SOURCE_REF = "project-sync";
export const PROJECT_SYNC_RUNTIME_PATH = "channel-sync/ai-channels.json";
export const PROJECT_SYNC_DOWNLOAD_NAME = "ai-channels.json";
export type ProjectSyncSaveResult = "saved" | "downloaded" | "cancelled";

export interface ProjectSyncRecord {
  bookmarkId?: string;
  title: string;
  url: string;
  folderPath?: string;
  sourceRef?: string;
  sourceFolderPath?: string;
  category?: AiChannelCategory;
  groupId?: string;
  secondaryGroupIds?: string[];
  status?: AiChannelStatus;
  risk?: AiChannelRisk;
  priceTag?: AiChannelPriceTag;
  note?: string;
  firstSeenAt?: number;
  lastSeenAt?: number;
  lastCheckedAt?: number;
  present?: boolean;
  missingSince?: number;
  annotationUpdatedAt?: number;
}

export interface ProjectSyncData {
  app: "smart-bookmark";
  kind: "ai-channel-project-sync";
  version: typeof PROJECT_SYNC_FILE_VERSION;
  exportedAt: number;
  groups: AiChannelGroup[];
  records: ProjectSyncRecord[];
}

export function buildProjectSyncData(
  store: AiChannelStore,
  options: { exportedAt?: number } = {},
): ProjectSyncData {
  const records = Object.values(store.recordsById)
    .filter((record) => record.present && record.url.trim())
    .sort((a, b) => a.title.localeCompare(b.title, "zh-CN") || a.url.localeCompare(b.url))
    .map(toProjectRecord);
  return {
    app: "smart-bookmark",
    kind: "ai-channel-project-sync",
    version: PROJECT_SYNC_FILE_VERSION,
    exportedAt: options.exportedAt ?? Date.now(),
    groups: store.groups,
    records,
  };
}

export function applyProjectSyncData(
  localStore: AiChannelStore,
  data: ProjectSyncData,
  now = Date.now(),
): AiChannelStore {
  const existingByUrl = new Map<string, AiChannelRecord>();
  for (const record of Object.values(localStore.recordsById)) {
    if (record.url) existingByUrl.set(normalizeUrl(record.url), record);
  }

  const recordsById: Record<string, AiChannelRecord> = {};
  for (const item of data.records) {
    if (!item.url?.trim()) continue;
    const urlKey = normalizeUrl(item.url);
    const existing = existingByUrl.get(urlKey);
    const bookmarkId = existing?.bookmarkId ?? item.bookmarkId ?? stableSyncId(urlKey);
    recordsById[bookmarkId] = {
      bookmarkId,
      title: item.title?.trim() || item.url,
      url: item.url,
      folderPath: item.folderPath || "Project Sync",
      sourceRef: PROJECT_SYNC_SOURCE_REF,
      sourceFolderId: PROJECT_SYNC_SOURCE_REF,
      sourceFolderPath: item.sourceFolderPath || "Project Sync",
      category: item.category ?? "unknown",
      groupId: item.groupId,
      secondaryGroupIds: item.secondaryGroupIds,
      status: item.status ?? "active",
      risk: item.risk ?? "low",
      priceTag: item.priceTag ?? "none",
      note: item.note ?? "",
      firstSeenAt: item.firstSeenAt ?? now,
      lastSeenAt: item.lastSeenAt ?? now,
      lastCheckedAt: item.lastCheckedAt,
      present: item.present ?? true,
      missingSince: item.missingSince,
      annotationUpdatedAt: item.annotationUpdatedAt ?? data.exportedAt,
    };
  }

  return {
    ...localStore,
    groups: data.groups,
    recordsById,
    projectSyncImportedAt: data.exportedAt,
  };
}

export function downloadProjectSyncData(store: AiChannelStore): void {
  triggerDownload(toProjectSyncBlob(store), PROJECT_SYNC_DOWNLOAD_NAME);
}

export async function saveProjectSyncData(store: AiChannelStore): Promise<ProjectSyncSaveResult> {
  const blob = toProjectSyncBlob(store);
  const picker = (globalThis as SavePickerGlobal).showSaveFilePicker;
  if (typeof picker !== "function") {
    triggerDownload(blob, PROJECT_SYNC_DOWNLOAD_NAME);
    return "downloaded";
  }

  try {
    const handle = await picker({
      suggestedName: PROJECT_SYNC_DOWNLOAD_NAME,
      types: [
        {
          description: "Smart Bookmark channel sync JSON",
          accept: { "application/json": [".json"] },
        },
      ],
    });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
    return "saved";
  } catch (error) {
    if (isAbortError(error)) return "cancelled";
    triggerDownload(blob, PROJECT_SYNC_DOWNLOAD_NAME);
    return "downloaded";
  }
}

export async function loadBundledProjectSyncData(): Promise<ProjectSyncData | null> {
  const url = getBundledProjectSyncUrl();
  if (!url) return null;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return null;
  return parseProjectSyncData(await response.json());
}

export function parseProjectSyncData(raw: unknown): ProjectSyncData | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Partial<ProjectSyncData>;
  if (
    data.app !== "smart-bookmark" ||
    data.kind !== "ai-channel-project-sync" ||
    data.version !== PROJECT_SYNC_FILE_VERSION ||
    !Array.isArray(data.groups) ||
    !Array.isArray(data.records)
  ) {
    return null;
  }
  return data as ProjectSyncData;
}

export function shouldApplyProjectSyncData(
  store: AiChannelStore,
  data: ProjectSyncData,
): boolean {
  return data.exportedAt > (store.projectSyncImportedAt ?? 0);
}

function toProjectRecord(record: AiChannelRecord): ProjectSyncRecord {
  return {
    bookmarkId: stableSyncId(normalizeUrl(record.url)),
    title: record.title,
    url: record.url,
    folderPath: record.folderPath,
    sourceRef: record.sourceRef,
    sourceFolderPath: record.sourceFolderPath,
    category: record.category,
    groupId: record.groupId,
    secondaryGroupIds: record.secondaryGroupIds,
    status: record.status,
    risk: record.risk,
    priceTag: record.priceTag,
    note: record.note,
    firstSeenAt: record.firstSeenAt,
    lastSeenAt: record.lastSeenAt,
    lastCheckedAt: record.lastCheckedAt,
    present: record.present,
    missingSince: record.missingSince,
    annotationUpdatedAt: record.annotationUpdatedAt,
  };
}

function toProjectSyncBlob(store: AiChannelStore): Blob {
  const data = buildProjectSyncData(store);
  return new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8",
  });
}

interface SavePickerGlobal {
  showSaveFilePicker?: (options: SaveFilePickerOptionsLike) => Promise<FileHandleLike>;
}

interface SaveFilePickerOptionsLike {
  suggestedName?: string;
  types?: Array<{
    description?: string;
    accept: Record<string, string[]>;
  }>;
}

interface FileHandleLike {
  createWritable: () => Promise<WritableFileLike>;
}

interface WritableFileLike {
  write: (data: Blob) => Promise<void>;
  close: () => Promise<void>;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function stableSyncId(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `sync-${(hash >>> 0).toString(36)}`;
}

function getBundledProjectSyncUrl(): string | null {
  if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
    return chrome.runtime.getURL(PROJECT_SYNC_RUNTIME_PATH);
  }
  if (typeof location !== "undefined") {
    return `/${PROJECT_SYNC_RUNTIME_PATH}`;
  }
  return null;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
