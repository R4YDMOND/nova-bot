import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}

const variantClasses: Record<string, string> = {
  default:     "bg-indigo-600 text-white",
  secondary:   "bg-white/10 text-white/70 border border-white/20",
  destructive: "bg-red-500/20 text-red-400 border border-red-500/30",
  outline:     "border border-white/20 text-white/70",
  success:     "bg-green-500/20 text-green-400 border border-green-500/30",
  warning:     "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
};

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
);
Badge.displayName = "Badge";

export { Badge };