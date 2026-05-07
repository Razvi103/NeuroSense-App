"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-text-secondary font-heading"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full rounded-lg border bg-card px-3.5 py-2.5 text-sm text-text-primary",
            "placeholder:text-text-muted",
            "transition-colors duration-200",
            "focus:outline-none focus:ring-2 focus:ring-cyan-deep/40 focus:border-cyan-deep/50",
            error
              ? "border-rose-accent/50 focus:ring-rose-accent/30"
              : "border-border hover:border-border/80",
            className,
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-rose-accent">{error}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
export { Input, type InputProps };
