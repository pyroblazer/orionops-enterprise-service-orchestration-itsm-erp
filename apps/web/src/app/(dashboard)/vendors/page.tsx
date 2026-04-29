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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Building2,
  Star,
  Plus,
  Search,
  TrendingUp,
  Shield,
  Clock,
  Phone,
  Mail,
  Globe,
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

// --- Types ---

interface Vendor {
  id: string;
  name: string;
  code: string;
  type: 'hardware' | 'software' | 'service' | 'cloud' | 'consulting';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  rating: number;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  totalSpend: number;
  activeContracts: number;
  slaCompliance: number;
  onTimeDelivery: number;
}

// --- Mock Data ---

const mockVendors: Vendor[] = [
  {
    id: 'vnd-001', name: 'CloudCorp Inc.', code: 'VND-CC-001', type: 'cloud', status: 'active',
    rating: 4.5, contactName: 'Sarah Johnson', email: 'sarah@cloudcorp.com', phone: '+1-555-0101',
    website: 'https://cloudcorp.com', totalSpend: 525000, activeContracts: 2, slaCompliance: 98.5, onTimeDelivery: 97.2,
  },
  {
    id: 'vnd-002', name: 'SecureNet LLC', code: 'VND-SN-002', type: 'service', status: 'active',
    rating: 4.2, contactName: 'Mike Torres', email: 'mike@securenet.com', phone: '+1-555-0102',
    website: 'https://securenet.com', totalSpend: 250000, activeContracts: 1, slaCompliance: 95.8, onTimeDelivery: 93.4,
  },
  {
    id: 'vnd-003', name: 'TechSupply Co.', code: 'VND-TS-003', type: 'hardware', status: 'active',
    rating: 3.8, contactName: 'Lisa Wang', email: 'lisa@techsupply.com', phone: '+1-555-0103',
    website: 'https://techsupply.com', totalSpend: 180000, activeContracts: 1, slaCompliance: 88.2, onTimeDelivery: 85.0,
  },
  {
    id: 'vnd-004', name: 'DataVault Systems', code: 'VND-DV-004', type: 'software', status: 'active',
    rating: 4.0, contactName: 'James Park', email: 'james@datavault.com', phone: '+1-555-0104',
    website: 'https://datavault.com', totalSpend: 95000, activeContracts: 1, slaCompliance: 92.1, onTimeDelivery: 96.5,
  },
  {
    id: 'vnd-005', name: 'Nexus Consulting', code: 'VND-NC-005', type: 'consulting', status: 'active',
    rating: 4.7, contactName: 'Emily Chen', email: 'emily@nexusconsulting.com', phone: '+1-555-0105',
    website: 'https://nexusconsulting.com', totalSpend: 675000, activeContracts: 3, slaCompliance: 99.1, onTimeDelivery: 98.8,
  },
  {
    id: 'vnd-006', name: 'NetEquip Inc.', code: 'VND-NE-006', type: 'hardware', status: 'pending',
    rating: 3.5, contactName: 'Robert Kim', email: 'robert@netequip.com', phone: '+1-555-0106',
    website: 'https://netequip.com', totalSpend: 28000, activeContracts: 0, slaCompliance: 0, onTimeDelivery: 0,
  },
  {
    id: 'vnd-007', name: 'Legacy Systems Corp.', code: 'VND-LS-007', type: 'service', status: 'suspended',
    rating: 2.1, contactName: 'Diana Ross', email: 'diana@legacysystems.com', phone: '+1-555-0107',
    website: 'https://legacysystems.com', totalSpend: 15000, activeContracts: 0, slaCompliance: 45.2, onTimeDelivery: 52.0,
  },
];

function getVendorStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-success/20 text-success border-success',
    inactive: 'bg-muted text-muted-foreground border-muted',
    pending: 'bg-warning/20 text-warning border-warning',
    suspended: 'bg-danger/20 text-danger border-danger',
  };
  return colors[status] || 'bg-muted text-muted-foreground';
}

