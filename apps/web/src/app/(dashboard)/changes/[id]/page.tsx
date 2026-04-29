'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useChange } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  ListChecks,
  FileText,
  User,
} from 'lucide-react';
import { formatDateTime, getStatusColor, getPriorityColor, cn } from '@/lib/utils';

export default function ChangeDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: change, isLoading } = useChange(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!change) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Change not found</h2>
        <Link href="/changes" className="mt-4">
          <Button variant="outline">Back to Changes</Button>
        </Link>
      </div>
    );
  }

  const riskLevels = ['low', 'medium', 'high', 'critical'];
  const currentRiskIndex = riskLevels.indexOf(change.risk);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/changes" className="hover:text-foreground">Changes</Link>
        <span>/</span>
        <span className="text-foreground">{change.id.slice(0, 8)}</span>
      </div>

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Link href="/changes">
              <Button variant="ghost" size="icon" aria-label="Back to changes">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{change.title}</h1>
          </div>
          <div className="flex items-center gap-3 pl-11">
            <Badge variant="outline" className="capitalize">{change.type} Change</Badge>
            <Badge className={cn('capitalize', getStatusColor(change.status))}>
              {change.status.replace('_', ' ')}
            </Badge>
            <Badge className={cn('capitalize', getPriorityColor(change.risk))}>
              Risk: {change.risk}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {change.approvalStatus === 'pending' && (
            <>
              <Button variant="outline">
                <CheckCircle className="mr-1 h-4 w-4" /> Approve
              </Button>
              <Button variant="destructive" size="sm">
                Reject
              </Button>
            </>
          )}
          {change.status === 'approved' && (
            <Button>Start Implementation</Button>
          )}
        </div>
      </div>

      {/* Timeline Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-sm">
            <div className="text-center">
              <p className="font-medium">Planned Start</p>
              <p className="text-muted-foreground">{formatDateTime(change.plannedStart)}</p>
            </div>
            <div className="flex-1 mx-4 border-t-2 border-dashed" />
            <div className="text-center">
              <p className="font-medium">Planned End</p>
              <p className="text-muted-foreground">{formatDateTime(change.plannedEnd)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
          <TabsTrigger value="approval">Approval Chain</TabsTrigger>
          <TabsTrigger value="implementation">Implementation</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{change.description || 'No description.'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Properties</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Type', value: change.type },
                  { label: 'Risk', value: change.risk },
                  { label: 'Impact', value: change.impact },
                  { label: 'Requested By', value: change.requestedByName },
                  { label: 'Assigned To', value: change.assignedToName || 'Unassigned' },
                  { label: 'Approval', value: change.approvalStatus.replace('_', ' ') },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-muted-foreground">{label}</span>
                    <span className="text-sm capitalize">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risk" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" /> Risk Assessment
              </CardTitle>
              <CardDescription>Evaluate the risk level of this change</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Risk Level</p>
                  <div className="flex gap-2">
                    {riskLevels.map((level, index) => (
                      <div
                        key={level}
                        className={cn(
                          'flex-1 rounded-md border p-3 text-center text-sm capitalize',
                          index === currentRiskIndex && 'border-2 font-bold',
                          index === 0 && 'border-success bg-success/10',
                          index === 1 && 'border-warning bg-warning/10',
                          index >= 2 && 'border-danger bg-danger/10'
                        )}
                      >
                        {level}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Impact Level</p>
                  <Badge className={cn('capitalize', getPriorityColor(change.impact))}>
                    {change.impact} impact
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approval" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" /> Approval Chain
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {change.approvalStatus === 'approved' ? (
                  <div className="flex items-center gap-3 rounded-md border border-success bg-success/10 p-4">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <div>
                      <p className="font-medium">Approved</p>
                      <p className="text-sm text-muted-foreground">This change has been approved</p>
                    </div>
                  </div>
                ) : change.approvalStatus === 'rejected' ? (
                  <div className="flex items-center gap-3 rounded-md border border-danger bg-danger/10 p-4">
                    <AlertTriangle className="h-5 w-5 text-danger" />
                    <div>
                      <p className="font-medium">Rejected</p>
                      <p className="text-sm text-muted-foreground">This change was not approved</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-md border border-warning bg-warning/10 p-4">
                    <Clock className="h-5 w-5 text-warning" />
                    <div>
                      <p className="font-medium">Pending Approval</p>
                      <p className="text-sm text-muted-foreground">Awaiting review by Change Advisory Board</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="implementation" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListChecks className="h-5 w-5" /> Implementation Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                {change.implementationPlan ? (
                  <div className="rounded-md border p-4">
                    <p className="text-sm">{change.implementationPlan}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No implementation plan documented.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Rollback Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                {change.rollbackPlan ? (
                  <div className="rounded-md border p-4">
                    <p className="text-sm">{change.rollbackPlan}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No rollback plan documented.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
