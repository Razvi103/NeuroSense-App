"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-blue text-surface hover:bg-brand-blue-dark shadow-sm",
  secondary:
    "bg-surface text-text-primary border border-border hover:border-brand-blue hover:text-brand-blue hover:shadow-sm",
  ghost:
    "text-text-secondary hover:text-brand-blue hover:bg-brand-blue-surface",
  danger:
    "bg-rose-accent text-white hover:bg-rose-accent/90 shadow-sm",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-6 py-2.5 text-base gap-2",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium font-heading",
          "transition-all duration-200 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 focus-visible:ring-offset-base",
          "disabled:opacity-40 disabled:pointer-events-none",
          "cursor-pointer",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
export { Button, type ButtonProps };
