import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1',
  withCredentials: true,
});

// Generic request wrapper to handle typing
export const request = async <T>(
  method: 'get' | 'post' | 'put' | 'patch' | 'delete', 
  url: string, 
  data?: unknown, 
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> => {
  return api.request<T>({
    method,
    url,
    data,
    ...config,
  });
};

export default {
  get: <T>(url: string, config?: AxiosRequestConfig) => request<T>('get', url, undefined, config),
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => request<T>('post', url, data, config),
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => request<T>('put', url, data, config),
  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => request<T>('patch', url, data, config),
  delete: <T>(url: string, config?: AxiosRequestConfig) => request<T>('delete', url, undefined, config),
};
