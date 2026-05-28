import type { AiChannelGroup, AiChannelRecord, AiChannelStore } from "../types";
import { getAiChannelStatusLabel, type AiChannelStatusLocale } from "./aiChannelStatus";

type ShareLocale = AiChannelStatusLocale;

export interface AiChannelShareHtmlOptions {
  title?: string;
  exportedAt?: Date;
  locale?: ShareLocale;
}

interface GroupSection {
  id: string;
  name: string;
  records: AiChannelRecord[];
}

export function toAiChannelShareHtml(
  store: AiChannelStore,
  options: AiChannelShareHtmlOptions = {},
): string {
  const title = options.title?.trim() || "收藏工作台";
  const exportedAt = options.exportedAt ?? new Date();
  const locale = options.locale ?? "zh";
  const sections = buildSections(store);
  const total = sections.reduce((sum, section) => sum + section.records.length, 0);
  return [
    "<!doctype html>",
    '<html lang="zh-CN">',
    "<head>",
    '  <meta charset="utf-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1">',
    `  <title>${esc(title)}</title>`,
    `  <style>${style()}</style>`,
    "</head>",
    "<body>",
    '  <main class="page">',
    '    <header class="hero">',
    `      <p class="eyebrow">Smart Bookmark · ${esc(formatDate(exportedAt))}</p>`,
    `      <h1>${esc(title)}</h1>`,
    `      <p class="summary">共 ${total} 个链接，按收藏工作台分组导出。点击标题即可打开原始网页。</p>`,
    "    </header>",
    sections.length ? sections.map((section) => renderSection(section, locale)).join("\n") : renderEmpty(),
    "  </main>",
    "</body>",
    "</html>",
  ].join("\n");
}

export function downloadAiChannelShareHtml(
  store: AiChannelStore,
  options: AiChannelShareHtmlOptions = {},
) {
  const html = toAiChannelShareHtml(store, options);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  triggerDownload(blob, `smart-bookmark-channels-${ymd(options.exportedAt)}.html`);
}

function buildSections(store: AiChannelStore): GroupSection[] {
  const present = Object.values(store.recordsById)
    .filter((record) => record.present && record.url.trim())
    .sort(compareRecord);
  const groupIds = new Set(store.groups.map((group) => group.id));
  const sections = store.groups
    .map((group) => toGroupSection(group, present))
    .filter((section) => section.records.length > 0);
  const ungrouped = present.filter((record) => !record.groupId || !groupIds.has(record.groupId));
  if (ungrouped.length) sections.push({ id: "__ungrouped__", name: "未分组", records: ungrouped });
  return sections;
}

function toGroupSection(group: AiChannelGroup, records: AiChannelRecord[]): GroupSection {
  return {
    id: group.id,
    name: group.name,
    records: records.filter((record) => record.groupId === group.id),
  };
}

function renderSection(section: GroupSection, locale: ShareLocale): string {
  return [
    `    <section class="group" id="${escAttr(section.id)}">`,
    "      <div class=\"group-head\">",
    `        <h2>${esc(section.name)}</h2>`,
    `        <span>${section.records.length} 个</span>`,
    "      </div>",
    '      <div class="links">',
    section.records.map((record) => renderRecord(record, locale)).join("\n"),
    "      </div>",
    "    </section>",
  ].join("\n");
}

function renderRecord(record: AiChannelRecord, locale: ShareLocale): string {
  const href = safeHref(record.url);
  const meta = [
    record.priceTag !== "none" ? `价格 ${record.priceTag}` : "",
    `状态 ${getAiChannelStatusLabel(record.status, locale)}`,
    `风险 ${record.risk}`,
    record.folderPath,
  ].filter(Boolean);
  return [
    '        <article class="link-card">',
    `          <a href="${escAttr(href)}" target="_blank" rel="noreferrer noopener">${esc(record.title || record.url)}</a>`,
    `          <p class="url">${esc(record.url)}</p>`,
    `          <p class="meta">${esc(meta.join(" · "))}</p>`,
    record.note.trim() ? `          <p class="note">${esc(record.note.trim())}</p>` : "",
    "        </article>",
  ].filter(Boolean).join("\n");
}

function renderEmpty(): string {
  return '    <section class="empty">当前工作台还没有可导出的链接。</section>';
}

function compareRecord(a: AiChannelRecord, b: AiChannelRecord): number {
  return a.title.localeCompare(b.title, "zh-CN") || a.url.localeCompare(b.url);
}

function formatDate(date: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}`;
}

function ymd(date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}-${p(date.getHours())}${p(date.getMinutes())}`;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

function safeHref(url: string): string {
  const value = url.trim();
  return /^(javascript|data|vbscript):/i.test(value) ? "#" : value;
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escAttr(value: string): string {
  return esc(value);
}

function style(): string {
  return `
    :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f7f8fb; color: #172033; }
    * { box-sizing: border-box; }
    body { margin: 0; }
    .page { width: min(1040px, calc(100% - 32px)); margin: 0 auto; padding: 40px 0 56px; }
    .hero { margin-bottom: 24px; border-bottom: 1px solid #dbe3f0; padding-bottom: 20px; }
    .eyebrow { margin: 0 0 10px; color: #64748b; font-size: 13px; }
    h1 { margin: 0; font-size: 42px; line-height: 1.05; letter-spacing: 0; }
    .summary { margin: 14px 0 0; max-width: 680px; color: #475569; font-size: 15px; line-height: 1.7; }
    .group { margin-top: 18px; }
    .group-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 0; }
    .group-head h2 { margin: 0; color: #111827; font-size: 20px; letter-spacing: 0; }
    .group-head span { color: #64748b; font-size: 13px; }
    .links { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 10px; }
    .link-card { border: 1px solid #dce4ef; border-radius: 8px; background: #ffffff; padding: 14px; }
    .link-card a { color: #1d4ed8; font-size: 16px; font-weight: 700; text-decoration: none; overflow-wrap: anywhere; }
    .link-card a:hover { text-decoration: underline; }
    .url, .meta, .note { margin: 8px 0 0; overflow-wrap: anywhere; font-size: 12px; line-height: 1.5; }
    .url { color: #64748b; }
    .meta { color: #475569; }
    .note { border-left: 3px solid #f59e0b; padding-left: 8px; color: #334155; }
    .empty { border: 1px dashed #cbd5e1; border-radius: 8px; background: #fff; padding: 28px; color: #64748b; text-align: center; }
    @media (max-width: 640px) { .page { width: min(100% - 24px, 1040px); padding-top: 28px; } h1 { font-size: 30px; } }
  `;
}
