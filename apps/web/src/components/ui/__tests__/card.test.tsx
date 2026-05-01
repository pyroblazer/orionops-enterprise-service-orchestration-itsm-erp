import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

describe('Card', () => {
  it('renders Card with children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies default Card classes', () => {
    render(<Card data-testid="card">Test</Card>);
    const card = screen.getByTestId('card');
    expect(card.className).toContain('rounded-lg');
    expect(card.className).toContain('border');
    expect(card.className).toContain('bg-card');
  });

  it('renders as a div', () => {
    render(<Card>Content</Card>);
    expect(screen.getByText('Content').tagName).toBe('DIV');
  });

  it('supports custom className', () => {
    render(<Card className="my-custom-class">Custom</Card>);
    expect(screen.getByText('Custom').className).toContain('my-custom-class');
  });
});

describe('CardHeader', () => {
  it('renders header content', () => {
    render(<CardHeader>Header</CardHeader>);
    expect(screen.getByText('Header')).toBeInTheDocument();
  });

  it('applies padding and flex layout', () => {
    const { container } = render(<CardHeader data-testid="header" />);
    const header = container.querySelector('[data-testid="header"]');
    expect(header?.className).toContain('p-6');
  });
});

describe('CardTitle', () => {
  it('renders as p element', () => {
    render(<CardTitle>Title</CardTitle>);
    const title = screen.getByText('Title');
    expect(title.tagName).toBe('P');
  });

  it('applies font-semibold class', () => {
    render(<CardTitle>Bold</CardTitle>);
    expect(screen.getByText('Bold').className).toContain('font-semibold');
  });
});

describe('CardDescription', () => {
  it('renders description text', () => {
    render(<CardDescription>A description</CardDescription>);
    expect(screen.getByText('A description')).toBeInTheDocument();
  });

  it('applies muted-foreground color', () => {
    render(<CardDescription>Muted</CardDescription>);
    expect(screen.getByText('Muted').className).toContain('text-muted-foreground');
  });
});

describe('CardContent', () => {
  it('renders content', () => {
    render(<CardContent>Body content</CardContent>);
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });
});

describe('CardFooter', () => {
  it('renders footer', () => {
    render(<CardFooter>Footer actions</CardFooter>);
    expect(screen.getByText('Footer actions')).toBeInTheDocument();
  });
});

describe('Card composition', () => {
  it('renders full card composition', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Card</CardTitle>
          <CardDescription>A test description</CardDescription>
        </CardHeader>
        <CardContent>Card body content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    );

    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('A test description')).toBeInTheDocument();
    expect(screen.getByText('Card body content')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });
});
