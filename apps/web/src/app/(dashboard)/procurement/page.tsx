'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShoppingCart,
  FileSignature,
  Plus,
  Search,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { formatCurrency, formatDateTime, cn } from '@/lib/utils';

// --- Types ---

interface PurchaseRequest {
  id: string;
  prNumber: string;
  title: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'ordered';
  estimatedCost: number;
  requestedBy: string;
  department: string;
  createdAt: string;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendor: string;
  status: 'draft' | 'issued' | 'partial' | 'received' | 'closed' | 'cancelled';
  totalAmount: number;
  expectedDelivery: string;
  issuedDate: string;
}

interface Contract {
  id: string;
  contractNumber: string;
  title: string;
  vendor: string;
  type: 'service' | 'software' | 'hardware' | 'maintenance';
  status: 'active' | 'expired' | 'pending_renewal' | 'terminated';
  value: number;
  startDate: string;
  endDate: string;
}

// --- Mock Data ---

const mockPRs: PurchaseRequest[] = [
  { id: 'pr-001', prNumber: 'PR-2026-0142', title: 'Server hardware upgrade for production cluster', priority: 'high', status: 'approved', estimatedCost: 75000, requestedBy: 'John Smith', department: 'IT Infrastructure', createdAt: '2026-04-15T09:00:00Z' },
  { id: 'pr-002', prNumber: 'PR-2026-0143', title: 'Annual security software licenses', priority: 'medium', status: 'submitted', estimatedCost: 45000, requestedBy: 'Jane Doe', department: 'Information Security', createdAt: '2026-04-18T14:30:00Z' },
  { id: 'pr-003', prNumber: 'PR-2026-0144', title: 'Office furniture for new hires', priority: 'low', status: 'draft', estimatedCost: 12000, requestedBy: 'Bob Wilson', department: 'Facilities', createdAt: '2026-04-20T10:00:00Z' },
  { id: 'pr-004', prNumber: 'PR-2026-0145', title: 'Emergency network equipment replacement', priority: 'critical', status: 'ordered', estimatedCost: 28000, requestedBy: 'Mike Chen', department: 'Network Operations', createdAt: '2026-04-22T08:15:00Z' },
  { id: 'pr-005', prNumber: 'PR-2026-0146', title: 'Cloud backup storage expansion', priority: 'medium', status: 'rejected', estimatedCost: 18000, requestedBy: 'Alice Brown', department: 'Cloud Operations', createdAt: '2026-04-23T11:45:00Z' },
];

const mockPOs: PurchaseOrder[] = [
  { id: 'po-001', poNumber: 'PO-2026-0089', vendor: 'TechSupply Co.', status: 'issued', totalAmount: 75000, expectedDelivery: '2026-05-15T00:00:00Z', issuedDate: '2026-04-20T00:00:00Z' },
  { id: 'po-002', poNumber: 'PO-2026-0090', vendor: 'NetEquip Inc.', status: 'partial', totalAmount: 28000, expectedDelivery: '2026-05-01T00:00:00Z', issuedDate: '2026-04-23T00:00:00Z' },
  { id: 'po-003', poNumber: 'PO-2026-0091', vendor: 'SecureNet LLC', status: 'received', totalAmount: 15000, expectedDelivery: '2026-04-25T00:00:00Z', issuedDate: '2026-04-10T00:00:00Z' },
  { id: 'po-004', poNumber: 'PO-2026-0092', vendor: 'CloudCorp Inc.', status: 'draft', totalAmount: 45000, expectedDelivery: '2026-06-01T00:00:00Z', issuedDate: '2026-04-25T00:00:00Z' },
  { id: 'po-005', poNumber: 'PO-2026-0093', vendor: 'DataVault Systems', status: 'closed', totalAmount: 9500, expectedDelivery: '2026-04-15T00:00:00Z', issuedDate: '2026-03-15T00:00:00Z' },
];

const mockContracts: Contract[] = [
  { id: 'con-001', contractNumber: 'CTR-2026-012', title: 'Managed Security Services Agreement', vendor: 'SecureNet LLC', type: 'service', status: 'active', value: 250000, startDate: '2026-01-01T00:00:00Z', endDate: '2026-12-31T23:59:59Z' },
  { id: 'con-002', contractNumber: 'CTR-2026-013', title: 'Enterprise ERP License', vendor: 'SAP Solutions', type: 'software', status: 'active', value: 180000, startDate: '2026-03-01T00:00:00Z', endDate: '2027-02-28T23:59:59Z' },
  { id: 'con-003', contractNumber: 'CTR-2025-008', title: 'Data Center Cooling Maintenance', vendor: 'CoolTech Services', type: 'maintenance', status: 'pending_renewal', value: 45000, startDate: '2025-07-01T00:00:00Z', endDate: '2026-06-30T23:59:59Z' },
  { id: 'con-004', contractNumber: 'CTR-2025-005', title: 'Network Equipment Warranty', vendor: 'Cisco Systems', type: 'hardware', status: 'expired', value: 35000, startDate: '2025-01-01T00:00:00Z', endDate: '2025-12-31T23:59:59Z' },
  { id: 'con-005', contractNumber: 'CTR-2026-014', title: 'Cloud Infrastructure SLA', vendor: 'CloudCorp Inc.', type: 'service', status: 'active', value: 500000, startDate: '2026-02-01T00:00:00Z', endDate: '2027-01-31T23:59:59Z' },
];

function getPRStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground border-muted',
    submitted: 'bg-info/20 text-info border-info',
    approved: 'bg-success/20 text-success border-success',
    rejected: 'bg-danger/20 text-danger border-danger',
    ordered: 'bg-primary/20 text-primary border-primary',
  };
  return colors[status] || 'bg-muted text-muted-foreground';
}

function getPOStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground border-muted',
    issued: 'bg-info/20 text-info border-info',
    partial: 'bg-warning/20 text-warning border-warning',
    received: 'bg-success/20 text-success border-success',
    closed: 'bg-muted text-muted-foreground border-muted',
    cancelled: 'bg-danger/20 text-danger border-danger',
  };
  return colors[status] || 'bg-muted text-muted-foreground';
}

function getContractStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-success/20 text-success border-success',
    expired: 'bg-danger/20 text-danger border-danger',
    pending_renewal: 'bg-warning/20 text-warning border-warning',
    terminated: 'bg-danger/20 text-danger border-danger',
  };
  return colors[status] || 'bg-muted text-muted-foreground';
}

export default function ProcurementPage() {
  const [activeTab, setActiveTab] = useState('requests');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading] = useState(false);

  const filteredPRs = mockPRs.filter(
    (pr) =>
      !searchQuery ||
      pr.prNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pr.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPOs = mockPOs.filter(
    (po) =>
      !searchQuery ||
      po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.vendor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredContracts = mockContracts.filter(
    (c) =>
      !searchQuery ||
      c.contractNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.vendor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Procurement</h1>
          <p className="text-muted-foreground">
            Manage purchase requests, orders, and vendor contracts
          </p>
        </div>
        <Button aria-label="Create new procurement record">
          <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
          New Request
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-info">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Requests</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockPRs.filter((pr) => ['draft', 'submitted'].includes(pr.status)).length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockPOs.filter((po) => ['issued', 'partial'].includes(po.status)).length}
            </div>
            <p className="text-xs text-muted-foreground">In fulfillment</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-success">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
            <FileSignature className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockContracts.filter((c) => c.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">Currently in effect</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-warning">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Renewals</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {mockContracts.filter((c) => c.status === 'pending_renewal').length}
            </div>
            <p className="text-xs text-muted-foreground">Expiring soon</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder="Search procurement records..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search procurement records"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="requests">
            <ShoppingCart className="mr-1 h-4 w-4" aria-hidden="true" />
            Purchase Requests
          </TabsTrigger>
          <TabsTrigger value="orders">
            <Package className="mr-1 h-4 w-4" aria-hidden="true" />
            Purchase Orders
          </TabsTrigger>
          <TabsTrigger value="contracts">
            <FileSignature className="mr-1 h-4 w-4" aria-hidden="true" />
            Contracts
          </TabsTrigger>
        </TabsList>

        {/* Purchase Requests Tab */}
        <TabsContent value="requests" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Requests</CardTitle>
              <CardDescription>All submitted purchase requests with approval status</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-3 p-6" role="status" aria-label="Loading purchase requests">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PR Number</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Estimated Cost</TableHead>
                      <TableHead>Requested By</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPRs.length > 0 ? (
                      filteredPRs.map((pr) => (
                        <TableRow key={pr.id}>
                          <TableCell className="font-mono text-sm font-medium">{pr.prNumber}</TableCell>
                          <TableCell className="font-medium">{pr.title}</TableCell>
                          <TableCell>
                            <Badge
                              className={cn(
                                'capitalize',
                                pr.priority === 'critical'
                                  ? 'bg-danger/20 text-danger border-danger'
                                  : pr.priority === 'high'
                                  ? 'bg-warning/20 text-warning border-warning'
                                  : pr.priority === 'medium'
                                  ? 'bg-primary/20 text-primary border-primary'
                                  : 'bg-success/20 text-success border-success'
                              )}
                            >
                              {pr.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn('capitalize', getPRStatusColor(pr.status))}>
                              {pr.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatCurrency(pr.estimatedCost)}</TableCell>
                          <TableCell className="text-muted-foreground">{pr.requestedBy}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDateTime(pr.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          No purchase requests found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Purchase Orders Tab */}
        <TabsContent value="orders" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Orders</CardTitle>
              <CardDescription>Issued purchase orders with delivery tracking</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-3 p-6" role="status" aria-label="Loading purchase orders">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PO Number</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Issued Date</TableHead>
                      <TableHead>Expected Delivery</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPOs.length > 0 ? (
                      filteredPOs.map((po) => (
                        <TableRow key={po.id}>
                          <TableCell className="font-mono text-sm font-medium">{po.poNumber}</TableCell>
                          <TableCell>{po.vendor}</TableCell>
                          <TableCell>
                            <Badge className={cn('capitalize', getPOStatusColor(po.status))}>
                              {po.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatCurrency(po.totalAmount)}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDateTime(po.issuedDate)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDateTime(po.expectedDelivery)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          No purchase orders found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contracts Tab */}
        <TabsContent value="contracts" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Contracts</CardTitle>
              <CardDescription>Vendor contracts and agreements</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-3 p-6" role="status" aria-label="Loading contracts">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contract #</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>End Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContracts.length > 0 ? (
                      filteredContracts.map((contract) => (
                        <TableRow key={contract.id}>
                          <TableCell className="font-mono text-sm font-medium">
                            {contract.contractNumber}
                          </TableCell>
                          <TableCell className="font-medium">{contract.title}</TableCell>
                          <TableCell>{contract.vendor}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {contract.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn('capitalize', getContractStatusColor(contract.status))}>
                              {contract.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatCurrency(contract.value)}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDateTime(contract.endDate)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          No contracts found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
