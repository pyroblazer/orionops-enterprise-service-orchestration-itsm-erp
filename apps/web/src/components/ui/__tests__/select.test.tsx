import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';

describe('Select', () => {
  it('renders select trigger with label', () => {
    render(
      <Select>
        <SelectTrigger label="Choose option">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Item 1</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByText('Choose option')).toBeInTheDocument();
  });

  it('renders trigger with placeholder text', () => {
    const { container } = render(
      <Select>
        <SelectTrigger label="Select">
          <SelectValue placeholder="Select option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Item</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(container.querySelector('[role="combobox"]')).toBeInTheDocument();
  });

  it('renders trigger with aria-label from label prop', () => {
    const { container } = render(
      <Select>
        <SelectTrigger label="Select Option">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Item</SelectItem>
        </SelectContent>
      </Select>
    );
    const trigger = container.querySelector('[role="combobox"]');
    expect(trigger).toHaveAttribute('aria-label', 'Select Option');
  });

  it('renders trigger with custom className', () => {
    const { container } = render(
      <Select>
        <SelectTrigger className="custom-trigger">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Item</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(container.querySelector('.custom-trigger')).toBeInTheDocument();
  });

  it('renders select with single item', () => {
    const { container } = render(
      <Select>
        <SelectTrigger label="Pick">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Single Item</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(container).toBeInTheDocument();
  });

  it('renders select with multiple items', () => {
    const { container } = render(
      <Select>
        <SelectTrigger label="Options">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option 1</SelectItem>
          <SelectItem value="2">Option 2</SelectItem>
          <SelectItem value="3">Option 3</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(container).toBeInTheDocument();
  });

  it('renders select with groups', () => {
    const { container } = render(
      <Select>
        <SelectTrigger label="Grouped">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Group 1</SelectLabel>
            <SelectItem value="1">Item 1</SelectItem>
            <SelectItem value="2">Item 2</SelectItem>
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>Group 2</SelectLabel>
            <SelectItem value="3">Item 3</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );
    expect(container).toBeInTheDocument();
  });

  it('renders select with default value', () => {
    const { container } = render(
      <Select defaultValue="2">
        <SelectTrigger label="Select">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option 1</SelectItem>
          <SelectItem value="2">Option 2</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(container).toBeInTheDocument();
  });

  it('renders select without label prop', () => {
    const { container } = render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="No label" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Item</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(container.querySelector('[role="combobox"]')).toBeInTheDocument();
  });

  it('renders select with complex structure', () => {
    const { container } = render(
      <Select defaultValue="a1">
        <SelectTrigger label="Complex Select" className="custom">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="custom-content">
          <SelectGroup>
            <SelectLabel>Category A</SelectLabel>
            <SelectItem value="a1">A Item 1</SelectItem>
            <SelectItem value="a2">A Item 2</SelectItem>
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>Category B</SelectLabel>
            <SelectItem value="b1">B Item 1</SelectItem>
            <SelectItem value="b2">B Item 2</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );
    expect(container.querySelector('.custom')).toBeInTheDocument();
  });
});
