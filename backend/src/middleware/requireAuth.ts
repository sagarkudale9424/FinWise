import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

declare global {
  namespace Express { interface Request { userId?: string } }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.finwise_token;
  if (!token) return res.status(401).json({ error: 'Authentication required.' });
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(503).json({ error: 'Authentication is not configured.' });
    const payload = jwt.verify(token, secret, { issuer: 'finwise-api' }) as jwt.JwtPayload;
    if (typeof payload.sub !== 'string') return res.status(401).json({ error: 'Invalid session.' });
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }
}
