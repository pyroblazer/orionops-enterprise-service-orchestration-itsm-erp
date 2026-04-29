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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Package,
  Monitor,
  Warehouse,
  Plus,
  Search,
  AlertTriangle,
  Tag,
  MapPin,
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

// --- Types ---

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  warehouse: string;
  quantity: number;
  minQuantity: number;
  unitCost: number;
  category: string;
}

interface Asset {
  id: string;
  assetTag: string;
  name: string;
  type: string;
  status: 'in_use' | 'available' | 'maintenance' | 'disposed' | 'retired';
  location: string;
  assignedTo?: string;
  purchaseDate: string;
  value: number;
}

interface WarehouseLocation {
  id: string;
  name: string;
  location: string;
  capacity: number;
  utilized: number;
  manager: string;
  itemCount: number;
}

// --- Mock Data ---

const mockItems: InventoryItem[] = [
  { id: 'item-001', name: 'Dell PowerEdge R750 Server', sku: 'SRV-DELL-R750', warehouse: 'Main Warehouse', quantity: 15, minQuantity: 5, unitCost: 12500, category: 'Servers' },
  { id: 'item-002', name: 'Cisco Catalyst 9300 Switch', sku: 'NET-CISCO-9300', warehouse: 'Main Warehouse', quantity: 8, minQuantity: 3, unitCost: 8500, category: 'Networking' },
  { id: 'item-003', name: 'Samsung 27" Monitor', sku: 'MON-SAM-27', warehouse: 'IT Storage', quantity: 45, minQuantity: 10, unitCost: 350, category: 'Monitors' },
  { id: 'item-004', name: 'Logitech MX Keys Keyboard', sku: 'PER-LOG-MXK', warehouse: 'IT Storage', quantity: 3, minQuantity: 15, unitCost: 120, category: 'Peripherals' },
  { id: 'item-005', name: 'Cat6 Ethernet Cable (10ft)', sku: 'CAB-CAT6-10', warehouse: 'Main Warehouse', quantity: 200, minQuantity: 50, unitCost: 8, category: 'Cables' },
  { id: 'item-006', name: 'APC Smart-UPS 3000VA', sku: 'PWR-APC-3K', warehouse: 'Main Warehouse', quantity: 4, minQuantity: 2, unitCost: 2800, category: 'Power' },
  { id: 'item-007', name: 'Lenovo ThinkPad X1 Carbon', sku: 'LAP-LEN-X1C', warehouse: 'IT Storage', quantity: 2, minQuantity: 5, unitCost: 1800, category: 'Laptops' },
];

const mockAssets: Asset[] = [
  { id: 'asset-001', assetTag: 'AST-2024-001', name: 'Production Web Server 01', type: 'Server', status: 'in_use', location: 'Data Center A - Rack 3', assignedTo: 'Infrastructure Team', purchaseDate: '2024-03-15', value: 15000 },
  { id: 'asset-002', assetTag: 'AST-2024-002', name: 'Core Network Switch', type: 'Network Equipment', status: 'in_use', location: 'Data Center A - Rack 1', assignedTo: 'Network Team', purchaseDate: '2024-01-20', value: 12000 },
  { id: 'asset-003', assetTag: 'AST-2024-003', name: 'Development Workstation', type: 'Workstation', status: 'available', location: 'IT Storage Room B', purchaseDate: '2024-06-10', value: 3500 },
  { id: 'asset-004', assetTag: 'AST-2024-004', name: 'Backup Storage Array', type: 'Storage', status: 'maintenance', location: 'Data Center B - Rack 7', assignedTo: 'Storage Team', purchaseDate: '2023-11-05', value: 45000 },
  { id: 'asset-005', assetTag: 'AST-2023-015', name: 'Legacy Firewall', type: 'Security', status: 'disposed', location: 'Decommissioned', purchaseDate: '2020-08-12', value: 8000 },
  { id: 'asset-006', assetTag: 'AST-2025-001', name: 'Conference Room Display', type: 'AV Equipment', status: 'in_use', location: 'Building A - Room 301', assignedTo: 'Facilities', purchaseDate: '2025-02-28', value: 5000 },
];

const mockWarehouses: WarehouseLocation[] = [
  { id: 'wh-001', name: 'Main Warehouse', location: 'Building C - Ground Floor', capacity: 5000, utilized: 3750, manager: 'Tom Harris', itemCount: 156 },
  { id: 'wh-002', name: 'IT Storage', location: 'Building A - Basement', capacity: 2000, utilized: 1200, manager: 'Sarah Lee', itemCount: 89 },
  { id: 'wh-003', name: 'Data Center Staging', location: 'DC Campus - Room S1', capacity: 500, utilized: 320, manager: 'James Park', itemCount: 45 },
];

