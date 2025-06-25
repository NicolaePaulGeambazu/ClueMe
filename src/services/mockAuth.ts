import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateAnonymousId } from '../utils/authUtils';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAnonymous: boolean;
}

class MockAuthService {
  private storageKeys = {
    currentUser: 'mock_current_user',
    anonymousId: 'mock_anonymous_id',
  };

  async getCurrentUser(): Promise<User | null> {
    try {
      const stored = await AsyncStorage.getItem(this.storageKeys.currentUser);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async createAnonymousUser(): Promise<User> {
    try {
      const anonymousId = generateAnonymousId();
      const user: User = {
        uid: anonymousId,
        email: null,
        displayName: null,
        isAnonymous: true,
      };

      await AsyncStorage.setItem(this.storageKeys.currentUser, JSON.stringify(user));
      await AsyncStorage.setItem(this.storageKeys.anonymousId, anonymousId);

      return user;
    } catch (error) {
      console.error('Error creating anonymous user:', error);
      throw error;
    }
  }

  async signIn(email: string, password: string): Promise<User> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock validation
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const user: User = {
        uid: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        displayName: email.split('@')[0],
        isAnonymous: false,
      };

      await AsyncStorage.setItem(this.storageKeys.currentUser, JSON.stringify(user));
      await AsyncStorage.removeItem(this.storageKeys.anonymousId);

      return user;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  async signUp(email: string, password: string, displayName?: string): Promise<User> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock validation
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const user: User = {
        uid: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        displayName: displayName || email.split('@')[0],
        isAnonymous: false,
      };

      await AsyncStorage.setItem(this.storageKeys.currentUser, JSON.stringify(user));
      await AsyncStorage.removeItem(this.storageKeys.anonymousId);

      return user;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  async upgradeFromAnonymous(email: string, password: string, displayName?: string): Promise<User> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1200));

      const user: User = {
        uid: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        displayName: displayName || email.split('@')[0],
        isAnonymous: false,
      };

      await AsyncStorage.setItem(this.storageKeys.currentUser, JSON.stringify(user));
      await AsyncStorage.removeItem(this.storageKeys.anonymousId);

      return user;
    } catch (error) {
      console.error('Upgrade error:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.storageKeys.currentUser);
      
      // Create new anonymous user
      await this.createAnonymousUser();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock validation
      if (!email) {
        throw new Error('Email is required');
      }

      // In a real app, this would send a password reset email
      console.log('Password reset email sent to:', email);
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  async deleteAccount(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.storageKeys.currentUser);
      await AsyncStorage.removeItem(this.storageKeys.anonymousId);
      
      // Create new anonymous user
      await this.createAnonymousUser();
    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    }
  }

  // Initialize auth state
  async initializeAuth(): Promise<User> {
    try {
      const currentUser = await this.getCurrentUser();
      
      if (currentUser) {
        return currentUser;
      }

      // Check for existing anonymous session
      const anonymousId = await AsyncStorage.getItem(this.storageKeys.anonymousId);
      
      if (anonymousId) {
        const user: User = {
          uid: anonymousId,
          email: null,
          displayName: null,
          isAnonymous: true,
        };
        
        await AsyncStorage.setItem(this.storageKeys.currentUser, JSON.stringify(user));
        return user;
      }

      // Create new anonymous user
      return await this.createAnonymousUser();
    } catch (error) {
      console.error('Initialize auth error:', error);
      // Fallback to creating anonymous user
      return await this.createAnonymousUser();
    }
  }
}

export const mockAuthService = new MockAuthService();