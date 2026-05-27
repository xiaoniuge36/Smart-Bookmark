import { useRef } from "react";
import { Download, RefreshCw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import type { ResolvedAiChannelSource } from "@/lib/aiChannels";
import type { AiChannelStore, BookmarkNode } from "@/types";
import GroupManager from "./GroupManager";
import SourcePicker from "./SourcePicker";

interface ChannelManagePanelProps {
  tree: BookmarkNode[];
  sourceRefs: string[];
  sources: ResolvedAiChannelSource[];
  loading: boolean;
  scanning: boolean;
  store: AiChannelStore;
  groupCounts: Map<string, number>;
  onChangeSources: (refs: string[]) => void;
  onScan: () => void;
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
  onExport: () => void;
  onImport: (file: File) => void;
}

export default function ChannelManagePanel({
  tree,
  sourceRefs,
  sources,
  loading,
  scanning,
  store,
  groupCounts,
  onChangeSources,
  onScan,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onToggleCollapsed,
  onAutoClassify,
  onBatchCreate,
  onReorderGroups,
  onExport,
  onImport,
}: ChannelManagePanelProps) {
  const t = useT();
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-6">
      <SourcePicker
        tree={tree}
        sourceRefs={sourceRefs}
        sources={sources}
        loading={loading}
        scanning={scanning}
        onChangeSources={onChangeSources}
        onScan={onScan}
      />
      <hr className="border-border" />
      <GroupManager
        store={store}
        groupCounts={groupCounts}
        onCreateGroup={onCreateGroup}
        onUpdateGroup={onUpdateGroup}
        onDeleteGroup={onDeleteGroup}
        onToggleCollapsed={onToggleCollapsed}
        onAutoClassify={onAutoClassify}
        onBatchCreate={onBatchCreate}
        onReorderGroups={onReorderGroups}
      />
      <hr className="border-border" />
      <div className="space-y-3">
        <div>
          <div className="mb-1 text-sm font-semibold">{t("channels.sync.title")}</div>
          <div className="text-xs text-muted-foreground">{t("channels.sync.subtitle")}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={onExport}>
            <Download className="h-3.5 w-3.5" />
            {t("channels.sync.export")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5" />
            {t("channels.sync.import")}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImport(file);
              e.target.value = "";
            }}
          />
        </div>
        <div className="flex items-start gap-2 rounded-lg border border-dashed p-3 text-[11px] text-muted-foreground">
          <RefreshCw className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{t("channels.sync.hint")}</span>
        </div>
      </div>
    </div>
  );
}
