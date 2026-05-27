/**
 * chrome.storage.sync helpers for AI Channels — with real-time multi-device sync.
 *
 * Keys:
 *   "aic:groups"  → AiChannelGroup[] with updatedAt timestamps        ~5-15 KB
 *   "aic:ann"     → sparse annotations keyed by bookmarkId, with ts   ≤8 KB
 *   "aic:meta"    → { nonce, ts } for echo suppression
 *
 * Conflict resolution: last-write-wins per record / per group (via timestamps).
 * Echo suppression: each write carries a random nonce; the listener skips
 *   changes whose nonce matches our last write, so we don't process our own echoes.
 */

import type { AiChannelGroup, AiChannelPriceTag, AiChannelStatus, AiChannelStore } from "@/types";

const SYNC_GROUPS_KEY = "aic:groups";
const SYNC_ANN_KEY    = "aic:ann";
const SYNC_META_KEY   = "aic:meta";
const SYNC_KEY_LIMIT  = 7800; // safely under chrome's 8192-byte per-key limit

/* ---------- Types ---------- */

export interface SyncAnnotation {
  n?:   string; // note
  pt?:  string; // priceTag
  st?:  string; // status (omitted when default "active")
  gid?: string; // groupId
  ts?:  number; // annotationUpdatedAt — for conflict resolution
}

export interface SyncPayload {
  groups:      AiChannelGroup[] | null;
  annotations: Record<string, SyncAnnotation> | null;
}

/* ---------- Echo suppression ---------- */

/** Nonces of writes we issued; used to skip our own reflected changes. */
const PENDING_NONCES = new Set<string>();

/* ---------- Write ---------- */

/** Persist groups + annotations to chrome.storage.sync (with nonce + timestamps). */
export async function syncSave(store: AiChannelStore): Promise<void> {
  if (!chrome?.storage?.sync) return;

  const nonce = crypto.randomUUID();
  PENDING_NONCES.add(nonce);
  const now = Date.now();

  // Build annotationmap with ts
  const ann: Record<string, SyncAnnotation> = {};
  for (const [id, r] of Object.entries(store.recordsById)) {
    const entry: SyncAnnotation = {};
    if (r.note?.trim())                        entry.n   = r.note.trim();
    if (r.priceTag && r.priceTag !== "none")   entry.pt  = r.priceTag;
    if (r.status   && r.status   !== "active") entry.st  = r.status;
    if (r.groupId)                             entry.gid = r.groupId;
    if (Object.keys(entry).length) {
      entry.ts = r.annotationUpdatedAt ?? now;
      ann[id] = entry;
    }
  }

  const payload: Record<string, unknown> = {
    [SYNC_GROUPS_KEY]: store.groups,
    [SYNC_META_KEY]:   { nonce, ts: now },
  };

  const annStr = JSON.stringify(ann);
  if (annStr.length <= SYNC_KEY_LIMIT) {
    payload[SYNC_ANN_KEY] = ann;
  } else {
    console.warn(`[aic-sync] annotations (${annStr.length}B) exceed sync limit — skipped.`);
  }

  try {
    await chrome.storage.sync.set(payload);
  } catch (e) {
    PENDING_NONCES.delete(nonce);
    console.warn("[aic-sync] save failed:", e);
  }
}

/* ---------- Debounced write ---------- */

let _debTimer:   ReturnType<typeof setTimeout> | null = null;
let _debPending: AiChannelStore | null = null;

/**
 * Schedule a syncSave after `delayMs` ms (default 800).
 * Rapid calls collapse into a single write.
 */
export function debouncedSyncSave(store: AiChannelStore, delayMs = 800): void {
  _debPending = store;
  if (_debTimer) clearTimeout(_debTimer);
  _debTimer = setTimeout(() => {
    _debTimer = null;
    if (_debPending) { void syncSave(_debPending); _debPending = null; }
  }, delayMs);
}

/* ---------- Read (initial load) ---------- */

/** Load groups and annotations from chrome.storage.sync. */
export async function syncLoad(): Promise<SyncPayload> {
  if (!chrome?.storage?.sync) return { groups: null, annotations: null };
  try {
    const result = await chrome.storage.sync.get([SYNC_GROUPS_KEY, SYNC_ANN_KEY]);
    return {
      groups:      (result[SYNC_GROUPS_KEY] as AiChannelGroup[])           ?? null,
      annotations: (result[SYNC_ANN_KEY]    as Record<string, SyncAnnotation>) ?? null,
    };
  } catch (e) {
    console.warn("[aic-sync] load failed:", e);
    return { groups: null, annotations: null };
  }
}

/* ---------- Initial-load merge (conservative / local-first) ---------- */

/**
 * Merge sync data into a local store on page load.
 * - Groups:      timestamp-based; local wins on tie. Adds new remote groups.
 * - Annotations: only applied when remote.ts > local.annotationUpdatedAt.
 *                Records with no local customisation on a fresh device are fully populated.
 */