function getAssetStatusColor(status: string): string {
  const colors: Record<string, string> = {
    in_use: 'bg-success/20 text-success border-success',
    available: 'bg-info/20 text-info border-info',
    maintenance: 'bg-warning/20 text-warning border-warning',
    disposed: 'bg-muted text-muted-foreground border-muted',
    retired: 'bg-muted text-muted-foreground border-muted',
  };
  return colors[status] || 'bg-muted text-muted-foreground';
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState('items');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading] = useState(false);

  const lowStockItems = mockItems.filter((item) => item.quantity <= item.minQuantity);

  const filteredItems = mockItems.filter(
    (item) =>
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAssets = mockAssets.filter(
    (asset) =>
      !searchQuery ||
      asset.assetTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.assignedTo && asset.assignedTo.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredWarehouses = mockWarehouses.filter(
    (wh) =>
      !searchQuery ||
      wh.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wh.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory & Assets</h1>
          <p className="text-muted-foreground">
            Manage inventory items, fixed assets, and warehouse locations
          </p>
        </div>
        <Button aria-label="Add new item or asset">
          <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
          Add Item
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockItems.length}</div>
            <p className="text-xs text-muted-foreground">Inventory items tracked</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-danger">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-danger" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-danger">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">Below minimum quantity</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-success">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Assets</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockAssets.filter((a) => a.status === 'in_use').length}
            </div>
            <p className="text-xs text-muted-foreground">Currently in use</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-info">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warehouses</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockWarehouses.length}</div>
            <p className="text-xs text-muted-foreground">Storage locations</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder="Search items, assets, warehouses..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search inventory and assets"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="items">
            <Package className="mr-1 h-4 w-4" aria-hidden="true" />
            Items
          </TabsTrigger>
          <TabsTrigger value="assets">
            <Monitor className="mr-1 h-4 w-4" aria-hidden="true" />
            Assets
          </TabsTrigger>
          <TabsTrigger value="warehouses">
            <Warehouse className="mr-1 h-4 w-4" aria-hidden="true" />
            Warehouses
          </TabsTrigger>
        </TabsList>

        {/* Items Tab */}
        <TabsContent value="items" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Items</CardTitle>
              <CardDescription>Track stock levels and costs for all inventory items</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-3 p-6" role="status" aria-label="Loading inventory items">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Warehouse</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Min Qty</TableHead>
                      <TableHead>Unit Cost</TableHead>
                      <TableHead>Category</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.length > 0 ? (
                      filteredItems.map((item) => {
                        const isLowStock = item.quantity <= item.minQuantity;
                        return (
                          <TableRow key={item.id} className={cn(isLowStock && 'bg-danger/5')}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {isLowStock && (
                                  <AlertTriangle className="h-4 w-4 text-danger" aria-hidden="true" />
                                )}
                                {item.name}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                            <TableCell className="text-muted-foreground">{item.warehouse}</TableCell>
                            <TableCell>
                              <span className={cn('font-medium', isLowStock ? 'text-danger' : '')}>
                                {item.quantity}
                              </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{item.minQuantity}</TableCell>
                            <TableCell>{formatCurrency(item.unitCost)}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.category}</Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          No inventory items found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assets Tab */}
        <TabsContent value="assets" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Fixed Assets</CardTitle>
              <CardDescription>Track and manage organizational assets</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-3 p-6" role="status" aria-label="Loading assets">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset Tag</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssets.length > 0 ? (
                      filteredAssets.map((asset) => (
                        <TableRow key={asset.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Tag className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                              <span className="font-mono text-sm font-medium">{asset.assetTag}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{asset.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{asset.type}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn('capitalize', getAssetStatusColor(asset.status))}>
                              {asset.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="h-3 w-3" aria-hidden="true" />
                              <span className="text-sm">{asset.location}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {asset.assignedTo || '--'}
                          </TableCell>
                          <TableCell>{formatCurrency(asset.value)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          No assets found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Warehouses Tab */}
        <TabsContent value="warehouses" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredWarehouses.map((wh) => {
              const utilization = (wh.utilized / wh.capacity) * 100;
              return (
                <Card key={wh.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{wh.name}</CardTitle>
                      <Badge
                        className={cn(
                          utilization > 90
                            ? 'bg-danger/20 text-danger'
                            : utilization > 70
                            ? 'bg-warning/20 text-warning'
                            : 'bg-success/20 text-success'
                        )}
                      >
                        {utilization.toFixed(0)}% full
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" aria-hidden="true" />
                      {wh.location}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          utilization > 90 ? 'bg-danger' : utilization > 70 ? 'bg-warning' : 'bg-success'
                        )}
                        style={{ width: `${utilization}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Capacity</p>
                        <p className="font-medium">{wh.capacity.toLocaleString()} units</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Items</p>
                        <p className="font-medium">{wh.itemCount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Manager</p>
                        <p className="font-medium">{wh.manager}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Utilized</p>
                        <p className="font-medium">{wh.utilized.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
