"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,      // <--- ADDED
  GoogleAuthProvider,   // <--- ADDED
  updateProfile,
  signOut,
  User 
} from "firebase/auth";
import { auth, db } from "@/lib/firebase"; // Cleaned up imports
import { doc, onSnapshot } from "firebase/firestore";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  logOut: () => Promise<void>;         // <--- RENAMED (was logout)
  googleSignIn: () => Promise<void>;   // <--- ADDED
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  signIn: async () => {},
  signUp: async () => {},
  logOut: async () => {},
  googleSignIn: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Listen for connection changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Admin Check Logic
  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    const adminRef = doc(db, "admins", user.uid);
    const unsub = onSnapshot(
      adminRef,
      (snap) => setIsAdmin(snap.exists()),
      () => setIsAdmin(false)
    );

    return () => unsub();
  }, [user]);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      console.error("Error signing in:", error);
      alert("Error signing in. Check console for details.");
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (result.user) {
        const safeName = (displayName ?? "").trim() || "Anonymous";
        await updateProfile(result.user, { displayName: safeName });
        setUser({ ...result.user, displayName: safeName });
      }
    } catch (error) {
      console.error("Error signing up:", error);
      alert("Error creating account. Check console for details.");
    }
  };

  // --- NEW: GOOGLE SIGN IN ---
  const googleSignIn = async () => {
    try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Google Sign In Error:", error);
    }
  };

  // --- RENAMED: logout -> logOut ---
  const logOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, signIn, signUp, logOut, googleSignIn }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);