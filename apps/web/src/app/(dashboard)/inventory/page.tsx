'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Monitor, Warehouse, Plus, Search, AlertTriangle, Check, X, Pencil, Trash2, ArrowUpDown } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { api, InventoryItem, Asset } from '@/lib/api';

const ASSET_TYPES = ['laptop', 'desktop', 'server', 'network', 'phone', 'furniture', 'vehicle', 'other'];
const ASSET_STATUSES = ['in_use', 'available', 'maintenance', 'disposed'];
const CURRENCIES = ['USD', 'EUR', 'GBP'];

function assetStatusColor(s: string) {
  return s === 'in_use' ? 'bg-success/20 text-success border-success'
    : s === 'available' ? 'bg-info/20 text-info border-info'
    : s === 'maintenance' ? 'bg-warning/20 text-warning border-warning'
    : 'bg-muted text-muted-foreground';
}

export default function InventoryPage() {
  const qc = useQueryClient();

  // Items state
  const [itemSearch, setItemSearch] = useState('');
  const [itemWarehouse, setItemWarehouse] = useState('');
  const [showItemForm, setShowItemForm] = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState({ name: '', sku: '', description: '', unit: 'each', warehouseId: '', quantityOnHand: 0, minimumQuantity: 0, maximumQuantity: 0, unitCost: 0, currency: 'USD' });
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [stockItemId, setStockItemId] = useState<string | null>(null);
  const [stockForm, setStockForm] = useState({ adjustmentType: 'in', quantity: 1, reason: '', referenceNumber: '' });

  // Assets state
  const [assetSearch, setAssetSearch] = useState('');
  const [assetStatus, setAssetStatus] = useState('');
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [editAssetId, setEditAssetId] = useState<string | null>(null);
  const [assetForm, setAssetForm] = useState({ name: '', assetTag: '', type: 'laptop', serialNumber: '', purchaseDate: '', purchaseValue: 0, currency: 'USD', warehouseId: '', assignedTo: '', location: '', warrantyExpiry: '' });
  const [deleteAssetId, setDeleteAssetId] = useState<string | null>(null);

  // Warehouse state
  const [showWhForm, setShowWhForm] = useState(false);
  const [editWhId, setEditWhId] = useState<string | null>(null);
  const [whForm, setWhForm] = useState({ name: '', location: '', address: '', capacity: 0, manager: '', notes: '' });

  // Queries
  const { data: itemsData, isLoading: loadingItems } = useQuery({
    queryKey: ['inventory-items', { itemSearch, itemWarehouse }],
    queryFn: () => api.getInventoryItems({ search: itemSearch || undefined, warehouseId: itemWarehouse || undefined }).then(r => r.data),
  });
  const { data: lowStockData } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => api.getLowStockItems().then(r => r.data),
  });
  const { data: assetsData, isLoading: loadingAssets } = useQuery({
    queryKey: ['assets', { assetSearch, assetStatus }],
    queryFn: () => api.getAssets({ search: assetSearch || undefined, status: assetStatus || undefined }).then(r => r.data),
  });
  const { data: warehousesData, isLoading: loadingWarehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => api.getWarehouses().then(r => r.data),
  });

  // Item mutations
  const createItem = useMutation({ mutationFn: () => api.createInventoryItem(itemForm), onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory-items'] }); setShowItemForm(false); } });
  const updateItem = useMutation({ mutationFn: ({ id, d }: { id: string; d: Partial<InventoryItem> }) => api.updateInventoryItem(id, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory-items'] }); setEditItemId(null); } });
  const deleteItem = useMutation({ mutationFn: (id: string) => api.deleteInventoryItem(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory-items'] }); setDeleteItemId(null); } });
  const stockMovement = useMutation({ mutationFn: () => api.recordStockMovement({ inventoryItemId: stockItemId ?? undefined, ...stockForm, adjustmentType: stockForm.adjustmentType as 'in' | 'out' | 'adjustment' }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory-items'] }); qc.invalidateQueries({ queryKey: ['low-stock'] }); setStockItemId(null); } });

  // Asset mutations
  const createAsset = useMutation({ mutationFn: () => api.createAsset(assetForm), onSuccess: () => { qc.invalidateQueries({ queryKey: ['assets'] }); setShowAssetForm(false); } });
  const updateAsset = useMutation({ mutationFn: ({ id, d }: { id: string; d: Partial<Asset> }) => api.updateAsset(id, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['assets'] }); setEditAssetId(null); } });
  const deleteAsset = useMutation({ mutationFn: (id: string) => api.deleteAsset(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['assets'] }); setDeleteAssetId(null); } });

  // Warehouse mutations
  const createWarehouse = useMutation({ mutationFn: () => api.createWarehouse(whForm), onSuccess: () => { qc.invalidateQueries({ queryKey: ['warehouses'] }); setShowWhForm(false); } });
  const updateWarehouse = useMutation({ mutationFn: ({ id, d }: { id: string; d: typeof whForm }) => api.updateWarehouse(id, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['warehouses'] }); setEditWhId(null); } });

  const items: InventoryItem[] = itemsData?.data ?? [];
  const assets: Asset[] = assetsData?.data ?? [];
  const warehouses = warehousesData?.data ?? [];
  const lowStockItems = lowStockData?.data ?? [];
  const totalAssetValue = assets.reduce((s, a) => s + (a.purchaseValue ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">Items, assets, and warehouse management</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-primary"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Items</CardTitle><Package className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{itemsData?.total ?? 0}</div></CardContent></Card>
        <Card className="border-l-4 border-l-warning"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle><AlertTriangle className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{lowStockItems.length}</div></CardContent></Card>
        <Card className="border-l-4 border-l-info"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Assets</CardTitle><Monitor className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{assetsData?.total ?? 0}</div></CardContent></Card>
        <Card className="border-l-4 border-l-success"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Asset Value</CardTitle><Monitor className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(totalAssetValue)}</div></CardContent></Card>
      </div>

      {lowStockItems.length > 0 && (
        <div className="rounded-md border border-warning/50 bg-warning/5 px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
          <p className="text-sm font-medium">{lowStockItems.length} item(s) are below minimum stock levels and require replenishment.</p>
        </div>
      )}

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items"><Package className="mr-1 h-4 w-4" />Items</TabsTrigger>
          <TabsTrigger value="assets"><Monitor className="mr-1 h-4 w-4" />Assets</TabsTrigger>
          <TabsTrigger value="warehouses"><Warehouse className="mr-1 h-4 w-4" />Warehouses</TabsTrigger>
        </TabsList>

        {/* ITEMS TAB */}
        <TabsContent value="items" className="space-y-4 mt-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search items..." className="pl-8" value={itemSearch} onChange={e => setItemSearch(e.target.value)} />
            </div>
            <Select value={itemWarehouse} onValueChange={setItemWarehouse}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All warehouses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All warehouses</SelectItem>
                {(warehouses as { id: string; name: string }[]).map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={() => { setShowItemForm(true); setEditItemId(null); }}><Plus className="mr-1 h-4 w-4" />New Item</Button>
          </div>

          {(showItemForm || editItemId) && (
            <Card>
              <CardHeader><CardTitle className="text-base">{editItemId ? 'Edit Item' : 'New Item'}</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={e => { e.preventDefault(); editItemId ? updateItem.mutate({ id: editItemId, d: itemForm }) : createItem.mutate(); }} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1"><label className="text-sm font-medium">Name *</label><Input required value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} placeholder="Item name" /></div>
                  <div className="space-y-1"><label className="text-sm font-medium">SKU</label><Input value={itemForm.sku} onChange={e => setItemForm(f => ({ ...f, sku: e.target.value }))} placeholder="SKU-001" /></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Unit</label><Select value={itemForm.unit} onValueChange={v => setItemForm(f => ({ ...f, unit: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['each','kg','liter','meter','box','pack'].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Warehouse</label><Select value={itemForm.warehouseId} onValueChange={v => setItemForm(f => ({ ...f, warehouseId: v }))}><SelectTrigger><SelectValue placeholder="Select warehouse" /></SelectTrigger><SelectContent>{(warehouses as { id: string; name: string }[]).map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Qty On Hand</label><Input type="number" min={0} value={itemForm.quantityOnHand || ''} onChange={e => setItemForm(f => ({ ...f, quantityOnHand: parseInt(e.target.value) }))} /></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Min Qty</label><Input type="number" min={0} value={itemForm.minimumQuantity || ''} onChange={e => setItemForm(f => ({ ...f, minimumQuantity: parseInt(e.target.value) }))} /></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Unit Cost</label><Input type="number" min={0} step={0.01} value={itemForm.unitCost || ''} onChange={e => setItemForm(f => ({ ...f, unitCost: parseFloat(e.target.value) }))} /></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Currency</label><Select value={itemForm.currency} onValueChange={v => setItemForm(f => ({ ...f, currency: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                  <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
                    <Button type="submit" disabled={createItem.isPending || updateItem.isPending}><Check className="mr-1 h-4 w-4" />{editItemId ? 'Save' : 'Create'}</Button>
                    <Button type="button" variant="outline" onClick={() => { setShowItemForm(false); setEditItemId(null); }}><X className="mr-1 h-4 w-4" />Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {stockItemId && (
            <Card>
              <CardHeader><CardTitle className="text-base">Adjust Stock</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={e => { e.preventDefault(); stockMovement.mutate(); }} className="flex flex-wrap gap-3 items-end">
                  <div className="space-y-1"><label className="text-sm font-medium">Type</label><Select value={stockForm.adjustmentType} onValueChange={v => setStockForm(f => ({ ...f, adjustmentType: v }))}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent>{['in','out','adjustment'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Quantity</label><Input type="number" min={1} value={stockForm.quantity} onChange={e => setStockForm(f => ({ ...f, quantity: parseInt(e.target.value) }))} className="w-24" /></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Reason</label><Input value={stockForm.reason} onChange={e => setStockForm(f => ({ ...f, reason: e.target.value }))} placeholder="Reason" className="w-48" /></div>
                  <Button type="submit" disabled={stockMovement.isPending}><Check className="mr-1 h-4 w-4" />Record</Button>
                  <Button type="button" variant="outline" onClick={() => setStockItemId(null)}><X className="mr-1 h-4 w-4" />Cancel</Button>
                </form>
              </CardContent>
            </Card>
          )}

          {deleteItemId && <Card className="border-danger/50 bg-danger/5"><CardContent className="flex items-center justify-between py-3"><p className="text-sm">Delete this item?</p><div className="flex gap-2"><Button size="sm" variant="destructive" disabled={deleteItem.isPending} onClick={() => deleteItem.mutate(deleteItemId)}>Delete</Button><Button size="sm" variant="outline" onClick={() => setDeleteItemId(null)}>Cancel</Button></div></CardContent></Card>}

          <Card><CardContent className="p-0">
            {loadingItems ? <div className="space-y-px">{[1,2,3].map(i => <div key={i} className="h-12 animate-pulse bg-muted/40" />)}</div> : (
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>SKU</TableHead><TableHead>Qty</TableHead><TableHead>Min Qty</TableHead><TableHead>Unit Cost</TableHead><TableHead className="w-28">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {items.length === 0 && <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No items found</TableCell></TableRow>}
                  {items.map(item => {
                    const lowStock = (item.quantityOnHand ?? 0) <= (item.minimumQuantity ?? 0);
                    return (
                      <TableRow key={item.id} className={cn(lowStock && 'bg-warning/5')}>
                        <TableCell className="font-medium">
                          {item.name}
                          {lowStock && <Badge className="ml-2 bg-warning/20 text-warning border-warning text-xs">Low stock</Badge>}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{item.sku ?? '—'}</TableCell>
                        <TableCell className={cn('font-medium', lowStock && 'text-warning')}>{item.quantityOnHand ?? 0} {item.unit}</TableCell>
                        <TableCell className="text-muted-foreground">{item.minimumQuantity ?? 0}</TableCell>
                        <TableCell>{item.unitCost != null ? formatCurrency(item.unitCost) : '—'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" title="Adjust stock" onClick={() => setStockItemId(item.id)}><ArrowUpDown className="h-3.5 w-3.5" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => { setEditItemId(item.id); setItemForm({ name: item.name ?? '', sku: item.sku ?? '', description: item.description ?? '', unit: item.unit ?? 'each', warehouseId: item.warehouseId ?? '', quantityOnHand: item.quantityOnHand ?? 0, minimumQuantity: item.minimumQuantity ?? 0, maximumQuantity: item.maximumQuantity ?? 0, unitCost: item.unitCost ?? 0, currency: item.currency ?? 'USD' }); setShowItemForm(false); }}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => setDeleteItemId(item.id)}><Trash2 className="h-3.5 w-3.5 text-danger" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent></Card>
        </TabsContent>

        {/* ASSETS TAB */}
        <TabsContent value="assets" className="space-y-4 mt-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search assets..." className="pl-8" value={assetSearch} onChange={e => setAssetSearch(e.target.value)} />
            </div>
            <Select value={assetStatus} onValueChange={setAssetStatus}><SelectTrigger className="w-36"><SelectValue placeholder="All statuses" /></SelectTrigger><SelectContent><SelectItem value="">All statuses</SelectItem>{ASSET_STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace('_',' ')}</SelectItem>)}</SelectContent></Select>
            <Button size="sm" onClick={() => { setShowAssetForm(true); setEditAssetId(null); }}><Plus className="mr-1 h-4 w-4" />New Asset</Button>
          </div>

          {(showAssetForm || editAssetId) && (
            <Card>
              <CardHeader><CardTitle className="text-base">{editAssetId ? 'Edit Asset' : 'New Asset'}</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={e => { e.preventDefault(); editAssetId ? updateAsset.mutate({ id: editAssetId, d: assetForm }) : createAsset.mutate(); }} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1"><label className="text-sm font-medium">Name *</label><Input required value={assetForm.name} onChange={e => setAssetForm(f => ({ ...f, name: e.target.value }))} placeholder="Dell Latitude 5540" /></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Asset Tag</label><Input value={assetForm.assetTag} onChange={e => setAssetForm(f => ({ ...f, assetTag: e.target.value }))} placeholder="AST-001" /></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Type</label><Select value={assetForm.type} onValueChange={v => setAssetForm(f => ({ ...f, type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ASSET_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Serial Number</label><Input value={assetForm.serialNumber} onChange={e => setAssetForm(f => ({ ...f, serialNumber: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Purchase Date</label><Input type="date" value={assetForm.purchaseDate} onChange={e => setAssetForm(f => ({ ...f, purchaseDate: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Purchase Value</label><Input type="number" min={0} value={assetForm.purchaseValue || ''} onChange={e => setAssetForm(f => ({ ...f, purchaseValue: parseFloat(e.target.value) }))} /></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Assigned To</label><Input value={assetForm.assignedTo} onChange={e => setAssetForm(f => ({ ...f, assignedTo: e.target.value }))} placeholder="Employee name" /></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Location</label><Input value={assetForm.location} onChange={e => setAssetForm(f => ({ ...f, location: e.target.value }))} placeholder="Office floor 3" /></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Warranty Expiry</label><Input type="date" value={assetForm.warrantyExpiry} onChange={e => setAssetForm(f => ({ ...f, warrantyExpiry: e.target.value }))} /></div>
                  <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
                    <Button type="submit" disabled={createAsset.isPending || updateAsset.isPending}><Check className="mr-1 h-4 w-4" />{editAssetId ? 'Save' : 'Create'}</Button>
                    <Button type="button" variant="outline" onClick={() => { setShowAssetForm(false); setEditAssetId(null); }}><X className="mr-1 h-4 w-4" />Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {deleteAssetId && <Card className="border-danger/50 bg-danger/5"><CardContent className="flex items-center justify-between py-3"><p className="text-sm">Delete this asset?</p><div className="flex gap-2"><Button size="sm" variant="destructive" disabled={deleteAsset.isPending} onClick={() => deleteAsset.mutate(deleteAssetId)}>Delete</Button><Button size="sm" variant="outline" onClick={() => setDeleteAssetId(null)}>Cancel</Button></div></CardContent></Card>}

          <Card><CardContent className="p-0">
            {loadingAssets ? <div className="space-y-px">{[1,2,3].map(i => <div key={i} className="h-12 animate-pulse bg-muted/40" />)}</div> : (
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Tag</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Assigned To</TableHead><TableHead>Value</TableHead><TableHead className="w-24">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {assets.length === 0 && <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No assets found</TableCell></TableRow>}
                  {assets.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell className="font-mono text-sm">{a.assetTag ?? '—'}</TableCell>
                      <TableCell className="capitalize">{a.type}</TableCell>
                      <TableCell><Badge className={cn('capitalize', assetStatusColor(a.status))}>{a.status?.replace('_',' ')}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{a.assignedTo ?? '—'}</TableCell>
                      <TableCell>{a.purchaseValue != null ? formatCurrency(a.purchaseValue) : '—'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => { setEditAssetId(a.id); setAssetForm({ name: a.name ?? '', assetTag: a.assetTag ?? '', type: a.type ?? 'laptop', serialNumber: a.serialNumber ?? '', purchaseDate: a.purchaseDate?.slice(0, 10) ?? '', purchaseValue: a.purchaseValue ?? 0, currency: a.currency ?? 'USD', warehouseId: a.warehouseId ?? '', assignedTo: a.assignedTo ?? '', location: a.location ?? '', warrantyExpiry: a.warrantyExpiry?.slice(0, 10) ?? '' }); setShowAssetForm(false); }}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => setDeleteAssetId(a.id)}><Trash2 className="h-3.5 w-3.5 text-danger" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent></Card>
        </TabsContent>

        {/* WAREHOUSES TAB */}
        <TabsContent value="warehouses" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Warehouse Locations</h2>
            <Button size="sm" onClick={() => { setShowWhForm(true); setEditWhId(null); }}><Plus className="mr-1 h-4 w-4" />New Warehouse</Button>
          </div>

          {(showWhForm || editWhId) && (
            <Card>
              <CardHeader><CardTitle className="text-base">{editWhId ? 'Edit Warehouse' : 'New Warehouse'}</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={e => { e.preventDefault(); editWhId ? updateWarehouse.mutate({ id: editWhId, d: whForm }) : createWarehouse.mutate(); }} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1"><label className="text-sm font-medium">Name *</label><Input required value={whForm.name} onChange={e => setWhForm(f => ({ ...f, name: e.target.value }))} placeholder="Main Warehouse" /></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Location</label><Input value={whForm.location} onChange={e => setWhForm(f => ({ ...f, location: e.target.value }))} placeholder="City, Country" /></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Capacity</label><Input type="number" min={0} value={whForm.capacity || ''} onChange={e => setWhForm(f => ({ ...f, capacity: parseInt(e.target.value) }))} /></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Manager</label><Input value={whForm.manager} onChange={e => setWhForm(f => ({ ...f, manager: e.target.value }))} placeholder="Manager name" /></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Address</label><Input value={whForm.address} onChange={e => setWhForm(f => ({ ...f, address: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="text-sm font-medium">Notes</label><Input value={whForm.notes} onChange={e => setWhForm(f => ({ ...f, notes: e.target.value }))} /></div>
                  <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
                    <Button type="submit" disabled={createWarehouse.isPending || updateWarehouse.isPending}><Check className="mr-1 h-4 w-4" />{editWhId ? 'Save' : 'Create'}</Button>
                    <Button type="button" variant="outline" onClick={() => { setShowWhForm(false); setEditWhId(null); }}><X className="mr-1 h-4 w-4" />Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {loadingWarehouses ? <div className="space-y-px">{[1,2].map(i => <div key={i} className="h-20 animate-pulse bg-muted/40 rounded-lg" />)}</div> : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(warehouses as { id: string; name: string; location?: string; capacity?: number; currentItems?: number; manager?: string }[]).map(wh => {
                const util = wh.capacity && wh.currentItems != null ? (wh.currentItems / wh.capacity) * 100 : 0;
                return (
                  <Card key={wh.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{wh.name}</p>
                          <p className="text-xs text-muted-foreground">{wh.location ?? '—'}</p>
                          <p className="text-xs text-muted-foreground mt-1">Manager: {wh.manager ?? '—'}</p>
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => { setEditWhId(wh.id); setWhForm({ name: wh.name ?? '', location: wh.location ?? '', address: '', capacity: wh.capacity ?? 0, manager: wh.manager ?? '', notes: '' }); setShowWhForm(false); }}><Pencil className="h-3.5 w-3.5" /></Button>
                      </div>
                      {wh.capacity != null && wh.capacity > 0 && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Utilization</span>
                            <span>{util.toFixed(1)}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div className={cn('h-full rounded-full', util >= 90 ? 'bg-danger' : util >= 70 ? 'bg-warning' : 'bg-success')} style={{ width: `${Math.min(util, 100)}%` }} />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
              {warehouses.length === 0 && <p className="text-sm text-muted-foreground col-span-3 py-4">No warehouses configured.</p>}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
