import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { scanAll, buildProfile, type Profile } from "@/lib/cleaner";
import type { CleanIssue } from "@/types";
import { removeBookmark, removeTree } from "@/lib/bookmarks";
import { hostnameOf, formatDate } from "@/lib/utils";
import BookmarkIcon from "@/components/BookmarkIcon";
import {
  AlertTriangle,
  Copy,
  FolderMinus,
  Link2Off,
  Play,
  Square,
  Trash2,
  Sparkles,
  Award,
  TrendingUp,
  Calendar,
  ShieldCheck,
  Globe,
  Clock,
} from "lucide-react";
import { useT, t } from "@/lib/i18n";
import LineChart from "@/components/LineChart";

const KIND_ICON: Record<CleanIssue["kind"], React.ComponentType<any>> = {
  invalid: Link2Off,
  duplicate: Copy,
  "empty-folder": FolderMinus,
  "broken-url": AlertTriangle,
};
const KIND_KEY: Record<CleanIssue["kind"], string> = {
  invalid: "cleaner.invalid",
  duplicate: "cleaner.duplicate",
  "empty-folder": "cleaner.emptyFolder",
  "broken-url": "cleaner.brokenUrl",
};

export default function Cleaner() {
  const t = useT();
  const [issues, setIssues] = useState<CleanIssue[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [checkInvalid, setCheckInvalid] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState({ checked: 0, total: 0 });
  const [phase, setPhase] = useState<string>("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    buildProfile().then(setProfile);
  }, []);

  const grouped = useMemo(() => {
    const m = new Map<CleanIssue["kind"], CleanIssue[]>();
    for (const it of issues) {
      if (!m.has(it.kind)) m.set(it.kind, []);
      m.get(it.kind)!.push(it);
    }
    return m;
  }, [issues]);

  const duplicateGroups = useMemo(() => {
    const all = grouped.get("duplicate") ?? [];
    const m = new Map<string, CleanIssue[]>();
    for (const it of all) {
      const k = it.group || it.id;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(it);
    }
    return m;
  }, [grouped]);

  const run = async () => {
    setScanning(true);
    setProgress({ checked: 0, total: 0 });
    setIssues([]);
    setSelected(new Set());
    setPhase("");
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const found = await scanAll({
        checkInvalid,
        concurrency: 8,
        signal: ctrl.signal,
        onProgress: (p) => {
          setProgress({ checked: p.checked, total: p.total });
          setPhase(p.phase);
        },
      });
      setIssues(found);
      setSelected(new Set(found.map((i) => i.id)));
      setProfile(await buildProfile());
    } finally {
      setScanning(false);
      abortRef.current = null;
    }
  };

  const stop = () => abortRef.current?.abort();

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleGroup = (kind: CleanIssue["kind"]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const ids = (grouped.get(kind) ?? []).map((i) => i.id);
      const allSel = ids.every((id) => next.has(id));
      for (const id of ids) (allSel ? next.delete(id) : next.add(id));
      return next;
    });
  };

  const dedupKeepNewest = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const list of duplicateGroups.values()) {
        const sorted = [...list].sort(
          (a, b) => (b.bookmark?.dateAdded ?? 0) - (a.bookmark?.dateAdded ?? 0),
        );
        sorted.forEach((it, i) => {
          if (i === 0) next.delete(it.id);
          else next.add(it.id);
        });
      }
      return next;
    });
  };

  const dedupKeepOldest = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const list of duplicateGroups.values()) {
        const sorted = [...list].sort(
          (a, b) => (a.bookmark?.dateAdded ?? 0) - (b.bookmark?.dateAdded ?? 0),
        );
        sorted.forEach((it, i) => {
          if (i === 0) next.delete(it.id);
          else next.add(it.id);
        });
      }
      return next;
    });
  };

  const dedupClearSelection = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const list of duplicateGroups.values()) {
        for (const it of list) next.delete(it.id);
      }
      return next;
    });
  };

  const applyClean = async () => {
    const toRemove = issues.filter((i) => selected.has(i.id));
    if (!toRemove.length) return;
    if (!confirm(t("cleaner.confirmClean", String(toRemove.length)))) return;
    for (const it of toRemove) {
      try {
        if (it.folderId) await removeTree(it.folderId);
        else if (it.bookmark) await removeBookmark(it.bookmark.id);
      } catch (e) {
        console.warn("remove failed", it, e);
      }
    }
    setIssues((prev) => prev.filter((i) => !selected.has(i.id)));
    setSelected(new Set());
    setProfile(await buildProfile());
  };

  const pct = progress.total ? (progress.checked / progress.total) * 100 : 0;

  return (
    <div className="space-y-4">
      {profile && <ProfileCard profile={profile} />}

      <Card>
        <CardHeader>
          <CardTitle>{t("cleaner.scan")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <Button onClick={run} disabled={scanning} className="gap-2">
              <Play className="h-4 w-4" /> {t("cleaner.start")}
            </Button>
            {scanning && (
              <Button variant="outline" onClick={stop} className="gap-2">
                <Square className="h-4 w-4" /> {t("cleaner.stop")}
              </Button>
            )}
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={checkInvalid} onCheckedChange={setCheckInvalid} />
              <span>{t("cleaner.checkInvalid")}</span>
            </label>
          </div>

          {scanning && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {t("cleaner.phase")}：{phase}
                </span>
                <span>
                  {progress.checked} / {progress.total}
                </span>
              </div>
              <Progress value={pct} />
            </div>
          )}
        </CardContent>
      </Card>

      {[...grouped.entries()].map(([kind, list]) => {
        const Icon = KIND_ICON[kind];
        return (
          <Card key={kind}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-destructive" />
                {t(KIND_KEY[kind])}
                <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                  {list.length}
                </span>
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                {kind === "duplicate" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-emerald-500/50 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
                      onClick={dedupKeepNewest}
                    >
                      {t("cleaner.keepNewest")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-sky-500/50 text-sky-600 hover:bg-sky-500/10 dark:text-sky-400"
                      onClick={dedupKeepOldest}
                    >
                      {t("cleaner.keepOldest")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={dedupClearSelection}
                    >
                      {t("cleaner.clearSelection")}
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleGroup(kind)}
                >
                  {t("cleaner.toggleAll")}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {kind === "duplicate"
                ? [...duplicateGroups.entries()].map(([gkey, items]) => (
                    <DuplicateGroup
                      key={gkey}
                      items={items}
                      selected={selected}
                      onToggle={toggle}
                    />
                  ))
                : list.map((it) => (
                    <IssueRow
                      key={it.id}
                      it={it}
                      checked={selected.has(it.id)}
                      onToggle={() => toggle(it.id)}
                    />
                  ))}
            </CardContent>
          </Card>
        );
      })}

      {!issues.length && !scanning && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t("cleaner.noResult")}
          </CardContent>
        </Card>
      )}

      {issues.length > 0 && (
        <div className="sticky bottom-4 flex items-center justify-between rounded-xl border bg-background/90 p-3 shadow-lg backdrop-blur">
          <div className="text-sm">
            {t(
              "cleaner.selectedOf",
              String(selected.size),
              String(issues.length),
            )}
          </div>
          <Button
            variant="destructive"
            onClick={applyClean}
            disabled={!selected.size}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" /> {t("cleaner.cleanSelected")}
          </Button>
        </div>
      )}
    </div>
  );
}

