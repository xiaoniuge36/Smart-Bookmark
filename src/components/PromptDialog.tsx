import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n";

/**
 * 单字段输入弹窗（如重命名）。回车或点击确认触发 onSave(value)。
 */
export default function PromptDialog({
  open,
  onOpenChange,
  title,
  label,
  description,
  initialValue = "",
  confirmLabel,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  label?: string;
  description?: string;
  initialValue?: string;
  confirmLabel?: string;
  onSave: (value: string) => void | Promise<void>;
}) {
  const t = useT();
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (open) setValue(initialValue);
  }, [open, initialValue]);

  const submit = () => {
    const v = value.trim();
    if (v) void onSave(v);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <label className="block space-y-1">
          {label ? (
            <span className="text-xs text-muted-foreground">{label}</span>
          ) : null}
          <Input
            value={value}
            autoFocus
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
          />
        </label>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button size="sm" disabled={!value.trim()} onClick={submit}>
            {confirmLabel ?? t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
