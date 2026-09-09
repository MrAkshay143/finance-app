import { z } from 'zod';
import { UserRoleSchema, UserStatusSchema } from './enums.js';

export const SignupInputSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().optional(),
  mobileNumber: z.string().optional(),
}).refine(data => data.fullName || data.firstName, {
  message: 'Full name or first name is required',
  path: ['fullName'],
});
export type SignupInput = z.infer<typeof SignupInputSchema>;

export const LoginInputSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

export const RefreshTokenInputSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required').optional(),
});
export type RefreshTokenInput = z.infer<typeof RefreshTokenInputSchema>;

export const AuthUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  mobileNumber: z.string().nullable().optional(),
  role: UserRoleSchema,
  status: UserStatusSchema,
  avatarUrl: z.string().nullable().optional(),
  onboardingCompleted: z.boolean().optional(),
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
});
export type AuthTokens = z.infer<typeof AuthTokensSchema>;

export const AuthResponseSchema = z.object({
  user: AuthUserSchema,
  tokens: AuthTokensSchema,
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const SecurityQuestionSchema = z.object({
  id: z.string(),
  questionKey: z.string(),
  questionText: z.string(),
});
export type SecurityQuestion = z.infer<typeof SecurityQuestionSchema>;

export const SecurityQuestionAnswerSchema = z.object({
  questionId: z.string().optional(),
  questionKey: z.string().optional(),
  answer: z.string().min(1, 'Answer is required').transform(a => a.trim().toLowerCase()),
}).refine(data => !!(data.questionId || data.questionKey), {
  message: 'questionKey or questionId is required',
  path: ['questionKey'],
});
export type SecurityQuestionAnswer = z.infer<typeof SecurityQuestionAnswerSchema>;

export const SecurityQuestionsSetupSchema = z.object({
  answers: z.array(SecurityQuestionAnswerSchema).optional(),
  questions: z.array(SecurityQuestionAnswerSchema).optional(),
}).refine(data => {
  const list = data.answers || data.questions;
  return Array.isArray(list) && list.length === 3;
}, {
  message: 'Exactly 3 security questions must be configured',
  path: ['answers'],
});
export type SecurityQuestionsSetup = z.infer<typeof SecurityQuestionsSetupSchema>;

export const SecurityQuestionsVerifySchema = z.object({
  userId: z.string().uuid().optional(),
  email: z.string().email().optional(),
  answers: z.array(SecurityQuestionAnswerSchema).optional(),
  questions: z.array(SecurityQuestionAnswerSchema).optional(),
}).refine(data => {
  const list = data.answers || data.questions;
  return Array.isArray(list) && list.length === 3;
}, {
  message: 'Exactly 3 security question answers must be provided',
  path: ['answers'],
});
export type SecurityQuestionsVerify = z.infer<typeof SecurityQuestionsVerifySchema>;

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .regex(/[A-Z]/, 'New password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'New password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'New password must contain at least one number'),
});
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

export const ForgotPasswordInitiateInputSchema = z.object({
  email: z.string().email('Invalid email address'),
});
export type ForgotPasswordInitiateInput = z.infer<typeof ForgotPasswordInitiateInputSchema>;

export const ForgotPasswordVerifyInputSchema = z.object({
  email: z.string().email('Invalid email address'),
  answers: z.array(
    z.object({
      questionKey: z.string().optional(),
      questionId: z.string().optional(),
      answer: z.string().min(1, 'Answer is required'),
    })
  ),
});
export type ForgotPasswordVerifyInput = z.infer<typeof ForgotPasswordVerifyInputSchema>;

export const ResetPasswordInputSchema = z.object({
  resetToken: z.string().min(1, 'Reset token is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .regex(/[A-Z]/, 'New password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'New password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'New password must contain at least one number'),
});
export type ResetPasswordInput = z.infer<typeof ResetPasswordInputSchema>;
