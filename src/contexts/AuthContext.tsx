import React, { createContext, useContext, useState, useEffect } from 'react';
import '@react-native-firebase/app';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firebase from '@react-native-firebase/app';
import { Platform } from 'react-native';
import { userService, initializeFirebase } from '../services/firebaseService';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAnonymous: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAnonymous: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  upgradeFromAnonymous: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  requireAuth: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      console.log('🔍 Starting Firebase auth initialization...');
      console.log('📱 Platform:', Platform.OS);
      console.log('🔥 Firebase apps count:', firebase.apps.length);
      
      // Wait for Firebase to be ready
      let attempts = 0;
      const maxAttempts = 15; // Increased attempts
      
      while (attempts < maxAttempts) {
        try {
          // Check if Firebase is initialized
          if (firebase.apps.length > 0) {
            console.log('Firebase is initialized, proceeding with auth...');
            break;
          }
          console.log(`Firebase not ready, attempt ${attempts + 1}/${maxAttempts}`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Increased delay
          attempts++;
        } catch (error) {
          console.log('Firebase check failed, retrying...');
          await new Promise(resolve => setTimeout(resolve, 1000)); // Increased delay
          attempts++;
        }
      }

      if (attempts >= maxAttempts) {
        console.warn('Firebase failed to initialize after multiple attempts, continuing with anonymous auth...');
      }

      // Check if there's an existing user
      const currentUser = auth().currentUser;
      
      if (currentUser) {
        // User is already signed in
        const userData: User = {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          isAnonymous: currentUser.isAnonymous,
        };
        setUser(userData);
        
        // Only create profile if user is not anonymous and profile doesn't exist
        if (!currentUser.isAnonymous) {
          try {
            // Wait a bit more for native modules to be ready
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // First check if Firebase is available
            const firebaseAvailable = await initializeFirebase();
            if (!firebaseAvailable) {
              console.log('Firebase not available, skipping profile check/creation');
              return;
            }
            
            const existingProfile = await userService.getUserProfile(currentUser.uid);
            if (!existingProfile) {
              console.log('No existing profile found, creating new user profile...');
              await userService.createUserProfile(userData);
            } else {
              console.log('User profile already exists, skipping creation');
            }
          } catch (error) {
            console.warn('Failed to check/create user profile, continuing without Firestore:', error);
          }
        }
      } else {
        // No user signed in, sign in anonymously
        const anonymousUser = await auth().signInAnonymously();
        const userData: User = {
          uid: anonymousUser.user.uid,
          email: anonymousUser.user.email,
          displayName: anonymousUser.user.displayName,
          isAnonymous: anonymousUser.user.isAnonymous,
        };
        setUser(userData);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      // If there's an error, try to sign in anonymously as fallback
      try {
        const anonymousUser = await auth().signInAnonymously();
        const userData: User = {
          uid: anonymousUser.user.uid,
          email: anonymousUser.user.email,
          displayName: anonymousUser.user.displayName,
          isAnonymous: anonymousUser.user.isAnonymous,
        };
        setUser(userData);
      } catch (fallbackError) {
        console.error('Error signing in anonymously:', fallbackError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const userData: User = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        isAnonymous: userCredential.user.isAnonymous,
      };
      setUser(userData);
      
      // Only create profile if it doesn't already exist
      try {
        // First check if Firebase is available
        const firebaseAvailable = await initializeFirebase();
        if (!firebaseAvailable) {
          console.log('Firebase not available, skipping profile check/creation');
          return;
        }
        
        const existingProfile = await userService.getUserProfile(userCredential.user.uid);
        if (!existingProfile) {
          console.log('No existing profile found after sign in, creating new user profile...');
          await userService.createUserProfile(userData);
        } else {
          console.log('User profile already exists after sign in, skipping creation');
        }
      } catch (error) {
        console.warn('Failed to check/create user profile after sign in, continuing without Firestore:', error);
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      
      if (displayName) {
        await userCredential.user.updateProfile({ displayName });
      }
      
      const userData: User = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        isAnonymous: userCredential.user.isAnonymous,
      };
      setUser(userData);
      
      // Create new user profile in Firestore (new signup should always create profile)
      try {
        // First check if Firebase is available
        const firebaseAvailable = await initializeFirebase();
        if (!firebaseAvailable) {
          console.log('Firebase not available, skipping profile creation');
          return;
        }
        
        console.log('Creating new user profile after signup...');
        await userService.createUserProfile({
          ...userData,
          displayName: displayName || userData.displayName,
        });
      } catch (error) {
        console.warn('Failed to create user profile after sign up, continuing without Firestore:', error);
      }
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const upgradeFromAnonymous = async (email: string, password: string, displayName?: string) => {
    try {
      const credential = auth.EmailAuthProvider.credential(email, password);
      const userCredential = await auth().currentUser?.linkWithCredential(credential);
      
      if (userCredential && displayName) {
        await userCredential.user.updateProfile({ displayName });
      }
      
      if (userCredential) {
        const userData: User = {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
          isAnonymous: userCredential.user.isAnonymous,
        };
        setUser(userData);
        
        // Only create profile if it doesn't already exist
        try {
          // First check if Firebase is available
          const firebaseAvailable = await initializeFirebase();
          if (!firebaseAvailable) {
            console.log('Firebase not available, skipping profile check/creation');
            return;
          }
          
          const existingProfile = await userService.getUserProfile(userCredential.user.uid);
          if (!existingProfile) {
            console.log('No existing profile found after upgrade, creating new user profile...');
            await userService.createUserProfile({
              ...userData,
              displayName: displayName || userData.displayName,
            });
          } else {
            console.log('User profile already exists after upgrade, skipping creation');
          }
        } catch (error) {
          console.warn('Failed to check/create user profile after upgrade, continuing without Firestore:', error);
        }
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await auth().signOut();
      // After sign out, sign in anonymously
      const anonymousUser = await auth().signInAnonymously();
      const userData: User = {
        uid: anonymousUser.user.uid,
        email: anonymousUser.user.email,
        displayName: anonymousUser.user.displayName,
        isAnonymous: anonymousUser.user.isAnonymous,
      };
      setUser(userData);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await auth().sendPasswordResetEmail(email);
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  };

  const requireAuth = (): boolean => {
    return user?.isAnonymous === false;
  };

  const isAnonymous = user?.isAnonymous === true;

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAnonymous,
      signIn,
      signUp,
      upgradeFromAnonymous,
      signOut,
      resetPassword,
      requireAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}