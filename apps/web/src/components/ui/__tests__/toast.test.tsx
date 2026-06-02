import React from 'react';
import { render } from '@testing-library/react';
import {
  ToastProvider,
  ToastViewport,
  Toast,
} from '@/components/ui/toast';

describe('Toast', () => {
  it('renders toast provider', () => {
    const { container } = render(
      <ToastProvider>
        <div>Content</div>
      </ToastProvider>
    );
    expect(container).toBeInTheDocument();
  });

  it('renders toast provider with viewport', () => {
    const { container } = render(
      <ToastProvider>
        <ToastViewport />
      </ToastProvider>
    );
    expect(container).toBeInTheDocument();
  });

  it('renders toast with default variant', () => {
    const { container } = render(
      <ToastProvider>
        <Toast variant="default">
          <div>Toast content</div>
        </Toast>
      </ToastProvider>
    );
    expect(container).toBeInTheDocument();
  });

  it('renders toast with destructive variant', () => {
    const { container } = render(
      <ToastProvider>
        <Toast variant="destructive">
          <div>Error toast</div>
        </Toast>
      </ToastProvider>
    );
    expect(container).toBeInTheDocument();
  });

  it('renders toast with success variant', () => {
    const { container } = render(
      <ToastProvider>
        <Toast variant="success">
          <div>Success toast</div>
        </Toast>
      </ToastProvider>
    );
    expect(container).toBeInTheDocument();
  });

  it('renders toast with warning variant', () => {
    const { container } = render(
      <ToastProvider>
        <Toast variant="warning">
          <div>Warning toast</div>
        </Toast>
      </ToastProvider>
    );
    expect(container).toBeInTheDocument();
  });

  it('renders toast with info variant', () => {
    const { container } = render(
      <ToastProvider>
        <Toast variant="info">
          <div>Info toast</div>
        </Toast>
      </ToastProvider>
    );
    expect(container).toBeInTheDocument();
  });

  it('renders toast with custom className', () => {
    const { container } = render(
      <ToastProvider>
        <Toast className="custom-toast">
          <div>Toast</div>
        </Toast>
      </ToastProvider>
    );
    expect(container).toBeInTheDocument();
  });

  it('renders toast viewport with custom className', () => {
    const { container } = render(
      <ToastProvider>
        <ToastViewport className="custom-viewport" />
      </ToastProvider>
    );
    expect(container).toBeInTheDocument();
  });

  it('renders multiple toasts', () => {
    const { container } = render(
      <ToastProvider>
        <Toast variant="default">
          <div>First</div>
        </Toast>
        <Toast variant="destructive">
          <div>Second</div>
        </Toast>
        <Toast variant="success">
          <div>Third</div>
        </Toast>
      </ToastProvider>
    );
    expect(container).toBeInTheDocument();
  });

  it('renders toast with complex structure', () => {
    const { container } = render(
      <ToastProvider>
        <Toast className="custom-class">
          <div>
            <h3>Toast Title</h3>
            <p>Toast description</p>
          </div>
        </Toast>
        <ToastViewport className="viewport-class" />
      </ToastProvider>
    );
    expect(container).toBeInTheDocument();
  });
});
