import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-[var(--focus-width)] focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-medium hover:shadow-large hover:bg-primary/95 active:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground shadow-soft hover:shadow-medium hover:bg-destructive/95 active:bg-destructive/90',
        outline:
          'border border-input bg-background shadow-soft hover:bg-accent hover:text-accent-foreground hover:shadow-medium transition-all',
        secondary:
          'bg-secondary text-secondary-foreground shadow-soft hover:shadow-medium hover:bg-secondary/80',
        ghost:
          'hover:bg-accent hover:text-accent-foreground transition-colors',
        link:
          'text-primary underline-offset-4 hover:underline hover:text-primary/80',
      },
      size: {
        sm: 'h-8 rounded-lg px-3 text-xs',
        md: 'h-10 px-4 py-2',
        lg: 'h-11 rounded-xl px-6',
        icon: 'h-10 w-10 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
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
Button.displayName = 'Button';

export { Button, buttonVariants };
