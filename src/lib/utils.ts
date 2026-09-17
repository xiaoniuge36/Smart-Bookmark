import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { isFirefox } from "@/lib/browser";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function faviconOf(url: string, size = 32): string {
  try {
    new URL(url);
    // Firefox 无 _favicon API：返回空，由 BookmarkIcon 的在线候选回退
    if (isFirefox) return "";
    if (typeof chrome === "undefined" || !chrome.runtime?.getURL) return "";
    return chrome.runtime.getURL(
      `_favicon/?pageUrl=${encodeURIComponent(url)}&size=${size}`,
    );
  } catch {
    return "";
  }
}

export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function formatDate(ts?: number): string {
  if (!ts) return "";
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function debounce<T extends (...args: any[]) => void>(fn: T, delay = 200) {
  let t: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

export function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw);
    u.hash = "";
    const keepQ = new URLSearchParams();
    for (const [k, v] of u.searchParams) {
      if (!/^utm_|^spm$|^fbclid$|^gclid$/i.test(k)) keepQ.set(k, v);
    }
    u.search = keepQ.toString() ? `?${keepQ.toString()}` : "";
    if (u.pathname.endsWith("/") && u.pathname !== "/") {
      u.pathname = u.pathname.replace(/\/+$/, "");
    }
    return u.toString().toLowerCase();
  } catch {
    return raw.toLowerCase();
  }
}
