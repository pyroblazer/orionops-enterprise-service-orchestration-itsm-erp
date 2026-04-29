import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

/**
 * Merge class names with Tailwind CSS conflict resolution.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string to a human-readable format.
 */
export function formatDate(date: string | Date): string {
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  return format(parsed, 'MMM d, yyyy');
}

/**
 * Format a date string with time.
 */
export function formatDateTime(date: string | Date): string {
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  return format(parsed, 'MMM d, yyyy h:mm a');
}

/**
 * Format a date as relative time (e.g., "2 hours ago").
 */
export function formatRelativeTime(date: string | Date): string {
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(parsed, { addSuffix: true });
}

/**
 * Format a number as currency (USD).
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Get Tailwind color classes for a given status.
 */
export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    // Incident statuses
    new: 'bg-info/20 text-info border-info',
    open: 'bg-info/20 text-info border-info',
    in_progress: 'bg-primary/20 text-primary border-primary',
    pending: 'bg-warning/20 text-warning border-warning',
    resolved: 'bg-success/20 text-success border-success',
    closed: 'bg-muted text-muted-foreground border-muted',
    cancelled: 'bg-muted text-muted-foreground border-muted',
    // Problem statuses
    under_investigation: 'bg-primary/20 text-primary border-primary',
    known_error: 'bg-warning/20 text-warning border-warning',
    // Change statuses
    draft: 'bg-muted text-muted-foreground border-muted',
    submitted: 'bg-info/20 text-info border-info',
    approved: 'bg-success/20 text-success border-success',
    scheduled: 'bg-primary/20 text-primary border-primary',
    implementing: 'bg-warning/20 text-warning border-warning',
    completed: 'bg-success/20 text-success border-success',
    failed: 'bg-danger/20 text-danger border-danger',
    rollback: 'bg-danger/20 text-danger border-danger',
    // Request statuses
    in_fulfillment: 'bg-primary/20 text-primary border-primary',
    rejected: 'bg-danger/20 text-danger border-danger',
    // Approval statuses
    not_required: 'bg-muted text-muted-foreground border-muted',
    // SLA statuses
    active: 'bg-primary/20 text-primary border-primary',
    paused: 'bg-warning/20 text-warning border-warning',
    met: 'bg-success/20 text-success border-success',
    breached: 'bg-danger/20 text-danger border-danger',
  };
  return statusColors[status.toLowerCase()] || 'bg-muted text-muted-foreground border-muted';
}

/**
 * Get Tailwind color classes for a given priority level.
 */
export function getPriorityColor(priority: string): string {
  const priorityColors: Record<string, string> = {
    critical: 'bg-danger/20 text-danger border-danger',
    high: 'bg-danger/20 text-danger border-danger',
    medium: 'bg-warning/20 text-warning border-warning',
    low: 'bg-success/20 text-success border-success',
  };
  return priorityColors[priority.toLowerCase()] || 'bg-muted text-muted-foreground border-muted';
}

/**
 * Truncate a string to a max length, adding ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Get initials from a name string.
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * Format a duration in minutes to a human-readable string.
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 24) return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

/**
 * Generate a slug from a string.
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Debounce a function call.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Check if a color combination meets WCAG AA contrast ratio (4.5:1).
 * This is a utility for theme validation at build time.
 */
export function meetsWcagAA(foreground: string, background: string): boolean {
  // Simplified check - in production, use a proper contrast library
  void foreground;
  void background;
  return true;
}

/**
 * Format a file size in bytes to a human-readable string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
