import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface FilterParams {
  page?: number;
  pageSize?: number;
  sort?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: string;
  priority?: string;
  assignedTo?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  [key: string]: string | number | boolean | undefined;
}

export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ImpactLevel = 'low' | 'medium' | 'high';

// ---------------------------------------------------------------------------
// ITSM
// ---------------------------------------------------------------------------

export interface Incident {
  id: string;
  title: string;
  description: string;
  status: IncidentStatus;
  priority: Priority;
  category: string;
  serviceId: string;
  serviceName: string;
  configurationItemId?: string;
  configurationItemName?: string;
  assignedTo?: string;
  assignedToName?: string;
  assignedAt?: string;
  reportedBy: string;
  reportedByName: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
  dueDate?: string;
  slaId?: string;
  resolution?: string;
  linkedProblems?: string[];
  relatedCIs?: string[];
  tags: string[];
  attachmentCount?: number;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  actorName?: string;
  createdAt: string;
  details?: string;
}

export type IncidentStatus = 'new' | 'in_progress' | 'pending' | 'resolved' | 'closed' | 'cancelled';

export interface Problem {
  id: string;
  title: string;
  description: string;
  status: ProblemStatus;
  priority: Priority;
  category?: string;
  affectedService?: string;
  rootCause?: string;
  resolution?: string;
  workaround?: string;
  permanentFix?: boolean;
  assignedTo?: string;
  assignedToName?: string;
  linkedIncidents: string[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export type ProblemStatus = 'open' | 'under_investigation' | 'root_cause_identified' | 'known_error' | 'resolved' | 'closed';

export interface Change {
  id: string;
  title: string;
  description: string;
  status: ChangeStatus;
  type: ChangeType;
  risk: RiskLevel;
  impact: ImpactLevel;
  requestedBy: string;
  requestedByName: string;
  assignedTo?: string;
  assignedToName?: string;
  changeManagerId?: string;
  approvalStatus: ApprovalStatus;
  approvals?: ChangeApproval[];
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string;
  implementationPlan?: string;
  rollbackPlan?: string;
  testPlan?: string;
  affectedServices?: string[];
  implementationNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ChangeStatus = 'draft' | 'submitted' | 'pending_approval' | 'approved' | 'scheduled' | 'implementing' | 'implemented' | 'completed' | 'failed' | 'cancelled' | 'rollback';
export type ChangeType = 'standard' | 'normal' | 'emergency';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'not_required';

export interface ChangeApproval {
  approverId: string;
  approverName: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  decidedAt?: string;
}

export interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  status: RequestStatus;
  category: string;
  priority?: Priority;
  requestedBy: string;
  requestedByName: string;
  assignedTo?: string;
  assignedToName?: string;
  justification?: string;
  requiredDate?: string;
  fulfillmentNotes?: string;
  fulfillmentTasks: FulfillmentTask[];
  createdAt: string;
  updatedAt: string;
}

export type RequestStatus = 'draft' | 'submitted' | 'approved' | 'in_fulfillment' | 'completed' | 'cancelled' | 'rejected';

export interface FulfillmentTask {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  assignee?: string;
  completedAt?: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  summary?: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  authorName: string;
  status: 'draft' | 'in_review' | 'published' | 'archived';
  views: number;
  helpfulYes: number;
  helpfulNo: number;
  relatedArticleIds?: string[];
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// CMDB
// ---------------------------------------------------------------------------

export interface CMDBConfigItem {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'maintenance' | 'decommissioned';
  environment: 'production' | 'staging' | 'development' | string;
  owner?: string;
  description?: string;
  serviceId?: string;
  serviceName?: string;
  relations: CMDBRelation[];
  createdAt: string;
  updatedAt: string;
}

/** @deprecated use CMDBConfigItem */
export type CMDBItem = CMDBConfigItem;

export interface CMDBRelation {
  targetId: string;
  targetName: string;
  type: 'depends_on' | 'hosts' | 'connects_to' | 'contains' | string;
  description?: string;
}

export interface CMDBService {
  id: string;
  name: string;
  description?: string;
  owner?: string;
  status: string;
  createdAt: string;
}

export interface CMDBImpactAnalysis {
  ciId: string;
  ciName: string;
  affectedCIs: Array<{ id: string; name: string; type: string; impactLevel: string }>;
  affectedServices: Array<{ id: string; name: string }>;
}

// ---------------------------------------------------------------------------
// SLA
// ---------------------------------------------------------------------------

export interface SLADefinition {
  id: string;
  name: string;
  description: string;
  priority: Priority;
  responseTimeMinutes: number;
  resolutionTimeMinutes: number;
  businessHoursOnly: boolean;
  escalationThresholdPercent?: number;
  createdAt: string;
  updatedAt: string;
  /** @deprecated use responseTimeMinutes */
  responseTime?: number;
  /** @deprecated use resolutionTimeMinutes */
  resolutionTime?: number;
}

export interface SLAInstance {
  id: string;
  slaDefinitionId: string;
  slaName: string;
  targetType: string;
  targetId: string;
  targetTitle?: string;
  status: 'active' | 'paused' | 'met' | 'breached';
  responseDeadline: string;
  resolutionDeadline: string;
  respondedAt?: string;
  resolvedAt?: string;
  elapsedMinutes?: number;
  remainingMinutes?: number;
}

// ---------------------------------------------------------------------------
// Vendor
// ---------------------------------------------------------------------------

export interface Vendor {
  id: string;
  name: string;
  type: 'software' | 'hardware' | 'services' | 'consulting' | 'infrastructure' | string;
  status: 'active' | 'inactive' | 'on_hold' | 'blacklisted';
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  address?: string;
  notes?: string;
  slaCompliancePercent?: number;
  onTimeDeliveryPercent?: number;
  rating?: number;
  totalSpend?: number;
  createdAt: string;
  updatedAt: string;
}

export interface VendorPerformance {
  vendorId: string;
  entries: Array<{
    id: string;
    rating: number;
    slaCompliancePercent: number;
    onTimeDeliveryPercent: number;
    notes?: string;
    evaluationDate: string;
    evaluatedBy: string;
  }>;
  averageRating: number;
  avgSlaCompliance: number;
  avgOnTimeDelivery: number;
  totalTransactions: number;
}

// ---------------------------------------------------------------------------
// Finance
// ---------------------------------------------------------------------------

export interface Budget {
  id: string;
  name: string;
  fiscalYear: number;
  costCenterId: string;
  costCenterName?: string;
  totalAmount: number;
  spentAmount: number;
  currency: string;
  notes?: string;
  utilizationPercent?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CostCenter {
  id: string;
  name: string;
  code: string;
  description?: string;
  managerId?: string;
  managerName?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  currency: string;
  category: 'travel' | 'software' | 'hardware' | 'consulting' | 'other' | string;
  status: 'pending' | 'approved' | 'rejected' | 'reimbursed';
  budgetId?: string;
  budgetName?: string;
  description?: string;
  receiptUrl?: string;
  expenseDate: string;
  submittedBy: string;
  submittedByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  vendorId?: string;
  vendorName?: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  paidAt?: string;
  lineItems?: Array<{ description: string; amount: number }>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  currency: string;
  paymentDate: string;
  method: 'bank_transfer' | 'credit_card' | 'check' | 'other' | string;
  reference?: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Procurement
// ---------------------------------------------------------------------------

export interface PurchaseRequest {
  id: string;
  title: string;
  description?: string;
  itemDescription: string;
  quantity: number;
  estimatedCost: number;
  currency: string;
  vendorId?: string;
  vendorName?: string;
  priority: Priority;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'ordered';
  requiredDate?: string;
  justification?: string;
  requestedBy: string;
  requestedByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrder {
  id: string;
  purchaseRequestId?: string;
  vendorId: string;
  vendorName?: string;
  orderNumber: string;
  totalAmount: number;
  currency: string;
  status: 'issued' | 'partial' | 'received' | 'closed';
  issuedDate: string;
  expectedDeliveryDate?: string;
  receivingNotes?: string;
  lineItems?: Array<{ description: string; quantity: number; unitCost: number }>;
  createdAt: string;
  updatedAt: string;
}

export interface Contract {
  id: string;
  title: string;
  vendorId: string;
  vendorName?: string;
  value: number;
  currency: string;
  status: 'active' | 'expired' | 'pending_renewal';
  startDate: string;
  endDate: string;
  autoRenewal: boolean;
  termsUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  description?: string;
  unit: string;
  warehouseId: string;
  warehouseName?: string;
  quantityOnHand: number;
  minimumQuantity: number;
  maximumQuantity?: number;
  unitCost: number;
  currency: string;
  isLowStock?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  inventoryItemId: string;
  adjustmentType: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason?: string;
  referenceNumber?: string;
  performedBy: string;
  createdAt: string;
}

export interface Asset {
  id: string;
  name: string;
  assetTag: string;
  type: 'laptop' | 'desktop' | 'server' | 'network' | 'phone' | 'furniture' | 'vehicle' | 'other' | string;
  serialNumber?: string;
  status: 'in_use' | 'available' | 'maintenance' | 'disposed';
  purchaseDate?: string;
  purchaseValue: number;
  currentValue?: number;
  currency: string;
  warehouseId?: string;
  warehouseName?: string;
  assignedTo?: string;
  location?: string;
  warrantyExpiry?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  address?: string;
  capacity: number;
  currentItemCount?: number;
  manager?: string;
  notes?: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Workforce
// ---------------------------------------------------------------------------

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department?: string;
  jobTitle?: string;
  managerId?: string;
  skills?: string[];
  status: 'active' | 'inactive' | 'on_leave';
  hiredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Skill {
  id: string;
  name: string;
  category?: string;
  description?: string;
  createdAt: string;
}

export interface CapacityPlan {
  id: string;
  teamName: string;
  period: string;
  totalCapacityHours: number;
  allocatedHours: number;
  utilizationPercent: number;
  members: Array<{ employeeId: string; employeeName: string; allocatedHours: number }>;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Billing
// ---------------------------------------------------------------------------

export interface BillingUsage {
  id: string;
  tenantId: string;
  serviceType: string;
  quantity: number;
  unit: string;
  usageDate: string;
  costModelId?: string;
  computedCost?: number;
  currency?: string;
  createdAt: string;
}

export interface BillingRecord {
  id: string;
  tenantId: string;
  period: string;
  totalAmount: number;
  currency: string;
  status: 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled';
  issuedAt?: string;
  dueDate?: string;
  paidAt?: string;
  lineItems?: Array<{ description: string; amount: number }>;
  createdAt: string;
}

export interface CostModel {
  id: string;
  name: string;
  serviceType: string;
  modelType: 'fixed' | 'tiered' | 'usage_based';
  unitPrice?: number;
  currency: string;
  tiers?: Array<{ upToUnits: number; pricePerUnit: number }>;
  effectiveFrom: string;
  effectiveTo?: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Shared remaining types
// ---------------------------------------------------------------------------

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType?: string;
  resource: string;
  resourceId: string;
  entityId?: string;
  userId: string;
  userName: string;
  details: Record<string, unknown>;
  ipAddress: string;
  timestamp: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
  department?: string;
  phone?: string;
  displayName?: string;
  status?: string;
  lastLoginAt?: string;
  preferences?: Record<string, string>;
}

export interface SearchResults {
  incidents: Incident[];
  problems: Problem[];
  changes: Change[];
  requests: ServiceRequest[];
  knowledgeArticles: KnowledgeArticle[];
  totalResults: number;
}

export interface ReportSummary {
  incidentMetrics: {
    mttrHours: number | null;
    mttaHours: number | null;
    openCount: number;
    resolvedCount: number;
    totalCount: number;
  };
  slaMetrics: {
    totalInstances: number;
    breachedCount: number;
    metCount: number;
    breachRatePercent: number;
  };
  volumeByDay: Array<{ date: string; count: number }>;
  volumeByPriority: Array<{ priority: string; count: number }>;
  volumeByStatus: Array<{ status: string; count: number }>;
}

// ---------------------------------------------------------------------------
// HTTP client
// ---------------------------------------------------------------------------

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
const KEYCLOAK_URL = process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8180';
const KEYCLOAK_REALM = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'orionops';
const KEYCLOAK_CLIENT_ID = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'orionops-web';

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('orionops_access_token');
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('orionops_refresh_token');
}

function setTokens(accessToken: string, refreshToken?: string): void {
  localStorage.setItem('orionops_access_token', accessToken);
  if (refreshToken) localStorage.setItem('orionops_refresh_token', refreshToken);
  // Update auth cookie when tokens are refreshed (extends the session)
  if (typeof window !== 'undefined') {
    document.cookie = 'orionops_authenticated=true; path=/; max-age=1800; SameSite=Lax';
  }
}

function clearTokens(): void {
  localStorage.removeItem('orionops_access_token');
  localStorage.removeItem('orionops_refresh_token');
}

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearTokens();
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(error);
      }
      try {
        const params = new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: KEYCLOAK_CLIENT_ID,
        });
        const response = await axios.post(
          `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`,
          params,
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        const { access_token, refresh_token: newRefreshToken } = response.data;
        setTokens(access_token, newRefreshToken);
        if (originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);
      } catch {
        clearTokens();
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    const apiError: ApiError = {
      message: (error.response?.data as Record<string, string>)?.message || error.message || 'An unexpected error occurred',
      code: (error.response?.data as Record<string, string>)?.code || 'UNKNOWN_ERROR',
      statusCode: error.response?.status || 500,
      details: error.response?.data as Record<string, unknown> | undefined,
    };
    return Promise.reject(apiError);
  }
);

// ---------------------------------------------------------------------------
// API surface
// ---------------------------------------------------------------------------

export const api = {
  // --- Incidents ---
  getIncidents: (params?: FilterParams) =>
    apiClient.get<PaginatedResponse<Incident>>('/incidents', { params }),
  getIncident: (id: string) =>
    apiClient.get<ApiResponse<Incident>>(`/incidents/${id}`),
  createIncident: (data: Partial<Incident>) =>
    apiClient.post<ApiResponse<Incident>>('/incidents', data),
  updateIncident: (id: string, data: Partial<Incident>) =>
    apiClient.patch<ApiResponse<Incident>>(`/incidents/${id}`, data),
  deleteIncident: (id: string) =>
    apiClient.delete(`/incidents/${id}`),
  assignIncident: (id: string, data: { assigneeId: string; reason?: string }) =>
    apiClient.patch<ApiResponse<Incident>>(`/incidents/${id}/assign`, data),
  escalateIncident: (id: string, data: { reason: string; newAssigneeId?: string }) =>
    apiClient.patch<ApiResponse<Incident>>(`/incidents/${id}/escalate`, data),
  resolveIncident: (id: string, data: { resolution: string }) =>
    apiClient.patch<ApiResponse<Incident>>(`/incidents/${id}/resolve`, data),
  closeIncident: (id: string) =>
    apiClient.patch<ApiResponse<Incident>>(`/incidents/${id}/close`),
  addComment: (id: string, data: { content: string }) =>
    apiClient.post<ApiResponse<Incident>>(`/incidents/${id}/comments`, data),

  // --- Problems ---
  getProblems: (params?: FilterParams) =>
    apiClient.get<PaginatedResponse<Problem>>('/problems', { params }),
  getProblem: (id: string) =>
    apiClient.get<ApiResponse<Problem>>(`/problems/${id}`),
  createProblem: (data: Partial<Problem>) =>
    apiClient.post<ApiResponse<Problem>>('/problems', data),
  updateProblem: (id: string, data: Partial<Problem>) =>
    apiClient.put<ApiResponse<Problem>>(`/problems/${id}`, data),
  deleteProblem: (id: string) =>
    apiClient.delete(`/problems/${id}`),
  linkIncidentToProblem: (id: string, data: { incidentId: string }) =>
    apiClient.patch<ApiResponse<Problem>>(`/problems/${id}/link-incident`, data),
  setProblemRootCause: (id: string, data: { rootCause: string; resolution?: string; permanentFix?: boolean }) =>
    apiClient.patch<ApiResponse<Problem>>(`/problems/${id}/root-cause`, data),

  // --- Changes ---
  getChanges: (params?: FilterParams) =>
    apiClient.get<PaginatedResponse<Change>>('/changes', { params }),
  getChange: (id: string) =>
    apiClient.get<ApiResponse<Change>>(`/changes/${id}`),
  createChange: (data: Partial<Change>) =>
    apiClient.post<ApiResponse<Change>>('/changes', data),
  updateChange: (id: string, data: Partial<Change>) =>
    apiClient.put<ApiResponse<Change>>(`/changes/${id}`, data),
  deleteChange: (id: string) =>
    apiClient.delete(`/changes/${id}`),
  submitChange: (id: string) =>
    apiClient.patch<ApiResponse<Change>>(`/changes/${id}/submit`),
  approveChange: (id: string, data: { approverId: string; comments?: string }) =>
    apiClient.patch<ApiResponse<Change>>(`/changes/${id}/approve`, data),
  rejectChange: (id: string, data: { reason: string }) =>
    apiClient.patch<ApiResponse<Change>>(`/changes/${id}/reject`, data),
  implementChange: (id: string, data: { actualStartAt?: string; implementationNotes?: string }) =>
    apiClient.patch<ApiResponse<Change>>(`/changes/${id}/implement`, data),
  closeChange: (id: string) =>
    apiClient.patch<ApiResponse<Change>>(`/changes/${id}/close`),

  // --- Service Requests ---
  getRequests: (params?: FilterParams) =>
    apiClient.get<PaginatedResponse<ServiceRequest>>('/requests', { params }),
  getRequest: (id: string) =>
    apiClient.get<ApiResponse<ServiceRequest>>(`/requests/${id}`),
  createRequest: (data: Partial<ServiceRequest>) =>
    apiClient.post<ApiResponse<ServiceRequest>>('/requests', data),
  updateRequest: (id: string, data: Partial<ServiceRequest>) =>
    apiClient.put<ApiResponse<ServiceRequest>>(`/requests/${id}`, data),
  deleteRequest: (id: string) =>
    apiClient.delete(`/requests/${id}`),
  submitRequest: (id: string) =>
    apiClient.patch<ApiResponse<ServiceRequest>>(`/requests/${id}/submit`),
  approveRequest: (id: string, data: { approverId: string; comments?: string }) =>
    apiClient.patch<ApiResponse<ServiceRequest>>(`/requests/${id}/approve`, data),
  fulfillRequest: (id: string, data: { fulfillmentNotes?: string }) =>
    apiClient.patch<ApiResponse<ServiceRequest>>(`/requests/${id}/fulfill`, data),
  closeRequest: (id: string) =>
    apiClient.patch<ApiResponse<ServiceRequest>>(`/requests/${id}/close`),

  // --- Knowledge Base ---
  getKnowledgeArticles: (params?: FilterParams) =>
    apiClient.get<PaginatedResponse<KnowledgeArticle>>('/knowledge', { params }),
  getKnowledgeArticle: (id: string) =>
    apiClient.get<ApiResponse<KnowledgeArticle>>(`/knowledge/${id}`),
  createKnowledgeArticle: (data: Partial<KnowledgeArticle>) =>
    apiClient.post<ApiResponse<KnowledgeArticle>>('/knowledge', data),
  updateKnowledgeArticle: (id: string, data: Partial<KnowledgeArticle>) =>
    apiClient.put<ApiResponse<KnowledgeArticle>>(`/knowledge/${id}`, data),
  deleteKnowledgeArticle: (id: string) =>
    apiClient.delete(`/knowledge/${id}`),
  submitKnowledgeForReview: (id: string) =>
    apiClient.patch<ApiResponse<KnowledgeArticle>>(`/knowledge/${id}/submit-for-review`),
  publishKnowledgeArticle: (id: string) =>
    apiClient.patch<ApiResponse<KnowledgeArticle>>(`/knowledge/${id}/publish`),

  // --- CMDB ---
  getCMDBItems: (params?: FilterParams) =>
    apiClient.get<PaginatedResponse<CMDBConfigItem>>('/cmdb/ci', { params }),
  getCMDBItem: (id: string) =>
    apiClient.get<ApiResponse<CMDBConfigItem>>(`/cmdb/ci/${id}`),
  createCMDBItem: (data: Partial<CMDBConfigItem>) =>
    apiClient.post<ApiResponse<CMDBConfigItem>>('/cmdb/ci', data),
  updateCMDBItem: (id: string, data: Partial<CMDBConfigItem>) =>
    apiClient.put<ApiResponse<CMDBConfigItem>>(`/cmdb/ci/${id}`, data),
  deleteCMDBItem: (id: string) =>
    apiClient.delete(`/cmdb/ci/${id}`),
  getCMDBRelationships: (id: string) =>
    apiClient.get<ApiResponse<CMDBRelation[]>>(`/cmdb/ci/${id}/relationships`),
  getCMDBImpactAnalysis: (id: string) =>
    apiClient.get<ApiResponse<CMDBImpactAnalysis>>(`/cmdb/ci/${id}/impact-analysis`),
  relateCMDBItems: (sourceId: string, targetId: string, data: { type: string; description?: string }) =>
    apiClient.post<ApiResponse<CMDBRelation>>(`/cmdb/ci/${sourceId}/relate/${targetId}`, data),
  getCMDBServices: (params?: FilterParams) =>
    apiClient.get<PaginatedResponse<CMDBService>>('/cmdb/services', { params }),

  // --- SLA ---
  getSLADefinitions: () =>
    apiClient.get<ApiResponse<SLADefinition[]>>('/sla/definitions'),
  getSLAInstances: (params?: FilterParams) =>
    apiClient.get<PaginatedResponse<SLAInstance>>('/sla/instances', { params }),
  createSLADefinition: (data: Partial<SLADefinition>) =>
    apiClient.post<ApiResponse<SLADefinition>>('/sla/definitions', data),
  updateSLADefinition: (id: string, data: Partial<SLADefinition>) =>
    apiClient.put<ApiResponse<SLADefinition>>(`/sla/definitions/${id}`, data),
  deleteSLADefinition: (id: string) =>
    apiClient.delete(`/sla/definitions/${id}`),
  applySLA: (data: { definitionId: string; targetEntityId: string; targetType: string }) =>
    apiClient.post<ApiResponse<SLAInstance>>('/sla/apply', data),
  pauseSLAInstance: (id: string) =>
    apiClient.patch<ApiResponse<SLAInstance>>(`/sla/instances/${id}/pause`),
  resumeSLAInstance: (id: string) =>
    apiClient.patch<ApiResponse<SLAInstance>>(`/sla/instances/${id}/resume`),

  // --- Vendors ---
  getVendors: (params?: FilterParams) =>
    apiClient.get<PaginatedResponse<Vendor>>('/vendors', { params }),
  getVendor: (id: string) =>
    apiClient.get<ApiResponse<Vendor>>(`/vendors/${id}`),
  createVendor: (data: Partial<Vendor>) =>
    apiClient.post<ApiResponse<Vendor>>('/vendors', data),
  updateVendor: (id: string, data: Partial<Vendor>) =>
    apiClient.put<ApiResponse<Vendor>>(`/vendors/${id}`, data),
  deleteVendor: (id: string) =>
    apiClient.delete(`/vendors/${id}`),
  getVendorPerformance: (id: string) =>
    apiClient.get<ApiResponse<VendorPerformance>>(`/vendors/${id}/performance`),
  recordVendorPerformance: (id: string, data: { rating: number; slaCompliancePercent: number; onTimeDeliveryPercent: number; notes?: string; evaluationDate: string }) =>
    apiClient.post<ApiResponse<VendorPerformance>>(`/vendors/${id}/performance`, data),

  // --- Finance ---
  getBudgets: (params?: FilterParams) =>
    apiClient.get<PaginatedResponse<Budget>>('/finance/budgets', { params }),
  getBudget: (id: string) =>
    apiClient.get<ApiResponse<Budget>>(`/finance/budgets/${id}`),
  getBudgetUtilization: (id: string) =>
    apiClient.get<ApiResponse<{ spentAmount: number; totalAmount: number; utilizationPercent: number }>>(`/finance/budgets/${id}/utilization`),
  createBudget: (data: Partial<Budget>) =>
    apiClient.post<ApiResponse<Budget>>('/finance/budgets', data),
  updateBudget: (id: string, data: Partial<Budget>) =>
    apiClient.put<ApiResponse<Budget>>(`/finance/budgets/${id}`, data),
  deleteBudget: (id: string) =>
    apiClient.delete(`/finance/budgets/${id}`),
  getCostCenters: (params?: FilterParams) =>
    apiClient.get<PaginatedResponse<CostCenter>>('/finance/cost-centers', { params }),
  createCostCenter: (data: Partial<CostCenter>) =>
    apiClient.post<ApiResponse<CostCenter>>('/finance/cost-centers', data),
  updateCostCenter: (id: string, data: Partial<CostCenter>) =>
    apiClient.put<ApiResponse<CostCenter>>(`/finance/cost-centers/${id}`, data),
  deleteCostCenter: (id: string) =>
    apiClient.delete(`/finance/cost-centers/${id}`),
  getExpenses: (params?: FilterParams) =>
    apiClient.get<PaginatedResponse<Expense>>('/finance/expenses', { params }),
  getExpense: (id: string) =>
    apiClient.get<ApiResponse<Expense>>(`/finance/expenses/${id}`),
  createExpense: (data: Partial<Expense>) =>
    apiClient.post<ApiResponse<Expense>>('/finance/expenses', data),
  updateExpense: (id: string, data: Partial<Expense>) =>
    apiClient.put<ApiResponse<Expense>>(`/finance/expenses/${id}`, data),
  deleteExpense: (id: string) =>
    apiClient.delete(`/finance/expenses/${id}`),
  getInvoices: (params?: FilterParams) =>
    apiClient.get<PaginatedResponse<Invoice>>('/finance/invoices', { params }),
  getInvoice: (id: string) =>
    apiClient.get<ApiResponse<Invoice>>(`/finance/invoices/${id}`),
  createInvoice: (data: Partial<Invoice>) =>
    apiClient.post<ApiResponse<Invoice>>('/finance/invoices', data),
  updateInvoice: (id: string, data: Partial<Invoice>) =>
    apiClient.put<ApiResponse<Invoice>>(`/finance/invoices/${id}`, data),
  deleteInvoice: (id: string) =>
    apiClient.delete(`/finance/invoices/${id}`),
  getPayments: (params?: FilterParams) =>
    apiClient.get<PaginatedResponse<Payment>>('/finance/payments', { params }),
  createPayment: (data: Partial<Payment>) =>
    apiClient.post<ApiResponse<Payment>>('/finance/payments', data),

  // --- Procurement ---
  getPurchaseRequests: (params?: FilterParams) =>
    apiClient.get<PaginatedResponse<PurchaseRequest>>('/procurement/requests', { params }),
  getPurchaseRequest: (id: string) =>
    apiClient.get<ApiResponse<PurchaseRequest>>(`/procurement/requests/${id}`),
  createPurchaseRequest: (data: Partial<PurchaseRequest>) =>
    apiClient.post<ApiResponse<PurchaseRequest>>('/procurement/requests', data),
  updatePurchaseRequest: (id: string, data: Partial<PurchaseRequest>) =>
    apiClient.put<ApiResponse<PurchaseRequest>>(`/procurement/requests/${id}`, data),
  deletePurchaseRequest: (id: string) =>
    apiClient.delete(`/procurement/requests/${id}`),
  submitPurchaseRequest: (id: string) =>
    apiClient.post<ApiResponse<PurchaseRequest>>(`/procurement/requests/${id}/submit`),
  createPOFromPR: (id: string) =>
    apiClient.post<ApiResponse<PurchaseOrder>>(`/procurement/requests/${id}/create-po`),
  getPurchaseOrders: (params?: FilterParams) =>
    apiClient.get<PaginatedResponse<PurchaseOrder>>('/procurement/orders', { params }),
  getPurchaseOrder: (id: string) =>
    apiClient.get<ApiResponse<PurchaseOrder>>(`/procurement/orders/${id}`),
  updatePurchaseOrder: (id: string, data: Partial<PurchaseOrder>) =>
    apiClient.put<ApiResponse<PurchaseOrder>>(`/procurement/orders/${id}`, data),
  getContracts: (params?: FilterParams) =>
    apiClient.get<PaginatedResponse<Contract>>('/procurement/contracts', { params }),
  getContract: (id: string) =>
    apiClient.get<ApiResponse<Contract>>(`/procurement/contracts/${id}`),
  createContract: (data: Partial<Contract>) =>
    apiClient.post<ApiResponse<Contract>>('/procurement/contracts', data),
  updateContract: (id: string, data: Partial<Contract>) =>
    apiClient.put<ApiResponse<Contract>>(`/procurement/contracts/${id}`, data),
  deleteContract: (id: string) =>
    apiClient.delete(`/procurement/contracts/${id}`),
  getProcurementVendors: (params?: FilterParams) =>
    apiClient.get<PaginatedResponse<Vendor>>('/procurement/vendors', { params }),

  // --- Inventory ---
  getInventoryItems: (params?: FilterParams) =>
    apiClient.get<PaginatedResponse<InventoryItem>>('/inventory/items', { params }),
  getInventoryItem: (id: string) =>
    apiClient.get<ApiResponse<InventoryItem>>(`/inventory/items/${id}`),
  createInventoryItem: (data: Partial<InventoryItem>) =>
    apiClient.post<ApiResponse<InventoryItem>>('/inventory/items', data),
  updateInventoryItem: (id: string, data: Partial<InventoryItem>) =>
    apiClient.put<ApiResponse<InventoryItem>>(`/inventory/items/${id}`, data),
  deleteInventoryItem: (id: string) =>
    apiClient.delete(`/inventory/items/${id}`),
  getLowStockItems: () =>
    apiClient.get<ApiResponse<InventoryItem[]>>('/inventory/items/low-stock'),
  recordStockMovement: (data: Partial<StockMovement>) =>
    apiClient.post<ApiResponse<StockMovement>>('/inventory/movements', data),
  getAssets: (params?: FilterParams) =>
    apiClient.get<PaginatedResponse<Asset>>('/inventory/assets', { params }),
  getAsset: (id: string) =>
    apiClient.get<ApiResponse<Asset>>(`/inventory/assets/${id}`),
  createAsset: (data: Partial<Asset>) =>
    apiClient.post<ApiResponse<Asset>>('/inventory/assets', data),
  updateAsset: (id: string, data: Partial<Asset>) =>
    apiClient.put<ApiResponse<Asset>>(`/inventory/assets/${id}`, data),
  deleteAsset: (id: string) =>
    apiClient.delete(`/inventory/assets/${id}`),
  getWarehouses: (params?: FilterParams) =>
    apiClient.get<PaginatedResponse<Warehouse>>('/inventory/warehouses', { params }),
  createWarehouse: (data: Partial<Warehouse>) =>
    apiClient.post<ApiResponse<Warehouse>>('/inventory/warehouses', data),
  updateWarehouse: (id: string, data: Partial<Warehouse>) =>
    apiClient.put<ApiResponse<Warehouse>>(`/inventory/warehouses/${id}`, data),

  // --- Workforce ---
  getEmployees: (params?: FilterParams) =>
    apiClient.get<PaginatedResponse<Employee>>('/workforce/employees', { params }),
  getEmployee: (id: string) =>
    apiClient.get<ApiResponse<Employee>>(`/workforce/employees/${id}`),
  createEmployee: (data: Partial<Employee>) =>
    apiClient.post<ApiResponse<Employee>>('/workforce/employees', data),
  updateEmployee: (id: string, data: Partial<Employee>) =>
    apiClient.put<ApiResponse<Employee>>(`/workforce/employees/${id}`, data),
  deleteEmployee: (id: string) =>
    apiClient.delete(`/workforce/employees/${id}`),
  getEmployeesBySkills: (skills: string[]) =>
    apiClient.get<ApiResponse<Employee[]>>('/workforce/employees/by-skills', { params: { skills: skills.join(',') } }),
  getSkills: (params?: FilterParams) =>
    apiClient.get<PaginatedResponse<Skill>>('/workforce/skills', { params }),
  createSkill: (data: Partial<Skill>) =>
    apiClient.post<ApiResponse<Skill>>('/workforce/skills', data),
  updateSkill: (id: string, data: Partial<Skill>) =>
    apiClient.put<ApiResponse<Skill>>(`/workforce/skills/${id}`, data),
  deleteSkill: (id: string) =>
    apiClient.delete(`/workforce/skills/${id}`),
  getCapacityOverview: () =>
    apiClient.get<ApiResponse<CapacityPlan[]>>('/workforce/capacity'),
  createCapacityPlan: (data: Partial<CapacityPlan>) =>
    apiClient.post<ApiResponse<CapacityPlan>>('/workforce/capacity', data),
  updateCapacityPlan: (id: string, data: Partial<CapacityPlan>) =>
    apiClient.put<ApiResponse<CapacityPlan>>(`/workforce/capacity/${id}`, data),

  // --- Billing ---
  getBillingUsage: (params?: FilterParams) =>
    apiClient.get<PaginatedResponse<BillingUsage>>('/billing/usages', { params }),
  recordUsage: (data: Partial<BillingUsage>) =>
    apiClient.post<ApiResponse<BillingUsage>>('/billing/record-usage', data),
  getBillingRecords: (params?: FilterParams) =>
    apiClient.get<PaginatedResponse<BillingRecord>>('/billing/records', { params }),
  updateBillingRecord: (id: string, data: Partial<BillingRecord>) =>
    apiClient.put<ApiResponse<BillingRecord>>(`/billing/records/${id}`, data),
  generateInvoice: (data: { period: string; tenantId?: string }) =>
    apiClient.post<ApiResponse<BillingRecord>>('/billing/generate-invoice', data),
  getCostModels: () =>
    apiClient.get<ApiResponse<CostModel[]>>('/billing/cost-models'),
  createCostModel: (data: Partial<CostModel>) =>
    apiClient.post<ApiResponse<CostModel>>('/billing/cost-models', data),
  updateCostModel: (id: string, data: Partial<CostModel>) =>
    apiClient.put<ApiResponse<CostModel>>(`/billing/cost-models/${id}`, data),
  deleteCostModel: (id: string) =>
    apiClient.delete(`/billing/cost-models/${id}`),

  // --- Notifications ---
  getNotifications: () =>
    apiClient.get<ApiResponse<Notification[]>>('/notifications'),
  markNotificationRead: (id: string) =>
    apiClient.patch(`/notifications/${id}/read`),
  markAllNotificationsRead: () =>
    apiClient.patch('/notifications/read-all'),

  // --- Audit ---
  getAuditLogs: (params?: FilterParams & { entityType?: string; entityId?: string; performedBy?: string }) =>
    apiClient.get<PaginatedResponse<AuditLog>>('/audit', { params }),

  // --- Search ---
  search: (query: string) =>
    apiClient.get<ApiResponse<SearchResults>>('/search', { params: { q: query } }),

  // --- Users ---
  getCurrentUser: () =>
    apiClient.get<ApiResponse<User>>('/users/me'),
  getUsers: (params?: FilterParams) =>
    apiClient.get<PaginatedResponse<User>>('/users', { params }),
  updateUser: (id: string, data: Partial<User>) =>
    apiClient.put<ApiResponse<User>>(`/users/${id}`, data),

  // --- Reporting ---
  getReportSummary: (days = 30) =>
    apiClient.get<ApiResponse<ReportSummary>>('/reports/summary', { params: { days } }),

  // ERP Reports
  getBudgetVariance: () =>
    apiClient.get<ApiResponse<Record<string, unknown>[]>>('/reports/finance/budget-variance'),
  getExpenseBreakdown: (period: string) =>
    apiClient.get<ApiResponse<Record<string, unknown>[]>>('/reports/finance/expense-breakdown', { params: { period } }),
  getInvoiceAging: () =>
    apiClient.get<ApiResponse<Record<string, unknown>[]>>('/reports/finance/invoice-aging'),
  getPOAging: () =>
    apiClient.get<ApiResponse<Record<string, unknown>[]>>('/reports/procurement/po-aging'),
  getVendorSpend: () =>
    apiClient.get<ApiResponse<Record<string, unknown>[]>>('/reports/procurement/vendor-spend'),
  getInventoryValuation: () =>
    apiClient.get<ApiResponse<Record<string, unknown>[]>>('/reports/inventory/valuation'),
  getStockMovements: (period: string) =>
    apiClient.get<ApiResponse<Record<string, unknown>[]>>('/reports/inventory/stock-movements', { params: { period } }),
  getWorkforceCapacity: () =>
    apiClient.get<ApiResponse<Record<string, unknown>[]>>('/reports/workforce/capacity-utilization'),
  getVendorPerformanceReport: () =>
    apiClient.get<ApiResponse<Record<string, unknown>[]>>('/reports/vendor/performance-summary'),
  getBillingChargeback: () =>
    apiClient.get<ApiResponse<Record<string, unknown>[]>>('/reports/billing/chargeback'),

  // --- Finance Forecast ---
  getBudgetForecast: (id: string) =>
    apiClient.get<ApiResponse<Record<string, unknown>>>(`/finance/forecast/budgets/${id}`),
  getBudgetAlerts: () =>
    apiClient.get<ApiResponse<Record<string, unknown>[]>>('/finance/forecast/alerts'),

  // --- General Ledger ---
  getChartOfAccounts: () =>
    apiClient.get<ApiResponse<Record<string, unknown>[]>>('/finance/gl/accounts'),
  getTrialBalance: (asOfDate?: string) =>
    apiClient.get<ApiResponse<Record<string, unknown>>>('/finance/gl/trial-balance', { params: { asOfDate } }),
  getIncomeStatement: (startDate?: string, endDate?: string) =>
    apiClient.get<ApiResponse<Record<string, unknown>>>('/finance/gl/income-statement', { params: { startDate, endDate } }),
  postGLEntry: (data: Record<string, unknown>) =>
    apiClient.post<ApiResponse<void>>('/finance/gl/post', data),
  getGLAccountBalance: (code: string, asOfDate?: string) =>
    apiClient.get<ApiResponse<number>>(`/finance/gl/accounts/${code}/balance`, { params: { asOfDate } }),

  // --- Vendor MDM ---
  getVendorDuplicates: (id: string) =>
    apiClient.get<ApiResponse<Record<string, unknown>[]>>(`/vendor-mdm/vendors/${id}/duplicates`),
  consolidateVendors: (data: Record<string, unknown>) =>
    apiClient.post<ApiResponse<void>>('/vendor-mdm/vendors/consolidate', data),
  getVendorQualityScore: (id: string) =>
    apiClient.get<ApiResponse<number>>(`/vendor-mdm/vendors/${id}/quality-score`),
  getVendorSLAStatus: (id: string) =>
    apiClient.get<ApiResponse<Record<string, unknown>>>(`/vendors/${id}/sla-status`),

  // --- RFQ ---
  getRFQs: () =>
    apiClient.get<PaginatedResponse<Record<string, unknown>>>('/procurement/rfq'),
  createRFQ: (data: Record<string, unknown>) =>
    apiClient.post<ApiResponse<Record<string, unknown>>>('/procurement/rfq', data),
  sendRFQToVendors: (id: string, data: Record<string, unknown>) =>
    apiClient.post<ApiResponse<void>>(`/procurement/rfq/${id}/send`, data),
  recordBid: (id: string, data: Record<string, unknown>) =>
    apiClient.post<ApiResponse<void>>(`/procurement/rfq/${id}/bids`, data),
  getRFQScore: (id: string) =>
    apiClient.get<ApiResponse<Record<string, unknown>[]>>(`/procurement/rfq/${id}/score`),
  awardRFQ: (id: string, data: Record<string, unknown>) =>
    apiClient.post<ApiResponse<void>>(`/procurement/rfq/${id}/award`, data),

  // --- 3-Way Matching ---
  recordGoodsReceipt: (data: Record<string, unknown>) =>
    apiClient.post<ApiResponse<void>>('/procurement/matching/receipts', data),
  matchInvoice: (data: Record<string, unknown>) =>
    apiClient.post<ApiResponse<void>>('/procurement/matching/match', data),
  getInvoiceVariances: (invoiceId: string) =>
    apiClient.get<ApiResponse<Record<string, unknown>>>(`/procurement/matching/variances/${invoiceId}`),
  flagMatchingException: (data: Record<string, unknown>) =>
    apiClient.post<ApiResponse<void>>('/procurement/matching/flag', data),
  resolveVariance: (invoiceId: string, data: Record<string, unknown>) =>
    apiClient.patch<ApiResponse<void>>(`/procurement/matching/resolve/${invoiceId}`, data),

  // --- Spend Analysis ---
  getSpendByVendor: (from?: string, to?: string) =>
    apiClient.get<ApiResponse<Record<string, unknown>>>('/procurement/spend/by-vendor', { params: { from, to } }),
  getSpendByCategory: (from?: string, to?: string) =>
    apiClient.get<ApiResponse<Record<string, unknown>>>('/procurement/spend/by-category', { params: { from, to } }),
  getConsolidationOpportunities: () =>
    apiClient.get<ApiResponse<Record<string, unknown>>>('/procurement/spend/consolidation'),
  getVendorConcentration: () =>
    apiClient.get<ApiResponse<Record<string, unknown>>>('/procurement/spend/concentration'),

  // --- Demand Planning ---
  getSuggestedReorderPoint: (sku?: string) =>
    apiClient.get<ApiResponse<Record<string, unknown>[]>>('/inventory/demand/reorder-point', { params: { sku } }),

  // --- Lot Tracking ---
  getLots: () =>
    apiClient.get<ApiResponse<Record<string, unknown>[]>>('/inventory/lots'),
  receiveLot: (data: Record<string, unknown>) =>
    apiClient.post<ApiResponse<Record<string, unknown>>>('/inventory/lots/receive', data),
  getExpiringLots: () =>
    apiClient.get<ApiResponse<Record<string, unknown>[]>>('/inventory/lots/expiring'),

  // --- Inventory Transfers ---
  getTransfers: (params?: FilterParams) =>
    apiClient.get<PaginatedResponse<Record<string, unknown>>>('/inventory/transfers', { params }),
  createTransfer: (data: Record<string, unknown>) =>
    apiClient.post<ApiResponse<Record<string, unknown>>>('/inventory/transfers', data),
  recordTransitTransfer: (id: string) =>
    apiClient.patch<ApiResponse<void>>(`/inventory/transfers/${id}/transit`),
  receiveTransfer: (id: string, data: Record<string, unknown>) =>
    apiClient.patch<ApiResponse<void>>(`/inventory/transfers/${id}/receive`, data),
  getBinSuggestion: (sku: string, warehouseId?: string) =>
    apiClient.get<ApiResponse<Record<string, unknown>>>(`/inventory/transfers/${sku}/bin-suggestion`, { params: { warehouseId } }),

  // --- Cycle Counting ---
  scheduleCycleCounts: (data: Record<string, unknown>) =>
    apiClient.post<ApiResponse<void>>('/inventory/cycle-counts/schedule', data),
  recordCycleCount: (id: string, data: Record<string, unknown>) =>
    apiClient.post<ApiResponse<void>>(`/inventory/cycle-counts/${id}/record`, data),
  getCycleCountVariances: (id: string) =>
    apiClient.get<ApiResponse<Record<string, unknown>>>(`/inventory/cycle-counts/${id}/variances`),
  investigateCycleVariance: (id: string, data: Record<string, unknown>) =>
    apiClient.post<ApiResponse<void>>(`/inventory/cycle-counts/${id}/investigate`, data),

  // --- Depreciation ---
  getDepreciationSchedule: (assetId: string) =>
    apiClient.get<ApiResponse<Record<string, unknown>>>(`/inventory/assets/${assetId}/depreciation`),
  getAssetBookValue: (assetId: string, asOfDate?: string) =>
    apiClient.get<ApiResponse<number>>(`/inventory/assets/${assetId}/book-value`, { params: { asOfDate } }),
  disposeAsset: (assetId: string, data: Record<string, unknown>) =>
    apiClient.post<ApiResponse<void>>(`/inventory/assets/${assetId}/dispose`, data),

  // --- SoD ---
  getSoDRules: () =>
    apiClient.get<ApiResponse<Record<string, string[]>>>('/compliance/sod/rules'),
  validateSoDCompliance: (data: Record<string, unknown>) =>
    apiClient.post<ApiResponse<boolean>>('/compliance/sod/validate', data),
  checkSoDConflict: (userId?: string, activity?: string) =>
    apiClient.get<ApiResponse<Record<string, unknown>>>('/compliance/sod/check', { params: { userId, activity } }),

  // --- Approval Authorities ---
  setApprovalAuthority: (data: Record<string, unknown>) =>
    apiClient.post<ApiResponse<void>>('/compliance/approval-authorities', data),
  canUserApprove: (data: Record<string, unknown>) =>
    apiClient.post<ApiResponse<boolean>>('/compliance/approval-authorities/can-approve', data),
  getSuggestedApprover: (activityType?: string, amount?: number) =>
    apiClient.get<ApiResponse<string>>('/compliance/approval-authorities/suggest', { params: { activityType, amount } }),

  // --- Analytics ---
  predictCashFlow: (months?: number) =>
    apiClient.get<ApiResponse<Record<string, unknown>>>('/analytics/cash-flow', { params: { months } }),
  detectAnomalies: () =>
    apiClient.get<ApiResponse<Record<string, unknown>[]>>('/analytics/anomalies'),
  predictVendorRisk: (vendorId: string) =>
    apiClient.get<ApiResponse<Record<string, unknown>>>(`/analytics/vendor-risk/${vendorId}`),

  // --- UoM ---
  getUOMHierarchy: () =>
    apiClient.get<ApiResponse<Record<string, unknown>[]>>('/inventory/uom'),
  convertUOM: (data: Record<string, unknown>) =>
    apiClient.post<ApiResponse<number>>('/inventory/uom/convert', data),
  validateUOMCompatibility: (baseUOM?: string, altUOM?: string) =>
    apiClient.get<ApiResponse<boolean>>('/inventory/uom/compatible', { params: { baseUOM, altUOM } }),

  // AI service (routes via Vercel /ai/* serverless, not Spring Boot)
  classifyIncident: (data: { title: string; description: string }): Promise<{ category: string; priority: string; confidence: number }> =>
    fetch('/ai/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(async r => {
      if (!r.ok) throw new Error('AI classification failed');
      return r.json();
    }),
};

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

// --- PKCE (RFC 7636) ---
function generateRandomString(length: number = 64): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(plain));
}

function base64URLEncode(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function generatePKCE(): Promise<{ verifier: string; challenge: string }> {
  const verifier = generateRandomString(64);
  const challenge = base64URLEncode(await sha256(verifier));
  return { verifier, challenge };
}

export function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return {};
  }
}

