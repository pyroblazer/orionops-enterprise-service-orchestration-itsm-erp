'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Check } from 'lucide-react';
import { api, Problem } from '@/lib/api';

const CATEGORIES = ['infrastructure', 'application', 'network', 'security', 'hardware', 'software', 'process', 'other'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

export default function NewProblemPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '', description: '', category: 'infrastructure', priority: 'medium',
    affectedService: '', workaround: '', notes: '',
  });

  const createMutation = useMutation({
    mutationFn: () => api.createProblem(form as unknown as Partial<Problem>),
    onSuccess: (res) => {
      const id = res.data?.data?.id;
      router.push(id ? `/problems/${id}` : '/problems');
    },
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/problems')}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-2xl font-bold">New Problem</h1>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Problem Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={e => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Title *</label>
              <Input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Brief description of the problem" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Category</label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Priority</label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Affected Service</label>
              <Input value={form.affectedService} onChange={e => setForm(f => ({ ...f, affectedService: e.target.value }))} placeholder="Service or component affected" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Description</label>
              <textarea className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-32" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Detailed description of the problem" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Workaround</label>
              <textarea className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-20" value={form.workaround} onChange={e => setForm(f => ({ ...f, workaround: e.target.value }))} placeholder="Temporary workaround if available" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Notes</label>
              <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional notes" />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={createMutation.isPending}><Check className="mr-1 h-4 w-4" />Create Problem</Button>
              <Button type="button" variant="outline" onClick={() => router.push('/problems')}>Cancel</Button>
            </div>
            {createMutation.isError && <p className="text-sm text-danger">Failed to create problem. Please try again.</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
