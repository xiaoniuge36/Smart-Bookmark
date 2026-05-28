import assert from "node:assert/strict";
import {
  applyProjectSyncData,
  buildProjectSyncData,
  PROJECT_SYNC_FILE_VERSION,
  type ProjectSyncData,
} from "../src/lib/aiChannelProjectSync";
import type { AiChannelStore } from "../src/types";

const localStore: AiChannelStore = {
  groups: [
    { id: "old", name: "旧分组", color: "indigo", createdAt: 1, updatedAt: 1 },
  ],
  recordsById: {
    keep: {
      bookmarkId: "keep",
      title: "Local title",
      url: "https://example.com/item#local",
      folderPath: "Local",
      sourceRef: "Local",
      sourceFolderPath: "Local",
      category: "unknown",
      status: "pending",
      risk: "high",
      priceTag: "none",
      note: "old",
      firstSeenAt: 1,
      lastSeenAt: 1,
      present: true,
    },
    stale: {
      bookmarkId: "stale",
      title: "Stale only local",
      url: "https://stale.example.com",
      folderPath: "Local",
      sourceRef: "Local",
      sourceFolderPath: "Local",
      category: "unknown",
      status: "active",
      risk: "low",
      priceTag: "none",
      note: "",
      firstSeenAt: 1,
      lastSeenAt: 1,
      present: true,
    },
  },
};

const projectData: ProjectSyncData = {
  app: "smart-bookmark" as const,
  kind: "ai-channel-project-sync" as const,
  version: PROJECT_SYNC_FILE_VERSION,
  exportedAt: 2,
  groups: [
    { id: "new", name: "新分组", color: "emerald", createdAt: 2, updatedAt: 2 },
  ],
  records: [
    {
      title: "Remote title",
      url: "https://example.com/item",
      folderPath: "Remote",
      sourceRef: "Remote",
      sourceFolderPath: "Remote",
      category: "tool" as const,
      groupId: "new",
      status: "limited" as const,
      risk: "medium" as const,
      priceTag: "A" as const,
      note: "fresh",
      firstSeenAt: 2,
      lastSeenAt: 2,
      lastCheckedAt: 2,
      present: true,
      annotationUpdatedAt: 2,
    },
    {
      title: "Remote only",
      url: "https://remote.example.com",
      folderPath: "Remote",
      sourceRef: "Remote",
      sourceFolderPath: "Remote",
      category: "unknown" as const,
      status: "active" as const,
      risk: "low" as const,
      priceTag: "none" as const,
      note: "",
      firstSeenAt: 2,
      lastSeenAt: 2,
      present: true,
    },
  ],
};

const updated = applyProjectSyncData(localStore, projectData, 3);

assert.deepEqual(updated.groups.map((group) => group.id), ["new"]);
assert.equal(Object.keys(updated.recordsById).length, 2);
assert.equal(updated.recordsById.stale, undefined);
assert.equal(updated.recordsById.keep.title, "Remote title");
assert.equal(updated.recordsById.keep.status, "limited");
assert.equal(updated.recordsById.keep.note, "fresh");

const remoteOnly = Object.values(updated.recordsById).find(
  (record) => record.url === "https://remote.example.com",
);
assert.ok(remoteOnly);
assert.match(remoteOnly.bookmarkId, /^sync-/);

const exported = buildProjectSyncData(updated, { exportedAt: 4 });
assert.equal(exported.version, PROJECT_SYNC_FILE_VERSION);
assert.equal(exported.records.length, 2);
assert.equal(exported.records.some((record) => record.url === "https://stale.example.com"), false);

console.log("ai channel project sync tests passed");
