'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface ChartOfAccount {
  code: string;
  name: string;
  type: string;
  balance: number;
}

interface TrialBalance {
  debits: number;
  credits: number;
  balanced: boolean;
}

interface IncomeStatement {
  revenue: number;
  expenses: number;
  netIncome: number;
}

export default function GeneralLedgerPage() {
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [trialBalance, setTrialBalance] = useState<TrialBalance | null>(null);
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatement | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'accounts' | 'trial' | 'income'>('accounts');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      if (tab === 'accounts') {
        const res = await api.getChartOfAccounts();
        setAccounts(res?.data?.data || []);
      } else if (tab === 'trial') {
        const res = await api.getTrialBalance();
        setTrialBalance(res?.data?.data || {});
      } else if (tab === 'income') {
        const res = await api.getIncomeStatement();
        setIncomeStatement(res?.data?.data || {});
      }
    } catch (err) {
      console.error('Failed to load GL data:', err);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <Skeleton className="h-[500px]" />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">General Ledger</h1>
        <p className="text-muted-foreground">Chart of accounts, trial balance, and financial statements</p>
      </div>

      <div className="flex gap-2 border-b">
        <button
          onClick={() => setTab('accounts')}
          className={`px-4 py-2 font-medium ${tab === 'accounts' ? 'border-b-2 border-blue-500' : ''}`}
        >
          Chart of Accounts
        </button>
        <button
          onClick={() => setTab('trial')}
          className={`px-4 py-2 font-medium ${tab === 'trial' ? 'border-b-2 border-blue-500' : ''}`}
        >
          Trial Balance
        </button>
        <button
          onClick={() => setTab('income')}
          className={`px-4 py-2 font-medium ${tab === 'income' ? 'border-b-2 border-blue-500' : ''}`}
        >
          Income Statement
        </button>
      </div>

      {tab === 'accounts' && (
        <Card>
          <CardHeader>
            <CardTitle>Chart of Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.code}>
                    <TableCell className="font-mono">{account.code}</TableCell>
                    <TableCell>{account.name}</TableCell>
                    <TableCell>{account.type}</TableCell>
                    <TableCell>${account.balance.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {tab === 'trial' && (
        <Card>
          <CardHeader>
            <CardTitle>Trial Balance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Debits</p>
                <p className="text-2xl font-bold">${trialBalance?.debits?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Credits</p>
                <p className="text-2xl font-bold">${trialBalance?.credits?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={trialBalance?.balanced ? 'default' : 'destructive'}>
                  {trialBalance?.balanced ? 'Balanced' : 'Unbalanced'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'income' && (
        <Card>
          <CardHeader>
            <CardTitle>Income Statement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold text-green-600">${incomeStatement?.revenue?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expenses</p>
                <p className="text-2xl font-bold text-red-600">${incomeStatement?.expenses?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net Income</p>
                <p className="text-2xl font-bold">${incomeStatement?.netIncome?.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
