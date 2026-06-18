import assert from "node:assert/strict";
import {
  applyImportData,
  buildExportData,
  type ChannelExportData,
} from "../src/lib/aiChannelSync";
import type { AiChannelStore } from "../src/types";

const store: AiChannelStore = {
  groups: [
    { id: "main", name: "主分组", color: "indigo", createdAt: 1, updatedAt: 1 },
    { id: "backup", name: "副分组", color: "emerald", createdAt: 1, updatedAt: 1 },
  ],
  recordsById: {
    "1": {
      bookmarkId: "1",
      title: "With secondary group",
      url: "https://example.com/1",
      folderPath: "AI",
      sourceRef: "AI",
      sourceFolderPath: "AI",
      category: "tool",
      groupId: "main",
      secondaryGroupIds: ["backup"],
      status: "active",
      risk: "low",
      priceTag: "none",
      note: "",
      firstSeenAt: 1,
      lastSeenAt: 1,
      present: true,
      annotationUpdatedAt: 10,
    },
    "2": {
      bookmarkId: "2",
      title: "Cleared annotations",
      url: "https://example.com/2",
      folderPath: "AI",
      sourceRef: "AI",
      sourceFolderPath: "AI",
      category: "tool",
      status: "active",
      risk: "low",
      priceTag: "none",
      note: "",
      firstSeenAt: 1,
      lastSeenAt: 1,
      present: true,
      annotationUpdatedAt: 20,
    },
  },
};

const exported = buildExportData(store);
assert.deepEqual(exported.annotations["1"].sg, ["backup"]);
assert.equal(exported.annotations["1"].gid, "main");
assert.deepEqual(exported.annotations["2"].sg, []);
assert.equal(exported.annotations["2"].gid, null);

const imported: ChannelExportData = {
  version: 2,
  exportedAt: 30,
  groups: store.groups,
  annotations: {
    "1": { gid: null, sg: [], ts: 30 },
  },
};
const merged = applyImportData(store, imported);
assert.equal(merged.recordsById["1"].groupId, undefined);
assert.equal(merged.recordsById["1"].secondaryGroupIds, undefined);
assert.equal(merged.recordsById["1"].annotationUpdatedAt, 30);

console.log("ai channel sync tests passed");
