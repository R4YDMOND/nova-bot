import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg";
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center rounded-2xl font-medium transition-all active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nova-500",
          variant === "primary" && "bg-nova-500 hover:bg-nova-600 text-black",
          variant === "secondary" && "border border-[rgb(var(--border))] hover:bg-[rgb(var(--surface-2))]",
          variant === "ghost" && "hover:bg-[rgb(var(--surface-2))] text-[rgb(var(--text-secondary))]",
          variant === "destructive" && "bg-red-500 hover:bg-red-600 text-white",
          size === "default" && "px-5 py-2.5 text-sm",
          size === "sm" && "px-4 py-2 text-xs",
          size === "lg" && "px-6 py-3 text-base",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