export const auth = {
  setTokens,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  isAuthenticated: (): boolean => !!getAccessToken(),
  getLoginUrl: async (): Promise<string> => {
    const redirectUri = typeof window !== 'undefined'
      ? `${window.location.origin}/login/callback` : '';
    const { verifier, challenge } = await generatePKCE();
    const state = generateRandomString(32);

    sessionStorage.setItem('orionops_pkce_verifier', verifier);
    sessionStorage.setItem('orionops_oauth_state', state);

    const params = new URLSearchParams({
      client_id: KEYCLOAK_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid profile email',
      code_challenge: challenge,
      code_challenge_method: 'S256',
      state,
    });

    return `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/auth?${params.toString()}`;
  },
  getSignupUrl: async (): Promise<string> => {
    const redirectUri = typeof window !== 'undefined'
      ? `${window.location.origin}/login/callback` : '';
    const { verifier, challenge } = await generatePKCE();
    const state = generateRandomString(32);

    sessionStorage.setItem('orionops_pkce_verifier', verifier);
    sessionStorage.setItem('orionops_oauth_state', state);

    const params = new URLSearchParams({
      client_id: KEYCLOAK_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid profile email',
      code_challenge: challenge,
      code_challenge_method: 'S256',
      state,
      action: 'register',
    });

    return `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/auth?${params.toString()}`;
  },
  getLogoutUrl: (): string => {
    const redirectUri = typeof window !== 'undefined'
      ? `${window.location.origin}/login` : '';
    return `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/logout`
      + `?client_id=${KEYCLOAK_CLIENT_ID}`
      + `&post_logout_redirect_uri=${encodeURIComponent(redirectUri)}`;
  },
  logout: (): void => {
    clearTokens();
    if (typeof window !== 'undefined') {
      document.cookie = 'orionops_authenticated=; path=/; max-age=0; SameSite=Lax';
      window.location.href = auth.getLogoutUrl();
    }
  },
  loginWithPassword: async (username: string, password: string): Promise<void> => {
    // Try backend local auth first (works without Keycloak)
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        const json = await res.json();
        const { accessToken } = json.data || json;
        if (accessToken) {
          auth.setTokens(accessToken);
          return;
        }
      }
    } catch {
      // Backend unavailable, fall through to Keycloak
    }

    // Fallback: Keycloak ROPC grant
    const res = await fetch(
      `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'password',
          client_id: KEYCLOAK_CLIENT_ID,
          username,
          password,
          scope: 'openid profile email',
        }),
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error_description || 'Invalid username or password.');
    }
    const { access_token, refresh_token } = await res.json();
    auth.setTokens(access_token, refresh_token);
  },
  register: async (data: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Registration failed.');
    }
  },
};

export default apiClient;
