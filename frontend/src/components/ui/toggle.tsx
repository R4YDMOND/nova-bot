'use client';
import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onCheckedChange?: (checked: boolean) => void;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, onCheckedChange, onChange, ...props }, ref) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        ref={ref}
        className="sr-only peer"
        onChange={(e) => {
          onChange?.(e);
          onCheckedChange?.(e.target.checked);
        }}
        {...props}
      />
      <div className={cn(
        "w-11 h-6 bg-zinc-700 peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer",
        "peer-checked:bg-indigo-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5",
        "after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5",
        className
      )} />
    </label>
  )
);
Switch.displayName = "Switch";
export { Switch };