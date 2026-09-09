import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export type ContextMenuItem =
  | { label: string; onClick: () => void; destructive?: boolean }
  | { separator: true };

/**
 * 轻量右键菜单：portal 到 document.body，自动做边界收敛。
 *
 * portal 是必要的——否则菜单会被渲染进调用方所在的层叠上下文（sticky 侧栏会创建
 * stacking context，backdrop-filter 会为 fixed 子元素创建包含块），导致延伸时被
 * 中栏卡片/组件遮挡或滚动跑位。
 *
 * 定位模式 anchor：
 * - "viewport"（默认）：position:fixed + 视口坐标(clientX/clientY)，不随页面滚动。
 * - "page"：position:absolute + 页面坐标(pageX/pageY)，随页面滚动锚定到触发点。
 *
 * 关闭用「点击外部(mousedown)」+ ref 命中判定：portal 到 body 后，容器上的
 * stopPropagation 对 body 级原生冒泡不可靠，故改为 ref 判定。延迟一帧绑定，
 * 避免打开菜单的那次交互(mousedown)立即把自己关掉。
 */
export default function ContextMenu({
  x,
  y,
  items,
  onClose,
  anchor = "viewport",
}: {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
  anchor?: "viewport" | "page";
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
      const ox = anchor === "page" ? window.scrollX : 0;
      const oy = anchor === "page" ? window.scrollY : 0;
      setPos({
        left: Math.max(ox + pad, Math.min(x, ox + window.innerWidth - r.width - pad)),
        top: Math.max(oy + pad, Math.min(y, oy + window.innerHeight - r.height - pad)),
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
  }, [x, y, anchor]);

  return createPortal(
    <div
      ref={ref}
      className={cn(
        anchor === "page" ? "absolute" : "fixed",
        "z-[60] min-w-[160px] rounded-lg border bg-popover p-1 text-sm shadow-lg",
      )}
      style={{ left: pos.left, top: pos.top }}
    >
      {items.map((it, i) =>
        "separator" in it ? (
          <div key={i} className="my-1 h-px bg-border" />
        ) : (
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
        ),
      )}
    </div>,
    document.body,
  );
}
