import { useEffect, useState, type ReactNode } from "react";
import { CheckCircle2, Clipboard, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AiChannelGroup, AiChannelPriceTag, AiChannelRecord, AiChannelStatus } from "@/types";
import { CATEGORY_KEY, PRICE_TAG_META, STATUS_META, UNGROUPED_ID, colorOptionDot, formatDateTime } from "./meta";
import { cn, faviconOf, hostnameOf } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { toast } from "@/components/ui/toast";
import SelectMenu, { type SelectMenuOption } from "./SelectMenu";

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
      </div>

      <div className="min-h-0 flex-1 space-y-3.5 overflow-auto p-3.5 scrollbar-thin">
        <Field label={t("channels.detail.link")}>
          <a
            href={record.url}
            target="_blank"
            rel="noreferrer"
            className="break-all text-xs text-primary hover:underline"
          >
            {record.url}
          </a>
        </Field>

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

        <Field label={t("channels.detail.folder")}>
          <span className="text-xs text-muted-foreground">{record.folderPath}</span>
        </Field>
        <Field label={t("channels.detail.sourceFolder")}>
          <span className="text-xs text-muted-foreground">{record.sourceFolderPath}</span>
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
            {(Object.keys(STATUS_META) as AiChannelStatus[]).map((statusKey) => (
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

        <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
          <InfoLine label={t("channels.detail.firstSeen")} value={formatDateTime(record.firstSeenAt)} />
          <InfoLine label={t("channels.detail.lastSeen")} value={formatDateTime(record.lastSeenAt)} />
          <InfoLine
            label={t("channels.detail.lastChecked")}
            value={record.lastCheckedAt ? formatDateTime(record.lastCheckedAt) : t("channels.detail.notChecked")}
          />
          <InfoLine
            label={t("channels.detail.missingSince")}
            value={record.missingSince ? formatDateTime(record.missingSince) : "-"}
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

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 truncate text-xs text-foreground">{value}</div>
    </div>
  );
}
