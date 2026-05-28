import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-[var(--focus-width)] focus:ring-ring hover:scale-105 active:scale-95',
  {
    variants: {
      variant: {
        default: 'bg-primary/20 text-primary shadow-soft',
        secondary: 'bg-secondary/20 text-secondary-foreground shadow-soft',
        destructive: 'bg-destructive/20 text-destructive shadow-soft',
        success: 'bg-success/20 text-success shadow-soft',
        warning: 'bg-warning/20 text-warning shadow-soft',
        danger: 'bg-danger/20 text-danger shadow-soft',
        info: 'bg-info/20 text-info shadow-soft',
        outline: 'border border-border text-foreground shadow-soft',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      role="status"
      {...props}
    />
  );
}

export { Badge, badgeVariants };
