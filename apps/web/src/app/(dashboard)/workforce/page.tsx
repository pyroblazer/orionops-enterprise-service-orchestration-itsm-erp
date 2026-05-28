'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Wrench, BarChart3, Plus, Search, Pencil, Trash2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, Employee, Skill, CapacityPlan } from '@/lib/api';

const EMPLOYEE_STATUSES = ['active', 'on_leave', 'inactive', 'terminated'];
const SKILL_CATEGORIES = ['technical', 'soft_skill', 'certification', 'domain', 'tool'];

interface EmployeeForm {
  employeeNumber: string; firstName: string; lastName: string; email: string;
  department: string; jobTitle: string; status: string;
}
const EMPTY_EMPLOYEE: EmployeeForm = {
  employeeNumber: '', firstName: '', lastName: '', email: '',
  department: '', jobTitle: '', status: 'active',
};

interface SkillForm {
  name: string; category: string; description: string;
}
const EMPTY_SKILL: SkillForm = { name: '', category: 'technical', description: '' };

interface CapacityForm {
  team: string; periodStart: string; periodEnd: string;
  allocatedHours: string; availableHours: string;
}
const EMPTY_CAPACITY: CapacityForm = {
  team: '', periodStart: '', periodEnd: '', allocatedHours: '', availableHours: '',
};

function empStatusColor(s: string) {
  return s === 'active' ? 'bg-success/20 text-success'
    : s === 'on_leave' ? 'bg-warning/20 text-warning'
    : s === 'inactive' ? 'bg-muted text-muted-foreground'
    : 'bg-danger/20 text-danger';
}

