import { EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

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
 */
export default function HideWidgetButton({
  onHide,
  label,
  tooltip,
  variant = "absolute",
  className,
}: Props) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onHide();
      }}
      title={tooltip ?? label}
      aria-label={tooltip ?? label}
      className={cn(
        "z-10 inline-flex shrink-0 items-center gap-1 rounded-full border border-border/70 bg-background/95 px-2.5 py-1 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur-md transition-all duration-150 ease-out",
        "opacity-0 translate-y-1",
        "group-hover/widget:opacity-100 group-hover/widget:translate-y-0",
        "focus-visible:opacity-100 focus-visible:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        "hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive hover:shadow",
        "active:scale-95",
        variant === "absolute" && "absolute right-2 top-2",
        className,
      )}
    >
      <EyeOff className="h-3 w-3" />
      <span>{label}</span>
    </button>
  );
}
