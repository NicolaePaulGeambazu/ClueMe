import React, { createContext, useContext, useState, useEffect } from 'react';
import '@react-native-firebase/app';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { userService } from '../services/firebaseService';
import { taskTypeService } from '../services/firebaseService';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAnonymous: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInAnonymously: () => Promise<void>;
  upgradeFromAnonymous: (email: string, password: string, displayName?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  requireAuth: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to convert Firebase User to our User type
const convertFirebaseUserToUser = (firebaseUser: FirebaseAuthTypes.User): User => ({
  uid: firebaseUser.uid,
  email: firebaseUser.email,
  displayName: firebaseUser.displayName,
  photoURL: firebaseUser.photoURL,
  emailVerified: firebaseUser.emailVerified,
  isAnonymous: firebaseUser.isAnonymous,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Set up Firebase auth state listener
        const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
          try {
            if (firebaseUser) {
              console.log('🔥 Firebase user authenticated:', firebaseUser.uid, firebaseUser.isAnonymous ? '(anonymous)' : '');
              const convertedUser = convertFirebaseUserToUser(firebaseUser);
              setUser(convertedUser);
              
              // If user is authenticated and not anonymous, try to seed default task types
              if (!convertedUser.isAnonymous) {
                try {
                  console.log('🌱 Checking for default task types...');
                  const existingTypes = await taskTypeService.getAllTaskTypes();
                  if (existingTypes.length === 0) {
                    console.log('🌱 No task types found, seeding defaults...');
                    await taskTypeService.seedDefaultTaskTypes();
                    console.log('✅ Default task types seeded successfully');
                  } else {
                    console.log(`✅ Found ${existingTypes.length} existing task types`);
                  }
                } catch (error) {
                  console.warn('⚠️ Could not seed task types:', error);
                }
              }
            } else {
              console.log('🔥 No Firebase user, signing in anonymously...');
              // Sign in anonymously if no user (Firebase handles persistence automatically)
              try {
                await auth().signInAnonymously();
              } catch (error) {
                console.error('Error signing in anonymously:', error);
                setUser(null);
              }
            }
          } catch (error) {
            console.error('Error in auth state change:', error);
            setUser(null);
          } finally {
            setIsLoading(false);
          }
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error initializing auth:', error);
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log('🔥 Signing in with Firebase...');
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const firebaseUser = userCredential.user;
      
      console.log('✅ Firebase sign in successful:', firebaseUser.uid);
      
      // Try to create user profile in Firebase
      try {
        await userService.createUserProfile({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          isAnonymous: firebaseUser.isAnonymous,
        });
      } catch (error) {
        console.warn('Could not create Firebase user profile:', error);
      }
      
      // Seed default task types for new users
      try {
        console.log('🌱 Checking for default task types after sign in...');
        const existingTypes = await taskTypeService.getAllTaskTypes();
        if (existingTypes.length === 0) {
          console.log('🌱 No task types found, seeding defaults...');
          await taskTypeService.seedDefaultTaskTypes();
          console.log('✅ Default task types seeded successfully');
        }
      } catch (error) {
        console.warn('⚠️ Could not seed task types:', error);
      }
    } catch (error) {
      console.error('❌ Firebase sign in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    setIsLoading(true);
    try {
      console.log('🔥 Creating Firebase user...');
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const firebaseUser = userCredential.user;
      
      // Update display name if provided
      if (displayName) {
        await firebaseUser.updateProfile({ displayName });
      }
      
      console.log('✅ Firebase user created:', firebaseUser.uid);
      
      // Try to create user profile in Firebase
      try {
        await userService.createUserProfile({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || displayName,
          isAnonymous: firebaseUser.isAnonymous,
        });
      } catch (error) {
        console.warn('Could not create Firebase user profile:', error);
      }
      
      // Seed default task types for new users
      try {
        console.log('🌱 Seeding default task types for new user...');
        await taskTypeService.seedDefaultTaskTypes();
        console.log('✅ Default task types seeded successfully');
      } catch (error) {
        console.warn('⚠️ Could not seed task types:', error);
      }
    } catch (error) {
      console.error('❌ Firebase sign up error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      console.log('🔥 Signing out from Firebase...');
      const currentUser = auth().currentUser;
      if (currentUser) {
        await auth().signOut();
        console.log('✅ Firebase sign out successful');
      } else {
        console.log('ℹ️ No user currently signed in');
      }
      // The onAuthStateChanged listener will handle signing in anonymously
    } catch (error: any) {
      console.error('❌ Firebase sign out error:', error);
      // Don't throw error if no user is signed in
      if (error.code !== 'auth/no-current-user') {
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signInAnonymously = async () => {
    setIsLoading(true);
    try {
      console.log('🔥 Signing in anonymously with Firebase...');
      await auth().signInAnonymously();
      console.log('✅ Firebase anonymous sign in successful');
    } catch (error) {
      console.error('❌ Firebase anonymous sign in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const upgradeFromAnonymous = async (email: string, password: string, displayName?: string) => {
    setIsLoading(true);
    try {
      console.log('🔥 Upgrading anonymous user...');
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('No current user to upgrade');
      }

      // Create credential
      const credential = auth.EmailAuthProvider.credential(email, password);
      
      // Link the credential
      const userCredential = await currentUser.linkWithCredential(credential);
      const firebaseUser = userCredential.user;
      
      // Update display name if provided
      if (displayName) {
        await firebaseUser.updateProfile({ displayName });
      }
      
      console.log('✅ Firebase user upgraded:', firebaseUser.uid);
      
      // Try to create user profile in Firebase
      try {
        await userService.createUserProfile({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || displayName,
          isAnonymous: firebaseUser.isAnonymous,
        });
      } catch (error) {
        console.warn('Could not create Firebase user profile:', error);
      }
      
      // Seed default task types for upgraded users
      try {
        console.log('🌱 Seeding default task types for upgraded user...');
        await taskTypeService.seedDefaultTaskTypes();
        console.log('✅ Default task types seeded successfully');
      } catch (error) {
        console.warn('⚠️ Could not seed task types:', error);
      }
    } catch (error) {
      console.error('❌ Firebase upgrade error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      console.log('🔥 Sending password reset email...');
      await auth().sendPasswordResetEmail(email);
      console.log('✅ Password reset email sent');
    } catch (error) {
      console.error('❌ Firebase reset password error:', error);
      throw error;
    }
  };

  const requireAuth = () => {
    return !user?.isAnonymous;
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAnonymous: user?.isAnonymous || false,
      isLoading,
      signIn,
      signUp,
      signOut,
      signInAnonymously,
      upgradeFromAnonymous,
      resetPassword,
      requireAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};