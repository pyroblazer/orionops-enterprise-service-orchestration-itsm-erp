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

export default function ReportingPage() {
  const [days, setDays] = useState<number>(30);

  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'summary', days],
    queryFn: async () => {
      const res = await api.getReportSummary(days);
      return res.data.data;
    },
  });

  const im = data?.incidentMetrics;
  const sm = data?.slaMetrics;

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

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          title="MTTR"
          value={fmt(im?.mttrHours, 'h')}
          sub="Mean time to resolve"
          loading={isLoading}
        />
        <MetricCard
          title="MTTA"
          value={fmt(im?.mttaHours, 'h')}
          sub="Mean time to assign"
          loading={isLoading}
        />
        <MetricCard
          title="SLA Breach Rate"
          value={sm ? `${sm.breachRatePercent.toFixed(1)}%` : '—'}
          sub={`${sm?.breachedCount ?? '…'} of ${sm?.totalInstances ?? '…'} instances`}
          loading={isLoading}
        />
        <MetricCard
          title="Open Incidents"
          value={im ? String(im.openCount) : '—'}
          sub={`${im?.totalCount ?? '…'} total in period`}
          loading={isLoading}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Volume by priority */}
        <Card>
          <CardHeader><CardTitle className="text-base">Incidents by Priority</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton />
            ) : (
              <BarList
                items={data?.volumeByPriority.map((r) => ({ label: r.priority, value: r.count })) ?? []}
              />
            )}
          </CardContent>
        </Card>

        {/* Volume by status */}
        <Card>
          <CardHeader><CardTitle className="text-base">Incidents by Status</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton />
            ) : (
              <BarList
                items={data?.volumeByStatus.map((r) => ({ label: r.status, value: r.count })) ?? []}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily volume table */}
      <Card>
        <CardHeader><CardTitle className="text-base">Daily Incident Volume</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" role="table">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left font-medium">Date</th>
                    <th className="py-2 text-right font-medium">Incidents</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.volumeByDay ?? []).map((row) => (
                    <tr key={row.date} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-2">{row.date}</td>
                      <td className="py-2 text-right tabular-nums">{row.count}</td>
                    </tr>
                  ))}
                  {(data?.volumeByDay ?? []).length === 0 && (
                    <tr>
                      <td colSpan={2} className="py-4 text-center text-muted-foreground">No data</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  title, value, sub, loading,
}: { title: string; value: string; sub: string; loading: boolean }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {loading ? (
          <div className="mt-1 h-8 w-24 animate-pulse rounded bg-muted" />
        ) : (
          <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}

function BarList({ items }: { items: Array<{ label: string; value: number }> }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-3">
          <span className="w-28 truncate text-sm capitalize">{item.label}</span>
          <div className="flex-1 overflow-hidden rounded-full bg-muted h-2">
            <div
              className="h-2 rounded-full bg-foreground"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
          <span className="w-8 text-right text-sm tabular-nums">{item.value}</span>
        </li>
      ))}
      {items.length === 0 && (
        <li className="text-sm text-muted-foreground">No data</li>
      )}
    </ul>
  );
}

function Skeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-6 animate-pulse rounded bg-muted" />
      ))}
    </div>
  );
}
