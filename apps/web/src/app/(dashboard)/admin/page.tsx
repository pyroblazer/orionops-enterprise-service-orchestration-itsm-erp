'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';

export default function AdminPage() {
  const [tab, setTab] = useState<'users' | 'roles' | 'workflows' | 'settings'>('users');
  const [search, setSearch] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: async () => {
      const params = search ? `?search=${search}` : '';
      const res = await api.get(`/api/v1/auth/users${params}`);
      return res.data.data;
    },
    enabled: tab === 'users',
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Console</h1>

      <div className="flex gap-2" role="tablist" aria-label="Admin sections">
        {([
          { key: 'users', label: 'Users' },
          { key: 'roles', label: 'Roles & Permissions' },
          { key: 'workflows', label: 'Workflows' },
          { key: 'settings', label: 'Settings' },
        ] as const).map(({ key, label }) => (
          <Button
            key={key}
            variant={tab === key ? 'default' : 'outline'}
            onClick={() => setTab(key)}
            role="tab"
            aria-selected={tab === key}
          >
            {label}
          </Button>
        ))}
      </div>

      {tab === 'users' && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
              aria-label="Search users"
            />
            <Button>Invite User</Button>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse"><CardContent className="h-12" /></Card>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border">
              <table className="w-full" role="table">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Roles</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Department</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Last Login</th>
                  </tr>
                </thead>
                <tbody>
                  {users?.content?.map((user: any) => (
                    <tr key={user.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{user.displayName}</td>
                      <td className="px-4 py-3">{user.email}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {user.roles?.map((r: any) => (
                            <Badge key={r.id} variant="secondary">{r.name}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">{user.department || '-'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={user.status === 'active' ? 'success' : 'default'}>
                          {user.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {user.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleDateString()
                          : 'Never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'roles' && (
        <Card>
          <CardHeader>
            <CardTitle>Roles & Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Role and permission management is handled through Keycloak. Configure roles,
              assign permissions, and manage access policies in the Keycloak admin console.
            </p>
            <div className="mt-4 grid gap-3">
              {['admin', 'change_manager', 'service_desk_agent', 'resolver_engineer', 'service_owner', 'viewer'].map((role) => (
                <div key={role} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</p>
                  </div>
                  <Badge variant="secondary">System Role</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'workflows' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Workflow Definitions</CardTitle>
              <Button>Upload BPMN</Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              BPMN workflow definitions managed by Flowable. Upload XML definitions
              to create new workflow templates.
            </p>
            <div className="rounded-lg border">
              <table className="w-full" role="table">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Version</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="px-4 py-3 font-medium">Incident Escalation</td>
                    <td className="px-4 py-3">v1</td>
                    <td className="px-4 py-3"><Badge variant="success">Active</Badge></td>
                    <td className="px-4 py-3"><Button variant="ghost" size="sm">Edit</Button></td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-3 font-medium">Change Approval</td>
                    <td className="px-4 py-3">v2</td>
                    <td className="px-4 py-3"><Badge variant="success">Active</Badge></td>
                    <td className="px-4 py-3"><Button variant="ghost" size="sm">Edit</Button></td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-3 font-medium">Procurement Request</td>
                    <td className="px-4 py-3">v1</td>
                    <td className="px-4 py-3"><Badge variant="success">Active</Badge></td>
                    <td className="px-4 py-3"><Button variant="ghost" size="sm">Edit</Button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'settings' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="platform-name">Platform Name</label>
                  <Input id="platform-name" defaultValue="OrionOps" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="default-timezone">Default Timezone</label>
                  <Input id="default-timezone" defaultValue="UTC" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="date-format">Date Format</label>
                  <Input id="date-format" defaultValue="YYYY-MM-DD" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="currency">Default Currency</label>
                  <Input id="currency" defaultValue="USD" />
                </div>
              </div>
              <Button>Save Settings</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Configure external integrations and webhook endpoints.
              </p>
              <Button variant="outline">Manage Integrations</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
