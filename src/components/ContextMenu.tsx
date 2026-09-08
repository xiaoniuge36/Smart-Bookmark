import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export interface ContextMenuItem {
  label: string;
  onClick: () => void;
  destructive?: boolean;
}

/**
 * 轻量右键菜单：portal 到 document.body，固定定位于视口 (clientX/clientY)，
 * 自动做视口边界收敛。
 *
 * portal 是必要的——否则菜单会被渲染进调用方所在的层叠上下文（如 sticky 侧栏
 * 会创建 stacking context），导致向右延伸时被中栏卡片/组件遮挡。
 * 关闭用「点击外部(mousedown)」+ ref 命中判定：portal 到 body 后，容器上的
 * stopPropagation 对 body 级原生冒泡不可靠，故改为 ref 判定。延迟一帧绑定，
 * 避免打开菜单的那次右键(mousedown)立即把自己关掉。
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
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

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
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onCloseRef.current();
      }
    };
    const timer = window.setTimeout(() => {
      window.addEventListener("mousedown", onDown);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("mousedown", onDown);
    };
  }, [x, y]);

  return createPortal(
    <div
      ref={ref}
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
            onCloseRef.current();
          }}
        >
          {it.label}
        </button>
      ))}
    </div>,
    document.body,
  );
}
