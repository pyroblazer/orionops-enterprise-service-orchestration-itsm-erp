'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollText, DollarSign, Boxes, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { api, BillingUsage, BillingRecord, CostModel } from '@/lib/api';

const COST_MODEL_TYPES = ['flat', 'tiered', 'per_unit', 'percentage'];
const COST_MODEL_STATUSES = ['active', 'inactive', 'draft'];

interface UsageForm {
  service: string; usageType: string; quantity: string; unit: string; recordedAt: string;
}
const EMPTY_USAGE: UsageForm = { service: '', usageType: '', quantity: '', unit: '', recordedAt: '' };

interface InvoiceForm {
  period: string; tenantId: string;
}
const EMPTY_INVOICE: InvoiceForm = { period: '', tenantId: '' };

interface CostModelForm {
  name: string; modelType: string; status: string; description: string; serviceId: string;
  effectiveFrom: string; effectiveTo: string;
}
const EMPTY_COST_MODEL: CostModelForm = { name: '', modelType: 'flat', status: 'active', description: '', serviceId: '', effectiveFrom: '', effectiveTo: '' };

interface BillingRecordForm {
  status: string;
}
const EMPTY_RECORD: BillingRecordForm = { status: '' };

function billingStatusColor(s: string) {
  return s === 'paid' ? 'bg-success/20 text-success'
    : s === 'overdue' ? 'bg-danger/20 text-danger'
    : s === 'pending' ? 'bg-warning/20 text-warning'
    : 'bg-muted text-muted-foreground';
}

