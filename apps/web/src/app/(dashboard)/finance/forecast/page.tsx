'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface BudgetForecast {
  id: string;
  name: string;
  amount: number;
  projected: number;
  onTrack: boolean;
}

interface BudgetAlert {
  id: string;
  name: string;
  utilization: number;
}

export default function BudgetForecastPage() {
  const [budgets, setBudgets] = useState<BudgetForecast[]>([]);
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [budgetsRes, alertsRes] = await Promise.all([
        api.getBudgets?.(),
        api.getBudgetAlerts?.(),
      ]);
      const budgetData = (budgetsRes?.data?.data as unknown as BudgetForecast[] | undefined) || ((budgetsRes?.data as unknown as { content?: BudgetForecast[] })?.content) || [];
      const alertData = alertsRes?.data?.data as unknown as BudgetAlert[] | undefined;
      setBudgets(budgetData);
      setAlerts(alertData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load forecasts');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[200px]" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Budget Forecast</h1>
        <p className="text-muted-foreground">Project budget utilization and overspend risks</p>
      </div>

      {alerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-900">Budget Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between rounded bg-white p-3">
                  <div>
                    <p className="font-medium">{alert.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {alert.utilization}% utilized
                    </p>
                  </div>
                  <Badge variant="destructive">Over 80%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-4 text-2xl font-bold">Budget Forecasts</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => (
            <Card key={budget.id}>
              <CardHeader>
                <CardTitle className="text-lg">{budget.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Budgeted Amount</p>
                  <p className="text-2xl font-bold">${budget.amount?.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Projected Spend</p>
                  <p className="text-xl font-semibold text-blue-600">${budget.projected?.toLocaleString()}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={budget.onTrack ? 'default' : 'destructive'}>
                    {budget.onTrack ? 'On Track' : 'At Risk'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded bg-red-50 p-4 text-red-800">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
