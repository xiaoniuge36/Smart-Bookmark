import {
  Bookmark,
  Wand2,
  PanelRight,
  Sparkles,
  Columns,
  HardDriveDownload,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { openSidebar } from "@/lib/browser";

export default function Popup() {
  const t = useT();
  const openNewtab = (hash = "") =>
    chrome.tabs.create({ url: chrome.runtime.getURL("newtab.html" + hash) });

  const openSidePanel = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.windowId) {
      await openSidebar(tab.windowId);
      window.close();
    }
  };

  const Item = ({
    icon,
    label,
    onClick,
    color,
  }: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    color: string;
  }) => (
    <button
      onClick={onClick}
      className="group flex items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-accent"
    >
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-sm`}
      >
        {icon}
      </div>
      <span className="text-sm">{label}</span>
    </button>
  );

  return (
    <div className="w-[280px] bg-background p-3 text-foreground">
      <div className="mb-3 flex items-center gap-2 px-1 text-sm font-semibold">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white">
          <Bookmark className="h-3.5 w-3.5" />
        </div>
        {t("app.title")}
      </div>
      <div className="space-y-0.5">
        <Item
          icon={<Bookmark className="h-4 w-4" />}
          color="from-indigo-500 to-sky-500"
          label={t("popup.dashboard")}
          onClick={() => openNewtab()}
        />
        <Item
          icon={<Wand2 className="h-4 w-4" />}
          color="from-emerald-500 to-teal-500"
          label={t("popup.cleaner")}
          onClick={() => openNewtab("#tab=cleaner")}
        />
        <Item
          icon={<Columns className="h-4 w-4" />}
          color="from-fuchsia-500 to-rose-500"
          label={t("popup.compare")}
          onClick={() => openNewtab("#tab=compare")}
        />
        <Item
          icon={<Sparkles className="h-4 w-4" />}
          color="from-amber-500 to-orange-500"
          label={t("popup.ai")}
          onClick={() => openNewtab("#tab=ai")}
        />
        <Item
          icon={<HardDriveDownload className="h-4 w-4" />}
          color="from-slate-500 to-slate-700"
          label={t("popup.backup")}
          onClick={() => openNewtab("#tab=backup")}
        />
        <Item
          icon={<PanelRight className="h-4 w-4" />}
          color="from-blue-500 to-indigo-500"
          label={t("popup.sidepanel")}
          onClick={openSidePanel}
        />
      </div>
      <div className="mt-3 rounded-md bg-muted px-3 py-2 text-[11px] text-muted-foreground">
        {t("popup.shortcut")}
      </div>
    </div>
  );
}
