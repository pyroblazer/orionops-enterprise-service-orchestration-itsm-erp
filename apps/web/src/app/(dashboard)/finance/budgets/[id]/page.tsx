'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

export default function BudgetDetailPage({ params }: { params: { id: string } }) {
  const [budget, setBudget] = useState<any>(null);
  const [expenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchData();
  }, [params.id]);

  async function fetchData() {
    try {
      setLoading(true);
      // Mock data
      setBudget({
        id: params.id,
        name: 'Software Development',
        total: 250000,
        spent: 185000,
        period: '2026 Q2',
        utilization: 74
      });
    } catch (err) {
      console.error('Failed to load budget:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <Skeleton className="h-[500px]" />;
  }

  if (!budget) {
    return <div className="text-center py-8">Budget not found</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{budget.name}</h1>
        <p className="text-muted-foreground">{budget.period}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Budgeted Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${budget.total?.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${budget.spent?.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold">{budget.utilization}%</p>
              <div className="w-full bg-gray-200 rounded h-2">
                <div className="bg-blue-600 h-2 rounded" style={{ width: `${budget.utilization}%` }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expense Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((exp: any) => (
                <TableRow key={exp.id}>
                  <TableCell>{exp.date}</TableCell>
                  <TableCell>{exp.description}</TableCell>
                  <TableCell>{exp.category}</TableCell>
                  <TableCell>${exp.amount?.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
