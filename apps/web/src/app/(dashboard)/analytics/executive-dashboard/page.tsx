'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function ExecutiveDashboardPage() {
  const [kpis, setKpis] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKPIs();
  }, []);

  async function fetchKPIs() {
    try {
      setLoading(true);
      setKpis({
        mttr: 4.2,
        slaCompliance: 94,
        budgetUtilization: 67,
        vendorSpend: 1250000,
        openIncidents: 23,
        changeSuccess: 98,
        inventoryValue: 450000,
        workforceUtilization: 82,
        overdueInvoices: 5,
        activeContracts: 12,
        expiringWarranties: 3,
        complianceViolations: 1
      });
    } catch (err) {
      console.error('Failed to load KPIs:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <Skeleton className="h-[500px]" />;
  }

  const kpiCards = [
    { label: 'MTTR (hours)', value: kpis.mttr },
    { label: 'SLA Compliance', value: `${kpis.slaCompliance}%` },
    { label: 'Budget Utilization', value: `${kpis.budgetUtilization}%` },
    { label: 'Vendor Spend YTD', value: `$${(kpis.vendorSpend / 1000000).toFixed(1)}M` },
    { label: 'Open Incidents', value: kpis.openIncidents },
    { label: 'Change Success Rate', value: `${kpis.changeSuccess}%` },
    { label: 'Inventory Value', value: `$${(kpis.inventoryValue / 1000).toFixed(0)}K` },
    { label: 'Workforce Utilization', value: `${kpis.workforceUtilization}%` },
    { label: 'Overdue Invoices', value: kpis.overdueInvoices },
    { label: 'Active Contracts', value: kpis.activeContracts },
    { label: 'Expiring Warranties', value: kpis.expiringWarranties },
    { label: 'Compliance Violations', value: kpis.complianceViolations }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Executive Dashboard</h1>
        <p className="text-muted-foreground">Key performance indicators and organizational metrics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Health Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Overall Compliance</span>
              <span className="text-sm">99%</span>
            </div>
            <div className="w-full bg-gray-200 rounded h-3">
              <div className="bg-green-600 h-3 rounded" style={{ width: '99%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Budget Tracking</span>
              <span className="text-sm">{kpis.budgetUtilization}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded h-3">
              <div className="bg-blue-600 h-3 rounded" style={{ width: `${kpis.budgetUtilization}%` }}></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
