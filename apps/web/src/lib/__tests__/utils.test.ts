import {
  cn,
  formatDate,
  formatDateTime,
  formatCurrency,
  getStatusColor,
  getPriorityColor,
  formatRelativeTime,
  truncate,
  getInitials,
  formatDuration,
  slugify,
  debounce,
  formatFileSize,
} from '@/lib/utils';

describe('cn()', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('resolves Tailwind conflicts (last wins)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('handles conditional classes via clsx', () => {
    expect(cn('base', false && 'hidden', 'extra')).toBe('base extra');
  });

  it('returns empty string for no inputs', () => {
    expect(cn()).toBe('');
  });
});

describe('formatDate()', () => {
  it('formats an ISO date string', () => {
    const result = formatDate('2025-01-15T10:30:00Z');
    expect(result).toMatch(/Jan/);
    expect(result).toMatch(/15/);
    expect(result).toMatch(/2025/);
  });

  it('formats a Date object', () => {
    const date = new Date(2025, 5, 20);
    const result = formatDate(date);
    expect(result).toMatch(/Jun/);
    expect(result).toMatch(/20/);
  });
});

describe('formatDateTime()', () => {
  it('formats a date with time', () => {
    const result = formatDateTime('2025-01-15T14:30:00Z');
    expect(result).toMatch(/Jan/);
    expect(result).toMatch(/15/);
    expect(result).toMatch(/2025/);
  });
});

describe('formatCurrency()', () => {
  it('formats USD by default', () => {
    expect(formatCurrency(1234.5)).toBe('$1,234.50');
  });

  it('formats with custom currency', () => {
    const result = formatCurrency(1000, 'EUR');
    expect(result).toMatch(/1,000.00/);
  });

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('handles negative amounts', () => {
    expect(formatCurrency(-500)).toBe('-$500.00');
  });
});

describe('getStatusColor()', () => {
  it('returns color classes for "new" status', () => {
    expect(getStatusColor('new')).toContain('bg-info');
  });

  it('returns color classes for "in_progress" status', () => {
    expect(getStatusColor('in_progress')).toContain('bg-primary');
  });

  it('returns color classes for "resolved" status', () => {
    expect(getStatusColor('resolved')).toContain('bg-success');
  });

  it('returns color classes for "breached" status', () => {
    expect(getStatusColor('breached')).toContain('bg-danger');
  });

  it('is case-insensitive', () => {
    expect(getStatusColor('NEW')).toEqual(getStatusColor('new'));
  });

  it('returns default classes for unknown status', () => {
    expect(getStatusColor('unknown')).toContain('bg-muted');
  });
});

describe('getPriorityColor()', () => {
  it('returns danger classes for critical', () => {
    expect(getPriorityColor('critical')).toContain('bg-danger');
  });

  it('returns danger classes for high', () => {
    expect(getPriorityColor('high')).toContain('bg-danger');
  });

  it('returns warning classes for medium', () => {
    expect(getPriorityColor('medium')).toContain('bg-warning');
  });

  it('returns success classes for low', () => {
    expect(getPriorityColor('low')).toContain('bg-success');
  });

  it('is case-insensitive', () => {
    expect(getPriorityColor('CRITICAL')).toEqual(getPriorityColor('critical'));
  });

  it('returns default for unknown priority', () => {
    expect(getPriorityColor('unknown')).toContain('bg-muted');
  });
});

describe('formatRelativeTime()', () => {
  it('returns a string containing "ago"', () => {
    const past = new Date(Date.now() - 3600000).toISOString();
    expect(formatRelativeTime(past)).toContain('ago');
  });
});

describe('truncate()', () => {
  it('returns original string if within limit', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('truncates with ellipsis', () => {
    expect(truncate('hello world', 8)).toBe('hello...');
  });
});

describe('getInitials()', () => {
  it('returns initials from full name', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });

  it('handles single name', () => {
    expect(getInitials('John')).toBe('J');
  });

  it('limits to 2 characters', () => {
    expect(getInitials('John Michael Doe')).toBe('JM');
  });
});

describe('formatDuration()', () => {
  it('formats minutes under 60', () => {
    expect(formatDuration(45)).toBe('45m');
  });

  it('formats hours', () => {
    expect(formatDuration(120)).toBe('2h');
  });

  it('formats hours with remaining minutes', () => {
    expect(formatDuration(90)).toBe('1h 30m');
  });

  it('formats days', () => {
    expect(formatDuration(1440)).toBe('1d');
  });

  it('formats days with remaining hours', () => {
    expect(formatDuration(1560)).toBe('1d 2h');
  });
});

describe('slugify()', () => {
  it('converts to lowercase', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('removes special characters', () => {
    expect(slugify('Hello, World!')).toBe('hello-world');
  });

  it('replaces spaces and underscores with dashes', () => {
    expect(slugify('hello_world test')).toBe('hello-world-test');
  });
});

describe('debounce()', () => {
  it('debounces function calls', () => {
    jest.useFakeTimers();
    const fn = jest.fn();
    const debounced = debounce(fn, 100);

    debounced();
    debounced();
    debounced();

    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });
});

describe('formatFileSize()', () => {
  it('formats bytes', () => {
    expect(formatFileSize(500)).toBe('500 B');
  });

  it('formats kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
  });

  it('formats megabytes', () => {
    expect(formatFileSize(1048576)).toBe('1 MB');
  });

  it('handles zero', () => {
    expect(formatFileSize(0)).toBe('0 B');
  });
});
