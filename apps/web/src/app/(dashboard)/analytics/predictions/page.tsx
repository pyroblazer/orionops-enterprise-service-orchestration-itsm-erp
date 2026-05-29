'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

export default function PredictiveAnalyticsPage() {
  const [cashFlow, setCashFlow] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      setCashFlow({
        months: ['Jun', 'Jul', 'Aug', 'Sep'],
        values: [250000, 280000, 320000, 290000]
      });
      setAnomalies([
        { id: 'ANOM-001', vendor: 'Vendor A', amount: 50000, reason: 'Unusual purchase pattern' }
      ]);
    } catch (err) {
      console.error('Failed to load predictions:', err);
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
        <h1 className="text-3xl font-bold tracking-tight">Predictive Analytics</h1>
        <p className="text-muted-foreground">Forecasts and anomaly detection</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {cashFlow?.months.map((month: string, index: number) => (
              <div key={month} className="space-y-1">
                <div className="flex justify-between">
                  <span className="font-medium">{month}</span>
                  <span className="text-sm">${cashFlow?.values[index]?.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded h-2">
                  <div className="bg-blue-600 h-2 rounded" style={{ width: `${(cashFlow?.values[index] / 400000) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Anomalous Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {anomalies.length === 0 ? (
            <p className="text-muted-foreground">No anomalies detected</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Risk Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {anomalies.map((anom: any) => (
                  <TableRow key={anom.id}>
                    <TableCell>{anom.vendor}</TableCell>
                    <TableCell>${anom.amount?.toLocaleString()}</TableCell>
                    <TableCell>{anom.reason}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">HIGH</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vendor Risk Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded border p-3">
              <span className="font-medium">Global Tech Solutions</span>
              <Badge variant="outline">LOW RISK</Badge>
            </div>
            <div className="flex items-center justify-between rounded border p-3">
              <span className="font-medium">Industrial Supplies Inc</span>
              <Badge variant="secondary">MODERATE RISK</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
