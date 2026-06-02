'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface Lot {
  id: string;
  sku: string;
  lotNumber: string;
  quantity: number;
  expiryDate: string;
}

interface ExpiringLot {
  id: string;
  sku: string;
  daysRemaining: number;
}

export default function LotTrackingPage() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [expiringLots, setExpiringLots] = useState<ExpiringLot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLots();
  }, []);

  async function fetchLots() {
    try {
      setLoading(true);
      const [lotsRes, expiringRes] = await Promise.all([
        api.getLots(),
        api.getExpiringLots(),
      ]);
      setLots(lotsRes?.data?.data || []);
      setExpiringLots(expiringRes?.data?.data || []);
    } catch (err) {
      console.error('Failed to load lots:', err);
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
          <h1 className="text-3xl font-bold tracking-tight">Lot Tracking</h1>
          <p className="text-muted-foreground">Manage inventory lots and expiry dates</p>
        </div>
        <Button>Receive Lot</Button>
      </div>

      {expiringLots.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-900">Expiring Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiringLots.map((lot) => (
                <div key={lot.id} className="flex items-center justify-between rounded bg-white p-3">
                  <div>
                    <p className="font-medium">{lot.sku}</p>
                    <p className="text-sm text-muted-foreground">{lot.daysRemaining} days remaining</p>
                  </div>
                  <Button size="sm">Quarantine</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Active Lots</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Lot Number</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lots.map((lot) => (
                <TableRow key={lot.id}>
                  <TableCell>{lot.sku}</TableCell>
                  <TableCell className="font-mono">{lot.lotNumber}</TableCell>
                  <TableCell>{lot.quantity}</TableCell>
                  <TableCell>{lot.expiryDate}</TableCell>
                  <TableCell>
                    <Badge variant="default">Active</Badge>
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
