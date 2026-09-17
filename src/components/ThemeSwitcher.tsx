import { useEffect, useState } from "react";
import { Check, ChevronDown, Palette } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getSettings, onSettingsChange, setSettings } from "@/lib/storage";
import {
  DEFAULT_THEME_PRESET,
  findThemePreset,
  THEME_PRESETS,
} from "@/lib/themePresets";
import type { ThemePreset } from "@/types";
import { useT } from "@/lib/i18n";

interface ThemeSwitcherProps {
  /** 显示模式：`button` 全尺寸按钮 / `icon` 仅图标圆钮 */
  variant?: "button" | "icon";
  className?: string;
}

/**
 * 设计主题（theme preset）切换器。
 *
 * 参考 code-create（getdesign.md）的下拉切换 UX：
 * 按钮展示当前主题的色板 + 名称 + 箭头；打开后以分组
 * 列表显示全部主题，带描述和当前项选中态。
 */
export default function ThemeSwitcher({
  variant = "button",
  className,
}: ThemeSwitcherProps) {
  const t = useT();
  const [activeKey, setActiveKey] =
    useState<ThemePreset>(DEFAULT_THEME_PRESET);
  const [isDark, setIsDark] = useState<boolean>(() =>
    typeof document !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : false,
  );

  useEffect(() => {
    getSettings().then((s) => setActiveKey(s.themePreset ?? DEFAULT_THEME_PRESET));
    const off = onSettingsChange((s) =>
      setActiveKey(s.themePreset ?? DEFAULT_THEME_PRESET),
    );
    // 监听 <html> 上 class=dark 的变化，更新色板显示的色号。
    const mo = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => {
      off();
      mo.disconnect();
    };
  }, []);

  const active = findThemePreset(activeKey);

  const pickTheme = async (key: ThemePreset) => {
    await setSettings({ themePreset: key });
    setActiveKey(key);
  };

  const grouped = groupByFamily(THEME_PRESETS);

  const trigger =
    variant === "icon" ? (
      <button
        type="button"
        title={t("theme.designThemeTitle", active.shortLabel)}
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-full border bg-background/60 text-muted-foreground transition hover:bg-accent hover:text-accent-foreground",
          className,
        )}
      >
        <Palette className="h-3.5 w-3.5" />
      </button>
    ) : (
      <button
        type="button"
        className={cn(
          "inline-flex h-8 items-center gap-2 rounded-full border bg-background/60 px-3 text-xs text-muted-foreground transition hover:bg-accent hover:text-accent-foreground",
          className,
        )}
        title={t("theme.designThemeTitle", active.shortLabel)}
      >
        <Swatch color={isDark ? active.swatchDark : active.swatchLight} />
        <span className="max-w-[64px] truncate font-medium">
          {active.shortLabel}
        </span>
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[280px] max-h-[68vh] overflow-y-auto">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Palette className="h-3.5 w-3.5" />
          <span>{t("theme.designTheme")}</span>
        </DropdownMenuLabel>
        {grouped.map((group, idx) => (
          <div key={group.family}>
            {idx > 0 && <DropdownMenuSeparator />}
            {group.items.map((p) => {
              const isActive = p.key === activeKey;
              return (
                <DropdownMenuItem
                  key={p.key}
                  onSelect={(e) => {
                    e.preventDefault();
                    void pickTheme(p.key);
                  }}
                  className="items-start py-2"
                >
                  <Swatch
                    color={isDark ? p.swatchDark : p.swatchLight}
                    size="md"
                    className="mt-0.5 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-foreground">
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
                  {isActive ? (
                    <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />
                  ) : null}
                </DropdownMenuItem>
              );
            })}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Swatch({
  color,
  size = "sm",
  className,
}: {
  color: string;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block rounded-full ring-1 ring-black/10 dark:ring-white/10",
        size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5",
        className,
      )}
      style={{ backgroundColor: color }}
    />
  );
}

function groupByFamily(list: typeof THEME_PRESETS) {
  const order: Array<(typeof THEME_PRESETS)[number]["family"]> = [
    "brand",
    "cool",
    "warm",
    "neutral",
  ];
  const buckets = new Map<
    (typeof THEME_PRESETS)[number]["family"],
    typeof THEME_PRESETS
  >();
  for (const p of list) {
    const arr = buckets.get(p.family) ?? [];
    arr.push(p);
    buckets.set(p.family, arr);
  }
  return order
    .filter((f) => buckets.has(f))
    .map((family) => ({ family, items: buckets.get(family)! }));
}
