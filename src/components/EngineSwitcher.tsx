import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Plus, X } from "lucide-react";
import { allEngines } from "@/lib/engines";
import type { CustomEngine, Settings } from "@/types";
import { cn } from "@/lib/utils";
import { setSettings } from "@/lib/storage";
import EngineIcon from "@/components/EngineIcon";
import { useT } from "@/lib/i18n";

interface Props {
  settings: Settings;
  value: string;
  onChange: (id: string) => void;
  onOpenChange?: (open: boolean) => void;
}

export default function EngineSwitcher({
  settings,
  value,
  onChange,
  onOpenChange,
}: Props) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [nName, setNName] = useState("");
  const [nUrl, setNUrl] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  const setSwitcherOpen = useCallback((next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false);
      }
    };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [open, setSwitcherOpen]);

  const engines = allEngines(settings);
  const current = engines.find((e) => e.id === value) ?? engines[0];

  const addEngine = async () => {
    const name = nName.trim();
    const url = nUrl.trim();
    if (!name || !url) return;
    const customEngine: CustomEngine = {
      id: "c_" + Date.now().toString(36),
      name,
      url,
    };
    const next = [...(settings.customEngines ?? []), customEngine];
    await setSettings({ customEngines: next });
    setAdding(false);
    setNName("");
    setNUrl("");
    onChange(customEngine.id);
    setSwitcherOpen(false);
  };

  const removeEngine = async (id: string) => {
    const next = (settings.customEngines ?? []).filter((c) => c.id !== id);
    await setSettings({ customEngines: next });
    if (value === id) onChange("google");
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setSwitcherOpen(!open)}
        className="flex h-10 items-center gap-1 rounded-full bg-background px-2 transition hover:bg-accent"
        title={t("engine.switchTitle")}
      >
        {current && (
          <EngineIcon engine={current} className="h-5 w-5" />
        )}
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </button>

      <div
        className={cn(
          "absolute left-0 top-12 z-50 w-[380px] max-w-[calc(100vw-2rem)] rounded-xl border bg-white p-3 shadow-2xl ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/5",
          !open && "hidden",
        )}
        onClick={(e) => e.stopPropagation()}
      >
          <div className="grid grid-cols-4 gap-2">
            {engines.map((engine) => (
              <button
                key={engine.id}
                type="button"
                className={cn(
                  "group flex flex-col items-center gap-1 rounded-lg p-2 transition hover:bg-accent",
                  value === engine.id && "bg-accent",
                )}
                onClick={() => {
                  onChange(engine.id);
                  setSwitcherOpen(false);
                }}
              >
                <EngineIcon engine={engine} className="h-8 w-8" />
                <span className="max-w-full truncate text-xs">
                  {engine.name}
                </span>
              </button>
            ))}
            <button
              type="button"
              className="flex flex-col items-center gap-1 rounded-lg border border-dashed p-2 text-muted-foreground transition hover:bg-accent"
              onClick={() => setAdding((v) => !v)}
            >
              <Plus className="h-6 w-6" />
              <span className="text-xs">{adding ? t("common.cancel") : t("common.add")}</span>
            </button>
          </div>

          {settings.customEngines?.length > 0 && (
            <div className="mt-3 border-t pt-2">
              <div className="mb-1 text-xs text-muted-foreground">
                {t("engine.customEngines")}
              </div>
              <div className="space-y-1">
                {settings.customEngines.map((customEngine) => (
                  <div
                    key={customEngine.id}
                    className="flex items-center gap-2 rounded px-2 py-1 text-xs hover:bg-accent"
                  >
                    <span className="flex-1 truncate">
                      {customEngine.name}
                    </span>
                    <code className="max-w-[150px] truncate text-muted-foreground">
                      {customEngine.url}
                    </code>
                    <button
                      type="button"
                      onClick={() => removeEngine(customEngine.id)}
                      className="text-muted-foreground hover:text-destructive"
                      title={t("common.delete")}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {adding && (
            <div className="mt-3 space-y-2 border-t pt-3">
              <div className="text-xs text-muted-foreground">
                {t("engine.addHintPre")}<code>%s</code>{" "}
                {t("engine.addHintMid")}<code>?q=</code>{t("engine.addHintPost")}
              </div>
              <input
                value={nName}
                onChange={(e) => setNName(e.target.value)}
                placeholder={t("engine.namePlaceholder")}
                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
              />
              <input
                value={nUrl}
                onChange={(e) => setNUrl(e.target.value)}
                placeholder="https://scholar.google.com/scholar?q=%s"
                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="rounded-md border px-3 py-1 text-xs"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  onClick={addEngine}
                  className="rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground"
                >
                  {t("common.save")}
                </button>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