export default function WorkforcePage() {
  const qc = useQueryClient();

  // Employee state
  const [empSearch, setEmpSearch] = useState('');
  const [showEmpForm, setShowEmpForm] = useState(false);
  const [editEmpId, setEditEmpId] = useState<string | null>(null);
  const [empForm, setEmpForm] = useState<EmployeeForm>(EMPTY_EMPLOYEE);
  const [deleteEmpId, setDeleteEmpId] = useState<string | null>(null);

  // Skill state
  const [skillSearch, setSkillSearch] = useState('');
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [editSkillId, setEditSkillId] = useState<string | null>(null);
  const [skillForm, setSkillForm] = useState<SkillForm>(EMPTY_SKILL);
  const [deleteSkillId, setDeleteSkillId] = useState<string | null>(null);

  // Capacity state
  const [showCapForm, setShowCapForm] = useState(false);
  const [editCapId, setEditCapId] = useState<string | null>(null);
  const [capForm, setCapForm] = useState<CapacityForm>(EMPTY_CAPACITY);

  // Queries
  const { data: empData, isLoading: empLoading } = useQuery({
    queryKey: ['employees', empSearch],
    queryFn: () => api.getEmployees({ search: empSearch || undefined }).then(r => r.data),
  });
  const employees = empData?.data ?? [];

  const { data: skillData, isLoading: skillLoading } = useQuery({
    queryKey: ['skills', skillSearch],
    queryFn: () => api.getSkills({ search: skillSearch || undefined }).then(r => r.data),
  });
  const skills = skillData?.data ?? [];

  const { data: capacityData, isLoading: capLoading } = useQuery({
    queryKey: ['capacity'],
    queryFn: () => api.getCapacityOverview().then(r => r.data),
  });
  const capacityPlans = capacityData?.data ?? [];

  // Employee mutations
  const createEmp = useMutation({
    mutationFn: (d: EmployeeForm) => api.createEmployee(d as Partial<Employee>),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); setShowEmpForm(false); setEmpForm(EMPTY_EMPLOYEE); },
  });
  const updateEmp = useMutation({
    mutationFn: ({ id, d }: { id: string; d: EmployeeForm }) => api.updateEmployee(id, d as Partial<Employee>),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); setEditEmpId(null); setEmpForm(EMPTY_EMPLOYEE); },
  });
  const deleteEmp = useMutation({
    mutationFn: (id: string) => api.deleteEmployee(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); setDeleteEmpId(null); },
  });

  // Skill mutations
  const createSkill = useMutation({
    mutationFn: (d: SkillForm) => api.createSkill(d as Partial<Skill>),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['skills'] }); setShowSkillForm(false); setSkillForm(EMPTY_SKILL); },
  });
  const updateSkill = useMutation({
    mutationFn: ({ id, d }: { id: string; d: SkillForm }) => api.updateSkill(id, d as Partial<Skill>),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['skills'] }); setEditSkillId(null); setSkillForm(EMPTY_SKILL); },
  });
  const deleteSkill = useMutation({
    mutationFn: (id: string) => api.deleteSkill(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['skills'] }); setDeleteSkillId(null); },
  });

  // Capacity mutations
  const createCap = useMutation({
    mutationFn: (d: CapacityForm) => api.createCapacityPlan({ ...d, allocatedHours: Number(d.allocatedHours), availableHours: Number(d.availableHours) } as Partial<CapacityPlan>),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['capacity'] }); setShowCapForm(false); setCapForm(EMPTY_CAPACITY); },
  });
  const updateCap = useMutation({
    mutationFn: ({ id, d }: { id: string; d: CapacityForm }) => api.updateCapacityPlan(id, { ...d, allocatedHours: Number(d.allocatedHours), availableHours: Number(d.availableHours) } as Partial<CapacityPlan>),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['capacity'] }); setEditCapId(null); setCapForm(EMPTY_CAPACITY); },
  });

  // Employee handlers
  function openEditEmp(e: Employee) {
    setEditEmpId(e.id);
    setEmpForm({
      employeeNumber: e.id.slice(0, 8), firstName: e.firstName ?? '', lastName: e.lastName ?? '',
      email: e.email ?? '', department: e.department ?? '', jobTitle: e.jobTitle ?? '', status: e.status ?? 'active',
    });
    setShowEmpForm(false);
  }
  function handleEmpSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editEmpId) updateEmp.mutate({ id: editEmpId, d: empForm });
    else createEmp.mutate(empForm);
  }

  // Skill handlers
  function openEditSkill(s: Skill) {
    setEditSkillId(s.id);
    setSkillForm({ name: s.name ?? '', category: s.category ?? 'technical', description: s.description ?? '' });
    setShowSkillForm(false);
  }
  function handleSkillSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editSkillId) updateSkill.mutate({ id: editSkillId, d: skillForm });
    else createSkill.mutate(skillForm);
  }

  // Capacity handlers
  function openEditCap(c: CapacityPlan) {
    setEditCapId(c.id);
    setCapForm({
      team: c.teamName ?? '', periodStart: c.period ?? '',
      periodEnd: '', allocatedHours: String(c.allocatedHours ?? ''),
      availableHours: String(c.totalCapacityHours ?? ''),
    });
    setShowCapForm(false);
  }
  function handleCapSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editCapId) updateCap.mutate({ id: editCapId, d: capForm });
    else createCap.mutate(capForm);
  }

  const activeEmps = employees.filter((e: Employee) => e.status === 'active');
  const totalCapHours = capacityPlans.reduce((s: number, c: CapacityPlan) => s + (c.allocatedHours ?? 0), 0);
  const avgUtil = capacityPlans.length > 0
    ? Math.round(capacityPlans.reduce((s: number, c: CapacityPlan) => s + (c.totalCapacityHours > 0 ? (c.allocatedHours / c.totalCapacityHours) * 100 : c.utilizationPercent ?? 0), 0) / capacityPlans.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight gradient-text">Workforce Management</h1>
          <p className="text-sm text-muted-foreground">Manage employees, skills, and capacity</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary card-gradient-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-xs text-muted-foreground">{activeEmps.length} active</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-success card-gradient-success">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skills Catalog</CardTitle>
            <Wrench className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{skills.length}</div>
            <p className="text-xs text-muted-foreground">Across {new Set(skills.map((s: Skill) => s.category)).size} categories</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-warning card-gradient-warning">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Allocated Hours</CardTitle>
            <BarChart3 className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCapHours.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across {capacityPlans.length} plans</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-info card-gradient-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Utilization</CardTitle>
            <BarChart3 className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgUtil}%</div>
            <p className="text-xs text-muted-foreground">Across teams</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="employees">
        <TabsList>
          <TabsTrigger value="employees"><Users className="mr-1 h-4 w-4" /> Employees</TabsTrigger>
          <TabsTrigger value="skills"><Wrench className="mr-1 h-4 w-4" /> Skills</TabsTrigger>
          <TabsTrigger value="capacity"><BarChart3 className="mr-1 h-4 w-4" /> Capacity</TabsTrigger>
        </TabsList>

        {/* Employees Tab */}
        <TabsContent value="employees" className="mt-4 space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search employees..." className="pl-8" value={empSearch} onChange={(e) => setEmpSearch(e.target.value)} aria-label="Search employees" />
            </div>
            <Button onClick={() => { setShowEmpForm(true); setEditEmpId(null); setEmpForm(EMPTY_EMPLOYEE); }}>
              <Plus className="mr-1 h-4 w-4" /> Add Employee
            </Button>
          </div>

          {(showEmpForm || editEmpId) && (
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="text-base">{editEmpId ? 'Edit Employee' : 'New Employee'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEmpSubmit} className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Input label="Employee Number" value={empForm.employeeNumber} onChange={(e) => setEmpForm({ ...empForm, employeeNumber: e.target.value })} required />
                    <Input label="First Name" value={empForm.firstName} onChange={(e) => setEmpForm({ ...empForm, firstName: e.target.value })} required />
                    <Input label="Last Name" value={empForm.lastName} onChange={(e) => setEmpForm({ ...empForm, lastName: e.target.value })} required />
                    <Input label="Email" type="email" value={empForm.email} onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })} required />
                    <Input label="Department" value={empForm.department} onChange={(e) => setEmpForm({ ...empForm, department: e.target.value })} />
                    <Input label="Job Title" value={empForm.jobTitle} onChange={(e) => setEmpForm({ ...empForm, jobTitle: e.target.value })} />
                    <Select value={empForm.status} onValueChange={(v) => setEmpForm({ ...empForm, status: v })}>
                      <SelectTrigger label="Status" /><SelectContent>
                        {EMPLOYEE_STATUSES.map(s => <SelectItem key={s} value={s}><span className="capitalize">{s.replace('_', ' ')}</span></SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={createEmp.isPending || updateEmp.isPending}>
                      <Check className="mr-1 h-4 w-4" /> {editEmpId ? 'Update' : 'Create'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => { setShowEmpForm(false); setEditEmpId(null); setEmpForm(EMPTY_EMPLOYEE); }}>
                      <X className="mr-1 h-4 w-4" /> Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {deleteEmpId && (
            <Card className="border-danger/50 bg-danger/5">
              <CardContent className="flex items-center gap-4 pt-6">
                <p className="text-sm">Are you sure you want to delete this employee?</p>
                <div className="ml-auto flex gap-2">
                  <Button size="sm" variant="destructive" onClick={() => deleteEmp.mutate(deleteEmpId)} disabled={deleteEmp.isPending}>Delete</Button>
                  <Button size="sm" variant="outline" onClick={() => setDeleteEmpId(null)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              {empLoading ? (
                <div className="space-y-3 p-6">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Skills</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.length > 0 ? employees.map((emp: Employee) => (
                      <TableRow key={emp.id}>
                        <TableCell className="font-medium">
                          {`${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim() || emp.email}
                        </TableCell>
                        <TableCell>{emp.department}</TableCell>
                        <TableCell>{emp.jobTitle}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {emp.skills?.map((s: string, i: number) => <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('capitalize', empStatusColor(emp.status))}>{emp.status?.replace('_', ' ')}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditEmp(emp)} aria-label={`Edit ${emp.email}`}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteEmpId(emp.id)} aria-label={`Delete ${emp.email}`}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No employees found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills" className="mt-4 space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search skills..." className="pl-8" value={skillSearch} onChange={(e) => setSkillSearch(e.target.value)} aria-label="Search skills" />
            </div>
            <Button onClick={() => { setShowSkillForm(true); setEditSkillId(null); setSkillForm(EMPTY_SKILL); }}>
              <Plus className="mr-1 h-4 w-4" /> Add Skill
            </Button>
          </div>

          {(showSkillForm || editSkillId) && (
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="text-base">{editSkillId ? 'Edit Skill' : 'New Skill'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSkillSubmit} className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Input label="Name" value={skillForm.name} onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })} required />
                    <Select value={skillForm.category} onValueChange={(v) => setSkillForm({ ...skillForm, category: v })}>
                      <SelectTrigger label="Category" /><SelectContent>
                        {SKILL_CATEGORIES.map(c => <SelectItem key={c} value={c}><span className="capitalize">{c.replace('_', ' ')}</span></SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input label="Description" value={skillForm.description} onChange={(e) => setSkillForm({ ...skillForm, description: e.target.value })} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={createSkill.isPending || updateSkill.isPending}>
                      <Check className="mr-1 h-4 w-4" /> {editSkillId ? 'Update' : 'Create'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => { setShowSkillForm(false); setEditSkillId(null); setSkillForm(EMPTY_SKILL); }}>
                      <X className="mr-1 h-4 w-4" /> Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {deleteSkillId && (
            <Card className="border-danger/50 bg-danger/5">
              <CardContent className="flex items-center gap-4 pt-6">
                <p className="text-sm">Are you sure you want to delete this skill?</p>
                <div className="ml-auto flex gap-2">
                  <Button size="sm" variant="destructive" onClick={() => deleteSkill.mutate(deleteSkillId)} disabled={deleteSkill.isPending}>Delete</Button>
                  <Button size="sm" variant="outline" onClick={() => setDeleteSkillId(null)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              {skillLoading ? (
                <div className="space-y-3 p-6">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Skill</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {skills.length > 0 ? skills.map((skill: Skill) => (
                      <TableRow key={skill.id}>
                        <TableCell className="font-medium">{skill.name}</TableCell>
                        <TableCell><Badge variant="secondary" className="capitalize">{skill.category?.replace('_', ' ')}</Badge></TableCell>
                        <TableCell>{0}</TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">{skill.description}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditSkill(skill)} aria-label={`Edit ${skill.name}`}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteSkillId(skill.id)} aria-label={`Delete ${skill.name}`}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No skills found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Capacity Tab */}
        <TabsContent value="capacity" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Capacity Plans</h2>
            <Button onClick={() => { setShowCapForm(true); setEditCapId(null); setCapForm(EMPTY_CAPACITY); }}>
              <Plus className="mr-1 h-4 w-4" /> Add Plan
            </Button>
          </div>

          {(showCapForm || editCapId) && (
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="text-base">{editCapId ? 'Edit Capacity Plan' : 'New Capacity Plan'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCapSubmit} className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Input label="Team" value={capForm.team} onChange={(e) => setCapForm({ ...capForm, team: e.target.value })} required />
                    <Input label="Period Start" type="date" value={capForm.periodStart} onChange={(e) => setCapForm({ ...capForm, periodStart: e.target.value })} required />
                    <Input label="Period End" type="date" value={capForm.periodEnd} onChange={(e) => setCapForm({ ...capForm, periodEnd: e.target.value })} required />
                    <Input label="Allocated Hours" type="number" value={capForm.allocatedHours} onChange={(e) => setCapForm({ ...capForm, allocatedHours: e.target.value })} required />
                    <Input label="Available Hours" type="number" value={capForm.availableHours} onChange={(e) => setCapForm({ ...capForm, availableHours: e.target.value })} required />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={createCap.isPending || updateCap.isPending}>
                      <Check className="mr-1 h-4 w-4" /> {editCapId ? 'Update' : 'Create'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => { setShowCapForm(false); setEditCapId(null); setCapForm(EMPTY_CAPACITY); }}>
                      <X className="mr-1 h-4 w-4" /> Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {capLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}</div>
          ) : capacityPlans.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {capacityPlans.map((plan: CapacityPlan) => {
                const utilPct = plan.totalCapacityHours > 0 ? Math.round((plan.allocatedHours / plan.totalCapacityHours) * 100) : (plan.utilizationPercent ?? 0);
                return (
                  <Card key={plan.id} className="transition-shadow hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-base">{plan.teamName || 'Team'}</CardTitle>
                      <Button variant="ghost" size="icon" onClick={() => openEditCap(plan)} aria-label="Edit plan"><Pencil className="h-3.5 w-3.5" /></Button>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-muted-foreground">{plan.period}</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Utilization</span>
                          <span className={cn('font-medium', utilPct > 90 ? 'text-danger' : utilPct > 70 ? 'text-warning' : 'text-success')}>{utilPct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn('h-full rounded-full', utilPct > 90 ? 'bg-danger' : utilPct > 70 ? 'bg-warning' : 'bg-success')}
                            style={{ width: `${Math.min(utilPct, 100)}%` }}
                            role="progressbar"
                            aria-valuenow={utilPct}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Allocated: {plan.allocatedHours}h</span>
                        <span>Available: {plan.totalCapacityHours}h</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No capacity plans found</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
