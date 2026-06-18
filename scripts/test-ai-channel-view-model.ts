import assert from "node:assert/strict";
import {
  filterChannelRecords,
  getChannelRecordUpdateTime,
  sortChannelRecords,
} from "../src/newtab/pages/ai-channels/viewModel";
import type { AiChannelRecord } from "../src/types";

const base = {
  bookmarkId: "base",
  title: "Base",
  url: "https://base.example.com",
  folderPath: "AI / Base",
  sourceRef: "AI",
  sourceFolderPath: "AI",
  category: "unknown",
  groupId: undefined,
  status: "active",
  risk: "low",
  priceTag: "none",
  note: "",
  firstSeenAt: 10,
  lastSeenAt: 20,
  present: true,
} satisfies AiChannelRecord;

function record(patch: Partial<AiChannelRecord>): AiChannelRecord {
  return { ...base, ...patch, bookmarkId: patch.bookmarkId ?? patch.title ?? base.bookmarkId };
}

const records = [
  record({
    bookmarkId: "cheap",
    title: "Cheap GPT",
    status: "active",
    priceTag: "S",
    note: "12 元",
    annotationUpdatedAt: 300,
  }),
  record({
    bookmarkId: "watch",
    title: "Watch Relay",
    url: "https://relay.example.com",
    folderPath: "AI / Relay",
    status: "watching",
    priceTag: "B",
    note: "88 元",
    lastCheckedAt: 400,
  }),
  record({
    bookmarkId: "pending",
    title: "Pending Account",
    status: "pending",
    priceTag: "A",
    note: "账号",
    firstSeenAt: 500,
    lastSeenAt: 600,
  }),
];

assert.equal(getChannelRecordUpdateTime(records[0]), 300);
assert.equal(getChannelRecordUpdateTime(records[1]), 400);
assert.equal(getChannelRecordUpdateTime(records[2]), 600);

assert.deepEqual(
  filterChannelRecords(records, {
    query: "relay",
    statusFilter: "watching",
    priceFilter: "B",
  }).map((item) => item.bookmarkId),
  ["watch"],
);

assert.deepEqual(
  filterChannelRecords(records, {
    query: "",
    statusFilter: "all",
    priceFilter: "A",
  }).map((item) => item.bookmarkId),
  ["pending"],
);

assert.deepEqual(
  sortChannelRecords(records, "updated-desc").map((item) => item.bookmarkId),
  ["pending", "watch", "cheap"],
);

assert.deepEqual(
  sortChannelRecords(records, "price-asc").map((item) => item.bookmarkId),
  ["cheap", "pending", "watch"],
);

console.log("ai channel view model tests passed");
