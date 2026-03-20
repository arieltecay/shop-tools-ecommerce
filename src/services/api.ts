import axios, { AxiosResponse } from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1',
  withCredentials: true,
});

// Generic request wrapper to handle typing
export const request = async <T>(method: 'get' | 'post' | 'put' | 'patch' | 'delete', url: string, data?: any, config?: any): Promise<AxiosResponse<T>> => {
  return api.request<T>({
    method,
    url,
    data,
    ...config,
  });
};

export default {
  get: <T>(url: string, config?: any) => request<T>('get', url, undefined, config),
  post: <T>(url: string, data?: any, config?: any) => request<T>('post', url, data, config),
  put: <T>(url: string, data?: any, config?: any) => request<T>('put', url, data, config),
  patch: <T>(url: string, data?: any, config?: any) => request<T>('patch', url, data, config),
  delete: <T>(url: string, config?: any) => request<T>('delete', url, undefined, config),
};
