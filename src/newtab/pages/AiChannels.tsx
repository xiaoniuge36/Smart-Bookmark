import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Settings2 } from "lucide-react";
import { useT } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getTree } from "@/lib/bookmarks";
import {
  loadAiChannelStore,
  resolveAiChannelSources,
  saveAiChannelStore,
  scanAiChannels,
  statusOrder,
} from "@/lib/aiChannels";
import {
  autoClassifyRecords,
  batchCreateGroups,
  createAiChannelGroup,
  deleteAiChannelGroup,
  parseBatchGroupText,
  updateAiChannelGroup,
} from "@/lib/aiChannelGroups";
import { setSettings } from "@/lib/storage";
import {
  applyImportData,
  applyRemoteSyncChange,
  buildExportData,
  debouncedSyncSave,
  mergeSyncIntoStore,
  subscribeToSyncChanges,
  syncLoad,
  syncSave,
  type ChannelExportData,
} from "@/lib/aiChannelSync";
import { downloadAiChannelShareHtml } from "@/lib/aiChannelHtmlExport";
import type { AiChannelRecord, AiChannelStore, BookmarkNode, Settings } from "@/types";
import { toast } from "@/components/ui/toast";
import ChannelManagePanel from "./ai-channels/ChannelManagePanel";
import ChannelToolbar from "./ai-channels/ChannelToolbar";
import ChannelWorkspace from "./ai-channels/ChannelWorkspace";
import { PRICE_TAG_ORDER, UNGROUPED_ID, compareNotePrice, type StatusFilter } from "./ai-channels/meta";

