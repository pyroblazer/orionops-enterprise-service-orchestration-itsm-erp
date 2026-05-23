'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, TrendingDown, Receipt, CreditCard, Plus, Search, Check, X, Pencil, Trash2 } from 'lucide-react';
import { formatCurrency, formatDateTime, cn } from '@/lib/utils';
import { api, Budget, Expense, Invoice } from '@/lib/api';

const EXPENSE_CATEGORIES = ['travel', 'software', 'hardware', 'consulting', 'infrastructure', 'supplies', 'services', 'other'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'SGD', 'AUD'];

function expenseStatusColor(s: string) {
  return s === 'approved' ? 'bg-success/20 text-success border-success'
    : s === 'pending' ? 'bg-warning/20 text-warning border-warning'
    : s === 'rejected' ? 'bg-danger/20 text-danger border-danger'
    : s === 'reimbursed' ? 'bg-info/20 text-info border-info'
    : 'bg-muted text-muted-foreground';
}

function invoiceStatusColor(s: string) {
  return s === 'paid' ? 'bg-success/20 text-success border-success'
    : s === 'overdue' ? 'bg-danger/20 text-danger border-danger'
    : s === 'sent' ? 'bg-info/20 text-info border-info'
    : s === 'draft' ? 'bg-muted text-muted-foreground'
    : 'bg-muted text-muted-foreground';
}

