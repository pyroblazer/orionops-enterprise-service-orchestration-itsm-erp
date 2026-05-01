import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from '@/components/ui/table';

describe('Table', () => {
  const renderBasicTable = () =>
    render(
      <Table>
        <TableCaption>Test table</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Incident 1</TableCell>
            <TableCell>Open</TableCell>
            <TableCell>High</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Incident 2</TableCell>
            <TableCell>Closed</TableCell>
            <TableCell>Low</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>Total: 2</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );

  it('renders headers', () => {
    renderBasicTable();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Priority')).toBeInTheDocument();
  });

  it('renders rows', () => {
    renderBasicTable();
    expect(screen.getByText('Incident 1')).toBeInTheDocument();
    expect(screen.getByText('Incident 2')).toBeInTheDocument();
  });

  it('renders footer', () => {
    renderBasicTable();
    expect(screen.getByText('Total: 2')).toBeInTheDocument();
  });

  it('renders caption', () => {
    renderBasicTable();
    expect(screen.getByText('Test table')).toBeInTheDocument();
  });
});

describe('Table accessibility', () => {
  it('table has role="table"', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('thead has role="rowgroup"', () => {
    const { container } = render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Col</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    );
    expect(container.querySelector('[role="rowgroup"]')).toBeInTheDocument();
  });

  it('TableHead has role="columnheader"', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Column A</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    );
    expect(screen.getByRole('columnheader', { name: 'Column A' })).toBeInTheDocument();
  });

  it('TableCell has role="gridcell"', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Data</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByRole('gridcell', { name: 'Data' })).toBeInTheDocument();
  });
});

describe('TableHead sortable', () => {
  it('shows ascending sort indicator', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead sortable sortDirection="asc">
              Name
            </TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    );
    const header = screen.getByRole('columnheader', { name: /Name/ });
    expect(header).toHaveAttribute('aria-sort', 'ascending');
  });

  it('shows descending sort indicator', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead sortable sortDirection="desc">
              Name
            </TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    );
    const header = screen.getByRole('columnheader', { name: /Name/ });
    expect(header).toHaveAttribute('aria-sort', 'descending');
  });

  it('does not set aria-sort when no direction', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead sortable>Name</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    );
    expect(screen.getByRole('columnheader')).not.toHaveAttribute('aria-sort');
  });

  it('applies cursor-pointer class when sortable', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead sortable>Sortable</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    );
    expect(screen.getByRole('columnheader').className).toContain('cursor-pointer');
  });
});

describe('TableRow selection', () => {
  it('applies selected styles when selected prop is true', () => {
    render(
      <Table>
        <TableBody>
          <TableRow selected data-testid="selected-row">
            <TableCell>Selected</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    const row = screen.getByTestId('selected-row');
    expect(row).toHaveAttribute('aria-selected', 'true');
    expect(row.className).toContain('bg-muted');
  });

  it('does not apply selected styles when selected is false', () => {
    render(
      <Table>
        <TableBody>
          <TableRow data-testid="unselected-row">
            <TableCell>Not selected</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    const row = screen.getByTestId('unselected-row');
    expect(row).toHaveAttribute('aria-selected', 'false');
  });
});
