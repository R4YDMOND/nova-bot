'use client';
import * as React from "react";
import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof React.HTMLInputElement>,
  React.ComponentPropsWithoutRef<typeof React.HTMLInputElement>
>(({ className, ...props }, ref) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input type="checkbox" ref={ref} className="sr-only peer" {...props} />
    <div className={cn(
      "toggle w-11 h-6 bg-zinc-700 peer-focus:ring-2 peer-focus:ring-nova-500 rounded-full peer",
      "peer-checked:bg-nova-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5",
      className
    )} />
  </label>
));
Switch.displayName = "Switch";

export { Switch };
