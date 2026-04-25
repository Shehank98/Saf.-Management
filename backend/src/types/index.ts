import { Request } from 'express';
import { UserRole } from '@prisma/client';

export interface AuthPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, message };
}

export function errorResponse(error: string, message?: string): ApiResponse {
  return { success: false, error, message };
}
