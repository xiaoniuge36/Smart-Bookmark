import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ChevronsDownUp, GripVertical, Sparkles, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AiChannelGroup, AiChannelStore } from "@/types";
import { COLOR_OPTIONS, colorDotProps } from "./meta";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { parseKeywords } from "@/lib/aiChannelGroups";

interface GroupManagerProps {
  store: AiChannelStore;
  onCreateGroup: (name: string, color: string) => void;
  onUpdateGroup: (
    groupId: string,
    patch: Partial<{ name: string; color: string; collapsed: boolean; keywords: string[] }>,
  ) => void;
  onDeleteGroup: (groupId: string) => void;
  onToggleCollapsed: (groupId: string) => void;
  onAutoClassify: () => void;
  onBatchCreate: (text: string) => void;
  onReorderGroups: (fromIndex: number, toIndex: number) => void;
  groupCounts: Map<string, number>;
}

export default function GroupManager({
  store,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onAutoClassify,
  onBatchCreate,
  onReorderGroups,
  groupCounts,
}: GroupManagerProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("indigo");
  const [showBatch, setShowBatch] = useState(false);
  const [batchText, setBatchText] = useState("");
  const [confirmClassify, setConfirmClassify] = useState(false);
  const [dragFromIdx, setDragFromIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const customColorRef = useRef<HTMLInputElement>(null);
  const t = useT();

  const selectedDot = colorDotProps(color);

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreateGroup(name.trim(), color);
    setName("");
  };

  const hasKeywords = store.groups.some((g) => g.keywords?.length);

  const handleBatchSubmit = () => {
    if (!batchText.trim()) return;
    onBatchCreate(batchText);
    setBatchText("");
    setShowBatch(false);
  };

  const handleDrop = (toIdx: number) => {
    if (dragFromIdx !== null && dragFromIdx !== toIdx) {
      onReorderGroups(dragFromIdx, toIdx);
    }
    setDragFromIdx(null);
    setDragOverIdx(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="mb-1 text-sm font-semibold">{t("channels.group.title")}</div>
          <div className="text-xs text-muted-foreground">{t("channels.group.subtitle")}</div>
        </div>
        {store.groups.length > 0 && (
          <div className="flex flex-col items-end gap-1.5">
            {confirmClassify ? (
              <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 dark:border-amber-700 dark:bg-amber-950/30">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                <span className="text-xs text-amber-800 dark:text-amber-300">{t("channels.group.autoClassifyConfirm")}</span>
                <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={() => setConfirmClassify(false)}>
                  {t("channels.group.batchCancel")}
                </Button>
                <Button size="sm" className="h-6 gap-1 px-2 text-xs" onClick={() => { onAutoClassify(); setConfirmClassify(false); }}>
                  <Sparkles className="h-3 w-3" />
                  {t("channels.group.autoClassifyConfirmOk")}
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant={hasKeywords ? "default" : "outline"}
                onClick={() => setConfirmClassify(true)}
                className="shrink-0 gap-1.5"
                title={t("channels.group.autoClassifyHint")}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {t("channels.group.autoClassify")}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Single create row */}
      <div className="flex items-center gap-2">
        <div className={cn("h-4 w-1.5 shrink-0 rounded-full", selectedDot.className)} style={selectedDot.style} />
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("channels.group.namePlaceholder")}
          className="h-9 flex-1 rounded-lg"
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); handleCreate(); }
          }}
        />
        {/* Preset color swatches + custom hex */}
        <div className="flex shrink-0 items-center gap-1 rounded-xl border bg-background px-2 py-1.5">
          {COLOR_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              title={t(opt.labelKey)}
              onClick={() => setColor(opt.id)}
              className={cn(
                "h-4 w-4 rounded-full transition hover:scale-110",
                opt.dot,
                color === opt.id && "ring-2 ring-offset-1 ring-primary",
              )}
            />
          ))}
          <label
            title={t("channels.color.custom")}
            className="relative cursor-pointer"
          >
            <input
              ref={customColorRef}
              type="color"
              value={color.startsWith("#") ? color : "#6366f1"}
              onChange={(e) => setColor(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
            <span
              className={cn(
                "flex h-4 w-4 items-center justify-center rounded-full border border-dashed text-[9px] transition hover:scale-110",
                color.startsWith("#") ? "border-primary ring-2 ring-offset-1 ring-primary" : "border-muted-foreground/40",
              )}
              style={color.startsWith("#") ? { backgroundColor: color } : undefined}
            >
              {!color.startsWith("#") && "✚"}
            </span>
          </label>
        </div>
        <Button size="sm" onClick={handleCreate} disabled={!name.trim()} className="gap-1.5 shrink-0">
          <Plus className="h-3.5 w-3.5" />
          {t("channels.group.create")}
        </Button>
        <button
          type="button"
          className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
          title={t("channels.group.batchCreate")}
          onClick={() => setShowBatch((v) => !v)}
        >
          <ChevronsDownUp className={cn("h-4 w-4 transition", showBatch && "rotate-180")} />
        </button>
      </div>

      {/* Batch create area */}
      {showBatch && (
        <div className="rounded-xl border bg-muted/30 p-3 space-y-2">
          <div className="text-xs font-medium">{t("channels.group.batchCreate")}</div>
          <div className="text-[11px] text-muted-foreground">{t("channels.group.batchCreateHint")}</div>
          <textarea
            value={batchText}
            onChange={(e) => setBatchText(e.target.value)}
            placeholder={t("channels.group.batchCreatePlaceholder")}
            className="w-full min-h-[120px] resize-y rounded-lg border bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => { setShowBatch(false); setBatchText(""); }}>
              {t("channels.group.batchCancel")}
            </Button>
            <Button size="sm" onClick={handleBatchSubmit} disabled={!batchText.trim()} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              {t("channels.group.batchConfirm")}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {store.groups.length ? (
          store.groups.map((group, idx) => (
            <GroupRow
              key={group.id}
              group={group}
              index={idx}
              total={groupCounts.get(group.id) ?? 0}
              isDragOver={dragOverIdx === idx}
              onUpdate={onUpdateGroup}
              onDelete={onDeleteGroup}
              onDragStart={() => { setDragFromIdx(idx); setDragOverIdx(null); }}
              onDragOver={(e: React.DragEvent) => { e.preventDefault(); setDragOverIdx(idx); }}
              onDrop={() => handleDrop(idx)}
              onDragEnd={() => { setDragFromIdx(null); setDragOverIdx(null); }}
            />
          ))
        ) : (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            {t("channels.group.empty")}
          </div>
        )}
      </div>
    </div>
  );
}

function GroupRow({
  group,
  total,
  isDragOver,
  onUpdate,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  group: AiChannelGroup;
  index: number;
  total: number;
  isDragOver: boolean;
  onUpdate: (
    groupId: string,
    patch: Partial<{ name: string; color: string; collapsed: boolean; keywords: string[] }>,
  ) => void;
  onDelete: (groupId: string) => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
}) {
  const t = useT();
  const dot = colorDotProps(group.color);
  const [name, setName] = useState(group.name);
  const [kwRaw, setKwRaw] = useState((group.keywords ?? []).join(", "));
  useEffect(() => { setName(group.name); }, [group.name]);
  useEffect(() => { setKwRaw((group.keywords ?? []).join(", ")); }, [group.keywords]);

  const commitName = () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === group.name) { setName(group.name); return; }
    onUpdate(group.id, { name: trimmed });
  };

  const commitKeywords = () => {
    const parsed = parseKeywords(kwRaw);
    const current = group.keywords ?? [];
    const same = parsed.length === current.length && parsed.every((k, i) => k === current[i]);
    if (same) return;
    setKwRaw(parsed.join(", "));
    onUpdate(group.id, { keywords: parsed });
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        "rounded-xl border bg-background transition hover:border-primary/25 hover:shadow-sm",
        isDragOver && "border-primary/50 ring-2 ring-primary/20",
      )}
    >
      {/* Name row */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <GripVertical className="h-3.5 w-3.5 shrink-0 cursor-grab text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing" />
        <span className={cn("h-3.5 w-3.5 shrink-0 rounded-full", dot.className)} style={dot.style} />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLInputElement).blur(); }
            else if (e.key === "Escape") { setName(group.name); (e.target as HTMLInputElement).blur(); }
          }}
          className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground focus:ring-0"
        />
        <span
          className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1"
          style={group.color.startsWith("#")
            ? { backgroundColor: group.color + "26", color: group.color, boxShadow: `0 0 0 1px ${group.color}40` }
            : undefined}
        >
          {total}
        </span>
        {/* Color picker: swatches + custom hex */}
        <div className="flex shrink-0 items-center gap-0.5 rounded-lg border bg-background px-1.5 py-1">
          {COLOR_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              title={t(opt.labelKey)}
              onClick={() => onUpdate(group.id, { color: opt.id })}
              className={cn(
                "h-3.5 w-3.5 rounded-full transition hover:scale-110",
                opt.dot,
                group.color === opt.id && "ring-2 ring-offset-1 ring-primary",
              )}
            />
          ))}
          <label title={t("channels.color.custom")} className="relative cursor-pointer">
            <input
              type="color"
              value={group.color.startsWith("#") ? group.color : "#6366f1"}
              onChange={(e) => onUpdate(group.id, { color: e.target.value })}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
            <span
              className={cn(
                "flex h-3.5 w-3.5 items-center justify-center rounded-full border border-dashed text-[8px] transition hover:scale-110",
                group.color.startsWith("#") ? "border-primary ring-2 ring-offset-1 ring-primary" : "border-muted-foreground/40",
              )}
              style={group.color.startsWith("#") ? { backgroundColor: group.color } : undefined}
            >
              {!group.color.startsWith("#") && "✚"}
            </span>
          </label>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-lg p-1.5 text-muted-foreground/60 transition hover:bg-destructive/10 hover:text-destructive"
          title={t("channels.group.delete")}
          onClick={() => {
            if (!window.confirm(t("channels.group.confirmDelete", group.name))) return;
            onDelete(group.id);
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {/* Keywords row */}
      <div className="border-t px-3 pb-2.5 pt-2">
        <input
          value={kwRaw}
          onChange={(e) => setKwRaw(e.target.value)}
          onBlur={commitKeywords}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }}
          placeholder={t("channels.group.keywordsPlaceholder")}
          className="w-full bg-transparent text-[11px] text-muted-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-0"
        />
      </div>
    </div>
  );
}
