import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n";

export interface EditBookmarkTarget {
  id: string;
  title: string;
  url: string;
}

/**
 * 编辑书签弹窗：修改名称与链接。保存时回调 onSave(id, title, url)。
 */
export default function EditBookmarkDialog({
  open,
  onOpenChange,
  target,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  target: EditBookmarkTarget | null;
  onSave: (id: string, title: string, url: string) => void | Promise<void>;
}) {
  const t = useT();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (target) {
      setTitle(target.title);
      setUrl(target.url);
    }
  }, [target]);

  const canSave = url.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("dash.editBookmark")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="text-xs text-muted-foreground">
              {t("dash.fieldName")}
            </span>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-muted-foreground">
              {t("dash.fieldUrl")}
            </span>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://"
            />
          </label>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            size="sm"
            disabled={!canSave}
            onClick={() => {
              if (target) void onSave(target.id, title, url.trim());
            }}
          >
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
