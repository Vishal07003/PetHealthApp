import * as Keychain from 'react-native-keychain';
import { AuthTokens } from '../types/api';

const SERVICE_KEY = 'com.pethealth.auth';

export const TokenStorage = {
  /**
   * Save JWT tokens securely in Android Keystore / iOS Keychain.
   * Never stores credentials in plain AsyncStorage.
   */
  async saveTokens(tokens: AuthTokens): Promise<void> {
    try {
      const payload = JSON.stringify(tokens);
      await Keychain.setGenericPassword('auth_tokens', payload, {
        service: SERVICE_KEY,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
      });
    } catch (error) {
      console.error('Failed to securely save auth tokens:', error);
      throw error;
    }
  },

  /**
   * Retrieve JWT tokens securely.
   */
  async getTokens(): Promise<AuthTokens | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: SERVICE_KEY,
      });
      if (credentials && credentials.password) {
        return JSON.parse(credentials.password) as AuthTokens;
      }
      return null;
    } catch (error) {
      console.warn('Failed to retrieve tokens from secure storage:', error);
      return null;
    }
  },

  /**
   * Clear tokens on logout or session expiration.
   */
  async clearTokens(): Promise<void> {
    try {
      await Keychain.resetGenericPassword({
        service: SERVICE_KEY,
      });
    } catch (error) {
      console.error('Failed to clear secure auth tokens:', error);
    }
  },
};
