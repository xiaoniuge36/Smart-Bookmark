import { useId, useMemo, useState } from "react";
import type { BookmarkNode } from "@/types";
import { cn } from "@/lib/utils";
import { ChevronRight, GripVertical, Pin, PinOff } from "lucide-react";
import { useT, t } from "@/lib/i18n";
import ContextMenu from "@/components/ContextMenu";
import PromptDialog from "@/components/PromptDialog";
import ConfirmDialog from "@/components/ConfirmDialog";

/**
 * 扁平 3D 风格的彩色文件夹图标。统一品牌色（indigo/violet），与整体设计系统一致。
 * - open=false: 闭合，有背板 tab 与前片高光
 * - open=true:  打开，露出一张纸，前片向前倾
 * - variant="all": 用品牌主色（更深的 fuchsia/indigo 混色）表示「全部书签」
 */
function FolderIcon({
  open,
  variant = "default",
  className,
}: {
  open?: boolean;
  variant?: "default" | "all";
  className?: string;
}) {
  const uid = useId().replace(/[:]/g, "");
  const backTop = variant === "all" ? "#a78bfa" : "#818cf8";
  const backBot = variant === "all" ? "#7c3aed" : "#6366f1";
  const frontTop = variant === "all" ? "#ddd6fe" : "#c7d2fe";
  const frontBot = variant === "all" ? "#a78bfa" : "#a5b4fc";

  if (open) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`fb-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={backTop} />
            <stop offset="1" stopColor={backBot} />
          </linearGradient>
          <linearGradient id={`ff-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={frontTop} />
            <stop offset="1" stopColor={frontBot} />
          </linearGradient>
        </defs>
        <path
          d="M3 6.5A2 2 0 0 1 5 4.5h3.6a2 2 0 0 1 1.4.6l1.4 1.4H19a2 2 0 0 1 2 2V11H3V6.5Z"
          fill={`url(#fb-${uid})`}
        />
        <rect
          x="5.5"
          y="9"
          width="14"
          height="1.6"
          rx="0.6"
          fill="#ffffff"
          fillOpacity="0.75"
        />
        <path
          d="M2.6 11h18.8l-1.35 7.3A2.2 2.2 0 0 1 17.89 20H6.11a2.2 2.2 0 0 1-2.16-1.7L2.6 11Z"
          fill={`url(#ff-${uid})`}
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`fb-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={backTop} />
          <stop offset="1" stopColor={backBot} />
        </linearGradient>
        <linearGradient id={`ff-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={frontTop} />
          <stop offset="1" stopColor={frontBot} />
        </linearGradient>
      </defs>
      <path
        d="M3 6.5A2 2 0 0 1 5 4.5h3.6a2 2 0 0 1 1.4.6l1.4 1.4H19a2 2 0 0 1 2 2V10H3V6.5Z"
        fill={`url(#fb-${uid})`}
      />
      <path
        d="M3 8.5h18V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8.5Z"
        fill={`url(#ff-${uid})`}
      />
      <path
        d="M3 8.5h18"
        stroke="#ffffff"
        strokeOpacity="0.45"
        strokeWidth="0.6"
      />
    </svg>
  );
}

export interface FolderTreeProps {
  tree: BookmarkNode[];
  selectedId?: string;
  expanded: Set<string>;
  pinnedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (id: string | "") => void;
  onTogglePin: (id: string) => void;
  onMove?: (id: string, targetId: string) => Promise<void> | void;
  onRename?: (id: string, title: string) => Promise<void> | void;
  onDelete?: (id: string) => Promise<void> | void;
}

interface FolderItem {
  id: string;
  title: string;
  rawTitle: string;
  depth: number;
  count: number;
  hasChildren: boolean;
  parentChain: string[];
}

