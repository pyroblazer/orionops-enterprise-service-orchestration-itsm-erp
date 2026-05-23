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
import { ArrowLeft, AlertTriangle, CheckCircle, Clock, Shield, ListChecks, FileText, User, Check, X, Trash2 } from 'lucide-react';
import { formatDateTime, getStatusColor, getPriorityColor, cn } from '@/lib/utils';
import { api } from '@/lib/api';

export default function ChangeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const [showApproveForm, setShowApproveForm] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showImplementForm, setShowImplementForm] = useState(false);
  const [approveForm, setApproveForm] = useState({ comments: '' });
  const [rejectForm, setRejectForm] = useState({ reason: '' });
  const [implementForm, setImplementForm] = useState({ actualStartAt: new Date().toISOString().slice(0, 16), implementationNotes: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: change, isLoading } = useQuery({
    queryKey: ['change', id],
    queryFn: () => api.getChange(id).then(r => r.data.data),
    enabled: !!id,
  });

  const { data: auditData } = useQuery({
    queryKey: ['audit', 'change', id],
    queryFn: () => api.getAuditLogs({ entityType: 'Change', entityId: id }).then(r => r.data.data),
    enabled: !!id,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['change', id] });

  const submitMutation = useMutation({ mutationFn: () => api.submitChange(id), onSuccess: invalidate });
  const approveMutation = useMutation({ mutationFn: () => api.approveChange(id, { approverId: 'current-user', ...approveForm }), onSuccess: () => { invalidate(); setShowApproveForm(false); } });
  const rejectMutation = useMutation({ mutationFn: () => api.rejectChange(id, rejectForm), onSuccess: () => { invalidate(); setShowRejectForm(false); } });
  const implementMutation = useMutation({ mutationFn: () => api.implementChange(id, implementForm), onSuccess: () => { invalidate(); setShowImplementForm(false); } });
  const closeMutation = useMutation({ mutationFn: () => api.closeChange(id), onSuccess: invalidate });
  const deleteMutation = useMutation({ mutationFn: () => api.deleteChange(id), onSuccess: () => router.push('/changes') });

  if (isLoading) return <div className="p-8 text-muted-foreground animate-pulse">Loading…</div>;
  if (!change) return (
    <div className="flex flex-col items-center justify-center py-12">
      <AlertTriangle className="mb-4 h-12 w-12 text-muted-foreground" />
      <h2 className="text-lg font-semibold">Change not found</h2>
      <Link href="/changes"><Button variant="outline" className="mt-4">Back to Changes</Button></Link>
    </div>
  );

  const riskLevels = ['low', 'medium', 'high', 'critical'];
  const currentRiskIndex = riskLevels.indexOf(change.risk);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/changes" className="hover:text-foreground">Changes</Link>
        <span>/</span>
        <span className="text-foreground">{change.id.slice(0, 8)}</span>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/changes')}><ArrowLeft className="h-4 w-4" /></Button>
            <h1 className="text-2xl font-bold">{change.title}</h1>
          </div>
          <div className="flex items-center gap-3 pl-11 flex-wrap">
            <Badge variant="outline" className="capitalize">{change.type} Change</Badge>
            <Badge className={cn('capitalize', getStatusColor(change.status))}>{change.status.replace('_', ' ')}</Badge>
            <Badge className={cn('capitalize', getPriorityColor(change.risk))}>Risk: {change.risk}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {change.status === 'draft' && <Button size="sm" disabled={submitMutation.isPending} onClick={() => submitMutation.mutate()}>Submit for Approval</Button>}
          {change.status === 'pending_approval' && (
            <>
              <Button size="sm" variant="outline" className="text-success border-success" onClick={() => setShowApproveForm(true)}><CheckCircle className="mr-1 h-4 w-4" />Approve</Button>
              <Button size="sm" variant="outline" className="text-danger border-danger" onClick={() => setShowRejectForm(true)}>Reject</Button>
            </>
          )}
          {change.status === 'approved' && <Button size="sm" onClick={() => setShowImplementForm(true)}>Start Implementation</Button>}
          {change.status === 'implementing' && <Button size="sm" disabled={closeMutation.isPending} onClick={() => closeMutation.mutate()}>Close Change</Button>}
          <Button variant="outline" size="sm" className="text-danger border-danger hover:bg-danger/10" onClick={() => setShowDeleteConfirm(true)}><Trash2 className="mr-1 h-3.5 w-3.5" />Delete</Button>
        </div>
      </div>

      {/* Action forms */}
      {showDeleteConfirm && <Card className="border-danger/50 bg-danger/5"><CardContent className="flex items-center justify-between py-3"><p className="text-sm">Delete this change permanently?</p><div className="flex gap-2"><Button size="sm" variant="destructive" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>Delete</Button><Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button></div></CardContent></Card>}

      {showApproveForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">Approve Change</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={e => { e.preventDefault(); approveMutation.mutate(); }} className="space-y-3">
              <div className="space-y-1"><label className="text-sm font-medium">Comments</label><Input value={approveForm.comments} onChange={e => setApproveForm(f => ({ ...f, comments: e.target.value }))} placeholder="Optional approval comments" /></div>
              <div className="flex gap-2"><Button type="submit" className="bg-success hover:bg-success/90" disabled={approveMutation.isPending}><Check className="mr-1 h-4 w-4" />Approve</Button><Button type="button" variant="outline" onClick={() => setShowApproveForm(false)}><X className="mr-1 h-4 w-4" />Cancel</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      {showRejectForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">Reject Change</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={e => { e.preventDefault(); rejectMutation.mutate(); }} className="space-y-3">
              <div className="space-y-1"><label className="text-sm font-medium">Reason *</label><textarea required className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-20" value={rejectForm.reason} onChange={e => setRejectForm(f => ({ ...f, reason: e.target.value }))} placeholder="Reason for rejection" /></div>
              <div className="flex gap-2"><Button type="submit" variant="destructive" disabled={rejectMutation.isPending}><X className="mr-1 h-4 w-4" />Reject</Button><Button type="button" variant="outline" onClick={() => setShowRejectForm(false)}>Cancel</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      {showImplementForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">Start Implementation</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={e => { e.preventDefault(); implementMutation.mutate(); }} className="space-y-3">
              <div className="space-y-1"><label className="text-sm font-medium">Actual Start</label><Input type="datetime-local" value={implementForm.actualStartAt} onChange={e => setImplementForm(f => ({ ...f, actualStartAt: e.target.value }))} /></div>
              <div className="space-y-1"><label className="text-sm font-medium">Implementation Notes</label><textarea className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-20" value={implementForm.implementationNotes} onChange={e => setImplementForm(f => ({ ...f, implementationNotes: e.target.value }))} placeholder="Notes about the implementation" /></div>
              <div className="flex gap-2"><Button type="submit" disabled={implementMutation.isPending}><Check className="mr-1 h-4 w-4" />Start</Button><Button type="button" variant="outline" onClick={() => setShowImplementForm(false)}><X className="mr-1 h-4 w-4" />Cancel</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-sm">
            <div className="text-center"><p className="font-medium">Planned Start</p><p className="text-muted-foreground">{change.plannedStart ? formatDateTime(change.plannedStart) : '—'}</p></div>
            <div className="flex-1 mx-4 border-t-2 border-dashed" />
            <div className="text-center"><p className="font-medium">Planned End</p><p className="text-muted-foreground">{change.plannedEnd ? formatDateTime(change.plannedEnd) : '—'}</p></div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="risk"><Shield className="mr-1 h-4 w-4" />Risk</TabsTrigger>
          <TabsTrigger value="approval"><User className="mr-1 h-4 w-4" />Approval</TabsTrigger>
          <TabsTrigger value="implementation"><ListChecks className="mr-1 h-4 w-4" />Implementation</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2"><CardHeader><CardTitle>Description</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground whitespace-pre-wrap">{change.description || 'No description.'}</p></CardContent></Card>
            <Card>
              <CardHeader><CardTitle>Properties</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Type', value: change.type },
                  { label: 'Risk', value: change.risk },
                  { label: 'Impact', value: change.impact },
                  { label: 'Requested By', value: change.requestedByName },
                  { label: 'Assigned To', value: change.assignedToName ?? 'Unassigned' },
                  { label: 'Approval', value: change.approvalStatus?.replace('_', ' ') },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-muted-foreground">{label}</span>
                    <span className="text-sm capitalize">{value ?? '—'}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risk" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Risk Assessment</CardTitle><CardDescription>Evaluate the risk level of this change</CardDescription></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Risk Level</p>
                  <div className="flex gap-2">
                    {riskLevels.map((level, index) => (
                      <div key={level} className={cn('flex-1 rounded-md border p-3 text-center text-sm capitalize', index === currentRiskIndex && 'border-2 font-bold', index === 0 && 'border-success bg-success/10', index === 1 && 'border-warning bg-warning/10', index >= 2 && 'border-danger bg-danger/10')}>{level}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Impact Level</p>
                  <Badge className={cn('capitalize', getPriorityColor(change.impact))}>{change.impact} impact</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approval" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Approval Chain</CardTitle></CardHeader>
            <CardContent>
              {change.approvalStatus === 'approved' ? (
                <div className="flex items-center gap-3 rounded-md border border-success bg-success/10 p-4"><CheckCircle className="h-5 w-5 text-success" /><div><p className="font-medium">Approved</p><p className="text-sm text-muted-foreground">This change has been approved</p></div></div>
              ) : change.approvalStatus === 'rejected' ? (
                <div className="flex items-center gap-3 rounded-md border border-danger bg-danger/10 p-4"><AlertTriangle className="h-5 w-5 text-danger" /><div><p className="font-medium">Rejected</p><p className="text-sm text-muted-foreground">This change was not approved</p></div></div>
              ) : (
                <div className="flex items-center gap-3 rounded-md border border-warning bg-warning/10 p-4"><Clock className="h-5 w-5 text-warning" /><div><p className="font-medium">Pending Approval</p><p className="text-sm text-muted-foreground">Awaiting review by Change Advisory Board</p></div></div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="implementation" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5" /> Implementation Plan</CardTitle></CardHeader><CardContent>{change.implementationPlan ? <div className="rounded-md border p-4"><p className="text-sm whitespace-pre-wrap">{change.implementationPlan}</p></div> : <p className="text-sm text-muted-foreground">No implementation plan documented.</p>}</CardContent></Card>
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Rollback Plan</CardTitle></CardHeader><CardContent>{change.rollbackPlan ? <div className="rounded-md border p-4"><p className="text-sm whitespace-pre-wrap">{change.rollbackPlan}</p></div> : <p className="text-sm text-muted-foreground">No rollback plan documented.</p>}</CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Activity Log</CardTitle></CardHeader>
            <CardContent>
              {!auditData || (auditData as unknown[]).length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No activity recorded yet.</p>
              ) : (
                <ul className="space-y-3">
                  {(auditData as unknown as { id: string; action: string; actorName?: string; createdAt: string; details?: string }[]).map(log => (
                    <li key={log.id} className="flex items-start gap-3 text-sm border-b last:border-0 pb-3 last:pb-0">
                      <div className="h-2 w-2 rounded-full bg-muted-foreground mt-1.5 shrink-0" />
                      <div className="flex-1"><span className="font-medium">{log.action.replace('_', ' ')}</span>{log.actorName && <span className="text-muted-foreground"> by {log.actorName}</span>}{log.details && <p className="text-muted-foreground text-xs mt-0.5">{log.details}</p>}</div>
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
