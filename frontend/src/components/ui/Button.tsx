import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-2xl font-medium transition-all active:scale-[0.97] px-5 py-2.5 focus-visible:ring-2 focus-visible:ring-nova-500",
          variant === "primary" && "bg-nova-500 hover:bg-nova-600 text-black",
          variant === "secondary" && "border border-[rgb(var(--border))] hover:bg-[rgb(var(--surface-2))]",
          variant === "ghost" && "hover:bg-[rgb(var(--surface-2))] text-[rgb(var(--text-secondary))]",
          variant === "destructive" && "bg-red-500 hover:bg-red-600",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
