'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';

export default function WorkforcePage() {
  const [tab, setTab] = useState<'employees' | 'skills' | 'capacity'>('employees');
  const [search, setSearch] = useState('');

  const { data: employees, isLoading: loadingEmployees } = useQuery({
    queryKey: ['employees', search],
    queryFn: async () => {
      const params = search ? `?search=${search}` : '';
      const res = await api.get(`/api/v1/workforce/employees${params}`);
      return res.data.data;
    },
    enabled: tab === 'employees',
  });

  const { data: skills } = useQuery({
    queryKey: ['skills'],
    queryFn: async () => {
      const res = await api.get('/api/v1/workforce/skills');
      return res.data.data;
    },
    enabled: tab === 'skills',
  });

  const { data: capacity } = useQuery({
    queryKey: ['capacity'],
    queryFn: async () => {
      const res = await api.get('/api/v1/workforce/capacity');
      return res.data.data;
    },
    enabled: tab === 'capacity',
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Workforce Management</h1>
        <Button>Add Employee</Button>
      </div>

      <div className="flex gap-2" role="tablist" aria-label="Workforce sections">
        {(['employees', 'skills', 'capacity'] as const).map((t) => (
          <Button
            key={t}
            variant={tab === t ? 'default' : 'outline'}
            onClick={() => setTab(t)}
            role="tab"
            aria-selected={tab === t}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </Button>
        ))}
      </div>

      {tab === 'employees' && (
        <div className="space-y-4">
          <Input
            placeholder="Search employees or skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
            aria-label="Search employees"
          />
          {loadingEmployees ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="h-16" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border">
              <table className="w-full" role="table">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium">Employee</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Department</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Job Title</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Skills</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {employees?.content?.map((emp: any) => (
                    <tr key={emp.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">
                        {emp.user?.displayName || emp.employeeNumber}
                      </td>
                      <td className="px-4 py-3">{emp.department}</td>
                      <td className="px-4 py-3">{emp.jobTitle}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {emp.skills?.map((s: any) => (
                            <Badge key={s.id} variant="secondary">{s.name}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={emp.status === 'active' ? 'success' : 'default'}>
                          {emp.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'skills' && (
        <div className="rounded-lg border">
          <table className="w-full" role="table">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">Skill</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Category</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Employees</th>
              </tr>
            </thead>
            <tbody>
              {skills?.map((skill: any) => (
                <tr key={skill.id} className="border-b hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{skill.name}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{skill.category}</Badge>
                  </td>
                  <td className="px-4 py-3">{skill.employeeCount || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'capacity' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {capacity?.map((plan: any) => {
            const utilizationPct = plan.availableHours > 0
              ? Math.round((plan.allocatedHours / plan.availableHours) * 100)
              : 0;
            return (
              <Card key={plan.id}>
                <CardHeader>
                  <CardTitle className="text-base">{plan.team?.name || 'Team'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {plan.periodStart} — {plan.periodEnd}
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Utilization</span>
                      <span className={utilizationPct > 90 ? 'text-red-600 font-bold' : ''}>
                        {utilizationPct}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          utilizationPct > 90 ? 'bg-red-500' : utilizationPct > 70 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(utilizationPct, 100)}%` }}
                        role="progressbar"
                        aria-valuenow={utilizationPct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Allocated: {plan.allocatedHours}h</span>
                    <span>Available: {plan.availableHours}h</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
