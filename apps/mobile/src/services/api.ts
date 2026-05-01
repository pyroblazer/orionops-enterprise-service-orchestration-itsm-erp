import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { offlineQueue } from './offline';
import type { OfflineQueueClass } from './offline';

const API_BASE_URL = __DEV__
  ? 'http://10.0.2.2:3000/api/v1'
  : 'https://orionops.example.com/api/v1';

const ACCESS_TOKEN_KEY = 'orionops_access_token';
const REFRESH_TOKEN_KEY = 'orionops_refresh_token';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processFailedQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  failedQueue = [];
};

class ApiClient {
  private client: AxiosInstance;
  private offlineQueue: Pick<OfflineQueueClass, 'enqueue' | 'sync'>;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.offlineQueue = offlineQueue;
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor: attach JWT token
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        try {
          const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch {
          // Token retrieval failed, proceed without auth header
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor: handle 401 with refresh token
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            }).then((token) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return this.client(originalRequest);
            });
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            const newToken = await this.refreshAuthToken();
            processFailedQueue(null, newToken);
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return this.client(originalRequest);
          } catch (refreshError) {
            processFailedQueue(refreshError, null);
            await this.clearAuthTokens();
            throw refreshError;
          } finally {
            isRefreshing = false;
          }
        }

        // Queue request offline if network error
        if (!error.response && originalRequest.method?.toLowerCase() !== 'get') {
          const queued = await this.offlineQueue.enqueue({
            url: originalRequest.url || '',
            method: (originalRequest.method || 'POST').toUpperCase() as 'POST' | 'PUT' | 'PATCH' | 'DELETE',
            data: originalRequest.data,
            headers: originalRequest.headers as Record<string, string>,
          });
          if (queued) {
            return { data: { offline: true, queued: true }, status: 202 };
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshAuthToken(): Promise<string> {
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refreshToken,
    });

    const { accessToken, refreshToken: newRefreshToken } = response.data;
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    if (newRefreshToken) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, newRefreshToken);
    }

    return accessToken;
  }

  private async clearAuthTokens(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    } catch {
      // Ignore cleanup errors
    }
  }

  // Authentication
  async loginWithKeycloak(code: string, redirectUri: string) {
    const response = await this.client.post('/auth/callback', {
      code,
      redirectUri,
    });
    const { accessToken, refreshToken, user } = response.data;
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    return user;
  }

  async logout() {
    try {
      await this.client.post('/auth/logout');
    } finally {
      await this.clearAuthTokens();
    }
  }

  // Tickets / Incidents
  async getMyWork(params?: { page?: number; limit?: number; status?: string }) {
    const response = await this.client.get('/tickets/my-work', { params });
    return response.data;
  }

  async getTicket(id: string) {
    const response = await this.client.get(`/tickets/${id}`);
    return response.data;
  }

  async updateTicketStatus(id: string, status: string, comment?: string) {
    const response = await this.client.patch(`/tickets/${id}/status`, {
      status,
      comment,
    });
    return response.data;
  }

  async addComment(ticketId: string, content: string, isInternal: boolean = false) {
    const response = await this.client.post(`/tickets/${ticketId}/comments`, {
      content,
      isInternal,
    });
    return response.data;
  }

  async escalateTicket(id: string, reason: string, targetTeam?: string) {
    const response = await this.client.post(`/tickets/${id}/escalate`, {
      reason,
      targetTeam,
    });
    return response.data;
  }

  async uploadAttachment(ticketId: string, formData: FormData) {
    const response = await this.client.post(
      `/tickets/${ticketId}/attachments`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  }

  // Approvals
  async getPendingApprovals(params?: { page?: number; limit?: number }) {
    const response = await this.client.get('/approvals/pending', { params });
    return response.data;
  }

  async approveRequest(id: string, comment?: string) {
    const response = await this.client.post(`/approvals/${id}/approve`, { comment });
    return response.data;
  }

  async rejectRequest(id: string, reason: string) {
    const response = await this.client.post(`/approvals/${id}/reject`, { reason });
    return response.data;
  }

  // Notifications
  async getNotifications(params?: { page?: number; limit?: number }) {
    const response = await this.client.get('/notifications', { params });
    return response.data;
  }

  async markNotificationRead(id: string) {
    const response = await this.client.patch(`/notifications/${id}/read`);
    return response.data;
  }

  async markAllNotificationsRead() {
    const response = await this.client.patch('/notifications/read-all');
    return response.data;
  }

  // Search
  async search(query: string, filters?: Record<string, string>) {
    const response = await this.client.get('/search', {
      params: { q: query, ...filters },
    });
    return response.data;
  }

  // Dashboard
  async getDashboardMetrics() {
    const response = await this.client.get('/dashboard/metrics');
    return response.data;
  }

  // User profile
  async getProfile() {
    const response = await this.client.get('/users/me');
    return response.data;
  }

  async updateNotificationPreferences(preferences: Record<string, boolean>) {
    const response = await this.client.patch('/users/me/notification-preferences', preferences);
    return response.data;
  }

  // Sync offline queue
  async syncOfflineQueue() {
    await this.offlineQueue.sync(this.client);
  }

  // Get raw instance for edge cases
  getInstance(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
