import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-elevated text-text-secondary border-border",
  success: "bg-emerald-accent/10 text-emerald-accent border-emerald-accent/20",
  warning: "bg-amber-accent/10 text-amber-accent border-amber-accent/20",
  danger: "bg-rose-accent/10 text-rose-accent border-rose-accent/20",
  info: "bg-cyan-deep/10 text-cyan-accent border-cyan-deep/20",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium font-heading",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
