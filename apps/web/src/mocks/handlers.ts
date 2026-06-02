import { rest } from 'msw';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export const handlers = [
  // ============================================================================
  // FINANCE ENDPOINTS
  // ============================================================================
  rest.get(`${API_BASE}/finance/forecast/budgets/:id`, (_req, res, ctx) => {
    return res(ctx.json({
      data: {
        id: 'budget-1',
        name: 'Q2 2026 Software Development',
        budgetedAmount: 250000,
        projectedSpend: 185000,
        onTrack: true
      }
    }));
  }),

  rest.get(`${API_BASE}/finance/forecast/alerts`, (_req, res, ctx) => {
    return res(ctx.json({
      data: [
        { id: 'alert-1', name: 'Engineering', utilization: 85 }
      ]
    }));
  }),

  rest.get(`${API_BASE}/finance/gl/accounts`, (_req, res, ctx) => {
    return res(ctx.json({
      data: [
        { code: '1000', name: 'Cash', type: 'ASSET', balance: 50000 },
        { code: '1010', name: 'Accounts Receivable', type: 'ASSET', balance: 25000 },
        { code: '2000', name: 'Accounts Payable', type: 'LIABILITY', balance: 15000 }
      ]
    }));
  }),

  rest.get(`${API_BASE}/finance/gl/trial-balance`, (_req, res, ctx) => {
    return res(ctx.json({
      data: {
        debits: 500000,
        credits: 500000,
        balanced: true
      }
    }));
  }),

  rest.get(`${API_BASE}/finance/gl/income-statement`, (_req, res, ctx) => {
    return res(ctx.json({
      data: {
        revenue: 1000000,
        expenses: 600000,
        netIncome: 400000
      }
    }));
  }),

  rest.post(`${API_BASE}/finance/gl/post`, (_req, res, ctx) => {
    return res(ctx.status(201), ctx.json({ data: { id: 'entry-1' } }));
  }),

  rest.get(`${API_BASE}/finance/gl/accounts/:code/balance`, (_req, res, ctx) => {
    return res(ctx.json({ data: 50000 }));
  }),

  // ============================================================================
  // PROCUREMENT ENDPOINTS
  // ============================================================================
  rest.get(`${API_BASE}/procurement/rfq`, (_req, res, ctx) => {
    return res(ctx.json({
      data: [
        { id: 'rfq-1', title: 'Server Hardware', status: 'SENT', vendorCount: 3, responseCount: 1 },
        { id: 'rfq-2', title: 'Network Equipment', status: 'DRAFT', vendorCount: 0, responseCount: 0 }
      ]
    }));
  }),

  rest.post(`${API_BASE}/procurement/rfq`, (_req, res, ctx) => {
    return res(ctx.status(201), ctx.json({ data: { id: 'rfq-new', status: 'DRAFT' } }));
  }),

  rest.post(`${API_BASE}/procurement/rfq/:id/send`, (_req, res, ctx) => {
    return res(ctx.json({ data: { status: 'SENT' } }));
  }),

  rest.post(`${API_BASE}/procurement/rfq/:id/bids`, (_req, res, ctx) => {
    return res(ctx.json({ data: { recorded: true } }));
  }),

  rest.get(`${API_BASE}/procurement/rfq/:id/score`, (_req, res, ctx) => {
    return res(ctx.json({
      data: { winningBid: { vendorId: 'vendor-1', score: 95 } }
    }));
  }),

  rest.post(`${API_BASE}/procurement/rfq/:id/award`, (_req, res, ctx) => {
    return res(ctx.json({ data: { status: 'AWARDED' } }));
  }),

  rest.post(`${API_BASE}/procurement/matching/receipts`, (_req, res, ctx) => {
    return res(ctx.json({ data: { id: 'receipt-1' } }));
  }),

  rest.post(`${API_BASE}/procurement/matching/match`, (_req, res, ctx) => {
    return res(ctx.json({ data: { matched: true } }));
  }),

  rest.get(`${API_BASE}/procurement/matching/variances/:invoiceId`, (_req, res, ctx) => {
    return res(ctx.json({
      data: { hasVariance: false, variance: 0 }
    }));
  }),

  rest.post(`${API_BASE}/procurement/matching/flag`, (_req, res, ctx) => {
    return res(ctx.json({ data: { flagged: true } }));
  }),

  rest.patch(`${API_BASE}/procurement/matching/resolve/:invoiceId`, (_req, res, ctx) => {
    return res(ctx.json({ data: { resolved: true } }));
  }),

  rest.get(`${API_BASE}/procurement/spend/by-vendor`, (_req, res, ctx) => {
    return res(ctx.json({
      data: { 'vendor-1': 450000, 'vendor-2': 320000 }
    }));
  }),

  rest.get(`${API_BASE}/procurement/spend/by-category`, (_req, res, ctx) => {
    return res(ctx.json({
      data: { 'Technology': 520000, 'Office Supplies': 230000 }
    }));
  }),

  rest.get(`${API_BASE}/procurement/spend/consolidation`, (_req, res, ctx) => {
    return res(ctx.json({
      data: { savings: 150000 }
    }));
  }),

  rest.get(`${API_BASE}/procurement/spend/concentration`, (_req, res, ctx) => {
    return res(ctx.json({
      data: { risk: 'MODERATE' }
    }));
  }),

  // ============================================================================
  // INVENTORY ENDPOINTS
  // ============================================================================
  rest.get(`${API_BASE}/inventory/transfers`, (_req, res, ctx) => {
    return res(ctx.json({
      data: [
        { id: 'xfr-1', sku: 'SKU-001', fromWarehouse: 'WH-A', toWarehouse: 'WH-B', quantity: 50, status: 'PENDING' },
        { id: 'xfr-2', sku: 'SKU-002', fromWarehouse: 'WH-B', toWarehouse: 'WH-C', quantity: 30, status: 'IN_TRANSIT' }
      ]
    }));
  }),

  rest.post(`${API_BASE}/inventory/transfers`, (_req, res, ctx) => {
    return res(ctx.status(201), ctx.json({ data: { id: 'transfer-1', status: 'PENDING' } }));
  }),

  rest.patch(`${API_BASE}/inventory/transfers/:id/transit`, (_req, res, ctx) => {
    return res(ctx.json({ data: { status: 'IN_TRANSIT' } }));
  }),

  rest.patch(`${API_BASE}/inventory/transfers/:id/receive`, (_req, res, ctx) => {
    return res(ctx.json({ data: { status: 'RECEIVED' } }));
  }),

  rest.get(`${API_BASE}/inventory/transfers/:sku/bin-suggestion`, (_req, res, ctx) => {
    return res(ctx.json({ data: 'BIN-A1-001' }));
  }),

  rest.post(`${API_BASE}/inventory/cycle-counts/schedule`, (_req, res, ctx) => {
    return res(ctx.json({ data: { scheduled: true } }));
  }),

  rest.post(`${API_BASE}/inventory/cycle-counts/:id/record`, (_req, res, ctx) => {
    return res(ctx.json({ data: { recorded: true } }));
  }),

  rest.get(`${API_BASE}/inventory/cycle-counts/:id/variances`, (_req, res, ctx) => {
    return res(ctx.json({
      data: { status: 'OK', variance: 0 }
    }));
  }),

  rest.post(`${API_BASE}/inventory/cycle-counts/:id/investigate`, (_req, res, ctx) => {
    return res(ctx.json({ data: { investigated: true } }));
  }),

  rest.get(`${API_BASE}/inventory/lots`, (_req, res, ctx) => {
    return res(ctx.json({
      data: [
        { id: 'lot-1', sku: 'SKU-001', lotNumber: 'LOT-2026-001', quantity: 100, expiryDate: '2027-01-15' },
        { id: 'lot-2', sku: 'SKU-002', lotNumber: 'LOT-2026-002', quantity: 50, expiryDate: '2026-08-20' }
      ]
    }));
  }),

  rest.post(`${API_BASE}/inventory/lots/receive`, (_req, res, ctx) => {
    return res(ctx.json({ data: { id: 'lot-1' } }));
  }),

  rest.get(`${API_BASE}/inventory/lots/expiring`, (_req, res, ctx) => {
    return res(ctx.json({
      data: [{ id: 'lot-1', sku: 'SKU-002', daysRemaining: 22 }]
    }));
  }),

  rest.get(`${API_BASE}/inventory/demand/forecast`, (_req, res, ctx) => {
    return res(ctx.json({
      data: { sku: 'SKU-001', forecast: [100, 120, 130] }
    }));
  }),

  rest.get(`${API_BASE}/inventory/demand/reorder-point`, (_req, res, ctx) => {
    return res(ctx.json({
      data: [{ sku: 'SKU-001', reorderPoint: 100, reorderQty: 500 }, { sku: 'SKU-002', reorderPoint: 50, reorderQty: 200 }]
    }));
  }),

  rest.get(`${API_BASE}/inventory/assets/:id/depreciation`, (_req, res, ctx) => {
    return res(ctx.json({
      data: { annualDepreciation: 1000 }
    }));
  }),

  rest.get(`${API_BASE}/inventory/assets/:id/book-value`, (_req, res, ctx) => {
    return res(ctx.json({
      data: { value: 4000 }
    }));
  }),

  rest.post(`${API_BASE}/inventory/assets/:id/dispose`, (_req, res, ctx) => {
    return res(ctx.json({ data: { disposed: true } }));
  }),

  // ============================================================================
  // COMPLIANCE ENDPOINTS
  // ============================================================================
  rest.get(`${API_BASE}/compliance/sod/rules`, (_req, res, ctx) => {
    return res(ctx.json({
      data: {
        'create_expense': 'approve_expense',
        'create_po': 'approve_po'
      }
    }));
  }),

  rest.post(`${API_BASE}/compliance/sod/validate`, (_req, res, ctx) => {
    return res(ctx.json({ data: true }));
  }),

  rest.get(`${API_BASE}/compliance/sod/check`, (_req, res, ctx) => {
    return res(ctx.json({
      data: { hasConflict: false }
    }));
  }),

  rest.post(`${API_BASE}/compliance/approval-authorities`, (_req, res, ctx) => {
    return res(ctx.json({ data: { set: true } }));
  }),

  rest.post(`${API_BASE}/compliance/approval-authorities/can-approve`, (_req, res, ctx) => {
    return res(ctx.json({ data: true }));
  }),

  rest.get(`${API_BASE}/compliance/approval-authorities/suggest`, (_req, res, ctx) => {
    return res(ctx.json({
      data: { userId: 'user-1' }
    }));
  }),

  // ============================================================================
  // ANALYTICS ENDPOINTS
  // ============================================================================
  rest.get(`${API_BASE}/analytics/cash-flow`, (_req, res, ctx) => {
    return res(ctx.json({
      data: {
        months: ['Jun', 'Jul', 'Aug'],
        values: [250000, 280000, 320000]
      }
    }));
  }),

  rest.get(`${API_BASE}/analytics/anomalies`, (_req, res, ctx) => {
    return res(ctx.json({
      data: [{ id: 'anom-1', vendor: 'Vendor A', amount: 50000 }]
    }));
  }),

  rest.get(`${API_BASE}/analytics/vendor-risk/:vendorId`, (_req, res, ctx) => {
    return res(ctx.json({
      data: { risk: 'LOW' }
    }));
  }),

  // ============================================================================
  // AUTH & USER ENDPOINTS
  // ============================================================================
  rest.get(`${API_BASE}/users/current`, (_req, res, ctx) => {
    return res(ctx.json({
      data: {
        id: 'user-1',
        name: 'Admin User',
        email: 'admin@orionops.local',
        role: 'ADMIN'
      }
    }));
  }),

  rest.post(`${API_BASE}/auth/login`, (_req, res, ctx) => {
    return res(ctx.json({
      data: { token: 'mock-jwt-token', user: { id: 'user-1', role: 'ADMIN' } }
    }));
  }),

  rest.post(`${API_BASE}/auth/logout`, (_req, res, ctx) => {
    return res(ctx.json({ data: { success: true } }));
  }),

  // ============================================================================
  // VENDOR ENDPOINTS
  // ============================================================================
  rest.get(`${API_BASE}/vendors/:id/duplicates`, (_req, res, ctx) => {
    return res(ctx.json({
      data: [{ id: 'vendor-2', name: 'Similar Vendor', similarity: 85 }]
    }));
  }),

  rest.post(`${API_BASE}/vendors/consolidate`, (_req, res, ctx) => {
    return res(ctx.json({ data: { consolidated: true } }));
  }),

  rest.get(`${API_BASE}/vendors/:id/quality-score`, (_req, res, ctx) => {
    return res(ctx.json({
      data: { score: 85 }
    }));
  }),

  rest.post(`${API_BASE}/vendors/:id/audit`, (_req, res, ctx) => {
    return res(ctx.json({ data: { audited: true } }));
  }),

  rest.get(`${API_BASE}/vendors/:id/sla-status`, (_req, res, ctx) => {
    return res(ctx.json({
      data: { score: 4.5, trend: 'up' }
    }));
  }),

  // ============================================================================
  // UOM ENDPOINTS
  // ============================================================================
  rest.get(`${API_BASE}/inventory/uom`, (_req, res, ctx) => {
    return res(ctx.json({
      data: {
        'Weight': ['KG', 'LB'],
        'Length': ['METER', 'FOOT']
      }
    }));
  }),

  rest.post(`${API_BASE}/inventory/uom/convert`, (_req, res, ctx) => {
    return res(ctx.json({
      data: 22 // 10 KG to LB
    }));
  }),

  rest.get(`${API_BASE}/inventory/uom/compatible`, (_req, res, ctx) => {
    return res(ctx.json({
      data: true
    }));
  }),

  // ============================================================================
  // SEARCH ENDPOINT
  // ============================================================================
  rest.get(`${API_BASE}/search`, (req, res, ctx) => {
    req.url.searchParams.get('q'); // consumed by search logic
    return res(ctx.json({
      data: {
        incidents: [{ id: 'inc-1', title: 'INC-001: Database issue' }],
        problems: [],
        changes: [],
        requests: [],
        knowledgeArticles: [{ id: 'ka-1', title: 'How to restart DB', entityType: 'knowledge' }],
        totalResults: 2
      }
    }));
  }),

  // ============================================================================
  // NOTIFICATIONS ENDPOINT
  // ============================================================================
  rest.get(`${API_BASE}/notifications`, (_req, res, ctx) => {
    return res(ctx.json({
      data: [
        { id: 'notif-1', title: 'New Incident', message: 'INC-001 opened', read: false },
        { id: 'notif-2', title: 'Budget Alert', message: 'Engineering 85% utilized', read: false }
      ]
    }));
  }),

  rest.post(`${API_BASE}/notifications/mark-read`, (_req, res, ctx) => {
    return res(ctx.json({ data: { success: true } }));
  }),
];
