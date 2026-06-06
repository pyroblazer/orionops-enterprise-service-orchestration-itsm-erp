'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import apiClient from '@/lib/api';

interface Asset {
  id: string;
  name: string;
  assetTag: string;
  type: string;
  purchaseValue: number;
  purchaseDate: string;
  warrantyExpiry: string;
  depreciationMethod: string;
  usefulLifeYears: number;
  status: string;
  annualDepreciation?: number;
}

interface DepreciationSchedule {
  annualDepreciation: number;
  usefulLifeYears: number;
  schedule?: { year: number; depreciation: number; bookValue: number }[];
}

export default function AssetDetailPage({ params }: { params: { id: string } }) {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [bookValue, setBookValue] = useState<number | null>(null);
  const [depreciationSchedule, setDepreciationSchedule] = useState<DepreciationSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDisposeDialog, setShowDisposeDialog] = useState(false);
  const [disposeReason, setDisposeReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const assetRes = await apiClient.get(`/inventory/assets/${params.id}`);
      const assetData = assetRes.data?.data;
      setAsset(assetData || null);

      if (assetData) {
        try {
          const bvRes = await api.getAssetBookValue(params.id);
          setBookValue(bvRes.data?.data ?? null);
        } catch {
          setBookValue(assetData.bookValue ?? assetData.purchaseValue ?? 0);
        }

        try {
          const depRes = await api.getDepreciationSchedule(params.id);
          setDepreciationSchedule((depRes.data?.data as unknown as DepreciationSchedule) || null);
        } catch {
          setDepreciationSchedule(null);
        }
      }
    } catch (err) {
      console.error('Failed to load asset:', err);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleDispose() {
    if (!disposeReason.trim()) return;
    try {
      setSubmitting(true);
      await api.disposeAsset(params.id, {
        disposalDate: new Date().toISOString().slice(0, 10),
        reason: disposeReason,
      });
      setShowDisposeDialog(false);
      setDisposeReason('');
      await fetchData();
    } catch (err) {
      console.error('Failed to dispose asset:', err);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <Skeleton className="h-[500px]" />;
  }

  if (!asset) {
    return <div className="text-center py-8">Asset not found</div>;
  }

  const annualDep = depreciationSchedule?.annualDepreciation ?? asset.annualDepreciation ?? (asset.purchaseValue / (asset.usefulLifeYears || 1));
  const usefulLife = depreciationSchedule?.usefulLifeYears ?? asset.usefulLifeYears ?? 5;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{asset.name}</h1>
          <p className="text-muted-foreground">{asset.assetTag}</p>
        </div>
        <Badge>{asset.status}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Purchase Price</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${asset.purchaseValue?.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Book Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${bookValue?.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Depreciation Method</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-semibold">{asset.depreciationMethod}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Warranty Expires</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-semibold">{asset.warrantyExpiry}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Depreciation Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Annual depreciation: ${annualDep?.toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Useful life: {usefulLife} years
          </p>
        </CardContent>
      </Card>

      {showDisposeDialog && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle>Dispose Asset</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This action will mark the asset as disposed. This cannot be undone.
            </p>
            <div>
              <label className="text-sm font-medium" htmlFor="dispose-reason">Reason</label>
              <Textarea
                id="dispose-reason"
                placeholder="Enter disposal reason"
                value={disposeReason}
                onChange={(e) => setDisposeReason(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="destructive" onClick={handleDispose} disabled={submitting || !disposeReason.trim()}>
                {submitting ? 'Disposing...' : 'Confirm Disposal'}
              </Button>
              <Button variant="outline" onClick={() => { setShowDisposeDialog(false); setDisposeReason(''); }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!showDisposeDialog && (
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowDisposeDialog(true)}>Dispose Asset</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
