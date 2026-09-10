import { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  role: UserRole | string;
  email?: string;
  sessionId?: string; // RefreshToken.id embedded in JWT — present only for tokens issued after B3 fix
}


declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      id?: string;
    }
  }
}
