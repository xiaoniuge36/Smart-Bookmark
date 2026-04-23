import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Flame, RefreshCw, AlertTriangle, ChevronDown } from "lucide-react";
import RepoCard from "@/components/RepoCard";
import { fetchTrending, COMMON_LANGUAGES, rangeToWindowDays } from "@/lib/github";
import type { Settings, TrendingRange, TrendingRepo } from "@/types";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const RANGES: TrendingRange[] = ["daily", "weekly", "monthly", "yearly"];

export interface TrendingPanelProps {
  settings: Settings;
  /** 传入默认展示条数 */
  limit?: number;
  /** 紧凑模式（widget 场景） */
  compact?: boolean;
  /** 初始时段（没设时回退到 settings.discoverDefaultRange 或 weekly） */
  initialRange?: TrendingRange;
  /** 初始语言（没设时回退到 settings.discoverDefaultLanguage 或空） */
  initialLanguage?: string;
  /** 受控的时段。传入后忽略 initialRange 并走受控模式。 */
  range?: TrendingRange;
  onRangeChange?: (r: TrendingRange) => void;
  /** 暴露给外部（比如 AI 注入按钮）读取当前数据 */
  onDataChange?: (data: TrendingRepo[], meta: {
    range: TrendingRange;
    language: string;
  }) => void;
  /** 隐藏头部控件（仅在 widget 场景想更紧凑时用） */
  hideControls?: boolean;
  /** 头部右侧自定义按钮区（比如「查看全部 →」链接） */
  headerExtra?: React.ReactNode;
  /** 根容器额外 className */
  className?: string;
}

