'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DollarSign,
  TrendingDown,
  Receipt,
  CreditCard,
  Plus,
  Search,
  AlertTriangle,
} from 'lucide-react';
import { formatCurrency, formatDateTime, cn } from '@/lib/utils';

// --- Mock Data ---

interface Budget {
  id: string;
  costCenter: string;
  department: string;
  allocated: number;
  spent: number;
  period: string;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  status: 'pending' | 'approved' | 'rejected' | 'reimbursed';
  submittedBy: string;
  date: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  vendor: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  issuedDate: string;
}

const mockBudgets: Budget[] = [
  { id: 'bgt-001', costCenter: 'CC-IT-001', department: 'Information Technology', allocated: 500000, spent: 342500, period: 'FY 2026' },
  { id: 'bgt-002', costCenter: 'CC-OPS-001', department: 'Operations', allocated: 350000, spent: 289000, period: 'FY 2026' },
  { id: 'bgt-003', costCenter: 'CC-HR-001', department: 'Human Resources', allocated: 200000, spent: 145000, period: 'FY 2026' },
  { id: 'bgt-004', costCenter: 'CC-FAC-001', department: 'Facilities', allocated: 275000, spent: 268000, period: 'FY 2026' },
  { id: 'bgt-005', costCenter: 'CC-MKT-001', department: 'Marketing', allocated: 180000, spent: 72000, period: 'FY 2026' },
];

const mockExpenses: Expense[] = [
  { id: 'exp-001', description: 'Cloud infrastructure - April', amount: 12500, category: 'Infrastructure', status: 'approved', submittedBy: 'John Smith', date: '2026-04-15T10:30:00Z' },
  { id: 'exp-002', description: 'Software licenses renewal', amount: 8750, category: 'Software', status: 'pending', submittedBy: 'Jane Doe', date: '2026-04-18T14:00:00Z' },
  { id: 'exp-003', description: 'Office supplies procurement', amount: 2300, category: 'Supplies', status: 'reimbursed', submittedBy: 'Bob Wilson', date: '2026-04-10T09:15:00Z' },
  { id: 'exp-004', description: 'Conference travel - TechSummit', amount: 4200, category: 'Travel', status: 'rejected', submittedBy: 'Alice Brown', date: '2026-04-12T16:45:00Z' },
  { id: 'exp-005', description: 'Security audit services', amount: 15000, category: 'Services', status: 'pending', submittedBy: 'Mike Chen', date: '2026-04-20T11:00:00Z' },
];

const mockInvoices: Invoice[] = [
  { id: 'inv-001', invoiceNumber: 'INV-2026-0042', vendor: 'CloudCorp Inc.', amount: 25000, status: 'paid', dueDate: '2026-04-30T23:59:59Z', issuedDate: '2026-04-01T00:00:00Z' },
  { id: 'inv-002', invoiceNumber: 'INV-2026-0043', vendor: 'SecureNet LLC', amount: 18000, status: 'sent', dueDate: '2026-05-15T23:59:59Z', issuedDate: '2026-04-15T00:00:00Z' },
  { id: 'inv-003', invoiceNumber: 'INV-2026-0038', vendor: 'DataVault Systems', amount: 9500, status: 'overdue', dueDate: '2026-04-10T23:59:59Z', issuedDate: '2026-03-10T00:00:00Z' },
  { id: 'inv-004', invoiceNumber: 'INV-2026-0044', vendor: 'TechSupply Co.', amount: 3200, status: 'draft', dueDate: '2026-05-20T23:59:59Z', issuedDate: '2026-04-20T00:00:00Z' },
  { id: 'inv-005', invoiceNumber: 'INV-2026-0045', vendor: 'Nexus Consulting', amount: 67500, status: 'sent', dueDate: '2026-05-30T23:59:59Z', issuedDate: '2026-04-22T00:00:00Z' },
];

function getExpenseStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-warning/20 text-warning border-warning',
    approved: 'bg-success/20 text-success border-success',
    rejected: 'bg-danger/20 text-danger border-danger',
    reimbursed: 'bg-primary/20 text-primary border-primary',
  };
  return colors[status] || 'bg-muted text-muted-foreground';
}

function getInvoiceStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground border-muted',
    sent: 'bg-info/20 text-info border-info',
    paid: 'bg-success/20 text-success border-success',
    overdue: 'bg-danger/20 text-danger border-danger',
    cancelled: 'bg-muted text-muted-foreground border-muted',
  };
  return colors[status] || 'bg-muted text-muted-foreground';
}

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState('budgets');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading] = useState(false);

  // Summary metrics
  const totalAllocated = mockBudgets.reduce((sum, b) => sum + b.allocated, 0);
  const totalSpent = mockBudgets.reduce((sum, b) => sum + b.spent, 0);
  const overdueInvoices = mockInvoices.filter((i) => i.status === 'overdue');
  const pendingExpenses = mockExpenses.filter((e) => e.status === 'pending');

  const filteredBudgets = mockBudgets.filter(
    (b) =>
      !searchQuery ||
      b.costCenter.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredExpenses = mockExpenses.filter(
    (e) =>
      !searchQuery ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInvoices = mockInvoices.filter(
    (i) =>
      !searchQuery ||
      i.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.vendor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financial Management</h1>
          <p className="text-muted-foreground">
            Track budgets, expenses, and invoices
          </p>
        </div>
        <Button aria-label="Create new financial record">
          <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
          New Record
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAllocated)}</div>
            <p className="text-xs text-muted-foreground">Allocated for FY 2026</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-warning">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingDown className="h-4 w-4 text-warning" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
            <p className="text-xs text-muted-foreground">
              {((totalSpent / totalAllocated) * 100).toFixed(1)}% of budget
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-info">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Expenses</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingExpenses.length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-danger">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Invoices</CardTitle>
            <AlertTriangle className="h-4 w-4 text-danger" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-danger">{overdueInvoices.length}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder="Search financial records..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search financial records"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="budgets">
            <DollarSign className="mr-1 h-4 w-4" aria-hidden="true" />
            Budgets
          </TabsTrigger>
          <TabsTrigger value="expenses">
            <CreditCard className="mr-1 h-4 w-4" aria-hidden="true" />
            Expenses
          </TabsTrigger>
          <TabsTrigger value="invoices">
            <Receipt className="mr-1 h-4 w-4" aria-hidden="true" />
            Invoices
          </TabsTrigger>
        </TabsList>

        {/* Budgets Tab */}
        <TabsContent value="budgets" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget Overview</CardTitle>
              <CardDescription>Cost center budgets and utilization for FY 2026</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-3 p-6" role="status" aria-label="Loading budgets">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cost Center</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Allocated</TableHead>
                      <TableHead>Spent</TableHead>
                      <TableHead>Remaining</TableHead>
                      <TableHead>Utilization</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBudgets.length > 0 ? (
                      filteredBudgets.map((budget) => {
                        const remaining = budget.allocated - budget.spent;
                        const utilization = (budget.spent / budget.allocated) * 100;
                        return (
                          <TableRow key={budget.id}>
                            <TableCell className="font-mono text-sm font-medium">
                              {budget.costCenter}
                            </TableCell>
                            <TableCell>{budget.department}</TableCell>
                            <TableCell>{formatCurrency(budget.allocated)}</TableCell>
                            <TableCell>{formatCurrency(budget.spent)}</TableCell>
                            <TableCell>
                              <span className={cn(remaining < 0 ? 'text-danger' : 'text-success')}>
                                {formatCurrency(remaining)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-20 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className={cn(
                                      'h-full rounded-full',
                                      utilization > 90
                                        ? 'bg-danger'
                                        : utilization > 70
                                        ? 'bg-warning'
                                        : 'bg-success'
                                    )}
                                    style={{ width: `${Math.min(utilization, 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {utilization.toFixed(1)}%
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          No budgets found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Expenses</CardTitle>
              <CardDescription>Submitted expenses and reimbursement requests</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-3 p-6" role="status" aria-label="Loading expenses">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted By</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.length > 0 ? (
                      filteredExpenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell className="font-medium">{expense.description}</TableCell>
                          <TableCell>{formatCurrency(expense.amount)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{expense.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn('capitalize', getExpenseStatusColor(expense.status))}>
                              {expense.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{expense.submittedBy}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDateTime(expense.date)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          No expenses found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>Vendor invoices and payment tracking</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-3 p-6" role="status" aria-label="Loading invoices">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Issued</TableHead>
                      <TableHead>Due Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.length > 0 ? (
                      filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-mono text-sm font-medium">
                            {invoice.invoiceNumber}
                          </TableCell>
                          <TableCell>{invoice.vendor}</TableCell>
                          <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                          <TableCell>
                            <Badge className={cn('capitalize', getInvoiceStatusColor(invoice.status))}>
                              {invoice.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDateTime(invoice.issuedDate)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDateTime(invoice.dueDate)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          No invoices found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
