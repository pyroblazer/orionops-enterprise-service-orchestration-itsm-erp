export const mockIncidents = {
  list: {
    data: [
      {
        id: 'inc-001',
        title: 'Server Down - Production',
        description: 'The production server is unresponsive',
        priority: 'CRITICAL',
        status: 'OPEN',
        category: 'Hardware',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        slaResolutionTarget: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'inc-002',
        title: 'Database Performance Degradation',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        category: 'Database',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        slaResolutionTarget: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      },
    ],
    total: 2,
  },
  detail: {
    id: 'inc-001',
    title: 'Server Down - Production',
    description: 'The production server is unresponsive',
    priority: 'CRITICAL',
    status: 'OPEN',
    category: 'Hardware',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    slaResolutionTarget: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    comments: [],
    attachments: [],
  },
};

export const mockProblems = {
  list: {
    data: [
      {
        id: 'prob-001',
        title: 'Memory Leak in API Service',
        status: 'OPEN',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isKnownError: false,
      },
    ],
    total: 1,
  },
  detail: {
    id: 'prob-001',
    title: 'Memory Leak in API Service',
    status: 'OPEN',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isKnownError: false,
    linkedIncidents: [],
  },
};

export const mockChanges = {
  list: {
    data: [
      {
        id: 'chg-001',
        title: 'Upgrade Database',
        type: 'NORMAL',
        status: 'SUBMITTED',
        risk: 'MEDIUM',
        impact: 'MODERATE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    total: 1,
  },
  detail: {
    id: 'chg-001',
    title: 'Upgrade Database',
    type: 'NORMAL',
    status: 'SUBMITTED',
    risk: 'MEDIUM',
    impact: 'MODERATE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rollbackPlan: 'Restore from backup if deployment fails',
  },
};

export const mockRequests = {
  list: {
    data: [
      {
        id: 'req-001',
        title: 'New User Account',
        status: 'SUBMITTED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    total: 1,
  },
  detail: {
    id: 'req-001',
    title: 'New User Account',
    status: 'SUBMITTED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timeline: [],
  },
};

export const mockCMDB = {
  list: {
    data: [
      {
        id: 'ci-001',
        name: 'Production API Server',
        type: 'APPLICATION',
        status: 'OPERATIONAL',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    total: 1,
  },
  detail: {
    id: 'ci-001',
    name: 'Production API Server',
    type: 'APPLICATION',
    status: 'OPERATIONAL',
    attributes: {
      hostname: 'api-prod-01.orionops.local',
      ipAddress: '10.0.1.100',
      owner: 'Platform Team',
    },
  },
  relationships: {
    data: [{ id: 'ci-002', name: 'Database Server', type: 'DATABASE' }],
    total: 1,
  },
};

export const mockSLA = {
  instances: {
    data: [
      {
        id: 'sla-inst-001',
        status: 'ACTIVE',
        resolutionTarget: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      },
      {
        id: 'sla-inst-002',
        status: 'BREACHING',
        resolutionTarget: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      },
    ],
    total: 2,
  },
  definitions: {
    data: [
      {
        id: 'sla-def-001',
        name: 'P1 Resolution',
        priority: 'CRITICAL',
        targetMinutes: 240,
      },
    ],
    total: 1,
  },
};

export const mockKnowledge = {
  list: {
    data: [
      {
        id: 'kb-001',
        title: 'How to Reset Your Password',
        status: 'PUBLISHED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    total: 1,
  },
  detail: {
    id: 'kb-001',
    title: 'How to Reset Your Password',
    content: 'Follow these steps to reset your password...',
    status: 'PUBLISHED',
    createdAt: new Date().toISOString(),
    linkedIncidents: [],
  },
};

export const mockNotifications = {
  list: {
    data: [
      {
        id: 'notif-001',
        title: 'Incident INC-001 Assigned',
        message: 'You have been assigned to incident INC-001',
        read: false,
        entityId: 'inc-001',
        entityType: 'incident',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'notif-002',
        title: 'SLA Breach Warning',
        message: 'Incident INC-002 SLA will breach in 30 minutes',
        read: false,
        entityId: 'inc-002',
        entityType: 'incident',
        createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      },
    ],
    unreadCount: 2,
    total: 2,
  },
};

export const mockAudit = {
  list: {
    data: [
      {
        id: 'audit-001',
        action: 'INCIDENT_CREATED',
        actor: 'test@orionops.com',
        entityId: 'inc-001',
        timestamp: new Date().toISOString(),
        changes: { title: 'Server Down' },
      },
    ],
    total: 1,
  },
};

export const mockSearch = {
  results: {
    data: [
      {
        id: 'inc-001',
        title: 'Server Down - Production',
        type: 'incident',
        score: 0.95,
      },
      {
        id: 'prob-001',
        title: 'Memory Leak in API Service',
        type: 'problem',
        score: 0.75,
      },
    ],
    total: 2,
  },
};

export const mockFinance = {
  budgets: {
    data: [
      {
        id: 'budget-001',
        name: 'IT Operations',
        totalAmount: 500000,
        spentAmount: 250000,
        fiscalYear: 2024,
        currency: 'USD',
      },
    ],
    total: 1,
  },
  costCenters: {
    data: [
      {
        id: 'cc-001',
        name: 'Support',
        budget: 100000,
      },
    ],
    total: 1,
  },
  invoices: {
    data: [
      {
        id: 'inv-001',
        vendor: 'Vendor A',
        amount: 10000,
        status: 'PAID',
      },
    ],
    total: 1,
  },
};

export const mockProcurement = {
  purchaseRequests: {
    data: [
      {
        id: 'pr-001',
        title: 'Office Supplies',
        estimatedCost: 5000,
        status: 'DRAFT',
      },
    ],
    total: 1,
  },
  purchaseOrders: {
    data: [
      {
        id: 'po-001',
        prId: 'pr-001',
        vendorId: 'v-001',
        status: 'SENT',
      },
    ],
    total: 1,
  },
  contracts: {
    data: [
      {
        id: 'contract-001',
        vendorId: 'v-001',
        startDate: '2024-01-01',
        endDate: '2025-12-31',
      },
    ],
    total: 1,
  },
};

export const mockInventory = {
  items: {
    data: [
      {
        id: 'item-001',
        name: 'Server RAM 16GB',
        quantity: 50,
        warehouse: 'WH-001',
      },
    ],
    total: 1,
  },
  assets: {
    data: [
      {
        id: 'asset-001',
        name: 'Server',
        serialNumber: 'SN-12345',
        status: 'ACTIVE',
      },
    ],
    total: 1,
  },
};

export const mockVendors = {
  list: {
    data: [
      {
        id: 'vendor-001',
        name: 'Tech Supplies Inc',
        slaStatus: 'COMPLIANT',
        performanceRating: 4.5,
      },
    ],
    total: 1,
  },
  detail: {
    id: 'vendor-001',
    name: 'Tech Supplies Inc',
    slaStatus: 'COMPLIANT',
    performanceRating: 4.5,
    contacts: [],
  },
};

export const mockWorkforce = {
  employees: {
    data: [
      {
        id: 'emp-001',
        name: 'John Doe',
        skills: ['Java', 'Spring Boot'],
        capacity: 40,
      },
    ],
    total: 1,
  },
  capacityPlans: {
    data: [
      {
        id: 'cap-001',
        teamName: 'Backend Team',
        allocatedHours: 160,
        availableHours: 40,
        utilization: 0.8,
      },
    ],
    total: 1,
  },
};

export const mockBilling = {
  usage: {
    data: [
      {
        id: 'usage-001',
        period: '2024-01',
        cost: 5000,
        service: 'Incident Management',
      },
    ],
    total: 1,
  },
  records: {
    data: [
      {
        id: 'bill-001',
        period: '2024-01',
        totalCost: 5000,
        status: 'PAID',
      },
    ],
    total: 1,
  },
};

export const mockReporting = {
  itsm: {
    mttr: 120,
    mtta: 30,
    slaBreachRate: 5.2,
    openIncidents: 12,
  },
  finance: {
    budgetVariance: [
      {
        name: 'IT Operations',
        budget_amount: 500000,
        spent: 250000,
        variance: 250000,
        variance_pct: 50,
      },
    ],
  },
  procurement: {
    poAging: [
      {
        status: 'PENDING',
        age_bucket: '0-30 days',
        count: 5,
      },
    ],
  },
};

export const mockAnalytics = {
  executiveDashboard: {
    mttr: 120,
    slaCompliance: 98,
    budgetUtilization: 55,
    vendorSpend: 1200000,
    openIncidents: 12,
    changeSuccessRate: 92,
    inventoryValue: 850000,
    workforceUtilization: 78,
    overdueInvoices: 3,
    activeContracts: 45,
    expiringWarranties: 7,
    complianceViolations: 1,
  },
};

export const mockCompliance = {
  sodRules: {
    data: [
      {
        activity1: 'Create Purchase Order',
        activity2: 'Approve Payment',
        conflictLevel: 'HIGH',
      },
    ],
  },
  approvalAuthorities: {
    data: [
      {
        user: 'john@orionops.com',
        activityType: 'APPROVE_PO',
        maxAmount: 10000,
      },
    ],
  },
};

export const mockAdmin = {
  stats: {
    totalUsers: 50,
    roles: 6,
    workflows: 12,
    systemStatus: 'OPERATIONAL',
  },
  users: {
    data: [
      {
        id: 'user-001',
        name: 'John Doe',
        email: 'john@orionops.com',
        role: 'admin',
        status: 'ACTIVE',
      },
    ],
    total: 1,
  },
  roles: [
    { id: 'role-001', name: 'Admin', type: 'SYSTEM' },
    { id: 'role-002', name: 'Manager', type: 'SYSTEM' },
    { id: 'role-003', name: 'Agent', type: 'SYSTEM' },
    { id: 'role-004', name: 'Resolver', type: 'SYSTEM' },
    { id: 'role-005', name: 'Viewer', type: 'SYSTEM' },
    { id: 'role-006', name: 'Guest', type: 'SYSTEM' },
  ],
  workflows: {
    data: [
      {
        id: 'wf-001',
        name: 'Incident Resolution',
        version: 1,
        status: 'ACTIVE',
      },
    ],
    total: 1,
  },
};

export const mockSettings = {
  platformSettings: {
    platformName: 'OrionOps',
    timezone: 'UTC',
    dateFormat: 'YYYY-MM-DD',
    currency: 'USD',
  },
  userProfile: {
    id: 'u1',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@orionops.com',
    phone: '+1234567890',
    department: 'IT Operations',
  },
};

export const mockTransfers = {
  list: { data: [
    { id: 'tr-001', sku: 'RAM-16GB', fromWarehouse: 'WH-001', toWarehouse: 'WH-002', quantity: 10, status: 'PENDING' },
    { id: 'tr-002', sku: 'SSD-512', fromWarehouse: 'WH-002', toWarehouse: 'WH-003', quantity: 5, status: 'IN_TRANSIT' },
    { id: 'tr-003', sku: 'CPU-AMD', fromWarehouse: 'WH-001', toWarehouse: 'WH-003', quantity: 2, status: 'RECEIVED' },
  ], total: 3 },
  created: { data: { id: 'tr-004', sku: 'RAM-16GB', fromWarehouse: 'WH-001', toWarehouse: 'WH-002', quantity: 20, status: 'PENDING' } },
  transited: { data: { id: 'tr-001', sku: 'RAM-16GB', fromWarehouse: 'WH-001', toWarehouse: 'WH-002', quantity: 10, status: 'IN_TRANSIT' } },
  received: { data: { id: 'tr-002', sku: 'SSD-512', fromWarehouse: 'WH-002', toWarehouse: 'WH-003', quantity: 5, status: 'RECEIVED' } },
};

export const mockLots = {
  list: { data: [
    { id: 'lot-001', sku: 'RAM-16GB', lotNumber: 'LOT-2024-001', quantity: 100, expiryDate: '2026-12-31', status: 'ACTIVE' },
    { id: 'lot-002', sku: 'SSD-512', lotNumber: 'LOT-2024-002', quantity: 50, expiryDate: '2025-01-01', status: 'ACTIVE' },
  ], total: 2 },
  expiring: { data: [
    { id: 'lot-002', sku: 'SSD-512', lotNumber: 'LOT-2024-002', daysRemaining: 30 },
  ]},
};

export const mockDemandPlan = {
  list: { data: [
    { sku: 'RAM-16GB', reorderPoint: 20, reorderQuantity: 50, forecastAccuracy: '92%' },
    { sku: 'SSD-512', reorderPoint: 10, reorderQuantity: 25, forecastAccuracy: '92%' },
  ], total: 2 },
};

export const mockApprovalAuthorities = {
  list: { data: [], total: 0 },
  canApprove: { data: { canApprove: true, reason: 'User has authority up to $10,000' } },
  cannotApprove: { data: { canApprove: false, reason: 'Amount exceeds user authority limit' } },
  created: { data: { id: 'auth-001', userId: 'u1', activityType: 'APPROVE_PO', maxAmount: 5000 } },
};

export const mockSpendAnalysis = {
  concentration: { data: { risk: 'MEDIUM', topVendorPercentage: 42, totalVendors: 15, consolidationPotential: 125000 } },
  byVendor: { data: [
    { vendorName: 'Vendor A', totalSpend: 500000, percentage: 42 },
    { vendorName: 'Vendor B', totalSpend: 350000, percentage: 29 },
  ]},
  byCategory: { data: [
    { category: 'Software', totalSpend: 400000 },
    { category: 'Hardware', totalSpend: 300000 },
  ]},
  consolidation: { data: { opportunities: [], totalSavings: 125000 } },
};

export const mockBudgetDetail = {
  data: { id: 'budget-001', name: 'Software Development', total: 250000, spent: 185000, period: '2026 Q2', utilization: 74 },
};

export const mockCostCenterDetail = {
  data: { id: 'cc-001', name: 'Engineering Department', code: 'CC-001', owner: 'John Doe', budgetAmount: 500000, status: 'ACTIVE' },
};

export const mockPurchaseRequests = {
  list: { data: [
    { id: 'pr-001', title: 'Office Supplies', estimatedCost: 5000, status: 'draft', priority: 'medium', currency: 'USD', quantity: 10, requiredDate: '2026-07-01', justification: 'Quarterly restock' },
    { id: 'pr-002', title: 'Server Hardware', estimatedCost: 25000, status: 'approved', priority: 'high', currency: 'USD', quantity: 2, requiredDate: '2026-08-15', justification: 'Data center expansion' },
  ], total: 2 },
};

export const mockContracts = {
  list: { data: [
    { id: 'contract-001', title: 'Cloud Services Agreement', vendorId: 'v-001', contractValue: 100000, currency: 'USD', startDate: '2026-01-01', endDate: '2026-12-31', autoRenewal: true, status: 'active' },
  ], total: 1 },
};

export const mockRFQDetail = {
  data: { id: 'rfq-001', title: 'Server Procurement RFQ', status: 'SENT', deadline: '2026-07-15', vendorsSolicited: 3, bidResponses: 2, bids: [
    { vendorId: 'v-001', vendorName: 'Vendor A', price: 45000, deliveryDays: 14, qualityRating: 4.5, score: 87 },
    { vendorId: 'v-002', vendorName: 'Vendor B', price: 52000, deliveryDays: 7, qualityRating: 4.0, score: 72 },
  ]},
};

export const mockMatchingExceptions = {
  data: [
    { id: 'match-001', invoiceId: 'inv-001', variance: 500, reason: 'Price mismatch', status: 'PENDING' },
    { id: 'match-002', invoiceId: 'inv-002', variance: 0, reason: null, status: 'RESOLVED' },
  ],
};

export const mockGLAccounts = {
  data: [
    { code: '1000', name: 'Cash', type: 'ASSET', balance: 150000 },
    { code: '2000', name: 'Accounts Payable', type: 'LIABILITY', balance: 45000 },
    { code: '3000', name: 'Revenue', type: 'REVENUE', balance: 250000 },
  ],
};

export const mockForecast = {
  data: {
    budgets: [{ id: 'budget-001', name: 'IT Operations', totalAmount: 500000, spentAmount: 250000, forecastSpend: 400000 }],
    alerts: [{ budgetId: 'budget-001', budgetName: 'IT Operations', percentUsed: 85, message: 'Approaching budget limit' }],
  },
};

export const mockExpenses = {
  list: { data: [
    { id: 'exp-001', title: 'Travel Expense', amount: 1500, currency: 'USD', category: 'travel', date: '2026-05-15', status: 'pending', description: 'Conference attendance' },
    { id: 'exp-002', title: 'Software License', amount: 5000, currency: 'USD', category: 'software', date: '2026-06-01', status: 'approved', description: 'Annual renewal' },
  ], total: 2 },
};

export const mockInvoices = {
  list: { data: [
    { id: 'inv-001', invoiceNumber: 'INV-2026-001', vendorId: 'v-001', amount: 10000, currency: 'USD', dueDate: '2026-07-01', status: 'sent', notes: '' },
    { id: 'inv-002', invoiceNumber: 'INV-2026-002', vendorId: 'v-002', amount: 5000, currency: 'USD', dueDate: '2026-06-15', status: 'paid', notes: '' },
  ], total: 2 },
};

export const mockCostCenters = {
  list: { data: [
    { id: 'cc-001', name: 'Engineering', code: 'CC-001', status: 'active', description: 'Engineering department' },
  ], total: 1 },
};

export const mockEmployees = {
  list: { data: [
    { id: 'emp-001', employeeNumber: 'EMP-001', firstName: 'John', lastName: 'Doe', email: 'john@orionops.com', department: 'IT', jobTitle: 'Engineer', status: 'active', skills: ['Java', 'Python'] },
    { id: 'emp-002', employeeNumber: 'EMP-002', firstName: 'Jane', lastName: 'Smith', email: 'jane@orionops.com', department: 'Support', jobTitle: 'Analyst', status: 'active', skills: ['ITIL', 'SQL'] },
  ], total: 2 },
};

export const mockSkills = {
  list: { data: [
    { id: 'skill-001', name: 'Java', category: 'technical', description: 'Java programming' },
    { id: 'skill-002', name: 'ITIL', category: 'certification', description: 'ITIL Foundation' },
  ], total: 2 },
};

export const mockCapacityPlans = {
  list: { data: [
    { id: 'cap-001', team: 'Engineering', periodStart: '2026-06-01', periodEnd: '2026-06-30', allocatedHours: 1600, availableHours: 2000 },
  ], total: 1 },
};

export const mockBillingUsage = {
  list: { data: [
    { id: 'usage-001', service: 'Compute', usageType: 'hours', quantity: 500, unit: 'hours', recordedAt: '2026-06-01' },
  ], total: 1 },
};

export const mockBillingRecords = {
  list: { data: [
    { id: 'rec-001', period: '2026-05', tenantId: 't-001', amount: 5000, status: 'paid' },
    { id: 'rec-002', period: '2026-06', tenantId: 't-001', amount: 7000, status: 'pending' },
  ], total: 2 },
};

export const mockCostModels = {
  list: { data: [
    { id: 'cm-001', name: 'Standard Compute', modelType: 'per_unit', status: 'active', description: 'Per-hour compute pricing', effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31' },
  ], total: 1 },
};

export const mockVendorDetail = {
  data: { id: 'v-001', name: 'Vendor Alpha', type: 'service', status: 'active', contactName: 'Bob Johnson', contactEmail: 'bob@vendor.com', website: 'https://vendor.com', notes: 'Preferred vendor', slaCompliance: 98, performanceRating: 4.5 },
};

export const mockVendorPerformance = {
  list: { data: [] },
  created: { data: { id: 'vp-001', vendorId: 'v-001', rating: 4, slaCompliance: 95, onTimeDelivery: 90, evaluationDate: '2026-06-01' } },
};

export const mockCycleCounts = {
  list: { data: [
    { id: 'cc-001', warehouse: 'WH-001', scheduleDate: '2026-06-15', lastCountDate: '2026-05-15', itemsVariance: 3 },
  ], total: 1 },
};

export const mockAssetDetail = {
  data: { id: 'asset-001', name: 'Production Server', assetTag: 'AST-001', type: 'server', serialNumber: 'SN-12345', purchaseDate: '2025-01-15', purchaseValue: 15000, assignedTo: 'IT Ops', location: 'Data Center A', warrantyExpiry: '2028-01-15', status: 'in_use', bookValue: 11250, depreciationMethod: 'STRAIGHT_LINE', annualDepreciation: 3750, usefulLifeYears: 4 },
};
