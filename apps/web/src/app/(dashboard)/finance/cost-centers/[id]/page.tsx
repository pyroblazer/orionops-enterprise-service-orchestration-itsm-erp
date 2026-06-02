'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface CostCenter {
  id: string;
  name: string;
  code: string;
  owner: string;
  budgetAmount: number;
  status: string;
}

interface BudgetSummary {
  id: string;
  name: string;
  amount: number;
  spent: number;
  utilization: number;
}

interface ExpenseSummary {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: string;
}

export default function CostCenterDetailPage({ params }: { params: { id: string } }) {
  const [costCenter, setCostCenter] = useState<CostCenter | null>(null);
  const [budgets] = useState<BudgetSummary[]>([]);
  const [expenses] = useState<ExpenseSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // In real impl: await api.getCostCenter(id)
      // For now, mock data structure
      setCostCenter({
        id: params.id,
        name: 'Engineering Department',
        code: 'CC-001',
        owner: 'John Doe',
        budgetAmount: 500000,
        status: 'ACTIVE'
      });
    } catch (err) {
      console.error('Failed to load cost center:', err);
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

  if (!costCenter) {
    return <div className="text-center py-8">Cost center not found</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{costCenter.name}</h1>
        <p className="text-muted-foreground">{costCenter.code}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Owner</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{costCenter.owner}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Budget Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${costCenter.budgetAmount?.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="default">{costCenter.status}</Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Linked Budgets</CardTitle>
        </CardHeader>
        <CardContent>
          {budgets.length === 0 ? (
            <p className="text-muted-foreground">No budgets linked to this cost center</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Spent</TableHead>
                  <TableHead>Utilization</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgets.map((budget) => (
                  <TableRow key={budget.id}>
                    <TableCell>{budget.name}</TableCell>
                    <TableCell>${budget.amount.toLocaleString()}</TableCell>
                    <TableCell>${budget.spent.toLocaleString()}</TableCell>
                    <TableCell>{budget.utilization}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="text-muted-foreground">No expenses recorded</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((exp) => (
                  <TableRow key={exp.id}>
                    <TableCell>{exp.date}</TableCell>
                    <TableCell>{exp.description}</TableCell>
                    <TableCell>${exp.amount.toLocaleString()}</TableCell>
                    <TableCell>{exp.status}</TableCell>
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
