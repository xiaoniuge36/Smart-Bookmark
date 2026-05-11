import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { getSettings, setSettings } from "@/lib/storage";
import type { AccentPreset, Settings, ThemePreset } from "@/types";
import { useT } from "@/lib/i18n";
import { testAi } from "@/lib/ai";
import { BUILTIN_ENGINES, faviconFor } from "@/lib/engines";
import { Check, CheckCircle2, XCircle, Loader2, Flame, ExternalLink } from "lucide-react";
import { COMMON_LANGUAGES, clearTrendingCache } from "@/lib/github";
import type { TrendingMode, TrendingRange, TrendingSort } from "@/types";
import { toast } from "@/components/ui/toast";
import { THEME_PRESETS } from "@/lib/themePresets";
import { HOME_WIDGETS } from "@/lib/homeWidgets";
import { cn } from "@/lib/utils";

const ENGINE_LIST = BUILTIN_ENGINES.slice(0, 10);

export default function SettingsPage() {
  const t = useT();
  const [s, setS] = useState<Settings | null>(null);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    latencyMs: number;
    message: string;
  } | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    getSettings().then(setS);
  }, []);

  if (!s) return null;

  const update = async (patch: Partial<Settings>) => {
    const next = await setSettings(patch);
    setS(next);
  };

  const toggleCompareEngine = async (id: string) => {
    const cur = new Set(s.compareEngines);
    cur.has(id) ? cur.delete(id) : cur.add(id);
    if (cur.size === 0) cur.add("google");
    await update({ compareEngines: Array.from(cur) });
  };

  const onTestAi = async () => {
    setTesting(true);
    setTestResult(null);
    const r = await testAi(s);
    setTestResult(r);
    setTesting(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.appearance")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Row label={t("settings.theme")}>
            <div className="flex gap-2">
              {(
                [
                  ["system", t("settings.themeAuto")],
                  ["light", t("settings.themeLight")],
                  ["dark", t("settings.themeDark")],
                ] as const
              ).map(([v, label]) => (
                <Button
                  key={v}
                  size="sm"
                  variant={s.theme === v ? "default" : "outline"}
                  onClick={() => update({ theme: v as Settings["theme"] })}
                >
                  {label}
                </Button>
              ))}
            </div>
          </Row>
          <Row label={t("settings.themePreset")}>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {THEME_PRESETS.map((p) => {
                  const active = (s.themePreset ?? "default") === p.key;
                  const isDark =
                    typeof document !== "undefined" &&
                    document.documentElement.classList.contains("dark");
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() =>
                        update({ themePreset: p.key as ThemePreset })
                      }
                      className={cn(
                        "group relative flex items-start gap-3 rounded-xl border bg-card p-3 text-left transition hover:border-primary/50 hover:shadow-sm",
                        active && "border-primary ring-2 ring-primary/20",
                      )}
                    >
                      <span
                        aria-hidden
                        className="mt-0.5 h-8 w-8 shrink-0 rounded-lg ring-1 ring-black/10 dark:ring-white/10"
                        style={{
                          backgroundColor: isDark
                            ? p.swatchDark
                            : p.swatchLight,
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-medium">
                            {p.shortLabel}
                          </span>
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            {p.label}
                          </span>
                        </div>
                        <div className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                          {p.description}
                        </div>
                      </div>
                      {active && (
                        <Check className="absolute right-2 top-2 h-4 w-4 text-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {t("settings.themePresetHint")}
              </p>
            </div>
          </Row>
          <Row label={t("settings.accent")}>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["linear", t("settings.accentLinear")],
                  ["indigo", t("settings.accentIndigo")],
                  ["blue", t("settings.accentBlue")],
                  ["emerald", t("settings.accentEmerald")],
                  ["rose", t("settings.accentRose")],
                  ["amber", t("settings.accentAmber")],
                  ["violet", t("settings.accentViolet")],
                  ["cyan", t("settings.accentCyan")],
                  ["orange", t("settings.accentOrange")],
                ] as const
              ).map(([v, label]) => (
                <Button
                  key={v}
                  size="sm"
                  variant={
                    (s.accentPreset ?? "linear") === v ? "default" : "outline"
                  }
                  onClick={() =>
                    update({ accentPreset: v as AccentPreset })
                  }
                >
                  {label}
                </Button>
              ))}
            </div>
            {(s.themePreset ?? "default") !== "default" && (
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                {t("settings.accentDisabledByPreset")}
              </p>
            )}
          </Row>
          <Row label={t("settings.density")}>
            <div className="flex gap-2">
              {(
                [
                  ["comfy", t("settings.densityComfy")],
                  ["compact", t("settings.densityCompact")],
                ] as const
              ).map(([v, label]) => (
                <Button
                  key={v}
                  size="sm"
                  variant={s.cardDensity === v ? "default" : "outline"}
                  onClick={() =>
                    update({ cardDensity: v as Settings["cardDensity"] })
                  }
                >
                  {label}
                </Button>
              ))}
            </div>
          </Row>
          <Row label={t("settings.wallpaper")}>
            <Input
              placeholder={t("settings.wallpaperPh")}
              value={s.wallpaper ?? ""}
              onChange={(e) =>
                update({ wallpaper: e.target.value || undefined })
              }
            />
          </Row>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.search")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Row label={t("settings.defaultEngine")}>
            <div className="flex flex-wrap gap-2">
              {ENGINE_LIST.slice(0, 6).map((e) => (
                <Button
                  key={e.id}
                  size="sm"
                  variant={s.searchEngine === e.id ? "default" : "outline"}
                  onClick={() => update({ searchEngine: e.id })}
                  className="gap-1.5"
                >
                  <img
                    src={faviconFor(e)}
                    alt=""
                    className="h-3.5 w-3.5 rounded"
                  />
                  {e.name}
                </Button>
              ))}
            </div>
          </Row>
          <Row label={t("settings.compareEngines")}>
            <div className="flex flex-wrap gap-2">
              {ENGINE_LIST.map((e) => {
                const on = s.compareEngines.includes(e.id);
                return (
                  <Button
                    key={e.id}
                    size="sm"
                    variant={on ? "default" : "outline"}
                    onClick={() => toggleCompareEngine(e.id)}
                    className="gap-1.5"
                  >
                    <img
                      src={faviconFor(e)}
                      alt=""
                      className="h-3.5 w-3.5 rounded"
                    />
                    {e.name}
                  </Button>
                );
              })}
            </div>
          </Row>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.extras")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Row label={t("settings.language")}>
            <div className="flex gap-2">
              {(
                [
                  ["auto", "Auto"],
                  ["zh", "中文"],
                  ["en", "English"],
                ] as const
              ).map(([v, label]) => (
                <Button
                  key={v}
                  size="sm"
                  variant={s.language === v ? "default" : "outline"}
                  onClick={() =>
                    update({ language: v as Settings["language"] })
                  }
                >
                  {label}
                </Button>
              ))}
            </div>
          </Row>
          <Row label={t("settings.floatingBall")}>
            <div className="flex items-center gap-3">
              <Switch
                checked={s.floatingBall}
                onCheckedChange={(v) => update({ floatingBall: v })}
              />
              <span className="text-xs text-muted-foreground">
                {t("settings.floatingBallHint")}
              </span>
            </div>
          </Row>
          <Row label={t("settings.floatingDisabledDomains")}>
            <div className="flex flex-wrap gap-2">
              {(s.floatingDisabledDomains ?? []).length === 0 ? (
                <span className="text-xs text-muted-foreground">
                  {t("settings.floatingDisabledDomainsEmpty")}
                </span>
              ) : (
                (s.floatingDisabledDomains ?? []).map((d) => (
                  <span
                    key={d}
                    className="group inline-flex items-center gap-1 rounded-full border bg-muted/60 px-2.5 py-1 text-xs"
                  >
                    <span className="font-medium">{d}</span>
                    <button
                      type="button"
                      className="ml-1 rounded-full p-0.5 text-muted-foreground transition hover:bg-background hover:text-foreground"
                      title={t("settings.floatingDisabledDomainsRemove")}
                      onClick={() =>
                        update({
                          floatingDisabledDomains: (
                            s.floatingDisabledDomains ?? []
                          ).filter((x) => x !== d),
                        })
                      }
                    >
                      <XCircle className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </Row>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.ai")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Row label={t("settings.provider")}>
            <div className="flex gap-2">
              {(
                [
                  ["none", t("settings.providerNone")],
                  ["openai", "OpenAI"],
                  ["anthropic", "Anthropic"],
                ] as const
              ).map(([v, label]) => (
                <Button
                  key={v}
                  size="sm"
                  variant={s.aiProvider === v ? "default" : "outline"}
                  onClick={() =>
                    update({ aiProvider: v as Settings["aiProvider"] })
                  }
                >
                  {label}
                </Button>
              ))}
            </div>
          </Row>
          <Row label={t("settings.model")}>
            <Input
              value={s.aiModel}
              placeholder="gpt-4o-mini / claude-3-5-sonnet-latest / deepseek-chat / moonshot-v1-8k"
              onChange={(e) => update({ aiModel: e.target.value })}
            />
          </Row>
          <Row label="Base URL">
            <Input
              value={s.aiBaseUrl}
              placeholder={
                s.aiProvider === "anthropic"
                  ? "https://api.anthropic.com（留空用默认）"
                  : "https://api.openai.com/v1（留空用默认，可填 DeepSeek/Kimi/自建代理等 OpenAI 兼容地址）"
              }
              onChange={(e) => update({ aiBaseUrl: e.target.value })}
            />
          </Row>
          <Row label={t("settings.apiKey")}>
            <Input
              type="password"
              value={s.aiApiKey}
              placeholder={t("settings.apiKeyPh")}
              onChange={(e) => update({ aiApiKey: e.target.value })}
            />
          </Row>
          <Row label="连通性">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onTestAi}
                disabled={testing || s.aiProvider === "none" || !s.aiApiKey}
                className="gap-2"
              >
                {testing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                测试连接
              </Button>
              {testResult && (
                <span
                  className={
                    "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs " +
                    (testResult.ok
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-destructive/10 text-destructive")
                  }
                >
                  {testResult.ok ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5" />
                  )}
                  {testResult.ok ? "成功" : "失败"} · {testResult.latencyMs}ms
                  <span className="max-w-[240px] truncate opacity-80">
                    · {testResult.message}
                  </span>
                </span>
              )}
            </div>
          </Row>
          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
            {t("settings.apiKeyNotice")} OpenAI 兼容接口（DeepSeek/Moonshot Kimi/LM Studio/Ollama 等）可通过自定义 Base URL 使用。
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-rose-500" />
            {t("settings.discover")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Row label={t("settings.homeWidgets")}>
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {t("settings.homeWidgetsHint")}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {HOME_WIDGETS.map((w) => {
                  const checked = s[w.key] ?? true;
                  const Icon = w.Icon;
                  return (
                    <label
                      key={w.key}
                      className={cn(
                        "group flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition",
                        checked
                          ? "border-primary/40 bg-primary/5 hover:bg-primary/10"
                          : "border-border bg-card/40 hover:bg-accent",
                      )}
                    >
                      <div
                        className={cn(
                          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br",
                          w.iconAccent,
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium leading-tight">
                          {t(w.titleKey)}
                        </div>
                        <div className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
                          {t(w.hintKey)}
                        </div>
                      </div>
                      <Switch
                        checked={checked}
                        onCheckedChange={(v) =>
                          update({ [w.key]: v } as Partial<Settings>)
                        }
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          </Row>
          <Row label={t("settings.githubToken")}>
            <div className="space-y-2">
              <Input
                type="password"
                value={s.githubToken ?? ""}
                placeholder="ghp_••••••••••••••••••••••••••••••••••••"
                onChange={(e) => update({ githubToken: e.target.value })}
              />
              <div className="flex items-center gap-2">
                <a
                  href="https://github.com/settings/tokens/new?description=Smart%20Bookmark&scopes=public_repo"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  {t("settings.githubTokenCreate")}
                  <ExternalLink className="h-3 w-3" />
                </a>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await clearTrendingCache();
                    toast("已清空 GitHub Trending 缓存", "success");
                  }}
                >
                  清空缓存
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                {t("settings.githubTokenHint")}
              </div>
            </div>
          </Row>
          <Row label={t("settings.discoverDefaults")}>
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  ["created", t("discover.mode.created")],
                  ["hottest", t("discover.mode.hottest")],
                ] as const
              ).map(([v, label]) => (
                <Button
                  key={v}
                  size="sm"
                  variant={
                    (s.discoverDefaultMode ?? "created") === v
                      ? "default"
                      : "outline"
                  }
                  onClick={() =>
                    update({ discoverDefaultMode: v as TrendingMode })
                  }
                >
                  {label}
                </Button>
              ))}
              <div className="mx-2 h-5 w-px bg-border" />
              {(
                [
                  ["daily", t("discover.range.daily")],
                  ["weekly", t("discover.range.weekly")],
                  ["monthly", t("discover.range.monthly")],
                  ["yearly", t("discover.range.yearly")],
                ] as const
              ).map(([v, label]) => (
                <Button
                  key={v}
                  size="sm"
                  variant={
                    (s.discoverDefaultRange ?? "weekly") === v
                      ? "default"
                      : "outline"
                  }
                  onClick={() =>
                    update({ discoverDefaultRange: v as TrendingRange })
                  }
                >
                  {label}
                </Button>
              ))}
              <div className="mx-2 h-5 w-px bg-border" />
              <select
                value={s.discoverDefaultLanguage ?? ""}
                onChange={(e) =>
                  update({ discoverDefaultLanguage: e.target.value })
                }
                className="rounded-md border bg-background px-2 py-1 text-sm"
              >
                <option value="">{t("discover.language.all")}</option>
                {COMMON_LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </Row>
          <Row label={t("settings.discoverSort")}>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    ["auto", t("discover.sort.auto")],
                    [
                      "velocity-since-creation",
                      t("discover.sort.velocity-since-creation"),
                    ],
                    ["recent-growth", t("discover.sort.recent-growth")],
                    ["total-stars", t("discover.sort.total-stars")],
                  ] as const
                ).map(([v, label]) => (
                  <Button
                    key={v}
                    size="sm"
                    variant={
                      (s.discoverDefaultSort ?? "auto") === v
                        ? "default"
                        : "outline"
                    }
                    onClick={() =>
                      update({ discoverDefaultSort: v as TrendingSort })
                    }
                    title={t(`discover.sort.${v}.hint`)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {t("settings.discoverSortHint")}
              </p>
            </div>
          </Row>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-start gap-4">
      <div className="pt-2 text-sm font-medium text-muted-foreground">
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}
