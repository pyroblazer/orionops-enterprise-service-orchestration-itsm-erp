'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Zap, AlertTriangle, Clock, CheckCircle, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, SLADefinition, SLAInstance, Priority } from '@/lib/api';

function formatMinutes(m: number): string {
  if (m < 60) return `${m}m`;
  if (m < 1440) return `${Math.floor(m / 60)}h ${m % 60 > 0 ? `${m % 60}m` : ''}`.trim();
  return `${Math.floor(m / 1440)}d ${Math.floor((m % 1440) / 60)}h`.trim();
}

function statusColor(s: string) {
  return s === 'active' ? 'bg-primary/20 text-primary'
    : s === 'met' ? 'bg-success/20 text-success'
    : s === 'breached' ? 'bg-danger/20 text-danger'
    : 'bg-warning/20 text-warning';
}

function priorityColor(p: string) {
  return p === 'critical' ? 'bg-danger/20 text-danger'
    : p === 'high' ? 'bg-warning/20 text-warning'
    : p === 'medium' ? 'bg-primary/20 text-primary'
    : 'bg-success/20 text-success';
}

type DefForm = { name: string; description: string; priority: Priority; responseTimeMinutes: number; resolutionTimeMinutes: number; businessHoursOnly: boolean; escalationThresholdPercent: number };
const EMPTY: DefForm = { name: '', description: '', priority: 'medium', responseTimeMinutes: 120, resolutionTimeMinutes: 1440, businessHoursOnly: false, escalationThresholdPercent: 80 };

type ApplyForm = { definitionId: string; targetEntityId: string; targetType: string };

