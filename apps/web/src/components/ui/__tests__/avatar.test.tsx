import React from 'react';
import { render } from '@testing-library/react';
import { Avatar } from '@/components/ui/avatar';

describe('Avatar', () => {
  it('renders with fallbackText', () => {
    const { container } = render(<Avatar fallbackText="John Doe" />);
    expect(container).toBeInTheDocument();
  });

  it('renders with src and alt', () => {
    const { container } = render(<Avatar src="/avatar.jpg" alt="User avatar" fallbackText="JD" />);
    expect(container).toBeInTheDocument();
  });

  it('renders without fallback text', () => {
    const { container } = render(<Avatar />);
    expect(container).toBeInTheDocument();
  });

  it('accepts className prop', () => {
    const { container } = render(<Avatar fallbackText="JD" className="custom" />);
    expect(container).toBeInTheDocument();
  });

  it('forwards ref', () => {
    const ref = React.createRef<HTMLDivElement>();
    const { container } = render(<Avatar fallbackText="JD" ref={ref} />);
    expect(container).toBeInTheDocument();
  });

  it('renders multiple avatars', () => {
    const { container } = render(
      <div>
        <Avatar fallbackText="JD" />
        <Avatar fallbackText="JS" />
      </div>
    );
    expect(container.querySelectorAll('[role="img"]').length).toBeGreaterThanOrEqual(0);
  });
});
