import { Loader2, RefreshCw, Search, Settings2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n";

interface ChannelToolbarProps {
  title: string;
  loading: boolean;
  scanning: boolean;
  query: string;
  stats: {
    total: number;
    active: number;
    pending: number;
    ungrouped: number;
  };
  onScan: () => void;
  onOpenManage: () => void;
  onQueryChange: (value: string) => void;
}

export default function ChannelToolbar({
  title,
  loading,
  scanning,
  query,
  stats,
  onScan,
  onOpenManage,
  onQueryChange,
}: ChannelToolbarProps) {
  const t = useT();
  return (
    <div className="flex flex-col gap-3 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-base font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">
            {t("channels.subtitle")}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <SummaryPill label={t("channels.summary.total")} value={stats.total} />
            <SummaryPill label={t("channels.status.active")} value={stats.active} />
            <SummaryPill label={t("channels.summary.pending")} value={stats.pending} />
            <SummaryPill label={t("channels.summary.ungrouped")} value={stats.ungrouped} />
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onScan}
            disabled={loading || scanning}
            className="gap-1.5"
          >
            {scanning ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {t("channels.scan")}
          </Button>
          <Button size="sm" variant="outline" onClick={onOpenManage} className="gap-1.5">
            <Settings2 className="h-3.5 w-3.5" />
            {t("channels.manage")}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t("channels.search.placeholder")}
            className="pl-8 pr-8"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryPill({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] ring-1 ring-border">
      <span className="font-medium text-foreground">{value}</span>
      <span>{label}</span>
    </span>
  );
}
