// Express Request interface extensions
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      timestamp?: number;
      requestId?: string;
    }
  }
}