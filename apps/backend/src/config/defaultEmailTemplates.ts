export interface EmailTemplateSeed {
  key: string;
  name: string;
  subject: string;
  variables: string[];
  htmlContent: string;
  textContent?: string;
  isActive: boolean;
}

export const DEFAULT_EMAIL_TEMPLATES: EmailTemplateSeed[] = [
  {
    key: 'password_reset',
    name: 'Password Reset',
    subject: 'Reset your {{appName}} password',
    variables: ['firstName', 'resetLink', 'appName'],
    htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
  <h2 style="color: #2563eb; margin-top: 0;">Password Reset Request</h2>
  <p>Hello {{firstName}},</p>
  <p>We received a request to reset the password for your {{appName}} account. Click the button below to choose a new password:</p>
  <div style="margin: 32px 0;">
    <a href="{{resetLink}}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Reset Password</a>
  </div>
  <p style="color: #64748b; font-size: 14px;">If you did not request this, you can safely ignore this email. Your password will remain unchanged.</p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
  <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">This link is valid for 1 hour.</p>
</div>`,
    textContent: 'Hello {{firstName}},\n\nWe received a request to reset your password for your {{appName}} account.\n\nPlease use the link below to set a new password:\n{{resetLink}}\n\nIf you did not request this, you can safely ignore this email.\n\nThis link is valid for 1 hour.',
    isActive: true,
  },
  {
    key: 'welcome',
    name: 'Welcome Email',
    subject: 'Welcome to {{appName}}!',
    variables: ['firstName', 'appName'],
    htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
  <h2 style="color: #2563eb; margin-top: 0;">Welcome to {{appName}}!</h2>
  <p>Hello {{firstName}},</p>
  <p>Thank you for joining {{appName}}. Your personal financial command center is now active.</p>
  <p>Here is what you can do right away:</p>
  <ul style="color: #334155; line-height: 1.8;">
    <li>Track income, expenses, and asset accounts in real-time.</li>
    <li>Set and monitor monthly budgets with live spending alerts.</li>
    <li>Define long-term savings goals and review cash flow reports.</li>
  </ul>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
  <p style="color: #64748b; font-size: 13px;">Best regards,<br>The {{appName}} Team</p>
</div>`,
    textContent: 'Hello {{firstName}},\n\nWelcome to {{appName}}! Your financial dashboard is ready. Track transactions, monitor budgets, and achieve your financial goals with complete confidence.\n\nBest regards,\nThe {{appName}} Team',
    isActive: true,
  },
  {
    key: 'security_alert',
    name: 'Security Alert',
    subject: 'Security Alert: New Sign-in on {{appName}}',
    variables: ['firstName', 'ipAddress', 'userAgent', 'appName'],
    htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
  <h2 style="color: #dc2626; margin-top: 0;">Security Alert: New Sign-in</h2>
  <p>Hello {{firstName}},</p>
  <p>A new sign-in was detected for your {{appName}} account:</p>
  <div style="background-color: #f8fafc; border-left: 4px solid #dc2626; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
    <p style="margin: 4px 0;"><strong>IP Address:</strong> {{ipAddress}}</p>
    <p style="margin: 4px 0;"><strong>Device / Browser:</strong> {{userAgent}}</p>
  </div>
  <p>If this was you, no action is needed. If you do not recognize this activity, please change your password immediately from your account settings.</p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
  <p style="color: #64748b; font-size: 13px;">The {{appName}} Security Team</p>
</div>`,
    textContent: 'Hello {{firstName}},\n\nA new sign-in was detected for your {{appName}} account from IP {{ipAddress}} ({{userAgent}}).\n\nIf this was not you, please log in and change your password immediately.',
    isActive: true,
  },
  {
    key: 'account_locked',
    name: 'Account Locked',
    subject: 'Account Security Notice: Temporary Lockout on {{appName}}',
    variables: ['firstName', 'appName'],
    htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
  <h2 style="color: #dc2626; margin-top: 0;">Account Temporarily Locked</h2>
  <p>Hello {{firstName}},</p>
  <p>Your {{appName}} account has been temporarily locked after 5 consecutive failed sign-in attempts.</p>
  <p>For your protection, sign-in attempts are suspended for 15 minutes. After this duration, you can attempt to log in again or use the "Forgot Password" link to reset your credentials.</p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
  <p style="color: #64748b; font-size: 13px;">The {{appName}} Security Team</p>
</div>`,
    textContent: 'Hello {{firstName}},\n\nYour {{appName}} account has been temporarily locked following 5 consecutive failed sign-in attempts.\n\nSign-in access will be restored automatically after 15 minutes.',
    isActive: true,
  },
  {
    key: 'session_warning',
    name: 'Session Security Warning',
    subject: 'Notice: Session security event on {{appName}}',
    variables: ['firstName', 'ipAddress', 'userAgent', 'appName'],
    htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
  <h2 style="color: #d97706; margin-top: 0;">Session Security Notice</h2>
  <p>Hello {{firstName}},</p>
  <p>A session security event was recorded on your {{appName}} account:</p>
  <div style="background-color: #f8fafc; border-left: 4px solid #d97706; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
    <p style="margin: 4px 0;"><strong>IP Address:</strong> {{ipAddress}}</p>
    <p style="margin: 4px 0;"><strong>Client Info:</strong> {{userAgent}}</p>
  </div>
  <p>If you recently revoked active sessions or logged in from another device, you can disregard this notice. Otherwise, please review your active sessions in Settings.</p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
  <p style="color: #64748b; font-size: 13px;">The {{appName}} Security Team</p>
</div>`,
    textContent: 'Hello {{firstName}},\n\nA session security event was recorded for your {{appName}} account from IP {{ipAddress}} ({{userAgent}}). If you did not initiate this, review your active sessions in Settings.',
    isActive: true,
  },
  {
    key: 'email_verification',
    name: 'Email Verification OTP',
    subject: 'Verify your email for {{appName}}',
    variables: ['firstName', 'otp', 'appName'],
    htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
  <h2 style="color: #2563eb; margin-top: 0;">Verify Your Email Address</h2>
  <p>Hello {{firstName}},</p>
  <p>Thank you for registering with {{appName}}. To complete your account setup, please enter the following verification code:</p>
  <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; text-align: center; padding: 16px; margin: 24px 0; border-radius: 6px;">
    <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #0f172a;">{{otp}}</span>
  </div>
  <p>This code will expire in a few minutes. Do not share this code with anyone.</p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
  <p style="color: #64748b; font-size: 13px;">If you did not attempt to create an account, you can safely ignore this email.</p>
</div>`,
    textContent: 'Hello {{firstName}},\n\nYour {{appName}} verification code is: {{otp}}\n\nDo not share this code with anyone. If you did not request this, please ignore this email.',
    isActive: true,
  },
  {
    key: 'password_reset_otp',
    name: 'Password Reset OTP',
    subject: 'Your password reset code for {{appName}}',
    variables: ['firstName', 'otp', 'appName'],
    htmlContent: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
  <h2 style="color: #2563eb; margin-top: 0;">Password Reset Request</h2>
  <p>Hello {{firstName}},</p>
  <p>We received a request to reset the password for your {{appName}} account. Please use the following code to proceed:</p>
  <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; text-align: center; padding: 16px; margin: 24px 0; border-radius: 6px;">
    <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #0f172a;">{{otp}}</span>
  </div>
  <p>This code will expire shortly. Do not share this code with anyone.</p>
  <p style="color: #64748b; font-size: 14px;">If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
  <p style="color: #64748b; font-size: 13px;">The {{appName}} Security Team</p>
</div>`,
    textContent: 'Hello {{firstName}},\n\nYour {{appName}} password reset code is: {{otp}}\n\nDo not share this code with anyone. If you did not request this, your password will remain unchanged.',
    isActive: true,
  }
];
