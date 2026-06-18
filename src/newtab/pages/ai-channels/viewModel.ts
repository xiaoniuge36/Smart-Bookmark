import type { AiChannelPriceTag, AiChannelRecord } from "@/types";
import { statusOrder } from "@/lib/aiChannels";
import { PRICE_TAG_ORDER, compareNotePrice, type StatusFilter } from "./meta";

export type PriceFilter = AiChannelPriceTag | "all";

export type ChannelSortMode =
  | "smart"
  | "updated-desc"
  | "updated-asc"
  | "price-asc"
  | "price-desc";

export interface ChannelRecordFilters {
  query: string;
  statusFilter: StatusFilter;
  priceFilter: PriceFilter;
}

export function filterChannelRecords(
  records: AiChannelRecord[],
  filters: ChannelRecordFilters,
): AiChannelRecord[] {
  const query = filters.query.trim().toLowerCase();
  return records.filter((record) => {
    if (filters.statusFilter !== "all" && record.status !== filters.statusFilter) {
      return false;
    }
    if (filters.priceFilter !== "all" && (record.priceTag ?? "none") !== filters.priceFilter) {
      return false;
    }
    if (!query) return true;
    return recordSearchText(record).includes(query);
  });
}

export function sortChannelRecords(
  records: AiChannelRecord[],
  mode: ChannelSortMode,
): AiChannelRecord[] {
  return [...records].sort((a, b) => compareChannelRecords(a, b, mode));
}

export function getChannelRecordUpdateTime(record: AiChannelRecord): number {
  return Math.max(
    record.annotationUpdatedAt ?? 0,
    record.lastCheckedAt ?? 0,
    record.lastSeenAt ?? 0,
    record.firstSeenAt ?? 0,
  );
}

function compareChannelRecords(
  a: AiChannelRecord,
  b: AiChannelRecord,
  mode: ChannelSortMode,
): number {
  switch (mode) {
    case "updated-desc":
      return compareUpdated(b, a) || compareSmartOrder(a, b);
    case "updated-asc":
      return compareUpdated(a, b) || compareSmartOrder(a, b);
    case "price-asc":
      return comparePrice(a, b) || compareSmartOrder(a, b);
    case "price-desc":
      return comparePrice(b, a) || compareSmartOrder(a, b);
    case "smart":
    default:
      return compareSmartOrder(a, b);
  }
}

function compareSmartOrder(a: AiChannelRecord, b: AiChannelRecord): number {
  const byPrice = comparePrice(a, b);
  if (byPrice) return byPrice;
  const byStatus = statusOrder(a.status) - statusOrder(b.status);
  if (byStatus) return byStatus;
  const byNotePrice = compareNotePrice(a.note, b.note);
  if (byNotePrice) return byNotePrice;
  const byUpdated = getChannelRecordUpdateTime(b) - getChannelRecordUpdateTime(a);
  if (byUpdated) return byUpdated;
  if (a.present !== b.present) return a.present ? -1 : 1;
  return compareTitle(a, b);
}

function comparePrice(a: AiChannelRecord, b: AiChannelRecord): number {
  const byTag = PRICE_TAG_ORDER[a.priceTag ?? "none"] - PRICE_TAG_ORDER[b.priceTag ?? "none"];
  if (byTag) return byTag;
  return compareNotePrice(a.note, b.note);
}

function compareUpdated(a: AiChannelRecord, b: AiChannelRecord): number {
  return getChannelRecordUpdateTime(a) - getChannelRecordUpdateTime(b);
}

function compareTitle(a: AiChannelRecord, b: AiChannelRecord): number {
  return a.title.localeCompare(b.title, "zh-CN") || a.url.localeCompare(b.url);
}

function recordSearchText(record: AiChannelRecord): string {
  return [
    record.title,
    record.url,
    record.folderPath,
    record.sourceFolderPath,
    record.note,
  ]
    .join(" ")
    .toLowerCase();
}
