import { Request, Response } from 'express';
import * as authService from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto/register.dto';
import { successResponse, errorResponse } from '../../types';

export async function register(req: Request, res: Response): Promise<void> {
  const parsed = RegisterDto.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json(errorResponse('Validation failed', parsed.error.message));
    return;
  }
  const result = await authService.register(parsed.data);
  res.status(201).json(successResponse(result, 'Registration successful'));
}

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = LoginDto.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json(errorResponse('Validation failed'));
    return;
  }
  const result = await authService.login(parsed.data);
  res.json(successResponse(result, 'Login successful'));
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const parsed = RefreshTokenDto.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json(errorResponse('Refresh token required'));
    return;
  }
  const result = await authService.refreshAccessToken(parsed.data.refreshToken);
  res.json(successResponse(result));
}

export async function logout(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body;
  if (refreshToken) await authService.logout(refreshToken);
  res.json(successResponse(null, 'Logged out successfully'));
}
