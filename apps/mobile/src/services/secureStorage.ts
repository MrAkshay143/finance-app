import * as Keychain from 'react-native-keychain';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

const TOKEN_SERVICE = 'finance_tracker_auth_tokens';

class SecureStorageService {
  private inMemoryTokens: AuthTokens | null = null;

  // Securely persist access and refresh tokens in Keychain or Keystore
  async saveTokens(tokens: AuthTokens): Promise<void> {
    this.inMemoryTokens = tokens;
    try {
      await Keychain.setGenericPassword('auth_session', JSON.stringify(tokens), {
        service: TOKEN_SERVICE,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } catch (error) {
      // Fall back to in-memory tokens when native keychain is unavailable
    }
  }

  // Retrieve cached or persisted session tokens
  async getTokens(): Promise<AuthTokens | null> {
    if (this.inMemoryTokens) {
      return this.inMemoryTokens;
    }

    try {
      const credentials = await Keychain.getGenericPassword({
        service: TOKEN_SERVICE,
      });

      if (credentials && credentials.password) {
        const parsed = JSON.parse(credentials.password) as AuthTokens;
        this.inMemoryTokens = parsed;
        return parsed;
      }
    } catch (error) {
      // Silently handle keychain lookup errors and return null
    }

    return null;
  }

  // Retrieve current session access token
  async getAccessToken(): Promise<string | null> {
    const tokens = await this.getTokens();
    return tokens?.accessToken ?? null;
  }

  // Retrieve current session refresh token
  async getRefreshToken(): Promise<string | null> {
    const tokens = await this.getTokens();
    return tokens?.refreshToken ?? null;
  }

  // Update access token while retaining current refresh token
  async updateAccessToken(newAccessToken: string): Promise<void> {
    const current = await this.getTokens();
    if (current) {
      await this.saveTokens({
        accessToken: newAccessToken,
        refreshToken: current.refreshToken,
      });
    } else {
      await this.saveTokens({
        accessToken: newAccessToken,
        refreshToken: '',
      });
    }
  }

  // Clear tokens from memory and keychain on logout or session expiration
  async clearTokens(): Promise<void> {
    this.inMemoryTokens = null;
    try {
      await Keychain.resetGenericPassword({
        service: TOKEN_SERVICE,
      });
    } catch (error) {
      // Ignore keychain reset errors during teardown
    }
  }

  // Check whether active session access token exists
  async hasValidSession(): Promise<boolean> {
    const tokens = await this.getTokens();
    return Boolean(tokens?.accessToken);
  }
}

export const secureStorage = new SecureStorageService();
