import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useT } from "@/lib/i18n";
import type { AiChannelGroup } from "@/types";
import { colorDotProps, colorOptionDot, UNGROUPED_ID } from "./meta";
import SelectMenu, { type SelectMenuOption } from "./SelectMenu";
import { cn } from "@/lib/utils";

interface AddBookmarkDialogProps {
  open: boolean;
  groups: AiChannelGroup[];
  onClose: () => void;
  onAdd: (params: { url: string; title: string; groupId?: string }) => Promise<boolean>;
}

export default function AddBookmarkDialog({
  open,
  groups,
  onClose,
  onAdd,
}: AddBookmarkDialogProps) {
  const t = useT();
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [groupId, setGroupId] = useState<string>(UNGROUPED_ID);
  const [loading, setLoading] = useState(false);

  const groupOptions: SelectMenuOption[] = [
    { value: UNGROUPED_ID, label: t("channels.group.ungrouped"), dotClassName: "bg-slate-400" },
    ...groups.map((g) => ({
      value: g.id,
      label: g.name,
      ...colorOptionDot(g.color),
    })),
  ];

  const reset = () => {
    setUrl("");
    setTitle("");
    setGroupId(UNGROUPED_ID);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;
    setLoading(true);
    try {
      const ok = await onAdd({
        url: trimmedUrl,
        title: title.trim() || trimmedUrl,
        groupId: groupId === UNGROUPED_ID ? undefined : groupId,
      });
      if (ok) {
        handleClose();
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedGroup = groups.find((g) => g.id === groupId);
  const dotP = selectedGroup ? colorDotProps(selectedGroup.color) : { className: "bg-slate-400" };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t("channels.addBookmark.title")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              {t("channels.addBookmark.urlLabel")}
            </label>
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              autoFocus
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              {t("channels.addBookmark.titleLabel")}
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("channels.addBookmark.titlePlaceholder")}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              {t("channels.addBookmark.groupLabel")}
            </label>
            <div className="flex items-center gap-2">
              <span className={cn("h-3 w-3 shrink-0 rounded-full", dotP.className)} style={dotP.style} />
              <SelectMenu
                value={groupId}
                options={groupOptions}
                placeholder={t("channels.detail.selectGroup")}
                className="flex-1"
                align="start"
                onChange={setGroupId}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              {t("channels.addBookmark.cancel")}
            </Button>
            <Button type="submit" disabled={!url.trim() || loading} className="gap-1.5">
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              {t("channels.addBookmark.confirm")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
