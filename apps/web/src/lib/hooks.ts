'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { api, type FilterParams, type Incident, type Problem, type Change, type ServiceRequest, type SearchResults, type SLADefinition, type CMDBConfigItem, type Vendor, type Employee, type Budget, type PurchaseRequest, type InventoryItem } from './api';

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
  sla: {
    all: ['sla'] as const,
    definitions: {
      all: ['sla', 'definitions'] as const,
      list: (params?: FilterParams) => ['sla', 'definitions', 'list', params] as const,
      detail: (id: string) => ['sla', 'definitions', 'detail', id] as const,
    },
    instances: {
      all: ['sla', 'instances'] as const,
      list: (params?: FilterParams) => ['sla', 'instances', 'list', params] as const,
      detail: (id: string) => ['sla', 'instances', 'detail', id] as const,
    },
  },
  cmdb: {
    all: ['cmdb'] as const,
    items: {
      all: ['cmdb', 'items'] as const,
      list: (params?: FilterParams) => ['cmdb', 'items', 'list', params] as const,
      detail: (id: string) => ['cmdb', 'items', 'detail', id] as const,
    },
    services: {
      all: ['cmdb', 'services'] as const,
    },
    impactAnalysis: (id: string) => ['cmdb', 'impactAnalysis', id] as const,
  },
  vendors: {
    all: ['vendors'] as const,
    list: (params?: FilterParams) => ['vendors', 'list', params] as const,
    detail: (id: string) => ['vendors', 'detail', id] as const,
    performance: (id: string) => ['vendors', 'performance', id] as const,
  },
  workforce: {
    employees: {
      all: ['workforce', 'employees'] as const,
      list: (params?: FilterParams) => ['workforce', 'employees', 'list', params] as const,
      detail: (id: string) => ['workforce', 'employees', 'detail', id] as const,
    },
    skills: {
      all: ['workforce', 'skills'] as const,
    },
    capacityPlans: {
      all: ['workforce', 'capacityPlans'] as const,
      list: (params?: FilterParams) => ['workforce', 'capacityPlans', 'list', params] as const,
    },
  },
  billing: {
    usage: {
      all: ['billing', 'usage'] as const,
      list: (params?: FilterParams) => ['billing', 'usage', 'list', params] as const,
    },
    records: {
      all: ['billing', 'records'] as const,
      list: (params?: FilterParams) => ['billing', 'records', 'list', params] as const,
    },
    models: {
      all: ['billing', 'models'] as const,
    },
  },
  finance: {
    budgets: {
      all: ['finance', 'budgets'] as const,
      list: (params?: FilterParams) => ['finance', 'budgets', 'list', params] as const,
      detail: (id: string) => ['finance', 'budgets', 'detail', id] as const,
    },
    costCenters: {
      all: ['finance', 'costCenters'] as const,
      list: (params?: FilterParams) => ['finance', 'costCenters', 'list', params] as const,
      detail: (id: string) => ['finance', 'costCenters', 'detail', id] as const,
    },
    expenses: {
      all: ['finance', 'expenses'] as const,
      list: (params?: FilterParams) => ['finance', 'expenses', 'list', params] as const,
    },
    invoices: {
      all: ['finance', 'invoices'] as const,
      list: (params?: FilterParams) => ['finance', 'invoices', 'list', params] as const,
    },
    payments: {
      all: ['finance', 'payments'] as const,
      list: (params?: FilterParams) => ['finance', 'payments', 'list', params] as const,
    },
  },
  procurement: {
    purchaseRequests: {
      all: ['procurement', 'purchaseRequests'] as const,
      list: (params?: FilterParams) => ['procurement', 'purchaseRequests', 'list', params] as const,
      detail: (id: string) => ['procurement', 'purchaseRequests', 'detail', id] as const,
    },
    purchaseOrders: {
      all: ['procurement', 'purchaseOrders'] as const,
      list: (params?: FilterParams) => ['procurement', 'purchaseOrders', 'list', params] as const,
      detail: (id: string) => ['procurement', 'purchaseOrders', 'detail', id] as const,
    },
    contracts: {
      all: ['procurement', 'contracts'] as const,
      list: (params?: FilterParams) => ['procurement', 'contracts', 'list', params] as const,
      detail: (id: string) => ['procurement', 'contracts', 'detail', id] as const,
    },
  },
  inventory: {
    items: {
      all: ['inventory', 'items'] as const,
      list: (params?: FilterParams) => ['inventory', 'items', 'list', params] as const,
      detail: (id: string) => ['inventory', 'items', 'detail', id] as const,
    },
    assets: {
      all: ['inventory', 'assets'] as const,
      list: (params?: FilterParams) => ['inventory', 'assets', 'list', params] as const,
      detail: (id: string) => ['inventory', 'assets', 'detail', id] as const,
    },
    warehouses: {
      all: ['inventory', 'warehouses'] as const,
    },
    movements: {
      all: ['inventory', 'movements'] as const,
      list: (params?: FilterParams) => ['inventory', 'movements', 'list', params] as const,
    },
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

// --- SLA Hooks ---

export function useSLADefinitions() {
  return useQuery({
    queryKey: queryKeys.sla.definitions.list(),
    queryFn: async () => {
      const { data } = await api.getSLADefinitions();
      return data;
    },
    staleTime: 60_000,
  });
}

export function useSLAInstances(params?: FilterParams) {
  return useQuery({
    queryKey: queryKeys.sla.instances.list(params),
    queryFn: async () => {
      const { data } = await api.getSLAInstances(params);
      return data;
    },
    staleTime: 30_000,
  });
}

export function useCreateSLADefinition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<SLADefinition>) => {
      const response = await api.createSLADefinition(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sla.definitions.all });
    },
  });
}

