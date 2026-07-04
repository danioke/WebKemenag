import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Keep the provider configuration
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/drive.readonly');
provider.addScope('https://www.googleapis.com/auth/drive.metadata.readonly');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Read cached token from session storage or keep in memory
// To ensure a smooth UX across page reloads, we can cache in memory and optionally session storage (with care)
// The guideline says "Do NOT store the access token in localStorage or sessionStorage. Implement in-memory caching."
// So we will stick strictly to standard in-memory caching.

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan token akses dari Google Auth');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const logoutGoogle = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// Helper to make a file publicly readable
export const makeFilePublic = async (fileId: string, token: string): Promise<boolean> => {
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });
    return res.ok;
  } catch (error) {
    console.error('Gagal mengatur hak akses file ke publik:', error);
    return false;
  }
};

// Helper to upload a file to Google Drive and make it public
export const uploadFileToDrive = async (
  file: File,
  token: string,
  onProgress?: (percent: number) => void
): Promise<{ id: string; name: string; webViewLink: string; webContentLink: string; size: string } | null> => {
  try {
    // 1. Prepare Metadata
    const metadata = {
      name: file.name,
      mimeType: file.type,
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,size', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: form,
    });

    if (!res.ok) {
      throw new Error(`Upload gagal dengan status: ${res.status}`);
    }

    const data = await res.json();
    
    // 2. Make it public so visitors can see it
    await makeFilePublic(data.id, token);

    // Format size
    const sizeInKb = Math.round(Number(data.size || file.size) / 1024);
    const sizeStr = sizeInKb > 1024 ? `${(sizeInKb / 1024).toFixed(1)} MB` : `${sizeInKb} KB`;

    return {
      id: data.id,
      name: data.name,
      webViewLink: data.webViewLink,
      webContentLink: data.webContentLink,
      size: sizeStr,
    };
  } catch (error) {
    console.error('Gagal mengunggah file ke Google Drive:', error);
    return null;
  }
};

// Helper to list files from Google Drive
export const listDriveFiles = async (
  token: string,
  fileType: 'image' | 'video' | 'pdf' | 'all' = 'all'
): Promise<any[]> => {
  try {
    let mimeQuery = '';
    if (fileType === 'image') {
      mimeQuery = "and mimeType contains 'image/'";
    } else if (fileType === 'video') {
      mimeQuery = "and mimeType contains 'video/'";
    } else if (fileType === 'pdf') {
      mimeQuery = "and mimeType = 'application/pdf'";
    } else {
      mimeQuery = "and (mimeType contains 'image/' or mimeType contains 'video/' or mimeType = 'application/pdf')";
    }

    const q = `trashed = false ${mimeQuery}`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,webViewLink,webContentLink,thumbnailLink,size,createdTime)&orderBy=createdTime desc&pageSize=50`;

    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Gagal mengambil daftar file: ${res.status}`);
    }

    const data = await res.json();
    return data.files || [];
  } catch (error) {
    console.error('Error listing Drive files:', error);
    return [];
  }
};

// Convert standard Google Drive webViewLink to raw direct view link for images and videos
export const getDriveDirectUrl = (fileId: string): string => {
  return `https://docs.google.com/uc?export=view&id=${fileId}`;
};

export const getDriveEmbedUrl = (fileId: string): string => {
  return `https://drive.google.com/file/d/${fileId}/preview`;
};
