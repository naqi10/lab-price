import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/20 text-blue-300 border-blue-500/20",
        secondary: "border-transparent bg-slate-700/60 text-slate-300",
        destructive: "border-transparent bg-red-900/40 text-red-400 border-red-500/20",
        outline: "border-border text-foreground/80",
        success: "border-transparent bg-emerald-900/40 text-emerald-400 border-emerald-500/20",
        warning: "border-transparent bg-amber-900/40 text-amber-400 border-amber-500/20",
        info: "border-transparent bg-sky-900/40 text-sky-400 border-sky-500/20",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
