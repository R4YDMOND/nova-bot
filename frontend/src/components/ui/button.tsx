import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const variantClasses: Record<string, string> = {
  default:     "bg-indigo-600 text-white hover:bg-indigo-700",
  secondary:   "bg-white/10 text-white border border-white/20 hover:bg-white/20",
  destructive: "bg-red-500 text-white hover:bg-red-600",
  outline:     "border border-white/20 bg-transparent hover:bg-white/10",
  ghost:       "hover:bg-white/10",
  link:        "text-indigo-400 underline-offset-4 hover:underline",
};

const sizeClasses: Record<string, string> = {
  default: "h-10 px-4 py-2 text-sm",
  sm:      "h-8 px-3 py-1 text-xs rounded-lg",
  lg:      "h-12 px-8 py-3 text-base",
  icon:    "h-10 w-10",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button };
