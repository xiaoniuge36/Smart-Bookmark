import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface ContextMenuItem {
  label: string;
  onClick: () => void;
  destructive?: boolean;
}

/**
 * 轻量右键菜单：固定定位于 (x, y)，自动做视口边界收敛，
 * 点击外部 / 滚动时关闭。
 */
export default function ContextMenu({
  x,
  y,
  items,
  onClose,
}: {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y });

  useEffect(() => {
    const el = ref.current;
    if (el) {
      const r = el.getBoundingClientRect();
      const pad = 8;
      setPos({
        left: Math.min(x, window.innerWidth - r.width - pad),
        top: Math.min(y, window.innerHeight - r.height - pad),
      });
    }
    const close = () => onClose();
    // 仅监听「点击外部」关闭。不监听 scroll：hero 视图下异步内容会引起
    // 滚动/布局事件（捕获阶段会抓到任意可滚动元素），会把刚打开的菜单瞬间关掉。
    window.addEventListener("click", close);
    return () => {
      window.removeEventListener("click", close);
    };
  }, [x, y, onClose]);

  return (
    <div
      ref={ref}
      onClick={(e) => e.stopPropagation()}
      className="fixed z-[60] min-w-[160px] rounded-lg border bg-popover p-1 text-sm shadow-lg"
      style={{ left: pos.left, top: pos.top }}
    >
      {items.map((it, i) => (
        <button
          key={i}
          type="button"
          className={cn(
            "flex w-full items-center gap-2 rounded px-3 py-1.5 text-left hover:bg-accent",
            it.destructive && "text-destructive hover:bg-destructive/10",
          )}
          onClick={() => {
            it.onClick();
            onClose();
          }}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
