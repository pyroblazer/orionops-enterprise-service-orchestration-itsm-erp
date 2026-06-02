import React from 'react';
import { render, screen } from '@testing-library/react';
import { Progress } from '@/components/ui/progress-placeholder';

describe('Progress', () => {
  it('renders without crashing', () => {
    const { container } = render(<Progress />);
    expect(container).toBeTruthy();
  });

  it('renders with default value', () => {
    render(<Progress value={0} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '0');
  });

  it('renders with specific value', () => {
    render(<Progress value={50} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '50');
  });

  it('reflects raw value in aria-valuenow when over max', () => {
    render(<Progress value={150} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '150');
  });

  it('reflects raw value in aria-valuenow when below min', () => {
    render(<Progress value={-10} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '-10');
  });

  it('has correct aria attributes', () => {
    render(<Progress value={75} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    expect(progressbar).toHaveAttribute('aria-valuenow', '75');
  });

  it('renders with custom className', () => {
    const { container } = render(<Progress value={50} className="custom-class" />);
    const progress = container.querySelector('[role="progressbar"]');
    expect(progress).toHaveClass('custom-class');
  });

  it('has correct aria-label', () => {
    render(<Progress value={60} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-label', 'Progress: 60%');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Progress value={50} ref={ref} />);
    expect(ref.current).toBeInTheDocument();
  });
});
