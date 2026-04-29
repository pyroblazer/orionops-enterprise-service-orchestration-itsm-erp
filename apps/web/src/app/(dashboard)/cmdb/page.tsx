'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Boxes, Search, Network, List, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const mockCIs = [
  { id: 'ci-001', name: 'PROD-WEB-01', type: 'Server', status: 'active', environment: 'Production', owner: 'Infrastructure Team' },
  { id: 'ci-002', name: 'PROD-DB-01', type: 'Database', status: 'active', environment: 'Production', owner: 'Database Team' },
  { id: 'ci-003', name: 'PROD-APP-01', type: 'Application', status: 'active', environment: 'Production', owner: 'App Dev Team' },
  { id: 'ci-004', name: 'STG-WEB-01', type: 'Server', status: 'active', environment: 'Staging', owner: 'Infrastructure Team' },
  { id: 'ci-005', name: 'NETWORK-SW-01', type: 'Switch', status: 'active', environment: 'Production', owner: 'Network Team' },
  { id: 'ci-006', name: 'DEV-APP-01', type: 'Application', status: 'maintenance', environment: 'Development', owner: 'App Dev Team' },
  { id: 'ci-007', name: 'PROD-LB-01', type: 'Load Balancer', status: 'active', environment: 'Production', owner: 'Infrastructure Team' },
  { id: 'ci-008', name: 'BACKUP-SRV-01', type: 'Server', status: 'standby', environment: 'Production', owner: 'Infrastructure Team' },
];

export default function CMDBPage() {
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [envFilter, setEnvFilter] = useState('');

  const filteredCIs = mockCIs.filter((ci) => {
    const matchesSearch = !searchQuery ||
      ci.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ci.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !typeFilter || ci.type === typeFilter;
    const matchesEnv = !envFilter || ci.environment === envFilter;
    return matchesSearch && matchesType && matchesEnv;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CMDB Explorer</h1>
          <p className="text-muted-foreground">Configuration items and their relationships</p>
        </div>
        <Button aria-label="Add new CI">
          <Plus className="mr-1 h-4 w-4" /> Add CI
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search CIs..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search configuration items"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All types</SelectItem>
            <SelectItem value="Server">Server</SelectItem>
            <SelectItem value="Database">Database</SelectItem>
            <SelectItem value="Application">Application</SelectItem>
            <SelectItem value="Switch">Switch</SelectItem>
            <SelectItem value="Load Balancer">Load Balancer</SelectItem>
          </SelectContent>
        </Select>
        <Select value={envFilter} onValueChange={setEnvFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All environments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All environments</SelectItem>
            <SelectItem value="Production">Production</SelectItem>
            <SelectItem value="Staging">Staging</SelectItem>
            <SelectItem value="Development">Development</SelectItem>
          </SelectContent>
        </Select>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'graph')}>
          <TabsList>
            <TabsTrigger value="list"><List className="mr-1 h-4 w-4" /> List</TabsTrigger>
            <TabsTrigger value="graph"><Network className="mr-1 h-4 w-4" /> Graph</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {viewMode === 'list' ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Environment</TableHead>
                  <TableHead>Owner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCIs.map((ci) => (
                  <TableRow key={ci.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Boxes className="h-4 w-4 text-muted-foreground" />
                        {ci.name}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{ci.type}</Badge></TableCell>
                    <TableCell>
                      <Badge className={cn(
                        'capitalize',
                        ci.status === 'active' ? 'bg-success/20 text-success border-success' :
                        ci.status === 'maintenance' ? 'bg-warning/20 text-warning border-warning' :
                        'bg-muted text-muted-foreground'
                      )}>
                        {ci.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{ci.environment}</TableCell>
                    <TableCell className="text-muted-foreground">{ci.owner}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" /> Relationship Graph
            </CardTitle>
            <CardDescription>Visualize CI dependencies and relationships</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center rounded-md border bg-muted/30 py-24">
              <div className="text-center">
                <Network className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Interactive relationship graph</p>
                <p className="text-xs text-muted-foreground">Drag and zoom to explore CI relationships</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
