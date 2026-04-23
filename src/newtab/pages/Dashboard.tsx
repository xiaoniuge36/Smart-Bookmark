import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getTree,
  flatten,
  findFolder,
  moveBookmark,
} from "@/lib/bookmarks";
import type { BookmarkNode, FlatBookmark, Settings, TrendingRange } from "@/types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn, faviconOf, hostnameOf } from "@/lib/utils";
import {
  Search,
  ExternalLink,
  GripVertical,
  MoreHorizontal,
  Pin,
  Folder,
  History as HistoryIcon,
  ChevronRight,
  X,
  Flame,
  Clock,
} from "lucide-react";
import TrendingPanel from "@/components/TrendingPanel";
import { rangeToWindowDays } from "@/lib/github";
import { setSettings } from "@/lib/storage";
import { useT } from "@/lib/i18n";
import { toast } from "@/components/ui/toast";
import QrDialog from "./QrDialog";
import FolderTree from "@/components/FolderTree";
import EngineSwitcher from "@/components/EngineSwitcher";
import { findEngine } from "@/lib/engines";

interface Props {
  settings: Settings;
  initialQuery?: string;
  /** 从首页热门 widget 跳到「发现」页（与地址栏 hash 同步，避免点击无反应） */
  onOpenDiscover?: () => void;
}

interface FolderBookmark extends FlatBookmark {
  index: number;
}

interface TopSite {
  url: string;
  title: string;
}

interface HistoryHit {
  url: string;
  title: string;
  source: "history" | "bookmark";
}

