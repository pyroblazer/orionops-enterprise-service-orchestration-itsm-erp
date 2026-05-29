'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

export default function ThreeWayMatchingPage() {
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExceptions();
  }, []);

  async function fetchExceptions() {
    try {
      setLoading(true);
      // Mock data
      setExceptions([
        {
          id: 'EXC-001',
          invoiceId: 'INV-1001',
          variance: 250,
          reason: 'QUANTITY_VARIANCE',
          status: 'PENDING'
        }
      ]);
    } catch (err) {
      console.error('Failed to load exceptions:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <Skeleton className="h-[500px]" />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Three-Way Matching</h1>
        <p className="text-muted-foreground">Exceptions and variance resolution</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Open Exceptions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{exceptions.filter(e => e.status === 'PENDING').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Variance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${exceptions.reduce((sum, e) => sum + (e.variance || 0), 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Resolution Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {exceptions.length === 0 ? '0' : Math.round((exceptions.filter(e => e.status !== 'PENDING').length / exceptions.length) * 100)}%
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Matching Exceptions</CardTitle>
        </CardHeader>
        <CardContent>
          {exceptions.length === 0 ? (
            <p className="text-muted-foreground">No exceptions found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Variance</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exceptions.map((exc: any) => (
                  <TableRow key={exc.id}>
                    <TableCell className="font-mono">{exc.invoiceId}</TableCell>
                    <TableCell className="text-red-600">${exc.variance?.toLocaleString()}</TableCell>
                    <TableCell>{exc.reason}</TableCell>
                    <TableCell>
                      <Badge variant={exc.status === 'PENDING' ? 'destructive' : 'default'}>{exc.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {exc.status === 'PENDING' && <Button size="sm">Resolve</Button>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
