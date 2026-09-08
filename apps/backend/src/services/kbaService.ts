import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { ValidationError, UnauthorizedError, NotFoundError } from '../utils/errors.js';
import { logAuditEvent } from './auditService.js';

export interface SecurityQuestionSetupItem {
  questionKey?: string;
  questionId?: string;
  answer: string;
}

export interface SecurityQuestionVerifyItem {
  questionKey?: string;
  questionId?: string;
  answer: string;
}

export const AVAILABLE_SECURITY_QUESTIONS = [
  { key: 'first_pet', text: 'What was the name of your first pet?' },
  { key: 'mother_maiden_name', text: "What is your mother's maiden name?" },
  { key: 'elementary_school', text: 'What elementary school did you attend?' },
  { key: 'birth_city', text: 'In what city were you born?' },
  { key: 'first_car', text: 'What was the make or model of your first car?' },
  { key: 'favorite_book', text: 'What is the title of your favorite book?' },
  { key: 'childhood_street', text: 'What street did you grow up on?' },
] as const;

async function verifyAnswerHash(candidate: string, hash: string): Promise<boolean> {
  const clean = candidate.trim().toLowerCase();
  if (hash.startsWith('$2a$') || hash.startsWith('$2b$')) {
    return bcrypt.compare(clean, hash);
  }
  const sha = crypto.createHash('sha256').update(clean).digest('hex');
  return sha === hash;
}

export class KbaService {
  /**
   * Returns list of predefined available security questions with prompts.
   */
  getAvailableQuestions() {
    return AVAILABLE_SECURITY_QUESTIONS.map((q) => ({
      key: q.key,
      text: q.text,
    }));
  }

  /**
   * Returns configured security questions for the user.
   * Strips answer hashes completely - NEVER exposes answers or hashes.
   */
  async getSecurityQuestions(userId: string) {
    const configured = await prisma.securityQuestion.findMany({
      where: { userId },
      select: {
        id: true,
        questionKey: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return configured.map((q) => {
      const meta = AVAILABLE_SECURITY_QUESTIONS.find((item) => item.key === q.questionKey);
      return {
        id: q.id,
        questionKey: q.questionKey,
        questionText: meta ? meta.text : q.questionKey,
        createdAt: q.createdAt,
      };
    });
  }

  /**
   * Sets up or replaces exactly 3 security questions.
   * Enforces distinct keys and hashes answers with bcrypt.
   */
  async setupSecurityQuestions(
    userId: string,
    questions: SecurityQuestionSetupItem[]
  ): Promise<{ success: boolean; count: number; configured: boolean }> {
    if (!Array.isArray(questions) || questions.length !== 3) {
      throw new ValidationError('Exactly 3 security questions are required');
    }

    const normalized = questions.map((q) => {
      const key = (q.questionKey || q.questionId || '').trim();
      const answer = (q.answer || '').trim().toLowerCase();
      if (!key) {
        throw new ValidationError('Question key is required for each security question');
      }
      if (!answer || answer.length < 2) {
        throw new ValidationError('Answers must be at least 2 characters long');
      }
      return { key, answer };
    });

    const uniqueKeys = new Set(normalized.map((q) => q.key));
    if (uniqueKeys.size !== 3) {
      throw new ValidationError('All 3 security questions must be unique');
    }

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Hash answers and upsert in a single transaction
    const hashedQuestions = await Promise.all(
      normalized.map(async (item) => ({
        key: item.key,
        hash: await bcrypt.hash(item.answer, 10),
      }))
    );

    await prisma.$transaction(async (tx) => {
      // Remove any previously configured questions for this user
      await tx.securityQuestion.deleteMany({
        where: { userId },
      });

      for (const item of hashedQuestions) {
        await tx.securityQuestion.create({
          data: {
            userId,
            questionKey: item.key,
            answerHash: item.hash,
          },
        });
      }
    });

    await logAuditEvent({
      actorUserId: userId,
      action: 'SECURITY_QUESTIONS_CONFIGURED',
      details: { count: 3, keys: Array.from(uniqueKeys) },
    });

    return {
      success: true,
      count: 3,
      configured: true,
    };
  }

  /**
   * Verifies provided answers against stored hashes for account recovery or sensitive action approval.
   */
  async verifySecurityQuestions(
    identifier: { userId?: string; email?: string },
    answers: SecurityQuestionVerifyItem[]
  ): Promise<{ verified: boolean; message: string }> {
    if (!identifier.userId && !identifier.email) {
      throw new ValidationError('User identifier (userId or email) is required');
    }

    let targetUserId = identifier.userId;
    if (!targetUserId && identifier.email) {
      const user = await prisma.user.findUnique({
        where: { email: identifier.email.toLowerCase().trim() },
        select: { id: true },
      });
      if (!user) {
        throw new NotFoundError('User not found');
      }
      targetUserId = user.id;
    }

    const storedQuestions = await prisma.securityQuestion.findMany({
      where: { userId: targetUserId },
    });

    if (storedQuestions.length < 3) {
      throw new ValidationError('Security questions are not configured for this account');
    }

    if (!Array.isArray(answers) || answers.length === 0) {
      throw new ValidationError('Answers to verify must be provided');
    }

    for (const item of answers) {
      const key = (item.questionKey || item.questionId || '').trim();
      const stored = storedQuestions.find((q) => q.questionKey === key);

      if (!stored) {
        throw new UnauthorizedError(`Invalid security question key: ${key}`);
      }

      const isMatch = await verifyAnswerHash(item.answer || '', stored.answerHash);
      if (!isMatch) {
        await logAuditEvent({
          actorUserId: targetUserId,
          action: 'SECURITY_QUESTIONS_VERIFY_FAILED',
          details: { questionKey: key },
        });
        throw new UnauthorizedError('Security question verification failed: incorrect answer');
      }
    }

    await logAuditEvent({
      actorUserId: targetUserId,
      action: 'SECURITY_QUESTIONS_VERIFIED',
    });

    return {
      verified: true,
      message: 'Security questions verified successfully',
    };
  }
}

export const kbaService = new KbaService();
export default kbaService;
