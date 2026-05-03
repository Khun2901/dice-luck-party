import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[12px] font-semibold transition-all duration-300 cursor-pointer disabled:pointer-events-none disabled:opacity-40 relative overflow-hidden [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-br from-accent-teal to-[#36b5a0] text-[#0a0a1a] shadow-[0_4px_20px_rgba(78,205,196,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_30px_rgba(78,205,196,0.5)]",
        secondary:
          "bg-glass text-text-primary border border-border-glass hover:bg-white/10 hover:-translate-y-0.5",
        danger:
          "bg-gradient-to-br from-accent-red to-[#e55454] text-white hover:-translate-y-0.5",
        ghost:
          "bg-transparent text-text-secondary hover:bg-white/5 hover:text-text-primary",
      },
      size: {
        default: "px-7 py-3 text-base",
        sm: "px-4 py-2 text-sm rounded-lg",
        lg: "px-8 py-4 text-lg",
        icon: "h-9 w-9 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
