'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function AssetDetailPage({ params }: { params: { id: string } }) {
  const [asset, setAsset] = useState<any>(null);
  const [bookValue, setBookValue] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  async function fetchData() {
    try {
      setLoading(true);
      setAsset({
        id: params.id,
        name: 'Server A1',
        tag: 'ASSET-001',
        type: 'HARDWARE',
        purchasePrice: 5000,
        purchaseDate: '2024-01-15',
        warrantyExpiry: '2026-01-15',
        depreciation: 'STRAIGHT_LINE',
        usefulLife: 5,
        status: 'ACTIVE'
      });
      setBookValue({ value: 4000, asOf: '2026-05-29' });
    } catch (err) {
      console.error('Failed to load asset:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <Skeleton className="h-[500px]" />;
  }

  if (!asset) {
    return <div className="text-center py-8">Asset not found</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{asset.name}</h1>
          <p className="text-muted-foreground">{asset.tag}</p>
        </div>
        <Badge>{asset.status}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Purchase Price</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${asset.purchasePrice?.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Book Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${bookValue?.value?.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Depreciation Method</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-semibold">{asset.depreciation}</p>
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
            Annual depreciation: ${(asset.purchasePrice / asset.usefulLife).toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Useful life: {asset.usefulLife} years
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <Button>Dispose Asset</Button>
        </CardContent>
      </Card>
    </div>
  );
}
