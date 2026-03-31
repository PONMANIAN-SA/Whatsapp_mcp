import { Request, Response, NextFunction } from 'express';
import config from '../config';
import logger from '../utils/logger';

/**
 * Checks for a valid API key in:
 *   • Header:  x-api-key: <key>
 *   • Query:   ?api_key=<key>
 *
 * Apply this middleware to any route that needs protection.
 */
export function requireApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const key =
    (req.headers['x-api-key'] as string | undefined) ||
    (req.query['api_key'] as string | undefined);

  if (!key) {
    logger.warn(`🔐  Unauthorized request — missing API key [${req.method} ${req.path}]`);
    res.status(401).json({
      success: false,
      error: 'Unauthorized — API key required (x-api-key header or ?api_key= query param)',
    });
    return;
  }

  if (key !== config.apiKey) {
    logger.warn(`🔐  Unauthorized request — invalid API key [${req.method} ${req.path}]`);
    res.status(403).json({
      success: false,
      error: 'Forbidden — Invalid API key',
    });
    return;
  }

  next();
}
