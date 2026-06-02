'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface Transfer {
  id: string;
  sku: string;
  fromWarehouse: string;
  toWarehouse: string;
  quantity: number;
  status: string;
}

export default function InventoryTransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransfers();
  }, []);

  async function fetchTransfers() {
    try {
      setLoading(true);
      const res = await api.getTransfers();
      const transfersData = res?.data?.data as unknown as Transfer[] | undefined;
      setTransfers(transfersData || []);
    } catch (err) {
      console.error('Failed to load transfers:', err);
      setTransfers([]);
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
          <h1 className="text-3xl font-bold tracking-tight">Inventory Transfers</h1>
          <p className="text-muted-foreground">Track inter-warehouse transfers</p>
        </div>
        <Button>Create Transfer</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{transfers.filter(t => t.status === 'PENDING').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">In Transit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{transfers.filter(t => t.status === 'IN_TRANSIT').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{transfers.filter(t => t.status === 'RECEIVED').length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Transfers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.map((transfer) => (
                <TableRow key={transfer.id}>
                  <TableCell className="font-mono">{transfer.id}</TableCell>
                  <TableCell>{transfer.sku}</TableCell>
                  <TableCell>{transfer.fromWarehouse}</TableCell>
                  <TableCell>{transfer.toWarehouse}</TableCell>
                  <TableCell>{transfer.quantity}</TableCell>
                  <TableCell>
                    <Badge variant={transfer.status === 'PENDING' ? 'outline' : 'secondary'}>{transfer.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {transfer.status === 'PENDING' && <Button size="sm">Transit</Button>}
                    {transfer.status === 'IN_TRANSIT' && <Button size="sm">Receive</Button>}
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
