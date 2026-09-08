import { describe, it, expect, beforeEach } from 'vitest';
import { secureStorage } from '../services/secureStorage';

describe('SecureStorage Service', () => {
  beforeEach(async () => {
    await secureStorage.clearTokens();
  });

  it('saves and retrieves access and refresh tokens', async () => {
    expect(await secureStorage.hasValidSession()).toBe(false);

    await secureStorage.saveTokens({
      accessToken: 'test-access-token-123',
      refreshToken: 'test-refresh-token-456',
    });

    expect(await secureStorage.hasValidSession()).toBe(true);
    expect(await secureStorage.getAccessToken()).toBe('test-access-token-123');
    expect(await secureStorage.getRefreshToken()).toBe('test-refresh-token-456');
  });

  it('updates only the access token', async () => {
    await secureStorage.saveTokens({
      accessToken: 'initial-access-token',
      refreshToken: 'persistent-refresh-token',
    });

    await secureStorage.updateAccessToken('refreshed-access-token');

    expect(await secureStorage.getAccessToken()).toBe('refreshed-access-token');
    expect(await secureStorage.getRefreshToken()).toBe('persistent-refresh-token');
  });

  it('clears tokens properly on logout', async () => {
    await secureStorage.saveTokens({
      accessToken: 'token-to-clear',
      refreshToken: 'refresh-to-clear',
    });

    expect(await secureStorage.hasValidSession()).toBe(true);
    await secureStorage.clearTokens();
    expect(await secureStorage.hasValidSession()).toBe(false);
    expect(await secureStorage.getAccessToken()).toBeNull();
  });
});
