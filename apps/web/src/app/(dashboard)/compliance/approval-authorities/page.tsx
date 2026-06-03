'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface ApprovalAuthority {
  userId: string;
  userName: string;
  activityType: string;
  maxAmount: number;
}

interface CheckRequest {
  user: string;
  activity: string;
  amount: number;
}

export default function ApprovalAuthoritiesPage() {
  const [checkRequest, setCheckRequest] = useState<CheckRequest>({ user: '', activity: '', amount: 0 });
  const [checkResult, setCheckResult] = useState<{ canApprove: boolean; message: string } | null>(null);
  const queryClient = useQueryClient();

  const { isLoading } = useQuery({
    queryKey: ['compliance', 'approval-authorities'],
    queryFn: () => api.getSuggestedApprover?.(),
  });

  const authorities: ApprovalAuthority[] = [];

  const checkAuthorityMutation = useMutation({
    mutationFn: (request: CheckRequest) =>
      api.canUserApprove({ user: request.user, activity: request.activity, amount: request.amount }),
    onSuccess: (res) => {
      setCheckResult({
        canApprove: (res?.data as unknown as boolean) === true,
        message: (res?.data as unknown as boolean) === true ? 'User can approve' : 'User cannot approve',
      });
    },
    onError: () => {
      console.error('Error checking authority');
    },
  });

  const setAuthorityMutation = useMutation({
    mutationFn: (data: { userId: string; activityType: string; maxAmount: number }) =>
      api.setApprovalAuthority(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance', 'approval-authorities'] });
      console.log('Authority set successfully');
    },
    onError: () => {
      console.error('Error setting authority');
    },
  });

  if (isLoading) {
    return <Skeleton className="h-[500px]" />;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Approval Authorities</h1>
          <p className="text-muted-foreground">Manage user approval limits and authorities</p>
        </div>
        <Button disabled={setAuthorityMutation.isPending}>Set Authority</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Authorities</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Activity Type</TableHead>
                <TableHead>Max Amount</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {authorities.map((auth) => (
                <TableRow key={auth.userId}>
                  <TableCell>{auth.userName}</TableCell>
                  <TableCell className="font-mono">{auth.activityType}</TableCell>
                  <TableCell>${auth.maxAmount?.toLocaleString()}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">Edit</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle>Check Approval</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm font-medium">User</label>
            <input
              type="text"
              placeholder="Select user"
              className="w-full mt-1 rounded border px-3 py-2"
              value={checkRequest.user}
              onChange={(e) => setCheckRequest({ ...checkRequest, user: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Activity</label>
            <input
              type="text"
              placeholder="Activity type"
              className="w-full mt-1 rounded border px-3 py-2"
              value={checkRequest.activity}
              onChange={(e) => setCheckRequest({ ...checkRequest, activity: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Amount</label>
            <input
              type="number"
              placeholder="0"
              className="w-full mt-1 rounded border px-3 py-2"
              value={checkRequest.amount}
              onChange={(e) => setCheckRequest({ ...checkRequest, amount: parseFloat(e.target.value) })}
            />
          </div>
          <Button
            className="w-full"
            onClick={() => checkAuthorityMutation.mutate(checkRequest)}
            disabled={checkAuthorityMutation.isPending}
          >
            {checkAuthorityMutation.isPending ? 'Checking...' : 'Check Authority'}
          </Button>
          {checkResult && (
            <div className={`p-3 rounded mt-3 ${checkResult.canApprove ? 'bg-green-100' : 'bg-red-100'}`}>
              <p className="text-sm font-medium">{checkResult.message}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
