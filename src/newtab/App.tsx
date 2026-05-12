import { useCallback, useEffect, useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bookmark,
  Sparkles,
  Wand2,
  Settings2,
  Columns,
  HardDriveDownload,
  Flame,
} from "lucide-react";
import Dashboard from "./pages/Dashboard";
import Cleaner from "./pages/Cleaner";
import AiPanel from "./pages/AiPanel";
import SettingsPage from "./pages/Settings";
import Compare from "./pages/Compare";
import BackupPage from "./pages/Backup";
import Discover from "./pages/Discover";
import QrDialog from "./pages/QrDialog";
import { getSettings, onSettingsChange } from "@/lib/storage";
import type { Settings } from "@/types";
import { useT } from "@/lib/i18n";
import { ToastHost } from "@/components/ui/toast";
import ThemeToggle from "@/components/ThemeToggle";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import LanguageSwitcher from "@/components/LanguageSwitcher";

type TabId =
  | "dashboard"
  | "discover"
  | "cleaner"
  | "ai"
  | "compare"
  | "backup"
  | "settings";

function readHashTab(): TabId {
  const h = window.location.hash.slice(1);
  const params = new URLSearchParams(h);
  const t = params.get("tab");
  if (
    t === "cleaner" ||
    t === "ai" ||
    t === "settings" ||
    t === "compare" ||
    t === "backup" ||
    t === "discover"
  )
    return t;
  return "dashboard";
}

function readHashParam(key: string): string {
  const params = new URLSearchParams(window.location.hash.slice(1));
  return params.get(key) ?? "";
}

