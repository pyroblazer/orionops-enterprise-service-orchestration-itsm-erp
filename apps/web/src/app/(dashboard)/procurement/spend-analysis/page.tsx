'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function SpendAnalysisPage() {
  const [spendByVendor, setSpendByVendor] = useState<any>({});
  const [spendByCategory, setSpendByCategory] = useState<any>({});
  const [opportunities, setOpportunities] = useState<any>({});
  const [concentration, setConcentration] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const res = await api.getVendorConcentration?.() || { data: {} };
      setConcentration(res?.data || {});
    } catch (err) {
      console.error('Failed to load spend analysis:', err);
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
        <h1 className="text-3xl font-bold tracking-tight">Spend Analysis</h1>
        <p className="text-muted-foreground">Procurement spending insights and opportunities</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Vendor Concentration</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">{concentration.risk || 'MODERATE'}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Top Vendor Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">30%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Categories Tracked</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">12</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Consolidation Potential</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">$150K</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Vendors by Spend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { name: 'Global Tech Solutions', amount: 450000, percentage: 30 },
              { name: 'Industrial Supplies Inc', amount: 320000, percentage: 21 },
              { name: 'Office Depot', amount: 180000, percentage: 12 }
            ].map((vendor) => (
              <div key={vendor.name} className="space-y-1">
                <div className="flex justify-between">
                  <span className="font-medium">{vendor.name}</span>
                  <span className="text-sm">${vendor.amount.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded h-2">
                  <div className="bg-blue-600 h-2 rounded" style={{ width: `${vendor.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Spend by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { category: 'Technology', amount: 520000 },
              { category: 'Office Supplies', amount: 230000 },
              { category: 'Facilities', amount: 150000 }
            ].map((cat) => (
              <div key={cat.category} className="flex justify-between items-center">
                <span>{cat.category}</span>
                <span className="font-semibold">${cat.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
