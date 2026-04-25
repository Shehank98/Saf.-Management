import { Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { AuthRequest, errorResponse } from '../types';

export function requireRole(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json(errorResponse('Unauthorized'));
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json(errorResponse('Insufficient permissions'));
      return;
    }
    next();
  };
}