export function useUpdateSLADefinition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SLADefinition> }) => {
      const response = await api.updateSLADefinition(id, data);
      return response.data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sla.definitions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.sla.definitions.detail(variables.id) });
    },
  });
}

// --- CMDB Hooks ---

export function useCMDBItems(params?: FilterParams) {
  return useQuery({
    queryKey: queryKeys.cmdb.items.list(params),
    queryFn: async () => {
      const { data } = await api.getCMDBItems(params);
      return data;
    },
    staleTime: 30_000,
  });
}

export function useCMDBItem(id: string) {
  return useQuery({
    queryKey: queryKeys.cmdb.items.detail(id),
    queryFn: async () => {
      const { data } = await api.getCMDBItem(id);
      return data.data;
    },
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useCreateCMDBItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<CMDBConfigItem>) => {
      const response = await api.createCMDBItem(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cmdb.items.all });
    },
  });
}

export function useUpdateCMDBItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CMDBConfigItem> }) => {
      const response = await api.updateCMDBItem(id, data);
      return response.data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cmdb.items.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.cmdb.items.detail(variables.id) });
    },
  });
}

export function useCMDBImpactAnalysis(id: string) {
  return useQuery({
    queryKey: queryKeys.cmdb.impactAnalysis(id),
    queryFn: async () => {
      const { data } = await api.getCMDBImpactAnalysis(id);
      return data.data;
    },
    enabled: !!id,
    staleTime: 60_000,
  });
}

// --- Vendor Hooks ---

export function useVendors(params?: FilterParams) {
  return useQuery({
    queryKey: queryKeys.vendors.list(params),
    queryFn: async () => {
      const { data } = await api.getVendors(params);
      return data;
    },
    staleTime: 30_000,
  });
}

export function useVendor(id: string) {
  return useQuery({
    queryKey: queryKeys.vendors.detail(id),
    queryFn: async () => {
      const { data } = await api.getVendor(id);
      return data.data;
    },
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useCreateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Vendor>) => {
      const response = await api.createVendor(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.all });
    },
  });
}

export function useUpdateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Vendor> }) => {
      const response = await api.updateVendor(id, data);
      return response.data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.detail(variables.id) });
    },
  });
}