export default function TrendingPanel({
  settings,
  limit = 30,
  compact = false,
  initialRange,
  initialLanguage,
  range: rangeProp,
  onRangeChange,
  onDataChange,
  hideControls = false,
  headerExtra,
  className,
}: TrendingPanelProps) {
  const t = useT();
  const [rangeState, setRangeState] = useState<TrendingRange>(
    initialRange ?? settings.discoverDefaultRange ?? "weekly",
  );
  const range = rangeProp ?? rangeState;
  const setRange = (r: TrendingRange) => {
    if (onRangeChange) onRangeChange(r);
    if (rangeProp == null) setRangeState(r);
  };
  const [language, setLanguage] = useState<string>(
    initialLanguage ?? settings.discoverDefaultLanguage ?? "",
  );
  const [list, setList] = useState<TrendingRepo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [updatedAt, setUpdatedAt] = useState<number>(0);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(
    async (force = false) => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      setError("");
      try {
        const data = await fetchTrending({
          range,
          language: language || undefined,
          limit,
          token: settings.githubToken || undefined,
          force,
          signal: ctrl.signal,
        });
        setList(data);
        setUpdatedAt(Date.now());
        onDataChange?.(data, { range, language });
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        setError((err as Error)?.message ?? String(err));
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    },
    [range, language, limit, settings.githubToken, onDataChange],
  );

  useEffect(() => {
    load(false);
    return () => abortRef.current?.abort();
  }, [load]);

  const hasToken = !!settings.githubToken?.trim();

  const timeLabel = useMemo(() => {
    if (!updatedAt) return "";
    const d = new Date(updatedAt);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, [updatedAt]);

  const gridCls = compact
    ? "grid-cols-1 sm:grid-cols-2"
    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={cn("space-y-3", className)}>
      {!hideControls && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1 rounded-lg border bg-card p-0.5 text-xs">
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={cn(
                  "rounded-md px-2.5 py-1 font-medium transition",
                  range === r
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {t(`discover.range.${r}`)}
              </button>
            ))}
          </div>
          <LanguagePicker value={language} onChange={setLanguage} />
          <button
            type="button"
            onClick={() => load(true)}
            className="inline-flex items-center gap-1 rounded-lg border bg-card px-2.5 py-1 text-xs text-muted-foreground transition hover:bg-accent hover:text-foreground"
            title={t("discover.refresh")}
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", loading && "animate-spin")}
            />
            <span>{t("discover.refresh")}</span>
          </button>
          {updatedAt > 0 && (
            <span className="text-[11px] text-muted-foreground/80">
              {t("discover.updated", timeLabel)}
            </span>
          )}
          <div className="flex-1" />
          {headerExtra}
          {!hasToken && !error && (
            <span className="hidden items-center gap-1 text-[11px] text-muted-foreground md:inline-flex">
              <AlertTriangle className="h-3 w-3" />
              {t("discover.needToken")}
            </span>
          )}
        </div>
      )}

      {!hideControls && (
        <p className="text-[11px] text-muted-foreground/90">
          {t(
            "discover.widget.hint",
            t(`discover.range.${range}`),
            String(rangeToWindowDays(range)),
          )}{" "}
          {t("discover.trendingExplainer")}
        </p>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-medium">{t("discover.error")}</div>
            <div className="mt-0.5 text-xs opacity-90">{error}</div>
          </div>
          <button
            type="button"
            onClick={() => load(true)}
            className="rounded-md border border-destructive/30 px-2 py-1 text-xs hover:bg-destructive/10"
          >
            {t("discover.refresh")}
          </button>
        </div>
      )}

      {loading && list.length === 0 && (
        <div className={cn("grid gap-3", gridCls)}>
          {Array.from({ length: compact ? 4 : 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[118px] animate-pulse rounded-xl border bg-card/60"
            />
          ))}
        </div>
      )}

      {!loading && !error && list.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          <Flame className="h-6 w-6 opacity-60" />
          <span>{t("discover.empty")}</span>
        </div>
      )}

      {list.length > 0 && (
        <div className="relative">
          <div
            className={cn(
              "grid gap-3 transition-opacity duration-200",
              gridCls,
              loading && "pointer-events-none opacity-45",
            )}
          >
            {list.map((r) => (
              <RepoCard
                key={r.id}
                repo={r}
                compact={compact}
                bookmarkFolderId={settings.rootFolderId}
              />
            ))}
          </div>
          {loading && (
            <div className="pointer-events-none absolute inset-x-0 top-2 flex justify-center">
              <div className="inline-flex items-center gap-1.5 rounded-full border bg-card/95 px-2.5 py-1 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>{t("discover.loading")}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LanguagePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [open]);

  const label = value || t("discover.language.all");

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-lg border bg-card px-2.5 py-1 text-xs text-foreground transition hover:bg-accent"
      >
        <span className="truncate max-w-[120px]">{label}</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </button>
      {open && (
        <div
          className="absolute left-0 top-9 z-40 w-56 rounded-xl border bg-popover p-2 shadow-2xl ring-1 ring-black/5 dark:ring-white/5"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className={cn(
              "flex w-full items-center rounded-md px-2 py-1.5 text-left text-xs transition hover:bg-accent",
              value === "" && "bg-accent font-medium",
            )}
          >
            {t("discover.language.all")}
          </button>
          <div className="my-1 h-px bg-border/70" />
          <div className="max-h-[260px] overflow-auto pr-0.5 scrollbar-thin">
            {COMMON_LANGUAGES.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => {
                  onChange(lang);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center rounded-md px-2 py-1.5 text-left text-xs transition hover:bg-accent",
                  value === lang && "bg-accent font-medium",
                )}
              >
                {lang}
              </button>
            ))}
          </div>
          <div className="mt-2 border-t pt-2">
            <div className="mb-1 text-[10px] text-muted-foreground">
              自定义语言（GitHub linguist 名称）
            </div>
            <div className="flex items-center gap-1">
              <input
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="e.g. Nix, Elixir"
                className="flex-1 rounded-md border bg-background px-2 py-1 text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  if (custom.trim()) {
                    onChange(custom.trim());
                    setOpen(false);
                  }
                }}
                className="rounded-md bg-primary px-2 py-1 text-[11px] text-primary-foreground"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
