'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface VendorSpend {
  vendor?: string;
  vendorName?: string;
  amount?: number;
  percentage?: number;
}

interface CategorySpend {
  category?: string;
  amount?: number;
  percentage?: number;
}

export default function SpendAnalysisPage() {
  const { data: concentrationData, isLoading: concentrationLoading } = useQuery({
    queryKey: ['procurement', 'spend', 'concentration'],
    queryFn: () => api.getVendorConcentration(),
  });

  const { data: vendorSpendData, isLoading: vendorSpendLoading } = useQuery({
    queryKey: ['procurement', 'spend', 'by-vendor'],
    queryFn: () => api.getSpendByVendor(),
  });

  const { data: categorySpendData, isLoading: categorySpendLoading } = useQuery({
    queryKey: ['procurement', 'spend', 'by-category'],
    queryFn: () => api.getSpendByCategory(),
  });

  const { data: consolidationData, isLoading: consolidationLoading } = useQuery({
    queryKey: ['procurement', 'spend', 'consolidation'],
    queryFn: () => api.getConsolidationOpportunities(),
  });

  const concentration = (concentrationData?.data as unknown as Record<string, unknown>) || {};
  const vendorSpend: VendorSpend[] = Array.isArray(vendorSpendData?.data) ? (vendorSpendData.data as VendorSpend[]) : [];
  const categorySpend: CategorySpend[] = Array.isArray(categorySpendData?.data) ? (categorySpendData.data as CategorySpend[]) : [];
  const consolidation = (consolidationData?.data as unknown as Record<string, unknown>) || {};

  const isLoading = concentrationLoading || vendorSpendLoading || categorySpendLoading || consolidationLoading;

  if (isLoading) {
    return <Skeleton className="h-[500px]" />;
  }

  const topVendorPercentage = vendorSpend?.[0]?.percentage || 30;
  const categoriesCount = categorySpend?.length || 0;
  const consolidationPotential = consolidation?.potential || 0;

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
            <Badge variant="secondary">{String(concentration.risk) || 'MODERATE'}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Top Vendor Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{topVendorPercentage}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Categories Tracked</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{categoriesCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Consolidation Potential</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${(((consolidationPotential as unknown as number) || 0) / 1000).toFixed(0)}K</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Vendors by Spend</CardTitle>
        </CardHeader>
        <CardContent>
          {vendorSpend.length === 0 ? (
            <p className="text-muted-foreground">No vendor spend data available</p>
          ) : (
            <div className="space-y-2">
              {vendorSpend.map((vendor) => (
                <div key={vendor.vendor || vendor.vendorName} className="space-y-1">
                  <div className="flex justify-between">
                    <span className="font-medium">{vendor.vendorName || vendor.vendor}</span>
                    <span className="text-sm">${(vendor.amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded h-2">
                    <div className="bg-blue-600 h-2 rounded" style={{ width: `${vendor.percentage || 0}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Spend by Category</CardTitle>
        </CardHeader>
        <CardContent>
          {categorySpend.length === 0 ? (
            <p className="text-muted-foreground">No category spend data available</p>
          ) : (
            <div className="space-y-2">
              {categorySpend.map((cat) => (
                <div key={cat.category} className="flex justify-between items-center">
                  <span>{cat.category}</span>
                  <span className="font-semibold">${(cat.amount || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
