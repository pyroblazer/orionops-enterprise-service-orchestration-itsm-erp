'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';

export default function AuditPage() {
  const [entityType, setEntityType] = useState('');
  const [userId, _setUserId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['audit', { entityType, userId, fromDate, toDate, page }],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), size: '50' });
      if (entityType) params.set('entityType', entityType);
      if (userId) params.set('userId', userId);
      if (fromDate) params.set('fromDate', fromDate);
      if (toDate) params.set('toDate', toDate);
      const res = await api.getAuditLogs(Object.fromEntries(params));
      return res.data.data;
    },
  });

  const entityTypes = [
    'Incident', 'Problem', 'ChangeRequest', 'ServiceRequest',
    'ConfigurationItem', 'SLAInstance', 'KnowledgeArticle',
    'Budget', 'PurchaseRequest', 'Vendor', 'Employee',
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Audit Log Explorer</h1>
        <Button variant="outline">Export CSV</Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="space-y-1">
              <label htmlFor="entity-type-filter" className="text-sm font-medium">Entity Type</label>
              <select
                id="entity-type-filter"
                value={entityType}
                onChange={(e) => { setEntityType(e.target.value); setPage(0); }}
                className="rounded-md border px-3 py-2"
                aria-label="Filter by entity type"
              >
                <option value="">All Types</option>
                {entityTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="from-date" className="text-sm font-medium">From Date</label>
              <Input
                id="from-date"
                type="date"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setPage(0); }}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="to-date" className="text-sm font-medium">To Date</label>
              <Input
                id="to-date"
                type="date"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setPage(0); }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="animate-pulse"><CardContent className="h-12" /></Card>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full" role="table">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">Timestamp</th>
                <th className="px-4 py-3 text-left text-sm font-medium">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Action</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Resource</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Resource ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((event: any) => (
                <tr key={event.id} className="border-b hover:bg-muted/30">
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    {new Date(event.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm">{event.userName || event.userId?.slice(0, 8) || '-'}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        event.action?.startsWith('DELETE') ? 'danger'
                        : event.action?.startsWith('CREATE') ? 'success'
                        : event.action?.startsWith('UPDATE') ? 'info'
                        : 'default'
                      }
                    >
                      {event.action}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm">{event.resourceType}</td>
                  <td className="px-4 py-3 text-sm font-mono text-xs">
                    {event.resourceId?.slice(0, 8)}...
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{event.ipAddress || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {data.length} events
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
