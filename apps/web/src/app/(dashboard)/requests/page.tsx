'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRequests } from '@/lib/hooks';
import type { FilterParams } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Megaphone, Plus, RefreshCw, Search } from 'lucide-react';
import { formatDateTime, getStatusColor, cn } from '@/lib/utils';

const categories = [
  { id: 'hardware', label: 'Hardware', description: 'Laptops, monitors, peripherals' },
  { id: 'software', label: 'Software', description: 'Applications, licenses, tools' },
  { id: 'access', label: 'Access', description: 'Accounts, permissions, VPN' },
  { id: 'support', label: 'Support', description: 'Technical assistance, troubleshooting' },
  { id: 'training', label: 'Training', description: 'Courses, certifications, materials' },
  { id: 'facilities', label: 'Facilities', description: 'Office space, equipment, repairs' },
];

export default function RequestsListPage() {
  const [viewMode, setViewMode] = useState<'catalog' | 'list'>('catalog');
  const [filters, setFilters] = useState<FilterParams>({
    page: 1,
    pageSize: 20,
    sort: 'createdAt',
    sortOrder: 'desc',
  });

  const { data, isLoading, refetch } = useRequests(filters);
  const requests = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Service Requests</h1>
          <p className="text-muted-foreground">Browse the service catalog or track existing requests</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} aria-label="Refresh">
            <RefreshCw className="mr-1 h-4 w-4" /> Refresh
          </Button>
          <Button variant={viewMode === 'catalog' ? 'default' : 'outline'} onClick={() => setViewMode('catalog')}>
            Catalog
          </Button>
          <Button variant={viewMode === 'list' ? 'default' : 'outline'} onClick={() => setViewMode('list')}>
            My Requests
          </Button>
        </div>
      </div>

      {viewMode === 'catalog' ? (
        <>
          <div className="relative max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search the service catalog..." className="pl-8" aria-label="Search catalog" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Card key={category.id} className="cursor-pointer transition-colors hover:border-primary">
                <CardHeader>
                  <CardTitle className="text-base">{category.label}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" className="w-full">
                    <Plus className="mr-1 h-3 w-3" /> Request {category.label}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
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
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested By</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.length > 0 ? (
                      requests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-mono text-xs">
                            <Link href={`/requests/${request.id}`} className="text-primary hover:underline">
                              {request.id.slice(0, 8)}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Link href={`/requests/${request.id}`} className="hover:underline">
                              {request.title}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize">{request.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn('capitalize', getStatusColor(request.status))}>
                              {request.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{request.requestedByName}</TableCell>
                          <TableCell className="text-muted-foreground">{formatDateTime(request.createdAt)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <Megaphone className="h-8 w-8 text-muted-foreground/50" />
                            <p>No requests found</p>
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
      )}
    </div>
  );
}
