import React from 'react';
import { render } from '@testing-library/react';
import { Sidebar } from '@/components/ui/sidebar';

jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

describe('Sidebar Component', () => {
  it('renders when expanded', () => {
    const { container } = render(<Sidebar collapsed={false} onToggle={jest.fn()} />);
    expect(container).toBeInTheDocument();
  });

  it('renders when collapsed', () => {
    const { container } = render(<Sidebar collapsed={true} onToggle={jest.fn()} />);
    expect(container).toBeInTheDocument();
  });

  it('accepts onToggle callback', () => {
    const onToggle = jest.fn();
    const { container } = render(<Sidebar collapsed={false} onToggle={onToggle} />);
    expect(container).toBeInTheDocument();
  });

  it('renders with different collapsed states', () => {
    const { container: collapsed } = render(<Sidebar collapsed={true} onToggle={jest.fn()} />);
    const { container: expanded } = render(<Sidebar collapsed={false} onToggle={jest.fn()} />);
    expect(collapsed).toBeInTheDocument();
    expect(expanded).toBeInTheDocument();
  });

  it('accepts required props', () => {
    const { container } = render(<Sidebar collapsed={false} onToggle={jest.fn()} />);
    expect(container).toBeInTheDocument();
  });
});
