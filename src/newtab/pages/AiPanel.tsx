import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { chat } from "@/lib/ai";
import { getBookmarkContextForAi } from "@/lib/aiBookmarkContext";
import type { AiMessage, Settings } from "@/types";
import { cn } from "@/lib/utils";
import { Bot, Send, Sparkles, Square, User } from "lucide-react";
import { useT } from "@/lib/i18n";

const SYSTEM_PROMPT =
  "You are the Smart Bookmark assistant. A snapshot of the user's local Chrome bookmarks (counts, folder breakdown, sample links) is appended below under --- when available. Use it to answer how many bookmarks they have, what domains appear, and similar. Keep answers concise, use bullet points, match the user's language.";

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
  const t = useT();
  const [messages, setMessages] = useState<AiMessage[]>([
    { role: "system", content: SYSTEM_PROMPT },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const visible = messages.filter((m) => m.role !== "system");
  const modelLine =
    settings.aiProvider === "none"
      ? t("ai.disabled")
      : `${settings.aiProvider} · ${settings.aiModel}`;

  const send = async () => {
    const text = input.trim();
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

  return (
    <Card className="flex h-[72vh] flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> {t("ai.title")}
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {modelLine}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 overflow-hidden">
        <div className="flex-1 space-y-6 overflow-auto rounded-lg border bg-muted/30 p-4 scrollbar-thin">
          {!visible.length && (
            <div className="text-center text-sm text-muted-foreground">
              {t("ai.empty")}
            </div>
          )}
          {visible.map((m, i) => (
            <div
              key={m.at != null ? `${m.at}-${m.role}-${i}` : i}
              className={cn(
                "flex gap-3",
                m.role === "user" ? "flex-row-reverse" : "flex-row",
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-sm",
                  m.role === "user"
                    ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                    : "bg-gradient-to-br from-violet-500 to-fuchsia-600",
                )}
                aria-hidden
              >
                {m.role === "user" ? (
                  <User className="h-4 w-4" strokeWidth={2.2} />
                ) : (
                  <Bot className="h-4 w-4" strokeWidth={2.2} />
                )}
              </div>
              <div
                className={cn(
                  "min-w-0 max-w-[min(100%,28rem)] flex-1",
                  m.role === "user" && "flex flex-col items-end",
                )}
              >
                <div
                  className={cn(
                    "mb-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground",
                    m.role === "user" && "justify-end",
                  )}
                >
                  <span className="font-medium text-foreground/80">
                    {m.role === "user"
                      ? t("ai.userLabel")
                      : t("ai.assistantLabel")}
                  </span>
                  {m.at != null && (
                    <time dateTime={new Date(m.at).toISOString()}>
                      {formatMsgTime(m.at, settings.language)}
                    </time>
                  )}
                  {m.role === "assistant" && settings.aiProvider !== "none" && (
                    <span className="rounded-md bg-background/80 px-1.5 py-0 font-mono text-[10px] text-muted-foreground">
                      {modelLine}
                    </span>
                  )}
                </div>
                <div
                  className={cn(
                    "whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "border bg-background text-foreground",
                  )}
                >
                  {m.content ||
                    (loading && i === visible.length - 1 ? "…" : "")}
                </div>
              </div>
            </div>
          ))}
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
            <Button onClick={send} className="gap-2">
              <Send className="h-4 w-4" /> {t("ai.send")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
