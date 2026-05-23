'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Boxes, Search, Network, List, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, CMDBConfigItem } from '@/lib/api';

const CI_TYPES = ['server', 'database', 'application', 'network_device', 'virtual_machine', 'load_balancer', 'storage'];
const CI_STATUSES = ['active', 'inactive', 'maintenance', 'decommissioned'];
const ENVIRONMENTS = ['production', 'staging', 'development'];

function statusColor(status: string) {
  return status === 'active' ? 'bg-success/20 text-success border-success'
    : status === 'maintenance' ? 'bg-warning/20 text-warning border-warning'
    : status === 'decommissioned' ? 'bg-danger/20 text-danger border-danger'
    : 'bg-muted text-muted-foreground';
}

interface CIFormData {
  name: string;
  type: string;
  status: string;
  environment: string;
  owner: string;
  description: string;
}

const EMPTY_FORM: CIFormData = { name: '', type: 'server', status: 'active', environment: 'production', owner: '', description: '' };

export default function CMDBPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [envFilter, setEnvFilter] = useState('');
  const [page, setPage] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CIFormData>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['cmdb', { search, typeFilter, envFilter, page }],
    queryFn: () => api.getCMDBItems({
      search: search || undefined,
      type: typeFilter || undefined,
      environment: envFilter || undefined,
      page,
      pageSize: 20,
    }).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (d: CIFormData) => api.createCMDBItem(d as unknown as Partial<CMDBConfigItem>),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cmdb'] }); setShowForm(false); setForm(EMPTY_FORM); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, d }: { id: string; d: CIFormData }) => api.updateCMDBItem(id, d as unknown as Partial<CMDBConfigItem>),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cmdb'] }); setEditingId(null); setForm(EMPTY_FORM); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteCMDBItem(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cmdb'] }); setDeleteId(null); },
  });

  function openEdit(ci: CMDBConfigItem) {
    setEditingId(ci.id);
    setForm({ name: ci.name, type: ci.type, status: ci.status, environment: ci.environment, owner: ci.owner ?? '', description: ci.description ?? '' });
    setShowForm(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingId) updateMutation.mutate({ id: editingId, d: form });
    else createMutation.mutate(form);
  }

  const items = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CMDB Explorer</h1>
          <p className="text-muted-foreground">Configuration items and their relationships</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); }} aria-label="Add new CI">
          <Plus className="mr-1 h-4 w-4" /> Add CI
        </Button>
      </div>

      {/* Inline form */}
      {(showForm || editingId) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{editingId ? 'Edit Configuration Item' : 'New Configuration Item'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Name *</label>
                <Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="PROD-WEB-01" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Type *</label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CI_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Status</label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CI_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Environment</label>
                <Select value={form.environment} onValueChange={v => setForm(f => ({ ...f, environment: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ENVIRONMENTS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Owner</label>
                <Input value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} placeholder="Team or person" />
              </div>
              <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                <label className="text-sm font-medium">Description</label>
                <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
              </div>
              <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  <Check className="mr-1 h-4 w-4" /> {editingId ? 'Save Changes' : 'Create CI'}
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
          <Input placeholder="Search CIs..." className="pl-8" value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }} aria-label="Search configuration items" />
        </div>
        <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setPage(0); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All types</SelectItem>
            {CI_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={envFilter} onValueChange={v => { setEnvFilter(v); setPage(0); }}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All environments" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All environments</SelectItem>
            {ENVIRONMENTS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
        <Tabs value={viewMode} onValueChange={v => setViewMode(v as 'list' | 'graph')}>
          <TabsList>
            <TabsTrigger value="list"><List className="mr-1 h-4 w-4" /> List</TabsTrigger>
            <TabsTrigger value="graph"><Network className="mr-1 h-4 w-4" /> Graph</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Delete confirm */}
      {deleteId && (
        <Card className="border-danger/50 bg-danger/5">
          <CardContent className="flex items-center justify-between py-3">
            <p className="text-sm">Delete this configuration item? This cannot be undone.</p>
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteId)}>Delete</Button>
              <Button size="sm" variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {viewMode === 'list' ? (
        <>
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-px">
                  {[1,2,3,4,5].map(i => <div key={i} className="h-12 animate-pulse bg-muted/40" />)}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Environment</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No configuration items found</TableCell></TableRow>
                    )}
                    {items.map(ci => (
                      <TableRow key={ci.id} className="cursor-pointer hover:bg-muted/40"
                        onClick={() => router.push(`/cmdb/${ci.id}`)}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Boxes className="h-4 w-4 text-muted-foreground" />
                            {ci.name}
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline" className="capitalize">{ci.type.replace('_', ' ')}</Badge></TableCell>
                        <TableCell>
                          <Badge className={cn('capitalize', statusColor(ci.status))}>{ci.status}</Badge>
                        </TableCell>
                        <TableCell className="capitalize">{ci.environment}</TableCell>
                        <TableCell className="text-muted-foreground">{ci.owner ?? '—'}</TableCell>
                        <TableCell onClick={e => e.stopPropagation()}>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => openEdit(ci)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => setDeleteId(ci.id)}>
                              <Trash2 className="h-3.5 w-3.5 text-danger" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {total > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{total} total CIs</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <span className="px-2 py-1">Page {page + 1} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Network className="h-5 w-5" /> Relationship Graph</CardTitle>
            <CardDescription>Click on a CI in the list to view its relationships</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {items.map(ci => (
                <div key={ci.id} className="flex items-center gap-3 rounded-md border px-3 py-2 hover:bg-muted/40 cursor-pointer"
                  onClick={() => router.push(`/cmdb/${ci.id}`)}>
                  <Boxes className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-medium text-sm">{ci.name}</span>
                  <Badge variant="outline" className="capitalize text-xs">{ci.type.replace('_', ' ')}</Badge>
                  <Badge className={cn('capitalize text-xs', statusColor(ci.status))}>{ci.status}</Badge>
                  <span className="text-xs text-muted-foreground capitalize ml-auto">{ci.environment}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
