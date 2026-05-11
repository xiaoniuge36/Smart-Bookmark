import { Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import HideWidgetButton from "@/components/HideWidgetButton";
import { faviconOf, hostnameOf } from "@/lib/utils";

export interface TopSitesItem {
  url: string;
  title: string;
}

interface Props {
  items: TopSitesItem[];
  /** 显示条数上限，默认 6（sidebar 紧凑场景） */
  limit?: number;
  /** Hide 按钮回调（不传则不渲染 Hide 按钮） */
  onHide?: () => void;
  /** Hide 按钮 label / tooltip 文案 */
  hideLabel?: string;
  hideTooltip?: string;
  /** 「自动更新」副标题文案，可 i18n */
  autoLabel?: string;
  /** TOP 徽章 hover 文案 */
  badgeTooltip?: string;
  /** 标题文案，默认「常去」 */
  title?: string;
}

/**
 * 首页右栏紧凑「常去」widget：
 * - 固定窄列（外部用 280px 容器），TOP 6 紧凑列表
 * - 每项 icon + 标题 + 域名，与原 Card 内列表风格一致
 * - 头部保留「自动」标记 + Hide 按钮 + TOP n 徽章
 * - 不再依赖 GitHub 热门高度（独立 Card，自己 fit-content）
 */
export default function TopSitesSidebar({
  items,
  limit = 6,
  onHide,
  hideLabel,
  hideTooltip,
  autoLabel = "浏览器按访问频率自动更新",
  badgeTooltip = "由 Chrome 浏览器自动统计的常访问站点",
  title = "常去",
}: Props) {
  const list = items.slice(0, limit);
  if (list.length === 0) return null;

  return (
    <Card className="group/widget relative flex flex-col rounded-2xl p-3 ring-1 ring-black/[0.02] transition hover:shadow-md dark:ring-white/[0.04]">
      <div className="mb-1 flex shrink-0 items-center gap-2 px-1">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500/20 to-indigo-500/20 text-sky-600 dark:text-sky-400">
          <Clock className="h-3.5 w-3.5" />
        </div>
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        <Tooltip content={badgeTooltip}>
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            TOP {list.length}
          </span>
        </Tooltip>
        <span className="ml-auto text-[10px] text-muted-foreground/70 transition group-hover/widget:opacity-0">
          自动
        </span>
      </div>
      {onHide && (
        <HideWidgetButton
          onHide={onHide}
          label={hideLabel ?? "隐藏"}
          tooltip={hideTooltip}
        />
      )}
      <p className="mb-2 shrink-0 px-1 text-[10.5px] leading-relaxed text-muted-foreground/70">
        {autoLabel}
      </p>
      <div className="divide-y divide-border/60">
        {list.map((s) => (
          <a
            key={s.url}
            href={s.url}
            target="_blank"
            rel="noreferrer"
            title={s.url}
            className="group flex items-center gap-2.5 rounded-md px-2 py-2 transition hover:bg-accent/70"
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-background shadow-[0_1px_0_rgba(15,23,42,0.03)] ring-1 ring-border/80">
              <img
                src={faviconOf(s.url, 32)}
                alt=""
                className="h-4 w-4 rounded"
                onError={(e) =>
                  (e.currentTarget.style.visibility = "hidden")
                }
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-foreground">
                {s.title || hostnameOf(s.url)}
              </div>
              <div className="truncate text-[11px] text-muted-foreground">
                {hostnameOf(s.url)}
              </div>
            </div>
          </a>
        ))}
      </div>
    </Card>
  );
}
