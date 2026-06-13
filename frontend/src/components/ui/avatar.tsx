import { cn } from "@/lib/utils";

interface AvatarProps {
  initials: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeStyles = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-11 w-11 text-base",
};

export function Avatar({ initials, className, size = "md" }: AvatarProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full",
        "bg-elevated text-text-primary font-semibold font-heading",
        "border border-border",
        sizeStyles[size],
        className,
      )}
    >
      {initials}
    </div>
  );
}
