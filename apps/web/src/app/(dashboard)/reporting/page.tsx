'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';

const DAYS_OPTIONS = [7, 14, 30, 90] as const;

function fmt(val: number | null | undefined, unit: string) {
  if (val === null || val === undefined) return '—';
  return `${val.toFixed(1)} ${unit}`;
}

function MetricCard({ title, value, sub, loading }: any) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{loading ? '...' : value}</div>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}

function Skeleton() {
  return <div className="h-64 bg-slate-100 rounded animate-pulse" />;
}

function SimpleTable({ headers, rows }: any) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            {headers.map((h: string, i: number) => (
              <th key={i} className="text-left py-2 px-2 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row: Record<string, any>, i: number) => (
            <tr key={i} className="border-b hover:bg-slate-50">
              {headers.map((h: string, j: number) => (
                <td key={j} className="py-2 px-2">{row[h] ?? '—'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BarList({ items }: any) {
  const maxValue = Math.max(...items.map((i: any) => i.value), 1);
  return (
    <div className="space-y-2">
      {items.map((item: any, i: number) => (
        <div key={i}>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">{item.label}</span>
            <span className="text-sm font-semibold">{item.value}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded">
            <div
              className="h-full bg-blue-500 rounded"
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ReportingPage() {
  const [days, setDays] = useState<number>(30);
  const [activeTab, setActiveTab] = useState<string>('itsm');

  const itsm = useQuery({
    queryKey: ['reports', 'summary', days],
    queryFn: async () => (await api.getReportSummary(days)).data.data,
  });

  const finance = useQuery({
    queryKey: ['reports', 'finance'],
    queryFn: async () => ({
      budgetVariance: (await api.getBudgetVariance()).data.data,
      invoiceAging: (await api.getInvoiceAging()).data.data,
    }),
  });

  const procurement = useQuery({
    queryKey: ['reports', 'procurement'],
    queryFn: async () => ({
      poAging: (await api.getPOAging()).data.data,
      vendorSpend: (await api.getVendorSpend()).data.data,
    }),
  });

  const inventory = useQuery({
    queryKey: ['reports', 'inventory'],
    queryFn: async () => ({
      valuation: (await api.getInventoryValuation()).data.data,
    }),
  });

  const workforce = useQuery({
    queryKey: ['reports', 'workforce'],
    queryFn: async () => (await api.getWorkforceCapacity()).data.data,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reports &amp; Analytics</h1>
        <div className="flex items-center gap-2">
          <label htmlFor="days-select" className="text-sm font-medium">Period</label>
          <select
            id="days-select"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded-md border px-3 py-1.5 text-sm"
          >
            {DAYS_OPTIONS.map((d) => (
              <option key={d} value={d}>Last {d} days</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {[
          { id: 'itsm', label: 'ITSM' },
          { id: 'finance', label: 'Finance' },
          { id: 'procurement', label: 'Procurement' },
          { id: 'inventory', label: 'Inventory' },
          { id: 'workforce', label: 'Workforce' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium text-sm border-b-2 ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ITSM Tab */}
      {activeTab === 'itsm' && (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <MetricCard
              title="MTTR"
              value={fmt(itsm.data?.incidentMetrics?.mttrHours, 'h')}
              sub="Mean time to resolve"
              loading={itsm.isLoading}
            />
            <MetricCard
              title="MTTA"
              value={fmt(itsm.data?.incidentMetrics?.mttaHours, 'h')}
              sub="Mean time to assign"
              loading={itsm.isLoading}
            />
            <MetricCard
              title="SLA Breach Rate"
              value={itsm.data?.slaMetrics ? `${itsm.data.slaMetrics.breachRatePercent.toFixed(1)}%` : '—'}
              sub={`${itsm.data?.slaMetrics?.breachedCount ?? '…'} of ${itsm.data?.slaMetrics?.totalInstances ?? '…'} instances`}
              loading={itsm.isLoading}
            />
            <MetricCard
              title="Open Incidents"
              value={itsm.data?.incidentMetrics ? String(itsm.data.incidentMetrics.openCount) : '—'}
              sub={`${itsm.data?.incidentMetrics?.totalCount ?? '…'} total in period`}
              loading={itsm.isLoading}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Incidents by Priority</CardTitle></CardHeader>
              <CardContent>
                {itsm.isLoading ? (
                  <Skeleton />
                ) : (
                  <BarList
                    items={itsm.data?.volumeByPriority.map((r: any) => ({ label: r.priority, value: r.cnt })) ?? []}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Incidents by Status</CardTitle></CardHeader>
              <CardContent>
                {itsm.isLoading ? (
                  <Skeleton />
                ) : (
                  <BarList
                    items={itsm.data?.volumeByStatus.map((r: any) => ({ label: r.status, value: r.cnt })) ?? []}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Finance Tab */}
      {activeTab === 'finance' && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Budget Variance</CardTitle></CardHeader>
            <CardContent>
              {finance.isLoading ? (
                <Skeleton />
              ) : (
                <SimpleTable
                  headers={['name', 'budget_amount', 'spent', 'variance', 'variance_pct']}
                  rows={finance.data?.budgetVariance ?? []}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Invoice Aging</CardTitle></CardHeader>
            <CardContent>
              {finance.isLoading ? (
                <Skeleton />
              ) : (
                <BarList
                  items={(finance.data?.invoiceAging ?? []).map((r: any) => ({
                    label: r.aging_bucket,
                    value: r.count,
                  }))}
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Procurement Tab */}
      {activeTab === 'procurement' && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>PO Aging</CardTitle></CardHeader>
            <CardContent>
              {procurement.isLoading ? (
                <Skeleton />
              ) : (
                <SimpleTable
                  headers={['status', 'age_bucket', 'count']}
                  rows={procurement.data?.poAging ?? []}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Top Vendors by Spend</CardTitle></CardHeader>
            <CardContent>
              {procurement.isLoading ? (
                <Skeleton />
              ) : (
                <BarList
                  items={(procurement.data?.vendorSpend ?? []).slice(0, 10).map((r: any) => ({
                    label: r.name,
                    value: parseFloat(r.ytd_spend ?? 0),
                  }))}
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <Card>
          <CardHeader><CardTitle>Inventory Valuation by Warehouse</CardTitle></CardHeader>
          <CardContent>
            {inventory.isLoading ? (
              <Skeleton />
            ) : (
              <BarList
                items={(inventory.data?.valuation ?? []).map((r: any) => ({
                  label: `Warehouse ${r.warehouse_id}`,
                  value: parseFloat(r.total_value ?? 0),
                }))}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Workforce Tab */}
      {activeTab === 'workforce' && (
        <Card>
          <CardHeader><CardTitle>Team Capacity Utilization</CardTitle></CardHeader>
          <CardContent>
            {workforce.isLoading ? (
              <Skeleton />
            ) : (
              <SimpleTable
                headers={['team_name', 'allocated_hours', 'available_hours', 'utilization_pct']}
                rows={workforce.data ?? []}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
