import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "w-full px-4 py-3 bg-white/5 border border-border-glass rounded-[12px] text-text-primary font-[family-name:var(--font-outfit)] text-base outline-none transition-all duration-300 placeholder:text-text-muted focus:border-accent-teal focus:shadow-[0_0_0_3px_rgba(78,205,196,0.15)]",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
