import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { getSettings, setSettings } from "@/lib/storage";
import type { AccentPreset, Settings } from "@/types";
import { useT } from "@/lib/i18n";
import { testAi } from "@/lib/ai";
import { BUILTIN_ENGINES, faviconFor } from "@/lib/engines";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

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