export function useVendorPerformance(id: string) {
  return useQuery({
    queryKey: queryKeys.vendors.performance(id),
    queryFn: async () => {
      const { data } = await api.getVendorPerformance(id);
      return data.data;
    },
    enabled: !!id,
    staleTime: 60_000,
  });
}

// --- Workforce Hooks ---

export function useEmployees(params?: FilterParams) {
  return useQuery({
    queryKey: queryKeys.workforce.employees.list(params),
    queryFn: async () => {
      const { data } = await api.getEmployees(params);
      return data;
    },
    staleTime: 30_000,
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: queryKeys.workforce.employees.detail(id),
    queryFn: async () => {
      const { data } = await api.getEmployee(id);
      return data.data;
    },
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Employee>) => {
      const response = await api.createEmployee(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workforce.employees.all });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Employee> }) => {
      const response = await api.updateEmployee(id, data);
      return response.data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workforce.employees.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.workforce.employees.detail(variables.id) });
    },
  });
}

export function useSkills() {
  return useQuery({
    queryKey: queryKeys.workforce.skills.all,
    queryFn: async () => {
      const { data } = await api.getSkills();
      return data.data;
    },
    staleTime: 60_000,
  });
}

export function useCapacityOverview() {
  return useQuery({
    queryKey: queryKeys.workforce.capacityPlans.all,
    queryFn: async () => {
      const { data } = await api.getCapacityOverview();
      return data.data;
    },
    staleTime: 60_000,
  });
}

// --- Billing Hooks ---

export function useBillingUsage(params?: FilterParams) {
  return useQuery({
    queryKey: queryKeys.billing.usage.list(params),
    queryFn: async () => {
      const { data } = await api.getBillingUsage(params);
      return data;
    },
    staleTime: 30_000,
  });
}

export function useBillingRecords(params?: FilterParams) {
  return useQuery({
    queryKey: queryKeys.billing.records.list(params),
    queryFn: async () => {
      const { data } = await api.getBillingRecords(params);
      return data;
    },
    staleTime: 60_000,
  });
}

export function useCostModels() {
  return useQuery({
    queryKey: queryKeys.billing.models.all,
    queryFn: async () => {
      const { data } = await api.getCostModels();
      return data.data;
    },
    staleTime: 120_000,
  });
}

// --- Finance Hooks ---

export function useBudgets(params?: FilterParams) {
  return useQuery({
    queryKey: queryKeys.finance.budgets.list(params),
    queryFn: async () => {
      const { data } = await api.getBudgets(params);
      return data;
    },
    staleTime: 30_000,
  });
}

export function useBudget(id: string) {
  return useQuery({
    queryKey: queryKeys.finance.budgets.detail(id),
    queryFn: async () => {
      const { data } = await api.getBudget(id);
      return data.data;
    },
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Budget>) => {
      const response = await api.createBudget(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.budgets.all });
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Budget> }) => {
      const response = await api.updateBudget(id, data);
      return response.data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.budgets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.budgets.detail(variables.id) });
    },
  });
}

export function useCostCenters(params?: FilterParams) {
  return useQuery({
    queryKey: queryKeys.finance.costCenters.list(params),
    queryFn: async () => {
      const { data } = await api.getCostCenters(params);
      return data;
    },
    staleTime: 30_000,
  });
}

export function useCostCenterDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.finance.costCenters.detail(id),
    queryFn: async () => {
      const { data } = await api.getCostCenters({ id });
      return data.data?.[0] || null;
    },
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useExpenses(params?: FilterParams) {
  return useQuery({
    queryKey: queryKeys.finance.expenses.list(params),
    queryFn: async () => {
      const { data } = await api.getExpenses(params);
      return data;
    },
    staleTime: 30_000,
  });
}

export function useInvoices(params?: FilterParams) {
  return useQuery({
    queryKey: queryKeys.finance.invoices.list(params),
    queryFn: async () => {
      const { data } = await api.getInvoices(params);
      return data;
    },
    staleTime: 30_000,
  });
}

