import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, { dot: string; text: string }> = {
  default: { dot: "bg-text-muted", text: "border-border" },
  success: { dot: "bg-emerald-accent", text: "border-border" },
  warning: { dot: "bg-amber-accent", text: "border-border" },
  danger: { dot: "bg-rose-accent", text: "border-border" },
  info: { dot: "bg-text-primary", text: "border-border" },
};

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const styles = variantStyles[variant];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border bg-surface px-2 py-0.5 text-xs font-medium text-text-primary font-heading",
        styles.text,
        className,
      )}
      {...props}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", styles.dot)} aria-hidden="true" />
      {children}
    </span>
  );
}
