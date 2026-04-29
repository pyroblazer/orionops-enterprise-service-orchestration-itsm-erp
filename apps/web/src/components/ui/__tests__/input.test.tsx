import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/input';

describe('Input', () => {
  it('renders with a label', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('renders without a label', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('shows error state with error message', () => {
    render(<Input label="Username" error="Username is required" />);
    const input = screen.getByLabelText('Username');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Username is required')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('shows helper text when no error', () => {
    render(<Input label="Email" helperText="We will never share your email" />);
    expect(screen.getByText('We will never share your email')).toBeInTheDocument();
  });

  it('hides helper text when error is present', () => {
    render(
      <Input
        label="Email"
        error="Invalid email"
        helperText="We will never share your email"
      />
    );
    expect(screen.queryByText('We will never share your email')).not.toBeInTheDocument();
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
  });

  it('handles value changes', async () => {
    const handleChange = jest.fn();
    render(<Input label="Name" onChange={handleChange} />);

    const input = screen.getByLabelText('Name');
    await userEvent.type(input, 'test');

    expect(handleChange).toHaveBeenCalled();
  });

  it('sets aria-invalid when error is present', () => {
    render(<Input label="Field" error="Required" />);
    expect(screen.getByLabelText('Field')).toHaveAttribute('aria-invalid', 'true');
  });

  it('does not set aria-invalid when there is no error', () => {
    render(<Input label="Field" />);
    expect(screen.getByLabelText('Field')).not.toHaveAttribute('aria-invalid');
  });

  it('sets aria-describedby to error element id', () => {
    render(<Input label="Email" error="Required" />);
    const input = screen.getByLabelText('Email');
    const errorId = input.getAttribute('aria-describedby');
    expect(errorId).toBeTruthy();
    expect(document.getElementById(errorId!)).toBeInTheDocument();
    expect(document.getElementById(errorId!)!.textContent).toBe('Required');
  });

  it('sets aria-describedby to helper text element id when no error', () => {
    render(<Input label="Email" helperText="Enter your work email" />);
    const input = screen.getByLabelText('Email');
    const helperId = input.getAttribute('aria-describedby');
    expect(helperId).toBeTruthy();
    expect(document.getElementById(helperId!)!.textContent).toBe('Enter your work email');
  });

  it('applies error border styles when error is present', () => {
    render(<Input label="Test" error="Error" />);
    const input = screen.getByLabelText('Test');
    expect(input.className).toContain('border-danger');
  });

  it('uses generated id to link label and input', () => {
    render(<Input label="Username" id="username-input" />);
    const input = screen.getByLabelText('Username');
    expect(input).toHaveAttribute('id', 'username-input');
  });
});
