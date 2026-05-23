'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, AlertTriangle, FileText, Lightbulb, Link as LinkIcon, Plus, Check, X, Pencil, Trash2 } from 'lucide-react';
import { formatDateTime, getStatusColor, getPriorityColor, cn } from '@/lib/utils';
import { api } from '@/lib/api';

const STATUS_TRANSITIONS: Record<string, { label: string; next: string }> = {
  open: { label: 'Start Investigation', next: 'under_investigation' },
  under_investigation: { label: 'Set Root Cause', next: 'root_cause_identified' },
  root_cause_identified: { label: 'Mark Resolved', next: 'resolved' },
  resolved: { label: 'Close', next: 'closed' },
};

export default function ProblemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', workaround: '' });
  const [showRcaForm, setShowRcaForm] = useState(false);
  const [rcaForm, setRcaForm] = useState({ rootCause: '', resolution: '', permanentFix: false });
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkIncidentId, setLinkIncidentId] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: problem, isLoading } = useQuery({
    queryKey: ['problem', id],
    queryFn: () => api.getProblem(id).then(r => r.data.data),
    enabled: !!id,
  });

  const { data: auditData } = useQuery({
    queryKey: ['audit', 'problem', id],
    queryFn: () => api.getAuditLogs({ entityType: 'Problem', entityId: id }).then(r => r.data.data),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (d: typeof editForm) => api.updateProblem(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['problem', id] }); setEditing(false); },
  });

  const transitionMutation = useMutation({
    mutationFn: (status: string) => api.updateProblem(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['problem', id] }),
  });

  const rcaMutation = useMutation({
    mutationFn: () => api.setProblemRootCause(id, rcaForm),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['problem', id] }); setShowRcaForm(false); },
  });

  const linkMutation = useMutation({
    mutationFn: () => api.linkIncidentToProblem(id, { incidentId: linkIncidentId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['problem', id] }); setShowLinkForm(false); setLinkIncidentId(''); },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteProblem(id),
    onSuccess: () => router.push('/problems'),
  });

  if (isLoading) return <div className="p-8 text-muted-foreground animate-pulse">Loading…</div>;
  if (!problem) return (
    <div className="flex flex-col items-center justify-center py-12">
      <AlertTriangle className="mb-4 h-12 w-12 text-muted-foreground" />
      <h2 className="text-lg font-semibold">Problem not found</h2>
      <Link href="/problems"><Button variant="outline" className="mt-4">Back to Problems</Button></Link>
    </div>
  );

  const transition = STATUS_TRANSITIONS[problem.status];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/problems')}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold">{problem.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={cn('capitalize', getPriorityColor(problem.priority))}>{problem.priority}</Badge>
            <Badge className={cn('capitalize', getStatusColor(problem.status))}>{problem.status.replace('_', ' ')}</Badge>
          </div>
        </div>
        <div className="ml-auto flex gap-2">
          {transition && (
            <Button size="sm" disabled={transitionMutation.isPending} onClick={() => transitionMutation.mutate(transition.next)}>{transition.label}</Button>
          )}
          <Button variant="outline" size="sm" onClick={() => { setEditing(true); setEditForm({ title: problem.title, description: problem.description ?? '', workaround: problem.workaround ?? '' }); }}><Pencil className="mr-1 h-3.5 w-3.5" />Edit</Button>
          <Button variant="outline" size="sm" className="text-danger border-danger hover:bg-danger/10" onClick={() => setShowDeleteConfirm(true)}><Trash2 className="mr-1 h-3.5 w-3.5" />Delete</Button>
        </div>
      </div>

      {showDeleteConfirm && (
        <Card className="border-danger/50 bg-danger/5"><CardContent className="flex items-center justify-between py-3">
          <p className="text-sm">Delete this problem permanently?</p>
          <div className="flex gap-2">
            <Button size="sm" variant="destructive" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>Delete</Button>
            <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
          </div>
        </CardContent></Card>
      )}

      {editing && (
        <Card>
          <CardHeader><CardTitle className="text-base">Edit Problem</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={e => { e.preventDefault(); updateMutation.mutate(editForm); }} className="space-y-3">
              <div className="space-y-1"><label className="text-sm font-medium">Title</label><Input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="space-y-1"><label className="text-sm font-medium">Description</label><textarea className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-24" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="space-y-1"><label className="text-sm font-medium">Workaround</label><textarea className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-20" value={editForm.workaround} onChange={e => setEditForm(f => ({ ...f, workaround: e.target.value }))} /></div>
              <div className="flex gap-2">
                <Button type="submit" disabled={updateMutation.isPending}><Check className="mr-1 h-4 w-4" />Save</Button>
                <Button type="button" variant="outline" onClick={() => setEditing(false)}><X className="mr-1 h-4 w-4" />Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Status</p><p className="font-semibold mt-1 capitalize">{problem.status.replace('_', ' ')}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Priority</p><p className="font-semibold mt-1 capitalize">{problem.priority}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Assigned To</p><p className="font-semibold mt-1">{problem.assignedToName ?? 'Unassigned'}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Created</p><p className="font-semibold mt-1 text-sm">{formatDateTime(problem.createdAt)}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="rca"><Lightbulb className="mr-1 h-4 w-4" />Root Cause</TabsTrigger>
          <TabsTrigger value="incidents"><LinkIcon className="mr-1 h-4 w-4" />Linked Incidents</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Description</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{problem.description || 'No description provided.'}</p>
              {problem.workaround && (
                <div className="mt-4 rounded-md border bg-success/5 border-success/20 p-4">
                  <p className="text-xs font-medium text-success mb-1">Workaround</p>
                  <p className="text-sm">{problem.workaround}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rca" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Root Cause Analysis</h2>
            <Button size="sm" variant="outline" onClick={() => { setShowRcaForm(true); setRcaForm({ rootCause: problem.rootCause ?? '', resolution: problem.resolution ?? '', permanentFix: false }); }}>
              {problem.rootCause ? <><Pencil className="mr-1 h-3.5 w-3.5" />Edit RCA</> : <><Plus className="mr-1 h-3.5 w-3.5" />Add RCA</>}
            </Button>
          </div>

          {showRcaForm && (
            <Card>
              <CardContent className="pt-4">
                <form onSubmit={e => { e.preventDefault(); rcaMutation.mutate(); }} className="space-y-3">
                  <div className="space-y-1"><label className="text-sm font-medium">Root Cause</label><textarea className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-24" value={rcaForm.rootCause} onChange={e => setRcaForm(f => ({ ...f, rootCause: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Resolution</label><textarea className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-20" value={rcaForm.resolution} onChange={e => setRcaForm(f => ({ ...f, resolution: e.target.value }))} /></div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="permanentFix" checked={rcaForm.permanentFix} onChange={e => setRcaForm(f => ({ ...f, permanentFix: e.target.checked }))} className="h-4 w-4" />
                    <label htmlFor="permanentFix" className="text-sm">Permanent fix implemented</label>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={rcaMutation.isPending}><Check className="mr-1 h-4 w-4" />Save RCA</Button>
                    <Button type="button" variant="outline" onClick={() => setShowRcaForm(false)}><X className="mr-1 h-4 w-4" />Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {problem.rootCause ? (
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div><p className="text-xs font-medium text-muted-foreground">Root Cause</p><p className="mt-1 text-sm whitespace-pre-wrap">{problem.rootCause}</p></div>
                {problem.resolution && <div><p className="text-xs font-medium text-muted-foreground">Resolution</p><p className="mt-1 text-sm whitespace-pre-wrap">{problem.resolution}</p></div>}
              </CardContent>
            </Card>
          ) : !showRcaForm && (
            <div className="text-center py-8 text-muted-foreground">
              <Lightbulb className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
              <p>No root cause analysis documented yet.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="incidents" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Linked Incidents</h2>
            <Button size="sm" variant="outline" onClick={() => setShowLinkForm(v => !v)}><Plus className="mr-1 h-3.5 w-3.5" />Link Incident</Button>
          </div>

          {showLinkForm && (
            <Card><CardContent className="pt-4">
              <form onSubmit={e => { e.preventDefault(); linkMutation.mutate(); }} className="flex gap-3 items-end">
                <div className="space-y-1 flex-1">
                  <label className="text-sm font-medium">Incident ID *</label>
                  <Input required value={linkIncidentId} onChange={e => setLinkIncidentId(e.target.value)} placeholder="UUID of incident" />
                </div>
                <Button type="submit" disabled={linkMutation.isPending}><Check className="mr-1 h-4 w-4" />Link</Button>
                <Button type="button" variant="outline" onClick={() => setShowLinkForm(false)}><X className="mr-1 h-4 w-4" />Cancel</Button>
              </form>
            </CardContent></Card>
          )}

          {problem.linkedIncidents && problem.linkedIncidents.length > 0 ? (
            <ul className="space-y-2">
              {problem.linkedIncidents.map((incId: string) => (
                <li key={incId} className="flex items-center justify-between rounded-md border px-4 py-2">
                  <Link href={`/incidents/${incId}`} className="text-sm text-primary hover:underline font-mono">{incId.slice(0, 8)}</Link>
                  <Link href={`/incidents/${incId}`}><Button variant="ghost" size="sm">View</Button></Link>
                </li>
              ))}
            </ul>
          ) : !showLinkForm && (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
              <p>No linked incidents.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Activity Log</CardTitle><CardDescription>Recent actions on this problem</CardDescription></CardHeader>
            <CardContent>
              {!auditData || (auditData as unknown[]).length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No activity recorded yet.</p>
              ) : (
                <ul className="space-y-3">
                  {(auditData as { id: string; action: string; actorName?: string; createdAt: string; details?: string }[]).map(log => (
                    <li key={log.id} className="flex items-start gap-3 text-sm border-b last:border-0 pb-3 last:pb-0">
                      <div className="h-2 w-2 rounded-full bg-muted-foreground mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <span className="font-medium">{log.action.replace('_', ' ')}</span>
                        {log.actorName && <span className="text-muted-foreground"> by {log.actorName}</span>}
                        {log.details && <p className="text-muted-foreground text-xs mt-0.5">{log.details}</p>}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{formatDateTime(log.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
