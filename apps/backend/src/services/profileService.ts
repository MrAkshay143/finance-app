import { prisma } from '../lib/prisma.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { validateAndNormalizePhone } from '@finance/shared-types';
import { logAuditEvent } from './auditService.js';

export interface UpdateBasicProfileData {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  mobileNumber?: string;
  phone?: string;
  dateOfBirth?: string | Date | null;
  address?: string | null;
  avatarUrl?: string | null;
}

export interface UpdateFinanceProfileData {
  monthlyIncome?: number;
  monthlyIncomeTarget?: number;
  monthlyExpenseBudget?: number;
  monthlyInvestmentTarget?: number;
  incomeRange?: string | null;
  savingsTarget?: number | null;
  savingsTargetPercentage?: number | null;
  investmentExperience?: string | null;
  riskAppetite?: string | null;
  investmentHorizon?: string | null;
}

export class ProfileService {
  /**
   * Retrieves complete profile including User details, FinanceProfile,
   * UserSettings, and security questions completion status.
   * Answers or answer hashes are NEVER returned.
   */
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        financeProfile: true,
        userSettings: true,
        securityQuestions: {
          select: { id: true, questionKey: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const kbaConfigured = (user.securityQuestions?.length || 0) >= 3;

    // Convert BigInt paise to readable numbers and rupees
    const fp = user.financeProfile;
    const formattedFinanceProfile = fp
      ? {
          id: fp.id,
          userId: fp.userId,
          dateOfBirth: fp.dateOfBirth,
          address: fp.address,
          monthlyIncome: Number(fp.monthlyIncome) / 100,
          monthlyIncomePaise: Number(fp.monthlyIncome),
          monthlyIncomeTarget: Number(fp.monthlyIncome) / 100,
          monthlyExpenseBudget: Number(fp.monthlyExpenseBudget) / 100,
          monthlyExpenseBudgetPaise: Number(fp.monthlyExpenseBudget),
          monthlyInvestmentTarget: Number(fp.monthlyInvestmentTarget) / 100,
          monthlyInvestmentTargetPaise: Number(fp.monthlyInvestmentTarget),
          incomeRange: fp.incomeRange,
          savingsTarget: fp.savingsTarget !== null ? Number(fp.savingsTarget) / 100 : null,
          savingsTargetPaise: fp.savingsTarget !== null ? Number(fp.savingsTarget) : null,
          investmentExperience: fp.investmentExperience,
          riskAppetite: fp.riskAppetite,
          investmentHorizon: fp.investmentHorizon,
          createdAt: fp.createdAt,
          updatedAt: fp.updatedAt,
        }
      : null;

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        firstName: user.firstName,
        lastName: user.lastName,
        mobileNumber: user.mobileNumber,
        avatarUrl: user.avatarUrl,
        role: user.role,
        status: user.status,
        onboardingCompleted: user.onboardingCompleted,
        kbaConfigured,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      financeProfile: formattedFinanceProfile,
      userSettings: user.userSettings,
      onboardingCompleted: user.onboardingCompleted,
      kbaConfigured,
    };
  }

