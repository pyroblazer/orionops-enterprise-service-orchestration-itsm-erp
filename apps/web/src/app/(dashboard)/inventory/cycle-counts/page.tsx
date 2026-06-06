'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import apiClient from '@/lib/api';

interface CycleCount {
  id: string;
  warehouse: string;
  scheduleDate: string;
  lastCountDate: string;
  itemsVariance: number;
}

export default function CycleCountsPage() {
  const [counts, setCounts] = useState<CycleCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [warehouseId, setWarehouseId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [recordingCountId, setRecordingCountId] = useState<string | null>(null);
  const [actualQty, setActualQty] = useState('');
  const [countNotes, setCountNotes] = useState('');

  const fetchCycleCounts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/inventory/cycle-counts');
      setCounts(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load cycle counts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCycleCounts();
  }, [fetchCycleCounts]);

  async function handleScheduleCount() {
    if (!warehouseId.trim()) return;
    try {
      setSubmitting(true);
      await api.scheduleCycleCounts({ warehouseId });
      setShowScheduleDialog(false);
      setWarehouseId('');
      await fetchCycleCounts();
    } catch (err) {
      console.error('Failed to schedule count:', err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRecordCount() {
    if (!recordingCountId || !actualQty) return;
    try {
      setSubmitting(true);
      await api.recordCycleCount(recordingCountId, {
        countedQuantity: parseFloat(actualQty),
        notes: countNotes,
      });
      setRecordingCountId(null);
      setActualQty('');
      setCountNotes('');
      await fetchCycleCounts();
    } catch (err) {
      console.error('Failed to record count:', err);
    } finally {
      setSubmitting(false);
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
        <Button onClick={() => setShowScheduleDialog(true)}>Schedule Count</Button>
      </div>

      {showScheduleDialog && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle>Schedule New Count</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium" htmlFor="warehouse-id">Warehouse ID</label>
              <Input
                id="warehouse-id"
                placeholder="e.g. WH-001"
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleScheduleCount} disabled={submitting || !warehouseId.trim()}>
                {submitting ? 'Scheduling...' : 'Submit'}
              </Button>
              <Button variant="outline" onClick={() => { setShowScheduleDialog(false); setWarehouseId(''); }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {recordingCountId && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle>Record Count — {recordingCountId}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium" htmlFor="actual-qty">Actual Quantity</label>
              <Input
                id="actual-qty"
                type="number"
                placeholder="Enter counted quantity"
                value={actualQty}
                onChange={(e) => setActualQty(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="count-notes">Notes</label>
              <Input
                id="count-notes"
                placeholder="Optional notes"
                value={countNotes}
                onChange={(e) => setCountNotes(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleRecordCount} disabled={submitting || !actualQty}>
                {submitting ? 'Recording...' : 'Submit'}
              </Button>
              <Button variant="outline" onClick={() => { setRecordingCountId(null); setActualQty(''); setCountNotes(''); }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
              {counts.map((count) => (
                <TableRow key={count.id}>
                  <TableCell className="font-mono">{count.id}</TableCell>
                  <TableCell>{count.warehouse}</TableCell>
                  <TableCell>{count.scheduleDate}</TableCell>
                  <TableCell>{count.lastCountDate}</TableCell>
                  <TableCell>
                    <Badge variant={count.itemsVariance > 0 ? 'destructive' : 'default'}>
                      {count.itemsVariance} items
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" onClick={() => { setRecordingCountId(count.id); setActualQty(''); setCountNotes(''); }}>
                      Record Count
                    </Button>
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
