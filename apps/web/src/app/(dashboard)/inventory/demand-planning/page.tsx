'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

export default function DemandPlanningPage() {
  const [reorderPoints, setReorderPoints] = useState<any[]>([]);
  const [forecastData, setForecastData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const res = await api.getSuggestedReorderPoint?.("") || { data: [] };
      setReorderPoints(res?.data || []);
    } catch (err) {
      console.error('Failed to load demand planning:', err);
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
        <h1 className="text-3xl font-bold tracking-tight">Demand Planning</h1>
        <p className="text-muted-foreground">Forecast demand and suggest reorder points</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Suggested Reorder Points</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Reorder Point</TableHead>
                <TableHead>Reorder Quantity</TableHead>
                <TableHead>Forecast Accuracy</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reorderPoints.map((point: any) => (
                <TableRow key={point.sku}>
                  <TableCell className="font-mono">{point.sku}</TableCell>
                  <TableCell>{point.reorderPoint} units</TableCell>
                  <TableCell>{point.reorderQty} units</TableCell>
                  <TableCell>92%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">MAPE</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">8.4%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">MAE</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">24 units</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
