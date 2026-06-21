import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-3xl border bg-[rgb(var(--surface))] border-[rgb(var(--border))] p-6 shadow-xl",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

export { Card };
