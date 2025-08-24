import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import { ApiResponse, ApiError } from '../types/api';

// Create axios instance
// Force use port 5000 regardless of any cached values
const apiBaseURL = 'http://localhost:5000/api';
console.log('🔧 API Base URL (forced to port 5000):', apiBaseURL);

const api: AxiosInstance = axios.create({
  baseURL: apiBaseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config: any) => {
    // Add auth token to requests
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request timestamp
    config.metadata = { startTime: new Date() };

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Calculate request duration
    const endTime = new Date();
    const config = response.config as any;
    const duration = config.metadata ? endTime.getTime() - config.metadata.startTime.getTime() : 0;
    
    // Log successful requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`);
    }

    return response;
  },
  (error: AxiosError) => {
    // Handle different types of errors
    const customError: ApiError = {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred',
      statusCode: 500,
      timestamp: new Date().toISOString(),
    };

    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      const errorData = data as any;
      customError.statusCode = status;
      customError.message = errorData?.message || `HTTP Error ${status}`;
      customError.code = errorData?.code || `HTTP_${status}`;
      customError.details = errorData?.details;
      customError.path = error.config?.url;

      // Handle specific error cases
      switch (status) {
        case 401:
          // Unauthorized - redirect to login
          localStorage.removeItem('token');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          break;
        case 403:
          customError.message = 'You do not have permission to perform this action';
          break;
        case 404:
          customError.message = 'The requested resource was not found';
          break;
        case 422:
          customError.message = 'Validation failed';
          break;
        case 429:
          customError.message = 'Too many requests. Please try again later';
          break;
        case 500:
          customError.message = 'Internal server error. Please try again later';
          break;
      }
    } else if (error.request) {
      // Network error
      customError.code = 'NETWORK_ERROR';
      customError.message = 'Network error. Please check your connection';
      customError.statusCode = 0;
    } else {
      // Request setup error
      customError.code = 'REQUEST_ERROR';
      customError.message = error.message || 'Failed to send request';
    }

    // Log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, {
        error: customError,
        fullError: error,
        config: error.config,
        response: error.response?.data
      });
    }

    return Promise.reject(customError);
  }
);

// API helper functions
export const apiRequest = {
  get: async <T>(url: string, params?: any): Promise<T> => {
    const response = await api.get(url, { params });
    // Handle both wrapped and unwrapped responses
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data as T;
    }
    return response.data as T;
  },

  post: async <T>(url: string, data?: any): Promise<T> => {
    const response = await api.post(url, data);
    // Handle both wrapped and unwrapped responses
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data as T;
    }
    return response.data as T;
  },

  put: async <T>(url: string, data?: any): Promise<T> => {
    const response = await api.put<ApiResponse<T>>(url, data);
    return response.data.data!;
  },

  patch: async <T>(url: string, data?: any): Promise<T> => {
    const response = await api.patch<ApiResponse<T>>(url, data);
    return response.data.data!;
  },

  delete: async <T>(url: string): Promise<T> => {
    const response = await api.delete<ApiResponse<T>>(url);
    return response.data.data!;
  },

  upload: async <T>(url: string, formData: FormData, onProgress?: (progress: number) => void): Promise<T> => {
    const response = await api.post<ApiResponse<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data.data!;
  },
};

// Utility functions
export const createApiUrl = (endpoint: string, params?: Record<string, any>): string => {
  const url = new URL(endpoint, api.defaults.baseURL);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }
  
  return url.toString();
};

export const downloadFile = async (url: string, filename?: string): Promise<void> => {
  try {
    const response = await api.get(url, {
      responseType: 'blob',
    });

    // Create blob URL
    const blob = new Blob([response.data]);
    const blobUrl = window.URL.createObjectURL(blob);

    // Create download link
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    throw new Error('Failed to download file');
  }
};

export const healthCheck = async (): Promise<boolean> => {
  try {
    await api.get('/health');
    return true;
  } catch {
    return false;
  }
};

// Types for extending axios config
declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: {
      startTime: Date;
    };
  }
}

export default api;