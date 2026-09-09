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
import {
  toDataUrl,
  toDownloadPng,
  toSvgString,
  type QrFormat,
} from "@/lib/qr";
import { useT } from "@/lib/i18n";
import { toast } from "@/components/ui/toast";

const QR_FORMATS: { id: QrFormat; label: string }[] = [
  { id: "png", label: "PNG" },
  { id: "svg", label: "SVG" },
];

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
    toDataUrl(url, 320).then(setImg);
  }, [url]);

  const copyUrl = async () => {
    await navigator.clipboard.writeText(url);
    toast(t("common.copied"), "success");
  };

  const download = async (format: QrFormat) => {
    try {
      const href =
        format === "svg"
          ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
              await toSvgString(url),
            )}`
          : await toDownloadPng(url);
      const a = document.createElement("a");
      a.href = href;
      a.download = `qrcode.${format}`;
      a.click();
    } catch (err) {
      console.warn("qr download failed", format, err);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md p-5 sm:p-6">
        <DialogHeader className="min-w-0">
          <DialogTitle>{t("qr.title")}</DialogTitle>
          <DialogDescription
            className="truncate text-xs text-muted-foreground"
            title={url}
          >
            {url}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-1">
          <div className="rounded-xl border border-border bg-white p-3 shadow-sm">
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

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <Button variant="outline" size="sm" className="gap-2" onClick={copyUrl}>
            <Copy className="h-4 w-4" /> {t("qr.copyUrl")}
          </Button>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Download className="h-3.5 w-3.5" /> {t("qr.download")}
            </span>
            {QR_FORMATS.map((f) => (
              <Button
                key={f.id}
                variant="outline"
                size="sm"
                onClick={() => void download(f.id)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