export default function App() {
  const t = useT();
  const [tab, setTab] = useState<TabId>(readHashTab);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [initialQuery] = useState(() => readHashParam("q"));
  const [qr, setQr] = useState<string>(() => readHashParam("qr"));

  /** 切换 Tab 并同步到 hash，避免只改 state 导致地址栏与「查看全部」和 Hash 不同步。 */
  const setTabWithHash = useCallback((id: TabId) => {
    setTab(id);
    const p = new URLSearchParams(window.location.hash.slice(1));
    p.set("tab", id);
    const s = p.toString();
    const next = s ? "#" + s : "#";
    if (window.location.hash !== next) {
      window.location.hash = next;
    }
  }, []);

  useEffect(() => {
    getSettings().then(setSettings);
    const off = onSettingsChange(setSettings);
    const onHash = () => {
      setTab(readHashTab());
      setQr(readHashParam("qr"));
    };
    window.addEventListener("hashchange", onHash);
    return () => {
      off();
      window.removeEventListener("hashchange", onHash);
    };
  }, []);

  const bg = useMemo(() => {
    if (!settings?.wallpaper) return undefined;
    return { backgroundImage: `url(${settings.wallpaper})` };
  }, [settings?.wallpaper]);

  if (!settings) return null;

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed" style={bg}>
      <div className="min-h-screen bg-background/85 backdrop-blur-sm">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-indigo-500/8 via-fuchsia-500/5 to-transparent" />
        <header className="sticky top-0 z-20 border-b bg-background/75 backdrop-blur">
          <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-5 py-3 sm:px-6 2xl:px-8">
            {/*
              Header 三段均衡排版（参考 Tailwind docs / Apple / Notion 等无 search
              bar 站点）：
                左：品牌身份（logo + 标题 + 版本）
                中：主导航 Tabs（由两侧 flex-1 spacer 推到画布中央）
                右：utility segmented group（语言 / 主题色 / 主题模式 连体胶囊）
              双侧 flex-1 spacer 等分剩余空间，让 Tabs 居中；右侧 3 个 pill 共享
              一个 rounded-full border 容器、靠 `divide-x` 内部 1px 分割，视觉上
              成为一个独立的"偏好集群" widget。
            */}
            <div className="flex shrink-0 items-center gap-2 whitespace-nowrap font-semibold">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-md shadow-indigo-500/20">
                <Bookmark className="h-4 w-4" />
              </div>
              <span className="tracking-tight">{t("app.title")}</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                v0.2
              </span>
            </div>
            <div className="min-w-0 flex-1" />
            <Tabs value={tab} onValueChange={(v) => setTabWithHash(v as TabId)}>
              <TabsList className="h-9 gap-0.5 bg-transparent p-0">
                {(
                  [
                    ["dashboard", Bookmark, t("tabs.dashboard")],
                    ["discover", Flame, t("tabs.discover")],
                    ["cleaner", Wand2, t("tabs.cleaner")],
                    ["compare", Columns, t("tabs.compare")],
                    ["ai", Sparkles, t("tabs.ai")],
                    ["backup", HardDriveDownload, t("tabs.backup")],
                    ["settings", Settings2, t("tabs.settings")],
                  ] as const
                ).map(([id, Icon, label]) => (
                  <TabsTrigger
                    key={id}
                    value={id}
                    className="relative h-8 gap-1.5 rounded-md px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none after:pointer-events-none after:absolute after:inset-x-2.5 after:-bottom-[7px] after:h-[2px] after:rounded-full after:bg-primary after:opacity-0 data-[state=active]:after:opacity-100"
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.8} /> {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="min-w-0 flex-1" />
            {/*
              Utility segmented group（连体胶囊）：
              - 外层一个 rounded-full border + shared bg，3 个偏好控件视觉合并为「一个 widget」
              - `divide-x divide-border/60` 自动在子项之间画 1px 分隔线
              - 内部每个组件传入 className 去掉自身的 rounded-full / border / bg
                （依靠 tailwind-merge 的同属性覆盖能力，无需修改组件内部）
              - `overflow-hidden` 把 hover 高亮的色块裁剪到胶囊形状内
            */}
            <div className="inline-flex h-8 shrink-0 items-center divide-x divide-border/60 overflow-hidden rounded-full border bg-background/60 shadow-sm backdrop-blur">
              <LanguageSwitcher className="h-full rounded-none border-0 bg-transparent shadow-none" />
              <ThemeSwitcher className="h-full rounded-none border-0 bg-transparent shadow-none" />
              <ThemeToggle className="h-full rounded-none border-0 bg-transparent shadow-none" />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] px-5 py-6 sm:px-6 2xl:px-8">
          {tab === "dashboard" && (
            <Dashboard
              settings={settings}
              initialQuery={initialQuery}
              onOpenDiscover={() => setTabWithHash("discover")}
            />
          )}
          {tab === "discover" && <Discover settings={settings} />}
          {tab === "cleaner" && <Cleaner />}
          {tab === "compare" && <Compare settings={settings} />}
          {tab === "ai" && <AiPanel settings={settings} />}
          {tab === "backup" && <BackupPage />}
          {tab === "settings" && <SettingsPage />}
        </main>

        <YearProgress />
        <footer className="py-4 text-center text-xs text-muted-foreground">
          Smart Bookmark · {t("app.tagline")}
        </footer>
      </div>

      {qr && (
        <QrDialog
          url={qr}
          onClose={() => {
            setQr("");
            const params = new URLSearchParams(window.location.hash.slice(1));
            params.delete("qr");
            const s = params.toString();
            window.history.replaceState(null, "", s ? "#" + s : "#");
          }}
        />
      )}

      <ToastHost />
    </div>
  );
}

function YearProgress() {
  const now = new Date();
  const year = now.getFullYear();
  const start = new Date(year, 0, 1).getTime();
  const end = new Date(year + 1, 0, 1).getTime();
  const pct = ((now.getTime() - start) / (end - start)) * 100;
  const cells = 20;
  const done = Math.round((pct / 100) * cells);
  return (
    <div className="mx-auto flex max-w-md items-center justify-center gap-2 py-4 text-[11px] text-muted-foreground">
      <span>{year} 年过去</span>
      <div className="flex gap-1">
        {Array.from({ length: cells }).map((_, i) => (
          <span
            key={i}
            className={
              "h-2 w-2 rounded-sm " +
              (i < done
                ? "bg-gradient-to-br from-indigo-500 to-fuchsia-500"
                : "bg-muted")
            }
          />
        ))}
      </div>
      <span>{pct.toFixed(1)}%</span>
    </div>
  );
}
