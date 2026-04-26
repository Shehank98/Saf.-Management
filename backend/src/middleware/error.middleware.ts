import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { errorResponse } from '../types';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  logger.error('Unhandled error:', { message: err.message, stack: err.stack, path: req.path });

  const status = (err as { status?: number }).status || 500;
  const message = (process.env.NODE_ENV === 'production' && status >= 500) ? 'Internal server error' : err.message;

  res.status(status).json(errorResponse(message));
}