export default function BillingPage() {
  const qc = useQueryClient();

  // Usage state
  const [showUsageForm, setShowUsageForm] = useState(false);
  const [usageForm, setUsageForm] = useState<UsageForm>(EMPTY_USAGE);

  // Invoice state
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState<InvoiceForm>(EMPTY_INVOICE);

  // Record state
  const [editRecordId, setEditRecordId] = useState<string | null>(null);
  const [recordForm, setRecordForm] = useState<BillingRecordForm>(EMPTY_RECORD);

  // Cost model state
  const [showModelForm, setShowModelForm] = useState(false);
  const [editModelId, setEditModelId] = useState<string | null>(null);
  const [modelForm, setModelForm] = useState<CostModelForm>(EMPTY_COST_MODEL);
  const [deleteModelId, setDeleteModelId] = useState<string | null>(null);

  // Queries
  const { data: usageData, isLoading: usageLoading } = useQuery({
    queryKey: ['billing-usage'],
    queryFn: () => api.getBillingUsage().then(r => r.data),
  });
  const usage = usageData?.data ?? [];

  const { data: recordsData, isLoading: recordsLoading } = useQuery({
    queryKey: ['billing-records'],
    queryFn: () => api.getBillingRecords().then(r => r.data),
  });
  const records = recordsData?.data ?? [];

  const { data: modelsData, isLoading: modelsLoading } = useQuery({
    queryKey: ['cost-models'],
    queryFn: () => api.getCostModels().then(r => r.data),
  });
  const models = (modelsData?.data ?? []) as CostModel[];

  // Usage mutation
  const recordUsageMut = useMutation({
    mutationFn: (d: UsageForm) => api.recordUsage({ ...d, quantity: Number(d.quantity) } as Partial<BillingUsage>),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['billing-usage'] }); setShowUsageForm(false); setUsageForm(EMPTY_USAGE); },
  });

  // Invoice mutation
  const generateInvoiceMut = useMutation({
    mutationFn: (d: InvoiceForm) => api.generateInvoice(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['billing-records'] }); setShowInvoiceForm(false); setInvoiceForm(EMPTY_INVOICE); },
  });

  // Record update mutation
  const updateRecordMut = useMutation({
    mutationFn: ({ id, d }: { id: string; d: BillingRecordForm }) => api.updateBillingRecord(id, d as Partial<BillingRecord>),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['billing-records'] }); setEditRecordId(null); setRecordForm(EMPTY_RECORD); },
  });

  // Cost model mutations
  const createModelMut = useMutation({
    mutationFn: (d: CostModelForm) => api.createCostModel(d as Partial<CostModel>),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cost-models'] }); setShowModelForm(false); setModelForm(EMPTY_COST_MODEL); },
  });
  const updateModelMut = useMutation({
    mutationFn: ({ id, d }: { id: string; d: CostModelForm }) => api.updateCostModel(id, d as Partial<CostModel>),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cost-models'] }); setEditModelId(null); setModelForm(EMPTY_COST_MODEL); },
  });
  const deleteModelMut = useMutation({
    mutationFn: (id: string) => api.deleteCostModel(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cost-models'] }); setDeleteModelId(null); },
  });

  // Handlers
  function openEditRecord(r: BillingRecord) {
    setEditRecordId(r.id);
    setRecordForm({ status: r.status ?? '' });
  }

  function openEditModel(m: CostModel) {
    setEditModelId(m.id);
    setModelForm({
      name: m.name ?? '', modelType: m.modelType ?? 'fixed', status: 'active',
      description: '', serviceId: m.serviceType ?? '',
      effectiveFrom: m.effectiveFrom ?? '', effectiveTo: m.effectiveTo ?? '',
    });
    setShowModelForm(false);
  }

  function handleModelSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editModelId) updateModelMut.mutate({ id: editModelId, d: modelForm });
    else createModelMut.mutate(modelForm);
  }

  const totalBilled = records.reduce((s: number, r: BillingRecord) => s + (r.totalAmount ?? 0), 0);
  const paidAmount = records.filter((r: BillingRecord) => r.status === 'paid').reduce((s: number, r: BillingRecord) => s + (r.totalAmount ?? 0), 0);
  const overdueCount = records.filter((r: BillingRecord) => r.status === 'overdue').length;
  const activeModels = models.filter((m: CostModel) => m.effectiveTo === undefined || m.effectiveTo === null).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight gradient-text">Service Billing</h1>
          <p className="text-sm text-muted-foreground">Usage tracking, invoices, and cost models</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary card-gradient-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Billed</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBilled)}</div>
            <p className="text-xs text-muted-foreground">{records.length} billing records</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-success card-gradient-success">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collected</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(paidAmount)}</div>
            <p className="text-xs text-muted-foreground">{totalBilled > 0 ? Math.round((paidAmount / totalBilled) * 100) : 0}% collection rate</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-danger card-gradient-danger">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <ScrollText className="h-4 w-4 text-danger" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueCount}</div>
            <p className="text-xs text-muted-foreground">Records past due</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-info card-gradient-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cost Models</CardTitle>
            <Boxes className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeModels}</div>
            <p className="text-xs text-muted-foreground">Of {models.length} total</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="usage">
        <TabsList>
          <TabsTrigger value="usage"><ScrollText className="mr-1 h-4 w-4" /> Usage</TabsTrigger>
          <TabsTrigger value="records"><DollarSign className="mr-1 h-4 w-4" /> Records</TabsTrigger>
          <TabsTrigger value="models"><Boxes className="mr-1 h-4 w-4" /> Cost Models</TabsTrigger>
        </TabsList>

        {/* Usage Tab */}
        <TabsContent value="usage" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Usage Records</h2>
            <Button onClick={() => { setShowUsageForm(true); setUsageForm(EMPTY_USAGE); }}>
              <Plus className="mr-1 h-4 w-4" /> Record Usage
            </Button>
          </div>

          {showUsageForm && (
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="text-base">Record Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); recordUsageMut.mutate(usageForm); }} className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Input label="Service" value={usageForm.service} onChange={(e) => setUsageForm({ ...usageForm, service: e.target.value })} required />
                    <Input label="Usage Type" value={usageForm.usageType} onChange={(e) => setUsageForm({ ...usageForm, usageType: e.target.value })} required />
                    <Input label="Quantity" type="number" value={usageForm.quantity} onChange={(e) => setUsageForm({ ...usageForm, quantity: e.target.value })} required />
                    <Input label="Unit" value={usageForm.unit} onChange={(e) => setUsageForm({ ...usageForm, unit: e.target.value })} />
                    <Input label="Recorded At" type="date" value={usageForm.recordedAt} onChange={(e) => setUsageForm({ ...usageForm, recordedAt: e.target.value })} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={recordUsageMut.isPending}><Check className="mr-1 h-4 w-4" /> Record</Button>
                    <Button type="button" variant="outline" onClick={() => { setShowUsageForm(false); setUsageForm(EMPTY_USAGE); }}><X className="mr-1 h-4 w-4" /> Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              {usageLoading ? (
                <div className="space-y-3 p-6">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Usage Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Recorded At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usage.length > 0 ? usage.map((u: BillingUsage) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.serviceType || '-'}</TableCell>
                        <TableCell><Badge variant="secondary">{u.serviceType}</Badge></TableCell>
                        <TableCell>{u.quantity}</TableCell>
                        <TableCell>{u.unit}</TableCell>
                        <TableCell className="text-muted-foreground">{new Date(u.usageDate).toLocaleDateString()}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No usage records found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Records Tab */}
        <TabsContent value="records" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Billing Records</h2>
            <Button onClick={() => { setShowInvoiceForm(true); setInvoiceForm(EMPTY_INVOICE); }}>
              <Plus className="mr-1 h-4 w-4" /> Generate Invoice
            </Button>
          </div>

          {showInvoiceForm && (
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="text-base">Generate Invoice</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); generateInvoiceMut.mutate(invoiceForm); }} className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input label="Period" placeholder="e.g. 2026-05" value={invoiceForm.period} onChange={(e) => setInvoiceForm({ ...invoiceForm, period: e.target.value })} required />
                    <Input label="Tenant ID" placeholder="Leave blank for all" value={invoiceForm.tenantId} onChange={(e) => setInvoiceForm({ ...invoiceForm, tenantId: e.target.value })} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={generateInvoiceMut.isPending}><Check className="mr-1 h-4 w-4" /> Generate</Button>
                    <Button type="button" variant="outline" onClick={() => { setShowInvoiceForm(false); setInvoiceForm(EMPTY_INVOICE); }}><X className="mr-1 h-4 w-4" /> Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {editRecordId && (
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="text-base">Update Billing Record</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); updateRecordMut.mutate({ id: editRecordId, d: recordForm }); }} className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Select value={recordForm.status} onValueChange={(v) => setRecordForm({ ...recordForm, status: v })}>
                      <SelectTrigger label="Status" />
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={updateRecordMut.isPending}><Check className="mr-1 h-4 w-4" /> Update</Button>
                    <Button type="button" variant="outline" onClick={() => { setEditRecordId(null); setRecordForm(EMPTY_RECORD); }}><X className="mr-1 h-4 w-4" /> Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              {recordsLoading ? (
                <div className="space-y-3 p-6">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-16">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.length > 0 ? records.map((r: BillingRecord) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{formatCurrency(r.totalAmount)}</TableCell>
                        <TableCell>{r.currency}</TableCell>
                        <TableCell className="text-sm">{r.period}</TableCell>
                        <TableCell>
                          <Badge className={cn('capitalize', billingStatusColor(r.status))}>{r.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => openEditRecord(r)} aria-label="Edit record"><Pencil className="h-3.5 w-3.5" /></Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No billing records found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cost Models Tab */}
        <TabsContent value="models" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Cost Models</h2>
            <Button onClick={() => { setShowModelForm(true); setEditModelId(null); setModelForm(EMPTY_COST_MODEL); }}>
              <Plus className="mr-1 h-4 w-4" /> Add Cost Model
            </Button>
          </div>

          {(showModelForm || editModelId) && (
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="text-base">{editModelId ? 'Edit Cost Model' : 'New Cost Model'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleModelSubmit} className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Input label="Name" value={modelForm.name} onChange={(e) => setModelForm({ ...modelForm, name: e.target.value })} required />
                    <Select value={modelForm.modelType} onValueChange={(v) => setModelForm({ ...modelForm, modelType: v })}>
                      <SelectTrigger label="Model Type" />
                      <SelectContent>
                        {COST_MODEL_TYPES.map(t => <SelectItem key={t} value={t}><span className="capitalize">{t.replace('_', ' ')}</span></SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={modelForm.status} onValueChange={(v) => setModelForm({ ...modelForm, status: v })}>
                      <SelectTrigger label="Status" />
                      <SelectContent>
                        {COST_MODEL_STATUSES.map(s => <SelectItem key={s} value={s}><span className="capitalize">{s}</span></SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input label="Description" value={modelForm.description} onChange={(e) => setModelForm({ ...modelForm, description: e.target.value })} />
                    <Input label="Effective From" type="date" value={modelForm.effectiveFrom} onChange={(e) => setModelForm({ ...modelForm, effectiveFrom: e.target.value })} />
                    <Input label="Effective To" type="date" value={modelForm.effectiveTo} onChange={(e) => setModelForm({ ...modelForm, effectiveTo: e.target.value })} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={createModelMut.isPending || updateModelMut.isPending}><Check className="mr-1 h-4 w-4" /> {editModelId ? 'Update' : 'Create'}</Button>
                    <Button type="button" variant="outline" onClick={() => { setShowModelForm(false); setEditModelId(null); setModelForm(EMPTY_COST_MODEL); }}><X className="mr-1 h-4 w-4" /> Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {deleteModelId && (
            <Card className="border-danger/50 bg-danger/5">
              <CardContent className="flex items-center gap-4 pt-6">
                <p className="text-sm">Are you sure you want to delete this cost model?</p>
                <div className="ml-auto flex gap-2">
                  <Button size="sm" variant="destructive" onClick={() => deleteModelMut.mutate(deleteModelId)} disabled={deleteModelMut.isPending}>Delete</Button>
                  <Button size="sm" variant="outline" onClick={() => setDeleteModelId(null)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              {modelsLoading ? (
                <div className="space-y-3 p-6">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Effective</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {models.length > 0 ? models.map((m: CostModel) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.name}</TableCell>
                        <TableCell><Badge variant="secondary" className="capitalize">{m.modelType?.replace('_', ' ')}</Badge></TableCell>
                        <TableCell>
                          <Badge className="bg-success/20 text-success">{m.effectiveTo ? 'Expiring' : 'Active'}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">{m.serviceType}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {m.effectiveFrom ? `${m.effectiveFrom} — ${m.effectiveTo || 'ongoing'}` : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditModel(m)} aria-label={`Edit ${m.name}`}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteModelId(m.id)} aria-label={`Delete ${m.name}`}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No cost models found</TableCell></TableRow>
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