function getVendorTypeColor(type: string): string {
  const colors: Record<string, string> = {
    hardware: 'bg-info/20 text-info',
    software: 'bg-primary/20 text-primary',
    service: 'bg-success/20 text-success',
    cloud: 'bg-warning/20 text-warning',
    consulting: 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
  };
  return colors[type] || 'bg-muted text-muted-foreground';
}

function renderStars(rating: number) {
  return (
    <div className="flex items-center gap-1" aria-label={`Rating: ${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'h-3 w-3',
            i < Math.floor(rating)
              ? 'fill-warning text-warning'
              : i < rating
              ? 'fill-warning/50 text-warning'
              : 'text-muted-foreground/30'
          )}
          aria-hidden="true"
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function VendorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading] = useState(false);

  const filteredVendors = mockVendors.filter((vendor) => {
    const matchesSearch =
      !searchQuery ||
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !typeFilter || vendor.type === typeFilter;
    const matchesStatus = !statusFilter || vendor.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const activeVendors = mockVendors.filter((v) => v.status === 'active');
  const avgSlaCompliance =
    activeVendors.length > 0
      ? activeVendors.reduce((sum, v) => sum + v.slaCompliance, 0) / activeVendors.length
      : 0;
  const avgOnTime =
    activeVendors.length > 0
      ? activeVendors.reduce((sum, v) => sum + v.onTimeDelivery, 0) / activeVendors.length
      : 0;
  const totalSpend = mockVendors.reduce((sum, v) => sum + v.totalSpend, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vendor Management</h1>
          <p className="text-muted-foreground">
            Manage vendor relationships, performance, and SLA compliance
          </p>
        </div>
        <Button aria-label="Add new vendor">
          <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
          Add Vendor
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeVendors.length}</div>
            <p className="text-xs text-muted-foreground">Of {mockVendors.length} total vendors</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-success">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg SLA Compliance</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgSlaCompliance.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Across active vendors</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-info">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On-Time Delivery</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgOnTime.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Average delivery rate</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-warning">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpend)}</div>
            <p className="text-xs text-muted-foreground">Year to date</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder="Search vendors..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search vendors"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40" aria-label="Filter by vendor type">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All types</SelectItem>
            <SelectItem value="hardware">Hardware</SelectItem>
            <SelectItem value="software">Software</SelectItem>
            <SelectItem value="service">Service</SelectItem>
            <SelectItem value="cloud">Cloud</SelectItem>
            <SelectItem value="consulting">Consulting</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40" aria-label="Filter by vendor status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Vendor Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vendors</CardTitle>
          <CardDescription>All vendor records with performance metrics</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6" role="status" aria-label="Loading vendors">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>SLA Compliance</TableHead>
                  <TableHead>On-Time</TableHead>
                  <TableHead>Total Spend</TableHead>
                  <TableHead>Contracts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendors.length > 0 ? (
                  filteredVendors.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{vendor.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" aria-hidden="true" />
                            {vendor.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{vendor.code}</TableCell>
                      <TableCell>
                        <Badge className={cn('capitalize', getVendorTypeColor(vendor.type))}>
                          {vendor.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('capitalize', getVendorStatusColor(vendor.status))}>
                          {vendor.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{renderStars(vendor.rating)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                vendor.slaCompliance >= 95
                                  ? 'bg-success'
                                  : vendor.slaCompliance >= 80
                                  ? 'bg-warning'
                                  : 'bg-danger'
                              )}
                              style={{ width: `${vendor.slaCompliance}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {vendor.slaCompliance > 0 ? `${vendor.slaCompliance}%` : 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {vendor.onTimeDelivery > 0 ? `${vendor.onTimeDelivery}%` : 'N/A'}
                      </TableCell>
                      <TableCell>{formatCurrency(vendor.totalSpend)}</TableCell>
                      <TableCell className="text-center">{vendor.activeContracts}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Building2 className="h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
                        <p>No vendors found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
