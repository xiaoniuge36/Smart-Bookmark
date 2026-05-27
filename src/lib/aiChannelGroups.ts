import type {
  AiChannelCategory,
  AiChannelGroup,
  AiChannelRecord,
  AiChannelStore,
} from "@/types";

/* ---------- Default groups ---------- */

const DEFAULT_GROUPS: Array<Pick<AiChannelGroup, "id" | "name" | "color">> = [
  { id: "gpt-subscription", name: "GPT 订阅", color: "indigo" },
  { id: "api-relay", name: "API 中转", color: "sky" },
  { id: "account", name: "账号购买", color: "amber" },
  { id: "tool", name: "工具合集", color: "emerald" },
  { id: "decode", name: "解码辅助", color: "rose" },
];

export function defaultGroups(now: number): AiChannelGroup[] {
  return DEFAULT_GROUPS.map((g) => ({ ...g, createdAt: now, updatedAt: now }));
}

/* ---------- Local CRUD ---------- */

export function createAiChannelGroup(
  store: AiChannelStore,
  name: string,
  color: string,
): AiChannelStore {
  const now = Date.now();
  const id = uniqueGroupId(name, store.groups);
  return {
    ...store,
    groups: [...store.groups, { id, name: name.trim(), color, createdAt: now, updatedAt: now }],
  };
}

export function updateAiChannelGroup(
  store: AiChannelStore,
  groupId: string,
  patch: Partial<Pick<AiChannelGroup, "name" | "color" | "collapsed" | "keywords">>,
): AiChannelStore {
  return {
    ...store,
    groups: store.groups.map((g) =>
      g.id === groupId ? { ...g, ...patch, updatedAt: Date.now() } : g,
    ),
  };
}

export function deleteAiChannelGroup(
  store: AiChannelStore,
  groupId: string,
): AiChannelStore {
  const recordsById = Object.fromEntries(
    Object.entries(store.recordsById).map(([id, record]) => [
      id,
      record.groupId === groupId
        ? ({ ...record, groupId: undefined } satisfies AiChannelRecord)
        : record,
    ]),
  );
  return {
    ...store,
    groups: store.groups.filter((g) => g.id !== groupId),
    recordsById,
  };
}

/* ---------- Normalize / validate ---------- */

export function normalizeGroups(
  groups: unknown,
  fallbackToDefault = true,
): AiChannelGroup[] {
  if (!Array.isArray(groups) || groups.length === 0) {
    return fallbackToDefault ? defaultGroups(Date.now()) : [];
  }
  return groups
    .filter((g): g is AiChannelGroup => !!g && typeof g.id === "string" && typeof g.name === "string")
    .map((g) => ({
      ...g,
      color: g.color || "indigo",
      createdAt: g.createdAt ?? Date.now(),
      updatedAt: g.updatedAt ?? Date.now(),
    }));
}

export function suggestedGroupId(
  groupIds: Set<string>,
  category: AiChannelCategory,
): string | undefined {
  return groupIds.has(category) ? category : undefined;
}

/* ---------- Batch create ---------- */

/**
 * Parse batch-create text (one group per line):
 *   "group name: kw1, kw2, kw3"  or just  "group name"
 * Returns array of { name, keywords }.
 */
export function parseBatchGroupText(
  text: string,
): Array<{ name: string; keywords: string[] }> {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const colonIdx = line.indexOf(":");
      if (colonIdx < 0) return { name: line.trim(), keywords: [] };
      const name = line.slice(0, colonIdx).trim();
      const keywords = parseKeywords(line.slice(colonIdx + 1));
      return { name, keywords };
    })
    .filter((g) => g.name.length > 0);
}

export function batchCreateGroups(
  store: AiChannelStore,
  items: Array<{ name: string; keywords: string[]; color?: string }>,
): AiChannelStore {
  const PALETTE = ["indigo", "sky", "amber", "emerald", "rose", "violet", "teal", "orange", "pink", "cyan"];
  let next = store;
  items.forEach((item, i) => {
    const now = Date.now();
    const id = uniqueGroupId(item.name, next.groups);
    const color = item.color ?? PALETTE[i % PALETTE.length];
    next = {
      ...next,
      groups: [
        ...next.groups,
        { id, name: item.name, color, keywords: item.keywords, createdAt: now, updatedAt: now },
      ],
    };
  });
  return next;
}

/* ---------- Auto-classification ---------- */

/**
 * Parse a raw keyword string (comma / space / newline separated) into clean tokens.
 */
export function parseKeywords(raw: string): string[] {
  return raw
    .split(/[,\n]+/)
    .map((k) => k.trim().toLowerCase())
    .filter((k) => k.length > 0);
}

function matchesGroup(title: string, url: string, group: AiChannelGroup): boolean {
  if (!group.keywords?.length) return false;
  const text = `${title} ${url}`.toLowerCase();
  return group.keywords.some((kw) => kw && text.includes(kw));
}

/**
 * Auto-assign groupId to every present record by scanning groups in order.
 * First matching group wins. Records with no match are left ungrouped.
 * Returns the updated store and the number of records whose groupId changed.
 */
export function autoClassifyRecords(store: AiChannelStore): {
  store: AiChannelStore;
  updatedCount: number;
} {
  let updatedCount = 0;
  const recordsById = { ...store.recordsById };
  for (const [id, record] of Object.entries(recordsById)) {
    if (!record.present) continue;
    let matched: string | undefined;
    for (const group of store.groups) {
      if (matchesGroup(record.title, record.url, group)) {
        matched = group.id;
        break;
      }
    }
    if (matched !== record.groupId) {
      recordsById[id] = { ...record, groupId: matched, annotationUpdatedAt: Date.now() };
      updatedCount++;
    }
  }
  return { store: { ...store, recordsById }, updatedCount };
}

/* ---------- Helpers ---------- */

function uniqueGroupId(name: string, groups: AiChannelGroup[]): string {
  const base =
    name.trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-").replace(/^-+|-+$/g, "") ||
    "group";
  const ids = new Set(groups.map((g) => g.id));
  let id = base;
  let i = 2;
  while (ids.has(id)) id = `${base}-${i++}`;
  return id;
}
