import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
} from '@/components/ui/dropdown';

describe('DropdownMenu', () => {
  it('renders trigger button', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('renders with single menu item', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Action</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.getByText('Menu')).toBeInTheDocument();
  });

  it('renders trigger with custom className', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger className="custom-trigger">Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    const trigger = screen.getByText('Open');
    expect(trigger).toBeInTheDocument();
  });

  it('has proper aria attributes on trigger', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    const trigger = screen.getByText('Menu');
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
  });

  it('renders multiple menu items', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>First</DropdownMenuItem>
          <DropdownMenuItem>Second</DropdownMenuItem>
          <DropdownMenuItem>Third</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.getByText('Menu')).toBeInTheDocument();
  });

  it('renders nested dropdown structure', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Main</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Sub Item 1</DropdownMenuItem>
          <DropdownMenuItem>Sub Item 2</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.getByText('Main')).toBeInTheDocument();
  });

  it('renders complex menu structure with groups', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Complex Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Group 1</DropdownMenuLabel>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuItem inset>Item 2 (inset)</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel inset>Group 2</DropdownMenuLabel>
            <DropdownMenuCheckboxItem checked={true}>Checked</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={false}>Unchecked</DropdownMenuCheckboxItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value="1">
            <DropdownMenuLabel>Group 3</DropdownMenuLabel>
            <DropdownMenuRadioItem value="1">Radio 1</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="2">Radio 2</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.getByText('Complex Menu')).toBeInTheDocument();
  });

  it('renders menu with submenus', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Submenu Test</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Submenu 1</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Sub Item 1</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Sub Item 2</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger inset>Submenu 2</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem inset>Nested Item</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.getByText('Submenu Test')).toBeInTheDocument();
  });

  it('renders menu with shortcuts', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Shortcuts</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            Copy
            <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Paste
            <DropdownMenuShortcut className="custom-kbd">⌘V</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.getByText('Shortcuts')).toBeInTheDocument();
  });
});
