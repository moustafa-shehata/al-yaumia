import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth, testConnection, signInWithGoogle, signOutUser } from '../firebase';

interface FirebaseContextType {
  firebaseUser: User | null;
  isAuthReady: boolean;
  isFirestoreConnected: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType>({
  firebaseUser: null,
  isAuthReady: false,
  isFirestoreConnected: false,
  loginWithGoogle: async () => {},
  logout: async () => {},
});

export const useFirebase = () => useContext(FirebaseContext);

export const FirebaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isFirestoreConnected, setIsFirestoreConnected] = useState(false);

  useEffect(() => {
    // 1. Mandatory connection test on boot as required by the Firebase Integration Skill
    testConnection().then((connected) => {
      setIsFirestoreConnected(connected);
    });

    // 2. Auth state observer with automatic anonymous sign-in fallback
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);
        setIsAuthReady(true);
      } else {
        try {
          const anon = await signInAnonymously(auth);
          setFirebaseUser(anon.user);
        } catch (err) {
          // If anonymous sign-in is not enabled in the Firebase console, proceed gracefully
          console.info('Firebase anonymous auth status:', err);
          setFirebaseUser(null);
        }
        setIsAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      await signInWithGoogle();
      // Re-verify connection upon authentication
      const connected = await testConnection();
      setIsFirestoreConnected(connected);
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await signOutUser();
    } catch (err) {
      console.error('Logout error:', err);
      throw err;
    }
  };

  return (
    <FirebaseContext.Provider
      value={{
        firebaseUser,
        isAuthReady,
        isFirestoreConnected,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};
