import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

// --- Types ---

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
  reportedBy: string;
  reportedByName: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
  dueDate?: string;
  slaId?: string;
  tags: string[];
}

export type IncidentStatus =
  | 'new'
  | 'in_progress'
  | 'pending'
  | 'resolved'
  | 'closed'
  | 'cancelled';

export type Priority = 'critical' | 'high' | 'medium' | 'low';

export interface Problem {
  id: string;
  title: string;
  description: string;
  status: ProblemStatus;
  priority: Priority;
  rootCause?: string;
  workaround?: string;
  assignedTo?: string;
  assignedToName?: string;
  linkedIncidents: string[];
  createdAt: string;
  updatedAt: string;
}

export type ProblemStatus =
  | 'open'
  | 'under_investigation'
  | 'known_error'
  | 'resolved'
  | 'closed';

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
  approvalStatus: ApprovalStatus;
  plannedStart: string;
  plannedEnd: string;
  implementationPlan?: string;
  rollbackPlan?: string;
  createdAt: string;
  updatedAt: string;
}

export type ChangeStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'scheduled'
  | 'implementing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'rollback';

export type ChangeType = 'standard' | 'normal' | 'emergency';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type ImpactLevel = 'low' | 'medium' | 'high';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'not_required';

export interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  status: RequestStatus;
  category: string;
  requestedBy: string;
  requestedByName: string;
  assignedTo?: string;
  assignedToName?: string;
  fulfillmentTasks: FulfillmentTask[];
  createdAt: string;
  updatedAt: string;
}

export type RequestStatus =
  | 'draft'
  | 'submitted'
  | 'in_fulfillment'
  | 'completed'
  | 'cancelled'
  | 'rejected';

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
  content: string;
  category: string;
  tags: string[];
  author: string;
  authorName: string;
  status: 'draft' | 'published' | 'archived';
  views: number;
  helpfulYes: number;
  helpfulNo: number;
  createdAt: string;
  updatedAt: string;
}

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
  resource: string;
  resourceId: string;
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
}

export interface SearchResults {
  incidents: Incident[];
  problems: Problem[];
  changes: Change[];
  requests: ServiceRequest[];
  knowledgeArticles: KnowledgeArticle[];
  totalResults: number;
}

export interface CMDBItem {
  id: string;
  name: string;
  type: string;
  status: string;
  environment: string;
  owner?: string;
  relations: CMDBRelation[];
}

export interface CMDBRelation {
  targetId: string;
  targetName: string;
  type: string;
}

export interface SLADefinition {
  id: string;
  name: string;
  description: string;
  priority: Priority;
  responseTime: number;
  resolutionTime: number;
  businessHoursOnly: boolean;
}

export interface SLAInstance {
  id: string;
  slaDefinitionId: string;
  slaName: string;
  targetType: string;
  targetId: string;
  status: 'active' | 'paused' | 'met' | 'breached';
  responseDeadline: string;
  resolutionDeadline: string;
  respondedAt?: string;
  resolvedAt?: string;
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
}

// --- API Client ---

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
const KEYCLOAK_URL = process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080/auth';

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
  if (refreshToken) {
    localStorage.setItem('orionops_refresh_token', refreshToken);
  }
}

