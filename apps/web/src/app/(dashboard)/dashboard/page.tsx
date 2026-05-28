'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  Plus,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  GitBranch,
} from 'lucide-react';
import { formatRelativeTime, getStatusColor, getPriorityColor, cn } from '@/lib/utils';

interface SummaryCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: React.ElementType;
  trend?: string;
  variant?: 'default' | 'warning' | 'danger' | 'success';
}

function SummaryCard({ title, value, description, icon: Icon, trend, variant = 'default' }: SummaryCardProps) {
  const variantStyles = {
    default: { border: 'border-l-primary', gradient: 'card-gradient-primary', iconColor: 'text-primary' },
    warning: { border: 'border-l-warning', gradient: 'card-gradient-warning', iconColor: 'text-warning' },
    danger: { border: 'border-l-danger', gradient: 'card-gradient-danger', iconColor: 'text-danger' },
    success: { border: 'border-l-success', gradient: 'card-gradient-success', iconColor: 'text-success' },
  };

  const style = variantStyles[variant];

  return (
    <Card className={cn('border-l-4 transition-shadow hover:shadow-md', style.border, style.gradient)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg bg-background/80', style.iconColor)}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          {description}
          {trend && (
            <span className={cn('ml-1 font-medium', trend.startsWith('+') ? 'text-success' : 'text-danger')}>
              {trend}
            </span>
          )}
        </p>
      </CardContent>
    </Card>
  );
}

function SLAGauge({ percentage }: { percentage: number }) {
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const color = percentage >= 95 ? 'text-success' : percentage >= 80 ? 'text-warning' : 'text-danger';

  return (
    <div className="flex flex-col items-center gap-2" role="img" aria-label={`SLA compliance: ${percentage}%`}>
      <svg width="120" height="120" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={color}
          transform="rotate(-90 50 50)"
        />
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-foreground text-lg font-bold"
        >
          {percentage}%
        </text>
      </svg>
      <span className="text-sm text-muted-foreground">SLA Compliance</span>
    </div>
  );
}

export default function DashboardPage() {
  const qc = useQueryClient();
  const [autoRefresh, setAutoRefresh] = useState(false);
  const refreshInterval = autoRefresh ? 30_000 : false;

  const { data: incidentsData, isLoading: incidentsLoading } = useQuery({
    queryKey: ['incidents', { pageSize: 5, sort: 'updatedAt', sortOrder: 'desc' }],
    queryFn: () => api.getIncidents({ pageSize: 5, sort: 'updatedAt', sortOrder: 'desc' }).then(r => r.data),
    refetchInterval: refreshInterval,
  });

  const recentIncidents = incidentsData?.data ?? [];

  const { data: openIncidentsData } = useQuery({
    queryKey: ['incidents-open-count'],
    queryFn: () => api.getIncidents({ status: 'open,in_progress', pageSize: 1 }).then(r => r.data),
    refetchInterval: refreshInterval,
  });
  const { data: pendingChangesData } = useQuery({
    queryKey: ['changes-pending-count'],
    queryFn: () => api.getChanges({ status: 'pending_approval', pageSize: 1 }).then(r => r.data),
    refetchInterval: refreshInterval,
  });
  const { data: activeChangesData } = useQuery({
    queryKey: ['changes-active-count'],
    queryFn: () => api.getChanges({ status: 'approved,implementing', pageSize: 1 }).then(r => r.data),
    refetchInterval: refreshInterval,
  });
  const { data: slaData } = useQuery({
    queryKey: ['sla-instances-summary'],
    queryFn: () => api.getSLAInstances({ pageSize: 200 }).then(r => r.data),
    refetchInterval: refreshInterval,
  });

  const openIncidentsCount = openIncidentsData?.total ?? 0;
  const pendingApprovalsCount = pendingChangesData?.total ?? 0;
  const activeChangesCount = activeChangesData?.total ?? 0;
  const slaInstances = slaData?.data ?? [];
  const metCount = slaInstances.filter((s: { status: string }) => s.status === 'met').length;
  const breachedCount = slaInstances.filter((s: { status: string }) => s.status === 'breached').length;
  const slaCompliance = slaInstances.length > 0 ? Math.round((metCount / slaInstances.length) * 100) : 94;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight gradient-text">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of your service management operations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => qc.invalidateQueries()}
            aria-label="Manually refresh dashboard"
          >
            <RefreshCw className="mr-1 h-4 w-4" aria-hidden="true" />
            Refresh
          </Button>
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(v => !v)}
            aria-label={autoRefresh ? 'Disable auto-refresh' : 'Enable 30-second auto-refresh'}
            aria-pressed={autoRefresh}
          >
            {autoRefresh && <span className="mr-1.5 h-2 w-2 rounded-full bg-green-400 inline-block" aria-hidden="true" />}
            {autoRefresh ? 'Live' : 'Auto-refresh'}
          </Button>
          <Link href="/incidents/new">
            <Button aria-label="Create new incident">
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Create Incident
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Open Incidents"
          value={openIncidentsCount}
          description="Currently open"
          icon={AlertTriangle}
          variant="warning"
        />
        <SummaryCard
          title="SLA Breached"
          value={breachedCount}
          description="Active SLA breaches"
          icon={Clock}
          variant="danger"
        />
        <SummaryCard
          title="Pending Approvals"
          value={pendingApprovalsCount}
          description="Changes awaiting review"
          icon={ShieldAlert}
        />
        <SummaryCard
          title="Active Changes"
          value={activeChangesCount}
          description="In progress"
          icon={GitBranch}
          variant="success"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Incidents */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Incidents</CardTitle>
                <CardDescription>Latest incident activity</CardDescription>
              </div>
              <Link href="/incidents">
                <Button variant="ghost" size="sm" aria-label="View all incidents">
                  View All
                  <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {incidentsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentIncidents.length > 0 ? (
                    recentIncidents.map((incident) => (
                      <TableRow key={incident.id}>
                        <TableCell className="font-mono text-xs">
                          <Link
                            href={`/incidents/${incident.id}`}
                            className="text-primary hover:underline"
                          >
                            {incident.id.slice(0, 8)}
                          </Link>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {incident.title}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('capitalize', getPriorityColor(incident.priority))}>
                            {incident.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('capitalize', getStatusColor(incident.status))}>
                            {incident.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatRelativeTime(incident.updatedAt)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No recent incidents
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* SLA Compliance & Quick Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SLA Compliance</CardTitle>
              <CardDescription>Current period</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <SLAGauge percentage={slaCompliance} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/incidents/new" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <AlertTriangle className="mr-2 h-4 w-4" aria-hidden="true" />
                  Create Incident
                </Button>
              </Link>
              <Link href="/changes" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <GitBranch className="mr-2 h-4 w-4" aria-hidden="true" />
                  Request Change
                </Button>
              </Link>
              <Link href="/knowledge" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <CheckCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                  Search Knowledge Base
                </Button>
              </Link>
              <Link href="/sla" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="mr-2 h-4 w-4" aria-hidden="true" />
                  View SLA Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
