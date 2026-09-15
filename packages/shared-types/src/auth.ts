import { z } from 'zod';
import { UserRoleSchema, UserStatusSchema } from './enums.js';
import { CountryCodeSchema, type CountryCode } from './countries.js';
import { CurrencyCodeSchema, type CurrencyCode } from './currencies.js';

export const PASSWORD_REQUIREMENTS_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

// PasswordSchema is a structural/sanity guard only - minimum 8 characters.
// Actual complexity rules (uppercase, lowercase, digit, special) are enforced
// dynamically by the backend passwordPolicyService, which reads admin-configured
// settings. Do NOT add hardcoded regex checks here as they would conflict with
// admin-configurable policy.
export const PasswordSchema = z
  .string()
  .min(8, 'Password does not meet requirements');

export const AVAILABLE_SECURITY_QUESTIONS = [
  { key: 'first_pet', question: 'What was the name of your first pet?', text: 'What was the name of your first pet?' },
  { key: 'mother_maiden_name', question: "What is your mother's maiden name?", text: "What is your mother's maiden name?" },
  { key: 'elementary_school', question: 'What elementary school did you attend?', text: 'What elementary school did you attend?' },
  { key: 'first_school', question: 'What was the name of your first school?', text: 'What was the name of your first school?' },
  { key: 'birth_city', question: 'In what city were you born?', text: 'In what city were you born?' },
  { key: 'favorite_book', question: 'What is your favorite book?', text: 'What is the title of your favorite book?' },
  { key: 'first_car', question: 'What was the make of your first car?', text: 'What was the make or model of your first car?' },
  { key: 'childhood_street', question: 'What street did you grow up on?', text: 'What street did you grow up on?' },
  { key: 'childhood_hero', question: 'Who was your childhood hero?', text: 'Who was your childhood hero?' },
] as const;

export type SecurityQuestionKey = typeof AVAILABLE_SECURITY_QUESTIONS[number]['key'];

export const SignupInputSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: PasswordSchema,
  fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().optional(),
  mobileNumber: z.string().optional(),
  country: CountryCodeSchema.default('IN').optional(),
  currency: CurrencyCodeSchema.default('INR').optional(),
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
  country: z.string().optional(),
  currency: z.string().optional(),
  role: UserRoleSchema,
  status: UserStatusSchema,
  avatarUrl: z.string().nullable().optional(),
  onboardingCompleted: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
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
  message: 'Please select a security question.',
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
  return Array.isArray(list) && list.length >= 3;
}, {
  message: 'All 3 security questions must be answered',
  path: ['answers'],
});
export type SecurityQuestionsVerify = z.infer<typeof SecurityQuestionsVerifySchema>;

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: PasswordSchema,
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
  ).min(3, 'All 3 security questions must be answered'),
});
export type ForgotPasswordVerifyInput = z.infer<typeof ForgotPasswordVerifyInputSchema>;

export const ResetPasswordInputSchema = z.object({
  resetToken: z.string().min(1, 'Reset token is required'),
  newPassword: PasswordSchema,
});
export type ResetPasswordInput = z.infer<typeof ResetPasswordInputSchema>;

export const SendRegistrationOtpInputSchema = z.object({
  email: z.string().email('Invalid email address'),
});
export type SendRegistrationOtpInput = z.infer<typeof SendRegistrationOtpInputSchema>;

export const VerifyRegistrationOtpInputSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  pendingRegistrationId: z.string().optional(),
  otp: z.string().min(6, 'OTP must be 6 characters').max(6, 'OTP must be 6 characters'),
});
export type VerifyRegistrationOtpInput = z.infer<typeof VerifyRegistrationOtpInputSchema>;

export const InitiateRegistrationInputSchema = z.object({
  email: z.string().email('Invalid email address'),
});
export type InitiateRegistrationInput = z.infer<typeof InitiateRegistrationInputSchema>;

export const VerifyRegistrationEmailInputSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().min(6, 'OTP must be 6 characters').max(6, 'OTP must be 6 characters'),
});
export type VerifyRegistrationEmailInput = z.infer<typeof VerifyRegistrationEmailInputSchema>;

export const CompleteRegistrationInputSchema = z.object({
  registrationToken: z.string().min(1, 'Registration token is required'),
  password: PasswordSchema,
  fullName: z.string().min(1, 'Full name is required'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  country: z.string().optional(),
  currency: z.string().optional(),
  mobileNumber: z.string().optional(),
});
export type CompleteRegistrationInput = z.infer<typeof CompleteRegistrationInputSchema>;
