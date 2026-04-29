'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useChanges } from '@/lib/hooks';
import type { FilterParams } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  GitBranch,
  Plus,
  RefreshCw,
  Calendar,
  List,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { formatDateTime, getStatusColor, getPriorityColor, cn } from '@/lib/utils';

export default function ChangesListPage() {
  const [filters, setFilters] = useState<FilterParams>({
    page: 1,
    pageSize: 20,
    sort: 'createdAt',
    sortOrder: 'desc',
  });
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  const { data, isLoading, refetch } = useChanges(filters);
  const changes = data?.data ?? [];
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

  const pendingApprovals = changes.filter((c) => c.approvalStatus === 'pending');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Change Management</h1>
          <p className="text-muted-foreground">
            Manage changes through the approval and implementation lifecycle
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} aria-label="Refresh changes">
            <RefreshCw className="mr-1 h-4 w-4" /> Refresh
          </Button>
          <Button aria-label="Create new change">
            <Plus className="mr-1 h-4 w-4" /> Create Change
          </Button>
        </div>
      </div>

      {/* Approval Board Summary */}
      {pendingApprovals.length > 0 && (
        <Card className="border-warning">
          <CardContent className="flex items-center gap-4 pt-6">
            <Clock className="h-5 w-5 text-warning" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium">
                {pendingApprovals.length} change{pendingApprovals.length !== 1 ? 's' : ''} awaiting approval
              </p>
              <p className="text-xs text-muted-foreground">Review and approve pending changes</p>
            </div>
            <Button variant="outline" size="sm" className="ml-auto">
              Review Changes
            </Button>
          </CardContent>
        </Card>
      )}

      {/* View Toggle & Filters */}
      <div className="flex items-center gap-4">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'calendar')}>
          <TabsList>
            <TabsTrigger value="list" aria-label="List view">
              <List className="mr-1 h-4 w-4" /> List
            </TabsTrigger>
            <TabsTrigger value="calendar" aria-label="Calendar view">
              <Calendar className="mr-1 h-4 w-4" /> Calendar
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex-1">
          <Input
            placeholder="Search changes..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            aria-label="Search changes"
          />
        </div>
        <Select value={filters.status || ''} onValueChange={(v) => handleFilterChange('status', v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="implementing">Implementing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.priority || ''} onValueChange={(v) => handleFilterChange('priority', v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All types</SelectItem>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="emergency">Emergency</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {viewMode === 'list' ? (
        <>
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
                      <TableHead>Type</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Approval</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Requester</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {changes.length > 0 ? (
                      changes.map((change) => (
                        <TableRow key={change.id}>
                          <TableCell className="font-mono text-xs">
                            <Link href={`/changes/${change.id}`} className="text-primary hover:underline">
                              {change.id.slice(0, 8)}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Link href={`/changes/${change.id}`} className="hover:underline">
                              {change.title}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">{change.type}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn('capitalize', getPriorityColor(change.risk))}>
                              {change.risk}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn('capitalize', getStatusColor(change.status))}>
                              {change.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {change.approvalStatus === 'approved' ? (
                              <CheckCircle className="h-4 w-4 text-success" aria-label="Approved" />
                            ) : change.approvalStatus === 'rejected' ? (
                              <XCircle className="h-4 w-4 text-danger" aria-label="Rejected" />
                            ) : (
                              <Clock className="h-4 w-4 text-warning" aria-label="Pending approval" />
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {formatDateTime(change.plannedStart)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {change.requestedByName}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <GitBranch className="h-8 w-8 text-muted-foreground/50" />
                            <p>No changes found</p>
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
        </>
      ) : (
        /* Calendar View Placeholder */
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Calendar view coming soon</p>
              <p className="text-xs text-muted-foreground">Changes will be displayed on a timeline</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
