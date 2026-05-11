import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  /** 浮层显示的文案；为空时不渲染浮层（行为退化为只渲染 children） */
  content?: ReactNode;
  children: ReactNode;
  /** 浮层位置，默认 top（在触发元素上方） */
  side?: "top" | "bottom";
  /** 显示延迟（ms），默认 200，避免鼠标快速划过频繁触发 */
  delay?: number;
  /** 让 wrapper 占满 children 的 inline 流式宽度 */
  className?: string;
  /** 浮层自定义 className */
  contentClassName?: string;
}

/**
 * 轻量自定义 Tooltip：
 * - 与项目设计系统对齐：foreground 底 + background 字、圆角 + 阴影 + 模糊
 * - 进入用 `tailwindcss-animate` 的 fade-in + zoom-in，比浏览器原生 title 更柔和
 * - 200ms 显示延迟，避免鼠标快速划过频繁触发
 * - 长文案自动换行（max-w + whitespace-normal + text-balance）
 * - 失焦 / 鼠标离开 / Escape 立即关闭
 * - 触摸设备直接退化（touch 时不触发 hover）
 */
export function Tooltip({
  content,
  children,
  side = "top",
  delay = 200,
  className,
  contentClassName,
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);
  const tooltipId = useId();

  const clear = useCallback(() => {
    if (timerRef.current !== undefined) {
      window.clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  const show = useCallback(() => {
    clear();
    timerRef.current = window.setTimeout(() => setOpen(true), delay);
  }, [clear, delay]);

  const hide = useCallback(() => {
    clear();
    setOpen(false);
  }, [clear]);

  useEffect(() => () => clear(), [clear]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") hide();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, hide]);

  if (!content) {
    return <>{children}</>;
  }

  return (
    <span
      className={cn("relative inline-flex", className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      aria-describedby={open ? tooltipId : undefined}
    >
      {children}
      {open && (
        <span
          id={tooltipId}
          role="tooltip"
          className={cn(
            "pointer-events-none absolute left-1/2 z-50 -translate-x-1/2",
            "max-w-[240px] whitespace-normal text-balance text-center leading-snug",
            "rounded-md bg-foreground/95 px-2.5 py-1.5 text-[11px] font-medium text-background shadow-lg backdrop-blur-sm",
            "animate-in fade-in-0 zoom-in-95 duration-150",
            side === "top" ? "bottom-full mb-2" : "top-full mt-2",
            contentClassName,
          )}
        >
          {content}
          <span
            aria-hidden
            className={cn(
              "absolute left-1/2 h-0 w-0 -translate-x-1/2 border-[5px] border-transparent",
              side === "top"
                ? "top-full border-t-foreground/95"
                : "bottom-full border-b-foreground/95",
            )}
          />
        </span>
      )}
    </span>
  );
}
