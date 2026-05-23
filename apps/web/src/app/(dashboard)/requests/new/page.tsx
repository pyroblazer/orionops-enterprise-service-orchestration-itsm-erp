'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Check } from 'lucide-react';
import { api, ServiceRequest } from '@/lib/api';

const CATEGORIES = ['hardware', 'software', 'access', 'support', 'training', 'facilities', 'other'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

export default function NewRequestPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '', description: '', category: 'software', priority: 'medium',
    requiredDate: '', justification: '', attachmentNotes: '',
  });

  const createMutation = useMutation({
    mutationFn: () => api.createRequest(form as unknown as Partial<ServiceRequest>),
    onSuccess: (res) => {
      const id = res.data?.data?.id;
      router.push(id ? `/requests/${id}` : '/requests');
    },
  });

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/requests')}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-2xl font-bold">New Service Request</h1>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Request Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={e => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Title *</label>
              <Input required value={form.title} onChange={f('title')} placeholder="Brief description of the request" />
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
                <label className="text-sm font-medium">Priority</label>
                <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Required Date</label>
              <Input type="date" value={form.requiredDate} onChange={f('requiredDate')} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Description</label>
              <textarea className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-28" value={form.description} onChange={f('description')} placeholder="Detailed description of what you need" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Justification</label>
              <textarea className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-20" value={form.justification} onChange={f('justification')} placeholder="Business justification for this request" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Attachment Notes</label>
              <Input value={form.attachmentNotes} onChange={f('attachmentNotes')} placeholder="Notes about attachments or supporting documents" />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={createMutation.isPending}><Check className="mr-1 h-4 w-4" />Submit Request</Button>
              <Button type="button" variant="outline" onClick={() => router.push('/requests')}>Cancel</Button>
            </div>
            {createMutation.isError && <p className="text-sm text-danger">Failed to create request. Please try again.</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
