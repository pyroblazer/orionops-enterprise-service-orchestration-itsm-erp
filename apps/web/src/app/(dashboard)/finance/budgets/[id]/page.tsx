'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface Budget {
  id: string;
  name: string;
  total: number;
  spent: number;
  period: string;
  utilization: number;
}

interface Expense {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
}

export default function BudgetDetailPage({ params }: { params: { id: string } }) {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [expenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
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
  }, [params.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
              {expenses.map((exp) => (
                <TableRow key={exp.id}>
                  <TableCell>{exp.date}</TableCell>
                  <TableCell>{exp.description}</TableCell>
                  <TableCell>{exp.category}</TableCell>
                  <TableCell>${exp.amount.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
