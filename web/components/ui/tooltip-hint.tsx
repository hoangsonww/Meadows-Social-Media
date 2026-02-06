import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type TooltipHintProps = {
  content: string;
  children: ReactNode;
  className?: string;
};

export function TooltipHint({
  content,
  children,
  className,
}: TooltipHintProps) {
  return (
    <span className={cn("group/tooltip relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 z-[9999] min-w-max -translate-x-1/2 rounded-lg border border-border/70 bg-popover/95 px-2.5 py-1.5 text-xs font-medium text-popover-foreground opacity-0 shadow-soft-xl backdrop-blur transition-all duration-200 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100",
          "top-[calc(100%+0.5rem)] translate-y-1 group-hover/tooltip:translate-y-0 group-focus-within/tooltip:translate-y-0",
        )}
      >
        {content}
      </span>
    </span>
  );
}
