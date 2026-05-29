'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

export default function SoDPage() {
  const [rules, setRules] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRules();
  }, []);

  async function fetchRules() {
    try {
      setLoading(true);
      setRules({
        'create_expense': 'approve_expense',
        'create_po': 'approve_po',
        'create_invoice': 'approve_invoice'
      });
    } catch (err) {
      console.error('Failed to load SoD rules:', err);
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
        <h1 className="text-3xl font-bold tracking-tight">Segregation of Duties</h1>
        <p className="text-muted-foreground">Manage conflicting roles and permissions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SoD Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Activity 1</TableHead>
                <TableHead>Activity 2</TableHead>
                <TableHead>Conflict Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(rules).map(([activity1, activity2]: any) => (
                <TableRow key={activity1}>
                  <TableCell className="font-mono">{activity1}</TableCell>
                  <TableCell className="font-mono">{activity2}</TableCell>
                  <TableCell>
                    <Badge variant="destructive">HIGH</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle>Validate Compliance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm font-medium">User</label>
            <input type="text" placeholder="Select user" className="w-full mt-1 rounded border px-3 py-2" />
          </div>
          <div>
            <label className="text-sm font-medium">Activity</label>
            <input type="text" placeholder="Select activity" className="w-full mt-1 rounded border px-3 py-2" />
          </div>
          <Button className="w-full">Check Compliance</Button>
        </CardContent>
      </Card>
    </div>
  );
}
