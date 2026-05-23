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

const CHANGE_TYPES = ['standard', 'normal', 'emergency'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const RISK_LEVELS = ['low', 'medium', 'high', 'critical'];
const IMPACT_LEVELS = ['low', 'medium', 'high', 'critical'];

export default function NewChangePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '', description: '', changeType: 'normal', priority: 'medium',
    riskLevel: 'medium', impactLevel: 'medium', affectedServices: '',
    implementationPlan: '', rollbackPlan: '', testPlan: '',
    scheduledStartAt: '', scheduledEndAt: '', changeManagerId: '',
  });

  const createMutation = useMutation({
    mutationFn: () => api.createChange({
      ...form,
      affectedServices: form.affectedServices ? form.affectedServices.split(',').map(s => s.trim()) : [],
    }),
    onSuccess: (res) => {
      const id = res.data?.data?.id;
      router.push(id ? `/changes/${id}` : '/changes');
    },
  });

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/changes')}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-2xl font-bold">New Change Request</h1>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Change Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={e => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Title *</label>
              <Input required value={form.title} onChange={f('title')} placeholder="Brief description of the change" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Type</label>
                <Select value={form.changeType} onValueChange={v => setForm(p => ({ ...p, changeType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CHANGE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Priority</label>
                <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Risk Level</label>
                <Select value={form.riskLevel} onValueChange={v => setForm(p => ({ ...p, riskLevel: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{RISK_LEVELS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Impact Level</label>
                <Select value={form.impactLevel} onValueChange={v => setForm(p => ({ ...p, impactLevel: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{IMPACT_LEVELS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Affected Services</label>
              <Input value={form.affectedServices} onChange={f('affectedServices')} placeholder="Comma-separated: Auth Service, API Gateway" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Scheduled Start</label>
                <Input type="datetime-local" value={form.scheduledStartAt} onChange={f('scheduledStartAt')} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Scheduled End</label>
                <Input type="datetime-local" value={form.scheduledEndAt} onChange={f('scheduledEndAt')} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Description</label>
              <textarea className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-28" value={form.description} onChange={f('description')} placeholder="Detailed description of the change" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Implementation Plan</label>
              <textarea className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-24" value={form.implementationPlan} onChange={f('implementationPlan')} placeholder="Step-by-step implementation plan" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Rollback Plan</label>
              <textarea className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-20" value={form.rollbackPlan} onChange={f('rollbackPlan')} placeholder="How to revert if the change fails" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Test Plan</label>
              <textarea className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-20" value={form.testPlan} onChange={f('testPlan')} placeholder="Verification steps after implementation" />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={createMutation.isPending}><Check className="mr-1 h-4 w-4" />Create Change</Button>
              <Button type="button" variant="outline" onClick={() => router.push('/changes')}>Cancel</Button>
            </div>
            {createMutation.isError && <p className="text-sm text-danger">Failed to create change. Please try again.</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
