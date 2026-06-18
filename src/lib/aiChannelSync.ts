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
  n?:   string | null; // note; null clears a previous note
  pt?:  string | null; // priceTag; null clears to "none"
  st?:  string | null; // status; null clears to "active"
  gid?: string | null; // groupId; null clears main group
  sg?:  string[];      // secondaryGroupIds; [] clears secondary groups
  ts?:  number;        // annotationUpdatedAt — for conflict resolution
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

  // Build annotation map with ts
  const ann: Record<string, SyncAnnotation> = {};
  for (const [id, r] of Object.entries(store.recordsById)) {
    const entry = toSyncAnnotation(r, now);
    if (entry) ann[id] = entry;
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
        ...(ann.n   !== undefined ? { note:      ann.n ?? "" } : {}),
        ...(ann.pt  !== undefined ? { priceTag:  (ann.pt ?? "none") as AiChannelPriceTag } : {}),
        ...(ann.st  !== undefined ? { status:    (ann.st ?? "active") as AiChannelStatus } : {}),
        ...(ann.gid !== undefined ? { groupId:   ann.gid ?? undefined } : {}),
        ...(ann.sg  !== undefined ? { secondaryGroupIds: ann.sg.length ? ann.sg : undefined } : {}),
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
    const entry = toSyncAnnotation(r, Date.now());
    if (entry) annotations[id] = entry;
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

function toSyncAnnotation(
  record: AiChannelStore["recordsById"][string],
  now: number,
): SyncAnnotation | null {
  const entry: SyncAnnotation = {};
  const note = record.note?.trim() ?? "";
  const priceTag = record.priceTag ?? "none";
  const secondaryGroupIds = Array.from(new Set(record.secondaryGroupIds ?? []));
  const hasLocalTimestamp = record.annotationUpdatedAt !== undefined;

  if (hasLocalTimestamp) {
    entry.n = note || null;
    entry.pt = priceTag !== "none" ? priceTag : null;
    entry.st = record.status !== "active" ? record.status : null;
    entry.gid = record.groupId ?? null;
    entry.sg = secondaryGroupIds;
  } else {
    if (note) entry.n = note;
    if (priceTag !== "none") entry.pt = priceTag;
    if (record.status !== "active") entry.st = record.status;
    if (record.groupId) entry.gid = record.groupId;
    if (secondaryGroupIds.length) entry.sg = secondaryGroupIds;
  }

  if (!Object.keys(entry).length) return null;
  entry.ts = record.annotationUpdatedAt ?? now;
  return entry;
}
