import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface SelectMenuOption {
  value: string;
  label: string;
  description?: string;
  dotClassName?: string;
  dotStyle?: React.CSSProperties;
  disabled?: boolean;
}

interface SelectMenuProps {
  value: string;
  options: SelectMenuOption[];
  placeholder: string;
  onChange: (value: string) => void;
  className?: string;
  contentClassName?: string;
  align?: "start" | "center" | "end";
}

export default function SelectMenu({
  value,
  options,
  placeholder,
  onChange,
  className,
  contentClassName,
  align = "end",
}: SelectMenuProps) {
  const selected = options.find((option) => option.value === value);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-9 min-w-0 items-center justify-between gap-2 rounded-xl border bg-background px-3 text-sm shadow-sm transition hover:border-primary/40 hover:bg-accent/40 focus:outline-none focus:ring-2 focus:ring-primary/20",
            className,
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            {(selected?.dotClassName || selected?.dotStyle) && (
              <span
                className={cn("h-2.5 w-2.5 shrink-0 rounded-full", selected.dotClassName)}
                style={selected.dotStyle}
              />
            )}
            <span className="truncate">{selected?.label ?? placeholder}</span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        className={cn("max-h-72 min-w-[12rem] overflow-auto", contentClassName)}
      >
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            disabled={option.disabled}
            onSelect={() => onChange(option.value)}
            className="items-start justify-between gap-3"
          >
            <span className="flex min-w-0 items-start gap-2">
              {(option.dotClassName || option.dotStyle) && (
                <span
                  className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", option.dotClassName)}
                  style={option.dotStyle}
                />
              )}
              <span className="min-w-0">
                <span className="block truncate">{option.label}</span>
                {option.description && (
                  <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                    {option.description}
                  </span>
                )}
              </span>
            </span>
            {option.value === value && (
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
