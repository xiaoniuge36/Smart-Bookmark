import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Download } from "lucide-react";
import { toDataUrl } from "@/lib/qr";
import { useT } from "@/lib/i18n";
import { toast } from "@/components/ui/toast";

export default function QrDialog({
  url,
  onClose,
}: {
  url: string;
  onClose: () => void;
}) {
  const t = useT();
  const [img, setImg] = useState<string>("");

  useEffect(() => {
    const dark = document.documentElement.classList.contains("dark");
    toDataUrl(url, 320, dark).then(setImg);
  }, [url]);

  const download = () => {
    if (!img) return;
    const a = document.createElement("a");
    a.href = img;
    a.download = "qrcode.png";
    a.click();
  };

  const copyUrl = async () => {
    await navigator.clipboard.writeText(url);
    toast(t("common.copied"), "success");
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle>{t("qr.title")}</DialogTitle>
          <DialogDescription
            className="truncate text-xs text-muted-foreground"
            title={url}
          >
            {url}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-1">
          <div className="rounded-xl border border-border bg-white p-3 shadow-sm dark:bg-[hsl(var(--card))]">
            {img ? (
              <img
                src={img}
                alt="QR"
                className="block h-64 w-64 select-none"
                draggable={false}
              />
            ) : (
              <div className="h-64 w-64 animate-pulse rounded bg-muted" />
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" className="gap-2" onClick={copyUrl}>
            <Copy className="h-4 w-4" /> {t("qr.copyUrl")}
          </Button>
          <Button size="sm" className="gap-2" onClick={download}>
            <Download className="h-4 w-4" /> {t("qr.download")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
