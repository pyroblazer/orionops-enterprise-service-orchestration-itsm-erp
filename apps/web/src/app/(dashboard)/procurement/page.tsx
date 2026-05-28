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
import { ShoppingCart, FileSignature, Plus, Search, Package, AlertTriangle, Check, X, Pencil, Trash2, SendHorizontal } from 'lucide-react';
import { formatCurrency, formatDateTime, cn } from '@/lib/utils';
import { api, PurchaseRequest, Contract } from '@/lib/api';

const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const CURRENCIES = ['USD', 'EUR', 'GBP'];

function prStatusColor(s: string) {
  return s === 'approved' ? 'bg-success/20 text-success border-success'
    : s === 'submitted' ? 'bg-info/20 text-info border-info'
    : s === 'rejected' ? 'bg-danger/20 text-danger border-danger'
    : s === 'ordered' ? 'bg-primary/20 text-primary border-primary'
    : 'bg-muted text-muted-foreground';
}

function priorityColor(p: string) {
  return p === 'critical' ? 'bg-danger/20 text-danger' : p === 'high' ? 'bg-warning/20 text-warning' : p === 'medium' ? 'bg-info/20 text-info' : 'bg-muted text-muted-foreground';
}

function poStatusColor(s: string) {
  return s === 'received' ? 'bg-success/20 text-success border-success'
    : s === 'issued' ? 'bg-info/20 text-info border-info'
    : s === 'partial' ? 'bg-warning/20 text-warning border-warning'
    : s === 'cancelled' ? 'bg-danger/20 text-danger border-danger'
    : 'bg-muted text-muted-foreground';
}

function contractStatusColor(s: string) {
  return s === 'active' ? 'bg-success/20 text-success border-success'
    : s === 'expired' ? 'bg-danger/20 text-danger border-danger'
    : s === 'pending_renewal' ? 'bg-warning/20 text-warning border-warning'
    : 'bg-muted text-muted-foreground';
}

