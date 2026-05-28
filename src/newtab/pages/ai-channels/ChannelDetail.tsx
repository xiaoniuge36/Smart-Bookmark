import { useEffect, useState, type ReactNode } from "react";
import { CheckCircle2, Clipboard, ExternalLink, Folder, FolderSymlink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AiChannelGroup, AiChannelPriceTag, AiChannelRecord } from "@/types";
import { CATEGORY_KEY, PRICE_TAG_META, STATUS_META, UNGROUPED_ID, colorOptionDot, formatDateTime } from "./meta";
import { cn, faviconOf, hostnameOf } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { toast } from "@/components/ui/toast";
import SelectMenu, { type SelectMenuOption } from "./SelectMenu";
import { AI_CHANNEL_STATUS_ORDER } from "@/lib/aiChannelStatus";

interface ChannelDetailProps {
  record?: AiChannelRecord;
  groups: AiChannelGroup[];
  onPatch: (id: string, patch: Partial<AiChannelRecord>) => void;
}

export default function ChannelDetail({
  record,
  groups,
  onPatch,
}: ChannelDetailProps) {
  const t = useT();
  const [note, setNote] = useState(record?.note ?? "");

  useEffect(() => {
    setNote(record?.note ?? "");
  }, [record?.bookmarkId, record?.note]);

  const groupOptions: SelectMenuOption[] = [
    { value: UNGROUPED_ID, label: t("channels.group.ungrouped"), dotClassName: "bg-slate-400" },
    ...groups.map((group) => ({
      value: group.id,
      label: group.name,
      ...colorOptionDot(group.color),
    })),
  ];

  if (!record) {
    return (
      <Card className="flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground">
        {t("channels.detail.empty")}
      </Card>
    );
  }

  const status = STATUS_META[record.status];
  const priceTagMeta = PRICE_TAG_META[record.priceTag ?? "none"];
  const StatusIcon = status.Icon;

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden border-border/80 bg-card/90 shadow-sm">
      <div className="border-b bg-muted/15 p-3.5">
        <div className="flex items-start gap-3">
          <img
            src={faviconOf(record.url)}
            alt=""
            className="mt-1 h-8 w-8 rounded-lg"
            onError={(e) => (e.currentTarget.style.visibility = "hidden")}
          />
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 font-semibold leading-snug">
              {record.title}
            </h3>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {hostnameOf(record.url)}
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium ring-1 ring-border">
            {t(CATEGORY_KEY[record.category])}
          </span>
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1", status.className)}>
            <StatusIcon className="h-3 w-3" />
            {t(status.labelKey)}
          </span>
          {(record.priceTag ?? "none") !== "none" && (
            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ring-1", priceTagMeta.className)}>
              {t(priceTagMeta.labelKey)}
            </span>
          )}
          {!record.present && (
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground ring-1 ring-border">
              {t("channels.detail.removedSource")}
            </span>
          )}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-0.5">
          <div className="flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground" title={`${t("channels.detail.folder")}: ${record.folderPath}`}>
            <Folder className="h-3 w-3 shrink-0" />
            <span className="truncate">{record.folderPath}</span>
          </div>
          <div className="flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground" title={`${t("channels.detail.sourceFolder")}: ${record.sourceFolderPath}`}>
            <FolderSymlink className="h-3 w-3 shrink-0" />
            <span className="truncate">{record.sourceFolderPath}</span>
          </div>
        </div>
        <a
          href={record.url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 block truncate text-[11px] text-primary hover:underline"
          title={record.url}
        >
          {record.url}
        </a>
      </div>

      <div className="min-h-0 flex-1 space-y-3.5 overflow-auto p-3.5 scrollbar-thin">
        <Field label={t("channels.detail.group")}>
          <SelectMenu
            value={record.groupId ?? UNGROUPED_ID}
            options={groupOptions}
            placeholder={t("channels.detail.selectGroup")}
            className="w-full"
            align="start"
            onChange={(value) =>
              onPatch(record.bookmarkId, {
                groupId: value === UNGROUPED_ID ? undefined : value,
              })
            }
          />
        </Field>

        <Field label={t("channels.detail.secondaryGroups")}>
          <p className="mb-1.5 text-[10px] text-muted-foreground">{t("channels.detail.secondaryGroupsHint")}</p>
          {(record.secondaryGroupIds ?? []).length > 0 && (
            <div className="mb-1.5 flex flex-wrap gap-1">
              {(record.secondaryGroupIds ?? []).map((sid) => {
                const group = groups.find((g) => g.id === sid);
                if (!group) return null;
                return (
                  <span
                    key={sid}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium ring-1 ring-border"
                  >
                    {group.name}
                    <button
                      type="button"
                      className="ml-0.5 rounded-full p-0.5 hover:bg-destructive/15 hover:text-destructive"
                      onClick={() => {
                        const next = (record.secondaryGroupIds ?? []).filter((id) => id !== sid);
                        onPatch(record.bookmarkId, { secondaryGroupIds: next.length ? next : undefined });
                      }}
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
          <SelectMenu
            value=""
            options={groupOptions.filter(
              (opt) =>
                opt.value !== UNGROUPED_ID &&
                opt.value !== record.groupId &&
                !(record.secondaryGroupIds ?? []).includes(opt.value),
            )}
            placeholder={t("channels.detail.addSecondaryGroup")}
            className="w-full"
            align="start"
            onChange={(value) => {
              if (!value) return;
              const next = [...(record.secondaryGroupIds ?? []), value];
              onPatch(record.bookmarkId, { secondaryGroupIds: next });
            }}
          />
        </Field>

        <Field label={t("channels.detail.note")}>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => onPatch(record.bookmarkId, { note: note.trim() })}
            placeholder={t("channels.detail.notePlaceholder")}
            className="min-h-[72px] w-full resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
          />
        </Field>

        <Field label={t("channels.detail.priceTag")}>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(PRICE_TAG_META) as AiChannelPriceTag[]).map((key) => (
              <Button
                key={key}
                size="sm"
                variant={(record.priceTag ?? "none") === key ? "default" : "outline"}
                className={cn((record.priceTag ?? "none") === key && key !== "none" ? PRICE_TAG_META[key].className : "")}
                onClick={() => onPatch(record.bookmarkId, { priceTag: key })}
              >
                {t(PRICE_TAG_META[key].labelKey)}
              </Button>
            ))}
          </div>
        </Field>

        <Field label={t("channels.detail.status")}>
          <div className="flex flex-wrap gap-1.5">
            {AI_CHANNEL_STATUS_ORDER.map((statusKey) => (
              <Button
                key={statusKey}
                size="sm"
                variant={record.status === statusKey ? "default" : "outline"}
                onClick={() =>
                  onPatch(record.bookmarkId, {
                    status: statusKey,
                    lastCheckedAt: Date.now(),
                  })
                }
              >
                {t(STATUS_META[statusKey].labelKey)}
              </Button>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <InfoLine label={t("channels.detail.firstSeen")} value={formatDateTime(record.firstSeenAt)} accent="emerald" />
          <InfoLine label={t("channels.detail.lastSeen")} value={formatDateTime(record.lastSeenAt)} accent="sky" />
          <InfoLine
            label={t("channels.detail.lastChecked")}
            value={record.lastCheckedAt ? formatDateTime(record.lastCheckedAt) : t("channels.detail.notChecked")}
            accent="primary"
          />
          <InfoLine
            label={t("channels.detail.missingSince")}
            value={record.missingSince ? formatDateTime(record.missingSince) : "-"}
            accent="rose"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 border-t bg-background/90 p-2.5">
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => window.open(record.url, "_blank")}>
          <ExternalLink className="h-3.5 w-3.5" />
          {t("channels.detail.open")}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={async () => {
            await navigator.clipboard.writeText(record.url);
            toast(t("channels.detail.linkCopied"), "success");
          }}
        >
          <Clipboard className="h-3.5 w-3.5" />
          {t("channels.detail.copy")}
        </Button>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() =>
            onPatch(record.bookmarkId, { lastCheckedAt: Date.now() })
          }
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          {t("channels.detail.markChecked")}
        </Button>
      </div>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

const ACCENT_CLASSES: Record<string, { label: string; bar: string }> = {
  emerald: { label: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500" },
  sky:     { label: "text-sky-600 dark:text-sky-400",         bar: "bg-sky-500" },
  primary: { label: "text-primary",                          bar: "bg-primary" },
  rose:    { label: "text-rose-500 dark:text-rose-400",       bar: "bg-rose-500" },
};

function InfoLine({ label, value, accent = "primary" }: { label: string; value: string; accent?: string }) {
  const a = ACCENT_CLASSES[accent] ?? ACCENT_CLASSES.primary;
  return (
    <div className="relative overflow-hidden rounded-lg border bg-muted/20 px-2.5 py-2">
      <span className={cn("absolute inset-y-1.5 left-0 w-[3px] rounded-r-full", a.bar)} />
      <div className={cn("pl-1.5 text-[10px] font-medium tracking-wide", a.label)}>
        {label}
      </div>
      <div className="mt-0.5 truncate pl-1.5 text-xs font-semibold tabular-nums text-foreground">{value}</div>
    </div>
  );
}
