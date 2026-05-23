'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Check } from 'lucide-react';
import { api } from '@/lib/api';

const CATEGORIES = ['Troubleshooting', 'How-To', 'Reference', 'Policy', 'FAQ'];

export default function NewKnowledgeArticlePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '', summary: '', content: '', category: 'How-To', tags: '', relatedArticleIds: '',
  });

  const createMutation = useMutation({
    mutationFn: () => api.createKnowledgeArticle({
      ...form,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
      relatedArticleIds: form.relatedArticleIds ? form.relatedArticleIds.split(',').map(s => s.trim()) : [],
    }),
    onSuccess: (res) => {
      const id = res.data?.data?.id;
      router.push(id ? `/knowledge/${id}` : '/knowledge');
    },
  });

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/knowledge')}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-2xl font-bold">New Knowledge Article</h1>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Article Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={e => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Title *</label>
              <Input required value={form.title} onChange={f('title')} placeholder="Article title" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Category</label>
                <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Tags</label>
                <Input value={form.tags} onChange={f('tags')} placeholder="Comma-separated: networking, VPN" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Summary</label>
              <Input value={form.summary} onChange={f('summary')} placeholder="Short description of the article" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Content *</label>
              <textarea required className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-64 font-mono" value={form.content} onChange={f('content')} placeholder="Article content (Markdown supported)" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Related Articles</label>
              <Input value={form.relatedArticleIds} onChange={f('relatedArticleIds')} placeholder="Comma-separated UUIDs of related articles" />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={createMutation.isPending}><Check className="mr-1 h-4 w-4" />Save as Draft</Button>
              <Button type="button" variant="outline" onClick={() => router.push('/knowledge')}>Cancel</Button>
            </div>
            {createMutation.isError && <p className="text-sm text-danger">Failed to create article. Please try again.</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
