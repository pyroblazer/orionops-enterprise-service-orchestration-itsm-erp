'use client';

import { useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useIncident, useUpdateIncident } from '@/lib/hooks';
import type { Incident } from '@/lib/api';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  MessageSquare,
  Paperclip,
  Send,
  CheckCircle,
  ArrowUpRight,
  FileText,
  Search,
  Link as LinkIcon,
  X,
} from 'lucide-react';
import {
  formatDateTime,
  formatRelativeTime,
  getStatusColor,
  getPriorityColor,
  cn,
} from '@/lib/utils';


export default function IncidentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const qc = useQueryClient();
  const { data: incident, isLoading } = useIncident(id);
  const updateIncident = useUpdateIncident();
  const [comment, setComment] = useState('');
  const [activeTab, setActiveTab] = useState('details');
  const [showEscalateForm, setShowEscalateForm] = useState(false);
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [escalateForm, setEscalateForm] = useState({ escalationReason: '', newAssigneeId: '' });
  const [resolveForm, setResolveForm] = useState({ resolution: '' });

  // Link problem state
  const [showLinkProblem, setShowLinkProblem] = useState(false);
  const [problemSearch, setProblemSearch] = useState('');

  // Search articles state
  const [showArticleSearch, setShowArticleSearch] = useState(false);
  const [articleSearch, setArticleSearch] = useState('');

  // File attachment state
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: auditData } = useQuery({
    queryKey: ['audit', 'incident', id],
    queryFn: () => api.getAuditLogs({ entityType: 'Incident', entityId: id }).then(r => r.data.data),
    enabled: !!id,
  });

  // Search open problems for linking
  const { data: problemsData } = useQuery({
    queryKey: ['problems-link', problemSearch],
    queryFn: () => api.getProblems({ search: problemSearch || undefined, pageSize: 10 }).then(r => r.data),
    enabled: showLinkProblem,
  });

  // Search knowledge articles
  const { data: articlesData } = useQuery({
    queryKey: ['articles-search', articleSearch],
    queryFn: () => api.getKnowledgeArticles({ search: articleSearch || undefined, pageSize: 10 }).then(r => r.data),
    enabled: showArticleSearch,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['incident', id] });

  const escalateMutation = useMutation({
    mutationFn: () => api.escalateIncident(id, { reason: escalateForm.escalationReason, newAssigneeId: escalateForm.newAssigneeId || undefined }),
    onSuccess: () => { invalidate(); qc.invalidateQueries({ queryKey: ['audit', 'incident', id] }); setShowEscalateForm(false); },
  });

  const resolveMutation = useMutation({
    mutationFn: () => api.resolveIncident(id, resolveForm),
    onSuccess: () => { invalidate(); qc.invalidateQueries({ queryKey: ['audit', 'incident', id] }); setShowResolveForm(false); },
  });

  const closeMutation = useMutation({
    mutationFn: () => api.closeIncident(id),
    onSuccess: () => { invalidate(); qc.invalidateQueries({ queryKey: ['audit', 'incident', id] }); },
  });

  const commentMutation = useMutation({
    mutationFn: () => api.addComment(id, { content: comment.trim() }),
    onSuccess: () => { invalidate(); qc.invalidateQueries({ queryKey: ['audit', 'incident', id] }); setComment(''); },
  });

  const handleStatusUpdate = async (newStatus: string) => {
    await updateIncident.mutateAsync({
      id,
      data: { status: newStatus as Incident['status'] },
    });
  };

  const auditItems = (auditData as { id: string; action: string; actorName?: string; createdAt: string; details?: string; fieldName?: string; oldValue?: string; newValue?: string }[] | undefined) ?? [];
  const problems = problemsData?.data ?? [];
  const articles = articlesData?.data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Incident not found</h2>
        <p className="text-muted-foreground">The incident you are looking for does not exist or you do not have access.</p>
        <Link href="/incidents" className="mt-4">
          <Button variant="outline">Back to Incidents</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/incidents" className="hover:text-foreground">
          Incidents
        </Link>
        <span>/</span>
        <span className="text-foreground">{incident.id.slice(0, 8)}</span>
      </div>

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Link href="/incidents">
              <Button variant="ghost" size="icon" aria-label="Back to incidents">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{incident.title}</h1>
          </div>
          <div className="flex items-center gap-3 pl-11">
            <Badge className={cn('capitalize', getPriorityColor(incident.priority))}>
              {incident.priority}
            </Badge>
            <Badge className={cn('capitalize', getStatusColor(incident.status))}>
              {incident.status.replace('_', ' ')}
            </Badge>
            <span className="text-sm text-muted-foreground">
              <Clock className="mr-1 inline h-3 w-3" aria-hidden="true" />
              Created {formatRelativeTime(incident.createdAt)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {incident.status === 'new' && (
            <Button onClick={() => handleStatusUpdate('in_progress')}>
              Start Working
            </Button>
          )}
          {incident.status === 'in_progress' && (
            <Button onClick={() => handleStatusUpdate('pending')}>
              Set Pending
            </Button>
          )}
          {(incident.status === 'in_progress' || incident.status === 'pending') && (
            <Button variant="outline" onClick={() => setShowResolveForm(v => !v)}>
              <CheckCircle className="mr-1 h-4 w-4" />
              Resolve
            </Button>
          )}
          {incident.status === 'resolved' && (
            <Button disabled={closeMutation.isPending} onClick={() => closeMutation.mutate()}>
              Close Incident
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowEscalateForm(v => !v)}>
            <ArrowUpRight className="mr-1 h-4 w-4" />
            Escalate
          </Button>
        </div>
      </div>

      {/* Lifecycle forms */}
      {showEscalateForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">Escalate Incident</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={e => { e.preventDefault(); escalateMutation.mutate(); }} className="space-y-3">
              <div className="space-y-1"><label className="text-sm font-medium">Reason *</label><Textarea required placeholder="Reason for escalation" value={escalateForm.escalationReason} onChange={e => setEscalateForm(f => ({ ...f, escalationReason: e.target.value }))} /></div>
              <div className="space-y-1"><label className="text-sm font-medium">New Assignee ID</label><input className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="UUID of new assignee (optional)" value={escalateForm.newAssigneeId} onChange={e => setEscalateForm(f => ({ ...f, newAssigneeId: e.target.value }))} /></div>
              <div className="flex gap-2"><Button type="submit" disabled={escalateMutation.isPending}><ArrowUpRight className="mr-1 h-4 w-4" />Escalate</Button><Button type="button" variant="outline" onClick={() => setShowEscalateForm(false)}>Cancel</Button></div>
            </form>
          </CardContent>
        </Card>
      )}
      {showResolveForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">Resolve Incident</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={e => { e.preventDefault(); resolveMutation.mutate(); }} className="space-y-3">
              <div className="space-y-1"><label className="text-sm font-medium">Resolution *</label><Textarea required placeholder="Describe how the incident was resolved" value={resolveForm.resolution} onChange={e => setResolveForm(f => ({ ...f, resolution: e.target.value }))} /></div>
              <div className="flex gap-2"><Button type="submit" className="bg-success hover:bg-success/90" disabled={resolveMutation.isPending}><CheckCircle className="mr-1 h-4 w-4" />Mark Resolved</Button><Button type="button" variant="outline" onClick={() => setShowResolveForm(false)}>Cancel</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* SLA Timer */}
      {incident.dueDate && (
        <div className={cn(
          'flex items-center gap-2 rounded-md border px-4 py-2 text-sm',
          new Date(incident.dueDate) < new Date() ? 'border-danger bg-danger/10 text-danger' : 'border-warning bg-warning/10 text-warning'
        )} role="alert">
          <Clock className="h-4 w-4" aria-hidden="true" />
          <span>
            {new Date(incident.dueDate) < new Date()
              ? 'SLA Breached'
              : `SLA Due: ${formatDateTime(incident.dueDate)}`}
          </span>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="related">Related</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Description */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-foreground">
                  {incident.description || 'No description provided.'}
                </div>
              </CardContent>
            </Card>

            {/* Properties */}
            <Card>
              <CardHeader>
                <CardTitle>Properties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Category', value: incident.category },
                  { label: 'Service', value: incident.serviceName },
                  { label: 'CI', value: incident.configurationItemName || 'N/A' },
                  { label: 'Assigned To', value: incident.assignedToName || 'Unassigned' },
                  { label: 'Reported By', value: incident.reportedByName },
                  { label: 'Created', value: formatDateTime(incident.createdAt) },
                  { label: 'Updated', value: formatDateTime(incident.updatedAt) },
                  ...(incident.resolvedAt ? [{ label: 'Resolved', value: formatDateTime(incident.resolvedAt!) }] : []),
                  ...(incident.closedAt ? [{ label: 'Closed', value: formatDateTime(incident.closedAt!) }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-muted-foreground">{label}</span>
                    <span className="text-sm">{value}</span>
                  </div>
                ))}
                {incident.tags.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">Tags</span>
                    <div className="flex flex-wrap gap-1">
                      {incident.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Timeline */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
                <CardDescription>Comments and status changes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {auditItems.length === 0 && <p className="text-sm text-muted-foreground">No activity recorded yet.</p>}
                  {auditItems.map((log) => (
                    <div key={log.id} className="flex gap-3" role="article">
                      <Avatar fallbackText={log.actorName ?? '?'} className="h-8 w-8 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{log.actorName ?? 'System'}</span>
                          <span className="text-xs text-muted-foreground">{formatRelativeTime(log.createdAt)}</span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {log.action.replace(/_/g, ' ')}
                          {log.fieldName && <span>: {log.fieldName}</span>}
                          {log.oldValue && log.newValue && <span> {log.oldValue} → {log.newValue}</span>}
                          {log.details && <span> — {log.details}</span>}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Comment */}
                <div className="mt-6 border-t pt-6">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (comment.trim() && !commentMutation.isPending) {
                        commentMutation.mutate();
                      }
                    }}
                  >
                    <Textarea
                      placeholder="Add a comment..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="mb-3"
                      aria-label="Add a comment"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          aria-label="Attach file"
                        >
                          <Paperclip className="mr-1 h-4 w-4" aria-hidden="true" />
                          Attach File
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          aria-hidden="true"
                          onChange={(e) => {
                            // File selected — for MVP, show notification that upload would happen
                            if (e.target.files?.length) {
                              alert(`File "${e.target.files[0].name}" selected. File upload requires backend support.`);
                              e.target.value = '';
                            }
                          }}
                        />
                      </div>
                      <Button type="submit" disabled={!comment.trim() || commentMutation.isPending}>
                        <Send className="mr-1 h-4 w-4" aria-hidden="true" />
                        {commentMutation.isPending ? 'Sending...' : 'Comment'}
                      </Button>
                    </div>
                  </form>
                </div>
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <span>{auditItems.length} activity entries</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Paperclip className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <span>{String((incident?.attachmentCount ?? 0))} attachments</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="related" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Linked Problems */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Linked Problems</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setShowLinkProblem(v => !v); setShowArticleSearch(false); }}
                  aria-label={showLinkProblem ? 'Cancel linking problem' : 'Link a problem'}
                >
                  {showLinkProblem ? <X className="mr-1 h-3 w-3" /> : <LinkIcon className="mr-1 h-3 w-3" />}
                  {showLinkProblem ? 'Cancel' : 'Link Problem'}
                </Button>
              </CardHeader>
              <CardContent>
                {showLinkProblem && (
                  <div className="mb-4 space-y-3">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search problems..."
                        className="pl-8"
                        value={problemSearch}
                        onChange={e => setProblemSearch(e.target.value)}
                        aria-label="Search problems to link"
                      />
                    </div>
                    {problems.length > 0 ? (
                      <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border">
                        {problems.slice(0, 10).map((p: { id: string; title: string; status: string }) => (
                          <button
                            key={p.id}
                            type="button"
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                            onClick={() => {
                              setShowLinkProblem(false);
                              setProblemSearch('');
                              // Link the problem (for MVP, show confirmation)
                            }}
                          >
                            <Badge className={cn('text-2xs', getStatusColor(p.status))}>
                              {p.status.replace('_', ' ')}
                            </Badge>
                            <span className="truncate">{p.title}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No problems found.</p>
                    )}
                  </div>
                )}
                <p className="text-sm text-muted-foreground">No linked problems</p>
              </CardContent>
            </Card>

            {/* Knowledge Articles */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Knowledge Articles</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setShowArticleSearch(v => !v); setShowLinkProblem(false); }}
                  aria-label={showArticleSearch ? 'Cancel article search' : 'Search articles'}
                >
                  {showArticleSearch ? <X className="mr-1 h-3 w-3" /> : <FileText className="mr-1 h-3 w-3" />}
                  {showArticleSearch ? 'Cancel' : 'Search Articles'}
                </Button>
              </CardHeader>
              <CardContent>
                {showArticleSearch && (
                  <div className="mb-4 space-y-3">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search knowledge base..."
                        className="pl-8"
                        value={articleSearch}
                        onChange={e => setArticleSearch(e.target.value)}
                        aria-label="Search knowledge articles"
                      />
                    </div>
                    {articles.length > 0 ? (
                      <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border">
                        {articles.slice(0, 10).map((a: { id: string; title: string; category?: string }) => (
                          <Link
                            key={a.id}
                            href={`/knowledge/${a.id}`}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                          >
                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="truncate">{a.title}</span>
                            {a.category && (
                              <Badge variant="secondary" className="ml-auto shrink-0 text-2xs">{a.category}</Badge>
                            )}
                          </Link>
                        ))}
                      </div>
                    ) : articleSearch ? (
                      <p className="text-sm text-muted-foreground">No articles found.</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Type to search the knowledge base.</p>
                    )}
                  </div>
                )}
                {!showArticleSearch && (
                  <p className="text-sm text-muted-foreground">No related knowledge articles</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
