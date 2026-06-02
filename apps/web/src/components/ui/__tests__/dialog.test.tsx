import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
} from '@/components/ui/dialog';

describe('Dialog', () => {
  it('renders dialog trigger button', () => {
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <div>Content</div>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByText('Open Dialog')).toBeInTheDocument();
  });

  it('renders dialog with custom trigger className', () => {
    render(
      <Dialog>
        <DialogTrigger className="custom-trigger">Open</DialogTrigger>
        <DialogContent>
          <div>Content</div>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByText('Open')).toHaveClass('custom-trigger');
  });

  it('renders dialog trigger with asChild', () => {
    render(
      <Dialog>
        <DialogTrigger asChild>
          <button>Custom Trigger</button>
        </DialogTrigger>
        <DialogContent>
          <div>Content</div>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByText('Custom Trigger')).toBeInTheDocument();
  });

  it('renders simple dialog structure', () => {
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <div>Simple content</div>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('renders dialog header component standalone', () => {
    const { container } = render(
      <DialogHeader className="test-header">
        <div>Header Content</div>
      </DialogHeader>
    );
    expect(container.querySelector('.test-header')).toBeInTheDocument();
  });

  it('renders dialog header with custom className', () => {
    const { container } = render(
      <DialogHeader className="custom-header">
        <span>Content</span>
      </DialogHeader>
    );
    expect(container.querySelector('.custom-header')).toBeInTheDocument();
  });

  it('renders dialog footer component standalone', () => {
    const { container } = render(
      <DialogFooter className="test-footer">
        <button>Action</button>
      </DialogFooter>
    );
    expect(container.querySelector('.test-footer')).toBeInTheDocument();
  });

  it('renders dialog footer with custom className', () => {
    const { container } = render(
      <DialogFooter className="custom-footer">
        <button>Submit</button>
      </DialogFooter>
    );
    expect(container.querySelector('.custom-footer')).toBeInTheDocument();
  });

  it('renders dialog with header and footer', () => {
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <div>Title goes here</div>
          </DialogHeader>
          <div>Main content</div>
          <DialogFooter>
            <button>Cancel</button>
            <button>Save</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('renders dialog with multiple triggers', () => {
    render(
      <Dialog>
        <DialogTrigger>First Trigger</DialogTrigger>
        <DialogTrigger>Second Trigger</DialogTrigger>
        <DialogContent>
          <div>Content</div>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByText('First Trigger')).toBeInTheDocument();
    expect(screen.getByText('Second Trigger')).toBeInTheDocument();
  });

  it('renders dialog footer with multiple buttons', () => {
    const { container } = render(
      <DialogFooter>
        <button>Cancel</button>
        <button>Confirm</button>
        <button>Delete</button>
      </DialogFooter>
    );
    expect(container.querySelectorAll('button')).toHaveLength(3);
  });

  it('renders dialog header with multiple children', () => {
    const { container } = render(
      <DialogHeader>
        <div>Header 1</div>
        <div>Header 2</div>
      </DialogHeader>
    );
    expect(container).toBeInTheDocument();
  });

  it('renders dialog with nested content', () => {
    render(
      <Dialog>
        <DialogTrigger>Open Complex Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <div>Complex Dialog</div>
          </DialogHeader>
          <div>
            <p>Paragraph 1</p>
            <p>Paragraph 2</p>
          </div>
          <DialogFooter>
            <button>Close</button>
            <button>Submit</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByText('Open Complex Dialog')).toBeInTheDocument();
  });
});
