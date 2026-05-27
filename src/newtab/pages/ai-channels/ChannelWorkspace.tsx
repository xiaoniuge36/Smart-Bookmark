import { useMemo, useState } from "react";
import { CheckSquare2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { colorDotProps, colorOptionDot, UNGROUPED_ID } from "./meta";
import type { AiChannelGroup, AiChannelRecord } from "@/types";
import ChannelDetail from "./ChannelDetail";
import ChannelList from "./ChannelList";
import SelectMenu, { type SelectMenuOption } from "./SelectMenu";

interface ChannelWorkspaceProps {
  loading: boolean;
  records: AiChannelRecord[];
  selected?: AiChannelRecord;
  selectedId: string;
  activeGroupId: string;
  groupFocusVersion: number;
  groups: AiChannelGroup[];
  groupCounts: Map<string, number>;
  batchIds: string[];
  onGroupChange: (groupId: string) => void;
  onSelect: (id: string) => void;
  onToggleGroup: (id: string) => void;
  onPatch: (id: string, patch: Partial<AiChannelRecord>) => void;
  onToggleBatch: (id: string) => void;
  onBatchAssign: (groupId: string | undefined) => void;
  onClearBatch: () => void;
}

export default function ChannelWorkspace({
  loading,
  records,
  selected,
  selectedId,
  activeGroupId,
  groupFocusVersion,
  groups,
  groupCounts,
  batchIds,
  onGroupChange,
  onSelect,
  onToggleGroup,
  onPatch,
  onToggleBatch,
  onBatchAssign,
  onClearBatch,
}: ChannelWorkspaceProps) {
  const t = useT();
  const isSingleGroup = activeGroupId !== "all";
  const [pendingGroupId, setPendingGroupId] = useState<string>(UNGROUPED_ID);

  const visibleRecords = useMemo(() => {
    if (!isSingleGroup) return records;
    if (activeGroupId === UNGROUPED_ID) return records.filter((r) => !r.groupId);
    return records.filter((r) => r.groupId === activeGroupId);
  }, [activeGroupId, isSingleGroup, records]);

  const groupOptions: SelectMenuOption[] = [
    { value: UNGROUPED_ID, label: t("channels.group.ungrouped"), dotClassName: "bg-slate-400" },
    ...groups.map((g) => ({
      value: g.id,
      label: g.name,
      ...colorOptionDot(g.color),
    })),
  ];

  const batchSet = useMemo(() => new Set(batchIds), [batchIds]);

  const handleBatchApply = () => {
    onBatchAssign(pendingGroupId === UNGROUPED_ID ? undefined : pendingGroupId);
    setPendingGroupId(UNGROUPED_ID);
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-2.5">
      <div className="shrink-0 overflow-x-auto">
        <div className="flex items-center gap-1 pb-1">
          <GroupTab
            active={activeGroupId === "all"}
            label={t("channels.group.filterAll")}
            count={groupCounts.get("all") ?? 0}
            onClick={() => onGroupChange("all")}
          />
          <GroupTab
            active={activeGroupId === UNGROUPED_ID}
            label={t("channels.group.ungrouped")}
            count={groupCounts.get(UNGROUPED_ID) ?? 0}
            onClick={() => onGroupChange(UNGROUPED_ID)}
          />
          {groups.map((group) => {
            const dotP = colorDotProps(group.color);
            return (
              <GroupTab
                key={group.id}
                active={activeGroupId === group.id}
                label={group.name}
                count={groupCounts.get(group.id) ?? 0}
                dotClassName={dotP.className}
                dotStyle={dotP.style}
                onClick={() => onGroupChange(group.id)}
              />
            );
          })}
        </div>
      </div>

      <div className="relative grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="flex h-full min-h-0 flex-col overflow-hidden border-border/80 bg-card/80 shadow-sm">
          <div className="flex shrink-0 items-center justify-between border-b bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            <span>{t("channels.workspace.total", String(visibleRecords.length))}</span>
            {batchIds.length > 0 && (
              <span className="flex items-center gap-1 font-medium text-primary">
                <CheckSquare2 className="h-3.5 w-3.5" />
                {t("channels.batch.selected", String(batchIds.length))}
              </span>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2.5 scrollbar-thin">
            {loading ? (
              <div className="flex h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                {t("channels.workspace.loading")}
              </div>
            ) : (
              <ChannelList
                records={visibleRecords}
                groups={groups}
                selectedId={selectedId}
                activeGroupId={activeGroupId}
                groupFocusVersion={groupFocusVersion}
                isSingleGroup={isSingleGroup}
                batchSet={batchSet}
                onSelect={onSelect}
                onToggleGroup={onToggleGroup}
                onPatch={onPatch}
                onToggleBatch={onToggleBatch}
              />
            )}
          </div>

          {/* Batch action bar — floats above list bottom when items are selected */}
          {batchIds.length > 0 && (
            <div className="shrink-0 border-t bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">
                  {t("channels.batch.assignLabel")}
                </span>
                <SelectMenu
                  value={pendingGroupId}
                  options={groupOptions}
                  placeholder={t("channels.detail.selectGroup")}
                  onChange={setPendingGroupId}
                  className="h-8 min-w-[140px]"
                  align="start"
                />
                <Button size="sm" onClick={handleBatchApply} className="h-8">
                  {t("channels.batch.apply")}
                </Button>
                <button
                  type="button"
                  onClick={onClearBatch}
                  className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                  {t("channels.batch.clear")}
                </button>
              </div>
            </div>
          )}
        </Card>

        <ChannelDetail record={selected} groups={groups} onPatch={onPatch} />
      </div>
    </div>
  );
}

function GroupTab({
  active,
  label,
  count,
  dotClassName,
  dotStyle,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  dotClassName?: string;
  dotStyle?: React.CSSProperties;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
        active
          ? "border-primary bg-primary/10 text-primary shadow-sm"
          : "border-transparent bg-muted/60 text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground",
      )}
    >
      {(dotClassName || dotStyle) && <span className={cn("h-2 w-2 rounded-full", dotClassName)} style={dotStyle} />}
      <span>{label}</span>
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
          active ? "bg-primary/15 text-primary" : "bg-background text-muted-foreground",
        )}
      >
        {count}
      </span>
    </button>
  );
}
