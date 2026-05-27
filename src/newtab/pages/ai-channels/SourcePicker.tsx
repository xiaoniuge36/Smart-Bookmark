import { useMemo, useState } from "react";
import { FolderPlus, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { allFolders } from "@/lib/bookmarks";
import type { BookmarkNode } from "@/types";
import type { ResolvedAiChannelSource } from "@/lib/aiChannels";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import SelectMenu, { type SelectMenuOption } from "./SelectMenu";

interface SourcePickerProps {
  tree: BookmarkNode[];
  sourceRefs: string[];
  sources: ResolvedAiChannelSource[];
  loading: boolean;
  scanning: boolean;
  onChangeSources: (refs: string[]) => void;
  onScan: () => void;
}

export default function SourcePicker({
  tree,
  sourceRefs,
  sources,
  loading,
  scanning,
  onChangeSources,
  onScan,
}: SourcePickerProps) {
  const t = useT();
  const folders = useMemo(
    () => allFolders(tree).filter((folder) => folder.count > 0),
    [tree],
  );
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [manualRef, setManualRef] = useState("");
  const selectedFolderIds = new Set(
    sources.map((source) => source.folder?.id).filter(Boolean) as string[],
  );
  const folderOptions = useMemo<SelectMenuOption[]>(
    () =>
      folders.map((folder) => ({
        value: folder.id,
        label: folder.title,
        description: folder.path,
        disabled: selectedFolderIds.has(folder.id),
      })),
    [folders, selectedFolderIds],
  );

  const addRef = (ref: string) => {
    const nextRef = ref.trim();
    if (!nextRef) return;
    onChangeSources(Array.from(new Set([...sourceRefs, nextRef])));
    setManualRef("");
  };

  const addSelectedFolder = () => {
    if (!selectedFolderId) return;
    addRef(selectedFolderId);
    setSelectedFolderId("");
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">{t("channels.source.title")}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{t("channels.source.subtitle")}</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onScan}
          disabled={loading || scanning}
          className="gap-2"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", scanning && "animate-spin")} />
          {t("channels.source.rescan")}
        </Button>
      </div>

      <div className="grid gap-2 lg:grid-cols-[1fr_auto_1fr_auto]">
        <SelectMenu
          value={selectedFolderId}
          options={folderOptions}
          placeholder={t("channels.source.pickFolder")}
          onChange={setSelectedFolderId}
          align="start"
          className="w-full"
          contentClassName="min-w-[20rem]"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={addSelectedFolder}
          disabled={!selectedFolderId}
          className="gap-1.5"
        >
          <FolderPlus className="h-3.5 w-3.5" />
          {t("channels.source.add")}
        </Button>
        <Input
          value={manualRef}
          placeholder={t("channels.source.manualPlaceholder")}
          onChange={(e) => setManualRef(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addRef(manualRef);
            }
          }}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => addRef(manualRef)}
          disabled={!manualRef.trim()}
        >
          {t("channels.source.manualAdd")}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {sources.length ? (
          sources.map((source) => (
            <span
              key={`${source.ref}-${source.folder?.id ?? source.reason ?? "missing"}`}
              className={cn(
                "inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] ring-1",
                source.folder
                  ? "bg-primary/10 text-primary ring-primary/20"
                  : "bg-destructive/10 text-destructive ring-destructive/20",
              )}
              title={source.folderPath ?? source.reason}
            >
              <span className="truncate">{source.folderPath ?? source.ref}</span>
              <span className="tabular-nums opacity-75">
                {source.folder ? source.count : t("channels.source.notFound")}
              </span>
              <button
                type="button"
                className="rounded-full p-0.5 opacity-70 transition hover:bg-background hover:opacity-100"
                onClick={() =>
                  onChangeSources(sourceRefs.filter((ref) => ref !== source.ref))
                }
                title={t("channels.source.remove")}
              >
                <XCircle className="h-3.5 w-3.5" />
              </button>
            </span>
          ))
        ) : (
          <span className="text-xs text-muted-foreground">
            {t("channels.source.empty")}
          </span>
        )}
      </div>
    </div>
  );
}
