import { Page, Route } from '@playwright/test';

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
