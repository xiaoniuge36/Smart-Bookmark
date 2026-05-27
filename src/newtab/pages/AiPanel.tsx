import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { chat } from "@/lib/ai";
import { getBookmarkContextForAi } from "@/lib/aiBookmarkContext";
import type { AiMessage, Settings } from "@/types";
import { cn } from "@/lib/utils";
import { Send, Sparkles, Square, Flame, Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n";
import { fetchTrending, trendingToMarkdown } from "@/lib/github";
import { toast } from "@/components/ui/toast";

const SYSTEM_PROMPT = [
  "You are Smart Bookmark Agent — an AI agent that works on top of the user's local Chrome bookmarks.",
  "Your core capabilities:",
  "- Answer questions grounded in the user's bookmark snapshot (counts, folders, domains, titles).",
  "- Recommend organization schemes (folders, tags, topics) and point out imbalance.",
  "- Flag potential duplicates, stale or suspicious URLs, and suggest cleanup.",
  "- Surface relevant saved links when the user asks about a topic, and propose related sites worth bookmarking.",
  "- Help craft search queries to find things they already saved.",
  "A snapshot of the user's bookmarks (counts, folder breakdown, sample titles + URLs) is appended below under '---'. Prefer grounding your answers in it. If the user asks something unrelated to their bookmarks, answer briefly and steer back to what you can do for their collection.",
  "Style: concise, use bullet points, reply in the user's language (Chinese ↔ English). Never fabricate bookmarks that don't appear in the snapshot.",
].join("\n");

function formatMsgTime(
  at: number | undefined,
  language: Settings["language"],
) {
  if (at == null) return "";
  const locale =
    language === "zh" ? "zh-CN" : language === "en" ? "en-US" : undefined;
  return new Date(at).toLocaleString(locale, {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AiPanel({ settings }: { settings: Settings }) {
  return (
    <div className="h-[calc(100vh-10rem)]">
      <AiChatPanel settings={settings} />
    </div>
  );
}

function AiChatPanel({ settings }: { settings: Settings }) {
  const t = useT();
  const [messages, setMessages] = useState<AiMessage[]>([
    { role: "system", content: SYSTEM_PROMPT },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [injectingTrending, setInjectingTrending] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const injectTrending = async () => {
    setInjectingTrending(true);
    try {
      const data = await fetchTrending({
        range: settings.discoverDefaultRange ?? "weekly",
        mode: settings.discoverDefaultMode ?? "created",
        language: settings.discoverDefaultLanguage || undefined,
        limit: 20,
        token: settings.githubToken || undefined,
      });
      const md = trendingToMarkdown(data, {
        range: settings.discoverDefaultRange ?? "weekly",
        mode: settings.discoverDefaultMode ?? "created",
        language: settings.discoverDefaultLanguage,
      });
      const now = Date.now();
      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: `下面是我从 GitHub 拉到的热门项目，请基于它回答接下来的问题，或给出概览。\n\n${md}`,
          at: now,
        },
      ]);
      toast(t("discover.injectedAi", String(data.length)), "success");
    } catch (err) {
      toast(
        t("discover.error") + ": " + ((err as Error)?.message ?? ""),
        "error",
      );
    } finally {
      setInjectingTrending(false);
    }
  };

  const visible = messages.filter((m) => m.role !== "system");
  const modelLine =
    settings.aiProvider === "none"
      ? t("ai.disabled")
      : `${settings.aiProvider} · ${settings.aiModel}`;

  const send = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text) return;
    if (settings.aiProvider === "none" || !settings.aiApiKey) {
      alert(t("ai.needKey"));
      return;
    }
    const bookmarkCtx = await getBookmarkContextForAi();
    const convo = messages.filter((m) => m.role !== "system");
    const forApi: AiMessage[] = [
      {
        role: "system",
        content: `${SYSTEM_PROMPT}\n\n---\n${bookmarkCtx}`,
      },
      ...convo,
      { role: "user", content: text },
    ];
    const now = Date.now();
    setMessages([
      ...messages,
      { role: "user", content: text, at: now },
      { role: "assistant", content: "", at: now },
    ]);

    setInput("");
    setLoading(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      let acc = "";
      await chat({
        settings,
        messages: forApi,
        signal: ctrl.signal,
        onDelta: (d) => {
          acc += d;
          setMessages((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            copy[copy.length - 1] = {
              role: "assistant",
              content: acc,
              at: last?.at ?? now,
            };
            return copy;
          });
        },
      });
    } catch (err: any) {
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        copy[copy.length - 1] = {
          role: "assistant",
          content: `⚠️ ${err?.message ?? "请求失败"}`,
          at: last?.at,
        };
        return copy;
      });
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const stop = () => abortRef.current?.abort();

  const isAiLive = settings.aiProvider !== "none";

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col">
      <header className="mb-3 flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2.5 font-serif text-[1.1rem] tracking-tight">
          <Sparkles
            className="h-4 w-4"
            style={{ color: "hsl(var(--claude-accent))" }}
            strokeWidth={1.8}
          />
          <span className="font-semibold">{t("ai.title")}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={injectTrending}
            disabled={injectingTrending}
            className="gap-1.5 text-xs"
            title={t("discover.injectAi")}
          >
            {injectingTrending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Flame className="h-3.5 w-3.5 text-rose-500" />
            )}
            {t("discover.injectAi")}
          </Button>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[10.5px]",
            isAiLive
              ? "bg-background/60"
              : "bg-muted/60 text-muted-foreground",
          )}
          style={
            isAiLive
              ? { color: "hsl(var(--claude-ink-muted))" }
              : undefined
          }
          title={isAiLive ? modelLine : t("ai.disabled")}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              isAiLive
                ? "bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.15)]"
                : "bg-muted-foreground/40",
            )}
            aria-hidden
          />
          {modelLine}
        </span>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-3 overflow-hidden">
        <div
          className="scrollbar-thin flex-1 space-y-8 overflow-auto rounded-lg px-6 py-6"
          style={{
            backgroundColor: "hsl(var(--claude-canvas))",
          }}
        >
          {!visible.length && (
            <div className="flex flex-col items-center gap-5 px-4 py-6 text-center">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{
                  backgroundColor: "hsl(var(--claude-accent) / 0.12)",
                  color: "hsl(var(--claude-accent))",
                }}
              >
                <Sparkles className="h-6 w-6" strokeWidth={1.6} />
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="font-serif text-lg font-semibold tracking-tight">
                  {t("ai.emptyHeading")}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "hsl(var(--claude-ink-muted))" }}
                >
                  {t("ai.emptyDesc")}
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 pt-1">
                {[
                  t("ai.suggestOrganize"),
                  t("ai.suggestFindDups"),
                  t("ai.suggestRecommend"),
                  t("ai.suggestSummary"),
                ].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-full border px-3 py-1.5 font-serif text-[12.5px] transition hover:bg-background/70"
                    style={{
                      borderColor: "hsl(var(--claude-rule))",
                      color: "hsl(var(--claude-ink-muted))",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {visible.map((m, i) => {
            const isUser = m.role === "user";
            const rail = isUser
              ? "hsl(var(--primary))"
              : "hsl(var(--claude-accent))";
            return (
              <article
                key={m.at != null ? `${m.at}-${m.role}-${i}` : i}
                className="pl-4"
                style={{
                  borderLeft: `2px solid ${rail}`,
                }}
              >
                <header
                  className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]"
                  style={{ color: "hsl(var(--claude-ink-muted))" }}
                >
                  <span
                    className="font-serif text-[13px] font-semibold tracking-tight text-foreground"
                    style={isUser ? undefined : { color: rail }}
                  >
                    {isUser ? t("ai.userLabel") : t("ai.assistantLabel")}
                  </span>
                  {m.at != null && (
                    <time dateTime={new Date(m.at).toISOString()}>
                      {formatMsgTime(m.at, settings.language)}
                    </time>
                  )}
                  {!isUser && settings.aiProvider !== "none" && (
                    <span className="rounded-md bg-background/60 px-1.5 py-0 font-mono text-[10px]">
                      {modelLine}
                    </span>
                  )}
                </header>
                <div
                  className={cn(
                    "whitespace-pre-wrap text-[14px] leading-[1.7] text-foreground/90",
                  )}
                >
                  {m.content ||
                    (loading && i === visible.length - 1 ? (
                      <span
                        className="italic"
                        style={{ color: "hsl(var(--claude-ink-muted))" }}
                      >
                        …
                      </span>
                    ) : (
                      ""
                    ))}
                </div>
              </article>
            );
          })}
        </div>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("ai.placeholder")}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            disabled={loading}
          />
          {loading ? (
            <Button variant="outline" onClick={stop} className="gap-2">
              <Square className="h-4 w-4" /> {t("cleaner.stop")}
            </Button>
          ) : (
            <Button onClick={() => send()} className="gap-2">
              <Send className="h-4 w-4" /> {t("ai.send")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
