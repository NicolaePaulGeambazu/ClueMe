import React, { createContext, useContext, useState, useEffect } from 'react';
import '@react-native-firebase/app';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { userService } from '../services/firebaseService';
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
  updateUserProfile: (updates: { displayName?: string; photoURL?: string }) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
              // Ensure user profile exists in Firestore
              try {
                await userService.createUserProfile({
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  displayName: firebaseUser.displayName,
                  isAnonymous: firebaseUser.isAnonymous,
                });
              } catch (profileError) {
                console.warn('Failed to create/update user profile:', profileError);
                // Don't fail the auth state change if profile creation fails
              }
              
              const convertedUser = convertFirebaseUserToUser(firebaseUser);
              setUser(convertedUser);
            } else {
              // Sign in anonymously if no user (Firebase handles persistence automatically)
              try {
                await auth().signInAnonymously();
              } catch (error) {
                setUser(null);
              }
            }
          } catch (error) {
            setUser(null);
          } finally {
            setIsLoading(false);
          }
        });

        return unsubscribe;
      } catch (error) {
        setIsLoading(false);
      }
    };

    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 10000); // 10 second timeout

    initializeAuth();

    return () => clearTimeout(timeoutId);
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const firebaseUser = userCredential.user;

      // Try to create user profile in Firebase
      try {
        await userService.createUserProfile({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          isAnonymous: firebaseUser.isAnonymous,
        });
      } catch (error) {
        console.warn('Failed to create user profile during sign in:', error);
        // Don't fail the sign in if profile creation fails
      }

      // Force update the user state since onAuthStateChanged might not trigger immediately
      const convertedUser = convertFirebaseUserToUser(firebaseUser);
      setUser(convertedUser);

    } catch (error: any) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    setIsLoading(true);
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const firebaseUser = userCredential.user;

      // Update display name if provided
      if (displayName) {
        await firebaseUser.updateProfile({ displayName });
      }

      // Try to create user profile in Firebase
      try {
        await userService.createUserProfile({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || displayName,
          isAnonymous: firebaseUser.isAnonymous,
        });
      } catch (error) {
      }

      // Force update the user state since onAuthStateChanged might not trigger immediately
      const convertedUser = convertFirebaseUserToUser(firebaseUser);
      setUser(convertedUser);

    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      const currentUser = auth().currentUser;
      if (currentUser) {
        await auth().signOut();
      }
      // The onAuthStateChanged listener will handle signing in anonymously
    } catch (error: any) {
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
      await auth().signInAnonymously();
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const upgradeFromAnonymous = async (email: string, password: string, displayName?: string) => {
    setIsLoading(true);
    try {
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

      // Try to create user profile in Firebase
      try {
        await userService.createUserProfile({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || displayName,
          isAnonymous: firebaseUser.isAnonymous,
        });
      } catch (error) {
      }

      // Force update the user state since onAuthStateChanged might not trigger immediately
      const convertedUser = convertFirebaseUserToUser(firebaseUser);
      setUser(convertedUser);

    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await auth().sendPasswordResetEmail(email);
    } catch (error) {
      throw error;
    }
  };

  const requireAuth = () => {
    return !user?.isAnonymous;
  };

  const updateUserProfile = async (updates: { displayName?: string; photoURL?: string }) => {
    setIsLoading(true);
    try {
      const currentUser = auth().currentUser;
      if (currentUser) {
        await currentUser.updateProfile(updates);
        const firebaseUser = currentUser;
        const convertedUser = convertFirebaseUserToUser(firebaseUser);
        setUser(convertedUser);
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
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
      updateUserProfile,
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