export default function ProcurementPage() {
  const qc = useQueryClient();

  // PR state
  const [prSearch, setPrSearch] = useState('');
  const [prStatus, setPrStatus] = useState('');
  const [prPriority, setPrPriority] = useState('');
  const [showPrForm, setShowPrForm] = useState(false);
  const [editPrId, setEditPrId] = useState<string | null>(null);
  const [prForm, setPrForm] = useState<Partial<PurchaseRequest> & { title: string; itemDescription: string; quantity: number; estimatedCost: number; currency: string }>({ title: '', description: '', itemDescription: '', quantity: 1, estimatedCost: 0, currency: 'USD', vendorId: '', priority: 'medium', requiredDate: '', justification: '' });
  const [deletePrId, setDeletePrId] = useState<string | null>(null);

  // PO state
  const [poStatus, setPoStatus] = useState('');

  // Contract state
  const [contractStatus, setContractStatus] = useState('');
  const [showContractForm, setShowContractForm] = useState(false);
  const [editContractId, setEditContractId] = useState<string | null>(null);
  const [contractForm, setContractForm] = useState<Partial<Contract> & { title: string; vendorId: string; startDate: string; endDate: string; value: number; currency: string; autoRenewal: boolean }>({ title: '', vendorId: '', startDate: '', endDate: '', value: 0, currency: 'USD', autoRenewal: false, termsUrl: '', notes: '' });
  const [deleteContractId, setDeleteContractId] = useState<string | null>(null);

  // Queries
  const { data: prsData, isLoading: loadingPrs } = useQuery({
    queryKey: ['purchase-requests', { prSearch, prStatus, prPriority }],
    queryFn: () => api.getPurchaseRequests({ search: prSearch || undefined, status: prStatus || undefined, priority: prPriority || undefined }).then(r => r.data),
  });
  const { data: posData, isLoading: loadingPos } = useQuery({
    queryKey: ['purchase-orders', { poStatus }],
    queryFn: () => api.getPurchaseOrders({ status: poStatus || undefined }).then(r => r.data),
  });
  const { data: contractsData, isLoading: loadingContracts } = useQuery({
    queryKey: ['contracts', { contractStatus }],
    queryFn: () => api.getContracts({ status: contractStatus || undefined }).then(r => r.data),
  });

  // PR mutations
  const createPr = useMutation({ mutationFn: () => api.createPurchaseRequest(prForm), onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchase-requests'] }); setShowPrForm(false); } });
  const updatePr = useMutation({ mutationFn: ({ id, d }: { id: string; d: Partial<PurchaseRequest> }) => api.updatePurchaseRequest(id, d as Partial<PurchaseRequest>), onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchase-requests'] }); setEditPrId(null); } });
  const deletePr = useMutation({ mutationFn: (id: string) => api.deletePurchaseRequest(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchase-requests'] }); setDeletePrId(null); } });
  const submitPr = useMutation({ mutationFn: (id: string) => api.submitPurchaseRequest(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase-requests'] }) });
  const createPo = useMutation({ mutationFn: (id: string) => api.createPOFromPR(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchase-requests'] }); qc.invalidateQueries({ queryKey: ['purchase-orders'] }); } });

  // Contract mutations
  const createContract = useMutation({ mutationFn: () => api.createContract(contractForm), onSuccess: () => { qc.invalidateQueries({ queryKey: ['contracts'] }); setShowContractForm(false); } });
  const updateContract = useMutation({ mutationFn: ({ id, d }: { id: string; d: typeof contractForm }) => api.updateContract(id, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['contracts'] }); setEditContractId(null); } });
  const deleteContract = useMutation({ mutationFn: (id: string) => api.deleteContract(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['contracts'] }); setDeleteContractId(null); } });

  const prs: PurchaseRequest[] = prsData?.data ?? [];
  const pos = posData?.data ?? [];
  const contracts: Contract[] = contractsData?.data ?? [];

  const totalPrValue = prs.reduce((s, p) => s + (p.estimatedCost ?? 0), 0);
  const pendingPrs = prs.filter(p => p.status === 'submitted').length;
  const activePosCount = pos.filter((p: { status: string }) => p.status === 'issued' || p.status === 'partial').length;
  const expiringSoon = contracts.filter(c => {
    if (!c.endDate) return false;
    const days = (new Date(c.endDate).getTime() - Date.now()) / 86400000;
    return days >= 0 && days <= 30;
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Procurement</h1>
          <p className="text-muted-foreground">Purchase requests, orders, and contracts</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-primary"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total PR Value</CardTitle><ShoppingCart className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(totalPrValue)}</div></CardContent></Card>
        <Card className="border-l-4 border-l-warning"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Pending Approval</CardTitle><AlertTriangle className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{pendingPrs}</div><p className="text-xs text-muted-foreground">Purchase requests</p></CardContent></Card>
        <Card className="border-l-4 border-l-info"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Active POs</CardTitle><Package className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{activePosCount}</div></CardContent></Card>
        <Card className="border-l-4 border-l-danger"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Expiring Contracts</CardTitle><FileSignature className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{expiringSoon}</div><p className="text-xs text-muted-foreground">Within 30 days</p></CardContent></Card>
      </div>

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests"><ShoppingCart className="mr-1 h-4 w-4" />Purchase Requests</TabsTrigger>
          <TabsTrigger value="orders"><Package className="mr-1 h-4 w-4" />Purchase Orders</TabsTrigger>
          <TabsTrigger value="contracts"><FileSignature className="mr-1 h-4 w-4" />Contracts</TabsTrigger>
        </TabsList>

        {/* PURCHASE REQUESTS */}
        <TabsContent value="requests" className="space-y-4 mt-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search requests..." className="pl-8" value={prSearch} onChange={e => setPrSearch(e.target.value)} />
            </div>
            <Select value={prStatus} onValueChange={setPrStatus}><SelectTrigger className="w-36"><SelectValue placeholder="All statuses" /></SelectTrigger><SelectContent><SelectItem value="">All statuses</SelectItem>{['draft','submitted','approved','rejected','ordered'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
            <Select value={prPriority} onValueChange={setPrPriority}><SelectTrigger className="w-36"><SelectValue placeholder="All priorities" /></SelectTrigger><SelectContent><SelectItem value="">All priorities</SelectItem>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
            <Button size="sm" onClick={() => { setShowPrForm(true); setEditPrId(null); }}><Plus className="mr-1 h-4 w-4" />New Request</Button>
          </div>

          {(showPrForm || editPrId) && (
            <Card>
              <CardHeader><CardTitle className="text-base">{editPrId ? 'Edit Purchase Request' : 'New Purchase Request'}</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={e => { e.preventDefault(); editPrId ? updatePr.mutate({ id: editPrId, d: prForm }) : createPr.mutate(); }} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1 sm:col-span-2 lg:col-span-1"><label className="text-sm font-medium">Title *</label><Input required value={prForm.title} onChange={e => setPrForm(f => ({ ...f, title: e.target.value }))} placeholder="Laptop procurement" /></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Priority</label><Select value={prForm.priority || 'medium'} onValueChange={v => setPrForm(f => ({ ...f, priority: v as 'critical' | 'high' | 'medium' | 'low' }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Estimated Cost</label><Input type="number" min={0} value={prForm.estimatedCost || ''} onChange={e => setPrForm(f => ({ ...f, estimatedCost: parseFloat(e.target.value) }))} /></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Currency</label><Select value={prForm.currency} onValueChange={v => setPrForm(f => ({ ...f, currency: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Quantity</label><Input type="number" min={1} value={prForm.quantity} onChange={e => setPrForm(f => ({ ...f, quantity: parseInt(e.target.value) }))} /></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Required Date</label><Input type="date" value={prForm.requiredDate} onChange={e => setPrForm(f => ({ ...f, requiredDate: e.target.value }))} /></div>
                  <div className="space-y-1 sm:col-span-2 lg:col-span-3"><label className="text-sm font-medium">Justification</label><Input value={prForm.justification} onChange={e => setPrForm(f => ({ ...f, justification: e.target.value }))} placeholder="Business justification" /></div>
                  <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
                    <Button type="submit" disabled={createPr.isPending || updatePr.isPending}><Check className="mr-1 h-4 w-4" />{editPrId ? 'Save' : 'Create'}</Button>
                    <Button type="button" variant="outline" onClick={() => { setShowPrForm(false); setEditPrId(null); }}><X className="mr-1 h-4 w-4" />Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {deletePrId && <Card className="border-danger/50 bg-danger/5"><CardContent className="flex items-center justify-between py-3"><p className="text-sm">Delete this purchase request?</p><div className="flex gap-2"><Button size="sm" variant="destructive" disabled={deletePr.isPending} onClick={() => deletePr.mutate(deletePrId)}>Delete</Button><Button size="sm" variant="outline" onClick={() => setDeletePrId(null)}>Cancel</Button></div></CardContent></Card>}

          <Card><CardContent className="p-0">
            {loadingPrs ? <div className="space-y-px">{[1,2,3].map(i => <div key={i} className="h-12 animate-pulse bg-muted/40" />)}</div> : (
              <Table>
                <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead><TableHead>Est. Cost</TableHead><TableHead>Created</TableHead><TableHead className="w-48">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {prs.length === 0 && <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No purchase requests found</TableCell></TableRow>}
                  {prs.map(pr => (
                    <TableRow key={pr.id}>
                      <TableCell className="font-medium">{pr.title}</TableCell>
                      <TableCell><Badge className={cn('capitalize', priorityColor(pr.priority))}>{pr.priority}</Badge></TableCell>
                      <TableCell><Badge className={cn('capitalize', prStatusColor(pr.status))}>{pr.status}</Badge></TableCell>
                      <TableCell>{formatCurrency(pr.estimatedCost ?? 0)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{pr.createdAt ? formatDateTime(pr.createdAt) : '—'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {pr.status === 'draft' && <Button size="sm" variant="outline" className="text-xs px-2 py-1 h-7" disabled={submitPr.isPending} onClick={() => submitPr.mutate(pr.id)}><SendHorizontal className="h-3 w-3 mr-1" />Submit</Button>}
                          {pr.status === 'approved' && <Button size="sm" variant="outline" className="text-xs px-2 py-1 h-7" disabled={createPo.isPending} onClick={() => createPo.mutate(pr.id)}>Create PO</Button>}
                          <Button size="icon" variant="ghost" onClick={() => { setEditPrId(pr.id); setPrForm({ title: pr.title ?? '', description: '', itemDescription: '', quantity: pr.quantity ?? 1, estimatedCost: pr.estimatedCost ?? 0, currency: pr.currency ?? 'USD', vendorId: pr.vendorId ?? '', priority: pr.priority ?? 'medium', requiredDate: pr.requiredDate?.slice(0, 10) ?? '', justification: pr.justification ?? '' }); setShowPrForm(false); }}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => setDeletePrId(pr.id)}><Trash2 className="h-3.5 w-3.5 text-danger" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent></Card>
        </TabsContent>

        {/* PURCHASE ORDERS */}
        <TabsContent value="orders" className="space-y-4 mt-4">
          <div className="flex items-center gap-3">
            <Select value={poStatus} onValueChange={setPoStatus}><SelectTrigger className="w-36"><SelectValue placeholder="All statuses" /></SelectTrigger><SelectContent><SelectItem value="">All statuses</SelectItem>{['issued','partial','received','closed','cancelled'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
          </div>
          <Card><CardContent className="p-0">
            {loadingPos ? <div className="space-y-px">{[1,2,3].map(i => <div key={i} className="h-12 animate-pulse bg-muted/40" />)}</div> : (
              <Table>
                <TableHeader><TableRow><TableHead>PO Number</TableHead><TableHead>Vendor</TableHead><TableHead>Status</TableHead><TableHead>Total Amount</TableHead><TableHead>Expected Delivery</TableHead></TableRow></TableHeader>
                <TableBody>
                  {pos.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No purchase orders found</TableCell></TableRow>}
                  {(pos as { id: string; poNumber?: string; vendorName?: string; status: string; totalAmount?: number; expectedDelivery?: string }[]).map(po => (
                    <TableRow key={po.id}>
                      <TableCell className="font-mono font-medium">{po.poNumber ?? po.id.slice(0, 8)}</TableCell>
                      <TableCell>{po.vendorName ?? '—'}</TableCell>
                      <TableCell><Badge className={cn('capitalize', poStatusColor(po.status))}>{po.status}</Badge></TableCell>
                      <TableCell>{po.totalAmount != null ? formatCurrency(po.totalAmount) : '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{po.expectedDelivery ? formatDateTime(po.expectedDelivery) : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent></Card>
        </TabsContent>

        {/* CONTRACTS */}
        <TabsContent value="contracts" className="space-y-4 mt-4">
          <div className="flex items-center gap-3">
            <Select value={contractStatus} onValueChange={setContractStatus}><SelectTrigger className="w-44"><SelectValue placeholder="All statuses" /></SelectTrigger><SelectContent><SelectItem value="">All statuses</SelectItem>{['active','expired','pending_renewal'].map(s => <SelectItem key={s} value={s}>{s.replace('_',' ')}</SelectItem>)}</SelectContent></Select>
            <Button size="sm" className="ml-auto" onClick={() => { setShowContractForm(true); setEditContractId(null); }}><Plus className="mr-1 h-4 w-4" />New Contract</Button>
          </div>

          {(showContractForm || editContractId) && (
            <Card>
              <CardHeader><CardTitle className="text-base">{editContractId ? 'Edit Contract' : 'New Contract'}</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={e => { e.preventDefault(); editContractId ? updateContract.mutate({ id: editContractId, d: contractForm }) : createContract.mutate(); }} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1"><label className="text-sm font-medium">Title *</label><Input required value={contractForm.title} onChange={e => setContractForm(f => ({ ...f, title: e.target.value }))} placeholder="Annual SaaS agreement" /></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Vendor ID</label><Input value={contractForm.vendorId} onChange={e => setContractForm(f => ({ ...f, vendorId: e.target.value }))} placeholder="Vendor UUID" /></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Contract Value</label><Input type="number" min={0} value={contractForm.value || ''} onChange={e => setContractForm(f => ({ ...f, value: parseFloat(e.target.value) }))} /></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Currency</label><Select value={contractForm.currency} onValueChange={v => setContractForm(f => ({ ...f, currency: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Start Date</label><Input type="date" value={contractForm.startDate} onChange={e => setContractForm(f => ({ ...f, startDate: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="text-sm font-medium">End Date</label><Input type="date" value={contractForm.endDate} onChange={e => setContractForm(f => ({ ...f, endDate: e.target.value }))} /></div>
                  <div className="space-y-1 flex items-center gap-2 pt-5">
                    <input type="checkbox" id="autoRenewal" checked={contractForm.autoRenewal} onChange={e => setContractForm(f => ({ ...f, autoRenewal: e.target.checked }))} className="h-4 w-4" />
                    <label htmlFor="autoRenewal" className="text-sm font-medium">Auto-renewal</label>
                  </div>
                  <div className="space-y-1"><label className="text-sm font-medium">Terms URL</label><Input value={contractForm.termsUrl} onChange={e => setContractForm(f => ({ ...f, termsUrl: e.target.value }))} placeholder="https://" /></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Notes</label><Input value={contractForm.notes} onChange={e => setContractForm(f => ({ ...f, notes: e.target.value }))} /></div>
                  <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
                    <Button type="submit" disabled={createContract.isPending || updateContract.isPending}><Check className="mr-1 h-4 w-4" />{editContractId ? 'Save' : 'Create'}</Button>
                    <Button type="button" variant="outline" onClick={() => { setShowContractForm(false); setEditContractId(null); }}><X className="mr-1 h-4 w-4" />Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {deleteContractId && <Card className="border-danger/50 bg-danger/5"><CardContent className="flex items-center justify-between py-3"><p className="text-sm">Delete this contract?</p><div className="flex gap-2"><Button size="sm" variant="destructive" disabled={deleteContract.isPending} onClick={() => deleteContract.mutate(deleteContractId)}>Delete</Button><Button size="sm" variant="outline" onClick={() => setDeleteContractId(null)}>Cancel</Button></div></CardContent></Card>}

          <Card><CardContent className="p-0">
            {loadingContracts ? <div className="space-y-px">{[1,2,3].map(i => <div key={i} className="h-12 animate-pulse bg-muted/40" />)}</div> : (
              <Table>
                <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Vendor</TableHead><TableHead>Status</TableHead><TableHead>Value</TableHead><TableHead>End Date</TableHead><TableHead className="w-20">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {contracts.length === 0 && <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No contracts found</TableCell></TableRow>}
                  {contracts.map(c => {
                    const daysToExpiry = c.endDate ? (new Date(c.endDate).getTime() - Date.now()) / 86400000 : null;
                    const expiring = daysToExpiry != null && daysToExpiry >= 0 && daysToExpiry <= 30;
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">
                          {c.title}
                          {expiring && <Badge className="ml-2 bg-warning/20 text-warning border-warning text-xs">Expiring soon</Badge>}
                        </TableCell>
                        <TableCell>{c.vendorName ?? c.vendorId ?? '—'}</TableCell>
                        <TableCell><Badge className={cn('capitalize', contractStatusColor(c.status ?? 'active'))}>{(c.status ?? 'active').replace('_',' ')}</Badge></TableCell>
                        <TableCell>{c.value != null ? formatCurrency(c.value) : '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.endDate ? formatDateTime(c.endDate) : '—'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => { setEditContractId(c.id); setContractForm({ title: c.title ?? '', vendorId: c.vendorId ?? '', startDate: c.startDate?.slice(0, 10) ?? '', endDate: c.endDate?.slice(0, 10) ?? '', value: c.value ?? 0, currency: c.currency ?? 'USD', autoRenewal: c.autoRenewal ?? false, termsUrl: c.termsUrl ?? '', notes: c.notes ?? '' }); setShowContractForm(false); }}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => setDeleteContractId(c.id)}><Trash2 className="h-3.5 w-3.5 text-danger" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
