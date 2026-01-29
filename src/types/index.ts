export interface User {
  id: number;
  email: string;
  role: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthenticatedRequest extends Express.Request {
  user: User;
}

export interface SessionData {
  id: number;
  email: string;
  role: string;
  name?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
