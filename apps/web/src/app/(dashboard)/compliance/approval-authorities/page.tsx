'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

export default function ApprovalAuthoritiesPage() {
  const [authorities, setAuthorities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuthorities();
  }, []);

  async function fetchAuthorities() {
    try {
      setLoading(true);
      // In production: const res = await api.getApprovalAuthorities?.() || { data: [] };
      // For now, set empty - API will provide data when available
      setAuthorities([]);
    } catch (err) {
      console.error('Failed to load authorities:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <Skeleton className="h-[500px]" />;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Approval Authorities</h1>
          <p className="text-muted-foreground">Manage user approval limits and authorities</p>
        </div>
        <Button>Set Authority</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Authorities</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Activity Type</TableHead>
                <TableHead>Max Amount</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {authorities.map((auth: any) => (
                <TableRow key={auth.userId}>
                  <TableCell>{auth.userName}</TableCell>
                  <TableCell className="font-mono">{auth.activityType}</TableCell>
                  <TableCell>${auth.maxAmount?.toLocaleString()}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">Edit</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle>Check Approval</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm font-medium">User</label>
            <input type="text" placeholder="Select user" className="w-full mt-1 rounded border px-3 py-2" />
          </div>
          <div>
            <label className="text-sm font-medium">Activity</label>
            <input type="text" placeholder="Activity type" className="w-full mt-1 rounded border px-3 py-2" />
          </div>
          <div>
            <label className="text-sm font-medium">Amount</label>
            <input type="number" placeholder="0" className="w-full mt-1 rounded border px-3 py-2" />
          </div>
          <Button className="w-full">Check Authority</Button>
        </CardContent>
      </Card>
    </div>
  );
}
