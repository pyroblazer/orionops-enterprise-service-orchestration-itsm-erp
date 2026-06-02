import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '@/components/ui/empty-state';
import { Heart } from 'lucide-react';

describe('EmptyState', () => {
  it('renders with title only', () => {
    render(<EmptyState icon={Heart} title="No items" />);
    expect(screen.getByText('No items')).toBeInTheDocument();
  });

  it('renders with title and description', () => {
    render(
      <EmptyState
        icon={Heart}
        title="No items"
        description="There are no items to display"
      />
    );
    expect(screen.getByText('No items')).toBeInTheDocument();
    expect(screen.getByText('There are no items to display')).toBeInTheDocument();
  });

  it('renders with action button', () => {
    const handleClick = jest.fn();
    render(
      <EmptyState
        icon={Heart}
        title="No items"
        action={{ label: 'Create Item', onClick: handleClick }}
      />
    );
    const button = screen.getByText('Create Item');
    expect(button).toBeInTheDocument();
  });

  it('calls action callback when button is clicked', () => {
    const handleClick = jest.fn();
    render(
      <EmptyState
        icon={Heart}
        title="No items"
        action={{ label: 'Create', onClick: handleClick }}
      />
    );
    const button = screen.getByText('Create');
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalled();
  });

  it('renders with all props', () => {
    const handleClick = jest.fn();
    render(
      <EmptyState
        icon={Heart}
        title="Empty State"
        description="Nothing to show here"
        action={{ label: 'Add Item', onClick: handleClick }}
      />
    );
    expect(screen.getByText('Empty State')).toBeInTheDocument();
    expect(screen.getByText('Nothing to show here')).toBeInTheDocument();
    expect(screen.getByText('Add Item')).toBeInTheDocument();
  });

  it('renders icon from lucide', () => {
    const { container } = render(<EmptyState icon={Heart} title="No items" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
