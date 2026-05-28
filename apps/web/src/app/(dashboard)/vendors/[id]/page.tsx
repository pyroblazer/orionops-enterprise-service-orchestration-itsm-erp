'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Building2, Star, TrendingUp, Check, X, Plus } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { api, Vendor } from '@/lib/api';

function statusColor(s: string) {
  return s === 'active' ? 'bg-success/20 text-success border-success'
    : s === 'pending' ? 'bg-warning/20 text-warning border-warning'
    : s === 'suspended' ? 'bg-danger/20 text-danger border-danger'
    : 'bg-muted text-muted-foreground';
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn('h-4 w-4', i < Math.floor(rating) ? 'fill-warning text-warning' : i < rating ? 'fill-warning/50 text-warning' : 'text-muted-foreground/30')} />
      ))}
      <span className="text-sm text-muted-foreground ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function VendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Vendor>>({});
  const [showPerfForm, setShowPerfForm] = useState(false);
  const [perfForm, setPerfForm] = useState({ rating: 4, slaCompliancePercent: 95, onTimeDeliveryPercent: 95, notes: '', evaluationDate: new Date().toISOString().slice(0, 10) });

  const { data: vendor, isLoading } = useQuery({
    queryKey: ['vendor', id],
    queryFn: () => api.getVendor(id).then(r => r.data.data),
    enabled: !!id,
  });

  const { data: performance } = useQuery({
    queryKey: ['vendor-performance', id],
    queryFn: () => api.getVendorPerformance(id).then(r => r.data.data),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (d: Partial<Vendor>) => api.updateVendor(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendor', id] }); setEditing(false); },
  });

  const perfMutation = useMutation({
    mutationFn: () => api.recordVendorPerformance(id, perfForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendor-performance', id] });
      qc.invalidateQueries({ queryKey: ['vendor', id] });
      setShowPerfForm(false);
      setPerfForm({ rating: 4, slaCompliancePercent: 95, onTimeDeliveryPercent: 95, notes: '', evaluationDate: new Date().toISOString().slice(0, 10) });
    },
  });

  if (isLoading) return <div className="p-8 text-muted-foreground animate-pulse">Loading…</div>;
  if (!vendor) return <div className="p-8 text-muted-foreground">Vendor not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/vendors')} aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Building2 className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-2xl font-bold">{vendor.name}</h1>
        <Badge className={cn('capitalize ml-2', statusColor(vendor.status))}>{vendor.status}</Badge>
        <Badge variant="outline" className="capitalize">{vendor.type}</Badge>
        <Button variant="outline" size="sm" className="ml-auto" onClick={() => { setEditing(true); setEditForm({ name: vendor.name, type: vendor.type, status: vendor.status, contactName: vendor.contactName, contactEmail: vendor.contactEmail, contactPhone: vendor.contactPhone, website: vendor.website, address: vendor.address, notes: vendor.notes }); }}>
          Edit
        </Button>
      </div>

      {editing && (
        <Card>
          <CardHeader><CardTitle className="text-base">Edit Vendor</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={e => { e.preventDefault(); updateMutation.mutate(editForm); }} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Name</label>
                <Input value={editForm.name ?? ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Status</label>
                <Select value={editForm.status ?? ''} onValueChange={v => setEditForm(f => ({ ...f, status: v as Vendor['status'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{['active','inactive','pending','suspended'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Contact Name</label>
                <Input value={editForm.contactName ?? ''} onChange={e => setEditForm(f => ({ ...f, contactName: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Contact Email</label>
                <Input type="email" value={editForm.contactEmail ?? ''} onChange={e => setEditForm(f => ({ ...f, contactEmail: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Website</label>
                <Input value={editForm.website ?? ''} onChange={e => setEditForm(f => ({ ...f, website: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Notes</label>
                <Input value={editForm.notes ?? ''} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
                <Button type="submit" disabled={updateMutation.isPending}><Check className="mr-1 h-4 w-4" /> Save</Button>
                <Button type="button" variant="outline" onClick={() => setEditing(false)}><X className="mr-1 h-4 w-4" /> Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Contact</p><p className="font-semibold mt-1">{vendor.contactName ?? '—'}</p><p className="text-xs text-muted-foreground">{vendor.contactEmail ?? ''}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Rating</p><div className="mt-1">{vendor.rating !== undefined ? <Stars rating={vendor.rating} /> : <span className="font-semibold">—</span>}</div></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">SLA Compliance</p><p className="font-semibold mt-1">{vendor.slaCompliancePercent !== undefined ? `${vendor.slaCompliancePercent.toFixed(1)}%` : '—'}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total Spend</p><p className="font-semibold mt-1">{vendor.totalSpend !== undefined ? formatCurrency(vendor.totalSpend) : '—'}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="performance">
        <TabsList>
          <TabsTrigger value="performance"><TrendingUp className="mr-1 h-4 w-4" /> Performance</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Performance History</h2>
            <Button size="sm" onClick={() => setShowPerfForm(v => !v)}>
              <Plus className="mr-1 h-4 w-4" /> Record Performance
            </Button>
          </div>

          {showPerfForm && (
            <Card>
              <CardContent className="pt-4">
                <form onSubmit={e => { e.preventDefault(); perfMutation.mutate(); }} className="flex flex-wrap gap-3 items-end">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Rating (1–5)</label>
                    <Input type="number" min={1} max={5} step={0.1} value={perfForm.rating} onChange={e => setPerfForm(f => ({ ...f, rating: parseFloat(e.target.value) }))} className="w-24" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">SLA Compliance %</label>
                    <Input type="number" min={0} max={100} step={0.1} value={perfForm.slaCompliancePercent} onChange={e => setPerfForm(f => ({ ...f, slaCompliancePercent: parseFloat(e.target.value) }))} className="w-28" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">On-Time Delivery %</label>
                    <Input type="number" min={0} max={100} step={0.1} value={perfForm.onTimeDeliveryPercent} onChange={e => setPerfForm(f => ({ ...f, onTimeDeliveryPercent: parseFloat(e.target.value) }))} className="w-28" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Evaluation Date</label>
                    <Input type="date" value={perfForm.evaluationDate} onChange={e => setPerfForm(f => ({ ...f, evaluationDate: e.target.value }))} className="w-40" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Notes</label>
                    <Input value={perfForm.notes} onChange={e => setPerfForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" className="w-48" />
                  </div>
                  <Button type="submit" disabled={perfMutation.isPending}><Check className="mr-1 h-4 w-4" /> Save</Button>
                  <Button type="button" variant="outline" onClick={() => setShowPerfForm(false)}><X className="mr-1 h-4 w-4" /> Cancel</Button>
                </form>
              </CardContent>
            </Card>
          )}

          {!performance || performance.entries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No performance records yet. Record one above.</p>
          ) : (
            <div className="rounded-lg border">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Rating</th>
                  <th className="px-4 py-2 text-left">SLA %</th>
                  <th className="px-4 py-2 text-left">On-Time %</th>
                  <th className="px-4 py-2 text-left">Notes</th>
                </tr></thead>
                <tbody>
                  {performance.entries.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="px-4 py-2">{p.evaluationDate ? new Date(p.evaluationDate).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-2"><Stars rating={p.rating} /></td>
                      <td className="px-4 py-2">{`${p.slaCompliancePercent.toFixed(1)}%`}</td>
                      <td className="px-4 py-2">{`${p.onTimeDeliveryPercent.toFixed(1)}%`}</td>
                      <td className="px-4 py-2 text-muted-foreground">{p.notes ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="details" className="mt-4">
          <Card>
            <CardContent className="pt-4 grid gap-3 sm:grid-cols-2">
              <div><p className="text-xs text-muted-foreground">Phone</p><p className="font-medium mt-1">{vendor.contactPhone ?? '—'}</p></div>
              <div><p className="text-xs text-muted-foreground">Website</p><p className="font-medium mt-1">{vendor.website ? <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-primary underline">{vendor.website}</a> : '—'}</p></div>
              <div><p className="text-xs text-muted-foreground">Address</p><p className="font-medium mt-1">{vendor.address ?? '—'}</p></div>
              <div><p className="text-xs text-muted-foreground">On-Time Delivery</p><p className="font-medium mt-1">{vendor.onTimeDeliveryPercent !== undefined ? `${vendor.onTimeDeliveryPercent.toFixed(1)}%` : '—'}</p></div>
              {vendor.notes && <div className="sm:col-span-2"><p className="text-xs text-muted-foreground">Notes</p><p className="mt-1 text-sm">{vendor.notes}</p></div>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
