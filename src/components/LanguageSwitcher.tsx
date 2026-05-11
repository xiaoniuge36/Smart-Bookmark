import { useEffect, useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
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
import { resolveLanguage, useT } from "@/lib/i18n";
import type { Language } from "@/types";

interface LanguageSwitcherProps {
  /** 显示模式：`button` 全尺寸按钮 / `icon` 仅图标圆钮（适合窄场景） */
  variant?: "button" | "icon";
  className?: string;
}

const OPTIONS: Array<{ value: Language; labelKey: string; flag: string }> = [
  { value: "auto", labelKey: "common.languageAuto", flag: "🌐" },
  { value: "zh", labelKey: "common.languageZh", flag: "🇨🇳" },
  { value: "en", labelKey: "common.languageEn", flag: "🇺🇸" },
];

/**
 * 界面语言切换器（与 ThemeSwitcher 同一组件家族）。
 *
 * 之前语言切换只埋在「设置 → 扩展功能 → 语言」里，普通用户
 * 切换需要打开设置页才能找到。本组件作为 header 顶部一级控件，
 * 让中英切换变成一键操作，对应国际化场景的「Auto / 中文 / English」三选一。
 *
 * - `button`：椭圆按钮 [globe icon] [当前语言简写] [▾]
 * - `icon`：圆形图标按钮（侧边栏 / popup 的窄空间场景）
 */
export default function LanguageSwitcher({
  variant = "button",
  className,
}: LanguageSwitcherProps) {
  const t = useT();
  const [lang, setLang] = useState<Language>("auto");

  useEffect(() => {
    getSettings().then((s) => setLang(s.language));
    return onSettingsChange((s) => setLang(s.language));
  }, []);

  const pick = async (next: Language) => {
    await setSettings({ language: next });
    setLang(next);
  };

  // 当前 effective 语言（auto 解析为 zh / en）
  const effective = resolveLanguage(lang);
  const activeShort =
    lang === "auto"
      ? t("common.languageAuto")
      : effective === "zh"
      ? t("common.languageZh")
      : t("common.languageEn");

  const trigger =
    variant === "icon" ? (
      <button
        type="button"
        title={t("common.languagePicker")}
        aria-label={t("common.languagePicker")}
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-full border bg-background/60 text-muted-foreground transition hover:bg-accent hover:text-accent-foreground",
          className,
        )}
      >
        <Globe className="h-3.5 w-3.5" />
      </button>
    ) : (
      <button
        type="button"
        title={t("common.languagePicker")}
        aria-label={t("common.languagePicker")}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-full border bg-background/60 px-3 text-xs text-muted-foreground transition hover:bg-accent hover:text-accent-foreground",
          className,
        )}
      >
        <Globe className="h-3.5 w-3.5" />
        <span className="font-medium">{activeShort}</span>
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[220px]">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Globe className="h-3.5 w-3.5" />
          <span>{t("common.languagePicker")}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {OPTIONS.map((opt) => {
          const isActive = lang === opt.value;
          return (
            <DropdownMenuItem
              key={opt.value}
              onSelect={(e) => {
                e.preventDefault();
                void pick(opt.value);
              }}
              className="items-center gap-2 py-2"
            >
              <span aria-hidden className="text-base leading-none">
                {opt.flag}
              </span>
              <span className="flex-1 text-[13px] font-medium text-foreground">
                {t(opt.labelKey)}
              </span>
              {isActive ? (
                <Check className="h-4 w-4 text-primary" />
              ) : null}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-[11px] leading-snug text-muted-foreground">
          {t("common.languageHint")}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
