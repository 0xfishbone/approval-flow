/**
 * Request Store
 * Manages request data and operations
 */

import { create } from 'zustand';
import { api } from '@/lib/api';
import type { Request, RequestItem } from '@/types';

interface RequestState {
  requests: Request[];
  currentRequest: Request | null;
  isLoading: boolean;

  // Actions
  fetchRequests: () => Promise<void>;
  fetchRequestById: (id: string) => Promise<void>;
  createRequest: (data: CreateRequestData) => Promise<Request>;
  updateRequest: (id: string, data: Partial<Request>) => Promise<void>;
  deleteRequest: (id: string) => Promise<void>;
  clearCurrentRequest: () => void;
}

interface CreateRequestData {
  departmentId: string;
  items: RequestItem[];
  notes?: string;
}

export const useRequestStore = create<RequestState>((set) => ({
  requests: [],
  currentRequest: null,
  isLoading: false,

  fetchRequests: async () => {
    set({ isLoading: true });
    try {
      const requests = await api.get<Request[]>('/requests');
      set({ requests, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchRequestById: async (id: string) => {
    set({ isLoading: true });
    try {
      const request = await api.get<Request>(`/requests/${id}`);
      set({ currentRequest: request, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createRequest: async (data: CreateRequestData) => {
    set({ isLoading: true });
    try {
      const request = await api.post<Request>('/requests', data);
      set((state) => ({
        requests: [request, ...state.requests],
        isLoading: false,
      }));
      return request;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateRequest: async (id: string, data: Partial<Request>) => {
    set({ isLoading: true });
    try {
      const updated = await api.put<Request>(`/requests/${id}`, data);
      set((state) => ({
        requests: state.requests.map((r) => (r.id === id ? updated : r)),
        currentRequest: state.currentRequest?.id === id ? updated : state.currentRequest,
        isLoading: false,
      }));
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  deleteRequest: async (id: string) => {
    set({ isLoading: true });
    try {
      await api.delete(`/requests/${id}`);
      set((state) => ({
        requests: state.requests.filter((r) => r.id !== id),
        currentRequest: state.currentRequest?.id === id ? null : state.currentRequest,
        isLoading: false,
      }));
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  clearCurrentRequest: () => {
    set({ currentRequest: null });
  },
}));
