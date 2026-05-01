'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Zap, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const mockDefinitions = [
  { id: 'sla-1', name: 'Critical Incident Response', priority: 'critical', responseTime: 15, resolutionTime: 240, businessHoursOnly: false },
  { id: 'sla-2', name: 'High Priority Response', priority: 'high', responseTime: 30, resolutionTime: 480, businessHoursOnly: false },
  { id: 'sla-3', name: 'Medium Priority Response', priority: 'medium', responseTime: 120, resolutionTime: 1440, businessHoursOnly: true },
  { id: 'sla-4', name: 'Low Priority Response', priority: 'low', responseTime: 480, resolutionTime: 2880, businessHoursOnly: true },
];

const mockInstances = [
  { id: 'inst-1', slaName: 'Critical Incident Response', targetType: 'incident', targetId: 'inc-001', status: 'active', responseDeadline: '2026-04-29T15:30:00Z', resolutionDeadline: '2026-04-29T19:30:00Z', progress: 45 },
  { id: 'inst-2', slaName: 'High Priority Response', targetType: 'incident', targetId: 'inc-002', status: 'met', responseDeadline: '2026-04-29T14:00:00Z', resolutionDeadline: '2026-04-29T22:00:00Z', progress: 100 },
  { id: 'inst-3', slaName: 'Critical Incident Response', targetType: 'incident', targetId: 'inc-003', status: 'breached', responseDeadline: '2026-04-28T10:00:00Z', resolutionDeadline: '2026-04-28T14:00:00Z', progress: 100 },
  { id: 'inst-4', slaName: 'Medium Priority Response', targetType: 'incident', targetId: 'inc-004', status: 'active', responseDeadline: '2026-04-30T10:00:00Z', resolutionDeadline: '2026-05-01T10:00:00Z', progress: 20 },
  { id: 'inst-5', slaName: 'High Priority Response', targetType: 'incident', targetId: 'inc-005', status: 'paused', responseDeadline: '2026-04-30T08:00:00Z', resolutionDeadline: '2026-04-30T16:00:00Z', progress: 60 },
];

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  return `${Math.floor(minutes / 1440)}d ${Math.floor((minutes % 1440) / 60)}h`;
}

export default function SLAPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const activeSLAs = mockInstances.filter((i) => i.status === 'active');
  const breachedSLAs = mockInstances.filter((i) => i.status === 'breached');
  const metSLAs = mockInstances.filter((i) => i.status === 'met');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">SLA Dashboard</h1>
        <p className="text-muted-foreground">Monitor service level agreements and compliance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active SLAs</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSLAs.length}</div>
            <p className="text-xs text-muted-foreground">Currently being tracked</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-danger">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Breached</CardTitle>
            <AlertTriangle className="h-4 w-4 text-danger" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-danger">{breachedSLAs.length}</div>
            <p className="text-xs text-muted-foreground">SLA violations</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-success">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Met</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{metSLAs.length}</div>
            <p className="text-xs text-muted-foreground">Successfully completed</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-warning">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {activeSLAs.filter((s) => s.progress > 70).length}
            </div>
            <p className="text-xs text-muted-foreground">Approaching deadline</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Active Instances</TabsTrigger>
          <TabsTrigger value="definitions">Definitions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Active SLA Instances</CardTitle>
              <CardDescription>Currently tracked SLA instances with breach warnings</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SLA</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Response Deadline</TableHead>
                    <TableHead>Resolution Deadline</TableHead>
                    <TableHead>Progress</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockInstances.map((instance) => (
                    <TableRow key={instance.id}>
                      <TableCell className="font-medium">{instance.slaName}</TableCell>
                      <TableCell className="font-mono text-xs">{instance.targetId}</TableCell>
                      <TableCell>
                        <Badge className={cn(
                          'capitalize',
                          instance.status === 'active' ? 'bg-primary/20 text-primary' :
                          instance.status === 'met' ? 'bg-success/20 text-success' :
                          instance.status === 'breached' ? 'bg-danger/20 text-danger' :
                          'bg-warning/20 text-warning'
                        )}>
                          {instance.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(instance.responseDeadline).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(instance.resolutionDeadline).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 rounded-full bg-muted overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                instance.status === 'breached' ? 'bg-danger' :
                                instance.progress > 70 ? 'bg-warning' : 'bg-primary'
                              )}
                              style={{ width: `${instance.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{instance.progress}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="definitions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>SLA Definitions</CardTitle>
              <CardDescription>Configured service level targets by priority</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead>Resolution Time</TableHead>
                    <TableHead>Business Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockDefinitions.map((def) => (
                    <TableRow key={def.id}>
                      <TableCell className="font-medium">{def.name}</TableCell>
                      <TableCell>
                        <Badge className={cn(
                          'capitalize',
                          def.priority === 'critical' ? 'bg-danger/20 text-danger' :
                          def.priority === 'high' ? 'bg-warning/20 text-warning' :
                          def.priority === 'medium' ? 'bg-primary/20 text-primary' :
                          'bg-success/20 text-success'
                        )}>
                          {def.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatMinutes(def.responseTime)}</TableCell>
                      <TableCell>{formatMinutes(def.resolutionTime)}</TableCell>
                      <TableCell>{def.businessHoursOnly ? 'Yes' : '24/7'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