export function mergeSyncIntoStore(
  localStore: AiChannelStore,
  syncData:   SyncPayload,
): AiChannelStore {
  return _mergePayload(localStore, syncData, /* forceRemote */ false);
}

/* ---------- Real-time remote-change merge (timestamp-based) ---------- */

/**
 * Apply a remote sync change received via chrome.storage.onChanged.
 * Uses strict timestamp comparison — remote wins only when its ts > local ts.
 */
export function applyRemoteSyncChange(
  localStore: AiChannelStore,
  syncData:   SyncPayload,
): AiChannelStore {
  return _mergePayload(localStore, syncData, /* forceRemote */ false);
}

/* ---------- Shared merge logic ---------- */

function _mergePayload(
  localStore:  AiChannelStore,
  syncData:    SyncPayload,
  _forceRemote: boolean,
): AiChannelStore {
  let store = localStore;

  // --- Groups (timestamp-based) ---
  if (syncData.groups?.length) {
    const localMap = new Map(localStore.groups.map((g) => [g.id, g]));
    let changed = false;
    const merged = [...localStore.groups];

    for (const sg of syncData.groups) {
      const local = localMap.get(sg.id);
      if (!local) {
        merged.push(sg);
        changed = true;
      } else if ((sg.updatedAt ?? 0) > (local.updatedAt ?? 0)) {
        const idx = merged.findIndex((g) => g.id === sg.id);
        if (idx >= 0) { merged[idx] = sg; changed = true; }
      }
    }
    if (changed) store = { ...store, groups: merged };
  }

  // --- Annotations (timestamp-based) ---
  if (syncData.annotations) {
    const recordsById = { ...store.recordsById };
    let changed = false;

    for (const [id, ann] of Object.entries(syncData.annotations)) {
      const r = recordsById[id];
      if (!r) continue;

      const remoteTs = ann.ts ?? 0;
      const localTs  = r.annotationUpdatedAt ?? 0;

      // Remote wins only when strictly newer
      if (remoteTs <= localTs) continue;

      recordsById[id] = {
        ...r,
        ...(ann.n   !== undefined ? { note:      ann.n                   } : {}),
        ...(ann.pt  !== undefined ? { priceTag:  ann.pt as AiChannelPriceTag  } : {}),
        ...(ann.st  !== undefined ? { status:    ann.st as AiChannelStatus    } : {}),
        ...(ann.gid !== undefined ? { groupId:   ann.gid                 } : {}),
        annotationUpdatedAt: remoteTs,
      };
      changed = true;
    }
    if (changed) store = { ...store, recordsById };
  }

  return store;
}

/* ---------- Real-time listener ---------- */

/**
 * Subscribe to remote sync changes.
 * Returns an unsubscribe function — call it on component unmount.
 */
export function subscribeToSyncChanges(
  onRemote: (payload: SyncPayload) => void,
): () => void {
  if (!chrome?.storage?.onChanged) return () => {};

  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    area:    string,
  ) => {
    if (area !== "sync") return;

    // Echo suppression — skip changes we wrote ourselves
    const meta = changes[SYNC_META_KEY]?.newValue as { nonce?: string } | undefined;
    if (meta?.nonce && PENDING_NONCES.has(meta.nonce)) {
      PENDING_NONCES.delete(meta.nonce);
      return;
    }

    const groups      = (changes[SYNC_GROUPS_KEY]?.newValue as AiChannelGroup[]                   | undefined) ?? null;
    const annotations = (changes[SYNC_ANN_KEY]?.newValue    as Record<string, SyncAnnotation>     | undefined) ?? null;

    if (groups !== null || annotations !== null) {
      onRemote({ groups, annotations });
    }
  };

  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}

/* ---------- Export / Import ---------- */

export interface ChannelExportData {
  version:     2;
  exportedAt:  number;
  groups:      AiChannelGroup[];
  annotations: Record<string, SyncAnnotation>;
}

/** Build a compact export object from the current store. */
export function buildExportData(store: AiChannelStore): ChannelExportData {
  const annotations: Record<string, SyncAnnotation> = {};
  for (const [id, r] of Object.entries(store.recordsById)) {
    const entry: SyncAnnotation = {};
    if (r.note?.trim())                        entry.n   = r.note.trim();
    if (r.priceTag && r.priceTag !== "none")   entry.pt  = r.priceTag;
    if (r.status   && r.status   !== "active") entry.st  = r.status;
    if (r.groupId)                             entry.gid = r.groupId;
    if (Object.keys(entry).length) {
      entry.ts = r.annotationUpdatedAt ?? Date.now();
      annotations[id] = entry;
    }
  }
  return { version: 2, exportedAt: Date.now(), groups: store.groups, annotations };
}

/** Apply imported data to a store (uses timestamp-based merge). */
export function applyImportData(
  localStore: AiChannelStore,
  data:       ChannelExportData,
): AiChannelStore {
  return applyRemoteSyncChange(localStore, {
    groups:      data.groups,
    annotations: data.annotations,
  });
}