export default function Dashboard({
  settings,
  initialQuery,
  onOpenDiscover,
}: Props) {
  const t = useT();
  const [tree, setTree] = useState<BookmarkNode[]>([]);
  const [selected, setSelected] = useState<string>(
    settings.rootFolderId ?? "",
  );
  const [items, setItems] = useState<FolderBookmark[]>([]);
  const [subFolders, setSubFolders] = useState<BookmarkNode[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<
    Array<{ id: string; title: string }>
  >([]);
  const [query, setQuery] = useState(initialQuery ?? "");
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [ctxMenu, setCtxMenu] = useState<
    | { id: string; url: string; x: number; y: number; title: string }
    | null
  >(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [topSites, setTopSites] = useState<TopSite[]>([]);
  const [historyHits, setHistoryHits] = useState<HistoryHit[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [widgetRange, setWidgetRange] = useState<TrendingRange>(
    settings.discoverDefaultRange ?? "weekly",
  );
  const trendingSectionRef = useRef<HTMLElement>(null);
  const [trendingHeight, setTrendingHeight] = useState<number | null>(null);
  const searchWrapRef = useRef<HTMLFormElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isMac = useMemo(
    () =>
      typeof navigator !== "undefined" &&
      /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent),
    [],
  );

  const expanded = useMemo(
    () => new Set(settings.expandedFolders ?? []),
    [settings.expandedFolders],
  );
  const pinnedIds = useMemo(
    () => new Set(settings.pinnedFolderIds ?? []),
    [settings.pinnedFolderIds],
  );

  const reload = useCallback(async () => {
    const tr = await getTree();
    setTree(tr);
  }, []);

  useEffect(() => {
    reload();
    const on = () => reload();
    chrome.bookmarks?.onChanged?.addListener(on);
    chrome.bookmarks?.onCreated?.addListener(on);
    chrome.bookmarks?.onRemoved?.addListener(on);
    chrome.bookmarks?.onMoved?.addListener(on);
    return () => {
      chrome.bookmarks?.onChanged?.removeListener(on);
      chrome.bookmarks?.onCreated?.removeListener(on);
      chrome.bookmarks?.onRemoved?.removeListener(on);
      chrome.bookmarks?.onMoved?.removeListener(on);
    };
  }, [reload]);

  useEffect(() => {
    chrome.topSites?.get?.((sites) => {
      setTopSites(
        (sites || []).slice(0, 10).map((s) => ({ url: s.url, title: s.title })),
      );
    });
  }, []);

  useLayoutEffect(() => {
    const el = trendingSectionRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const h = Math.round(e.contentRect.height);
        if (h > 0) setTrendingHeight(h);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!tree.length) return;
    if (selected) {
      const folder = findFolder(tree, selected);
      if (!folder) {
        setItems([]);
        setSubFolders([]);
        setBreadcrumb([]);
        return;
      }
      const subs = (folder.children ?? []).filter((c) => !c.url);
      setSubFolders(subs);
      const all = flatten([folder], "");
      setItems(all.map((b, i) => ({ ...b, index: i })));
      setBreadcrumb(buildBreadcrumb(tree, folder.id));
    } else {
      const flat = flatten(tree).slice(0, 500);
      setItems(flat.map((b, i) => ({ ...b, index: i })));
      setSubFolders([]);
      setBreadcrumb([]);
    }
  }, [tree, selected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.url.toLowerCase().includes(q) ||
        b.path.toLowerCase().includes(q),
    );
  }, [items, query]);

  const onSelectFolder = async (id: string) => {
    setSelected(id);
    await setSettings({ rootFolderId: id || undefined });
  };

  const onToggleExpand = async (id: string) => {
    const next = new Set(expanded);
    next.has(id) ? next.delete(id) : next.add(id);
    await setSettings({ expandedFolders: [...next] });
  };

  const onTogglePin = async (id: string) => {
    const next = new Set(pinnedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    await setSettings({ pinnedFolderIds: [...next] });
  };

  const onChangeEngine = async (id: string) => {
    await setSettings({ searchEngine: id });
  };

  const onSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    const hit = filtered[0];
    if (hit) {
      window.open(hit.url, "_blank");
      return;
    }
    const engine = findEngine(settings, settings.searchEngine);
    if (engine) window.open(engine.url(q), "_blank");
  };

  const canReorder = !!selected && !query.trim() && items.length > 0;

  const onDragStart = (e: React.DragEvent, id: string) => {
    if (!canReorder) return;
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    document.body.style.cursor = "grabbing";
  };
  const onDragOver = (e: React.DragEvent, id: string) => {
    if (!canReorder || !dragId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverId(id);
  };
  const onDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!canReorder || !dragId || dragId === targetId) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const src = items.find((i) => i.id === dragId);
    const tgt = items.find((i) => i.id === targetId);
    if (!src || !tgt || src.parentId !== tgt.parentId) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const siblingIds = items
      .filter((x) => x.parentId === tgt.parentId)
      .map((x) => x.id);
    const srcIdx = siblingIds.indexOf(dragId);
    const dstIdx = siblingIds.indexOf(targetId);
    const nextAll = [...items];
    const srcInAll = nextAll.findIndex((x) => x.id === dragId);
    const [moved] = nextAll.splice(srcInAll, 1);
    const dstInAll = nextAll.findIndex((x) => x.id === targetId);
    nextAll.splice(dstInAll, 0, moved);
    setItems(nextAll.map((x, i) => ({ ...x, index: i })));
    try {
      if (src.parentId) {
        await moveBookmark(dragId, src.parentId, dstIdx);
      }
    } catch (err) {
      console.warn("reorder failed", err, srcIdx, dstIdx);
      toast("排序失败", "error");
      reload();
    } finally {
      setDragId(null);
      setOverId(null);
    }
  };

  const closeCtx = useCallback(() => setCtxMenu(null), []);
  useEffect(() => {
    if (!ctxMenu) return;
    const fn = () => closeCtx();
    window.addEventListener("click", fn);
    window.addEventListener("resize", fn);
    return () => {
      window.removeEventListener("click", fn);
      window.removeEventListener("resize", fn);
    };
  }, [ctxMenu, closeCtx]);

  useEffect(() => {
    if (!searchFocused) return;
    const q = query.trim();
    if (!q) {
      chrome.history?.search?.(
        { text: "", maxResults: 10, startTime: Date.now() - 7 * 86400e3 },
        (res) => {
          setHistoryHits(
            (res || [])
              .filter((x) => x.url)
              .slice(0, 8)
              .map((x) => ({
                url: x.url!,
                title: x.title || x.url!,
                source: "history" as const,
              })),
          );
        },
      );
      return;
    }
    chrome.history?.search?.(
      { text: q, maxResults: 12 },
      (res) => {
        setHistoryHits(
          (res || [])
            .filter((x) => x.url)
            .slice(0, 8)
            .map((x) => ({
              url: x.url!,
              title: x.title || x.url!,
              source: "history" as const,
            })),
        );
      },
    );
  }, [query, searchFocused]);

  useEffect(() => {
    if (!searchFocused) return;
    const close = (e: MouseEvent) => {
      if (!searchWrapRef.current) return;
      if (!searchWrapRef.current.contains(e.target as Node))
        setSearchFocused(false);
    };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [searchFocused]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const isTyping =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (target?.isContentEditable ?? false);
      const meta = isMac ? e.metaKey : e.ctrlKey;
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        setSearchFocused(true);
        return;
      }
      if (!isTyping && e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchFocused(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMac]);

  const pinnedFolders = useMemo(() => {
    const ids = Array.from(pinnedIds);
    return ids
      .map((id) => findFolder(tree, id))
      .filter(Boolean) as BookmarkNode[];
  }, [pinnedIds, tree]);

  const totalBookmarks = useMemo(() => {
    if (selected) {
      const folder = findFolder(tree, selected);
      if (!folder) return 0;
      return flatten([folder], "").length;
    }
    return flatten(tree).length;
  }, [tree, selected]);

  const greeting = useGreeting();
  const showHero = !selected && !query.trim();

  return (
    <div className="grid grid-cols-12 gap-6">
      <aside className="col-span-12 md:col-span-3 space-y-3">
        {pinnedFolders.length > 0 && (
          <Card className="p-2">
            <div className="mb-1 flex items-center gap-2 px-1 text-xs font-medium text-muted-foreground">
              <Pin className="h-3.5 w-3.5" /> 置顶
            </div>
            <div className="space-y-0.5 text-sm">
              {pinnedFolders.map((f) => (
                <button
                  key={f.id}
                  onClick={() => onSelectFolder(f.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition hover:bg-accent",
                    selected === f.id && "bg-accent",
                  )}
                >
                  <span className="h-2 w-2 rounded-full bg-gradient-to-br from-blue-500 to-fuchsia-500" />
                  <span className="flex-1 truncate">{f.title}</span>
                </button>
              ))}
            </div>
          </Card>
        )}
        <Card className="p-2 max-h-[76vh] overflow-auto scrollbar-thin">
          <div className="mb-1 px-1 text-xs font-medium text-muted-foreground">
            {t("dash.folders")}
          </div>
          <FolderTree
            tree={tree}
            selectedId={selected}
            expanded={expanded}
            pinnedIds={pinnedIds}
            onToggle={onToggleExpand}
            onSelect={(id) => onSelectFolder(id)}
            onTogglePin={onTogglePin}
          />
        </Card>
      </aside>

      <section className="col-span-12 md:col-span-9 space-y-5">
        {showHero && (
          <div className="mb-2 pt-4 text-center">
            <div className="text-2xl font-semibold tracking-tight text-foreground/90">
              {greeting} <span className="ml-1">👋</span>
            </div>
          </div>
        )}

        <form
          onSubmit={onSubmitSearch}
          className={cn(
            "mx-auto w-full max-w-2xl",
            showHero ? "" : "max-w-none",
          )}
          ref={searchWrapRef}
        >
          <div
            className={cn(
              "group/search relative flex items-center gap-1.5 rounded-2xl border bg-card pl-1.5 pr-1.5 shadow-sm transition-all duration-200",
              "focus-within:border-primary/40 focus-within:shadow-md focus-within:ring-2 focus-within:ring-primary/20",
            )}
          >
            <EngineSwitcher
              settings={settings}
              value={settings.searchEngine}
              onChange={onChangeEngine}
            />
            <span
              aria-hidden
              className="h-5 w-px bg-border/80"
            />
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (e.target.value) setSearchFocused(true);
                }}
                onClick={() => setSearchFocused(true)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    if (query) {
                      setQuery("");
                    } else {
                      setSearchFocused(false);
                      searchInputRef.current?.blur();
                    }
                    return;
                  }
                  if (
                    e.key === "Enter" &&
                    (e.metaKey || e.ctrlKey) &&
                    query.trim()
                  ) {
                    e.preventDefault();
                    const qq = query.trim();
                    for (const id of settings.compareEngines) {
                      const eng = findEngine(settings, id);
                      if (eng) window.open(eng.url(qq), "_blank");
                    }
                    return;
                  }
                  if (!searchFocused) setSearchFocused(true);
                }}
                placeholder={t("dash.searchPlaceholder")}
                className="h-11 border-0 bg-transparent pl-8 pr-1 shadow-none focus-visible:ring-0"
              />
            </div>
            {query && (
              <button
                type="button"
                aria-label={t("dash.searchClear")}
                title={t("dash.searchClear")}
                onClick={() => {
                  setQuery("");
                  searchInputRef.current?.focus();
                }}
                className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {!query && (
              <kbd
                aria-hidden
                className="pointer-events-none hidden select-none items-center gap-1 rounded-md border bg-muted/60 px-1.5 py-0.5 font-mono text-[10.5px] font-medium text-muted-foreground shadow-sm sm:inline-flex"
              >
                <span className="text-[11px] leading-none">
                  {isMac ? "⌘" : "Ctrl"}
                </span>
                <span className="leading-none">K</span>
              </kbd>
            )}
            <Button
              type="submit"
              className="ml-1 h-9 w-9 rounded-xl p-0 sm:w-auto sm:px-4"
              variant="default"
              aria-label={t("common.search")}
              title={t("common.search")}
            >
              <Search className="h-4 w-4 sm:hidden" />
              <span className="hidden sm:inline">{t("common.search")}</span>
            </Button>
          </div>

          {searchFocused && query.trim() && (
            <div className="mx-2 mt-1.5 flex items-center px-1 text-[11px] text-muted-foreground">
              <span>
                {filtered.length > 0
                  ? t("dash.matchCount", String(filtered.length))
                  : t("dash.matchNone")}
              </span>
            </div>
          )}

          {searchFocused && historyHits.length > 0 && (
            <div className="relative">
              <div className="absolute inset-x-0 top-2 z-30 mx-auto max-w-2xl overflow-hidden rounded-2xl border bg-white shadow-2xl ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/10">
                <div className="bg-white px-4 py-2 text-[11px] text-muted-foreground dark:bg-slate-900">
                  <HistoryIcon className="mr-1 inline h-3 w-3" />
                  浏览历史
                </div>
                <div className="max-h-[320px] overflow-auto bg-white dark:bg-slate-900">
                  {historyHits.map((h) => (
                    <a
                      key={h.url}
                      href={h.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 border-t bg-white px-4 py-2 text-sm transition hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800"
                    >
                      <img
                        src={faviconOf(h.url, 16)}
                        alt=""
                        className="h-4 w-4 rounded"
                        onError={(e) =>
                          (e.currentTarget.style.visibility = "hidden")
                        }
                      />
                      <span className="flex-1 truncate">{h.title}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {hostnameOf(h.url)}
                      </span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        history
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
        </form>

        {showHero && topSites.length > 0 && (
          <div className="md:hidden mx-auto flex max-w-4xl flex-wrap items-start justify-center gap-4 pt-2">
            {topSites.map((s) => (
              <a
                key={s.url}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="group flex w-20 flex-col items-center gap-1"
                title={s.url}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border transition group-hover:-translate-y-0.5 group-hover:shadow-md">
                  <img
                    src={faviconOf(s.url, 64)}
                    alt=""
                    className="h-7 w-7 rounded-full"
                    onError={(e) =>
                      (e.currentTarget.style.visibility = "hidden")
                    }
                  />
                </div>
                <div className="w-full truncate text-center text-[11px] text-muted-foreground">
                  {s.title || hostnameOf(s.url)}
                </div>
              </a>
            ))}
          </div>
        )}

        {showHero && (
          <div className="grid grid-cols-1 items-stretch gap-5 pt-2 md:grid-cols-12">
            {topSites.length > 0 && (
              <aside className="hidden md:col-span-4 md:block">
                <Card
                  className="flex h-full flex-col p-3"
                  style={
                    trendingHeight
                      ? { maxHeight: trendingHeight + "px" }
                      : undefined
                  }
                >
                  <div className="mb-1 flex shrink-0 items-center gap-2 px-1">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500/20 to-indigo-500/20 text-sky-600 dark:text-sky-400">
                      <Clock className="h-3.5 w-3.5" />
                    </div>
                    <h2 className="text-sm font-semibold tracking-tight">
                      常去
                    </h2>
                    <span
                      className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                      title="由 Chrome 浏览器自动统计的常访问站点"
                    >
                      TOP {topSites.length}
                    </span>
                    <span className="ml-auto text-[10px] text-muted-foreground/70">
                      自动
                    </span>
                  </div>
                  <p className="mb-2 shrink-0 px-1 text-[10.5px] leading-relaxed text-muted-foreground/70">
                    浏览器按访问频率自动更新
                  </p>
                  <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-1 scrollbar-thin">
                    {topSites.map((s) => (
                      <a
                        key={s.url}
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        title={s.url}
                        className="group flex items-center gap-2.5 rounded-md px-2 py-1.5 transition hover:bg-accent"
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-background ring-1 ring-border">
                          <img
                            src={faviconOf(s.url, 32)}
                            alt=""
                            className="h-4 w-4 rounded"
                            onError={(e) =>
                              (e.currentTarget.style.visibility = "hidden")
                            }
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-foreground">
                            {s.title || hostnameOf(s.url)}
                          </div>
                          <div className="truncate text-[11px] text-muted-foreground">
                            {hostnameOf(s.url)}
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </Card>
              </aside>
            )}

            <section
              ref={trendingSectionRef}
              className={cn(
                "col-span-1",
                topSites.length > 0
                  ? "md:col-span-8"
                  : "md:col-span-12",
              )}
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500/20 to-rose-500/20 text-rose-500">
                  <Flame className="h-3.5 w-3.5" />
                </div>
                <h2 className="text-sm font-semibold tracking-tight">
                  {t("discover.widget.title")}
                </h2>
                <div
                  className="inline-flex items-center gap-0.5 rounded-lg border bg-card/80 p-0.5 text-[11px]"
                  role="tablist"
                  aria-label={t("discover.widget.title")}
                >
                  {(["daily", "weekly", "monthly", "yearly"] as TrendingRange[]).map(
                    (r) => (
                      <button
                        key={r}
                        type="button"
                        role="tab"
                        aria-selected={widgetRange === r}
                        onClick={() => setWidgetRange(r)}
                        className={cn(
                          "rounded-md px-2 py-0.5 font-medium transition",
                          widgetRange === r
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground",
                        )}
                      >
                        {t(`discover.range.${r}`)}
                      </button>
                    ),
                  )}
                </div>
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onOpenDiscover) {
                      onOpenDiscover();
                    } else {
                      const p = new URLSearchParams(window.location.hash.slice(1));
                      p.set("tab", "discover");
                      const s = p.toString();
                      window.location.hash = s ? "#" + s : "#";
                    }
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="relative z-10 cursor-pointer rounded-md px-2 py-1 text-xs text-muted-foreground transition hover:bg-accent hover:text-primary"
                >
                  {t("discover.widget.viewAll")}
                </button>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground/90">
                {t(
                  "discover.widget.hint",
                  t(`discover.range.${widgetRange}`),
                  String(rangeToWindowDays(widgetRange)),
                )}
              </p>
              <TrendingPanel
                settings={settings}
                limit={8}
                compact
                hideControls
                range={widgetRange}
                onRangeChange={setWidgetRange}
              />
            </section>
          </div>
        )}

        {!showHero && breadcrumb.length > 0 && (
          <nav className="flex items-center gap-1 text-sm text-muted-foreground">
            <button onClick={() => onSelectFolder("")} className="hover:text-foreground">
              全部书签
            </button>
            {breadcrumb.map((b) => (
              <span key={b.id} className="flex items-center gap-1">
                <ChevronRight className="h-3.5 w-3.5" />
                <button
                  onClick={() => onSelectFolder(b.id)}
                  className="hover:text-foreground"
                >
                  {b.title}
                </button>
              </span>
            ))}
          </nav>
        )}

        {!showHero && subFolders.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {subFolders.map((f) => (
              <button
                key={f.id}
                onClick={() => onSelectFolder(f.id)}
                className="group flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2 text-sm shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_8px_24px_-12px_hsl(var(--primary)/0.25)] hover:ring-1 hover:ring-primary/20"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 text-primary">
                  <Folder className="h-3.5 w-3.5" />
                </div>
                <span className="max-w-[140px] truncate">
                  {f.title || "(未命名)"}
                </span>
              </button>
            ))}
          </div>
        )}

        {(showHero || (!subFolders.length && breadcrumb.length === 0)) &&
          filtered.length > 0 && (
            <div className="flex items-end justify-between border-b pb-1.5 pt-2">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 text-primary">
                  <Folder className="h-3.5 w-3.5" />
                </div>
                <h2 className="text-sm font-semibold tracking-tight">
                  我的书签
                </h2>
                <span className="text-[11px] text-muted-foreground">
                  · 共 {totalBookmarks} 个
                </span>
                {filtered.length < totalBookmarks && !query.trim() && (
                  <span className="text-[11px] text-muted-foreground/70">
                    （展示前 {filtered.length}）
                  </span>
                )}
              </div>
              {canReorder && (
                <span className="hidden items-center gap-1 text-[11px] text-muted-foreground sm:inline-flex">
                  <GripVertical className="h-3 w-3" />
                  {t("dash.dragHint")}
                </span>
              )}
            </div>
          )}

        {canReorder &&
          !(showHero || (!subFolders.length && breadcrumb.length === 0)) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <GripVertical className="h-3.5 w-3.5" /> {t("dash.dragHint")}
            </div>
          )}

        <div
          className={cn(
            "grid gap-3",
            settings.cardDensity === "compact"
              ? "grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8"
              : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6",
          )}
        >
          {filtered.map((b) => (
            <div
              key={b.id}
              draggable={canReorder}
              onDragStart={(e) => onDragStart(e, b.id)}
              onDragEnd={() => {
                document.body.style.cursor = "";
                setDragId(null);
                setOverId(null);
              }}
              onDragOver={(e) => onDragOver(e, b.id)}
              onDrop={(e) => onDrop(e, b.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                setCtxMenu({
                  id: b.id,
                  url: b.url,
                  title: b.title,
                  x: e.clientX,
                  y: e.clientY,
                });
              }}
              className={cn(
                "group relative flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-card p-3 text-center shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-all duration-200 ease-out",
                "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_8px_24px_-12px_hsl(var(--primary)/0.25)] hover:ring-1 hover:ring-primary/20",
                canReorder && "cursor-grab",
                dragId === b.id && "cursor-grabbing opacity-50",
                overId === b.id && dragId !== b.id && "ring-2 ring-primary/60",
              )}
              title={b.url}
            >
              <a
                href={b.url}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  "flex w-full flex-col items-center gap-2",
                  canReorder && "cursor-inherit",
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 ring-1 ring-inset ring-black/5 transition-all duration-200 group-hover:ring-primary/30 group-hover:shadow-sm dark:from-slate-800 dark:to-slate-900 dark:ring-white/5">
                  <img
                    src={faviconOf(b.url)}
                    alt=""
                    className="h-5 w-5"
                    onError={(e) =>
                      (e.currentTarget.style.visibility = "hidden")
                    }
                  />
                </div>
                <div className="w-full truncate text-sm font-medium">
                  {b.title}
                </div>
                <div className="w-full truncate text-[11px] text-muted-foreground">
                  {hostnameOf(b.url)}
                </div>
              </a>
              <ExternalLink className="absolute right-2 top-2 h-3 w-3 text-muted-foreground opacity-0 transition group-hover:opacity-70" />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCtxMenu({
                    id: b.id,
                    url: b.url,
                    title: b.title,
                    x: e.clientX,
                    y: e.clientY,
                  });
                }}
                className="absolute bottom-2 right-2 rounded p-1 text-muted-foreground opacity-0 hover:bg-accent group-hover:opacity-100"
                aria-label="more"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
              {canReorder && (
                <GripVertical className="pointer-events-none absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-60" />
              )}
            </div>
          ))}
          {!filtered.length && !subFolders.length && (
            <div className="col-span-full rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              {t("dash.empty")}
            </div>
          )}
        </div>
      </section>

      {ctxMenu && (
        <BookmarkCtxMenu
          {...ctxMenu}
          onCopy={async () => {
            await navigator.clipboard.writeText(ctxMenu.url);
            toast(t("common.copied"), "success");
            setCtxMenu(null);
          }}
          onQr={() => {
            setQrUrl(ctxMenu.url);
            setCtxMenu(null);
          }}
          onClose={() => setCtxMenu(null)}
        />
      )}

      {qrUrl && <QrDialog url={qrUrl} onClose={() => setQrUrl(null)} />}
    </div>
  );
}

function buildBreadcrumb(
  tree: BookmarkNode[],
  id: string,
): Array<{ id: string; title: string }> {
  const path: Array<{ id: string; title: string }> = [];
  const walk = (nodes: BookmarkNode[], chain: Array<{ id: string; title: string }>): boolean => {
    for (const n of nodes) {
      if (!n.url) {
        const here = n.title
          ? [...chain, { id: n.id, title: n.title }]
          : chain;
        if (n.id === id) {
          path.push(...here);
          return true;
        }
        if (n.children && walk(n.children, here)) return true;
      }
    }
    return false;
  };
  walk(tree, []);
  return path;
}

function useGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "深夜好";
  if (h < 11) return "早上好";
  if (h < 14) return "中午好";
  if (h < 18) return "下午好";
  if (h < 22) return "晚上好";
  return "夜深了";
}

function BookmarkCtxMenu({
  x,
  y,
  onCopy,
  onQr,
}: {
  id: string;
  url: string;
  title: string;
  x: number;
  y: number;
  onCopy: () => void;
  onQr: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const pad = 8;
    const left = Math.min(x, window.innerWidth - r.width - pad);
    const top = Math.min(y, window.innerHeight - r.height - pad);
    setPos({ left, top });
  }, [x, y]);
  return (
    <div
      ref={ref}
      onClick={(e) => e.stopPropagation()}
      className="fixed z-[60] min-w-[180px] rounded-lg border bg-popover p-1 text-sm shadow-lg"
      style={{ left: pos.left, top: pos.top }}
    >
      <button
        className="flex w-full items-center gap-2 rounded px-3 py-1.5 text-left hover:bg-accent"
        onClick={onCopy}
      >
        复制链接
      </button>
      <button
        className="flex w-full items-center gap-2 rounded px-3 py-1.5 text-left hover:bg-accent"
        onClick={onQr}
      >
        生成二维码
      </button>
    </div>
  );
}
