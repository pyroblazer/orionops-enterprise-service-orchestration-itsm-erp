'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useProblem } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, AlertTriangle, FileText, Lightbulb, Link as LinkIcon } from 'lucide-react';
import { formatDateTime, getStatusColor, getPriorityColor, cn } from '@/lib/utils';

export default function ProblemDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: problem, isLoading } = useProblem(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Problem not found</h2>
        <Link href="/problems" className="mt-4">
          <Button variant="outline">Back to Problems</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/problems" className="hover:text-foreground">Problems</Link>
        <span>/</span>
        <span className="text-foreground">{problem.id.slice(0, 8)}</span>
      </div>

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Link href="/problems">
              <Button variant="ghost" size="icon" aria-label="Back to problems">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{problem.title}</h1>
          </div>
          <div className="flex items-center gap-3 pl-11">
            <Badge className={cn('capitalize', getPriorityColor(problem.priority))}>{problem.priority}</Badge>
            <Badge className={cn('capitalize', getStatusColor(problem.status))}>
              {problem.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="rca">Root Cause Analysis</TabsTrigger>
          <TabsTrigger value="incidents">Linked Incidents</TabsTrigger>
          <TabsTrigger value="workaround">Workaround</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{problem.description || 'No description provided.'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Properties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Priority', value: problem.priority },
                  { label: 'Status', value: problem.status.replace('_', ' ') },
                  { label: 'Assigned To', value: problem.assignedToName || 'Unassigned' },
                  { label: 'Created', value: formatDateTime(problem.createdAt) },
                  { label: 'Updated', value: formatDateTime(problem.updatedAt) },
                  { label: 'Linked Incidents', value: problem.linkedIncidents?.length ?? 0 },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-muted-foreground">{label}</span>
                    <span className="text-sm">{String(value)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rca" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Root Cause Analysis
              </CardTitle>
              <CardDescription>Document the root cause of this problem</CardDescription>
            </CardHeader>
            <CardContent>
              {problem.rootCause ? (
                <div className="rounded-md border p-4">
                  <p className="text-sm">{problem.rootCause}</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Lightbulb className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground">No root cause analysis documented yet.</p>
                  <Button variant="outline" size="sm" className="mt-3">
                    Add RCA
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Linked Incidents
              </CardTitle>
              <CardDescription>Incidents related to this problem</CardDescription>
            </CardHeader>
            <CardContent>
              {problem.linkedIncidents && problem.linkedIncidents.length > 0 ? (
                <ul className="space-y-2">
                  {problem.linkedIncidents.map((incId) => (
                    <li key={incId} className="flex items-center justify-between rounded-md border px-4 py-2">
                      <Link href={`/incidents/${incId}`} className="text-sm text-primary hover:underline font-mono">
                        {incId.slice(0, 8)}
                      </Link>
                      <Button variant="ghost" size="sm">View</Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground">No linked incidents.</p>
                  <Button variant="outline" size="sm" className="mt-3">Link Incident</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workaround" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Workaround
              </CardTitle>
              <CardDescription>Temporary solution to mitigate this problem</CardDescription>
            </CardHeader>
            <CardContent>
              {problem.workaround ? (
                <div className="rounded-md border bg-success/5 border-success/20 p-4">
                  <p className="text-sm">{problem.workaround}</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground">No workaround documented yet.</p>
                  <Button variant="outline" size="sm" className="mt-3">Add Workaround</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
