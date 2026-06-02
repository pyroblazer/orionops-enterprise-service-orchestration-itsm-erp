import { http, HttpResponse } from 'msw';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export const handlers = [
  // ============================================================================
  // FINANCE ENDPOINTS
  // ============================================================================
  http.get(`${API_BASE}/finance/forecast/budgets/:id`, () => {
    return HttpResponse.json({
      data: {
        id: 'budget-1',
        name: 'Q2 2026 Software Development',
        budgetedAmount: 250000,
        projectedSpend: 185000,
        onTrack: true
      }
    });
  }),

  http.get(`${API_BASE}/finance/forecast/alerts`, () => {
    return HttpResponse.json({
      data: [
        { id: 'alert-1', name: 'Engineering', utilization: 85 }
      ]
    });
  }),

  http.get(`${API_BASE}/finance/gl/accounts`, () => {
    return HttpResponse.json({
      data: [
        { code: '1000', name: 'Cash', type: 'ASSET', balance: 50000 },
        { code: '1010', name: 'Accounts Receivable', type: 'ASSET', balance: 25000 },
        { code: '2000', name: 'Accounts Payable', type: 'LIABILITY', balance: 15000 }
      ]
    });
  }),

  http.get(`${API_BASE}/finance/gl/trial-balance`, () => {
    return HttpResponse.json({
      data: {
        debits: 500000,
        credits: 500000,
        balanced: true
      }
    });
  }),

  http.get(`${API_BASE}/finance/gl/income-statement`, () => {
    return HttpResponse.json({
      data: {
        revenue: 1000000,
        expenses: 600000,
        netIncome: 400000
      }
    });
  }),

  http.post(`${API_BASE}/finance/gl/post`, () => {
    return HttpResponse.json({ data: { id: 'entry-1' } }, { status: 201 });
  }),

  http.get(`${API_BASE}/finance/gl/accounts/:code/balance`, () => {
    return HttpResponse.json({ data: 50000 });
  }),

  // ============================================================================
  // PROCUREMENT ENDPOINTS
  // ============================================================================
  http.get(`${API_BASE}/procurement/rfq`, () => {
    return HttpResponse.json({
      data: [
        { id: 'rfq-1', title: 'Server Hardware', status: 'SENT', vendorCount: 3, responseCount: 1 },
        { id: 'rfq-2', title: 'Network Equipment', status: 'DRAFT', vendorCount: 0, responseCount: 0 }
      ]
    });
  }),

  http.post(`${API_BASE}/procurement/rfq`, () => {
    return HttpResponse.json(
      { data: { id: 'rfq-new', status: 'DRAFT' } },
      { status: 201 }
    );
  }),

  http.post(`${API_BASE}/procurement/rfq/:id/send`, () => {
    return HttpResponse.json({ data: { status: 'SENT' } });
  }),

  http.post(`${API_BASE}/procurement/rfq/:id/bids`, () => {
    return HttpResponse.json({ data: { recorded: true } });
  }),

  http.get(`${API_BASE}/procurement/rfq/:id/score`, () => {
    return HttpResponse.json({
      data: { winningBid: { vendorId: 'vendor-1', score: 95 } }
    });
  }),

  http.post(`${API_BASE}/procurement/rfq/:id/award`, () => {
    return HttpResponse.json({ data: { status: 'AWARDED' } });
  }),

  http.post(`${API_BASE}/procurement/matching/receipts`, () => {
    return HttpResponse.json({ data: { id: 'receipt-1' } });
  }),

  http.post(`${API_BASE}/procurement/matching/match`, () => {
    return HttpResponse.json({ data: { matched: true } });
  }),

  http.get(`${API_BASE}/procurement/matching/variances/:invoiceId`, () => {
    return HttpResponse.json({
      data: { hasVariance: false, variance: 0 }
    });
  }),

  http.post(`${API_BASE}/procurement/matching/flag`, () => {
    return HttpResponse.json({ data: { flagged: true } });
  }),

  http.patch(`${API_BASE}/procurement/matching/resolve/:invoiceId`, () => {
    return HttpResponse.json({ data: { resolved: true } });
  }),

  http.get(`${API_BASE}/procurement/spend/by-vendor`, () => {
    return HttpResponse.json({
      data: { 'vendor-1': 450000, 'vendor-2': 320000 }
    });
  }),

  http.get(`${API_BASE}/procurement/spend/by-category`, () => {
    return HttpResponse.json({
      data: { 'Technology': 520000, 'Office Supplies': 230000 }
    });
  }),

  http.get(`${API_BASE}/procurement/spend/consolidation`, () => {
    return HttpResponse.json({
      data: { savings: 150000 }
    });
  }),

  http.get(`${API_BASE}/procurement/spend/concentration`, () => {
    return HttpResponse.json({
      data: { risk: 'MODERATE' }
    });
  }),

  // ============================================================================
  // INVENTORY ENDPOINTS
  // ============================================================================
  http.post(`${API_BASE}/inventory/transfers`, () => {
    return HttpResponse.json(
      { data: { id: 'transfer-1', status: 'PENDING' } },
      { status: 201 }
    );
  }),

  http.patch(`${API_BASE}/inventory/transfers/:id/transit`, () => {
    return HttpResponse.json({ data: { status: 'IN_TRANSIT' } });
  }),

  http.patch(`${API_BASE}/inventory/transfers/:id/receive`, () => {
    return HttpResponse.json({ data: { status: 'RECEIVED' } });
  }),

  http.get(`${API_BASE}/inventory/transfers/:sku/bin-suggestion`, () => {
    return HttpResponse.json({ data: 'BIN-A1-001' });
  }),

  http.post(`${API_BASE}/inventory/cycle-counts/schedule`, () => {
    return HttpResponse.json({ data: { scheduled: true } });
  }),

  http.post(`${API_BASE}/inventory/cycle-counts/:id/record`, () => {
    return HttpResponse.json({ data: { recorded: true } });
  }),

  http.get(`${API_BASE}/inventory/cycle-counts/:id/variances`, () => {
    return HttpResponse.json({
      data: { status: 'OK', variance: 0 }
    });
  }),

  http.post(`${API_BASE}/inventory/cycle-counts/:id/investigate`, () => {
    return HttpResponse.json({ data: { investigated: true } });
  }),

  http.post(`${API_BASE}/inventory/lots/receive`, () => {
    return HttpResponse.json({ data: { id: 'lot-1' } });
  }),

  http.get(`${API_BASE}/inventory/lots/expiring`, () => {
    return HttpResponse.json({
      data: [{ id: 'lot-1', sku: 'SKU-002', daysRemaining: 22 }]
    });
  }),

  http.get(`${API_BASE}/inventory/demand/forecast`, () => {
    return HttpResponse.json({
      data: { sku: 'SKU-001', forecast: [100, 120, 130] }
    });
  }),

  http.get(`${API_BASE}/inventory/demand/reorder-point`, () => {
    return HttpResponse.json({
      data: { point: 100, quantity: 500 }
    });
  }),

  http.get(`${API_BASE}/inventory/assets/:id/depreciation`, () => {
    return HttpResponse.json({
      data: { annualDepreciation: 1000 }
    });
  }),

  http.get(`${API_BASE}/inventory/assets/:id/book-value`, () => {
    return HttpResponse.json({
      data: { value: 4000 }
    });
  }),

  http.post(`${API_BASE}/inventory/assets/:id/dispose`, () => {
    return HttpResponse.json({ data: { disposed: true } });
  }),

  // ============================================================================
  // COMPLIANCE ENDPOINTS
  // ============================================================================
  http.get(`${API_BASE}/compliance/sod/rules`, () => {
    return HttpResponse.json({
      data: {
        'create_expense': 'approve_expense',
        'create_po': 'approve_po'
      }
    });
  }),

  http.post(`${API_BASE}/compliance/sod/validate`, () => {
    return HttpResponse.json({ data: true });
  }),

  http.get(`${API_BASE}/compliance/sod/check`, () => {
    return HttpResponse.json({
      data: { hasConflict: false }
    });
  }),

  http.post(`${API_BASE}/compliance/approval-authorities`, () => {
    return HttpResponse.json({ data: { set: true } });
  }),

  http.post(`${API_BASE}/compliance/approval-authorities/can-approve`, () => {
    return HttpResponse.json({ data: true });
  }),

  http.get(`${API_BASE}/compliance/approval-authorities/suggest`, () => {
    return HttpResponse.json({
      data: { userId: 'user-1' }
    });
  }),

  // ============================================================================
  // ANALYTICS ENDPOINTS
  // ============================================================================
  http.get(`${API_BASE}/analytics/cash-flow`, () => {
    return HttpResponse.json({
      data: {
        months: ['Jun', 'Jul', 'Aug'],
        values: [250000, 280000, 320000]
      }
    });
  }),

  http.get(`${API_BASE}/analytics/anomalies`, () => {
    return HttpResponse.json({
      data: [{ id: 'anom-1', vendor: 'Vendor A', amount: 50000 }]
    });
  }),

  http.get(`${API_BASE}/analytics/vendor-risk/:vendorId`, () => {
    return HttpResponse.json({
      data: { risk: 'LOW' }
    });
  }),

  // ============================================================================
  // AUTH & USER ENDPOINTS
  // ============================================================================
  http.get(`${API_BASE}/users/current`, () => {
    return HttpResponse.json({
      data: {
        id: 'user-1',
        name: 'Admin User',
        email: 'admin@orionops.local',
        role: 'ADMIN'
      }
    });
  }),

  http.post(`${API_BASE}/auth/login`, () => {
    return HttpResponse.json({
      data: { token: 'mock-jwt-token', user: { id: 'user-1', role: 'ADMIN' } }
    });
  }),

  http.post(`${API_BASE}/auth/logout`, () => {
    return HttpResponse.json({ data: { success: true } });
  }),

  // ============================================================================
  // VENDOR ENDPOINTS
  // ============================================================================
  http.get(`${API_BASE}/vendors/:id/duplicates`, () => {
    return HttpResponse.json({
      data: [{ id: 'vendor-2', name: 'Similar Vendor', similarity: 85 }]
    });
  }),

  http.post(`${API_BASE}/vendors/consolidate`, () => {
    return HttpResponse.json({ data: { consolidated: true } });
  }),

  http.get(`${API_BASE}/vendors/:id/quality-score`, () => {
    return HttpResponse.json({
      data: { score: 85 }
    });
  }),

  http.post(`${API_BASE}/vendors/:id/audit`, () => {
    return HttpResponse.json({ data: { audited: true } });
  }),

  http.get(`${API_BASE}/vendors/:id/sla-status`, () => {
    return HttpResponse.json({
      data: { score: 4.5, trend: 'up' }
    });
  }),

  // ============================================================================
  // UOM ENDPOINTS
  // ============================================================================
  http.get(`${API_BASE}/inventory/uom`, () => {
    return HttpResponse.json({
      data: {
        'Weight': ['KG', 'LB'],
        'Length': ['METER', 'FOOT']
      }
    });
  }),

  http.post(`${API_BASE}/inventory/uom/convert`, () => {
    return HttpResponse.json({
      data: 22 // 10 KG to LB
    });
  }),

  http.get(`${API_BASE}/inventory/uom/compatible`, () => {
    return HttpResponse.json({
      data: true
    });
  }),

  // ============================================================================
  // SEARCH ENDPOINT
  // ============================================================================
  http.get(`${API_BASE}/search`, ({ request }) => {
    const url = new URL(request.url);
    url.searchParams.get('q'); // consumed by search logic
    return HttpResponse.json({
      data: [
        { id: 'inc-1', type: 'incident', title: 'INC-001: Database issue', url: '/incidents/inc-1' },
        { id: 'po-1', type: 'purchase_order', title: 'PO-001: Hardware', url: '/procurement/po-1' }
      ]
    });
  }),

  // ============================================================================
  // NOTIFICATIONS ENDPOINT
  // ============================================================================
  http.get(`${API_BASE}/notifications`, () => {
    return HttpResponse.json({
      data: [
        { id: 'notif-1', title: 'New Incident', message: 'INC-001 opened', read: false },
        { id: 'notif-2', title: 'Budget Alert', message: 'Engineering 85% utilized', read: false }
      ]
    });
  }),

  http.post(`${API_BASE}/notifications/mark-read`, () => {
    return HttpResponse.json({ data: { success: true } });
  }),
];
