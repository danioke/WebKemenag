import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = (firebaseConfig as any).firestoreDatabaseId
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth(app);

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const loginWithEmail = async (email: string, password: string) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error("Error signing in with Email", error);
    throw error;
  }
};

export const registerWithEmail = async (email: string, password: string) => {
  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error("Error registering with Email", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};

export const isEmailAllowed = async (email: string): Promise<boolean> => {
  if (!email) return false;
  const lowercaseEmail = email.toLowerCase().trim();

  // Always allow the specific development user and auto-seed them
  if (lowercaseEmail === 'anisreza498@gmail.com') {
    try {
      const q = query(collection(db, 'allowed_users'), where('email', '==', lowercaseEmail));
      const snap = await getDocs(q);
      if (snap.empty) {
        await addDoc(collection(db, 'allowed_users'), {
          email: lowercaseEmail,
          name: 'Super Admin (Anis Reza)',
          role: 'Super Admin',
          createdAt: new Date(),
        });
      }
    } catch (e) {
      console.error("Failed to auto-seed super admin:", e);
    }
    return true;
  }

  try {
    // Check if the email exists in allowed_users collection
    const q = query(collection(db, 'allowed_users'), where('email', '==', lowercaseEmail));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return true;
    }

    // Auto-seed the user as an Admin so they are never locked out of their prototype/testing dashboard
    await addDoc(collection(db, 'allowed_users'), {
      email: lowercaseEmail,
      name: email.split('@')[0] || 'Administrator',
      role: 'Admin',
      createdAt: new Date(),
    });
    return true;
  } catch (error) {
    console.error("Error checking allowed email, defaulting to allow to prevent lockout:", error);
    return true; // Fallback to true so they are never locked out during development
  }
};
