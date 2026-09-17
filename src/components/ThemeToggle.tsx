import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { getSettings, onSettingsChange, setSettings } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { Settings } from "@/types";
import { useT } from "@/lib/i18n";

/**
 * 主题模式（亮 / 暗 / 跟随系统）轮换按钮。
 *
 * 与 LanguageSwitcher / ThemeSwitcher 同属 header 顶部一级偏好控件；
 * 支持外层通过 `className` 覆盖默认的独立 pill 样式（rounded-full / border / bg），
 * 以便嵌入到 utility 连体胶囊（segmented group）容器中。
 */
export default function ThemeToggle({
  className,
}: {
  className?: string;
}) {
  const t = useT();
  const [theme, setTheme] = useState<Settings["theme"]>("system");
  useEffect(() => {
    getSettings().then((s) => setTheme(s.theme));
    return onSettingsChange((s) => setTheme(s.theme));
  }, []);

  const cycle = async () => {
    const next: Settings["theme"] =
      theme === "system" ? "light" : theme === "light" ? "dark" : "system";
    await setSettings({ theme: next });
  };

  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
  const label = theme === "light" ? t("theme.modeLight") : theme === "dark" ? t("theme.modeDark") : t("theme.modeSystem");

  return (
    <button
      type="button"
      onClick={cycle}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border bg-background/60 px-3 text-xs text-muted-foreground transition hover:bg-accent",
        className,
      )}
      title={t("theme.toggleTitle", label)}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </button>
  );
}