  /**
   * Updates basic profile details across User and FinanceProfile.
   */
  async updateBasicProfile(userId: string, data: UpdateBasicProfileData) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { financeProfile: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Determine first and last name updates
    let firstName = data.firstName !== undefined ? data.firstName.trim() : undefined;
    let lastName = data.lastName !== undefined ? data.lastName.trim() : undefined;

    if (data.fullName && !firstName) {
      const parts = data.fullName.trim().split(/\s+/);
      firstName = parts[0] || user.firstName;
      lastName = parts.slice(1).join(' ') || (data.lastName ?? user.lastName);
    }

    let normalizedMobile: string | undefined = undefined;
    const rawMobile = data.mobileNumber ?? data.phone;
    if (rawMobile !== undefined) {
      if (rawMobile.trim() === '') {
        normalizedMobile = '';
      } else {
        const phoneVal = validateAndNormalizePhone(rawMobile.trim());
        if (!phoneVal.isValid) {
          throw new ValidationError(phoneVal.error || 'Invalid mobile number');
        }
        normalizedMobile = phoneVal.normalized!;
      }
    }

    // Update User model fields
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName !== undefined ? { firstName } : {}),
        ...(lastName !== undefined ? { lastName } : {}),
        ...(normalizedMobile !== undefined ? { mobileNumber: normalizedMobile } : {}),
        ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
      },
    });

    // Update or create FinanceProfile basic fields (dateOfBirth, address)
    let parsedDob: Date | null | undefined = undefined;
    if (data.dateOfBirth !== undefined) {
      parsedDob = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
    }

    if (data.dateOfBirth !== undefined || data.address !== undefined) {
      await prisma.financeProfile.upsert({
        where: { userId },
        create: {
          userId,
          dateOfBirth: parsedDob ?? null,
          address: data.address ?? null,
          monthlyIncome: BigInt(0),
          monthlyExpenseBudget: BigInt(0),
          monthlyInvestmentTarget: BigInt(0),
        },
        update: {
          ...(parsedDob !== undefined ? { dateOfBirth: parsedDob } : {}),
          ...(data.address !== undefined ? { address: data.address } : {}),
        },
      });
    }

    await logAuditEvent({
      actorUserId: userId,
      action: 'PROFILE_BASIC_UPDATE',
      details: { firstName, lastName, mobileNumber: normalizedMobile },
    });

    return this.getProfile(userId);
  }

  /**
   * Updates financial targets and risk profiling.
   * Converts all rupee inputs to BigInt paise (Math.round(val * 100)) for storage.
   * Marks onboardingCompleted = true on User if required onboarding parameters are provided.
   */
  async updateFinanceProfile(userId: string, data: UpdateFinanceProfileData) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { financeProfile: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Convert rupees to BigInt paise
    const incomeVal = data.monthlyIncome ?? data.monthlyIncomeTarget;
    const monthlyIncomePaise =
      incomeVal !== undefined ? BigInt(Math.round(incomeVal * 100)) : undefined;

    const monthlyExpenseBudgetPaise =
      data.monthlyExpenseBudget !== undefined
        ? BigInt(Math.round(data.monthlyExpenseBudget * 100))
        : undefined;

    const monthlyInvestmentTargetPaise =
      data.monthlyInvestmentTarget !== undefined
        ? BigInt(Math.round(data.monthlyInvestmentTarget * 100))
        : undefined;

    const savingsTargetPaise =
      data.savingsTarget !== undefined && data.savingsTarget !== null
        ? BigInt(Math.round(data.savingsTarget * 100))
        : data.savingsTarget === null
        ? null
        : undefined;

    // Upsert FinanceProfile
    await prisma.financeProfile.upsert({
      where: { userId },
      create: {
        userId,
        monthlyIncome: monthlyIncomePaise ?? BigInt(0),
        monthlyExpenseBudget: monthlyExpenseBudgetPaise ?? BigInt(0),
        monthlyInvestmentTarget: monthlyInvestmentTargetPaise ?? BigInt(0),
        incomeRange: data.incomeRange ?? null,
        savingsTarget: savingsTargetPaise ?? null,
        investmentExperience: data.investmentExperience ?? null,
        riskAppetite: data.riskAppetite ?? 'MEDIUM',
        investmentHorizon: data.investmentHorizon ?? 'MEDIUM',
      },
      update: {
        ...(monthlyIncomePaise !== undefined ? { monthlyIncome: monthlyIncomePaise } : {}),
        ...(monthlyExpenseBudgetPaise !== undefined
          ? { monthlyExpenseBudget: monthlyExpenseBudgetPaise }
          : {}),
        ...(monthlyInvestmentTargetPaise !== undefined
          ? { monthlyInvestmentTarget: monthlyInvestmentTargetPaise }
          : {}),
        ...(data.incomeRange !== undefined ? { incomeRange: data.incomeRange } : {}),
        ...(savingsTargetPaise !== undefined ? { savingsTarget: savingsTargetPaise } : {}),
        ...(data.investmentExperience !== undefined
          ? { investmentExperience: data.investmentExperience }
          : {}),
        ...(data.riskAppetite !== undefined ? { riskAppetite: data.riskAppetite } : {}),
        ...(data.investmentHorizon !== undefined
          ? { investmentHorizon: data.investmentHorizon }
          : {}),
      },
    });

    // Check onboarding completion condition
    // User is considered onboarded when basic profile is present and financial monthly targets are configured
    const effectiveIncome =
      monthlyIncomePaise ?? user.financeProfile?.monthlyIncome ?? BigInt(0);
    const effectiveExpense =
      monthlyExpenseBudgetPaise ?? user.financeProfile?.monthlyExpenseBudget ?? BigInt(0);

    const hasTargets = effectiveIncome > BigInt(0) || effectiveExpense > BigInt(0);
    const hasBasicProfile = Boolean(user.firstName && user.lastName);

    if (hasTargets && hasBasicProfile && !user.onboardingCompleted) {
      await prisma.user.update({
        where: { id: userId },
        data: { onboardingCompleted: true },
      });
    }

    await logAuditEvent({
      actorUserId: userId,
      action: 'PROFILE_FINANCE_UPDATE',
      details: {
        incomeProvided: incomeVal !== undefined,
        expenseBudgetProvided: data.monthlyExpenseBudget !== undefined,
        investmentTargetProvided: data.monthlyInvestmentTarget !== undefined,
      },
    });

    return this.getProfile(userId);
  }

  /**
   * Updates user avatar URL with base64 data URI or valid image URL (<= 5MB).
   */
  async uploadAvatar(userId: string, avatarData: string) {
    if (!avatarData || typeof avatarData !== 'string') {
      throw new ValidationError('Avatar image data is required');
    }

    // Limit image payload size to 5MB (base64 ~7MB max)
    if (avatarData.length > 7 * 1024 * 1024) {
      throw new ValidationError('Avatar image must not exceed 5MB in size');
    }

    // If data URI, ensure valid image MIME type
    if (avatarData.startsWith('data:')) {
      if (!/^data:image\/(jpeg|jpg|png|webp|gif);base64,/.test(avatarData)) {
        throw new ValidationError('Only JPEG, PNG, WEBP, and GIF images are supported');
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: avatarData },
    });

    await logAuditEvent({
      actorUserId: userId,
      action: 'PROFILE_AVATAR_UPDATE',
      details: { avatarLength: avatarData.length },
    });

    return { avatarUrl: updated.avatarUrl };
  }
}

export const profileService = new ProfileService();
export default profileService;
