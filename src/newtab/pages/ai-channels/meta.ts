import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  ShieldAlert,
  ShieldCheck,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type {
  AiChannelCategory,
  AiChannelPriceTag,
  AiChannelRisk,
  AiChannelStatus,
} from "@/types";

export const UNGROUPED_ID = "__ungrouped__";

export const PRICE_TAG_META: Record<
  AiChannelPriceTag,
  { labelKey: string; className: string }
> = {
  S: { labelKey: "channels.price.S", className: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300" },
  A: { labelKey: "channels.price.A", className: "bg-sky-500/15 text-sky-700 ring-sky-500/25 dark:text-sky-300" },
  B: { labelKey: "channels.price.B", className: "bg-amber-500/15 text-amber-700 ring-amber-500/25 dark:text-amber-300" },
  C: { labelKey: "channels.price.C", className: "bg-rose-500/15 text-rose-700 ring-rose-500/25 dark:text-rose-300" },
  none: { labelKey: "channels.price.none", className: "bg-muted text-muted-foreground ring-border" },
};

export const PRICE_TAG_ORDER: Record<AiChannelPriceTag, number> = {
  S: 0, A: 1, B: 2, C: 3, none: 4,
};

const NUMBER_RE = /\d+(?:\.\d+)?/g;
const NOT_PRICE_SUFFIX_RE = /[年月日号卡绑级个张份]/;

export function extractNotePrice(note: string): number | null {
  const text = normalizePriceText(note);
  if (!text) return null;

  const range = text.match(/(\d+(?:\.\d+)?)\s*(?:-|~|～|到|至)\s*(\d+(?:\.\d+)?)\s*(?:元|块|块钱|人民币|rmb|cny)/i);
  if (range) return Math.min(Number(range[1]), Number(range[2]));

  const prefixed = text.match(/(?:￥|¥|人民币|rmb|cny)\s*(\d+(?:\.\d+)?)/i);
  if (prefixed) return Number(prefixed[1]);

  const suffixed = text.match(/(\d+(?:\.\d+)?)\s*(?:￥|¥|元|块|块钱|人民币|rmb|cny)/i);
  if (suffixed) return Number(suffixed[1]);

  for (const match of text.matchAll(NUMBER_RE)) {
    const value = Number(match[0]);
    const index = match.index ?? 0;
    if (!Number.isFinite(value)) continue;
    if (isEmbeddedInAsciiWord(text, index, match[0].length)) continue;
    if (NOT_PRICE_SUFFIX_RE.test(text[index + match[0].length] ?? "")) continue;
    return value;
  }

  return null;
}

export function compareNotePrice(a: string, b: string): number {
  const priceA = extractNotePrice(a);
  const priceB = extractNotePrice(b);
  if (priceA === null && priceB === null) return 0;
  if (priceA === null) return 1;
  if (priceB === null) return -1;
  return priceA - priceB;
}

function normalizePriceText(note: string): string {
  return note
    .trim()
    .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/[．。]/g, ".")
    .replace(/[，,]/g, ".");
}

function isEmbeddedInAsciiWord(text: string, index: number, length: number): boolean {
  const before = text[index - 1] ?? "";
  const after = text[index + length] ?? "";
  return /[A-Za-z_]/.test(before) || /[A-Za-z_]/.test(after);
}

export type StatusFilter = AiChannelStatus | "all";

export const STATUS_META: Record<
  AiChannelStatus,
  { labelKey: string; className: string; Icon: LucideIcon }
> = {
  pending: {
    labelKey: "channels.status.pending",
    className: "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300",
    Icon: CircleDashed,
  },
  active: {
    labelKey: "channels.status.active",
    className: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
    Icon: CheckCircle2,
  },
  watching: {
    labelKey: "channels.status.watching",
    className: "bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300",
    Icon: AlertTriangle,
  },
  dead: {
    labelKey: "channels.status.dead",
    className: "bg-muted text-muted-foreground ring-border",
    Icon: XCircle,
  },
  blocked: {
    labelKey: "channels.status.blocked",
    className: "bg-destructive/10 text-destructive ring-destructive/20",
    Icon: ShieldAlert,
  },
};

export const RISK_META: Record<
  AiChannelRisk,
  { labelKey: string; className: string; Icon: LucideIcon }
> = {
  low: {
    labelKey: "channels.risk.low",
    className: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
    Icon: ShieldCheck,
  },
  medium: {
    labelKey: "channels.risk.medium",
    className: "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300",
    Icon: AlertTriangle,
  },
  high: {
    labelKey: "channels.risk.high",
    className: "bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300",
    Icon: ShieldAlert,
  },
};

export const CATEGORY_KEY: Record<AiChannelCategory, string> = {
  "gpt-subscription": "channels.category.gpt-subscription",
  "api-relay": "channels.category.api-relay",
  account: "channels.category.account",
  tool: "channels.category.tool",
  decode: "channels.category.decode",
  unknown: "channels.category.unknown",
};

export const COLOR_OPTIONS = [
  { id: "indigo", labelKey: "channels.color.indigo", dot: "bg-indigo-500", chip: "bg-indigo-500/10 text-indigo-700 ring-indigo-500/20 dark:text-indigo-300" },
  { id: "sky", labelKey: "channels.color.sky", dot: "bg-sky-500", chip: "bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300" },
  { id: "emerald", labelKey: "channels.color.emerald", dot: "bg-emerald-500", chip: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300" },
  { id: "amber", labelKey: "channels.color.amber", dot: "bg-amber-500", chip: "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300" },
  { id: "rose", labelKey: "channels.color.rose", dot: "bg-rose-500", chip: "bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300" },
  { id: "violet", labelKey: "channels.color.violet", dot: "bg-violet-500", chip: "bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-300" },
] as const;

export function colorMeta(color: string) {
  if (color?.startsWith("#")) {
    return { id: color, labelKey: "channels.color.custom", dot: "", chip: "", hex: color } as const;
  }
  return COLOR_OPTIONS.find((option) => option.id === color) ?? COLOR_OPTIONS[0];
}

/** Returns props for rendering a color dot — handles both Tailwind presets and hex. */
export function colorDotProps(color: string): {
  className: string;
  style?: React.CSSProperties;
} {
  if (color?.startsWith("#")) return { className: "", style: { backgroundColor: color } };
  return { className: colorMeta(color).dot };
}

/** Build a SelectMenu dotClassName/dotStyle pair for a group color. */
export function colorOptionDot(
  color: string,
): { dotClassName?: string; dotStyle?: React.CSSProperties } {
  if (color?.startsWith("#")) return { dotStyle: { backgroundColor: color } };
  return { dotClassName: colorMeta(color).dot };
}

export function formatDateTime(ts?: number): string {
  if (!ts) return "";
  return new Date(ts).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