export default function FinancePage() {
  const qc = useQueryClient();

  // Budget state
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [editBudgetId, setEditBudgetId] = useState<string | null>(null);
  const [budgetForm, setBudgetForm] = useState({ name: '', fiscalYear: new Date().getFullYear(), costCenterId: '', totalAmount: 0, currency: 'USD', notes: '' });
  const [deleteBudgetId, setDeleteBudgetId] = useState<string | null>(null);

  // Expense state
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseStatus, setExpenseStatus] = useState('');
  const [showExpForm, setShowExpForm] = useState(false);
  const [editExpId, setEditExpId] = useState<string | null>(null);
  const [expForm, setExpForm] = useState({ title: '', amount: 0, currency: 'USD', category: 'travel', budgetId: '', description: '', receiptUrl: '', expenseDate: new Date().toISOString().slice(0, 10) });
  const [deleteExpId, setDeleteExpId] = useState<string | null>(null);

  // Invoice state
  const [invoiceStatus, setInvoiceStatus] = useState('');
  const [showInvForm, setShowInvForm] = useState(false);
  const [editInvId, setEditInvId] = useState<string | null>(null);
  const [invForm, setInvForm] = useState({ vendorId: '', invoiceNumber: '', amount: 0, currency: 'USD', dueDate: '', notes: '' });
  const [deleteInvId, setDeleteInvId] = useState<string | null>(null);
  const [payInvId, setPayInvId] = useState<string | null>(null);
  const [payForm, setPayForm] = useState({ amount: 0, paymentDate: new Date().toISOString().slice(0, 10), method: 'bank_transfer' });

  // Queries
  const { data: budgetsData, isLoading: loadingBudgets } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => api.getBudgets().then(r => r.data),
  });
  const { data: costCentersData } = useQuery({
    queryKey: ['cost-centers'],
    queryFn: () => api.getCostCenters().then(r => r.data),
  });
  const { data: expensesData, isLoading: loadingExpenses } = useQuery({
    queryKey: ['expenses', { expenseSearch, expenseStatus }],
    queryFn: () => api.getExpenses({ search: expenseSearch || undefined, status: expenseStatus || undefined }).then(r => r.data),
  });
  const { data: invoicesData, isLoading: loadingInvoices } = useQuery({
    queryKey: ['invoices', { invoiceStatus }],
    queryFn: () => api.getInvoices({ status: invoiceStatus || undefined }).then(r => r.data),
  });

  // Budget mutations
  const createBudget = useMutation({ mutationFn: () => api.createBudget(budgetForm), onSuccess: () => { qc.invalidateQueries({ queryKey: ['budgets'] }); setShowBudgetForm(false); setBudgetForm({ name: '', fiscalYear: new Date().getFullYear(), costCenterId: '', totalAmount: 0, currency: 'USD', notes: '' }); } });
  const updateBudget = useMutation({ mutationFn: ({ id, d }: { id: string; d: typeof budgetForm }) => api.updateBudget(id, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['budgets'] }); setEditBudgetId(null); } });
  const deleteBudget = useMutation({ mutationFn: (id: string) => api.deleteBudget(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['budgets'] }); setDeleteBudgetId(null); } });

  // Expense mutations
  const createExpense = useMutation({ mutationFn: () => api.createExpense(expForm), onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); setShowExpForm(false); } });
  const updateExpense = useMutation({ mutationFn: ({ id, d }: { id: string; d: Partial<Expense> }) => api.updateExpense(id, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); setEditExpId(null); } });
  const deleteExpense = useMutation({ mutationFn: (id: string) => api.deleteExpense(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); setDeleteExpId(null); } });

  // Invoice mutations
  const createInvoice = useMutation({ mutationFn: () => api.createInvoice(invForm), onSuccess: () => { qc.invalidateQueries({ queryKey: ['invoices'] }); setShowInvForm(false); } });
  const updateInvoice = useMutation({ mutationFn: ({ id, d }: { id: string; d: Partial<Invoice> }) => api.updateInvoice(id, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['invoices'] }); setEditInvId(null); } });
  const deleteInvoice = useMutation({ mutationFn: (id: string) => api.deleteInvoice(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['invoices'] }); setDeleteInvId(null); } });
  const createPayment = useMutation({ mutationFn: () => api.createPayment({ invoiceId: payInvId ?? undefined, ...payForm }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['invoices'] }); setPayInvId(null); } });

  const budgets: Budget[] = budgetsData?.data ?? [];
  const expenses: Expense[] = expensesData?.data ?? [];
  const invoices: Invoice[] = invoicesData?.data ?? [];
  const costCenters = costCentersData?.data ?? [];

  const totalBudget = budgets.reduce((s, b) => s + (b.totalAmount ?? 0), 0);
  const totalSpent = budgets.reduce((s, b) => s + (b.spentAmount ?? 0), 0);
  const pendingExpenses = expenses.filter(e => e.status === 'pending').reduce((s, e) => s + (e.amount ?? 0), 0);
  const overdueInvoices = invoices.filter(i => i.status === 'overdue').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finance</h1>
          <p className="text-muted-foreground">Budgets, expenses, and invoices</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(totalBudget)}</div></CardContent>
        </Card>
        <Card className="border-l-4 border-l-success">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div><p className="text-xs text-muted-foreground">{totalBudget > 0 ? `${((totalSpent / totalBudget) * 100).toFixed(1)}% utilized` : '—'}</p></CardContent>
        </Card>
        <Card className="border-l-4 border-l-warning">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Expenses</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(pendingExpenses)}</div></CardContent>
        </Card>
        <Card className="border-l-4 border-l-danger">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Invoices</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{overdueInvoices}</div></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="budgets">
        <TabsList>
          <TabsTrigger value="budgets"><DollarSign className="mr-1 h-4 w-4" />Budgets</TabsTrigger>
          <TabsTrigger value="expenses"><Receipt className="mr-1 h-4 w-4" />Expenses</TabsTrigger>
          <TabsTrigger value="invoices"><CreditCard className="mr-1 h-4 w-4" />Invoices</TabsTrigger>
        </TabsList>

        {/* BUDGETS TAB */}
        <TabsContent value="budgets" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Budget Allocations</h2>
            <Button size="sm" onClick={() => { setShowBudgetForm(true); setEditBudgetId(null); }}><Plus className="mr-1 h-4 w-4" /> New Budget</Button>
          </div>

          {(showBudgetForm || editBudgetId) && (
            <Card>
              <CardHeader><CardTitle className="text-base">{editBudgetId ? 'Edit Budget' : 'New Budget'}</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={e => { e.preventDefault(); editBudgetId ? updateBudget.mutate({ id: editBudgetId, d: budgetForm }) : createBudget.mutate(); }} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1"><label className="text-sm font-medium">Name *</label><Input required value={budgetForm.name} onChange={e => setBudgetForm(f => ({ ...f, name: e.target.value }))} placeholder="IT Infrastructure Budget" /></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Fiscal Year</label><Input type="number" value={budgetForm.fiscalYear} onChange={e => setBudgetForm(f => ({ ...f, fiscalYear: parseInt(e.target.value) }))} /></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Cost Center</label>
                    <Select value={budgetForm.costCenterId} onValueChange={v => setBudgetForm(f => ({ ...f, costCenterId: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select cost center" /></SelectTrigger>
                      <SelectContent>{(costCenters as { id: string; name: string }[]).map(cc => <SelectItem key={cc.id} value={cc.id}>{cc.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><label className="text-sm font-medium">Total Amount *</label><Input required type="number" min={0} value={budgetForm.totalAmount || ''} onChange={e => setBudgetForm(f => ({ ...f, totalAmount: parseFloat(e.target.value) }))} /></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Currency</label>
                    <Select value={budgetForm.currency} onValueChange={v => setBudgetForm(f => ({ ...f, currency: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><label className="text-sm font-medium">Notes</label><Input value={budgetForm.notes} onChange={e => setBudgetForm(f => ({ ...f, notes: e.target.value }))} /></div>
                  <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
                    <Button type="submit" disabled={createBudget.isPending || updateBudget.isPending}><Check className="mr-1 h-4 w-4" />{editBudgetId ? 'Save' : 'Create'}</Button>
                    <Button type="button" variant="outline" onClick={() => { setShowBudgetForm(false); setEditBudgetId(null); }}><X className="mr-1 h-4 w-4" />Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {deleteBudgetId && (
            <Card className="border-danger/50 bg-danger/5">
              <CardContent className="flex items-center justify-between py-3">
                <p className="text-sm">Delete this budget? This cannot be undone.</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" disabled={deleteBudget.isPending} onClick={() => deleteBudget.mutate(deleteBudgetId)}>Delete</Button>
                  <Button size="sm" variant="outline" onClick={() => setDeleteBudgetId(null)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {loadingBudgets ? (
            <div className="space-y-px">{[1,2,3].map(i => <div key={i} className="h-12 animate-pulse bg-muted/40" />)}</div>
          ) : (
            <div className="rounded-lg border">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Fiscal Year</th>
                  <th className="px-4 py-2 text-left">Allocated</th>
                  <th className="px-4 py-2 text-left">Spent</th>
                  <th className="px-4 py-2 text-left">Utilization</th>
                  <th className="px-4 py-2 w-20">Actions</th>
                </tr></thead>
                <tbody>
                  {budgets.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No budgets found</td></tr>}
                  {budgets.map(b => {
                    const pct = b.totalAmount > 0 ? ((b.spentAmount ?? 0) / b.totalAmount) * 100 : 0;
                    return (
                      <tr key={b.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-2 font-medium">{b.name}</td>
                        <td className="px-4 py-2">{b.fiscalYear}</td>
                        <td className="px-4 py-2">{formatCurrency(b.totalAmount)}</td>
                        <td className="px-4 py-2">{formatCurrency(b.spentAmount ?? 0)}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-20 rounded-full bg-muted overflow-hidden">
                              <div className={cn('h-full rounded-full', pct >= 95 ? 'bg-danger' : pct >= 80 ? 'bg-warning' : 'bg-success')} style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground">{pct.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => { setEditBudgetId(b.id); setBudgetForm({ name: b.name ?? '', fiscalYear: b.fiscalYear ?? new Date().getFullYear(), costCenterId: b.costCenterId ?? '', totalAmount: b.totalAmount ?? 0, currency: b.currency ?? 'USD', notes: b.notes ?? '' }); setShowBudgetForm(false); }}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => setDeleteBudgetId(b.id)}><Trash2 className="h-3.5 w-3.5 text-danger" /></Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* EXPENSES TAB */}
        <TabsContent value="expenses" className="space-y-4 mt-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search expenses..." className="pl-8" value={expenseSearch} onChange={e => setExpenseSearch(e.target.value)} />
            </div>
            <Select value={expenseStatus} onValueChange={setExpenseStatus}>
              <SelectTrigger className="w-36"><SelectValue placeholder="All statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                {['pending','approved','rejected','reimbursed'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={() => { setShowExpForm(true); setEditExpId(null); }}><Plus className="mr-1 h-4 w-4" />New Expense</Button>
          </div>

          {(showExpForm || editExpId) && (
            <Card>
              <CardHeader><CardTitle className="text-base">{editExpId ? 'Edit Expense' : 'New Expense'}</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={e => { e.preventDefault(); editExpId ? updateExpense.mutate({ id: editExpId, d: expForm }) : createExpense.mutate(); }} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1 sm:col-span-2 lg:col-span-1"><label className="text-sm font-medium">Title *</label><Input required value={expForm.title} onChange={e => setExpForm(f => ({ ...f, title: e.target.value }))} placeholder="Cloud infrastructure - May" /></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Amount *</label><Input required type="number" min={0} value={expForm.amount || ''} onChange={e => setExpForm(f => ({ ...f, amount: parseFloat(e.target.value) }))} /></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Currency</label><Select value={expForm.currency} onValueChange={v => setExpForm(f => ({ ...f, currency: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Category</label><Select value={expForm.category} onValueChange={v => setExpForm(f => ({ ...f, category: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Date</label><Input type="date" value={expForm.expenseDate} onChange={e => setExpForm(f => ({ ...f, expenseDate: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Description</label><Input value={expForm.description} onChange={e => setExpForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" /></div>
                  <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
                    <Button type="submit" disabled={createExpense.isPending || updateExpense.isPending}><Check className="mr-1 h-4 w-4" />{editExpId ? 'Save' : 'Create'}</Button>
                    <Button type="button" variant="outline" onClick={() => { setShowExpForm(false); setEditExpId(null); }}><X className="mr-1 h-4 w-4" />Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {deleteExpId && (
            <Card className="border-danger/50 bg-danger/5"><CardContent className="flex items-center justify-between py-3">
              <p className="text-sm">Delete this expense?</p>
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" disabled={deleteExpense.isPending} onClick={() => deleteExpense.mutate(deleteExpId)}>Delete</Button>
                <Button size="sm" variant="outline" onClick={() => setDeleteExpId(null)}>Cancel</Button>
              </div>
            </CardContent></Card>
          )}

          <Card><CardContent className="p-0">
            {loadingExpenses ? <div className="space-y-px">{[1,2,3].map(i => <div key={i} className="h-12 animate-pulse bg-muted/40" />)}</div> : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Title</TableHead><TableHead>Category</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead className="w-28">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {expenses.length === 0 && <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No expenses found</TableCell></TableRow>}
                  {expenses.map(exp => (
                    <TableRow key={exp.id}>
                      <TableCell className="font-medium">{exp.title ?? exp.description}</TableCell>
                      <TableCell className="capitalize">{exp.category}</TableCell>
                      <TableCell>{formatCurrency(exp.amount)}</TableCell>
                      <TableCell><Badge className={cn('capitalize', expenseStatusColor(exp.status))}>{exp.status}</Badge></TableCell>
                      <TableCell className="text-muted-foreground text-sm">{exp.expenseDate ? formatDateTime(exp.expenseDate) : '—'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {exp.status === 'pending' && (
                            <>
                              <Button size="sm" variant="outline" className="text-success border-success text-xs px-2 py-1 h-7" onClick={() => updateExpense.mutate({ id: exp.id, d: { status: 'approved' } })}>Approve</Button>
                              <Button size="sm" variant="outline" className="text-danger border-danger text-xs px-2 py-1 h-7" onClick={() => updateExpense.mutate({ id: exp.id, d: { status: 'rejected' } })}>Reject</Button>
                            </>
                          )}
                          {exp.status === 'approved' && <Button size="sm" variant="outline" className="text-xs px-2 py-1 h-7" onClick={() => updateExpense.mutate({ id: exp.id, d: { status: 'reimbursed' } })}>Reimburse</Button>}
                          <Button size="icon" variant="ghost" onClick={() => { setEditExpId(exp.id); setExpForm({ title: exp.title ?? '', amount: exp.amount ?? 0, currency: exp.currency ?? 'USD', category: exp.category ?? 'other', budgetId: exp.budgetId ?? '', description: exp.description ?? '', receiptUrl: exp.receiptUrl ?? '', expenseDate: exp.expenseDate?.slice(0, 10) ?? '' }); setShowExpForm(false); }}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => setDeleteExpId(exp.id)}><Trash2 className="h-3.5 w-3.5 text-danger" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent></Card>
        </TabsContent>

        {/* INVOICES TAB */}
        <TabsContent value="invoices" className="space-y-4 mt-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={invoiceStatus} onValueChange={setInvoiceStatus}>
              <SelectTrigger className="w-36"><SelectValue placeholder="All statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                {['draft','sent','paid','overdue','cancelled'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" className="ml-auto" onClick={() => { setShowInvForm(true); setEditInvId(null); }}><Plus className="mr-1 h-4 w-4" />New Invoice</Button>
          </div>

          {(showInvForm || editInvId) && (
            <Card>
              <CardHeader><CardTitle className="text-base">{editInvId ? 'Edit Invoice' : 'New Invoice'}</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={e => { e.preventDefault(); editInvId ? updateInvoice.mutate({ id: editInvId, d: invForm }) : createInvoice.mutate(); }} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1"><label className="text-sm font-medium">Invoice Number *</label><Input required value={invForm.invoiceNumber} onChange={e => setInvForm(f => ({ ...f, invoiceNumber: e.target.value }))} placeholder="INV-2026-0001" /></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Vendor ID</label><Input value={invForm.vendorId} onChange={e => setInvForm(f => ({ ...f, vendorId: e.target.value }))} placeholder="Vendor UUID" /></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Amount *</label><Input required type="number" min={0} value={invForm.amount || ''} onChange={e => setInvForm(f => ({ ...f, amount: parseFloat(e.target.value) }))} /></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Currency</label><Select value={invForm.currency} onValueChange={v => setInvForm(f => ({ ...f, currency: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Due Date</label><Input type="date" value={invForm.dueDate} onChange={e => setInvForm(f => ({ ...f, dueDate: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Notes</label><Input value={invForm.notes} onChange={e => setInvForm(f => ({ ...f, notes: e.target.value }))} /></div>
                  <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
                    <Button type="submit" disabled={createInvoice.isPending || updateInvoice.isPending}><Check className="mr-1 h-4 w-4" />{editInvId ? 'Save' : 'Create'}</Button>
                    <Button type="button" variant="outline" onClick={() => { setShowInvForm(false); setEditInvId(null); }}><X className="mr-1 h-4 w-4" />Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {payInvId && (
            <Card>
              <CardHeader><CardTitle className="text-base">Record Payment</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={e => { e.preventDefault(); createPayment.mutate(); }} className="flex flex-wrap gap-3 items-end">
                  <div className="space-y-1"><label className="text-sm font-medium">Amount</label><Input type="number" min={0} value={payForm.amount || ''} onChange={e => setPayForm(f => ({ ...f, amount: parseFloat(e.target.value) }))} className="w-32" /></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Payment Date</label><Input type="date" value={payForm.paymentDate} onChange={e => setPayForm(f => ({ ...f, paymentDate: e.target.value }))} className="w-40" /></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Method</label><Select value={payForm.method} onValueChange={v => setPayForm(f => ({ ...f, method: v }))}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent>{['bank_transfer','credit_card','check','cash'].map(m => <SelectItem key={m} value={m}>{m.replace('_',' ')}</SelectItem>)}</SelectContent></Select></div>
                  <Button type="submit" disabled={createPayment.isPending}><Check className="mr-1 h-4 w-4" />Record</Button>
                  <Button type="button" variant="outline" onClick={() => setPayInvId(null)}><X className="mr-1 h-4 w-4" />Cancel</Button>
                </form>
              </CardContent>
            </Card>
          )}

          {deleteInvId && (
            <Card className="border-danger/50 bg-danger/5"><CardContent className="flex items-center justify-between py-3">
              <p className="text-sm">Delete this invoice?</p>
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" disabled={deleteInvoice.isPending} onClick={() => deleteInvoice.mutate(deleteInvId)}>Delete</Button>
                <Button size="sm" variant="outline" onClick={() => setDeleteInvId(null)}>Cancel</Button>
              </div>
            </CardContent></Card>
          )}

          <Card><CardContent className="p-0">
            {loadingInvoices ? <div className="space-y-px">{[1,2,3].map(i => <div key={i} className="h-12 animate-pulse bg-muted/40" />)}</div> : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Invoice #</TableHead><TableHead>Vendor</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Due Date</TableHead><TableHead className="w-36">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {invoices.length === 0 && <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No invoices found</TableCell></TableRow>}
                  {invoices.map(inv => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-sm font-medium">{inv.invoiceNumber}</TableCell>
                      <TableCell>{inv.vendorName ?? inv.vendorId ?? '—'}</TableCell>
                      <TableCell>{formatCurrency(inv.amount)}</TableCell>
                      <TableCell><Badge className={cn('capitalize', invoiceStatusColor(inv.status))}>{inv.status}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{inv.dueDate ? formatDateTime(inv.dueDate) : '—'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {inv.status !== 'paid' && inv.status !== 'cancelled' && <Button size="sm" variant="outline" className="text-xs px-2 py-1 h-7" onClick={() => { setPayInvId(inv.id); setPayForm({ amount: inv.amount ?? 0, paymentDate: new Date().toISOString().slice(0, 10), method: 'bank_transfer' }); }}>Pay</Button>}
                          {inv.status === 'draft' && <Button size="sm" variant="outline" className="text-xs px-2 py-1 h-7" onClick={() => updateInvoice.mutate({ id: inv.id, d: { status: 'sent' } })}>Send</Button>}
                          <Button size="icon" variant="ghost" onClick={() => { setEditInvId(inv.id); setInvForm({ vendorId: inv.vendorId ?? '', invoiceNumber: inv.invoiceNumber ?? '', amount: inv.amount ?? 0, currency: inv.currency ?? 'USD', dueDate: inv.dueDate?.slice(0, 10) ?? '', notes: inv.notes ?? '' }); setShowInvForm(false); }}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => setDeleteInvId(inv.id)}><Trash2 className="h-3.5 w-3.5 text-danger" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
