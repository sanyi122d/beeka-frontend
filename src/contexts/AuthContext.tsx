import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../config/firebase";
import {
  onAuthStateChanged,
  signInWithEmailLink,
  sendSignInLinkToEmail,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  User
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface AppUser {
  uid: string;
  email: string | null;
  // ...other Firebase User fields you use
  profile_complete?: boolean;
  // ...add any other custom fields
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signInWithMagicLink: (email: string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  signOut: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<AppUser | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch profile from Firestore
        const userRef = doc(db, "users", firebaseUser.uid);
        let profileDoc = await getDoc(userRef);
        if (!profileDoc.exists()) {
          // If new user, create profile with profile_complete: false
          await setDoc(userRef, { profile_complete: false, email: firebaseUser.email });
          profileDoc = await getDoc(userRef);
        }
        setUser({ ...firebaseUser, ...profileDoc.data() } as AppUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Firebase "magic link" (email link sign-in)
  const signInWithMagicLink = async (email: string) => {
    const actionCodeSettings = {
      url: window.location.origin + "/signin", // This should match your sign-in route
      handleCodeInApp: true,
    };
    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem("emailForSignIn", email);
      return null;
    } catch (error) {
      return error;
    }
  };

  // Google sign-in
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      return null;
    } catch (error) {
      return error;
    }
  };

  // Sign out
  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithMagicLink, signInWithGoogle, signOut, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};