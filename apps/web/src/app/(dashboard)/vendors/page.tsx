'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, Star, Plus, Search, TrendingUp, Shield, Clock, Mail, Pencil, Trash2, Check, X } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { api, Vendor } from '@/lib/api';

const VENDOR_TYPES = ['hardware', 'software', 'service', 'cloud', 'consulting'];
const VENDOR_STATUSES = ['active', 'inactive', 'on_hold', 'blacklisted'];

type VendorFormData = Omit<Partial<Vendor>, 'id' | 'slaCompliancePercent' | 'onTimeDeliveryPercent' | 'rating' | 'totalSpend' | 'createdAt' | 'updatedAt'> & {
  name: string; type: string; status: string;
};
const EMPTY_FORM: VendorFormData = { name: '', type: 'software', status: 'active', contactName: '', contactEmail: '', contactPhone: '', website: '', address: '', notes: '' };

function statusColor(s: string) {
  return s === 'active' ? 'bg-success/20 text-success border-success'
    : s === 'on_hold' ? 'bg-warning/20 text-warning border-warning'
    : s === 'blacklisted' ? 'bg-danger/20 text-danger border-danger'
    : 'bg-muted text-muted-foreground';
}

function typeColor(t: string) {
  const map: Record<string, string> = {
    hardware: 'bg-info/20 text-info', software: 'bg-primary/20 text-primary',
    service: 'bg-success/20 text-success', cloud: 'bg-warning/20 text-warning',
    consulting: 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
  };
  return map[t] ?? 'bg-muted text-muted-foreground';
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn('h-3 w-3', i < Math.floor(rating) ? 'fill-warning text-warning' : i < rating ? 'fill-warning/50 text-warning' : 'text-muted-foreground/30')} />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function VendorsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VendorFormData>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['vendors', { search, typeFilter, statusFilter }],
    queryFn: () => api.getVendors({ search: search || undefined, type: typeFilter || undefined, status: statusFilter || undefined }).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (d: VendorFormData) => api.createVendor(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendors'] }); setShowForm(false); setForm(EMPTY_FORM); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, d }: { id: string; d: VendorFormData }) => api.updateVendor(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendors'] }); setEditingId(null); setForm(EMPTY_FORM); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteVendor(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendors'] }); setDeleteId(null); },
  });

  function openEdit(v: Vendor) {
    setEditingId(v.id);
    setForm({ name: v.name, type: v.type, status: v.status, contactName: v.contactName ?? '', contactEmail: v.contactEmail ?? '', contactPhone: v.contactPhone ?? '', website: v.website ?? '', address: v.address ?? '', notes: v.notes ?? '' });
    setShowForm(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingId) updateMutation.mutate({ id: editingId, d: form });
    else createMutation.mutate(form);
  }

  const vendors: Vendor[] = data?.data ?? [];
  const total = data?.total ?? 0;
  const active = vendors.filter(v => v.status === 'active');
  const avgSla = active.length ? active.reduce((s, v) => s + (v.slaCompliancePercent ?? 0), 0) / active.length : 0;
  const avgOtd = active.length ? active.reduce((s, v) => s + (v.onTimeDeliveryPercent ?? 0), 0) / active.length : 0;
  const totalSpend = vendors.reduce((s, v) => s + (v.totalSpend ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vendor Management</h1>
          <p className="text-muted-foreground">Manage vendor relationships, performance, and SLA compliance</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); }}>
          <Plus className="mr-1 h-4 w-4" /> Add Vendor
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{active.length}</div>
            <p className="text-xs text-muted-foreground">Of {total} total vendors</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-success">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg SLA Compliance</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgSla.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Across active vendors</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-info">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On-Time Delivery</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgOtd.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Average delivery rate</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-warning">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpend)}</div>
            <p className="text-xs text-muted-foreground">Year to date</p>
          </CardContent>
        </Card>
      </div>

      {/* Inline Form */}
      {(showForm || editingId) && (
        <Card>
          <CardHeader><CardTitle className="text-base">{editingId ? 'Edit Vendor' : 'New Vendor'}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Name *</label>
                <Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Vendor name" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Type *</label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{VENDOR_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Status</label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as 'active' | 'inactive' | 'on_hold' | 'blacklisted' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{VENDOR_STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Contact Name</label>
                <Input value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} placeholder="Full name" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Contact Email</label>
                <Input type="email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} placeholder="email@vendor.com" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Phone</label>
                <Input value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} placeholder="+1-555-0100" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Website</label>
                <Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://vendor.com" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Address</label>
                <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="City, Country" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Notes</label>
                <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />
              </div>
              <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  <Check className="mr-1 h-4 w-4" /> {editingId ? 'Save Changes' : 'Create Vendor'}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }}>
                  <X className="mr-1 h-4 w-4" /> Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search vendors..." className="pl-8" value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All types</SelectItem>
            {VENDOR_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            {VENDOR_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Delete confirm */}
      {deleteId && (
        <Card className="border-danger/50 bg-danger/5">
          <CardContent className="flex items-center justify-between py-3">
            <p className="text-sm">Delete this vendor? This cannot be undone.</p>
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleteId)}>Delete</Button>
              <Button size="sm" variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vendors</CardTitle>
          <CardDescription>All vendor records with performance metrics</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-px">{[1,2,3,4,5].map(i => <div key={i} className="h-12 animate-pulse bg-muted/40" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>SLA Compliance</TableHead>
                  <TableHead>On-Time</TableHead>
                  <TableHead>Total Spend</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">No vendors found</TableCell></TableRow>
                )}
                {vendors.map(v => (
                  <TableRow key={v.id} className="cursor-pointer hover:bg-muted/40" onClick={() => router.push(`/vendors/${v.id}`)}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{v.name}</p>
                        {v.contactEmail && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />{v.contactEmail}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell><Badge className={cn('capitalize', typeColor(v.type))}>{v.type}</Badge></TableCell>
                    <TableCell><Badge className={cn('capitalize', statusColor(v.status))}>{v.status}</Badge></TableCell>
                    <TableCell>{v.rating != null ? <Stars rating={v.rating} /> : '—'}</TableCell>
                    <TableCell>
                      {v.slaCompliancePercent != null && v.slaCompliancePercent > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                            <div className={cn('h-full rounded-full', v.slaCompliancePercent >= 95 ? 'bg-success' : v.slaCompliancePercent >= 80 ? 'bg-warning' : 'bg-danger')} style={{ width: `${Math.min(v.slaCompliancePercent, 100)}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{v.slaCompliancePercent.toFixed(1)}%</span>
                        </div>
                      ) : 'N/A'}
                    </TableCell>
                    <TableCell className="text-sm">{v.onTimeDeliveryPercent != null && v.onTimeDeliveryPercent > 0 ? `${v.onTimeDeliveryPercent.toFixed(1)}%` : 'N/A'}</TableCell>
                    <TableCell>{v.totalSpend != null ? formatCurrency(v.totalSpend) : '—'}</TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => openEdit(v)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => setDeleteId(v.id)}><Trash2 className="h-3.5 w-3.5 text-danger" /></Button>
                      </div>
                    </TableCell>
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
