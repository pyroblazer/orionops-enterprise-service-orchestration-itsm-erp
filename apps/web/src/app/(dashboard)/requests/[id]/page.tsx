'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useRequest } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, AlertTriangle, CheckCircle, Clock, ListChecks } from 'lucide-react';
import { formatDateTime, getStatusColor, cn } from '@/lib/utils';

export default function RequestDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: request, isLoading } = useRequest(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Request not found</h2>
        <Link href="/requests" className="mt-4">
          <Button variant="outline">Back to Requests</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/requests" className="hover:text-foreground">Requests</Link>
        <span>/</span>
        <span className="text-foreground">{request.id.slice(0, 8)}</span>
      </div>

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Link href="/requests">
              <Button variant="ghost" size="icon" aria-label="Back to requests">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{request.title}</h1>
          </div>
          <div className="flex items-center gap-3 pl-11">
            <Badge className={cn('capitalize', getStatusColor(request.status))}>
              {request.status.replace('_', ' ')}
            </Badge>
            <Badge variant="secondary" className="capitalize">{request.category}</Badge>
            <span className="text-sm text-muted-foreground">
              Requested by {request.requestedByName}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{request.description}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Category', value: request.category },
              { label: 'Status', value: request.status.replace('_', ' ') },
              { label: 'Assigned To', value: request.assignedToName || 'Unassigned' },
              { label: 'Created', value: formatDateTime(request.createdAt) },
              { label: 'Updated', value: formatDateTime(request.updatedAt) },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
                <span className="text-sm capitalize">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Fulfillment Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5" />
            Fulfillment Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {request.fulfillmentTasks && request.fulfillmentTasks.length > 0 ? (
            <ul className="space-y-3" role="list" aria-label="Fulfillment tasks">
              {request.fulfillmentTasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center justify-between rounded-md border px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    {task.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-success" aria-hidden="true" />
                    ) : task.status === 'in_progress' ? (
                      <Clock className="h-5 w-5 text-warning" aria-hidden="true" />
                    ) : (
                      <ListChecks className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {task.status.replace('_', ' ')}
                        {task.assignee && ` - ${task.assignee}`}
                      </p>
                    </div>
                  </div>
                  <Badge className={cn('capitalize text-xs', getStatusColor(task.status))}>
                    {task.status.replace('_', ' ')}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No fulfillment tasks defined yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
