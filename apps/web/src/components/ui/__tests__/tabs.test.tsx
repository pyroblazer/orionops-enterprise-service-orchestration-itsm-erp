import React from 'react';
import { render, screen } from '@testing-library/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

describe('Tabs', () => {
  it('renders tabs structure', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
  });

  it('renders tabs with custom value', () => {
    render(
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>
        <TabsContent value="active">Active Content</TabsContent>
        <TabsContent value="inactive">Inactive Content</TabsContent>
      </Tabs>
    );
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders multiple tab triggers', () => {
    render(
      <Tabs defaultValue="first">
        <TabsList>
          <TabsTrigger value="first">Tab1</TabsTrigger>
          <TabsTrigger value="second">Tab2</TabsTrigger>
          <TabsTrigger value="third">Tab3</TabsTrigger>
        </TabsList>
        <TabsContent value="first">Content1</TabsContent>
        <TabsContent value="second">Content2</TabsContent>
        <TabsContent value="third">Content3</TabsContent>
      </Tabs>
    );
    expect(screen.getByText('Tab1')).toBeInTheDocument();
    expect(screen.getByText('Tab2')).toBeInTheDocument();
    expect(screen.getByText('Tab3')).toBeInTheDocument();
  });

  it('renders with orientation', () => {
    const { container } = render(
      <Tabs defaultValue="tab1" orientation="vertical">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content</TabsContent>
      </Tabs>
    );
    expect(container).toBeTruthy();
  });

  it('renders default tab content', () => {
    render(
      <Tabs defaultValue="default">
        <TabsList>
          <TabsTrigger value="default">Default</TabsTrigger>
        </TabsList>
        <TabsContent value="default">Default Content</TabsContent>
      </Tabs>
    );
    expect(screen.getByText('Default Content')).toBeInTheDocument();
  });
});
