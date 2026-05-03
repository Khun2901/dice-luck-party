import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider transition-colors",
  {
    variants: {
      variant: {
        default: "bg-accent-teal/15 text-accent-teal",
        host: "bg-accent-teal/15 text-accent-teal",
        you: "bg-accent-purple/15 text-accent-purple",
        warning: "bg-accent-yellow/15 text-accent-yellow",
        danger: "bg-accent-red/15 text-accent-red",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
