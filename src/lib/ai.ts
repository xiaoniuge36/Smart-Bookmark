import type { AiMessage, Settings } from "@/types";
import { t as tr } from "@/lib/i18n";

function toApiMessages(messages: AiMessage[]) {
  return messages.map((m) => ({ role: m.role, content: m.content }));
}

export interface ChatOptions {
  settings: Settings;
  messages: AiMessage[];
  signal?: AbortSignal;
  onDelta?: (delta: string) => void;
}

export async function chat({ settings, messages, signal, onDelta }: ChatOptions): Promise<string> {
  if (settings.aiProvider === "openai") return chatOpenAI({ settings, messages, signal, onDelta });
  if (settings.aiProvider === "anthropic") return chatAnthropic({ settings, messages, signal, onDelta });
  throw new Error(tr("ai.err.notEnabled"));
}

async function chatOpenAI({ settings, messages, signal, onDelta }: ChatOptions): Promise<string> {
  if (!settings.aiApiKey) throw new Error(tr("ai.err.missingOpenAiKey"));
  const base = (settings.aiBaseUrl || "https://api.openai.com/v1").replace(
    /\/+$/,
    "",
  );
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.aiApiKey}`,
    },
    body: JSON.stringify({
      model: settings.aiModel || "gpt-4o-mini",
      messages: toApiMessages(messages),
      stream: true,
    }),
  });
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenAI ${res.status}: ${text.slice(0, 200)}`);
  }
  return await readSse(res.body, (evt) => {
    try {
      const j = JSON.parse(evt);
      const delta = j.choices?.[0]?.delta?.content ?? "";
      if (delta) onDelta?.(delta);
      return delta;
    } catch {
      return "";
    }
  });
}

async function chatAnthropic({ settings, messages, signal, onDelta }: ChatOptions): Promise<string> {
  if (!settings.aiApiKey) throw new Error(tr("ai.err.missingAnthropicKey"));
  const sys = messages.find((m) => m.role === "system")?.content ?? "";
  const rest = messages.filter((m) => m.role !== "system");
  const base = (settings.aiBaseUrl || "https://api.anthropic.com").replace(
    /\/+$/,
    "",
  );
  const res = await fetch(`${base}/v1/messages`, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": settings.aiApiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: settings.aiModel || "claude-3-5-sonnet-latest",
      max_tokens: 1024,
      system: sys || undefined,
      messages: toApiMessages(rest),
      stream: true,
    }),
  });
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(`Anthropic ${res.status}: ${text.slice(0, 200)}`);
  }
  return await readSse(res.body, (evt) => {
    try {
      const j = JSON.parse(evt);
      if (j.type === "content_block_delta") {
        const delta = j.delta?.text ?? "";
        if (delta) onDelta?.(delta);
        return delta;
      }
    } catch {}
    return "";
  });
}

export async function testAi(settings: Settings): Promise<{
  ok: boolean;
  latencyMs: number;
  message: string;
}> {
  const start = performance.now();
  try {
    if (settings.aiProvider === "openai") {
      if (!settings.aiApiKey) throw new Error(tr("ai.err.missingKey"));
      const base = (settings.aiBaseUrl || "https://api.openai.com/v1").replace(
        /\/+$/,
        "",
      );
      const res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${settings.aiApiKey}`,
        },
        body: JSON.stringify({
          model: settings.aiModel || "gpt-4o-mini",
          max_tokens: 8,
          messages: [
            { role: "user", content: "ping" },
          ],
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${text.slice(0, 160)}`);
      }
      const raw = await res.text();
      const j = parseOpenAiJsonBody(raw) as {
        choices?: Array<{
          message?: { content?: string };
          text?: string;
        }>;
      };
      const ms = Math.round(performance.now() - start);
      const txt =
        j.choices?.[0]?.message?.content ??
        j.choices?.[0]?.text ??
        tr("ai.emptyResponse");
      return { ok: true, latencyMs: ms, message: String(txt).slice(0, 80) };
    }
    if (settings.aiProvider === "anthropic") {
      if (!settings.aiApiKey) throw new Error(tr("ai.err.missingKey"));
      const base = (settings.aiBaseUrl || "https://api.anthropic.com").replace(
        /\/+$/,
        "",
      );
      const res = await fetch(`${base}/v1/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": settings.aiApiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: settings.aiModel || "claude-3-5-sonnet-latest",
          max_tokens: 8,
          messages: [{ role: "user", content: "ping" }],
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${text.slice(0, 160)}`);
      }
      const raw = await res.text();
      const j = parseOpenAiJsonBody(raw) as {
        content?: Array<{ text?: string }>;
      };
      const ms = Math.round(performance.now() - start);
      const txt = j.content?.[0]?.text ?? tr("ai.emptyResponse");
      return { ok: true, latencyMs: ms, message: String(txt).slice(0, 80) };
    }
    throw new Error(tr("ai.err.selectProvider"));
  } catch (err: any) {
    const ms = Math.round(performance.now() - start);
    return {
      ok: false,
      latencyMs: ms,
      message: err?.message ?? String(err),
    };
  }
}

/** 测试连接/解析响应：避免把站点首页的 HTML 误当 JSON。 */
function parseOpenAiJsonBody(raw: string): unknown {
  const t = raw.trim();
  if (!t) throw new Error(tr("ai.err.emptyBody"));
  if (t.startsWith("<") || t.toLowerCase().startsWith("<!doctype")) {
    throw new Error(tr("ai.err.htmlNotJson"));
  }
  try {
    return JSON.parse(t) as unknown;
  } catch {
    throw new Error(
      tr("ai.err.invalidJson", `${t.slice(0, 100)}${t.length > 100 ? "…" : ""}`),
    );
  }
}

async function readSse(
  body: ReadableStream<Uint8Array>,
  onEvent: (data: string) => string,
): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let full = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const parts = buf.split("\n\n");
    buf = parts.pop() ?? "";
    for (const part of parts) {
      for (const line of part.split("\n")) {
        const m = line.match(/^data:\s*(.*)$/);
        if (!m) continue;
        const data = m[1];
        if (data === "[DONE]") return full;
        full += onEvent(data);
      }
    }
  }
  return full;
}
