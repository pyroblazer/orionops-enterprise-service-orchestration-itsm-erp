'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useIncident, useUpdateIncident } from '@/lib/hooks';
import type { Incident } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  ExternalLink,
  MessageSquare,
  Paperclip,
  Send,
  CheckCircle,
  ArrowUpRight,
  FileText,
} from 'lucide-react';
import {
  formatDateTime,
  formatRelativeTime,
  getStatusColor,
  getPriorityColor,
  cn,
} from '@/lib/utils';

interface ActivityItem {
  id: string;
  type: 'comment' | 'status_change' | 'assignment' | 'priority_change';
  author: string;
  content: string;
  timestamp: string;
  from?: string;
  to?: string;
}

const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'comment',
    author: 'Jane Smith',
    content: 'Investigating the root cause. Seems to be related to the database connection pool.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '2',
    type: 'status_change',
    author: 'John Doe',
    content: 'Status changed',
    from: 'new',
    to: 'in_progress',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: '3',
    type: 'assignment',
    author: 'System',
    content: 'Assigned to Jane Smith',
    from: 'Unassigned',
    to: 'Jane Smith',
    timestamp: new Date(Date.now() - 10800000).toISOString(),
  },
];

export default function IncidentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: incident, isLoading } = useIncident(id);
  const updateIncident = useUpdateIncident();
  const [comment, setComment] = useState('');
  const [activeTab, setActiveTab] = useState('details');

  const handleStatusUpdate = async (newStatus: string) => {
    await updateIncident.mutateAsync({
      id,
      data: { status: newStatus as Incident['status'] },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Incident not found</h2>
        <p className="text-muted-foreground">The incident you are looking for does not exist or you do not have access.</p>
        <Link href="/incidents" className="mt-4">
          <Button variant="outline">Back to Incidents</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/incidents" className="hover:text-foreground">
          Incidents
        </Link>
        <span>/</span>
        <span className="text-foreground">{incident.id.slice(0, 8)}</span>
      </div>

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Link href="/incidents">
              <Button variant="ghost" size="icon" aria-label="Back to incidents">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{incident.title}</h1>
          </div>
          <div className="flex items-center gap-3 pl-11">
            <Badge className={cn('capitalize', getPriorityColor(incident.priority))}>
              {incident.priority}
            </Badge>
            <Badge className={cn('capitalize', getStatusColor(incident.status))}>
              {incident.status.replace('_', ' ')}
            </Badge>
            <span className="text-sm text-muted-foreground">
              <Clock className="mr-1 inline h-3 w-3" aria-hidden="true" />
              Created {formatRelativeTime(incident.createdAt)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {incident.status === 'new' && (
            <Button onClick={() => handleStatusUpdate('in_progress')}>
              Start Working
            </Button>
          )}
          {incident.status === 'in_progress' && (
            <Button onClick={() => handleStatusUpdate('pending')}>
              Set Pending
            </Button>
          )}
          {(incident.status === 'in_progress' || incident.status === 'pending') && (
            <Button variant="outline" onClick={() => handleStatusUpdate('resolved')}>
              <CheckCircle className="mr-1 h-4 w-4" />
              Resolve
            </Button>
          )}
          {incident.status === 'resolved' && (
            <Button onClick={() => handleStatusUpdate('closed')}>
              Close Incident
            </Button>
          )}
          <Button variant="outline">
            <ArrowUpRight className="mr-1 h-4 w-4" />
            Escalate
          </Button>
        </div>
      </div>

      {/* SLA Timer */}
      {incident.dueDate && (
        <div className={cn(
          'flex items-center gap-2 rounded-md border px-4 py-2 text-sm',
          new Date(incident.dueDate) < new Date() ? 'border-danger bg-danger/10 text-danger' : 'border-warning bg-warning/10 text-warning'
        )} role="alert">
          <Clock className="h-4 w-4" aria-hidden="true" />
          <span>
            {new Date(incident.dueDate) < new Date()
              ? 'SLA Breached'
              : `SLA Due: ${formatDateTime(incident.dueDate)}`}
          </span>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="related">Related</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Description */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-foreground">
                  {incident.description || 'No description provided.'}
                </div>
              </CardContent>
            </Card>

            {/* Properties */}
            <Card>
              <CardHeader>
                <CardTitle>Properties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Category', value: incident.category },
                  { label: 'Service', value: incident.serviceName },
                  { label: 'CI', value: incident.configurationItemName || 'N/A' },
                  { label: 'Assigned To', value: incident.assignedToName || 'Unassigned' },
                  { label: 'Reported By', value: incident.reportedByName },
                  { label: 'Created', value: formatDateTime(incident.createdAt) },
                  { label: 'Updated', value: formatDateTime(incident.updatedAt) },
                  ...(incident.resolvedAt ? [{ label: 'Resolved', value: formatDateTime(incident.resolvedAt!) }] : []),
                  ...(incident.closedAt ? [{ label: 'Closed', value: formatDateTime(incident.closedAt!) }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-muted-foreground">{label}</span>
                    <span className="text-sm">{value}</span>
                  </div>
                ))}
                {incident.tags.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">Tags</span>
                    <div className="flex flex-wrap gap-1">
                      {incident.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Timeline */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
                <CardDescription>Comments and status changes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {mockActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex gap-3"
                      role="article"
                      aria-label={`${activity.type} by ${activity.author}`}
                    >
                      <Avatar fallbackText={activity.author} className="h-8 w-8 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{activity.author}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(activity.timestamp)}
                          </span>
                        </div>
                        {activity.type === 'comment' ? (
                          <p className="mt-1 text-sm text-muted-foreground">{activity.content}</p>
                        ) : (
                          <p className="mt-1 text-sm">
                            <span className="text-muted-foreground">{activity.content}: </span>
                            {activity.from && (
                              <Badge variant="outline" className="text-xs">
                                {activity.from.replace('_', ' ')}
                              </Badge>
                            )}
                            {activity.from && activity.to && (
                              <span className="mx-1 text-muted-foreground">→</span>
                            )}
                            {activity.to && (
                              <Badge variant="outline" className="text-xs">
                                {activity.to.replace('_', ' ')}
                              </Badge>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Comment */}
                <div className="mt-6 border-t pt-6">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (comment.trim()) {
                        setComment('');
                      }
                    }}
                  >
                    <Textarea
                      placeholder="Add a comment..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="mb-3"
                      aria-label="Add a comment"
                    />
                    <div className="flex items-center justify-between">
                      <Button type="button" variant="ghost" size="sm">
                        <Paperclip className="mr-1 h-4 w-4" aria-hidden="true" />
                        Attach File
                      </Button>
                      <Button type="submit" disabled={!comment.trim()}>
                        <Send className="mr-1 h-4 w-4" aria-hidden="true" />
                        Comment
                      </Button>
                    </div>
                  </form>
                </div>
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <span>{mockActivities.filter((a) => a.type === 'comment').length} comments</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Paperclip className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <span>0 attachments</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="related" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Linked Problems</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">No linked problems</p>
                <Button variant="outline" size="sm" className="mt-3">
                  <ExternalLink className="mr-1 h-3 w-3" />
                  Link Problem
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Knowledge Articles</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">No related knowledge articles</p>
                <Button variant="outline" size="sm" className="mt-3">
                  <FileText className="mr-1 h-3 w-3" />
                  Search Articles
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
