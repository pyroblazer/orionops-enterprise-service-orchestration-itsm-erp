'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useIncidents } from '@/lib/hooks';
import type { FilterParams } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle,
  Download,
  Filter,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import { formatDateTime, getStatusColor, getPriorityColor, cn } from '@/lib/utils';

export default function IncidentsListPage() {
  const [filters, setFilters] = useState<FilterParams>({
    page: 1,
    pageSize: 20,
    sort: 'createdAt',
    sortOrder: 'desc',
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, refetch } = useIncidents(filters);
  const incidents = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const handleFilterChange = useCallback(
    (key: keyof FilterParams, value: string) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value || undefined,
        page: 1,
      }));
    },
    []
  );

  const handleSort = useCallback((column: string) => {
    setFilters((prev) => ({
      ...prev,
      sort: column,
      sortOrder:
        prev.sort === column && prev.sortOrder === 'desc' ? 'asc' : 'desc',
    }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === incidents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(incidents.map((i) => i.id)));
    }
  }, [selectedIds, incidents]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ page: 1, pageSize: 20, sort: 'createdAt', sortOrder: 'desc' });
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Incidents</h1>
          <p className="text-muted-foreground">
            Manage and track all incidents across your organization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            aria-label="Refresh incidents list"
          >
            <RefreshCw className="mr-1 h-4 w-4" aria-hidden="true" />
            Refresh
          </Button>
          <Link href="/incidents/new">
            <Button aria-label="Create new incident">
              <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
              Create Incident
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" aria-hidden="true" />
              Filters
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                aria-expanded={showFilters}
                aria-controls="filter-panel"
              >
                {showFilters ? 'Hide' : 'Show'}
              </Button>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                aria-label="Clear all filters"
              >
                <X className="mr-1 h-3 w-3" aria-hidden="true" />
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent id="filter-panel">
            <div className="grid gap-4 md:grid-cols-4">
              <Input
                placeholder="Search incidents..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                aria-label="Search incidents"
              />
              <Select
                value={filters.status || ''}
                onValueChange={(v) => handleFilterChange('status', v)}
              >
                <SelectTrigger label="Status">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.priority || ''}
                onValueChange={(v) => handleFilterChange('priority', v)}
              >
                <SelectTrigger label="Priority">
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.sort || ''}
                onValueChange={(v) => handleFilterChange('sort', v)}
              >
                <SelectTrigger label="Sort by">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Created Date</SelectItem>
                  <SelectItem value="updatedAt">Updated Date</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div
          className="flex items-center gap-3 rounded-md border bg-muted/50 p-3"
          role="status"
          aria-label={`${selectedIds.size} incidents selected`}
        >
          <span className="text-sm font-medium">
            {selectedIds.size} selected
          </span>
          <Button variant="outline" size="sm">
            <Trash2 className="mr-1 h-3 w-3" aria-hidden="true" />
            Delete
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-1 h-3 w-3" aria-hidden="true" />
            Export
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds(new Set())}
          >
            Clear selection
          </Button>
        </div>
      )}

      {/* Incidents Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={
                        incidents.length > 0 &&
                        selectedIds.size === incidents.length
                      }
                      onChange={toggleSelectAll}
                      aria-label="Select all incidents"
                      className="rounded border-input"
                    />
                  </TableHead>
                  <TableHead
                    sortable
                    sortDirection={
                      filters.sort === 'createdAt'
                        ? (filters.sortOrder as 'asc' | 'desc')
                        : null
                    }
                    onClick={() => handleSort('createdAt')}
                  >
                    ID
                  </TableHead>
                  <TableHead
                    sortable
                    sortDirection={
                      filters.sort === 'title'
                        ? (filters.sortOrder as 'asc' | 'desc')
                        : null
                    }
                    onClick={() => handleSort('title')}
                  >
                    Title
                  </TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.length > 0 ? (
                  incidents.map((incident) => (
                    <TableRow
                      key={incident.id}
                      selected={selectedIds.has(incident.id)}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(incident.id)}
                          onChange={() => toggleSelect(incident.id)}
                          aria-label={`Select incident ${incident.id}`}
                          className="rounded border-input"
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        <Link
                          href={`/incidents/${incident.id}`}
                          className="text-primary hover:underline"
                        >
                          {incident.id.slice(0, 8)}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/incidents/${incident.id}`}
                          className="hover:underline"
                        >
                          {incident.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            'capitalize',
                            getPriorityColor(incident.priority)
                          )}
                        >
                          {incident.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            'capitalize',
                            getStatusColor(incident.status)
                          )}
                        >
                          {incident.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {incident.assignedToName || 'Unassigned'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {incident.serviceName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(incident.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-24 text-center text-muted-foreground"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <AlertTriangle
                          className="h-8 w-8 text-muted-foreground/50"
                          aria-hidden="true"
                        />
                        <p>No incidents found</p>
                        <Link href="/incidents/new">
                          <Button variant="outline" size="sm">
                            Create your first incident
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <Pagination
        currentPage={filters.page || 1}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
