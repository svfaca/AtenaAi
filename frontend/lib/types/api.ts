/**
 * Tipos comuns para respostas da API
 */

export interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  message: string;
  code: string;
  timestamp: string;
  path?: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  pages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: Pagination;
}
