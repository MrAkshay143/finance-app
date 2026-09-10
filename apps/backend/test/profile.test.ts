import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { prismaTestAdapter } from './fixtures/prismaTestAdapter.js';

vi.mock('../src/lib/prisma.js', async () => {
  const { prismaTestAdapter } = await import('./fixtures/prismaTestAdapter.js');
  return {
    prisma: prismaTestAdapter,
    default: prismaTestAdapter,
  };
});

import { createApp } from '../src/app.js';

describe('TASK-1.2: Profile, Onboarding & KBA Integration Tests', () => {
  const app = createApp();
  let userToken: string;
  let userId: string;

  beforeEach(async () => {
    prismaTestAdapter.clearAll();

    // Create a fresh test user
    const signupRes = await request(app).post('/api/v1/auth/signup').send({
      email: 'profile.tester@example.com',
      password: 'Password123!',
      fullName: 'Arthur Dent',
      mobileNumber: '+919999988888',
    });

    userToken = signupRes.body.data.tokens.accessToken;
    userId = signupRes.body.data.user.id;
  });

  describe('GET /api/v1/profile', () => {
    it('returns user profile, financeProfile, userSettings, onboardingCompleted, and kbaConfigured flag', async () => {
      const res = await request(app)
        .get('/api/v1/profile')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        user: {
          id: userId,
          email: 'profile.tester@example.com',
          fullName: 'Arthur Dent',
          onboardingCompleted: false,
          kbaConfigured: false,
        },
        onboardingCompleted: false,
        kbaConfigured: false,
      });
      expect(res.body.data.userSettings).toBeDefined();
      expect(res.body.data.financeProfile).toBeDefined();
    });
  });

  describe('PUT /api/v1/profile/basic', () => {
    it('updates basic profile fields: firstName, lastName, mobileNumber, dateOfBirth, address', async () => {
      const res = await request(app)
        .put('/api/v1/profile/basic')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          firstName: 'Arthur',
          lastName: 'Prefect',
          mobileNumber: '+918888877777',
          dateOfBirth: '1985-03-11',
          address: '42 Cottington Lane, Islington, London',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.fullName).toBe('Arthur Prefect');
      expect(res.body.data.user.mobileNumber).toBe('+918888877777');
      expect(res.body.data.financeProfile.address).toBe('42 Cottington Lane, Islington, London');
      expect(new Date(res.body.data.financeProfile.dateOfBirth).toISOString()).toContain('1985-03-11');

      // Verify DB state
      const dbUser = prismaTestAdapter._state.users.get(userId);
      expect(dbUser.lastName).toBe('Prefect');
      expect(dbUser.mobileNumber).toBe('+918888877777');

      const dbProfile = prismaTestAdapter._state.financeProfiles.get(userId);
      expect(dbProfile.address).toBe('42 Cottington Lane, Islington, London');
    });
  });

  describe('PUT /api/v1/profile/finance & BigInt Paise Conversion', () => {
    it('converts rupee inputs to BigInt paise in database and marks onboardingCompleted = true', async () => {
      const res = await request(app)
        .put('/api/v1/profile/finance')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          monthlyIncome: 85000, // ₹85,000
          monthlyExpenseBudget: 45000, // ₹45,000
          monthlyInvestmentTarget: 25000, // ₹25,000
          incomeRange: '75k-1L',
          savingsTarget: 500000, // ₹5,00,000
          riskAppetite: 'HIGH',
          investmentHorizon: 'LONG',
          investmentExperience: 'INTERMEDIATE',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify response amounts in rupees
      expect(res.body.data.financeProfile.monthlyIncome).toBe(85000);
      expect(res.body.data.financeProfile.monthlyExpenseBudget).toBe(45000);
      expect(res.body.data.financeProfile.monthlyInvestmentTarget).toBe(25000);
      expect(res.body.data.financeProfile.savingsTarget).toBe(500000);
      expect(res.body.data.financeProfile.riskAppetite).toBe('HIGH');
      expect(res.body.data.financeProfile.investmentHorizon).toBe('LONG');

      // Verify database stored values are BigInt paise (Math.round(val * 100))
      const dbProfile = prismaTestAdapter._state.financeProfiles.get(userId);
      expect(typeof dbProfile.monthlyIncome).toBe('bigint');
      expect(dbProfile.monthlyIncome).toBe(BigInt(8500000)); // ₹85,000 in paise
      expect(dbProfile.monthlyExpenseBudget).toBe(BigInt(4500000)); // ₹45,000 in paise
      expect(dbProfile.monthlyInvestmentTarget).toBe(BigInt(2500000)); // ₹25,000 in paise
      expect(dbProfile.savingsTarget).toBe(BigInt(50000000)); // ₹5,00,000 in paise

      // Verify onboardingCompleted is now true on User
      const dbUser = prismaTestAdapter._state.users.get(userId);
      expect(dbUser.onboardingCompleted).toBe(true);
      expect(res.body.data.onboardingCompleted).toBe(true);
    });
  });

  describe('Security Questions (KBA)', () => {
    const validQuestions = [
      { questionKey: 'first_pet', answer: 'Barnaby' },
      { questionKey: 'birth_city', answer: 'Bristol' },
      { questionKey: 'mother_maiden_name', answer: 'Smith' },
    ];

    it('GET /api/v1/security-questions/available returns predefined list with prompts', async () => {
      const res = await request(app).get('/api/v1/security-questions/available');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(5);
      expect(res.body.data[0]).toHaveProperty('key');
      expect(res.body.data[0]).toHaveProperty('text');
    });

    it('POST /api/v1/security-questions sets up 3 questions and hashes answers', async () => {
      const res = await request(app)
        .post('/api/v1/security-questions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          questions: validQuestions,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual({
        success: true,
        count: 3,
        configured: true,
      });

      // Verify DB stored answer hashes are bcrypt-hashed (NOT plaintext)
      const storedQuestions = Array.from(prismaTestAdapter._state.securityQuestions.values()).filter(
        (q) => q.userId === userId
      );
      expect(storedQuestions.length).toBe(3);
      for (const q of storedQuestions) {
        expect(q.answerHash).toBeDefined();
        expect(q.answerHash).not.toBe('Barnaby');
        expect(q.answerHash).not.toBe('Bristol');
        expect(q.answerHash).not.toBe('Smith');
        expect(q.answerHash.startsWith('$2a$') || q.answerHash.startsWith('$2b$')).toBe(true);
      }
    });

    it('GET /api/v1/security-questions NEVER exposes answers or answer hashes', async () => {
      // Set up questions first
      await request(app)
        .post('/api/v1/security-questions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ questions: validQuestions });

      const res = await request(app)
        .get('/api/v1/security-questions')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(3);

      for (const item of res.body.data) {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('questionKey');
        expect(item).toHaveProperty('questionText');
        // Critical: NEVER return answers or hashes!
        expect(item.answer).toBeUndefined();
        expect(item.answerHash).toBeUndefined();
      }

      // Also verify that GET /profile reflects kbaConfigured = true
      const profileRes = await request(app)
        .get('/api/v1/profile')
        .set('Authorization', `Bearer ${userToken}`);

      expect(profileRes.body.data.kbaConfigured).toBe(true);
    });

    it('POST /api/v1/security-questions rejects less or more than 3 questions with 422', async () => {
      const res = await request(app)
        .post('/api/v1/security-questions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          questions: [
            { questionKey: 'first_pet', answer: 'Barnaby' },
            { questionKey: 'birth_city', answer: 'Bristol' },
          ],
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('POST /api/v1/security-questions rejects duplicate question keys with 422', async () => {
      const res = await request(app)
        .post('/api/v1/security-questions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          questions: [
            { questionKey: 'first_pet', answer: 'Barnaby' },
            { questionKey: 'first_pet', answer: 'Fluffy' },
            { questionKey: 'birth_city', answer: 'Bristol' },
          ],
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('POST /api/v1/security-questions/verify verifies correct answers and rejects incorrect answers', async () => {
      // Set up questions
      await request(app)
        .post('/api/v1/security-questions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ questions: validQuestions });

      // Correct verification (case-insensitive, trimmed)
      const verifySuccess = await request(app)
        .post('/api/v1/security-questions/verify')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          answers: [
            { questionKey: 'first_pet', answer: '  barnaby ' },
            { questionKey: 'birth_city', answer: 'BRISTOL' },
            { questionKey: 'mother_maiden_name', answer: 'smith' },
          ],
        });

      expect(verifySuccess.status).toBe(200);
      expect(verifySuccess.body.success).toBe(true);
      expect(verifySuccess.body.data.verified).toBe(true);

      // Incorrect verification
      const verifyFail = await request(app)
        .post('/api/v1/security-questions/verify')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          answers: [
            { questionKey: 'first_pet', answer: 'WrongPet' },
            { questionKey: 'birth_city', answer: 'BRISTOL' },
            { questionKey: 'mother_maiden_name', answer: 'Smith' },
          ],
        });

      expect(verifyFail.status).toBe(401);
      expect(verifyFail.body.success).toBe(false);
      expect(verifyFail.body.error.code).toBe('UNAUTHENTICATED');

      // Incomplete verification (<3 answers) rejected with 422
      const verifyIncomplete = await request(app)
        .post('/api/v1/security-questions/verify')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          answers: [{ questionKey: 'first_pet', answer: 'barnaby' }],
        });

      expect(verifyIncomplete.status).toBe(422);
      expect(verifyIncomplete.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
