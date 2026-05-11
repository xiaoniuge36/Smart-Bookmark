import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  /** 浮层显示的文案；为空时不渲染浮层（行为退化为只渲染 children） */
  content?: ReactNode;
  children: ReactNode;
  /** 浮层位置，默认 bottom（在触发元素下方，更适合首页 widget header 场景） */
  side?: "top" | "bottom";
  /** 横向对齐，默认 center；end 用于触发元素位于父容器右边缘的场景 */
  align?: "start" | "center" | "end";
  /** wrapper 自定义 className */
  className?: string;
  /** 浮层自定义 className */
  contentClassName?: string;
}

/**
 * 与 LoginPromptButton 弹层视觉对齐的 popover-card 风格 Tooltip：
 * - 浅色 `bg-popover` + `ring` + `shadow-xl`，与项目其它浮层一致
 * - 纯 CSS group-hover/focus-within 驱动，无 JS state，无闪烁
 * - 触发元素与浮层之间用「容器 mt-* 留白」而非「margin-外」实现：
 *   留白处仍属于 group 命中区，鼠标在触发元素和浮层之间平移不会丢失 hover
 * - 进入动画用 tailwindcss-animate 的 fade-in + zoom-in
 * - 默认浮层在下方（side=bottom），更适合首页 widget header 场景；
 *   触发元素在父容器右边缘时配合 align=end 让浮层对齐右边
 */
export function Tooltip({
  content,
  children,
  side = "bottom",
  align = "center",
  className,
  contentClassName,
}: TooltipProps) {
  if (!content) {
    return <>{children}</>;
  }

  return (
    <span
      className={cn(
        "group/sb-tooltip relative inline-flex",
        className,
      )}
    >
      {children}
      <span
        role="tooltip"
        // 容器：覆盖触发元素到浮层之间的"空气间距"，避免鼠标平移丢 hover
        // 注：不能加 pointer-events-none，否则鼠标移到 tooltip 上 group-hover 会失效闪烁
        className={cn(
          "invisible absolute z-50 opacity-0 transition-opacity duration-150",
          "group-hover/sb-tooltip:visible group-hover/sb-tooltip:opacity-100",
          "group-focus-within/sb-tooltip:visible group-focus-within/sb-tooltip:opacity-100",
          side === "top" ? "bottom-full" : "top-full",
          align === "start" && "left-0",
          align === "center" && "left-1/2 -translate-x-1/2",
          align === "end" && "right-0",
        )}
      >
        {/* 实际浮层卡片：mt/mb 提供 6px 视觉间距，但 mt 部分仍在外层命中区内 */}
        <span
          className={cn(
            "block w-max max-w-[260px] rounded-lg border bg-popover px-3 py-2 text-left text-[11.5px] leading-relaxed text-foreground shadow-xl ring-1 ring-black/[0.04] dark:ring-white/[0.06]",
            "animate-in fade-in-0 zoom-in-95 duration-150",
            side === "top" ? "mb-1.5" : "mt-1.5",
            contentClassName,
          )}
        >
          {content}
        </span>
      </span>
    </span>
  );
}
