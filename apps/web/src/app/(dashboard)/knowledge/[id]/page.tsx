'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, AlertTriangle, Edit, ThumbsUp, ThumbsDown, Eye, Check, X, Trash2, Send } from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import { api } from '@/lib/api';

const CATEGORIES = ['Troubleshooting', 'How-To', 'Reference', 'Policy', 'FAQ'];

export default function KnowledgeArticlePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', summary: '', content: '', category: 'How-To', tags: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: article, isLoading } = useQuery({
    queryKey: ['knowledge-article', id],
    queryFn: () => api.getKnowledgeArticle(id).then(r => r.data.data),
    enabled: !!id,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['knowledge-article', id] });

  const updateMutation = useMutation({ mutationFn: (d: typeof editForm) => api.updateKnowledgeArticle(id, { ...d, tags: d.tags ? d.tags.split(',').map(t => t.trim()) : [] }), onSuccess: () => { invalidate(); setEditing(false); } });
  const submitReviewMutation = useMutation({ mutationFn: () => api.submitKnowledgeForReview(id), onSuccess: invalidate });
  const publishMutation = useMutation({ mutationFn: () => api.publishKnowledgeArticle(id), onSuccess: invalidate });
  const deleteMutation = useMutation({ mutationFn: () => api.deleteKnowledgeArticle(id), onSuccess: () => router.push('/knowledge') });
  const helpfulMutation = useMutation({ mutationFn: () => api.updateKnowledgeArticle(id, { helpfulYes: (article?.helpfulYes ?? 0) + 1 }), onSuccess: invalidate });
  const notHelpfulMutation = useMutation({ mutationFn: () => api.updateKnowledgeArticle(id, { helpfulNo: (article?.helpfulNo ?? 0) + 1 }), onSuccess: invalidate });

  if (isLoading) return <div className="p-8 text-muted-foreground animate-pulse">Loading…</div>;
  if (!article) return (
    <div className="flex flex-col items-center justify-center py-12">
      <AlertTriangle className="mb-4 h-12 w-12 text-muted-foreground" />
      <h2 className="text-lg font-semibold">Article not found</h2>
      <Link href="/knowledge"><Button variant="outline" className="mt-4">Back to Knowledge Base</Button></Link>
    </div>
  );

  const statusColor = article.status === 'published' ? 'bg-success/20 text-success' : article.status === 'in_review' ? 'bg-info/20 text-info' : 'bg-muted text-muted-foreground';

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/knowledge" className="hover:text-foreground">Knowledge Base</Link>
        <span>/</span>
        <span className="text-foreground">{article.title}</span>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/knowledge')}><ArrowLeft className="h-4 w-4" /></Button>
            <h1 className="text-2xl font-bold">{article.title}</h1>
          </div>
          <div className="flex items-center gap-3 pl-11 flex-wrap">
            <Badge variant="secondary">{article.category}</Badge>
            <Badge className={cn('capitalize', statusColor)}>{article.status}</Badge>
            {article.tags?.map((tag: string) => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {article.status === 'draft' && (
            <>
              <Button size="sm" variant="outline" onClick={() => { setEditing(true); setEditForm({ title: article.title, summary: article.summary ?? '', content: article.content, category: article.category, tags: article.tags?.join(', ') ?? '' }); }}><Edit className="mr-1 h-4 w-4" />Edit</Button>
              <Button size="sm" disabled={submitReviewMutation.isPending} onClick={() => submitReviewMutation.mutate()}><Send className="mr-1 h-4 w-4" />Submit for Review</Button>
            </>
          )}
          {article.status === 'in_review' && (
            <>
              <Button size="sm" variant="outline" onClick={() => { setEditing(true); setEditForm({ title: article.title, summary: article.summary ?? '', content: article.content, category: article.category, tags: article.tags?.join(', ') ?? '' }); }}><Edit className="mr-1 h-4 w-4" />Edit</Button>
              <Button size="sm" disabled={publishMutation.isPending} onClick={() => publishMutation.mutate()}>Publish</Button>
            </>
          )}
          {article.status === 'published' && (
            <Button size="sm" variant="outline" onClick={() => { setEditing(true); setEditForm({ title: article.title, summary: article.summary ?? '', content: article.content, category: article.category, tags: article.tags?.join(', ') ?? '' }); }}><Edit className="mr-1 h-4 w-4" />Edit</Button>
          )}
          <Button variant="outline" size="sm" className="text-danger border-danger hover:bg-danger/10" onClick={() => setShowDeleteConfirm(true)}><Trash2 className="mr-1 h-3.5 w-3.5" />Delete</Button>
        </div>
      </div>

      {showDeleteConfirm && <Card className="border-danger/50 bg-danger/5"><CardContent className="flex items-center justify-between py-3"><p className="text-sm">Delete this article permanently?</p><div className="flex gap-2"><Button size="sm" variant="destructive" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>Delete</Button><Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button></div></CardContent></Card>}

      {editing && (
        <Card>
          <CardHeader><CardTitle className="text-base">Edit Article</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={e => { e.preventDefault(); updateMutation.mutate(editForm); }} className="space-y-3">
              <div className="space-y-1"><label className="text-sm font-medium">Title</label><Input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1"><label className="text-sm font-medium">Category</label><Select value={editForm.category} onValueChange={v => setEditForm(f => ({ ...f, category: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1"><label className="text-sm font-medium">Tags</label><Input value={editForm.tags} onChange={e => setEditForm(f => ({ ...f, tags: e.target.value }))} placeholder="Comma-separated tags" /></div>
              </div>
              <div className="space-y-1"><label className="text-sm font-medium">Summary</label><Input value={editForm.summary} onChange={e => setEditForm(f => ({ ...f, summary: e.target.value }))} /></div>
              <div className="space-y-1"><label className="text-sm font-medium">Content</label><textarea className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-48 font-mono" value={editForm.content} onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))} /></div>
              <div className="flex gap-2"><Button type="submit" disabled={updateMutation.isPending}><Check className="mr-1 h-4 w-4" />Save</Button><Button type="button" variant="outline" onClick={() => setEditing(false)}><X className="mr-1 h-4 w-4" />Cancel</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-4 text-sm text-muted-foreground pl-2">
        <span className="flex items-center gap-1"><Eye className="h-4 w-4" />{article.views ?? 0} views</span>
        {article.authorName && <span>by {article.authorName}</span>}
        {article.updatedAt && <span>Published {formatDate(article.updatedAt)}</span>}
      </div>

      <Card>
        <CardContent className="pt-6 prose prose-sm dark:prose-invert max-w-none">
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{article.content}</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4 flex items-center justify-between">
          <p className="text-sm font-medium">Was this article helpful?</p>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" disabled={helpfulMutation.isPending} onClick={() => helpfulMutation.mutate()}>
              <ThumbsUp className="mr-1 h-4 w-4" />Yes {article.helpfulYes !== null ? `(${article.helpfulYes})` : ''}
            </Button>
            <Button variant="outline" size="sm" disabled={notHelpfulMutation.isPending} onClick={() => notHelpfulMutation.mutate()}>
              <ThumbsDown className="mr-1 h-4 w-4" />No {article.helpfulNo !== null ? `(${article.helpfulNo})` : ''}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
