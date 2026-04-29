'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';

export default function BillingPage() {
  const [tab, setTab] = useState<'usage' | 'records' | 'models'>('usage');

  const { data: usage } = useQuery({
    queryKey: ['billing-usage'],
    queryFn: async () => {
      const res = await api.get('/api/v1/billing/usage');
      return res.data.data;
    },
    enabled: tab === 'usage',
  });

  const { data: records } = useQuery({
    queryKey: ['billing-records'],
    queryFn: async () => {
      const res = await api.get('/api/v1/billing/records');
      return res.data.data;
    },
    enabled: tab === 'records',
  });

  const { data: models } = useQuery({
    queryKey: ['cost-models'],
    queryFn: async () => {
      const res = await api.get('/api/v1/billing/cost-models');
      return res.data.data;
    },
    enabled: tab === 'models',
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Service Billing</h1>
        <div className="flex gap-2">
          <Button variant="outline">Record Usage</Button>
          <Button>Generate Invoice</Button>
        </div>
      </div>

      <div className="flex gap-2" role="tablist" aria-label="Billing sections">
        {(['usage', 'records', 'models'] as const).map((t) => (
          <Button
            key={t}
            variant={tab === t ? 'default' : 'outline'}
            onClick={() => setTab(t)}
            role="tab"
            aria-selected={tab === t}
          >
            {t === 'usage' ? 'Usage Records' : t === 'records' ? 'Billing Records' : 'Cost Models'}
          </Button>
        ))}
      </div>

      {tab === 'usage' && (
        <div className="rounded-lg border">
          <table className="w-full" role="table">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">Service</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Usage Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Quantity</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Unit</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Recorded At</th>
              </tr>
            </thead>
            <tbody>
              {usage?.content?.map((u: any) => (
                <tr key={u.id} className="border-b hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{u.service?.name || '-'}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{u.usageType}</Badge>
                  </td>
                  <td className="px-4 py-3">{u.quantity}</td>
                  <td className="px-4 py-3">{u.unit}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(u.recordedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'records' && (
        <div className="rounded-lg border">
          <table className="w-full" role="table">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Currency</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Period</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {records?.content?.map((r: any) => (
                <tr key={r.id} className="border-b hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">${r.amount?.toFixed(2)}</td>
                  <td className="px-4 py-3">{r.currency}</td>
                  <td className="px-4 py-3 text-sm">
                    {r.billingPeriodStart} — {r.billingPeriodEnd}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        r.status === 'paid' ? 'success' : r.status === 'overdue' ? 'danger' : 'warning'
                      }
                    >
                      {r.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'models' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {models?.content?.map((model: any) => (
            <Card key={model.id}>
              <CardHeader>
                <CardTitle className="text-base">{model.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{model.modelType}</Badge>
                  <Badge variant={model.status === 'active' ? 'success' : 'default'}>
                    {model.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{model.description}</p>
                {model.service && (
                  <p className="text-xs text-muted-foreground">Service: {model.service.name}</p>
                )}
                {model.effectiveFrom && (
                  <p className="text-xs text-muted-foreground">
                    {model.effectiveFrom} — {model.effectiveTo || 'ongoing'}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