export default function AiChannels({ settings }: { settings: Settings }) {
  const t = useT();
  const [tree, setTree] = useState<BookmarkNode[]>([]);
  const [store, setStore] = useState<AiChannelStore>({
    recordsById: {},
    groups: [],
  });
  const [sourceRefs, setSourceRefs] = useState<string[]>(
    settings.aiChannelSources ?? [],
  );
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [batchIds, setBatchIds] = useState<string[]>([]);
  const storeRef = useRef(store);
  useEffect(() => { storeRef.current = store; }, [store]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [activeGroupId, setActiveGroupId] = useState("all");
  const [selectedId, setSelectedId] = useState("");
  const title = settings.collectionBoardName?.trim() || t("tabs.channels");

  useEffect(() => {
    setSourceRefs(settings.aiChannelSources ?? []);
  }, [settings.aiChannelSources]);

  useEffect(() => {
    let alive = true;
    Promise.all([getTree(), loadAiChannelStore(), syncLoad()]).then(
      ([nextTree, nextStore, syncData]) => {
        if (!alive) return;
        setTree(nextTree);
        setStore(mergeSyncIntoStore(nextStore, syncData));
        setLoading(false);
      },
    );
    return () => {
      alive = false;
    };
  }, []);

  // Real-time multi-device sync listener
  useEffect(() => {
    return subscribeToSyncChanges((payload) => {
      setStore((current) => {
        const next = applyRemoteSyncChange(current, payload);
        if (next !== current) void saveAiChannelStore(next);
        return next;
      });
    });
  }, []);

  useEffect(() => {
    const reload = () => getTree().then(setTree);
    chrome.bookmarks?.onChanged?.addListener(reload);
    chrome.bookmarks?.onCreated?.addListener(reload);
    chrome.bookmarks?.onRemoved?.addListener(reload);
    chrome.bookmarks?.onMoved?.addListener(reload);
    return () => {
      chrome.bookmarks?.onChanged?.removeListener(reload);
      chrome.bookmarks?.onCreated?.removeListener(reload);
      chrome.bookmarks?.onRemoved?.removeListener(reload);
      chrome.bookmarks?.onMoved?.removeListener(reload);
    };
  }, []);

  const persistStore = useCallback(async (next: AiChannelStore) => {
    const saved = await saveAiChannelStore(next);
    void syncSave(saved);
    setStore(saved);
    return saved;
  }, []);

  const handleExport = useCallback(() => {
    const data = buildExportData(storeRef.current);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `smart-bookmark-channels-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, []);

  const handleExportHtml = useCallback(() => {
    const locale = document.documentElement.lang.startsWith("zh") ? "zh" : "en";
    downloadAiChannelShareHtml(storeRef.current, { title, locale });
  }, [title]);

  const handleImport = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as ChannelExportData;
        if (data.version !== 2 || !Array.isArray(data.groups)) {
          toast(t("channels.sync.importInvalid"), "error");
          return;
        }
        setStore((current) => {
          const next = applyImportData(current, data);
          void saveAiChannelStore(next);
          void syncSave(next);
          return next;
        });
        toast(t("channels.sync.importDone"), "success");
      } catch {
        toast(t("channels.sync.importInvalid"), "error");
      }
    };
    reader.readAsText(file);
  }, [t]);

  const syncSources = useCallback(async (refs: string[]) => {
    const next = Array.from(
      new Set(refs.map((ref) => ref.trim()).filter(Boolean)),
    );
    setSourceRefs(next);
    await setSettings({ aiChannelSources: next });
  }, []);

  const performScan = useCallback(async () => {
    if (!tree.length) return;
    setScanning(true);
    try {
      const result = scanAiChannels(tree, sourceRefs, storeRef.current);
      const saved = await persistStore(result.store);
      setSelectedId((current) =>
        current && saved.recordsById[current]
          ? current
          : Object.keys(saved.recordsById)[0] ?? "",
      );
      if (result.scannedCount > 0) {
        toast(t("channels.scan.done", String(result.scannedCount)), "success");
      }
    } finally {
      setScanning(false);
    }
  }, [persistStore, sourceRefs, tree]);

  useEffect(() => {
    if (!loading && tree.length) void performScan();
  }, [loading, performScan, tree.length]);

  const records = useMemo(() => {
    return Object.values(store.recordsById).sort((a, b) => {
      if (a.present !== b.present) return a.present ? -1 : 1;
      const byPrice = PRICE_TAG_ORDER[a.priceTag ?? "none"] - PRICE_TAG_ORDER[b.priceTag ?? "none"];
      if (byPrice) return byPrice;
      const byNotePrice = compareNotePrice(a.note, b.note);
      if (byNotePrice) return byNotePrice;
      const byStatus = statusOrder(a.status) - statusOrder(b.status);
      if (byStatus) return byStatus;
      return a.title.localeCompare(b.title);
    });
  }, [store.recordsById]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((record) => {
      if (statusFilter !== "all" && record.status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      return `${record.title} ${record.url} ${record.folderPath} ${record.sourceFolderPath} ${record.note}`
        .toLowerCase()
        .includes(q);
    });
  }, [query, records, statusFilter]);

  const selected = useMemo(
    () => records.find((record) => record.bookmarkId === selectedId),
    [records, selectedId],
  );

  const visibleForSelection = useMemo(() => {
    if (activeGroupId === "all") return filtered;
    if (activeGroupId === UNGROUPED_ID) return filtered.filter((r) => !r.groupId);
    return filtered.filter((r) => r.groupId === activeGroupId);
  }, [activeGroupId, filtered]);

  useEffect(() => {
    if (!visibleForSelection.length) return;
    if (
      !selectedId ||
      !visibleForSelection.some((record) => record.bookmarkId === selectedId)
    ) {
      setSelectedId(visibleForSelection[0].bookmarkId);
    }
  }, [visibleForSelection, selectedId]);

  const sourceStatus = useMemo(
    () => resolveAiChannelSources(tree, sourceRefs),
    [sourceRefs, tree],
  );

  const patchRecord = useCallback(
    (id: string, patch: Partial<AiChannelRecord>) => {
      setStore((current) => {
        const prev = current.recordsById[id];
        if (!prev) return current;
        const next = {
          ...current,
          recordsById: { ...current.recordsById, [id]: { ...prev, ...patch, annotationUpdatedAt: Date.now() } },
        };
        void saveAiChannelStore(next);
        debouncedSyncSave(next);
        return next;
      });
    },
    [],
  );

  const toggleGroupCollapsed = useCallback((groupId: string) => {
    setStore((current) => {
      const next = updateAiChannelGroup(current, groupId, {
        collapsed: !current.groups.find((g) => g.id === groupId)?.collapsed,
      });
      void saveAiChannelStore(next);
      return next;
    });
  }, []);

  const addGroup = useCallback((name: string, color: string) => {
    setStore((current) => {
      const next = createAiChannelGroup(current, name, color);
      void saveAiChannelStore(next);
      void syncSave(next);
      return next;
    });
  }, []);

  const updateGroup = useCallback(
    (
      groupId: string,
      patch: Partial<{ name: string; color: string; collapsed: boolean; keywords: string[] }>,
    ) => {
      setStore((current) => {
        const next = updateAiChannelGroup(current, groupId, patch);
        void saveAiChannelStore(next);
        void syncSave(next);
        return next;
      });
    },
    [],
  );

  const removeGroup = useCallback((groupId: string) => {
    setStore((current) => {
      const next = deleteAiChannelGroup(current, groupId);
      void saveAiChannelStore(next);
      void syncSave(next);
      return next;
    });
  }, []);

  const reorderGroups = useCallback((fromIndex: number, toIndex: number) => {
    setStore((current) => {
      const groups = [...current.groups];
      const [moved] = groups.splice(fromIndex, 1);
      groups.splice(toIndex, 0, moved);
      const next = { ...current, groups };
      void saveAiChannelStore(next);
      void syncSave(next);
      return next;
    });
  }, []);

  const handleBatchCreate = useCallback((text: string) => {
    const items = parseBatchGroupText(text);
    if (!items.length) return;
    setStore((current) => {
      const next = batchCreateGroups(current, items);
      void saveAiChannelStore(next);
      void syncSave(next);
      return next;
    });
  }, []);

  const handleAutoClassify = useCallback(() => {
    setStore((current) => {
      const { store: next, updatedCount } = autoClassifyRecords(current);
      void saveAiChannelStore(next);
      void syncSave(next);
      if (updatedCount > 0) {
        toast(t("channels.group.autoClassifyDone", String(updatedCount)), "success");
      } else {
        toast(t("channels.group.autoClassifyNone"), "info");
      }
      return next;
    });
  }, [t]);

  const toggleBatchSelect = useCallback((id: string) => {
    setBatchIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const clearBatch = useCallback(() => setBatchIds([]), []);

  const batchAssignGroup = useCallback(
    (groupId: string | undefined) => {
      if (!batchIds.length) return;
      setStore((current) => {
        const recordsById = { ...current.recordsById };
        for (const id of batchIds) {
          if (recordsById[id]) recordsById[id] = { ...recordsById[id], groupId };
        }
        const next = { ...current, recordsById };
        void saveAiChannelStore(next);
        return next;
      });
      setBatchIds([]);
    },
    [batchIds],
  );

  const stats = useMemo(() => {
    const present = records.filter((record) => record.present);
    return {
      total: present.length,
      pending: present.filter((record) => record.status === "pending").length,
      highRisk: present.filter((record) => record.risk === "high").length,
      ungrouped: present.filter((record) => !record.groupId).length,
    };
  }, [records]);

  const groupCounts = useMemo(() => {
    const counts = new Map<string, number>();
    counts.set("all", filtered.filter((record) => record.present).length);
    counts.set(
      UNGROUPED_ID,
      filtered.filter((record) => record.present && !record.groupId).length,
    );
    for (const group of store.groups) counts.set(group.id, 0);
    for (const record of filtered) {
      if (!record.present || !record.groupId) continue;
      counts.set(record.groupId, (counts.get(record.groupId) ?? 0) + 1);
    }
    return counts;
  }, [filtered, store.groups]);

  const changeGroup = useCallback((id: string) => {
    setActiveGroupId(id);
    setSelectedId("");
  }, []);

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-3">
      <Card className="shrink-0 overflow-hidden border-b-0 shadow-none">
        <ChannelToolbar
          title={title}
          loading={loading}
          scanning={scanning}
          query={query}
          statusFilter={statusFilter}
          stats={stats}
          onScan={performScan}
          onOpenManage={() => setShowManageDialog(true)}
          onQueryChange={setQuery}
          onStatusFilterChange={setStatusFilter}
        />
      </Card>

      <ChannelWorkspace
        loading={loading}
        records={filtered}
        selected={selected}
        selectedId={selectedId}
        activeGroupId={activeGroupId}
        groupFocusVersion={0}
        groups={store.groups}
        groupCounts={groupCounts}
        batchIds={batchIds}
        onGroupChange={changeGroup}
        onSelect={setSelectedId}
        onToggleGroup={toggleGroupCollapsed}
        onPatch={patchRecord}
        onToggleBatch={toggleBatchSelect}
        onBatchAssign={batchAssignGroup}
        onClearBatch={clearBatch}
      />

      <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto scrollbar-thin">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              {t("channels.manage")}
            </DialogTitle>
          </DialogHeader>
          <ChannelManagePanel
            tree={tree}
            sourceRefs={sourceRefs}
            sources={sourceStatus}
            loading={loading}
            scanning={scanning}
            store={store}
            groupCounts={groupCounts}
            onChangeSources={syncSources}
            onScan={performScan}
            onCreateGroup={addGroup}
            onUpdateGroup={updateGroup}
            onDeleteGroup={removeGroup}
            onToggleCollapsed={toggleGroupCollapsed}
            onAutoClassify={handleAutoClassify}
            onBatchCreate={handleBatchCreate}
            onReorderGroups={reorderGroups}
            onExport={handleExport}
            onExportHtml={handleExportHtml}
            onImport={handleImport}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