export default function FolderTree(props: FolderTreeProps) {
  const {
    tree,
    selectedId,
    expanded,
    pinnedIds,
    onToggle,
    onSelect,
    onTogglePin,
    onMove,
    onRename,
    onDelete,
  } = props;
  const t = useT();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [menu, setMenu] = useState<{
    id: string;
    title: string;
    rawTitle: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);
  const [renameTarget, setRenameTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
    count: number;
  } | null>(null);

  const items = useMemo(() => flattenForTree(tree, expanded), [tree, expanded]);

  return (
    <div className="space-y-0.5 text-sm">
      <button
        onClick={() => onSelect("")}
        className={cn(
          "relative flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted/60",
          !selectedId
            ? "bg-primary/10 font-medium text-primary before:absolute before:inset-y-1 before:left-0 before:w-[2px] before:rounded-full before:bg-primary"
            : "text-foreground/85",
        )}
      >
        <FolderIcon
          variant="all"
          className={cn(
            "h-[18px] w-[18px] shrink-0 drop-shadow-sm transition-transform",
            !selectedId ? "scale-105" : "opacity-90",
          )}
        />
        <span className="flex-1 truncate">{t("dash.allBookmarks")}</span>
      </button>

      {items.map((f) => {
        const isExpanded = expanded.has(f.id);
        const isSelected = selectedId === f.id;
        const isPinned = pinnedIds.has(f.id);
        return (
          <div
            key={f.id}
            draggable={!!onMove && f.depth > 1}
            onContextMenu={(e) => {
              e.preventDefault();
              setMenu({
                id: f.id,
                title: f.title,
                rawTitle: f.rawTitle,
                count: f.count,
                x: e.clientX,
                y: e.clientY,
              });
            }}
            onDragStart={(e) => {
              if (!onMove || f.depth <= 1) return;
              setDragId(f.id);
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", f.id);
            }}
            onDragOver={(e) => {
              if (!onMove || f.depth <= 1 || !dragId || dragId === f.id) return;
              const source = items.find((item) => item.id === dragId);
              if (!source || source.parentChain.join("/") !== f.parentChain.join("/")) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setOverId(f.id);
            }}
            onDrop={async (e) => {
              e.preventDefault();
              const source = dragId && items.find((item) => item.id === dragId);
              if (onMove && source && dragId !== f.id && source.parentChain.join("/") === f.parentChain.join("/")) {
                await onMove(dragId, f.id);
              }
              setDragId(null);
              setOverId(null);
            }}
            onDragEnd={() => {
              setDragId(null);
              setOverId(null);
            }}
            className={cn(
              "group relative flex items-center gap-1 rounded-md pr-1 transition-colors hover:bg-muted/60",
              isSelected &&
                "bg-primary/10 text-primary before:absolute before:inset-y-1 before:left-0 before:w-[2px] before:rounded-full before:bg-primary",
              dragId === f.id && "opacity-50",
              overId === f.id && "ring-2 ring-primary/60",
            )}
            style={{ paddingLeft: Math.max(0, f.depth - 1) * 14 + "px" }}
          >
            <button
              type="button"
              onClick={() => f.hasChildren && onToggle(f.id)}
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition hover:bg-background/60",
                !f.hasChildren && "invisible",
              )}
              aria-label="toggle"
            >
              <ChevronRight
                className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  isExpanded && "rotate-90",
                )}
              />
            </button>
            <button
              onClick={() => onSelect(f.id)}
              className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left"
              title={f.title}
            >
              <FolderIcon
                open={isExpanded}
                variant={isSelected ? "all" : "default"}
                className={cn(
                  "h-[18px] w-[18px] shrink-0 drop-shadow-sm transition-transform",
                  isSelected ? "scale-105" : "opacity-95 group-hover:opacity-100",
                )}
              />
              <span
                className={cn("flex-1 truncate", isSelected && "font-medium")}
              >
                {f.title}
              </span>
              <span
                className={cn(
                  "shrink-0 text-[11px] tabular-nums transition-colors",
                  isSelected
                    ? "text-primary/80"
                    : "text-muted-foreground",
                )}
              >
                {f.count}
              </span>
            </button>
            {onMove && f.depth > 1 && (
              <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-60" />
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin(f.id);
              }}
              className={cn(
                "h-6 w-6 rounded text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-background/60",
                isPinned && "opacity-100 text-primary",
              )}
              title={isPinned ? t("common.unpin") : t("common.pin")}
            >
              {isPinned ? (
                <Pin className="mx-auto h-3.5 w-3.5" />
              ) : (
                <PinOff className="mx-auto h-3.5 w-3.5" />
              )}
            </button>
          </div>
        );
      })}

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
          items={[
            {
              label: t("folder.rename"),
              onClick: () =>
                setRenameTarget({ id: menu.id, title: menu.rawTitle }),
            },
            {
              label: t("folder.delete"),
              destructive: true,
              onClick: () =>
                setDeleteTarget({
                  id: menu.id,
                  title: menu.title,
                  count: menu.count,
                }),
            },
          ]}
        />
      )}
      <PromptDialog
        open={!!renameTarget}
        onOpenChange={(v) => {
          if (!v) setRenameTarget(null);
        }}
        title={t("folder.renameTitle")}
        label={t("folder.renameLabel")}
        initialValue={renameTarget?.title ?? ""}
        onSave={async (value) => {
          if (renameTarget) await onRename?.(renameTarget.id, value);
          setRenameTarget(null);
        }}
      />
      {deleteTarget && (
        <ConfirmDialog
          open
          onOpenChange={(v) => {
            if (!v) setDeleteTarget(null);
          }}
          destructive
          title={t("folder.deleteTitle")}
          description={t(
            "folder.deleteConfirm",
            deleteTarget.title,
            String(deleteTarget.count),
          )}
          confirmLabel={t("common.delete")}
          onConfirm={async () => {
            try {
              await onDelete?.(deleteTarget.id);
            } finally {
              setDeleteTarget(null);
            }
          }}
        />
      )}
    </div>
  );
}

function flattenForTree(
  tree: BookmarkNode[],
  expanded: Set<string>,
): FolderItem[] {
  const out: FolderItem[] = [];
  const walk = (
    node: BookmarkNode,
    depth: number,
    parentChain: string[],
  ) => {
    if (!node.url && node.parentId) {
      const children = node.children ?? [];
      const subFolders = children.filter((c) => !c.url);
      const count = countBookmarks(node);
      out.push({
        id: node.id,
        title: node.title || t("common.unnamed"),
        rawTitle: node.title || "",
        depth,
        count,
        hasChildren: subFolders.length > 0,
        parentChain,
      });
      if (expanded.has(node.id)) {
        for (const c of subFolders) walk(c, depth + 1, [...parentChain, node.id]);
      }
    } else if (!node.parentId) {
      for (const c of node.children ?? []) walk(c, 1, []);
    }
  };
  for (const n of tree) walk(n, 1, []);
  return out;
}

function countBookmarks(n: BookmarkNode): number {
  if (n.url) return 1;
  return (n.children ?? []).reduce((s, c) => s + countBookmarks(c), 0);
}
