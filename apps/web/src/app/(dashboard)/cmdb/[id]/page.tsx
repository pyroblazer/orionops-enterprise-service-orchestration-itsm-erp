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
import { ArrowLeft, Boxes, Link2, AlertTriangle, Plus, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, CMDBConfigItem } from '@/lib/api';

const RELATION_TYPES = ['depends_on', 'hosts', 'connects_to', 'contains'];

function statusColor(s: string) {
  return s === 'active' ? 'bg-success/20 text-success border-success'
    : s === 'maintenance' ? 'bg-warning/20 text-warning border-warning'
    : s === 'decommissioned' ? 'bg-danger/20 text-danger border-danger'
    : 'bg-muted text-muted-foreground';
}

export default function CMDBDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const [showRelForm, setShowRelForm] = useState(false);
  const [relForm, setRelForm] = useState({ targetId: '', type: 'depends_on', description: '' });
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<CMDBConfigItem>>({});

  const { data: ciData, isLoading } = useQuery({
    queryKey: ['cmdb-item', id],
    queryFn: () => api.getCMDBItem(id).then(r => r.data.data),
    enabled: !!id,
  });

  const { data: relationships } = useQuery({
    queryKey: ['cmdb-relationships', id],
    queryFn: () => api.getCMDBRelationships(id).then(r => r.data.data),
    enabled: !!id,
  });

  const { data: impact } = useQuery({
    queryKey: ['cmdb-impact', id],
    queryFn: () => api.getCMDBImpactAnalysis(id).then(r => r.data.data),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (d: Partial<CMDBConfigItem>) => api.updateCMDBItem(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cmdb-item', id] }); setEditing(false); },
  });

  const relMutation = useMutation({
    mutationFn: () => api.relateCMDBItems(id, relForm.targetId, { type: relForm.type, description: relForm.description }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cmdb-relationships', id] }); setShowRelForm(false); setRelForm({ targetId: '', type: 'depends_on', description: '' }); },
  });

  if (isLoading) return <div className="p-8 text-muted-foreground animate-pulse">Loading…</div>;
  if (!ciData) return <div className="p-8 text-muted-foreground">Configuration item not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/cmdb')} aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Boxes className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold">{ciData.name}</h1>
        </div>
        <Badge className={cn('capitalize ml-2', statusColor(ciData.status))}>{ciData.status}</Badge>
        <Button variant="outline" size="sm" className="ml-auto" onClick={() => { setEditing(true); setEditForm({ name: ciData.name, type: ciData.type, status: ciData.status, environment: ciData.environment, owner: ciData.owner, description: ciData.description }); }}>
          Edit
        </Button>
      </div>

      {editing && (
        <Card>
          <CardHeader><CardTitle className="text-base">Edit CI</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={e => { e.preventDefault(); updateMutation.mutate(editForm); }} className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Name</label>
                <Input value={editForm.name ?? ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Owner</label>
                <Input value={editForm.owner ?? ''} onChange={e => setEditForm(f => ({ ...f, owner: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Status</label>
                <Select value={editForm.status ?? ''} onValueChange={v => setEditForm(f => ({ ...f, status: v as CMDBConfigItem['status'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['active','inactive','maintenance','decommissioned'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-sm font-medium">Description</label>
                <Input value={editForm.description ?? ''} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={updateMutation.isPending}><Check className="mr-1 h-4 w-4" /> Save</Button>
                <Button type="button" variant="outline" onClick={() => setEditing(false)}><X className="mr-1 h-4 w-4" /> Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Type</p><p className="font-semibold capitalize mt-1">{ciData.type.replace('_', ' ')}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Environment</p><p className="font-semibold capitalize mt-1">{ciData.environment}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Owner</p><p className="font-semibold mt-1">{ciData.owner ?? '—'}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Relationships</p><p className="font-semibold mt-1">{relationships?.length ?? 0}</p></CardContent></Card>
      </div>

      {ciData.description && (
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">{ciData.description}</p></CardContent></Card>
      )}

      <Tabs defaultValue="relationships">
        <TabsList>
          <TabsTrigger value="relationships"><Link2 className="mr-1 h-4 w-4" /> Relationships</TabsTrigger>
          <TabsTrigger value="impact"><AlertTriangle className="mr-1 h-4 w-4" /> Impact Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="relationships" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">CI Relationships</h2>
            <Button size="sm" onClick={() => setShowRelForm(v => !v)}>
              <Plus className="mr-1 h-4 w-4" /> Add Relationship
            </Button>
          </div>

          {showRelForm && (
            <Card>
              <CardContent className="pt-4">
                <form onSubmit={e => { e.preventDefault(); relMutation.mutate(); }} className="flex flex-wrap gap-3 items-end">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Target CI ID *</label>
                    <Input required value={relForm.targetId} onChange={e => setRelForm(f => ({ ...f, targetId: e.target.value }))} placeholder="UUID of target CI" className="w-64" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Relationship Type</label>
                    <Select value={relForm.type} onValueChange={v => setRelForm(f => ({ ...f, type: v }))}>
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>{RELATION_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Description</label>
                    <Input value={relForm.description} onChange={e => setRelForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional" className="w-48" />
                  </div>
                  <Button type="submit" disabled={relMutation.isPending}><Check className="mr-1 h-4 w-4" /> Add</Button>
                  <Button type="button" variant="outline" onClick={() => setShowRelForm(false)}><X className="mr-1 h-4 w-4" /> Cancel</Button>
                </form>
              </CardContent>
            </Card>
          )}

          {!relationships || relationships.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No relationships defined. Add one above.</p>
          ) : (
            <div className="rounded-lg border">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium">Target CI</th>
                  <th className="px-4 py-2 text-left font-medium">Relationship</th>
                  <th className="px-4 py-2 text-left font-medium">Description</th>
                </tr></thead>
                <tbody>
                  {relationships.map((r, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2 font-medium">{r.targetName || r.targetId}</td>
                      <td className="px-4 py-2"><Badge variant="outline" className="capitalize">{r.type.replace('_', ' ')}</Badge></td>
                      <td className="px-4 py-2 text-muted-foreground">{r.description ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="impact" className="mt-4 space-y-4">
          <h2 className="font-semibold">Change Impact Analysis</h2>
          {!impact ? (
            <p className="text-sm text-muted-foreground">Loading impact analysis…</p>
          ) : (
            <>
              {impact.affectedCIs.length === 0 && impact.affectedServices.length === 0 ? (
                <p className="text-sm text-muted-foreground">No downstream dependencies found.</p>
              ) : (
                <div className="space-y-4">
                  {impact.affectedCIs.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Affected Configuration Items ({impact.affectedCIs.length})</h3>
                      <div className="rounded-lg border">
                        <table className="w-full text-sm">
                          <thead><tr className="border-b bg-muted/50">
                            <th className="px-4 py-2 text-left">CI Name</th>
                            <th className="px-4 py-2 text-left">Type</th>
                            <th className="px-4 py-2 text-left">Impact</th>
                          </tr></thead>
                          <tbody>
                            {impact.affectedCIs.map(ci => (
                              <tr key={ci.id} className="border-b last:border-0">
                                <td className="px-4 py-2 font-medium">{ci.name}</td>
                                <td className="px-4 py-2 capitalize">{ci.type.replace('_', ' ')}</td>
                                <td className="px-4 py-2"><Badge variant="outline" className="capitalize">{ci.impactLevel}</Badge></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  {impact.affectedServices.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Affected Services ({impact.affectedServices.length})</h3>
                      <ul className="space-y-1">
                        {impact.affectedServices.map(s => (
                          <li key={s.id} className="flex items-center gap-2 text-sm">
                            <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                            {s.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
