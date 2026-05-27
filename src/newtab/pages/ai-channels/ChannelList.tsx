import { useEffect, useMemo, useRef } from "react";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import {
  CATEGORY_KEY,
  PRICE_TAG_META,
  STATUS_META,
  UNGROUPED_ID,
  colorDotProps,
  colorOptionDot,
} from "./meta";
import { cn, faviconOf, hostnameOf } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import type { AiChannelGroup, AiChannelRecord } from "@/types";
import SelectMenu, { type SelectMenuOption } from "./SelectMenu";

interface ChannelListProps {
  records: AiChannelRecord[];
  groups: AiChannelGroup[];
  selectedId: string;
  activeGroupId: string;
  groupFocusVersion: number;
  isSingleGroup?: boolean;
  batchSet: Set<string>;
  onSelect: (id: string) => void;
  onToggleGroup: (id: string) => void;
  onPatch: (id: string, patch: Partial<AiChannelRecord>) => void;
  onToggleBatch: (id: string) => void;
}

export default function ChannelList({
  records,
  groups,
  selectedId,
  activeGroupId,
  groupFocusVersion,
  isSingleGroup = false,
  batchSet,
  onSelect,
  onToggleGroup,
  onPatch,
  onToggleBatch,
}: ChannelListProps) {
  const t = useT();
  const topRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const groupOptions: SelectMenuOption[] = [
    { value: UNGROUPED_ID, label: t("channels.group.ungrouped"), dotClassName: "bg-slate-400" },
    ...groups.map((group) => ({
      value: group.id,
      label: group.name,
      ...colorOptionDot(group.color),
    })),
  ];

  const sections = useMemo(() => {
    const byGroup = new Map<string, AiChannelRecord[]>();
    for (const record of records) {
      const key = record.groupId || UNGROUPED_ID;
      if (!byGroup.has(key)) byGroup.set(key, []);
      byGroup.get(key)!.push(record);
    }
    const grouped: Array<{
      group: AiChannelGroup | null;
      items: AiChannelRecord[];
    }> = groups.map((group) => ({
      group,
      items: byGroup.get(group.id) ?? [],
    }));
    grouped.push({
      group: null,
      items: byGroup.get(UNGROUPED_ID) ?? [],
    });
    return grouped.filter((section) => section.items.length > 0);
  }, [groups, records]);

  useEffect(() => {
    if (isSingleGroup) return;
    const target =
      activeGroupId === "all" ? topRef.current : sectionRefs.current[activeGroupId];
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeGroupId, groupFocusVersion, isSingleGroup, sections.length]);

  if (isSingleGroup) {
    return (
      <div ref={topRef} className="grid grid-cols-1 gap-2 md:grid-cols-2 2xl:grid-cols-3">
        {records.length ? (
          records.map((record) => (
            <ChannelRow
              key={record.bookmarkId}
              record={record}
              selected={record.bookmarkId === selectedId}
              batchSelected={batchSet.has(record.bookmarkId)}
              groupOptions={groupOptions}
              onSelect={onSelect}
              onPatch={onPatch}
              onToggleBatch={onToggleBatch}
            />
          ))
        ) : (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            {t("channels.list.empty")}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={topRef} className="space-y-4">
      {sections.length ? (
        sections.map((section) => (
          <GroupSection
            key={section.group?.id ?? UNGROUPED_ID}
            sectionId={section.group?.id ?? UNGROUPED_ID}
            group={section.group}
            items={section.items}
            selectedId={selectedId}
            batchSet={batchSet}
            onSelect={onSelect}
            onToggleGroup={onToggleGroup}
            groupOptions={groupOptions}
            onPatch={onPatch}
            onToggleBatch={onToggleBatch}
            setSectionRef={(id, node) => {
              sectionRefs.current[id] = node;
            }}
          />
        ))
      ) : (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          {t("channels.list.empty")}
        </div>
      )}
    </div>
  );
}

function GroupSection({
  sectionId,
  group,
  items,
  selectedId,
  batchSet,
  onSelect,
  onToggleGroup,
  groupOptions,
  onPatch,
  onToggleBatch,
  setSectionRef,
}: {
  sectionId: string;
  group: AiChannelGroup | null;
  items: AiChannelRecord[];
  selectedId: string;
  batchSet: Set<string>;
  onSelect: (id: string) => void;
  onToggleGroup: (id: string) => void;
  groupOptions: SelectMenuOption[];
  onPatch: (id: string, patch: Partial<AiChannelRecord>) => void;
  onToggleBatch: (id: string) => void;
  setSectionRef: (id: string, node: HTMLElement | null) => void;
}) {
  const t = useT();
  const collapsed = !!group?.collapsed;
  const dotP = group ? colorDotProps(group.color) : null;
  return (
    <section
      ref={(node) => setSectionRef(sectionId, node)}
      className="scroll-mt-3 rounded-xl border bg-card"
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 border-b px-4 py-3 text-left"
        onClick={() => {
          if (!group) return;
          onToggleGroup(group.id);
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-md ring-1",
              group ? "bg-muted text-foreground ring-border" : "bg-muted text-muted-foreground ring-border",
            )}
          >
            <span
              className={cn("h-2.5 w-2.5 rounded-full", dotP ? dotP.className : "bg-muted-foreground")}
              style={dotP?.style}
            />
          </span>
          <div>
            <div className="text-sm font-semibold">
              {group ? group.name : t("channels.group.ungrouped")}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {group ? t("channels.list.customGroup") : t("channels.list.noGroupAssigned")} · {t("channels.list.count", String(items.length))}
            </div>
          </div>
        </div>
        {group && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </span>
        )}
      </button>
      {!collapsed && (
        <div className="grid grid-cols-1 gap-2 p-2 md:grid-cols-2 2xl:grid-cols-3">
          {items.map((record) => (
            <ChannelRow
              key={record.bookmarkId}
              record={record}
              selected={record.bookmarkId === selectedId}
              batchSelected={batchSet.has(record.bookmarkId)}
              groupOptions={groupOptions}
              onSelect={onSelect}
              onPatch={onPatch}
              onToggleBatch={onToggleBatch}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ChannelRow({
  record,
  selected,
  batchSelected,
  groupOptions,
  onSelect,
  onPatch,
  onToggleBatch,
}: {
  record: AiChannelRecord;
  selected: boolean;
  batchSelected: boolean;
  groupOptions: SelectMenuOption[];
  onSelect: (id: string) => void;
  onPatch: (id: string, patch: Partial<AiChannelRecord>) => void;
  onToggleBatch: (id: string) => void;
}) {
  const t = useT();
  const status = STATUS_META[record.status];
  const priceTag = PRICE_TAG_META[record.priceTag ?? "none"];
  const StatusIcon = status.Icon;
  const openRecord = () => {
    window.open(record.url, "_blank", "noopener,noreferrer");
  };
  return (
    <div
      className={cn(
        "group/channel relative flex min-h-[128px] flex-col gap-2 rounded-lg border bg-background/80 px-2.5 py-2 transition hover:border-primary/30 hover:bg-accent/45 hover:shadow-sm",
        selected && "border-primary/45 bg-primary/[0.06] ring-1 ring-primary/15",
        batchSelected && "border-primary/60 bg-primary/8 ring-1 ring-primary/30",
        !record.present && "opacity-60",
      )}
    >
      {/* Top row: checkbox + favicon + title + url */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(record.bookmarkId)}
        onKeyDown={(e) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          onSelect(record.bookmarkId);
        }}
        className="flex min-w-0 items-start gap-2 pr-8 text-left"
      >
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleBatch(record.bookmarkId); }}
          onKeyDown={(e) => e.stopPropagation()}
          className={cn(
            "mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border-2 transition",
            batchSelected
              ? "border-primary bg-primary text-white"
              : "border-muted-foreground/30 hover:border-primary/60",
          )}
          aria-label="select"
        >
          {batchSelected && (
            <svg viewBox="0 0 10 8" className="h-2 w-2 fill-current"><path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
          )}
        </button>
        <img
          src={faviconOf(record.url)}
          alt=""
          className="h-5 w-5 shrink-0 rounded"
          onError={(e) => (e.currentTarget.style.visibility = "hidden")}
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-semibold leading-snug">{record.title}</div>
          <div className="truncate text-[10px] text-muted-foreground">
            {hostnameOf(record.url)}
          </div>
        </div>
      </div>

      {/* Quick open */}
      <button
        type="button"
        onClick={openRecord}
        title={t("channels.detail.open")}
        aria-label={`${t("channels.detail.open")} ${record.title}`}
        className="absolute right-2.5 top-2 inline-flex h-7 w-7 items-center justify-center rounded-md border bg-background/85 text-muted-foreground opacity-80 shadow-sm transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary group-hover/channel:opacity-100"
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </button>

      {/* Note */}
      {record.note?.trim() && (
        <div className="rounded bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 leading-snug">
          {record.note}
        </div>
      )}

      {/* Tags row */}
      <div className="flex flex-wrap gap-1">
        <span className={cn("inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] ring-1", status.className)}>
          <StatusIcon className="mr-0.5 h-2.5 w-2.5" />
          {t(status.labelKey)}
        </span>
        {(record.priceTag ?? "none") !== "none" && (
          <span className={cn("inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ring-1", priceTag.className)}>
            {t(priceTag.labelKey)}
          </span>
        )}
        <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground ring-1 ring-border">
          {t(CATEGORY_KEY[record.category])}
        </span>
      </div>

      {/* Group selector */}
      <SelectMenu
        value={record.groupId ?? UNGROUPED_ID}
        options={groupOptions}
        placeholder={t("channels.list.selectGroup")}
        className="h-7 w-full justify-between rounded-lg text-[11px]"
        contentClassName="min-w-[11rem]"
        onChange={(value) =>
          onPatch(record.bookmarkId, {
            groupId: value === UNGROUPED_ID ? undefined : value,
          })
        }
      />
    </div>
  );
}
