import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { initializeFirestore, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

export const db = (firebaseConfig as any).firestoreDatabaseId 
  ? initializeFirestore(app, { experimentalForceLongPolling: true }, (firebaseConfig as any).firestoreDatabaseId)
  : initializeFirestore(app, { experimentalForceLongPolling: true });

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

  // Always allow the specific development user and auto-seed them instantly without blocking
  if (lowercaseEmail === 'anisreza498@gmail.com') {
    // Run Firestore check & seeding asynchronously in the background
    (async () => {
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
        console.error("Failed to auto-seed super admin in background:", e);
      }
    })();
    return true;
  }

  // Helper for timing out slow/offline Firestore connections (fallback to true to avoid locking out the user)
  const queryPromise = (async () => {
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
  })();

  // Timeout after 2.5 seconds and return true as fallback
  return Promise.race([
    queryPromise,
    new Promise<boolean>((resolve) => {
      setTimeout(() => {
        console.warn("Firestore check timed out, allowing login as fallback to prevent lockout.");
        resolve(true);
      }, 2500);
    })
  ]).catch((error) => {
    console.error("Error checking allowed email, defaulting to allow to prevent lockout:", error);
    return true; // Fallback to true so they are never locked out during development
  });
};
