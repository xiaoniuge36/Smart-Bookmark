import assert from "node:assert/strict";
import { AI_CHANNEL_STATUS_ORDER, getAiChannelStatusLabel } from "../src/lib/aiChannelStatus";

assert.deepEqual(AI_CHANNEL_STATUS_ORDER, [
  "active",
  "limited",
  "pending",
  "watching",
  "dead",
  "blocked",
]);

assert.equal(getAiChannelStatusLabel("active", "zh"), "有货");
assert.equal(getAiChannelStatusLabel("limited", "zh"), "少量有货");
assert.equal(getAiChannelStatusLabel("pending", "zh"), "无货");
assert.equal(getAiChannelStatusLabel("watching", "zh"), "待补货");
assert.equal(getAiChannelStatusLabel("dead", "zh"), "下架");

console.log("ai channel status order tests passed");
