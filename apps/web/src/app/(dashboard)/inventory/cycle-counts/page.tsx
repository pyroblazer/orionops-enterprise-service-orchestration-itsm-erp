'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

export default function CycleCountsPage() {
  const [counts, setCounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCycleCounts();
  }, []);

  async function fetchCycleCounts() {
    try {
      setLoading(true);
      setCounts([
        { id: 'CC-001', warehouse: 'WH-1', schedule: 'WEEKLY', lastCount: '2026-05-25', variance: 0 },
        { id: 'CC-002', warehouse: 'WH-2', schedule: 'MONTHLY', lastCount: '2026-05-01', variance: 12 }
      ]);
    } catch (err) {
      console.error('Failed to load cycle counts:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <Skeleton className="h-[500px]" />;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cycle Counting</h1>
          <p className="text-muted-foreground">Inventory reconciliation and variance tracking</p>
        </div>
        <Button>Schedule Count</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cycle Count Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Count ID</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Last Count</TableHead>
                <TableHead>Items Variance</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {counts.map((count: any) => (
                <TableRow key={count.id}>
                  <TableCell className="font-mono">{count.id}</TableCell>
                  <TableCell>{count.warehouse}</TableCell>
                  <TableCell>{count.schedule}</TableCell>
                  <TableCell>{count.lastCount}</TableCell>
                  <TableCell>
                    <Badge variant={count.variance > 0 ? 'destructive' : 'default'}>
                      {count.variance} items
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm">Record Count</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
