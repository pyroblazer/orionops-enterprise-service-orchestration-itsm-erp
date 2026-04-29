'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type FilterParams, type Incident, type Problem, type Change, type ServiceRequest, type KnowledgeArticle, type Notification, type AuditLog, type SearchResults } from './api';

// --- Query Key Factory ---

export const queryKeys = {
  incidents: {
    all: ['incidents'] as const,
    list: (params?: FilterParams) => ['incidents', 'list', params] as const,
    detail: (id: string) => ['incidents', 'detail', id] as const,
  },
  problems: {
    all: ['problems'] as const,
    list: (params?: FilterParams) => ['problems', 'list', params] as const,
    detail: (id: string) => ['problems', 'detail', id] as const,
  },
  changes: {
    all: ['changes'] as const,
    list: (params?: FilterParams) => ['changes', 'list', params] as const,
    detail: (id: string) => ['changes', 'detail', id] as const,
  },
  requests: {
    all: ['requests'] as const,
    list: (params?: FilterParams) => ['requests', 'list', params] as const,
    detail: (id: string) => ['requests', 'detail', id] as const,
  },
  knowledge: {
    all: ['knowledge'] as const,
    list: (params?: FilterParams) => ['knowledge', 'list', params] as const,
    detail: (id: string) => ['knowledge', 'detail', id] as const,
  },
  notifications: {
    all: ['notifications'] as const,
  },
  auditLogs: {
    all: ['auditLogs'] as const,
    list: (params?: FilterParams) => ['auditLogs', 'list', params] as const,
  },
  search: {
    query: (q: string) => ['search', q] as const,
  },
};

// --- Incident Hooks ---

export function useIncidents(params?: FilterParams) {
  return useQuery({
    queryKey: queryKeys.incidents.list(params),
    queryFn: async () => {
      const { data } = await api.getIncidents(params);
      return data;
    },
    staleTime: 30_000,
  });
}

export function useIncident(id: string) {
  return useQuery({
    queryKey: queryKeys.incidents.detail(id),
    queryFn: async () => {
      const { data } = await api.getIncident(id);
      return data.data;
    },
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useCreateIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Incident>) => {
      const response = await api.createIncident(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.incidents.all });
    },
  });
}

export function useUpdateIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Incident> }) => {
      const response = await api.updateIncident(id, data);
      return response.data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.incidents.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.incidents.detail(variables.id) });
    },
  });
}

// --- Problem Hooks ---

export function useProblems(params?: FilterParams) {
  return useQuery({
    queryKey: queryKeys.problems.list(params),
    queryFn: async () => {
      const { data } = await api.getProblems(params);
      return data;
    },
    staleTime: 30_000,
  });
}

export function useProblem(id: string) {
  return useQuery({
    queryKey: queryKeys.problems.detail(id),
    queryFn: async () => {
      const { data } = await api.getProblem(id);
      return data.data;
    },
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useCreateProblem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Problem>) => {
      const response = await api.createProblem(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.problems.all });
    },
  });
}

export function useUpdateProblem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Problem> }) => {
      const response = await api.updateProblem(id, data);
      return response.data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.problems.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.problems.detail(variables.id) });
    },
  });
}

// --- Change Hooks ---

export function useChanges(params?: FilterParams) {
  return useQuery({
    queryKey: queryKeys.changes.list(params),
    queryFn: async () => {
      const { data } = await api.getChanges(params);
      return data;
    },
    staleTime: 30_000,
  });
}

export function useChange(id: string) {
  return useQuery({
    queryKey: queryKeys.changes.detail(id),
    queryFn: async () => {
      const { data } = await api.getChange(id);
      return data.data;
    },
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useCreateChange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Change>) => {
      const response = await api.createChange(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.changes.all });
    },
  });
}

export function useUpdateChange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Change> }) => {
      const response = await api.updateChange(id, data);
      return response.data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.changes.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.changes.detail(variables.id) });
    },
  });
}

// --- Service Request Hooks ---

export function useRequests(params?: FilterParams) {
  return useQuery({
    queryKey: queryKeys.requests.list(params),
    queryFn: async () => {
      const { data } = await api.getRequests(params);
      return data;
    },
    staleTime: 30_000,
  });
}

export function useRequest(id: string) {
  return useQuery({
    queryKey: queryKeys.requests.detail(id),
    queryFn: async () => {
      const { data } = await api.getRequest(id);
      return data.data;
    },
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useCreateRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ServiceRequest>) => {
      const response = await api.createRequest(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.all });
    },
  });
}

// --- Knowledge Base Hooks ---

export function useKnowledgeArticles(params?: FilterParams) {
  return useQuery({
    queryKey: queryKeys.knowledge.list(params),
    queryFn: async () => {
      const { data } = await api.getKnowledgeArticles(params);
      return data;
    },
    staleTime: 60_000,
  });
}

export function useKnowledgeArticle(id: string) {
  return useQuery({
    queryKey: queryKeys.knowledge.detail(id),
    queryFn: async () => {
      const { data } = await api.getKnowledgeArticle(id);
      return data.data;
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}

// --- Notification Hooks ---

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: async () => {
      const { data } = await api.getNotifications();
      return data.data;
    },
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.markNotificationRead(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.markAllNotificationsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

// --- Audit Log Hooks ---

export function useAuditLogs(params?: FilterParams) {
  return useQuery({
    queryKey: queryKeys.auditLogs.list(params),
    queryFn: async () => {
      const { data } = await api.getAuditLogs(params);
      return data;
    },
    staleTime: 60_000,
  });
}

// --- Global Search Hook ---

export function useSearch(query: string) {
  return useQuery({
    queryKey: queryKeys.search.query(query),
    queryFn: async () => {
      const { data } = await api.search(query);
      return data.data as SearchResults;
    },
    enabled: query.length >= 2,
    staleTime: 10_000,
  });
}

// --- Theme Hook ---

export type Theme = 'light' | 'dark' | 'high-contrast';

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem('orionops_theme') as Theme | null;
  if (stored && ['light', 'dark', 'high-contrast'].includes(stored)) {
    return stored;
  }
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const prefersContrast = window.matchMedia('(prefers-contrast: more)').matches;
  if (prefersContrast) return 'high-contrast';
  if (prefersDark) return 'dark';
  return 'light';
}

export function useTheme() {
  // This is a simple client-side implementation.
  // In a full app, this would use React state + context.
  const getTheme = (): Theme => getStoredTheme();

  const setTheme = (theme: Theme): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('orionops_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleTheme = (): void => {
    const current = getStoredTheme();
    const themes: Theme[] = ['light', 'dark', 'high-contrast'];
    const currentIndex = themes.indexOf(current);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return { getTheme, setTheme, toggleTheme };
}
