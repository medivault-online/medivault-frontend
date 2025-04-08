import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import { ApiError, ApiResponse } from './types';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:3001/api';

class Api {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Include cookies if needed
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // No getToken here – should be added per-request instead
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        if (error.response?.status === 401) {
          window.location.href = '/sign-in';
        }
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: AxiosError<ApiError>): ApiError {
    if (error.response && error.response.data) {
      return error.response.data;
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      details: error.stack,
    };
  }

  // Accept token per request instead of via hook
  async get<T>(url: string, config?: AxiosRequestConfig, token?: string): Promise<T> {
    const response = await this.client.get<T>(url, {
      ...config,
      headers: {
        ...config?.headers,
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig, token?: string): Promise<T> {
    const response = await this.client.post<T>(url, data, {
      ...config,
      headers: {
        ...config?.headers,
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig, token?: string): Promise<T> {
    const response = await this.client.put<T>(url, data, {
      ...config,
      headers: {
        ...config?.headers,
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig, token?: string): Promise<T> {
    const response = await this.client.patch<T>(url, data, {
      ...config,
      headers: {
        ...config?.headers,
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig, token?: string): Promise<T> {
    const response = await this.client.delete<T>(url, {
      ...config,
      headers: {
        ...config?.headers,
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return response.data;
  }

  async upload<T>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void,
    token?: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post<T>(url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        ...(token && { Authorization: `Bearer ${token}` }),
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      },
    });

    return response.data;
  }

  async download(
    url: string,
    filename: string,
    onProgress?: (progress: number) => void,
    token?: string,
    config?: AxiosRequestConfig
  ): Promise<void> {
    const response = await this.client.get(url, {
      ...config,
      responseType: 'blob',
      headers: {
        ...config?.headers,
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      onDownloadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      },
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  }
}

export const api = new Api();