export function usePayments(params?: FilterParams) {
  return useQuery({
    queryKey: queryKeys.finance.payments.list(params),
    queryFn: async () => {
      const { data } = await api.getPayments(params);
      return data;
    },
    staleTime: 30_000,
  });
}

// --- Procurement Hooks ---

export function usePurchaseRequests(params?: FilterParams) {
  return useQuery({
    queryKey: queryKeys.procurement.purchaseRequests.list(params),
    queryFn: async () => {
      const { data } = await api.getPurchaseRequests(params);
      return data;
    },
    staleTime: 30_000,
  });
}

export function usePurchaseRequest(id: string) {
  return useQuery({
    queryKey: queryKeys.procurement.purchaseRequests.detail(id),
    queryFn: async () => {
      const { data } = await api.getPurchaseRequest(id);
      return data.data;
    },
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useCreatePurchaseRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<PurchaseRequest>) => {
      const response = await api.createPurchaseRequest(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.procurement.purchaseRequests.all });
    },
  });
}

export function usePurchaseOrders(params?: FilterParams) {
  return useQuery({
    queryKey: queryKeys.procurement.purchaseOrders.list(params),
    queryFn: async () => {
      const { data } = await api.getPurchaseOrders(params);
      return data;
    },
    staleTime: 30_000,
  });
}

export function usePurchaseOrder(id: string) {
  return useQuery({
    queryKey: queryKeys.procurement.purchaseOrders.detail(id),
    queryFn: async () => {
      const { data } = await api.getPurchaseOrder(id);
      return data.data;
    },
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useContracts(params?: FilterParams) {
  return useQuery({
    queryKey: queryKeys.procurement.contracts.list(params),
    queryFn: async () => {
      const { data } = await api.getContracts(params);
      return data;
    },
    staleTime: 30_000,
  });
}

// --- Inventory Hooks ---

export function useInventoryItems(params?: FilterParams) {
  return useQuery({
    queryKey: queryKeys.inventory.items.list(params),
    queryFn: async () => {
      const { data } = await api.getInventoryItems(params);
      return data;
    },
    staleTime: 30_000,
  });
}

export function useInventoryItem(id: string) {
  return useQuery({
    queryKey: queryKeys.inventory.items.detail(id),
    queryFn: async () => {
      const { data } = await api.getInventoryItem(id);
      return data.data;
    },
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<InventoryItem>) => {
      const response = await api.createInventoryItem(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.items.all });
    },
  });
}

export function useAssets(params?: FilterParams) {
  return useQuery({
    queryKey: queryKeys.inventory.assets.list(params),
    queryFn: async () => {
      const { data } = await api.getAssets(params);
      return data;
    },
    staleTime: 30_000,
  });
}

export function useAsset(id: string) {
  return useQuery({
    queryKey: queryKeys.inventory.assets.detail(id),
    queryFn: async () => {
      const { data } = await api.getAsset(id);
      return data.data;
    },
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useWarehouses() {
  return useQuery({
    queryKey: queryKeys.inventory.warehouses.all,
    queryFn: async () => {
      const { data } = await api.getWarehouses();
      return data.data;
    },
    staleTime: 60_000,
  });
}

export function useStockMovements(period: string = '30d') {
  return useQuery({
    queryKey: queryKeys.inventory.movements.list({ period }),
    queryFn: async () => {
      const { data } = await api.getStockMovements(period);
      return data;
    },
    staleTime: 30_000,
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
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);

  const setTheme = useCallback((t: Theme): void => {
    if (typeof window === 'undefined') return;
    setThemeState(t);
    localStorage.setItem('orionops_theme', t);
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.classList.toggle('dark', t === 'dark');
  }, []);

  const toggleTheme = useCallback((): void => {
    const themes: Theme[] = ['light', 'dark', 'high-contrast'];
    const nextIndex = (themes.indexOf(theme) + 1) % themes.length;
    setTheme(themes[nextIndex]);
  }, [theme, setTheme]);

  return { theme, getTheme: () => theme, setTheme, toggleTheme };
}
