'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export default function RFQManagementPage() {
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchRFQs();
  }, []);

  async function fetchRFQs() {
    try {
      setLoading(true);
      const res = await api.getRFQs?.();
      const res = await api.getRFQs?.() || { data: [] }; setRfqs(res?.data || []);;
    } catch (err) {
      console.error('Failed to load RFQs:', err);
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'default';
      case 'SENT': return 'secondary';
      case 'AWARDED': return 'default';
      default: return 'outline';
    }
  };

  if (loading) {
    return <Skeleton className="h-[500px]" />;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">RFQ Management</h1>
          <p className="text-muted-foreground">Create and manage requests for quotation</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : 'Create RFQ'}
        </Button>
      </div>

      {showCreateForm && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>New RFQ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="RFQ Title"
                className="w-full rounded border px-3 py-2"
              />
              <textarea
                placeholder="Description"
                className="w-full rounded border px-3 py-2"
                rows={4}
              />
              <Button className="w-full">Create RFQ</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent RFQs</CardTitle>
        </CardHeader>
        <CardContent>
          {rfqs.length === 0 ? (
            <p className="text-muted-foreground">No RFQs yet. Create one to get started.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Vendors</TableHead>
                  <TableHead>Responses</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rfqs.map((rfq: any) => (
                  <TableRow key={rfq.id}>
                    <TableCell className="font-medium">{rfq.title}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(rfq.status)}>
                        {rfq.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{rfq.vendorCount || 0}</TableCell>
                    <TableCell>{rfq.responseCount || 0}</TableCell>
                    <TableCell>
                      <Link href={`/procurement/rfq/${rfq.id}`}>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
