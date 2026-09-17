import { useEffect, useRef, useState } from "react";
import type { Settings } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Search,
  Sparkles,
  Copy,
  History as HistoryIcon,
  X,
  Loader2,
  Send,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { allEngines, type EngineDef } from "@/lib/engines";
import { setSettings } from "@/lib/storage";
import { chat } from "@/lib/ai";
import { toast } from "@/components/ui/toast";
import EngineIcon from "@/components/EngineIcon";

const HISTORY_KEY = "smart-bookmark::compare-history";

export default function Compare({ settings }: { settings: Settings }) {
  const t = useT();
  const engines = allEngines(settings);
  const selectedIds = settings.compareEngines?.length
    ? settings.compareEngines
    : ["google", "bing", "duckduckgo"];
  const selected = engines.filter((e) => selectedIds.includes(e.id));
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);

  const pushHistory = (q: string) => {
    if (!q) return;
    setHistory((prev) => {
      const next = [q, ...prev.filter((x) => x !== q)].slice(0, 8);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {}
  };

  const runEmbed = () => {
    const q = query.trim();
    if (!q) return;
    setSubmitted(q);
    pushHistory(q);
  };

  const openAllInTabs = () => {
    const q = query.trim();
    if (!q) return;
    for (const e of selected) {
      window.open(e.url(q), "_blank");
    }
    pushHistory(q);
  };

  const toggleEngine = async (id: string) => {
    const cur = new Set(selectedIds);
    cur.has(id) ? cur.delete(id) : cur.add(id);
    if (cur.size === 0) cur.add("google");
    await setSettings({ compareEngines: Array.from(cur) });
  };

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-br from-indigo-500/10 via-fuchsia-500/5 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" /> {t("compare.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              openAllInTabs();
            }}
            className="flex flex-wrap gap-2"
          >
            <div className="relative flex-1 min-w-[280px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("compare.placeholder")}
                className="pl-9"
              />
            </div>
            <Button type="submit" className="gap-2">
              <ExternalLink className="h-4 w-4" /> {t("compare.openAllEngines")}
            </Button>
            <Button type="button" variant="outline" onClick={runEmbed}>
              {t("compare.showEmbed")}
            </Button>
          </form>

          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">{t("compare.selectEngines")}</div>
            <div className="flex flex-wrap gap-2">
              {engines.map((e) => {
                const on = selectedIds.includes(e.id);
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => toggleEngine(e.id)}
                    className={
                      "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition " +
                      (on
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "bg-background hover:bg-accent")
                    }
                  >
                    <EngineIcon engine={e} className="h-3.5 w-3.5" />
                    {e.name}
                  </button>
                );
              })}
            </div>
          </div>

          {history.length > 0 && (
            <div className="space-y-2 border-t pt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <HistoryIcon className="h-3 w-3" /> {t("compare.recentSearches")}
                </span>
                <button
                  onClick={clearHistory}
                  className="hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {history.map((h) => (
                  <button
                    key={h}
                    onClick={() => {
                      setQuery(h);
                      setSubmitted(h);
                    }}
                    className="rounded-full bg-muted px-3 py-1 text-xs hover:bg-accent"
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {settings.aiProvider !== "none" && settings.aiApiKey && (
        <AiAnswer query={submitted || query.trim()} settings={settings} />
      )}

      {submitted && selected.length > 0 && (
        <div
          className={
            selected.length <= 2
              ? "grid gap-4 md:grid-cols-2"
              : selected.length === 3
                ? "grid gap-4 md:grid-cols-3"
                : "grid gap-4 md:grid-cols-2 xl:grid-cols-4"
          }
        >
          {selected.map((e) => (
            <EngineColumn key={e.id} engine={e} query={submitted} />
          ))}
        </div>
      )}
    </div>
  );
}

function EngineColumn({
  engine,
  query,
}: {
  engine: EngineDef;
  query: string;
}) {
  const t = useT();
  const url = engine.url(query);

  const copyUrl = async () => {
    await navigator.clipboard.writeText(url);
    toast(t("common.copied"), "success");
  };

  return (
    <Card className="flex h-[70vh] flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <EngineIcon engine={engine} className="h-4 w-4" />
          {engine.name}
        </CardTitle>
        <div className="flex items-center gap-2">
          <button
            onClick={copyUrl}
            className="text-muted-foreground hover:text-primary"
            title={t("compare.copyUrl")}
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
          >
            {t("compare.openInNewTab")} <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        {engine.iframe ? (
          <iframe
            src={url}
            className="h-full w-full rounded-b-lg border-0"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-50 to-slate-100 p-6 text-center text-sm dark:from-slate-800 dark:to-slate-900">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/80 shadow-sm dark:bg-slate-900/60">
              <EngineIcon engine={engine} className="h-7 w-7" />
            </div>
            <div className="text-muted-foreground">
              {t("compare.noEmbed", engine.name)}
            </div>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="rounded-md bg-primary px-4 py-2 text-primary-foreground shadow hover:opacity-90"
            >
              {t("compare.openEngine", engine.name)}
            </a>
            <code className="max-w-full break-all rounded bg-background/60 px-2 py-1 text-[10px] text-muted-foreground">
              {url}
            </code>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AiAnswer({
  query,
  settings,
}: {
  query: string;
  settings: Settings;
}) {
  const t = useT();
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!query) {
      setAnswer("");
      setTriggered(false);
    }
  }, [query]);

  const run = async () => {
    if (!query) return;
    setTriggered(true);
    setLoading(true);
    setAnswer("");
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      await chat({
        settings,
        signal: ctrl.signal,
        messages: [
          {
            role: "system",
            content:
              "你是一个搜索助手。用简洁的要点回答用户问题，中文为主，必要时附一句英文补充，不要使用 markdown 标题。",
          },
          { role: "user", content: query },
        ],
        onDelta: (d) => setAnswer((prev) => prev + d),
      });
    } catch (err: any) {
      setAnswer(`⚠️ ${err?.message ?? t("common.requestFailed")}`);
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const stop = () => abortRef.current?.abort();

  if (!query) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-primary" /> {t("compare.aiAnswer")}
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            {settings.aiProvider} · {settings.aiModel}
          </span>
        </CardTitle>
        {!triggered || (!loading && !answer) ? (
          <Button size="sm" className="gap-1.5" onClick={run}>
            <Send className="h-3.5 w-3.5" /> {t("compare.askAi")}
          </Button>
        ) : loading ? (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={stop}>
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t("compare.stop")}
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={run}>
            {t("compare.regenerate")}
          </Button>
        )}
      </CardHeader>
      {triggered && (
        <CardContent className="pt-0">
          <div className="whitespace-pre-wrap rounded-lg bg-muted/40 p-4 text-sm leading-relaxed">
            {answer || (loading ? "…" : "")}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
