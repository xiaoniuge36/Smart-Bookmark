import { useEffect, useMemo, useState } from "react";
import { findFolder, getTree, flatten } from "@/lib/bookmarks";
import type { BookmarkNode, FlatBookmark, Settings } from "@/types";
import { Input } from "@/components/ui/input";
import {
  Bookmark,
  Search,
  Folder,
  ChevronRight,
  History as HistoryIcon,
} from "lucide-react";
import { faviconOf, hostnameOf, cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { getSettings, onSettingsChange, setSettings } from "@/lib/storage";
import ThemeToggle from "@/components/ThemeToggle";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import EngineSwitcher from "@/components/EngineSwitcher";
import { findEngine } from "@/lib/engines";

interface HistoryHit {
  url: string;
  title: string;
}

export default function SidePanel() {
  const t = useT();
  const [tree, setTree] = useState<BookmarkNode[]>([]);
  const [settings, setSettingsState] = useState<Settings | null>(null);
  const [query, setQuery] = useState("");
  const [openedIds, setOpenedIds] = useState<Set<string>>(new Set());
  const [historyHits, setHistoryHits] = useState<HistoryHit[]>([]);

  useEffect(() => {
    getTree().then(setTree);
    getSettings().then(setSettingsState);
    const off = onSettingsChange(setSettingsState);
    const onChange = () => getTree().then(setTree);
    chrome.bookmarks?.onCreated?.addListener(onChange);
    chrome.bookmarks?.onRemoved?.addListener(onChange);
    chrome.bookmarks?.onChanged?.addListener(onChange);
    chrome.bookmarks?.onMoved?.addListener(onChange);
    return () => {
      off();
      chrome.bookmarks?.onCreated?.removeListener(onChange);
      chrome.bookmarks?.onRemoved?.removeListener(onChange);
      chrome.bookmarks?.onChanged?.removeListener(onChange);
      chrome.bookmarks?.onMoved?.removeListener(onChange);
    };
  }, []);

  const topLevel: BookmarkNode[] = useMemo(() => {
    const roots: BookmarkNode[] = [];
    for (const n of tree) {
      for (const c of n.children ?? []) {
        if (!c.url) roots.push(c);
      }
    }
    return roots;
  }, [tree]);

  const flatSearch: FlatBookmark[] = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return flatten(tree)
      .filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.url.toLowerCase().includes(q) ||
          b.path.toLowerCase().includes(q),
      )
      .slice(0, 300);
  }, [tree, query]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setHistoryHits([]);
      return;
    }
    chrome.history?.search?.({ text: q, maxResults: 8 }, (res) => {
      setHistoryHits(
        (res || [])
          .filter((x) => x.url)
          .slice(0, 8)
          .map((x) => ({ url: x.url!, title: x.title || x.url! })),
      );
    });
  }, [query]);

  const onChangeEngine = async (id: string) => {
    await setSettings({ searchEngine: id });
  };

  const onSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    const q = query.trim();
    if (!q) return;
    const hit = flatSearch[0];
    if (hit) {
      window.open(hit.url, "_blank");
      return;
    }
    const engine = findEngine(settings, settings.searchEngine);
    if (engine) window.open(engine.url(q), "_blank");
  };

  const pinnedFolder = useMemo(() => {
    if (settings?.rootFolderId) {
      const f = findFolder(tree, settings.rootFolderId);
      if (f) return f;
    }
    return topLevel[0];
  }, [tree, settings?.rootFolderId, topLevel]);

  const pinnedBookmarks: FlatBookmark[] = useMemo(() => {
    if (!pinnedFolder) return [];
    const flat = flatten([pinnedFolder], "");
    return flat.slice(0, 12);
  }, [pinnedFolder]);

  const onPickPinned = async (id: string) => {
    await setSettings({ rootFolderId: id });
  };

  const toggleFolder = (id: string) => {
    setOpenedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const linksOf = (n: BookmarkNode): FlatBookmark[] => {
    return (n.children ?? [])
      .filter((c) => !!c.url)
      .map((c) => ({
        id: c.id,
        title: c.title || c.url!,
        url: c.url!,
        path: n.title ?? "",
        dateAdded: c.dateAdded,
      }));
  };

  const subFoldersOf = (n: BookmarkNode): BookmarkNode[] => {
    return (n.children ?? []).filter((c) => !c.url);
  };

  return (
    <div className="flex h-screen flex-col bg-gradient-to-b from-background to-background/60 text-foreground">
      <header className="border-b px-3 pb-3 pt-4">
        <div className="mb-3 flex items-center gap-2">
          <Bookmark className="h-4 w-4 text-primary" />
          <span className="flex-1 font-semibold">{t("side.title")}</span>
          <LanguageSwitcher variant="icon" />
          <ThemeSwitcher variant="icon" />
          <ThemeToggle />
        </div>
        <form onSubmit={onSubmitSearch} className="flex items-center gap-1 rounded-full border bg-card pl-1 pr-1">
          {settings && (
            <EngineSwitcher
              settings={settings}
              value={settings.searchEngine}
              onChange={onChangeEngine}
            />
          )}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("side.placeholder")}
              className="h-9 border-0 bg-transparent pl-8 shadow-none focus-visible:ring-0"
            />
          </div>
        </form>
      </header>

      <div className="flex-1 overflow-auto scrollbar-thin">
        {query.trim() ? (
          <SearchResults items={flatSearch} historyHits={historyHits} />
        ) : (
          <>
            {pinnedFolder && pinnedBookmarks.length > 0 && (
              <section className="px-3 pt-3">
                <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{pinnedFolder.title}</span>
                  {topLevel.length > 1 && (
                    <select
                      value={pinnedFolder.id}
                      onChange={(e) => onPickPinned(e.target.value)}
                      className="rounded-md border bg-background px-2 py-1 text-xs"
                    >
                      {topLevel.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {pinnedBookmarks.map((b) => (
                    <a
                      key={b.id}
                      href={b.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex flex-col items-center gap-1"
                      title={b.url}
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-background shadow-sm ring-1 ring-border transition group-hover:-translate-y-0.5 group-hover:shadow-md">
                        <img
                          src={faviconOf(b.url)}
                          alt=""
                          className="h-5 w-5"
                          onError={(e) =>
                            (e.currentTarget.style.visibility = "hidden")
                          }
                        />
                      </div>
                      <div className="w-full truncate text-center text-[10px] text-muted-foreground">
                        {b.title}
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}

            <section className="mt-4 px-3 pb-3">
              <div className="mb-2 px-1 text-xs font-medium text-muted-foreground">
                收藏夹栏
              </div>
              <div className="space-y-1.5">
                {topLevel.map((f) => (
                  <SidepanelFolder
                    key={f.id}
                    folder={f}
                    openedIds={openedIds}
                    onToggle={toggleFolder}
                    linksOf={linksOf}
                    subFoldersOf={subFoldersOf}
                    depth={0}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function SidepanelFolder({
  folder,
  openedIds,
  onToggle,
  linksOf,
  subFoldersOf,
  depth,
}: {
  folder: BookmarkNode;
  openedIds: Set<string>;
  onToggle: (id: string) => void;
  linksOf: (n: BookmarkNode) => FlatBookmark[];
  subFoldersOf: (n: BookmarkNode) => BookmarkNode[];
  depth: number;
}) {
  const isOpen = openedIds.has(folder.id);
  const links = isOpen ? linksOf(folder) : [];
  const subs = isOpen ? subFoldersOf(folder) : [];
  const count = countAll(folder);
  const header = (
    <button
      onClick={() => onToggle(folder.id)}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-accent",
        depth === 0 ? "border bg-card shadow-sm" : "",
      )}
      style={{ paddingLeft: 12 + depth * 10 + "px" }}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 text-primary",
          depth === 0 ? "h-7 w-7" : "h-5 w-5",
        )}
      >
        <Folder className={depth === 0 ? "h-4 w-4" : "h-3 w-3"} />
      </div>
      <span
        className={cn(
          "flex-1 truncate text-sm",
          depth === 0 && "font-medium",
        )}
      >
        {folder.title || "(未命名)"}
      </span>
      <span className="text-xs text-muted-foreground">{count}</span>
      <ChevronRight
        className={cn(
          "h-4 w-4 text-muted-foreground transition-transform",
          isOpen && "rotate-90",
        )}
      />
    </button>
  );

  return (
    <div className={depth === 0 ? "rounded-xl" : ""}>
      {header}
      {isOpen && (
        <div className={cn("mt-1 space-y-1", depth >= 0 && "pl-2")}>
          {subs.map((s) => (
            <SidepanelFolder
              key={s.id}
              folder={s}
              openedIds={openedIds}
              onToggle={onToggle}
              linksOf={linksOf}
              subFoldersOf={subFoldersOf}
              depth={depth + 1}
            />
          ))}
          {links.length > 0 && (
            <div className="space-y-0.5 rounded-lg">
              {links.slice(0, 50).map((b) => (
                <a
                  key={b.id}
                  href={b.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-md px-2 py-1 text-xs transition hover:bg-accent"
                  style={{ paddingLeft: 14 + depth * 10 + "px" }}
                  title={b.url}
                >
                  <img
                    src={faviconOf(b.url, 16)}
                    alt=""
                    className="h-4 w-4 rounded"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{b.title}</div>
                  </div>
                </a>
              ))}
            </div>
          )}
          {links.length === 0 && subs.length === 0 && (
            <div className="px-3 py-1 text-[11px] text-muted-foreground">
              空
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SearchResults({
  items,
  historyHits,
}: {
  items: FlatBookmark[];
  historyHits: HistoryHit[];
}) {
  const t = useT();
  const hasBookmarks = items.length > 0;
  const hasHistory = historyHits.length > 0;
  if (!hasBookmarks && !hasHistory)
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        {t("side.empty")}
      </div>
    );
  return (
    <div>
      {hasBookmarks && (
        <div>
          <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
            <Bookmark className="mr-1 inline h-3 w-3" /> 书签
          </div>
          {items.map((b) => (
            <a
              key={b.id}
              href={b.url}
              target="_blank"
              rel="noreferrer"
              className="group flex items-start gap-2 border-b px-3 py-2 text-sm transition hover:bg-accent"
              title={b.url}
            >
              <img
                src={faviconOf(b.url, 16)}
                alt=""
                className="mt-0.5 h-4 w-4 rounded"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{b.title}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {hostnameOf(b.url)}
                  {b.path ? ` · ${b.path}` : ""}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
      {hasHistory && (
        <div className="mt-2">
          <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
            <HistoryIcon className="mr-1 inline h-3 w-3" /> 浏览历史
          </div>
          {historyHits.map((h) => (
            <a
              key={h.url}
              href={h.url}
              target="_blank"
              rel="noreferrer"
              className="group flex items-start gap-2 border-b px-3 py-2 text-sm transition hover:bg-accent"
              title={h.url}
            >
              <img
                src={faviconOf(h.url, 16)}
                alt=""
                className="mt-0.5 h-4 w-4 rounded"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate">{h.title}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {hostnameOf(h.url)}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function countAll(n: BookmarkNode): number {
  if (n.url) return 1;
  return (n.children ?? []).reduce((s, c) => s + countAll(c), 0);
}
