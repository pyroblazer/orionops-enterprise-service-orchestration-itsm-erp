import { cn } from '@/lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-primary/10', className)}
      role="status"
      aria-label="Loading..."
      aria-busy="true"
      {...props}
    />
  );
}

export { Skeleton };
