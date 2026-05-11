import { EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";

interface Props {
  onHide: () => void;
  label: string;
  tooltip?: string;
  /**
   * - `absolute`：浮在父容器右上角，父容器需带 `relative` + `group/widget`
   * - `inline`：作为兄弟节点参与 flex 布局，父容器需带 `group/widget`
   */
  variant?: "absolute" | "inline";
  className?: string;
}

/**
 * 首页可隐藏组件统一使用的「隐藏」按钮：
 * - 默认透明，父容器（标记 `group/widget`）hover/focus 时从下方 1px 上滑进入
 * - 按钮自身 hover 变 destructive 红色，明确「隐藏/移除」语义
 * - 点击瞬间 `scale-95` 微缩反馈
 * - 药丸形 + 模糊背景，在任何复杂背景下都能清晰可见
 * - hover 文案使用自定义 Tooltip，取代浏览器默认 title
 */
export default function HideWidgetButton({
  onHide,
  label,
  tooltip,
  variant = "absolute",
  className,
}: Props) {
  const button = (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onHide();
      }}
      aria-label={tooltip ?? label}
      className={cn(
        "z-10 inline-flex shrink-0 items-center gap-1 rounded-full border border-border/70 bg-background/95 px-2.5 py-1 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur-md transition-all duration-150 ease-out",
        "hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive hover:shadow",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        "active:scale-95",
        className,
      )}
    >
      <EyeOff className="h-3 w-3" />
      <span>{label}</span>
    </button>
  );

  // 进入动画 + 浮层位置：包一层 wrapper 承载 group-hover 与绝对定位，
  // 内层 Tooltip 只负责 hover 文案，避免与 group-hover 透明度 / translate 动画相互覆盖。
  return (
    <span
      className={cn(
        "z-10 inline-flex shrink-0 opacity-0 translate-y-1 transition-all duration-150 ease-out",
        "group-hover/widget:opacity-100 group-hover/widget:translate-y-0",
        "focus-within:opacity-100 focus-within:translate-y-0",
        variant === "absolute" && "absolute right-2 top-2",
      )}
    >
      <Tooltip content={tooltip ?? label} side="top">
        {button}
      </Tooltip>
    </span>
  );
}
