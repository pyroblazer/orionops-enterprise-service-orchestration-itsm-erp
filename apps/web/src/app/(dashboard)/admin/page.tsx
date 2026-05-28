'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Shield, Users, GitBranch, Settings, Plus, Search, Pencil, Check, X, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, User } from '@/lib/api';
import apiClient from '@/lib/api';

const SYSTEM_ROLES = ['admin', 'change_manager', 'service_desk_agent', 'resolver_engineer', 'service_owner', 'viewer'];

interface UserForm {
  email: string; firstName: string; lastName: string; role: string; department: string;
}
const EMPTY_USER: UserForm = { email: '', firstName: '', lastName: '', role: 'viewer', department: '' };

interface SettingsForm {
  platformName: string; defaultTimezone: string; dateFormat: string; currency: string;
}

export default function AdminPage() {
  const qc = useQueryClient();

  // User state
  const [userSearch, setUserSearch] = useState('');
  const [showUserForm, setShowUserForm] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState<UserForm>(EMPTY_USER);
  const [saveMsg, setSaveMsg] = useState('');

  // Workflow state
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings state
  const [settingsForm, setSettingsForm] = useState<SettingsForm>({
    platformName: 'OrionOps', defaultTimezone: 'UTC', dateFormat: 'YYYY-MM-DD', currency: 'USD',
  });

  // Queries
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users', userSearch],
    queryFn: () => api.getUsers(userSearch ? { search: userSearch } : undefined).then(r => r.data),
  });
  const users = usersData?.data ?? [];

  const { data: workflowsData, isLoading: workflowsLoading } = useQuery({
    queryKey: ['workflow-definitions'],
    queryFn: () => apiClient.get<{ data: { id: string; name: string; version: number; status: string; description?: string }[] }>('/workflows/definitions').then((r: { data: { data: { id: string; name: string; version: number; status: string; description?: string }[] } }) => r.data.data),
  });
  const workflows = workflowsData ?? [];

  // User mutations
  const inviteMutation = useMutation({
    mutationFn: (d: UserForm) => apiClient.post('/users/invite', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); setShowUserForm(false); setUserForm(EMPTY_USER); },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, d }: { id: string; d: Partial<User> }) => api.updateUser(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); setEditUserId(null); setUserForm(EMPTY_USER); },
  });

  // Settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: (d: SettingsForm) => apiClient.put('/admin/settings', d),
    onSuccess: () => { setSaveMsg('Settings saved.'); setTimeout(() => setSaveMsg(''), 3000); },
  });

  // Workflow upload mutation
  const uploadBpmnMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiClient.post('/workflows/upload', formData);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['workflow-definitions'] }); },
  });

  function openEditUser(u: User) {
    setEditUserId(u.id);
    setUserForm({ email: u.email ?? '', firstName: u.firstName ?? '', lastName: u.lastName ?? '', role: u.role ?? 'viewer', department: u.department ?? '' });
    setShowUserForm(false);
  }

  function handleUserSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editUserId) {
      updateUserMutation.mutate({ id: editUserId, d: userForm as Partial<User> });
    } else {
      inviteMutation.mutate(userForm);
    }
  }

  const activeUsers = users.filter((u: User) => u.status !== 'inactive').length;
  const activeWorkflows = workflows.filter((w: { status: string }) => w.status === 'active').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight gradient-text">Admin Console</h1>
        <p className="text-sm text-muted-foreground">System administration and configuration</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary card-gradient-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">{activeUsers} active</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-success card-gradient-success">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Roles</CardTitle>
            <Shield className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{SYSTEM_ROLES.length}</div>
            <p className="text-xs text-muted-foreground">Managed in Keycloak</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-warning card-gradient-warning">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workflows</CardTitle>
            <GitBranch className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflows.length}</div>
            <p className="text-xs text-muted-foreground">{activeWorkflows} active</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-info card-gradient-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System</CardTitle>
            <Settings className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">OK</div>
            <p className="text-xs text-muted-foreground">All services running</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users"><Users className="mr-1 h-4 w-4" /> Users</TabsTrigger>
          <TabsTrigger value="roles"><Shield className="mr-1 h-4 w-4" /> Roles</TabsTrigger>
          <TabsTrigger value="workflows"><GitBranch className="mr-1 h-4 w-4" /> Workflows</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="mr-1 h-4 w-4" /> Settings</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-4 space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search users..." className="pl-8" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} aria-label="Search users" />
            </div>
            <Button onClick={() => { setShowUserForm(true); setEditUserId(null); setUserForm(EMPTY_USER); }}>
              <Plus className="mr-1 h-4 w-4" /> Invite User
            </Button>
          </div>

          {(showUserForm || editUserId) && (
            <Card className="border-primary/30">
              <CardHeader><CardTitle className="text-base">{editUserId ? 'Edit User' : 'Invite User'}</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleUserSubmit} className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Input label="Email" type="email" value={userForm.email} onChange={(e) => setUserForm(f => ({ ...f, email: e.target.value }))} required disabled={!!editUserId} />
                    <Input label="First Name" value={userForm.firstName} onChange={(e) => setUserForm(f => ({ ...f, firstName: e.target.value }))} required />
                    <Input label="Last Name" value={userForm.lastName} onChange={(e) => setUserForm(f => ({ ...f, lastName: e.target.value }))} required />
                    <Select value={userForm.role} onValueChange={(v) => setUserForm(f => ({ ...f, role: v }))}>
                      <SelectTrigger label="Role" />
                      <SelectContent>
                        {SYSTEM_ROLES.map(r => <SelectItem key={r} value={r}><span className="capitalize">{r.replace(/_/g, ' ')}</span></SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input label="Department" value={userForm.department} onChange={(e) => setUserForm(f => ({ ...f, department: e.target.value }))} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={inviteMutation.isPending || updateUserMutation.isPending}>
                      <Check className="mr-1 h-4 w-4" /> {editUserId ? 'Update' : 'Invite'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => { setShowUserForm(false); setEditUserId(null); setUserForm(EMPTY_USER); }}>
                      <X className="mr-1 h-4 w-4" /> Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              {usersLoading ? (
                <div className="space-y-3 p-6">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-16">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length > 0 ? users.map((user: User) => {
                      const status = user.status;
                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize">{user.role?.replace(/_/g, ' ')}</Badge>
                          </TableCell>
                          <TableCell>{user.department || '-'}</TableCell>
                          <TableCell>
                            <Badge className={cn(status === 'active' || !status ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground')}>
                              {status || 'active'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openEditUser(user)} aria-label={`Edit ${user.email}`}><Pencil className="h-3.5 w-3.5" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    }) : (
                      <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No users found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Roles & Permissions</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Role and permission management is handled through Keycloak. Configure roles,
                assign permissions, and manage access policies in the Keycloak admin console.
              </p>
              <div className="grid gap-3">
                {SYSTEM_ROLES.map((role) => (
                  <div key={role} className="flex items-center justify-between rounded-lg border p-3">
                    <p className="font-medium capitalize">{role.replace(/_/g, ' ')}</p>
                    <Badge variant="secondary">System Role</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Workflow Definitions</h2>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xml,.bpmn"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadBpmnMutation.mutate(file);
                }}
                aria-label="Upload BPMN file"
              />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadBpmnMutation.isPending}>
                <Upload className="mr-1 h-4 w-4" /> {uploadBpmnMutation.isPending ? 'Uploading...' : 'Upload BPMN'}
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              {workflowsLoading ? (
                <div className="space-y-3 p-6">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : workflows.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workflows.map((w: { id: string; name: string; version: number; status: string; description?: string }) => (
                      <TableRow key={w.id}>
                        <TableCell className="font-medium">{w.name}</TableCell>
                        <TableCell>v{w.version}</TableCell>
                        <TableCell><Badge className={cn(w.status === 'active' ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground')}>{w.status}</Badge></TableCell>
                        <TableCell className="text-muted-foreground text-sm">{w.description || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center py-12">
                  <GitBranch className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No workflow definitions found</p>
                  <p className="text-xs text-muted-foreground">Upload a BPMN file to create one</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle>System Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Platform Name" value={settingsForm.platformName} onChange={e => setSettingsForm(f => ({ ...f, platformName: e.target.value }))} />
                <Input label="Default Timezone" value={settingsForm.defaultTimezone} onChange={e => setSettingsForm(f => ({ ...f, defaultTimezone: e.target.value }))} />
                <Input label="Date Format" value={settingsForm.dateFormat} onChange={e => setSettingsForm(f => ({ ...f, dateFormat: e.target.value }))} />
                <Input label="Default Currency" value={settingsForm.currency} onChange={e => setSettingsForm(f => ({ ...f, currency: e.target.value }))} />
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={() => saveSettingsMutation.mutate(settingsForm)} disabled={saveSettingsMutation.isPending}>
                  <Check className="mr-1 h-4 w-4" /> Save Settings
                </Button>
                {saveMsg && <p className="text-sm text-success">{saveMsg}</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
