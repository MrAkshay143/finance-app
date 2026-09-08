import * as Keychain from 'react-native-keychain';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

const TOKEN_SERVICE = 'finance_tracker_auth_tokens';

class SecureStorageService {
  private inMemoryTokens: AuthTokens | null = null;

  /**
   * Securely persist both access and refresh tokens in Keychain/Keystore.
   */
  async saveTokens(tokens: AuthTokens): Promise<void> {
    this.inMemoryTokens = tokens;
    try {
      await Keychain.setGenericPassword('auth_session', JSON.stringify(tokens), {
        service: TOKEN_SERVICE,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } catch (error) {
      // In non-native test environments or device fallback
      // In-memory tokens retain state
    }
  }

  /**
   * Retrieve both tokens from Keychain/Keystore.
   */
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
      // Fallback
    }

    return null;
  }

  /**
   * Retrieve the current access token.
   */
  async getAccessToken(): Promise<string | null> {
    const tokens = await this.getTokens();
    return tokens?.accessToken ?? null;
  }

  /**
   * Retrieve the current refresh token.
   */
  async getRefreshToken(): Promise<string | null> {
    const tokens = await this.getTokens();
    return tokens?.refreshToken ?? null;
  }

  /**
   * Update only the access token (e.g., following token refresh).
   */
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

  /**
   * Remove all tokens on logout or unauthorized response.
   */
  async clearTokens(): Promise<void> {
    this.inMemoryTokens = null;
    try {
      await Keychain.resetGenericPassword({
        service: TOKEN_SERVICE,
      });
    } catch (error) {
      // Fallback
    }
  }

  /**
   * Check if a valid session exists.
   */
  async hasValidSession(): Promise<boolean> {
    const tokens = await this.getTokens();
    return Boolean(tokens?.accessToken);
  }
}

export const secureStorage = new SecureStorageService();
