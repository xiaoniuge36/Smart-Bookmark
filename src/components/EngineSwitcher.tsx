import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Plus, X } from "lucide-react";
import { allEngines, faviconFor } from "@/lib/engines";
import type { CustomEngine, Settings } from "@/types";
import { cn } from "@/lib/utils";
import { setSettings } from "@/lib/storage";

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
        title="切换搜索引擎"
      >
        {current && (
          <img
            src={faviconFor(current)}
            alt=""
            className="h-5 w-5 rounded"
            onError={(e) => (e.currentTarget.style.visibility = "hidden")}
          />
        )}
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </button>

      {open && (
        <div
          className="absolute left-0 top-12 z-50 w-[380px] max-w-[calc(100vw-2rem)] rounded-xl border bg-white p-3 shadow-2xl ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/5"
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
                <img
                  src={faviconFor(engine)}
                  alt=""
                  className="h-8 w-8 rounded"
                  onError={(ev) =>
                    (ev.currentTarget.style.visibility = "hidden")
                  }
                />
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
              <span className="text-xs">{adding ? "取消" : "添加"}</span>
            </button>
          </div>

          {settings.customEngines?.length > 0 && (
            <div className="mt-3 border-t pt-2">
              <div className="mb-1 text-xs text-muted-foreground">
                自定义引擎
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
                      title="删除"
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
                添加自定义引擎：URL 中用 <code>%s</code>{" "}
                代表关键词占位符；没有则追加 <code>?q=</code>。
              </div>
              <input
                value={nName}
                onChange={(e) => setNName(e.target.value)}
                placeholder="名称（例如：谷歌学术）"
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
                  取消
                </button>
                <button
                  type="button"
                  onClick={addEngine}
                  className="rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground"
                >
                  保存
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