export default function SLAPage() {
  const qc = useQueryClient();
  const [instanceStatus, setInstanceStatus] = useState('');
  const [showDefForm, setShowDefForm] = useState(false);
  const [editingDefId, setEditingDefId] = useState<string | null>(null);
  const [defForm, setDefForm] = useState<DefForm>(EMPTY);
  const [deleteDefId, setDeleteDefId] = useState<string | null>(null);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applyForm, setApplyForm] = useState<ApplyForm>({ definitionId: '', targetEntityId: '', targetType: 'incident' });

  const { data: defsData, isLoading: defsLoading } = useQuery({
    queryKey: ['sla-definitions'],
    queryFn: () => api.getSLADefinitions().then(r => r.data.data ?? []),
  });

  const { data: instancesData, isLoading: instancesLoading } = useQuery({
    queryKey: ['sla-instances', instanceStatus],
    queryFn: () => api.getSLAInstances({ status: instanceStatus || undefined }).then(r => r.data),
  });

  const createMut = useMutation({
    mutationFn: (d: DefForm) => api.createSLADefinition(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sla-definitions'] }); setShowDefForm(false); setDefForm(EMPTY); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, d }: { id: string; d: DefForm }) => api.updateSLADefinition(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sla-definitions'] }); setEditingDefId(null); setDefForm(EMPTY); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.deleteSLADefinition(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sla-definitions'] }); setDeleteDefId(null); },
  });

  const applyMut = useMutation({
    mutationFn: (d: ApplyForm) => api.applySLA(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sla-instances'] }); setShowApplyForm(false); setApplyForm({ definitionId: '', targetEntityId: '', targetType: 'incident' }); },
  });

  const pauseMut = useMutation({
    mutationFn: (id: string) => api.pauseSLAInstance(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sla-instances'] }),
  });

  const resumeMut = useMutation({
    mutationFn: (id: string) => api.resumeSLAInstance(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sla-instances'] }),
  });

  const defs = defsData ?? [];
  const instances = instancesData?.data ?? [];
  const active = instances.filter(i => i.status === 'active');
  const breached = instances.filter(i => i.status === 'breached');
  const met = instances.filter(i => i.status === 'met');
  const atRisk = active.filter(i => {
    if (!i.remainingMinutes || !i.elapsedMinutes) return false;
    return i.elapsedMinutes / (i.elapsedMinutes + i.remainingMinutes) > 0.7;
  });

  function openEditDef(def: SLADefinition) {
    setEditingDefId(def.id);
    setDefForm({ name: def.name, description: def.description, priority: def.priority, responseTimeMinutes: def.responseTimeMinutes ?? 120, resolutionTimeMinutes: def.resolutionTimeMinutes ?? 1440, businessHoursOnly: def.businessHoursOnly, escalationThresholdPercent: def.escalationThresholdPercent ?? 80 });
    setShowDefForm(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">SLA Dashboard</h1>
        <p className="text-muted-foreground">Monitor service level agreements and compliance</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active SLAs</CardTitle><Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{active.length}</div><p className="text-xs text-muted-foreground">Currently tracked</p></CardContent>
        </Card>
        <Card className="border-l-4 border-l-danger">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Breached</CardTitle><AlertTriangle className="h-4 w-4 text-danger" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-danger">{breached.length}</div><p className="text-xs text-muted-foreground">SLA violations</p></CardContent>
        </Card>
        <Card className="border-l-4 border-l-success">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Met</CardTitle><CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-success">{met.length}</div><p className="text-xs text-muted-foreground">Successfully completed</p></CardContent>
        </Card>
        <Card className="border-l-4 border-l-warning">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle><Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-warning">{atRisk.length}</div><p className="text-xs text-muted-foreground">Approaching deadline</p></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Active Instances</TabsTrigger>
          <TabsTrigger value="definitions">Definitions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <Select value={instanceStatus} onValueChange={setInstanceStatus}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                {['active','met','breached','paused'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={() => setShowApplyForm(v => !v)}>
              <Plus className="mr-1 h-4 w-4" /> Apply SLA
            </Button>
          </div>

          {showApplyForm && (
            <Card>
              <CardContent className="pt-4">
                <form onSubmit={e => { e.preventDefault(); applyMut.mutate(applyForm); }} className="flex flex-wrap gap-3 items-end">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Definition *</label>
                    <Select required value={applyForm.definitionId} onValueChange={v => setApplyForm(f => ({ ...f, definitionId: v }))}>
                      <SelectTrigger className="w-56"><SelectValue placeholder="Select definition" /></SelectTrigger>
                      <SelectContent>{defs.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Target Type</label>
                    <Select value={applyForm.targetType} onValueChange={v => setApplyForm(f => ({ ...f, targetType: v }))}>
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>{['incident','problem','change','request'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Target Entity ID *</label>
                    <Input required value={applyForm.targetEntityId} onChange={e => setApplyForm(f => ({ ...f, targetEntityId: e.target.value }))} placeholder="UUID" className="w-56" />
                  </div>
                  <Button type="submit" disabled={applyMut.isPending}><Check className="mr-1 h-4 w-4" /> Apply</Button>
                  <Button type="button" variant="outline" onClick={() => setShowApplyForm(false)}><X className="mr-1 h-4 w-4" /> Cancel</Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Breached first */}
          {breached.length > 0 && (
            <Card className="border-danger/40">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-danger flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Breached SLAs ({breached.length})</CardTitle></CardHeader>
              <CardContent className="p-0">
                <SLAInstanceTable instances={breached} onPause={pauseMut.mutate} onResume={resumeMut.mutate} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>All SLA Instances</CardTitle>
              <CardDescription>{instancesData?.total ?? 0} instances total</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {instancesLoading ? (
                <div className="space-y-px">{[1,2,3].map(i => <div key={i} className="h-12 animate-pulse bg-muted/40" />)}</div>
              ) : (
                <SLAInstanceTable instances={instances} onPause={pauseMut.mutate} onResume={resumeMut.mutate} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="definitions" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">SLA Definitions</h2>
            <Button size="sm" onClick={() => { setShowDefForm(true); setEditingDefId(null); setDefForm(EMPTY); }}>
              <Plus className="mr-1 h-4 w-4" /> New Definition
            </Button>
          </div>

          {deleteDefId && (
            <Card className="border-danger/50 bg-danger/5">
              <CardContent className="flex items-center justify-between py-3">
                <p className="text-sm">Delete this SLA definition?</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" disabled={deleteMut.isPending} onClick={() => deleteMut.mutate(deleteDefId)}>Delete</Button>
                  <Button size="sm" variant="outline" onClick={() => setDeleteDefId(null)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {(showDefForm || editingDefId) && (
            <Card>
              <CardHeader><CardTitle className="text-base">{editingDefId ? 'Edit SLA Definition' : 'New SLA Definition'}</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={e => { e.preventDefault(); editingDefId ? updateMut.mutate({ id: editingDefId, d: defForm }) : createMut.mutate(defForm); }}
                  className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                    <label className="text-sm font-medium">Name *</label>
                    <Input required value={defForm.name} onChange={e => setDefForm(f => ({ ...f, name: e.target.value }))} placeholder="Critical Incident Response" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Priority</label>
                    <Select value={defForm.priority} onValueChange={v => setDefForm(f => ({ ...f, priority: v as Priority }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{['critical','high','medium','low'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Response Time (min) *</label>
                    <Input required type="number" min={1} value={defForm.responseTimeMinutes} onChange={e => setDefForm(f => ({ ...f, responseTimeMinutes: Number(e.target.value) }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Resolution Time (min) *</label>
                    <Input required type="number" min={1} value={defForm.resolutionTimeMinutes} onChange={e => setDefForm(f => ({ ...f, resolutionTimeMinutes: Number(e.target.value) }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Escalation Threshold %</label>
                    <Input type="number" min={0} max={100} value={defForm.escalationThresholdPercent} onChange={e => setDefForm(f => ({ ...f, escalationThresholdPercent: Number(e.target.value) }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Description</label>
                    <Input value={defForm.description} onChange={e => setDefForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                  <div className="flex items-center gap-2 pt-5">
                    <input type="checkbox" id="biz-hours" checked={defForm.businessHoursOnly} onChange={e => setDefForm(f => ({ ...f, businessHoursOnly: e.target.checked }))} className="rounded" />
                    <label htmlFor="biz-hours" className="text-sm">Business hours only</label>
                  </div>
                  <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
                    <Button type="submit" disabled={createMut.isPending || updateMut.isPending}><Check className="mr-1 h-4 w-4" /> {editingDefId ? 'Save' : 'Create'}</Button>
                    <Button type="button" variant="outline" onClick={() => { setShowDefForm(false); setEditingDefId(null); }}><X className="mr-1 h-4 w-4" /> Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              {defsLoading ? (
                <div className="space-y-px">{[1,2,3].map(i => <div key={i} className="h-12 animate-pulse bg-muted/40" />)}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead><TableHead>Priority</TableHead>
                      <TableHead>Response</TableHead><TableHead>Resolution</TableHead>
                      <TableHead>Business Hours</TableHead><TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {defs.length === 0 && <TableRow><TableCell colSpan={6} className="py-6 text-center text-muted-foreground">No SLA definitions. Create one above.</TableCell></TableRow>}
                    {defs.map(def => (
                      <TableRow key={def.id}>
                        <TableCell className="font-medium">{def.name}</TableCell>
                        <TableCell><Badge className={cn('capitalize', priorityColor(def.priority))}>{def.priority}</Badge></TableCell>
                        <TableCell>{formatMinutes(def.responseTimeMinutes ?? def.responseTime ?? 0)}</TableCell>
                        <TableCell>{formatMinutes(def.resolutionTimeMinutes ?? def.resolutionTime ?? 0)}</TableCell>
                        <TableCell>{def.businessHoursOnly ? 'Yes' : '24/7'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => openEditDef(def)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => setDeleteDefId(def.id)}><Trash2 className="h-3.5 w-3.5 text-danger" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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

function SLAInstanceTable({ instances, onPause, onResume }: { instances: SLAInstance[]; onPause: (id: string) => void; onResume: (id: string) => void }) {
  if (!instances || instances.length === 0) {
    return <p className="px-4 py-6 text-sm text-muted-foreground">No instances found.</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>SLA</TableHead><TableHead>Target</TableHead><TableHead>Status</TableHead>
          <TableHead>Response Deadline</TableHead><TableHead>Resolution Deadline</TableHead>
          <TableHead>Remaining</TableHead><TableHead className="w-24">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {instances.map((inst: SLAInstance) => {
          const elapsed = inst.elapsedMinutes ?? 0;
          const remaining = inst.remainingMinutes;
          const total = elapsed + (remaining ?? 0);
          const pct = total > 0 ? Math.min(100, Math.round((elapsed / total) * 100)) : 0;
          return (
            <TableRow key={inst.id}>
              <TableCell className="font-medium">{inst.slaName}</TableCell>
              <TableCell className="font-mono text-xs">{inst.targetTitle ?? inst.targetId?.slice(0, 8)}</TableCell>
              <TableCell><Badge className={cn('capitalize', statusColor(inst.status))}>{inst.status}</Badge></TableCell>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{new Date(inst.responseDeadline).toLocaleString()}</TableCell>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{new Date(inst.resolutionDeadline).toLocaleString()}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-20 rounded-full bg-muted overflow-hidden">
                    <div className={cn('h-full rounded-full', inst.status === 'breached' ? 'bg-danger' : pct > 70 ? 'bg-warning' : 'bg-primary')} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground">{remaining != null ? formatMinutes(remaining) : '—'}</span>
                </div>
              </TableCell>
              <TableCell>
                {inst.status === 'active' && (
                  <Button size="sm" variant="outline" onClick={() => onPause(inst.id)}>Pause</Button>
                )}
                {inst.status === 'paused' && (
                  <Button size="sm" variant="outline" onClick={() => onResume(inst.id)}>Resume</Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
