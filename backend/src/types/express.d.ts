import { JWTPayload } from '@/shared/types';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      id?: string;
    }
  }
}

export interface AuthenticatedRequest extends Express.Request {
  user: JWTPayload;
  body: any;
  query: any;
  params: any;
}

export {};
