// AES-256-GCM encryption for SMTP password stored in AppSetting
import crypto from 'crypto';
import { env } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // bytes
const IV_LENGTH = 12;  // bytes (96-bit IV for GCM)
const TAG_LENGTH = 16; // bytes (128-bit auth tag)

// Derives 32-byte encryption key from SMTP_ENCRYPTION_KEY or JWT_REFRESH_SECRET
function getEncryptionKey(): Buffer {
  const raw = (process.env.SMTP_ENCRYPTION_KEY || '').trim();
  if (raw.length >= 32) {
    return Buffer.from(raw.substring(0, 64), 'hex').subarray(0, KEY_LENGTH).length === KEY_LENGTH
      ? Buffer.from(raw.substring(0, 64), 'hex').subarray(0, KEY_LENGTH)
      : Buffer.from(raw).subarray(0, KEY_LENGTH);
  }
  // Derive from JWT_REFRESH_SECRET using HKDF-like construction
  const secret = process.env.JWT_REFRESH_SECRET || env?.JWT_REFRESH_SECRET || 'default-secret-min-32-chars-fallback';
  return crypto.createHmac('sha256', secret).update('smtp-encryption-key-v1').digest().subarray(0, KEY_LENGTH);
}

// Encrypts plaintext string using AES-256-GCM (IV + ciphertext + authTag)
export function encryptSmtpPassword(plaintext: string): string {
  if (!plaintext) return '';
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, encrypted, authTag]).toString('base64');
}

// Decrypts AES-256-GCM ciphertext produced by encryptSmtpPassword
export function decryptSmtpPassword(ciphertext: string): string | null {
  if (!ciphertext) return null;
  try {
    const key = getEncryptionKey();
    const buf = Buffer.from(ciphertext, 'base64');
    if (buf.length < IV_LENGTH + TAG_LENGTH + 1) return null;
    const iv = buf.subarray(0, IV_LENGTH);
    const authTag = buf.subarray(buf.length - TAG_LENGTH);
    const encrypted = buf.subarray(IV_LENGTH, buf.length - TAG_LENGTH);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

// Masks SMTP password for log-safe output
export function maskSmtpPassword(password: string | null): string {
  if (!password) return '';
  return '*'.repeat(Math.min(password.length, 8));
}
