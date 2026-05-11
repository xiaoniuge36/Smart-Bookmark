import {
  useCallback,
  useEffect,
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
import type { BookmarkNode, FlatBookmark, Settings, TrendingMode, TrendingRange } from "@/types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn, faviconOf, hostnameOf } from "@/lib/utils";
import {
  Search,
  Bookmark as BookmarkIcon,
  Bot,
  Columns,
  Command,
  ExternalLink,
  GripVertical,
  MoreHorizontal,
  Pin,
  Folder,
  ChevronRight,
  X,
  HardDriveDownload,
  Settings2,
  Wand2,
} from "lucide-react";
import { setSettings } from "@/lib/storage";
import { useT } from "@/lib/i18n";
import { toast } from "@/components/ui/toast";
import QrDialog from "./QrDialog";
import FolderTree from "@/components/FolderTree";
import EngineSwitcher from "@/components/EngineSwitcher";
import { faviconFor, findEngine } from "@/lib/engines";
import InfoCollections from "@/components/InfoCollections";
import TopSitesSidebar from "@/components/widgets/TopSitesSidebar";
import TrendingSidebar from "@/components/widgets/TrendingSidebar";
import { rankSearchItems } from "@/lib/searchRank";

interface Props {
  settings: Settings;
  initialQuery?: string;
  /** 从首页热门 widget 跳到「发现」页（与地址栏 hash 同步，避免点击无反应） */
  onOpenDiscover?: () => void;
}

type DashboardTabId =
  | "dashboard"
  | "discover"
  | "cleaner"
  | "ai"
  | "compare"
  | "backup"
  | "settings";

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

interface SearchCommandItem {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  iconUrl?: string;
  Icon?: React.ComponentType<{ className?: string }>;
  onRun: () => void;
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
  const [activeCommand, setActiveCommand] = useState(0);
  const [widgetRange, setWidgetRange] = useState<TrendingRange>(
    settings.discoverDefaultRange ?? "weekly",
  );
  const [widgetMode, setWidgetMode] = useState<TrendingMode>(
    settings.discoverDefaultMode ?? "created",
  );
  const [pageSize, setPageSize] = useState<number>(() => {
    const raw = localStorage.getItem("sb_pageSize");
    if (raw === "Infinity") return Infinity;
    const n = Number(raw);
    return [24, 60, 120, 240].includes(n) ? n : 60;
  });
  const [page, setPage] = useState<number>(1);
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
      const flat = flatten(tree);
      setItems(flat.map((b, i) => ({ ...b, index: i })));
      setSubFolders([]);
      setBreadcrumb([]);
    }
  }, [tree, selected]);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return items;
    return rankSearchItems(q, items, items.length).map(({ item }) => item);
  }, [items, query]);

  const pageCount = Math.max(
    1,
    pageSize === Infinity ? 1 : Math.ceil(filtered.length / pageSize),
  );

  useEffect(() => {
    setPage(1);
  }, [selected, query, pageSize]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const pagedItems = useMemo(() => {
    if (pageSize === Infinity) return filtered;
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const onChangePageSize = (n: number) => {
    setPageSize(n);
    localStorage.setItem(
      "sb_pageSize",
      n === Infinity ? "Infinity" : String(n),
    );
  };

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

  const openExternal = useCallback((url: string) => {
    window.open(url, "_blank");
    setSearchFocused(false);
  }, []);

  const openDashboardTab = useCallback((id: DashboardTabId) => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    params.set("tab", id);
    const next = params.toString();
    window.location.hash = next ? "#" + next : "#";
    window.scrollTo({ top: 0, behavior: "smooth" });
    setSearchFocused(false);
  }, []);

  const runEngineSearch = useCallback(
    (text: string, engineId = settings.searchEngine) => {
      const q = text.trim();
      if (!q) return;
      const engine =
        findEngine(settings, engineId) ?? findEngine(settings, "google");
      if (engine) openExternal(engine.url(q));
    },
    [openExternal, settings],
  );

  const runCompareSearch = useCallback(
    (text: string) => {
      const q = text.trim();
      if (!q) return;
      for (const id of settings.compareEngines) {
        const eng = findEngine(settings, id);
        if (eng) window.open(eng.url(q), "_blank");
      }
      setSearchFocused(false);
    },
    [settings],
  );

  const onSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    runEngineSearch(q);
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

  const commandItems = useMemo<SearchCommandItem[]>(() => {
    const q = query.trim();
    const currentEngine =
      findEngine(settings, settings.searchEngine) ??
      findEngine(settings, "google");
    const out: SearchCommandItem[] = [];

    if (q && currentEngine) {
      out.push({
        id: "engine-default",
        title: `用 ${currentEngine.name} 搜索 "${q}"`,
        subtitle: "默认回车执行搜索，书签结果可用方向键选择",
        badge: "Enter",
        iconUrl: faviconFor(currentEngine),
        onRun: () => runEngineSearch(q),
      });
      if (settings.compareEngines.length > 1) {
        out.push({
          id: "engine-compare",
          title: `在对比搜索中打开 "${q}"`,
          subtitle: `${settings.compareEngines.length} 个搜索引擎并行查询`,
          badge: isMac ? "⌘ Enter" : "Ctrl Enter",
          Icon: Columns,
          onRun: () => runCompareSearch(q),
        });
      }
    }

    const bookmarkResults = q ? filtered.slice(0, 6) : [];
    for (const b of bookmarkResults) {
      out.push({
        id: `bookmark-${b.id}`,
        title: b.title,
        subtitle: b.path
          ? `${hostnameOf(b.url)} · ${b.path}`
          : hostnameOf(b.url),
        badge: "bookmark",
        iconUrl: faviconOf(b.url, 32),
        onRun: () => openExternal(b.url),
      });
    }

    const historySource = q
      ? rankSearchItems(
          q,
          historyHits.map((h, i) => ({ ...h, id: `history-${i}`, boost: 18 })),
          5,
        ).map(({ item }) => item)
      : historyHits.slice(0, 5);
    for (const h of historySource) {
      out.push({
        id: `history-${h.url}`,
        title: h.title,
        subtitle: hostnameOf(h.url),
        badge: "history",
        iconUrl: faviconOf(h.url, 32),
        onRun: () => openExternal(h.url),
      });
    }

    const topSiteSource = q
      ? rankSearchItems(
          q,
          topSites.map((s, i) => ({ ...s, id: `top-${i}`, boost: 12 })),
          4,
        ).map(({ item }) => item)
      : topSites.slice(0, 5);
    for (const s of topSiteSource) {
      out.push({
        id: `top-${s.url}`,
        title: s.title || hostnameOf(s.url),
        subtitle: hostnameOf(s.url),
        badge: "top site",
        iconUrl: faviconOf(s.url, 32),
        onRun: () => openExternal(s.url),
      });
    }

    const actions: SearchCommandItem[] = [
      {
        id: "action-cleaner",
        title: "打开清理中心",
        subtitle: "重复、失效、空文件夹扫描",
        badge: "action",
        Icon: Wand2,
        onRun: () => openDashboardTab("cleaner"),
      },
      {
        id: "action-compare",
        title: "打开对比搜索",
        subtitle: "多个搜索引擎并排查询",
        badge: "action",
        Icon: Columns,
        onRun: () => openDashboardTab("compare"),
      },
      {
        id: "action-ai",
        title: "打开 AI 助手",
        subtitle: "基于书签快照整理和检索",
        badge: "action",
        Icon: Bot,
        onRun: () => openDashboardTab("ai"),
      },
      {
        id: "action-backup",
        title: "打开备份",
        subtitle: "导入、导出 JSON 或 HTML",
        badge: "action",
        Icon: HardDriveDownload,
        onRun: () => openDashboardTab("backup"),
      },
      {
        id: "action-settings",
        title: "打开设置",
        subtitle: "主题、搜索引擎、AI 和扩展功能",
        badge: "action",
        Icon: Settings2,
        onRun: () => openDashboardTab("settings"),
      },
    ];
    const actionSource = q
      ? actions.filter((a) =>
          `${a.title} ${a.subtitle}`.toLowerCase().includes(q.toLowerCase()),
        )
      : actions.slice(0, 3);
    out.push(...actionSource);

    return out.slice(0, q ? 14 : 10);
  }, [
    filtered,
    historyHits,
    isMac,
    openDashboardTab,
    openExternal,
    query,
    runCompareSearch,
    runEngineSearch,
    settings,
    topSites,
  ]);

  useEffect(() => {
    setActiveCommand(0);
  }, [commandItems.length, query]);

  const runCommand = useCallback(
    (index = activeCommand) => {
      const cmd = commandItems[index] ?? commandItems[0];
      cmd?.onRun();
    },
    [activeCommand, commandItems],
  );

  const greeting = useGreeting();
  const showHero = !selected && !query.trim();
  const showGithubTrendingWidget = settings.showGithubTrendingWidget ?? true;
  const showInfoCollections = settings.showInfoCollections ?? true;
  const showTopSites = settings.showTopSites ?? true;
  const hasTopSitesSection = showTopSites && topSites.length > 0;

  const hideHomeWidget = useCallback(
    async (
      key:
        | "showGithubTrendingWidget"
        | "showInfoCollections"
        | "showTopSites",
      shortNameKey: string,
    ) => {
      await setSettings({ [key]: false });
      toast(t("home.widgetHidden", t(shortNameKey)), "success");
    },
    [t],
  );

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[240px_minmax(0,1fr)] 2xl:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="space-y-3 md:sticky md:top-20 md:self-start">
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

      <section className="min-w-0 space-y-5">
        {showHero && (
          <div className="mb-2 pt-4 text-center">
            <div className="text-2xl font-semibold tracking-tight text-foreground/90">
              {greeting} <span className="ml-1">👋</span>
            </div>
          </div>
        )}

        <form
          onSubmit={onSubmitSearch}
          className="relative mx-auto w-full max-w-3xl"
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
              onOpenChange={(open) => {
                if (open) setSearchFocused(false);
              }}
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
                    (e.key === "ArrowDown" || e.key === "ArrowUp") &&
                    commandItems.length
                  ) {
                    e.preventDefault();
                    setSearchFocused(true);
                    setActiveCommand((idx) => {
                      const delta = e.key === "ArrowDown" ? 1 : -1;
                      return (idx + delta + commandItems.length) %
                        commandItems.length;
                    });
                    return;
                  }
                  if (
                    e.key === "Enter" &&
                    (e.metaKey || e.ctrlKey) &&
                    query.trim()
                  ) {
                    e.preventDefault();
                    runCompareSearch(query);
                    return;
                  }
                  if (e.key === "Enter" && searchFocused && commandItems.length) {
                    e.preventDefault();
                    runCommand(activeCommand);
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

          {searchFocused && commandItems.length > 0 && (
            <SearchCommandPalette
              items={commandItems}
              activeIndex={activeCommand}
              onActiveChange={setActiveCommand}
              query={query}
              onClose={() => setSearchFocused(false)}
            />
          )}


        </form>

        {showHero && hasTopSitesSection && (
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

        {showHero && (() => {
          // 自适应布局分 3 种情况：
          // A. 信息差雷达 + 任意 sidebar widget → 三栏 (main + sidebar 280)
          // B. 只有信息差雷达 → 主区全宽，不显示 sidebar
          // C. 信息差雷达隐藏但 sidebar widget 还在 → widgets 从 sidebar fallback
          //    到主区，一个 widget 时整宽，两个时 md 起横排 1/2
          const hasRightWidgets = hasTopSitesSection || showGithubTrendingWidget;
          if (!showInfoCollections && !hasRightWidgets) return null;

          // 复用同一份 JSX 避免 props 列表重复；在三栏场景中会被渲染两次
          // （中小屏 fallback + xl sidebar），这点与旧逻辑保持一致
          const infoEl = showInfoCollections && (
            <InfoCollections
              language={settings.language}
              onHide={() =>
                hideHomeWidget(
                  "showInfoCollections",
                  "home.widgetShort.infoCollections",
                )
              }
              hideLabel={t("home.hideWidget")}
              hideTooltip={t(
                "home.hideWidgetTooltip",
                t("home.widgetShort.infoCollections"),
              )}
            />
          );
          const topSitesEl = hasTopSitesSection && (
            <TopSitesSidebar
              items={topSites}
              onHide={() =>
                hideHomeWidget("showTopSites", "home.widgetShort.topSites")
              }
              hideLabel={t("home.hideWidget")}
              hideTooltip={t(
                "home.hideWidgetTooltip",
                t("home.widgetShort.topSites"),
              )}
            />
          );
          const trendingEl = showGithubTrendingWidget && (
            <TrendingSidebar
              settings={settings}
              mode={widgetMode}
              onModeChange={setWidgetMode}
              range={widgetRange}
              onRangeChange={setWidgetRange}
              onOpenDiscover={onOpenDiscover}
              onHide={() =>
                hideHomeWidget(
                  "showGithubTrendingWidget",
                  "home.widgetShort.githubTrending",
                )
              }
              hideLabel={t("home.hideWidget")}
              hideTooltip={t(
                "home.hideWidgetTooltip",
                t("home.widgetShort.githubTrending"),
              )}
            />
          );

          // Case C: 信息差雷达隐藏 → sidebar widget 升级到主区
          if (!showInfoCollections) {
            const twoWidgets = hasTopSitesSection && showGithubTrendingWidget;
            return (
              <div
                className={cn(
                  "grid gap-5 pt-2 grid-cols-1",
                  twoWidgets && "md:grid-cols-2",
                )}
              >
                {topSitesEl}
                {trendingEl}
              </div>
            );
          }

          // Case B: 只有信息差雷达 → 主区独占全宽
          if (!hasRightWidgets) {
            return <div className="pt-2">{infoEl}</div>;
          }

          // Case A: 三栏（主区信息差雷达 + 右栏 widget 堆叠）
          // 主区 grid cell 默认 stretch 到 sidebar 高度；主区内用 flex flex-col 让
          // InfoCollections 撑满（其内部 iframe 容器 flex-1，拉伸消除底部留白）
          return (
            <div className="grid grid-cols-1 gap-5 pt-2 xl:grid-cols-[minmax(0,1fr)_280px]">
              <div className="min-w-0 space-y-5 xl:flex xl:flex-col xl:gap-5 xl:space-y-0">
                <div className="xl:flex xl:flex-1 xl:min-h-0 xl:flex-col">
                  {infoEl}
                </div>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:hidden">
                  {topSitesEl}
                  {trendingEl}
                </div>
              </div>
              {/* 右栏：仅 xl+，280px 固定，sticky 跟随主区滚动 */}
              <aside className="hidden space-y-5 xl:block xl:sticky xl:top-20 xl:self-start">
                {topSitesEl}
                {trendingEl}
              </aside>
            </div>
          );
        })()}

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

        {filtered.length > 0 && (
          <div className="flex flex-wrap items-end justify-between gap-2 border-b pb-1.5 pt-2">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 text-primary">
                <Folder className="h-3.5 w-3.5" />
              </div>
              <h2 className="text-sm font-semibold tracking-tight">
                我的书签
              </h2>
              <span className="text-[11px] text-muted-foreground">
                · 共 {filtered.length} 个
                {query.trim() ? "（已过滤）" : ""}
              </span>
              {pageSize !== Infinity && filtered.length > pageSize && (
                <span className="text-[11px] text-muted-foreground/70">
                  · 第 {(page - 1) * pageSize + 1}-
                  {Math.min(page * pageSize, filtered.length)} 条
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {canReorder && (
                <span className="hidden items-center gap-1 text-[11px] text-muted-foreground sm:inline-flex">
                  <GripVertical className="h-3 w-3" />
                  {t("dash.dragHint")}
                </span>
              )}
              <PageSizePicker value={pageSize} onChange={onChangePageSize} />
              {pageSize !== Infinity && pageCount > 1 && (
                <Pager page={page} pageCount={pageCount} onChange={setPage} />
              )}
            </div>
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
          {pagedItems.map((b) => (
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

        {pageSize !== Infinity &&
          pageCount > 1 &&
          filtered.length > 0 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Pager page={page} pageCount={pageCount} onChange={setPage} />
              <span className="text-[11px] text-muted-foreground">
                共 {filtered.length} 条
              </span>
            </div>
          )}
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

function SearchCommandPalette({
  items,
  activeIndex,
  onActiveChange,
  query,
  onClose,
}: {
  items: SearchCommandItem[];
  activeIndex: number;
  onActiveChange: (index: number) => void;
  query: string;
  onClose: () => void;
}) {
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    itemRefs.current[activeIndex]?.scrollIntoView({
      block: "nearest",
    });
  }, [activeIndex]);

  return (
    <div className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-40 overflow-hidden rounded-2xl border border-border/80 bg-popover/95 shadow-2xl shadow-slate-950/10 ring-1 ring-black/5 backdrop-blur supports-[backdrop-filter]:bg-popover/90 dark:ring-white/10">
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onClose}
        className="absolute right-2 top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground"
        title="关闭"
        aria-label="关闭搜索结果"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-muted/40 px-3 py-2 pr-10 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Command className="h-3.5 w-3.5" />
          {query.trim() ? "统一搜索" : "快捷入口"}
        </span>
        <span>↑↓ 选择 · Enter 打开</span>
      </div>
      <div className="max-h-[360px] overflow-auto px-1.5 py-1 scrollbar-thin">
        <div className="divide-y divide-border/60">
          {items.map((item, index) => {
            const active = activeIndex === index;
            const Icon = item.Icon ?? BookmarkIcon;
            return (
              <div key={item.id} className="py-1 first:pt-0 last:pb-0">
                <button
                  ref={(node) => {
                    itemRefs.current[index] = node;
                  }}
                  type="button"
                  onMouseEnter={() => onActiveChange(index)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={item.onRun}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition duration-150",
                    active
                      ? "bg-primary/10 text-foreground shadow-sm ring-1 ring-primary/20"
                      : "text-foreground hover:bg-accent/70",
                  )}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background shadow-[0_1px_0_rgba(15,23,42,0.03)] ring-1 ring-border/80">
                    {item.iconUrl ? (
                      <img
                        src={item.iconUrl}
                        alt=""
                        className="h-4 w-4 rounded"
                        onError={(e) =>
                          (e.currentTarget.style.visibility = "hidden")
                        }
                      />
                    ) : (
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {item.title}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {item.subtitle}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1",
                      searchBadgeClass(item),
                    )}
                  >
                    {searchBadgeLabel(item)}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function searchBadgeLabel(item: SearchCommandItem): string {
  if (item.id === "engine-default") return "回车";
  if (item.id === "engine-compare") return "对比";
  if (item.id.startsWith("bookmark-")) return "书签";
  if (item.id.startsWith("history-")) return "历史";
  if (item.id.startsWith("top-")) return "常去";
  if (item.id.startsWith("action-")) return "动作";
  return item.badge;
}

function searchBadgeClass(item: SearchCommandItem): string {
  if (item.id === "engine-default") {
    return "bg-primary/10 text-primary ring-primary/20";
  }
  if (item.id === "engine-compare") {
    return "bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300";
  }
  if (item.id.startsWith("bookmark-")) {
    return "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300";
  }
  if (item.id.startsWith("history-")) {
    return "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300";
  }
  if (item.id.startsWith("top-")) {
    return "bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-300";
  }
  return "bg-muted text-muted-foreground ring-border";
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

function PageSizePicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const options: Array<{ v: number; label: string }> = [
    { v: 24, label: "24" },
    { v: 60, label: "60" },
    { v: 120, label: "120" },
    { v: 240, label: "240" },
    { v: Infinity, label: "全部" },
  ];
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [open]);
  const current = options.find((o) => o.v === value)?.label ?? String(value);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-md border bg-card px-2 py-1 text-[11px] text-muted-foreground transition hover:bg-accent hover:text-foreground"
        title="每页条数"
      >
        每页 {current}
        <ChevronRight
          className={cn("h-3 w-3 transition-transform", open && "rotate-90")}
        />
      </button>
      {open && (
        <div
          className="absolute right-0 top-8 z-40 w-28 rounded-lg border bg-popover p-1 shadow-xl ring-1 ring-black/5 dark:ring-white/5"
          onClick={(e) => e.stopPropagation()}
        >
          {options.map((o) => (
            <button
              key={o.label}
              type="button"
              onClick={() => {
                onChange(o.v);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition hover:bg-accent",
                value === o.v && "bg-accent font-medium",
              )}
            >
              <span>{o.label}</span>
              {value === o.v && (
                <span className="text-[10px] text-primary">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 生成现代风格分页的页码序列：[1, "...", 4, 5, 6, "...", 19]
 * 始终显示首末页，当前页±1 作为邻页，其余用 ellipsis 合并。
 */
function buildPageRange(
  current: number,
  total: number,
  neighbor = 1,
): Array<number | "ellipsis-l" | "ellipsis-r"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const out: Array<number | "ellipsis-l" | "ellipsis-r"> = [];
  const left = Math.max(2, current - neighbor);
  const right = Math.min(total - 1, current + neighbor);
  out.push(1);
  if (left > 2) out.push("ellipsis-l");
  for (let i = left; i <= right; i++) out.push(i);
  if (right < total - 1) out.push("ellipsis-r");
  out.push(total);
  return out;
}

function Pager({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (p: number) => void;
}) {
  const [jumpOpen, setJumpOpen] = useState(false);
  const [jumpValue, setJumpValue] = useState("");
  const jumpRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!jumpOpen) return;
    const close = (e: MouseEvent) => {
      if (!jumpRef.current) return;
      if (!jumpRef.current.contains(e.target as Node)) setJumpOpen(false);
    };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [jumpOpen]);

  const prev = () => onChange(Math.max(1, page - 1));
  const next = () => onChange(Math.min(pageCount, page + 1));
  const items = buildPageRange(page, pageCount);

  const doJump = () => {
    const n = Number(jumpValue);
    if (Number.isFinite(n) && n >= 1 && n <= pageCount) {
      onChange(Math.floor(n));
      setJumpOpen(false);
      setJumpValue("");
    }
  };

  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        disabled={page <= 1}
        onClick={prev}
        className="flex h-7 w-7 items-center justify-center rounded-md border bg-card text-muted-foreground transition hover:border-primary/30 hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:bg-card disabled:hover:text-muted-foreground"
        aria-label="上一页"
      >
        <ChevronRight className="h-3.5 w-3.5 rotate-180" />
      </button>
      {items.map((it, idx) => {
        if (it === "ellipsis-l" || it === "ellipsis-r") {
          return (
            <div
              key={`${it}-${idx}`}
              ref={it === "ellipsis-r" ? jumpRef : undefined}
              className="relative"
            >
              <button
                type="button"
                onClick={() => {
                  setJumpOpen((v) => !v);
                  setJumpValue("");
                }}
                className="flex h-7 min-w-[28px] items-center justify-center rounded-md text-[12px] text-muted-foreground/80 transition hover:bg-accent hover:text-foreground"
                title="跳转页"
              >
                …
              </button>
              {jumpOpen && it === "ellipsis-r" && (
                <div
                  className="absolute left-1/2 top-9 z-40 -translate-x-1/2 rounded-lg border bg-popover p-2 shadow-xl ring-1 ring-black/5 dark:ring-white/5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1">
                    <input
                      autoFocus
                      type="number"
                      min={1}
                      max={pageCount}
                      value={jumpValue}
                      onChange={(e) => setJumpValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") doJump();
                        else if (e.key === "Escape") setJumpOpen(false);
                      }}
                      placeholder={`1-${pageCount}`}
                      className="h-7 w-24 rounded-md border bg-background px-2 text-xs tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <button
                      type="button"
                      onClick={doJump}
                      className="h-7 rounded-md bg-primary px-2 text-[11px] font-medium text-primary-foreground transition hover:opacity-90"
                    >
                      跳转
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        }
        const active = it === page;
        return (
          <button
            key={it}
            type="button"
            onClick={() => onChange(it)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-7 min-w-[28px] items-center justify-center rounded-md px-2 text-[12px] tabular-nums transition",
              active
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                : "border bg-card text-muted-foreground hover:border-primary/30 hover:bg-accent hover:text-foreground",
            )}
          >
            {it}
          </button>
        );
      })}
      <button
        type="button"
        disabled={page >= pageCount}
        onClick={next}
        className="flex h-7 w-7 items-center justify-center rounded-md border bg-card text-muted-foreground transition hover:border-primary/30 hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:bg-card disabled:hover:text-muted-foreground"
        aria-label="下一页"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
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