function IssueRow({
  it,
  checked,
  onToggle,
}: {
  it: CleanIssue;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 hover:bg-accent">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="mt-1 h-4 w-4 accent-primary"
      />
      {it.bookmark && (
        <BookmarkIcon
          url={it.bookmark.url}
          size={16}
          className="mt-0.5 h-4 w-4"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm">{it.title}</div>
        <div className="truncate text-xs text-muted-foreground">
          {it.bookmark ? hostnameOf(it.bookmark.url) + " · " : ""}
          {it.detail}
        </div>
      </div>
    </label>
  );
}

function DuplicateGroup({
  items,
  selected,
  onToggle,
}: {
  items: CleanIssue[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  const url = items[0]?.bookmark?.url ?? "";
  return (
    <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-2">
      <div className="mb-1 flex items-center gap-2 px-1 text-xs text-destructive/80">
        <Copy className="h-3 w-3" /> {t("cleaner.dupCount", String(items.length))}
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="ml-auto max-w-[70%] truncate text-primary hover:underline"
          title={url}
        >
          {url}
        </a>
      </div>
      <div className="divide-y divide-border/50">
        {items.map((it) => (
          <IssueRow
            key={it.id}
            it={it}
            checked={selected.has(it.id)}
            onToggle={() => onToggle(it.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ProfileCard({ profile }: { profile: Profile }) {
  const levelPct = Math.min(100, Math.round((profile.orgScore / 10) * 100));
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-indigo-500/10 via-fuchsia-500/5 to-transparent">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          {t("cleaner.profile")}
          <span className="ml-2 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-3 py-0.5 text-xs text-white">
            {profile.level.label}
          </span>
          {profile.orgScore > 0 && (
            <span className="ml-auto flex items-center gap-1 rounded-full bg-background px-3 py-0.5 text-xs shadow-sm">
              <Award className="h-3.5 w-3.5 text-amber-500" />
              {t("cleaner.orgScore", String(profile.orgScore))}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-12 gap-4 py-5">
        <div className="col-span-12 grid grid-cols-2 gap-3 md:col-span-7 md:grid-cols-3">
          <Stat icon={<Sparkles className="h-4 w-4 text-indigo-500" />} label={t("cleaner.stat.total")} value={profile.totalBookmarks} />
          <Stat icon={<FolderMinus className="h-4 w-4 text-amber-500" />} label={t("cleaner.stat.folders")} value={t("cleaner.stat.foldersValue", String(profile.totalFolders), String(profile.emptyFolders))} />
          <Stat icon={<Calendar className="h-4 w-4 text-emerald-500" />} label={t("cleaner.stat.collectDays")} value={profile.collectDays} />
          <Stat icon={<TrendingUp className="h-4 w-4 text-fuchsia-500" />} label={t("cleaner.stat.last30")} value={profile.addedThisMonth} />
          <Stat icon={<Clock className="h-4 w-4 text-sky-500" />} label={t("cleaner.stat.today")} value={profile.addedToday} />
          <Stat icon={<Globe className="h-4 w-4 text-rose-500" />} label={t("cleaner.stat.uniqueDomains")} value={profile.uniqueDomains} />
          <Stat icon={<ShieldCheck className="h-4 w-4 text-green-500" />} label={t("cleaner.stat.httpsRatio")} value={`${Math.round(profile.httpsRatio * 100)}%`} />
          <Stat icon={<Copy className="h-4 w-4 text-red-500" />} label={t("cleaner.stat.dupUrls")} value={profile.duplicateUrls} />
          <Stat icon={<Award className="h-4 w-4 text-amber-500" />} label={t("cleaner.stat.avgPerFolder")} value={profile.avgPerFolder} />
        </div>

        <div className="col-span-12 md:col-span-5 space-y-3">
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>{t("cleaner.yearTrend")}</span>
              {profile.busiestDay && (
                <span>
                  {t("cleaner.busiestDay", String(profile.busiestDay.date), String(profile.busiestDay.count))}
                </span>
              )}
            </div>
            <div className="text-primary">
              <LineChart data={profile.yearBuckets} />
            </div>
          </div>
          {profile.monthBuckets.length > 1 && (
            <div>
              <div className="mb-1 text-xs text-muted-foreground">{t("cleaner.last12Months")}</div>
              <div className="text-fuchsia-500">
                <LineChart data={profile.monthBuckets} />
              </div>
            </div>
          )}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500"
              style={{ width: `${levelPct}%` }}
            />
          </div>
        </div>

        <div className="col-span-12 grid gap-3 md:grid-cols-2">
          <div>
            <div className="mb-2 text-xs text-muted-foreground">{t("cleaner.topDomains")}</div>
            <div className="flex flex-wrap gap-1.5">
              {profile.topDomains.map((d) => (
                <span
                  key={d.domain}
                  className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
                >
                  {d.domain} · {d.count}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 text-xs text-muted-foreground">{t("cleaner.topKeywords")}</div>
            <div className="flex flex-wrap gap-1.5">
              {profile.topKeywords.map((k) => (
                <span
                  key={k.word}
                  className="rounded-full border px-2.5 py-1 text-xs"
                >
                  {k.word} · {k.count}
                </span>
              ))}
              {profile.topKeywords.length === 0 && (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </div>
          </div>
        </div>

        {profile.badges.length > 0 && (
          <div className="col-span-12">
            <div className="mb-2 text-xs text-muted-foreground">{t("cleaner.badges")}</div>
            <div className="flex flex-wrap gap-2">
              {profile.badges.map((b) => (
                <span
                  key={b.id}
                  className="rounded-full bg-gradient-to-r from-indigo-500/10 to-fuchsia-500/10 px-3 py-1 text-xs ring-1 ring-inset ring-primary/20"
                  title={b.detail}
                >
                  🏆 {b.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {(profile.oldest || profile.newest || profile.maxFolder) && (
          <div className="col-span-12 grid gap-3 md:grid-cols-3 text-xs">
            {profile.oldest && (
              <Mini label={t("cleaner.oldest")}>
                <div className="truncate font-medium">{profile.oldest.title}</div>
                <div className="truncate text-muted-foreground">
                  {formatDate(profile.oldest.dateAdded)}
                </div>
              </Mini>
            )}
            {profile.newest && (
              <Mini label={t("cleaner.newest")}>
                <div className="truncate font-medium">{profile.newest.title}</div>
                <div className="truncate text-muted-foreground">
                  {formatDate(profile.newest.dateAdded)}
                </div>
              </Mini>
            )}
            {profile.maxFolder && (
              <Mini label={t("cleaner.maxFolder")}>
                <div className="truncate font-medium">{profile.maxFolder.title}</div>
                <div className="text-muted-foreground">
                  {t("cleaner.countItems", String(profile.maxFolder.count))}
                </div>
              </Mini>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-background/60 p-3">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 truncate text-xl font-semibold">{value}</div>
    </div>
  );
}

function Mini({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-background/60 p-3">
      <div className="mb-1 text-[11px] text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}
