import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import {
  hashPassword,
  comparePassword,
  signAccessToken,
  generateRefreshTokenString,
  hashRefreshToken,
} from '../lib/jwt.js';
import { addToDenylist } from '../lib/tokenDenylist.js';
import { logAuditEvent } from './auditService.js';
import {
  UnauthorizedError,
  ConflictError,
  NotFoundError,
  AccountLockedError,
  ValidationError,
} from '../utils/errors.js';
import { validateAndNormalizePhone } from '@finance/shared-types';
import jwt from 'jsonwebtoken';

export interface SignupData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  mobileNumber?: string;
}

export interface ClientMetadata {
  userAgent?: string;
  ipAddress?: string;
}

export interface AuthResult {
  user: {
    id: string;
    email: string;
    fullName: string;
    firstName: string;
    lastName: string;
    mobileNumber: string;
    role: string;
    status: string;
    onboardingCompleted: boolean;
    lastLoginAt: Date | null;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export class AuthService {
  /**
   * Registers a new user with default settings and issues an auth token pair.
   */
  async signup(data: SignupData, metadata: ClientMetadata = {}): Promise<AuthResult> {
    const normalizedEmail = data.email.toLowerCase().trim();

    // Check email uniqueness
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      throw new ConflictError('A user with this email address already exists');
    }

    // Determine first and last name
    let firstName = data.firstName?.trim() || '';
    let lastName = data.lastName?.trim() || '';
    if (!firstName && data.fullName) {
      const parts = data.fullName.trim().split(/\s+/);
      firstName = parts[0] || 'User';
      lastName = parts.slice(1).join(' ') || '';
    } else if (!firstName) {
      firstName = 'User';
    }

    let mobileNumber = '';
    if (data.mobileNumber && data.mobileNumber.trim()) {
      const phoneVal = validateAndNormalizePhone(data.mobileNumber.trim());
      if (!phoneVal.isValid) {
        throw new ValidationError(phoneVal.error || 'Invalid mobile number');
      }
      mobileNumber = phoneVal.normalized!;
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user along with default UserSettings and FinanceProfile in a transaction
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        firstName,
        lastName,
        mobileNumber,
        role: 'USER',
        status: 'ACTIVE',
        failedLoginAttempts: 0,
        onboardingCompleted: false,
        userSettings: {
          create: {
            currency: 'INR',
            timezone: 'Asia/Kolkata',
            financialMonthStartDay: 1,
            quickAddEnabled: true,
            dashboardDonutsConfig: { income: true, expense: true, investment: true },
            featuresConfig: { investments: true, recurring: true },
          },
        },
        financeProfile: {
          create: {
            monthlyIncome: BigInt(0),
            monthlyExpenseBudget: BigInt(0),
            monthlyInvestmentTarget: BigInt(0),
            riskAppetite: 'MEDIUM',
            investmentHorizon: 'MEDIUM',
          },
        },
      },
      include: {
        userSettings: true,
        financeProfile: true,
      },
    });

