import type { AiChannelStatus } from "../types";

export type AiChannelStatusLocale = "zh" | "en";

export const AI_CHANNEL_STATUS_ORDER: AiChannelStatus[] = [
  "active",
  "limited",
  "pending",
  "watching",
  "dead",
  "blocked",
];

const STATUS_LABELS: Record<AiChannelStatusLocale, Record<AiChannelStatus, string>> = {
  zh: {
    pending: "无货",
    limited: "少量有货",
    active: "有货",
    watching: "待补货",
    dead: "下架",
    blocked: "黑名单",
  },
  en: {
    pending: "Out of stock",
    limited: "Low stock",
    active: "In stock",
    watching: "Restock watch",
    dead: "Delisted",
    blocked: "Blacklisted",
  },
};

export function getAiChannelStatusLabel(
  status: AiChannelStatus,
  locale: AiChannelStatusLocale = "zh",
): string {
  return STATUS_LABELS[locale][status];
}
