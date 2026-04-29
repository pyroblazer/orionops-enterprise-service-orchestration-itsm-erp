'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useProblems } from '@/lib/hooks';
import type { FilterParams } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
import { FlaskConical, Plus, RefreshCw, Filter, X } from 'lucide-react';
import { formatDateTime, getStatusColor, getPriorityColor, cn } from '@/lib/utils';

export default function ProblemsListPage() {
  const [filters, setFilters] = useState<FilterParams>({
    page: 1,
    pageSize: 20,
    sort: 'createdAt',
    sortOrder: 'desc',
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, refetch } = useProblems(filters);
  const problems = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const handleFilterChange = useCallback(
    (key: keyof FilterParams, value: string) => {
      setFilters((prev) => ({ ...prev, [key]: value || undefined, page: 1 }));
    },
    []
  );

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ page: 1, pageSize: 20, sort: 'createdAt', sortOrder: 'desc' });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Problems</h1>
          <p className="text-muted-foreground">
            Identify and resolve root causes of recurring incidents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} aria-label="Refresh problems list">
            <RefreshCw className="mr-1 h-4 w-4" aria-hidden="true" />
            Refresh
          </Button>
          <Button aria-label="Create new problem">
            <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
            Create Problem
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center gap-2 text-sm font-medium">
              <Filter className="h-4 w-4" aria-hidden="true" />
              Filters
              <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)}>
                {showFilters ? 'Hide' : 'Show'}
              </Button>
            </h2>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-1 h-3 w-3" /> Clear
            </Button>
          </div>
          {showFilters && (
            <div className="grid gap-4 md:grid-cols-3">
              <Input
                placeholder="Search problems..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                aria-label="Search problems"
              />
              <Select value={filters.status || ''} onValueChange={(v) => handleFilterChange('status', v)}>
                <SelectTrigger label="Status">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="under_investigation">Under Investigation</SelectItem>
                  <SelectItem value="known_error">Known Error</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.priority || ''} onValueChange={(v) => handleFilterChange('priority', v)}>
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Linked Incidents</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {problems.length > 0 ? (
                  problems.map((problem) => (
                    <TableRow key={problem.id}>
                      <TableCell className="font-mono text-xs">
                        <Link href={`/problems/${problem.id}`} className="text-primary hover:underline">
                          {problem.id.slice(0, 8)}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link href={`/problems/${problem.id}`} className="hover:underline">
                          {problem.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('capitalize', getPriorityColor(problem.priority))}>
                          {problem.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('capitalize', getStatusColor(problem.status))}>
                          {problem.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {problem.assignedToName || 'Unassigned'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {problem.linkedIncidents?.length ?? 0}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(problem.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <FlaskConical className="h-8 w-8 text-muted-foreground/50" />
                        <p>No problems found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Pagination currentPage={filters.page || 1} totalPages={totalPages} onPageChange={handlePageChange} />
    </div>
  );
}
