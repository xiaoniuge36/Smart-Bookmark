import assert from "node:assert/strict";
import { toAiChannelShareHtml } from "../src/lib/aiChannelHtmlExport";
import type { AiChannelStore } from "../src/types";

const store: AiChannelStore = {
  groups: [
    {
      id: "tools",
      name: "AI 工具",
      color: "emerald",
      createdAt: 1710000000000,
      updatedAt: 1710000000000,
    },
    {
      id: "relay",
      name: "AI 中转",
      color: "amber",
      createdAt: 1710000000000,
      updatedAt: 1710000000000,
    },
  ],
  recordsById: {
    "1": {
      bookmarkId: "1",
      title: "Claude & GPT",
      url: "https://example.com/claude?x=1&y=2",
      folderPath: "Bookmarks / AI",
      sourceRef: "AI",
      sourceFolderPath: "Bookmarks / AI",
      category: "tool",
      groupId: "tools",
      status: "active",
      risk: "low",
      priceTag: "A",
      note: "good <fast>",
      firstSeenAt: 1710000000000,
      lastSeenAt: 1710000000000,
      present: true,
    },
    "2": {
      bookmarkId: "2",
      title: "Relay API",
      url: "https://relay.example.com",
      folderPath: "Bookmarks / Relay",
      sourceRef: "Relay",
      sourceFolderPath: "Bookmarks / Relay",
      category: "api-relay",
      groupId: "relay",
      status: "watching",
      risk: "medium",
      priceTag: "none",
      note: "",
      firstSeenAt: 1710000000000,
      lastSeenAt: 1710000000000,
      present: true,
    },
    "3": {
      bookmarkId: "3",
      title: "Ungrouped",
      url: "https://ungrouped.example.com",
      folderPath: "Bookmarks / Misc",
      sourceRef: "Misc",
      sourceFolderPath: "Bookmarks / Misc",
      category: "unknown",
      status: "pending",
      risk: "high",
      priceTag: "S",
      note: "",
      firstSeenAt: 1710000000000,
      lastSeenAt: 1710000000000,
      present: true,
    },
    "4": {
      bookmarkId: "4",
      title: "Removed",
      url: "https://removed.example.com",
      folderPath: "Bookmarks / Old",
      sourceRef: "Old",
      sourceFolderPath: "Bookmarks / Old",
      category: "unknown",
      status: "dead",
      risk: "high",
      priceTag: "none",
      note: "",
      firstSeenAt: 1710000000000,
      lastSeenAt: 1710000000000,
      present: false,
    },
  },
};

const html = toAiChannelShareHtml(store, {
  title: "我的收藏工作台",
  exportedAt: new Date("2026-05-27T09:00:00.000Z"),
});

assert.match(html, /^<!doctype html>/i);
assert.match(html, /<title>我的收藏工作台<\/title>/);
assert.match(html, /AI 工具/);
assert.match(html, /AI 中转/);
assert.match(html, /未分组/);
assert.match(html, /有货/);
assert.match(html, /无货/);
assert.match(html, /待补货/);
assert.doesNotMatch(html, /状态 active/);
assert.doesNotMatch(html, /状态 pending/);
assert.doesNotMatch(html, /状态 watching/);
assert.match(html, /Claude &amp; GPT/);
assert.match(html, /good &lt;fast&gt;/);
assert.match(
  html,
  /<a href="https:\/\/example\.com\/claude\?x=1&amp;y=2" target="_blank" rel="noreferrer noopener">/,
);
assert.match(html, /Relay API/);
assert.match(html, /Ungrouped/);
assert.doesNotMatch(html, /Removed/);
assert.match(html, /共 3 个链接/);

console.log("ai channel html export tests passed");
