/**
 * API Client
 * Centralized HTTP client with auth token management
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import type { ApiResponse } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;

        // If 401 and not already retrying, try to refresh token
        if (error.response?.status === 401 && originalRequest && !originalRequest.headers['X-Retry']) {
          const refreshToken = localStorage.getItem('refreshToken');

          if (refreshToken) {
            try {
              const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                refreshToken,
              });

              const { accessToken } = response.data.data;
              localStorage.setItem('accessToken', accessToken);

              // Retry original request with new token
              originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
              originalRequest.headers['X-Retry'] = 'true';
              return this.client(originalRequest);
            } catch (refreshError) {
              // Refresh failed, logout user
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              window.location.href = '/login';
              return Promise.reject(refreshError);
            }
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(url, { params });
    return response.data.data;
  }

  async post<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, data);
    return response.data.data;
  }

  async put<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.client.put<ApiResponse<T>>(url, data);
    return response.data.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<ApiResponse<T>>(url);
    return response.data.data;
  }

  async upload<T>(url: string, file: File, onProgress?: (progress: number) => void): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post<ApiResponse<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });

    return response.data.data;
  }

  // Workflow methods
  async getWorkflowStatus<T>(requestId: string): Promise<T> {
    return this.get<T>(`/workflows/${requestId}`);
  }

  async approveRequest<T>(
    requestId: string,
    data: {
      digitalSignature: string;
      additionalData?: {
        dailyCost?: number;
        notes?: string;
      };
      location?: string;
    }
  ): Promise<T> {
    return this.post<T>(`/workflows/${requestId}/approve`, data);
  }

  async rejectRequest<T>(
    requestId: string,
    data: {
      digitalSignature: string;
      rejectionReason: string;
      location?: string;
    }
  ): Promise<T> {
    return this.post<T>(`/workflows/${requestId}/reject`, data);
  }
}

export const api = new ApiClient();
