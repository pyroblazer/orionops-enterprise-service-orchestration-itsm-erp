'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface RFQDetail {
  id: string;
  title: string;
  status: string;
  requisitionId: string;
  deadline: string;
  vendorCount: number;
}

interface Bid {
  id: string;
  vendor: string;
  price: number;
  deliveryDays: number;
  qualityRating: number;
  score: number;
}

export default function RFQDetailPage({ params }: { params: { id: string } }) {
  const [rfq, setRfq] = useState<RFQDetail | null>(null);
  const [bids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Mock data
      setRfq({
        id: params.id,
        title: 'Server Hardware',
        status: 'SENT',
        requisitionId: 'REQ-001',
        deadline: '2026-06-15',
        vendorCount: 3
      });
    } catch (err) {
      console.error('Failed to load RFQ:', err);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <Skeleton className="h-[500px]" />;
  }

  if (!rfq) {
    return <div className="text-center py-8">RFQ not found</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{rfq.title}</h1>
          <p className="text-muted-foreground">{rfq.requisitionId}</p>
        </div>
        <Badge>{rfq.status}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Deadline</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{rfq.deadline}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Vendors Solicited</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{rfq.vendorCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Bid Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{bids.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bid Responses</CardTitle>
        </CardHeader>
        <CardContent>
          {bids.length === 0 ? (
            <p className="text-muted-foreground">No bids received yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Delivery Days</TableHead>
                  <TableHead>Quality Rating</TableHead>
                  <TableHead>Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bids.map((bid) => (
                  <TableRow key={bid.id}>
                    <TableCell>{bid.vendor}</TableCell>
                    <TableCell>${bid.price?.toLocaleString()}</TableCell>
                    <TableCell>{bid.deliveryDays}</TableCell>
                    <TableCell>{bid.qualityRating}%</TableCell>
                    <TableCell className="font-bold">{bid.score}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {rfq.status === 'SENT' && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={() => { /* Scoring bids */ }}>Score and Rank Bids</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
