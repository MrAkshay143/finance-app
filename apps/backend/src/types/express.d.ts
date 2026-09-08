import { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  role: UserRole | string;
  email?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      id?: string;
    }
  }
}
