'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, AlertTriangle, CheckCircle, Clock, ListChecks, Check, X, SendHorizontal, Trash2 } from 'lucide-react';
import { formatDateTime, getStatusColor, getPriorityColor, cn } from '@/lib/utils';
import { api } from '@/lib/api';

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const [showApproveForm, setShowApproveForm] = useState(false);
  const [showFulfillForm, setShowFulfillForm] = useState(false);
  const [approveForm, setApproveForm] = useState({ comments: '' });
  const [fulfillForm, setFulfillForm] = useState({ fulfillmentNotes: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: request, isLoading } = useQuery({
    queryKey: ['request', id],
    queryFn: () => api.getRequest(id).then(r => r.data.data),
    enabled: !!id,
  });

  const { data: auditData } = useQuery({
    queryKey: ['audit', 'request', id],
    queryFn: () => api.getAuditLogs({ entityType: 'ServiceRequest', entityId: id }).then(r => r.data.data),
    enabled: !!id,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['request', id] });

  const submitMutation = useMutation({ mutationFn: () => api.submitRequest(id), onSuccess: invalidate });
  const approveMutation = useMutation({ mutationFn: () => api.approveRequest(id, { approverId: 'current-user', ...approveForm }), onSuccess: () => { invalidate(); setShowApproveForm(false); } });
  const fulfillMutation = useMutation({ mutationFn: () => api.fulfillRequest(id, fulfillForm), onSuccess: () => { invalidate(); setShowFulfillForm(false); } });
  const closeMutation = useMutation({ mutationFn: () => api.closeRequest(id), onSuccess: invalidate });
  const deleteMutation = useMutation({ mutationFn: () => api.deleteRequest(id), onSuccess: () => router.push('/requests') });

  if (isLoading) return <div className="p-8 text-muted-foreground animate-pulse">Loading…</div>;
  if (!request) return (
    <div className="flex flex-col items-center justify-center py-12">
      <AlertTriangle className="mb-4 h-12 w-12 text-muted-foreground" />
      <h2 className="text-lg font-semibold">Request not found</h2>
      <Link href="/requests"><Button variant="outline" className="mt-4">Back to Requests</Button></Link>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/requests" className="hover:text-foreground">Requests</Link>
        <span>/</span>
        <span className="text-foreground">{request.id.slice(0, 8)}</span>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/requests')}><ArrowLeft className="h-4 w-4" /></Button>
            <h1 className="text-2xl font-bold">{request.title}</h1>
          </div>
          <div className="flex items-center gap-3 pl-11 flex-wrap">
            <Badge className={cn('capitalize', getPriorityColor(request.priority ?? 'medium'))}>{request.priority ?? '—'}</Badge>
            <Badge className={cn('capitalize', getStatusColor(request.status))}>{request.status?.replace('_', ' ')}</Badge>
            {request.category && <Badge variant="outline" className="capitalize">{request.category}</Badge>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {request.status === 'draft' && <Button size="sm" disabled={submitMutation.isPending} onClick={() => submitMutation.mutate()}><SendHorizontal className="mr-1 h-4 w-4" />Submit</Button>}
          {request.status === 'submitted' && <Button size="sm" variant="outline" className="text-success border-success" onClick={() => setShowApproveForm(true)}><CheckCircle className="mr-1 h-4 w-4" />Approve</Button>}
          {request.status === 'approved' && <Button size="sm" onClick={() => setShowFulfillForm(true)}>Fulfill</Button>}
          {request.status === 'in_fulfillment' && <Button size="sm" variant="outline" disabled={closeMutation.isPending} onClick={() => closeMutation.mutate()}>Close</Button>}
          <Button variant="outline" size="sm" className="text-danger border-danger hover:bg-danger/10" onClick={() => setShowDeleteConfirm(true)}><Trash2 className="mr-1 h-3.5 w-3.5" />Delete</Button>
        </div>
      </div>

      {showDeleteConfirm && <Card className="border-danger/50 bg-danger/5"><CardContent className="flex items-center justify-between py-3"><p className="text-sm">Delete this request permanently?</p><div className="flex gap-2"><Button size="sm" variant="destructive" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>Delete</Button><Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button></div></CardContent></Card>}

      {showApproveForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">Approve Request</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={e => { e.preventDefault(); approveMutation.mutate(); }} className="space-y-3">
              <div className="space-y-1"><label className="text-sm font-medium">Comments</label><Input value={approveForm.comments} onChange={e => setApproveForm(f => ({ ...f, comments: e.target.value }))} placeholder="Optional approval comments" /></div>
              <div className="flex gap-2"><Button type="submit" className="bg-success hover:bg-success/90" disabled={approveMutation.isPending}><Check className="mr-1 h-4 w-4" />Approve</Button><Button type="button" variant="outline" onClick={() => setShowApproveForm(false)}><X className="mr-1 h-4 w-4" />Cancel</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      {showFulfillForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">Fulfill Request</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={e => { e.preventDefault(); fulfillMutation.mutate(); }} className="space-y-3">
              <div className="space-y-1"><label className="text-sm font-medium">Fulfillment Notes</label><textarea className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-20" value={fulfillForm.fulfillmentNotes} onChange={e => setFulfillForm(f => ({ ...f, fulfillmentNotes: e.target.value }))} placeholder="Steps taken to fulfill this request" /></div>
              <div className="flex gap-2"><Button type="submit" disabled={fulfillMutation.isPending}><Check className="mr-1 h-4 w-4" />Mark Fulfilled</Button><Button type="button" variant="outline" onClick={() => setShowFulfillForm(false)}><X className="mr-1 h-4 w-4" />Cancel</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Status</p><p className="font-semibold mt-1 capitalize">{request.status?.replace('_', ' ')}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Priority</p><p className="font-semibold mt-1 capitalize">{request.priority}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Requested By</p><p className="font-semibold mt-1">{request.requestedByName ?? '—'}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Created</p><p className="font-semibold mt-1 text-sm">{formatDateTime(request.createdAt)}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          {request.fulfillmentTasks?.length > 0 && <TabsTrigger value="tasks"><ListChecks className="mr-1 h-4 w-4" />Tasks</TabsTrigger>}
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div><p className="text-xs font-medium text-muted-foreground">Description</p><p className="mt-1 text-sm whitespace-pre-wrap">{request.description || 'No description provided.'}</p></div>
              {request.justification && <div><p className="text-xs font-medium text-muted-foreground">Justification</p><p className="mt-1 text-sm whitespace-pre-wrap">{request.justification}</p></div>}
              {request.requiredDate && <div><p className="text-xs font-medium text-muted-foreground">Required Date</p><p className="mt-1 text-sm">{formatDateTime(request.requiredDate)}</p></div>}
              {request.fulfillmentNotes && (
                <div className="rounded-md border bg-success/5 border-success/20 p-3">
                  <p className="text-xs font-medium text-success mb-1">Fulfillment Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{request.fulfillmentNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Fulfillment Tasks</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {(request.fulfillmentTasks ?? []).map((task: { id: string; title: string; status: string; assignee?: string }) => (
                  <li key={task.id} className="flex items-center justify-between rounded-md border px-4 py-2 text-sm">
                    <div className="flex items-center gap-3">
                      {task.status === 'completed' ? <CheckCircle className="h-4 w-4 text-success" /> : <Clock className="h-4 w-4 text-muted-foreground" />}
                      <span className={cn(task.status === 'completed' && 'line-through text-muted-foreground')}>{task.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {task.assignee && <span className="text-muted-foreground text-xs">{task.assignee}</span>}
                      <Badge variant="outline" className="capitalize text-xs">{task.status?.replace('_', ' ')}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
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
                      <div className="flex-1"><span className="font-medium">{log.action.replace('_', ' ')}</span>{log.actorName && <span className="text-muted-foreground"> by {log.actorName}</span>}</div>
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