function clearTokens(): void {
  localStorage.removeItem('orionops_access_token');
  localStorage.removeItem('orionops_refresh_token');
}

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor: handle 401, refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${KEYCLOAK_URL}/realms/orionops/protocol/openid-connect/token`, {
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: 'orionops-web',
        }, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        const { access_token, refresh_token: newRefreshToken } = response.data;
        setTokens(access_token, newRefreshToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }

        return apiClient(originalRequest);
      } catch {
        clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
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

// --- API Functions ---

export const api = {
  // Incidents
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

  // Problems
  getProblems: (params?: FilterParams) =>
    apiClient.get<PaginatedResponse<Problem>>('/problems', { params }),
  getProblem: (id: string) =>
    apiClient.get<ApiResponse<Problem>>(`/problems/${id}`),
  createProblem: (data: Partial<Problem>) =>
    apiClient.post<ApiResponse<Problem>>('/problems', data),
  updateProblem: (id: string, data: Partial<Problem>) =>
    apiClient.patch<ApiResponse<Problem>>(`/problems/${id}`, data),

  // Changes
  getChanges: (params?: FilterParams) =>
    apiClient.get<PaginatedResponse<Change>>('/changes', { params }),
  getChange: (id: string) =>
    apiClient.get<ApiResponse<Change>>(`/changes/${id}`),
  createChange: (data: Partial<Change>) =>
    apiClient.post<ApiResponse<Change>>('/changes', data),
  updateChange: (id: string, data: Partial<Change>) =>
    apiClient.patch<ApiResponse<Change>>(`/changes/${id}`, data),

  // Service Requests
  getRequests: (params?: FilterParams) =>
    apiClient.get<PaginatedResponse<ServiceRequest>>('/requests', { params }),
  getRequest: (id: string) =>
    apiClient.get<ApiResponse<ServiceRequest>>(`/requests/${id}`),
  createRequest: (data: Partial<ServiceRequest>) =>
    apiClient.post<ApiResponse<ServiceRequest>>('/requests', data),

  // Knowledge Base
  getKnowledgeArticles: (params?: FilterParams) =>
    apiClient.get<PaginatedResponse<KnowledgeArticle>>('/knowledge', { params }),
  getKnowledgeArticle: (id: string) =>
    apiClient.get<ApiResponse<KnowledgeArticle>>(`/knowledge/${id}`),
  createKnowledgeArticle: (data: Partial<KnowledgeArticle>) =>
    apiClient.post<ApiResponse<KnowledgeArticle>>('/knowledge', data),
  updateKnowledgeArticle: (id: string, data: Partial<KnowledgeArticle>) =>
    apiClient.patch<ApiResponse<KnowledgeArticle>>(`/knowledge/${id}`, data),

  // Notifications
  getNotifications: () =>
    apiClient.get<ApiResponse<Notification[]>>('/notifications'),
  markNotificationRead: (id: string) =>
    apiClient.patch(`/notifications/${id}/read`),
  markAllNotificationsRead: () =>
    apiClient.patch('/notifications/read-all'),

  // Audit Logs
  getAuditLogs: (params?: FilterParams) =>
    apiClient.get<PaginatedResponse<AuditLog>>('/audit-logs', { params }),

  // Search
  search: (query: string) =>
    apiClient.get<ApiResponse<SearchResults>>('/search', { params: { q: query } }),

  // CMDB
  getCMDBItems: (params?: FilterParams) =>
    apiClient.get<PaginatedResponse<CMDBItem>>('/cmdb', { params }),
  getCMDBItem: (id: string) =>
    apiClient.get<ApiResponse<CMDBItem>>(`/cmdb/${id}`),

  // SLA
  getSLADefinitions: () =>
    apiClient.get<ApiResponse<SLADefinition[]>>('/sla/definitions'),
  getSLAInstances: (params?: FilterParams) =>
    apiClient.get<PaginatedResponse<SLAInstance>>('/sla/instances', { params }),

  // Users
  getCurrentUser: () =>
    apiClient.get<ApiResponse<User>>('/users/me'),
  getUsers: (params?: FilterParams) =>
    apiClient.get<PaginatedResponse<User>>('/users', { params }),
};

// --- Auth helpers ---

export const auth = {
  setTokens,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  isAuthenticated: (): boolean => !!getAccessToken(),
  getLoginUrl: (): string => {
    const redirectUri = typeof window !== 'undefined'
      ? `${window.location.origin}/login/callback`
      : '';
    return `${KEYCLOAK_URL}/realms/orionops/protocol/openid-connect/auth?client_id=orionops-web&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid profile email`;
  },
  getLogoutUrl: (): string => {
    const redirectUri = typeof window !== 'undefined'
      ? `${window.location.origin}/login`
      : '';
    return `${KEYCLOAK_URL}/realms/orionops/protocol/openid-connect/logout?client_id=orionops-web&post_logout_redirect_uri=${encodeURIComponent(redirectUri)}`;
  },
};

export default apiClient;
