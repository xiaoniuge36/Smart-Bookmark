import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, Save, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import {
  getActiveTabGroups,
  saveTabGroupAsBookmarkFolder,
  tabGroupColorToInternal,
  type ActiveTabGroup,
} from "@/lib/tabGroupsSync";
import { colorMeta } from "./meta";

interface TabGroupsPanelProps {
  defaultSourceFolderId?: string;
  defaultSourceFolderPath?: string;
}

export default function TabGroupsPanel({
  defaultSourceFolderId,
  defaultSourceFolderPath,
}: TabGroupsPanelProps) {
  const t = useT();
  const [groups, setGroups] = useState<ActiveTabGroup[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | "all" | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getActiveTabGroups();
      setGroups(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleSave = useCallback(
    async (group: ActiveTabGroup) => {
      if (!defaultSourceFolderId) {
        toast(t("channels.error.noSource"), "error");
        return;
      }
      setSavingId(group.id);
      try {
        const result = await saveTabGroupAsBookmarkFolder(group, defaultSourceFolderId);
        if (result.folder) {
          toast(
            t("channels.tabGroups.savedToast", String(result.saved), String(result.skipped)),
            "success",
          );
        } else {
          toast(t("channels.error.createFailed"), "error");
        }
      } catch (err) {
        console.warn(err);
        toast(t("channels.error.createFailed"), "error");
      } finally {
        setSavingId(null);
      }
    },
    [defaultSourceFolderId, t],
  );

  const handleSaveAll = useCallback(async () => {
    if (!defaultSourceFolderId || !groups || !groups.length) return;
    setSavingId("all");
    let totalSaved = 0;
    let totalSkipped = 0;
    try {
      for (const g of groups) {
        const r = await saveTabGroupAsBookmarkFolder(g, defaultSourceFolderId);
        totalSaved += r.saved;
        totalSkipped += r.skipped;
      }
      toast(
        t("channels.tabGroups.savedToast", String(totalSaved), String(totalSkipped)),
        "success",
      );
    } finally {
      setSavingId(null);
    }
  }, [defaultSourceFolderId, groups, t]);

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <Tags className="h-3.5 w-3.5" />
            {t("channels.tabGroups.title")}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {t("channels.tabGroups.subtitle")}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" variant="ghost" onClick={refresh} disabled={loading} className="gap-1.5">
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            {t("channels.tabGroups.refresh")}
          </Button>
          <Button
            size="sm"
            onClick={handleSaveAll}
            disabled={
              !defaultSourceFolderId ||
              !groups?.length ||
              savingId !== null
            }
            className="gap-1.5"
          >
            {savingId === "all" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {t("channels.tabGroups.saveAll")}
          </Button>
        </div>
      </div>

      {!defaultSourceFolderId && (
        <div className="rounded-lg border border-dashed border-amber-300/60 bg-amber-50/40 px-3 py-2 text-xs text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
          {t("channels.tabGroups.needSource")}
        </div>
      )}

      {defaultSourceFolderId && defaultSourceFolderPath && (
        <div className="text-[11px] text-muted-foreground">
          {t("channels.tabGroups.targetFolder")}: <span className="font-medium">{defaultSourceFolderPath}</span>
        </div>
      )}

      <div className="space-y-1.5">
        {loading && groups === null ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed py-6 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {t("channels.tabGroups.loading")}
          </div>
        ) : groups && groups.length > 0 ? (
          groups.map((group) => {
            const colorKey = tabGroupColorToInternal(group.color);
            const meta = colorMeta(colorKey);
            const isSaving = savingId === group.id;
            return (
              <div
                key={group.id}
                className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2.5"
              >
                <span className={cn("h-3.5 w-3.5 shrink-0 rounded-full", meta.dot)} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {group.title}
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1",
                    meta.chip,
                  )}
                >
                  {group.tabs.length}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSave(group)}
                  disabled={!defaultSourceFolderId || savingId !== null}
                  className="h-8 gap-1.5 px-2.5"
                >
                  {isSaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  {t("channels.tabGroups.save")}
                </Button>
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">
            {t("channels.tabGroups.empty")}
          </div>
        )}
      </div>
    </div>
  );
}
