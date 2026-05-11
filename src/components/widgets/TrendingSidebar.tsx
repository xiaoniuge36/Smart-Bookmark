import { Flame, Sparkles, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import HideWidgetButton from "@/components/HideWidgetButton";
import TrendingPanel from "@/components/TrendingPanel";
import type { Settings, TrendingMode, TrendingRange } from "@/types";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface Props {
  settings: Settings;
  mode: TrendingMode;
  onModeChange: (m: TrendingMode) => void;
  range: TrendingRange;
  onRangeChange: (r: TrendingRange) => void;
  /** 显示条数，默认 5（sidebar 紧凑场景） */
  limit?: number;
  /** 「查看更多」按钮回调 */
  onOpenDiscover?: () => void;
  /** Hide 按钮回调 */
  onHide?: () => void;
  hideLabel?: string;
  hideTooltip?: string;
}

const RANGE_TABS: TrendingRange[] = ["daily", "weekly", "monthly", "yearly"];

/**
 * 首页右栏紧凑「GitHub 热门」widget：
 * - 固定窄列（外部用 280px 容器），垂直单列 5 条
 * - 头部保留 Mode (创建/最热门) + Range (日/周/月/年) tabs，压缩为极小药丸
 * - 头部右上角「查看更多 →」一键跳发现页
 * - 复用 TrendingPanel 但传 gridClassName="grid-cols-1" 强制单列列表
 */
export default function TrendingSidebar({
  settings,
  mode,
  onModeChange,
  range,
  onRangeChange,
  limit = 5,
  onOpenDiscover,
  onHide,
  hideLabel,
  hideTooltip,
}: Props) {
  const t = useT();

  const handleViewMore = () => {
    if (onOpenDiscover) {
      onOpenDiscover();
      return;
    }
    const p = new URLSearchParams(window.location.hash.slice(1));
    p.set("tab", "discover");
    const s = p.toString();
    window.location.hash = s ? "#" + s : "#";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Card className="group/widget relative flex flex-col rounded-2xl p-3 ring-1 ring-black/[0.02] transition hover:shadow-md dark:ring-white/[0.04]">
      {/* 第一行：图标 + 标题 + Hide */}
      <div className="mb-2 flex items-center gap-2 px-0.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500/20 to-rose-500/20 text-rose-500">
          <Flame className="h-3.5 w-3.5" />
        </div>
        <h2 className="text-sm font-semibold tracking-tight">
          {t("discover.widget.title")}
        </h2>
        <button
          type="button"
          onClick={handleViewMore}
          className="ml-auto rounded-md px-1.5 py-0.5 text-[11px] text-muted-foreground transition hover:bg-accent hover:text-primary"
        >
          {t("discover.widget.viewAll")} →
        </button>
        {onHide && (
          <HideWidgetButton
            variant="inline"
            onHide={onHide}
            label={hideLabel ?? t("home.hideWidget")}
            tooltip={hideTooltip}
          />
        )}
      </div>

      {/* 第二行：Mode + Range tabs（极紧凑） */}
      <div className="mb-2.5 flex flex-wrap items-center gap-1 px-0.5">
        <div
          className="inline-flex items-center gap-0.5 rounded-md border bg-card/80 p-0.5 text-[10.5px]"
          role="tablist"
          aria-label="Mode"
        >
          {(["created", "hottest"] as TrendingMode[]).map((m) => {
            const Icon = m === "created" ? Sparkles : TrendingUp;
            return (
              <Tooltip key={m} content={t(`discover.mode.${m}.hint`)}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => onModeChange(m)}
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-medium transition",
                    mode === m
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <Icon className="h-2.5 w-2.5" />
                  {t(`discover.mode.${m}`)}
                </button>
              </Tooltip>
            );
          })}
        </div>
        <div
          className="inline-flex items-center gap-0.5 rounded-md border bg-card/80 p-0.5 text-[10.5px]"
          role="tablist"
          aria-label={t("discover.widget.title")}
        >
          {RANGE_TABS.map((r) => (
            <button
              key={r}
              type="button"
              role="tab"
              aria-selected={range === r}
              onClick={() => onRangeChange(r)}
              className={cn(
                "rounded px-1.5 py-0.5 font-medium transition",
                range === r
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {t(`discover.range.${r}`)}
            </button>
          ))}
        </div>
      </div>

      {/* 列表本体：单列、紧凑 */}
      <TrendingPanel
        settings={settings}
        limit={limit}
        compact
        hideControls
        gridClassName="grid-cols-1"
        range={range}
        onRangeChange={onRangeChange}
        mode={mode}
        onModeChange={onModeChange}
      />
    </Card>
  );
}