    // Issue initial tokens
    const familyId = crypto.randomUUID();
    const refreshTokenString = generateRefreshTokenString();
    const tokenHash = hashRefreshToken(refreshTokenString);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        familyId,
        userAgent: metadata.userAgent || null,
        ipAddress: metadata.ipAddress || null,
        expiresAt,
      },
    });

    const { token: accessToken, expiresIn } = signAccessToken({
      userId: user.id,
      role: user.role,
    });

    await logAuditEvent({
      actorUserId: user.id,
      action: 'AUTH_SIGNUP',
      ipAddress: metadata.ipAddress,
      details: { email: user.email },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        firstName: user.firstName,
        lastName: user.lastName,
        mobileNumber: user.mobileNumber,
        role: user.role,
        status: user.status,
        onboardingCompleted: user.onboardingCompleted,
        lastLoginAt: user.lastLoginAt,
      },
      tokens: {
        accessToken,
        refreshToken: refreshTokenString,
        expiresIn,
      },
    };
  }

  /**
   * Authenticates user with email and password, handling failed attempt counters & lockouts.
   */
  async login(
    email: string,
    password: string,
    metadata: ClientMetadata = {}
  ): Promise<AuthResult> {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check account status
    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedError('Account is suspended. Please contact support.');
    }
    if (user.status === 'DELETED') {
      throw new UnauthorizedError('Account has been deactivated.');
    }

    // Check lockout status
    const now = new Date();
    if (user.lockedUntil && user.lockedUntil > now) {
      const remainingMinutes = Math.ceil((user.lockedUntil.getTime() - now.getTime()) / 60000);
      throw new AccountLockedError(
        `Account is temporarily locked due to multiple failed login attempts. Please try again in ${remainingMinutes} minute(s).`
      );
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      // Fetch dynamic thresholds from AppSettings or fall back to safe defaults
      const maxSetting = await prisma.appSetting.findUnique({
        where: { key: 'max_failed_attempts' },
      });
      const maxFailedAttempts =
        typeof maxSetting?.value === 'number'
          ? maxSetting.value
          : typeof maxSetting?.value === 'string'
          ? parseInt(maxSetting.value, 10) || 5
          : 5;

      const lockoutSetting = await prisma.appSetting.findUnique({
        where: { key: 'lockout_duration_minutes' },
      });
      const lockoutMinutes =
        typeof lockoutSetting?.value === 'number'
          ? lockoutSetting.value
          : typeof lockoutSetting?.value === 'string'
          ? parseInt(lockoutSetting.value, 10) || 15
          : 15;

      const nextAttempts = user.failedLoginAttempts + 1;

      if (nextAttempts >= maxFailedAttempts) {
        const lockedUntil = new Date(Date.now() + lockoutMinutes * 60 * 1000);
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: nextAttempts,
            lockedUntil,
          },
        });

        await logAuditEvent({
          actorUserId: user.id,
          action: 'AUTH_ACCOUNT_LOCKED',
          ipAddress: metadata.ipAddress,
          details: { failedAttempts: nextAttempts, lockedUntil },
        });

        throw new AccountLockedError(
          `Account locked due to ${nextAttempts} failed login attempts. Please try again after ${lockoutMinutes} minutes.`
        );
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: nextAttempts,
          },
        });

        throw new UnauthorizedError('Invalid email or password');
      }
    }

    // Password is valid -> reset counters and update lastLoginAt
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: now,
      },
    });

    // Issue tokens
    const familyId = crypto.randomUUID();
    const refreshTokenString = generateRefreshTokenString();
    const tokenHash = hashRefreshToken(refreshTokenString);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        userId: updatedUser.id,
        tokenHash,
        familyId,
        userAgent: metadata.userAgent || null,
        ipAddress: metadata.ipAddress || null,
        expiresAt,
      },
    });

    const { token: accessToken, expiresIn } = signAccessToken({
      userId: updatedUser.id,
      role: updatedUser.role,
    });

    await logAuditEvent({
      actorUserId: updatedUser.id,
      action: 'AUTH_LOGIN',
      ipAddress: metadata.ipAddress,
      details: { email: updatedUser.email },
    });

    return {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: `${updatedUser.firstName} ${updatedUser.lastName}`.trim(),
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        mobileNumber: updatedUser.mobileNumber,
        role: updatedUser.role,
        status: updatedUser.status,
        onboardingCompleted: updatedUser.onboardingCompleted,
        lastLoginAt: updatedUser.lastLoginAt,
      },
      tokens: {
        accessToken,
        refreshToken: refreshTokenString,
        expiresIn,
      },
    };
  }

  /**
   * Refreshes an expired access token using a valid refresh token.
   * Enforces strict token rotation and revokes entire family on token reuse (theft detection).
   */
  async refresh(
    refreshTokenString: string,
    metadata: ClientMetadata = {}
  ): Promise<{
    tokens: { accessToken: string; refreshToken: string; expiresIn: number };
    user: { id: string; role: string };
  }> {
    if (!refreshTokenString) {
      throw new UnauthorizedError('Refresh token is required');
    }

    const tokenHash = hashRefreshToken(refreshTokenString);

    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // THEFT DETECTION: If token was already revoked, someone is reusing an old token!
    if (tokenRecord.revokedAt !== null) {
      // Invalidate the ENTIRE token family
      await prisma.refreshToken.updateMany({
        where: { familyId: tokenRecord.familyId },
        data: { revokedAt: new Date() },
      });

      await logAuditEvent({
        actorUserId: tokenRecord.userId,
        action: 'AUTH_TOKEN_THEFT_DETECTED',
        ipAddress: metadata.ipAddress,
        details: { familyId: tokenRecord.familyId, revokedTokenId: tokenRecord.id },
      });

      throw new UnauthorizedError(
        'Session security violation detected. All active sessions in this family have been terminated. Please log in again.'
      );
    }

    // Check expiration
    if (tokenRecord.expiresAt <= new Date()) {
      throw new UnauthorizedError('Refresh token has expired. Please log in again.');
    }

    // Check user status
    if (tokenRecord.user.status !== 'ACTIVE') {
      throw new UnauthorizedError('User account is not active');
    }

    // ROTATION: Revoke the presented token
    const now = new Date();
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: now },
    });

    // Create the new refresh token preserving the SAME familyId
    const newRefreshTokenString = generateRefreshTokenString();
    const newHash = hashRefreshToken(newRefreshTokenString);
    const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        userId: tokenRecord.userId,
        tokenHash: newHash,
        familyId: tokenRecord.familyId,
        userAgent: metadata.userAgent || tokenRecord.userAgent,
        ipAddress: metadata.ipAddress || tokenRecord.ipAddress,
        expiresAt: newExpiresAt,
      },
    });

    // Issue a new access token
    const { token: newAccessToken, expiresIn } = signAccessToken({
      userId: tokenRecord.user.id,
      role: tokenRecord.user.role,
    });

    await logAuditEvent({
      actorUserId: tokenRecord.userId,
      action: 'AUTH_TOKEN_ROTATED',
      ipAddress: metadata.ipAddress,
      details: { familyId: tokenRecord.familyId },
    });

    return {
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshTokenString,
        expiresIn,
      },
      user: {
        id: tokenRecord.user.id,
        role: tokenRecord.user.role,
      },
    };
  }

  /**
   * Logs out the user by revoking the refresh token and denylisting the access token.
   */
  async logout(
    refreshTokenString?: string,
    accessTokenString?: string,
    userId?: string
  ): Promise<void> {
    if (refreshTokenString) {
      const tokenHash = hashRefreshToken(refreshTokenString);
      const token = await prisma.refreshToken.findUnique({
        where: { tokenHash },
      });
      if (token && !token.revokedAt) {
        await prisma.refreshToken.update({
          where: { id: token.id },
          data: { revokedAt: new Date() },
        });
      }
    }

    if (accessTokenString) {
      try {
        const decoded = jwt.decode(accessTokenString) as any;
        const jti = decoded?.jti || accessTokenString;
        const exp = decoded?.exp;
        const remainingSeconds = exp ? Math.max(exp - Math.floor(Date.now() / 1000), 60) : 900;
        await addToDenylist(jti, remainingSeconds);
      } catch {
        await addToDenylist(accessTokenString, 900);
      }
    }

    if (userId) {
      await logAuditEvent({
        actorUserId: userId,
        action: 'AUTH_LOGOUT',
      });
    }
  }

  /**
   * Changes user password, verifying the current password and revoking all active sessions.
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const matches = await comparePassword(currentPassword, user.passwordHash);
    if (!matches) {
      throw new ValidationError('Current password does not match');
    }

    if (currentPassword === newPassword) {
      throw new ValidationError('New password must be different from current password');
    }

    const newPasswordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Revoke all active refresh tokens for the user
    await prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    await logAuditEvent({
      actorUserId: userId,
      action: 'AUTH_PASSWORD_CHANGE',
    });
  }

  /**
   * Retrieves authenticated user details and session information.
   */
  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userSettings: true,
        financeProfile: true,
        securityQuestions: {
          select: { id: true, questionKey: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      firstName: user.firstName,
      lastName: user.lastName,
      mobileNumber: user.mobileNumber,
      role: user.role,
      status: user.status,
      onboardingCompleted: user.onboardingCompleted,
      kbaConfigured: (user.securityQuestions?.length || 0) >= 3,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      userSettings: user.userSettings,
    };
  }
}

export const authService = new AuthService();
export default authService;
