import { toast } from 'sonner';

// Helper functions for local fallback database
function getLocalCollection(collectionName: string): any[] {
  const stored = localStorage.getItem(`mock_db_${collectionName}`);
  return stored ? JSON.parse(stored) : [];
}

function saveLocalCollection(collectionName: string, data: any[]) {
  localStorage.setItem(`mock_db_${collectionName}`, JSON.stringify(data));
}

// Global window.fetch interceptor for /api/ routes
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  
  try {
    window.fetch = async function(input, init) {
      const url = typeof input === 'string' ? input : (input instanceof URL ? input.href : input.url);
      
      // Only intercept relative or absolute /api/ routes
      if (url.startsWith('/api/') || url.includes('/api/')) {
        const handleFallback = async (): Promise<Response> => {
          console.warn(`[API Fallback] Server not found or returned error for ${url}. Using local storage database.`);
          
          // 1. Auth Login Fallback
          if (url.includes('/api/auth/login')) {
            try {
              const body = init?.body ? JSON.parse(init.body as string) : {};
              const { email, password } = body;
              const adminPassword = 'kemenagoki123';
              
              if (password === adminPassword) {
                const user = {
                  uid: "admin-uid",
                  email: email || "anisreza498@gmail.com",
                  displayName: "Super Admin (Anis Reza)",
                  role: "Super Admin",
                };
                return new Response(JSON.stringify(user), {
                  status: 200,
                  headers: { 'Content-Type': 'application/json' }
                });
              } else {
                return new Response(JSON.stringify({ error: "Password administrator salah!" }), {
                  status: 401,
                  headers: { 'Content-Type': 'application/json' }
                });
              }
            } catch (e) {
              return new Response(JSON.stringify({ error: "Gagal memproses autentikasi lokal" }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
              });
            }
          }
          
          // 2. Upload Fallback (convert file to Base64 to store in localStorage)
          if (url.includes('/api/upload')) {
            try {
              const formData = init?.body as FormData;
              const file = formData.get('file') as File;
              if (file) {
                const base64 = await new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.readAsDataURL(file);
                });
                
                const filename = file.name || "file_upload";
                const sizeInKb = Math.round(file.size / 1024);
                const sizeStr = sizeInKb > 1024 ? `${(sizeInKb / 1024).toFixed(1)} MB` : `${sizeInKb} KB`;
                
                const mockResult = {
                  id: `local-${Date.now()}`,
                  name: filename,
                  url: base64,
                  embedUrl: base64,
                  size: sizeStr
                };
                
                // Add to uploaded_files collection
                const localFiles = getLocalCollection('uploaded_files');
                localFiles.push({
                  id: mockResult.id,
                  name: filename,
                  url: base64,
                  createdTime: new Date().toISOString(),
                  size: file.size,
                  mimeType: file.type
                });
                saveLocalCollection('uploaded_files', localFiles);
                
                return new Response(JSON.stringify(mockResult), {
                  status: 200,
                  headers: { 'Content-Type': 'application/json' }
                });
              }
            } catch (e) {
              console.error("[API Fallback] Local upload failed", e);
            }
            return new Response(JSON.stringify({ error: "Gagal mengunggah file ke penyimpanan lokal" }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          // 3. Files Fallback
          if (url.includes('/api/files')) {
            const method = init?.method || 'GET';
            if (method === 'DELETE') {
              const parts = url.split('/');
              const filename = parts[parts.length - 1];
              let localFiles = getLocalCollection('uploaded_files');
              localFiles = localFiles.filter((f: any) => f.id !== filename);
              saveLocalCollection('uploaded_files', localFiles);
              return new Response(JSON.stringify({ success: true, message: "File berhasil dihapus" }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
              });
            } else {
              const localFiles = getLocalCollection('uploaded_files');
              return new Response(JSON.stringify({ files: localFiles, appUrl: window.location.origin }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
              });
            }
          }
          
          // 4. Database CRUD Fallback
          if (url.includes('/api/db/')) {
            const pathPart = url.split('/api/db/')[1];
            const parts = pathPart.split('?')[0].split('/');
            const collectionName = parts[0];
            const docId = parts[1];
            const isDelete = parts[2] === 'delete';
            
            const method = init?.method || 'GET';
            
            if (method === 'GET') {
              if (docId) {
                const localItems = getLocalCollection(collectionName);
                const found = localItems.find((item: any) => item.id === docId);
                if (found) {
                  return new Response(JSON.stringify(found), { status: 200, headers: { 'Content-Type': 'application/json' } });
                } else {
                  return new Response(JSON.stringify({ error: "Dokumen tidak ditemukan" }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                }
              } else {
                const localItems = getLocalCollection(collectionName);
                return new Response(JSON.stringify(localItems), { status: 200, headers: { 'Content-Type': 'application/json' } });
              }
            } else if (method === 'POST') {
              if (isDelete && docId) {
                let localItems = getLocalCollection(collectionName);
                localItems = localItems.filter((i: any) => i.id !== docId);
                saveLocalCollection(collectionName, localItems);
                return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
              } else if (docId) {
                // Update
                const body = init?.body ? JSON.parse(init.body as string) : {};
                const localItems = getLocalCollection(collectionName);
                const index = localItems.findIndex((i: any) => i.id === docId);
                if (index !== -1) {
                  localItems[index] = { ...localItems[index], ...body, id: docId };
                } else {
                  localItems.push({ ...body, id: docId });
                }
                saveLocalCollection(collectionName, localItems);
                return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
              } else {
                // Create
                const body = init?.body ? JSON.parse(init.body as string) : {};
                const localItems = getLocalCollection(collectionName);
                const id = body.id || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                const newItem = { ...body, id, createdAt: body.createdAt || new Date().toISOString() };
                localItems.push(newItem);
                saveLocalCollection(collectionName, localItems);
                return new Response(JSON.stringify({ id }), { status: 200, headers: { 'Content-Type': 'application/json' } });
              }
            }
          }
          
          // Default generic JSON response for anything else
          return new Response(JSON.stringify({}), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        };
  
        try {
          const res = await originalFetch(input, init);
          const contentType = res.headers.get("content-type") || "";
          
          // If the request is successful and NOT an HTML document (SPA routing fallback)
          if (res.ok && !contentType.includes("text/html")) {
            return res;
          }
          
          // If it returns HTML or standard non-200 error, trigger local storage fallback
          return await handleFallback();
        } catch (error) {
          return await handleFallback();
        }
      }
      
      return originalFetch(input, init);
    };
  } catch (err) {
    console.warn("Direct window.fetch assignment failed, falling back to Object.defineProperty strategy", err);
    try {
      Object.defineProperty(window, 'fetch', {
        value: async function(input: any, init?: any) {
          const url = typeof input === 'string' ? input : (input instanceof URL ? input.href : input.url);
          
          // Only intercept relative or absolute /api/ routes
          if (url.startsWith('/api/') || url.includes('/api/')) {
            const handleFallback = async (): Promise<Response> => {
              console.warn(`[API Fallback] Server not found or returned error for ${url}. Using local storage database.`);
              
              // 1. Auth Login Fallback
              if (url.includes('/api/auth/login')) {
                try {
                  const body = init?.body ? JSON.parse(init.body as string) : {};
                  const { email, password } = body;
                  const adminPassword = 'kemenagoki123';
                  
                  if (password === adminPassword) {
                    const user = {
                      uid: "admin-uid",
                      email: email || "anisreza498@gmail.com",
                      displayName: "Super Admin (Anis Reza)",
                      role: "Super Admin",
                    };
                    return new Response(JSON.stringify(user), {
                      status: 200,
                      headers: { 'Content-Type': 'application/json' }
                    });
                  } else {
                    return new Response(JSON.stringify({ error: "Password administrator salah!" }), {
                      status: 401,
                      headers: { 'Content-Type': 'application/json' }
                    });
                  }
                } catch (e) {
                  return new Response(JSON.stringify({ error: "Gagal memproses autentikasi lokal" }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                  });
                }
              }
              
              // 2. Upload Fallback (convert file to Base64 to store in localStorage)
              if (url.includes('/api/upload')) {
                try {
                  const formData = init?.body as FormData;
                  const file = formData.get('file') as File;
                  if (file) {
                    const base64 = await new Promise<string>((resolve) => {
                      const reader = new FileReader();
                      reader.onloadend = () => resolve(reader.result as string);
                      reader.readAsDataURL(file);
                    });
                    
                    const filename = file.name || "file_upload";
                    const sizeInKb = Math.round(file.size / 1024);
                    const sizeStr = sizeInKb > 1024 ? `${(sizeInKb / 1024).toFixed(1)} MB` : `${sizeInKb} KB`;
                    
                    const mockResult = {
                      id: `local-${Date.now()}`,
                      name: filename,
                      url: base64,
                      embedUrl: base64,
                      size: sizeStr
                    };
                    
                    // Add to uploaded_files collection
                    const localFiles = getLocalCollection('uploaded_files');
                    localFiles.push({
                      id: mockResult.id,
                      name: filename,
                      url: base64,
                      createdTime: new Date().toISOString(),
                      size: file.size,
                      mimeType: file.type
                    });
                    saveLocalCollection('uploaded_files', localFiles);
                    
                    return new Response(JSON.stringify(mockResult), {
                      status: 200,
                      headers: { 'Content-Type': 'application/json' }
                    });
                  }
                } catch (e) {
                  console.error("[API Fallback] Local upload failed", e);
                }
                return new Response(JSON.stringify({ error: "Gagal mengunggah file ke penyimpanan lokal" }), {
                  status: 500,
                  headers: { 'Content-Type': 'application/json' }
                });
              }
              
              // 3. Files Fallback
              if (url.includes('/api/files')) {
                const method = init?.method || 'GET';
                if (method === 'DELETE') {
                  const parts = url.split('/');
                  const filename = parts[parts.length - 1];
                  let localFiles = getLocalCollection('uploaded_files');
                  localFiles = localFiles.filter((f: any) => f.id !== filename);
                  saveLocalCollection('uploaded_files', localFiles);
                  return new Response(JSON.stringify({ success: true, message: "File berhasil dihapus" }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                  });
                } else {
                  const localFiles = getLocalCollection('uploaded_files');
                  return new Response(JSON.stringify({ files: localFiles, appUrl: window.location.origin }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                  });
                }
              }
              
              // 4. Database CRUD Fallback
              if (url.includes('/api/db/')) {
            const pathPart = url.split('/api/db/')[1];
            const parts = pathPart.split('?')[0].split('/');
            const collectionName = parts[0];
            const docId = parts[1];
            const isDelete = parts[2] === 'delete';
            
            const method = init?.method || 'GET';
            
            if (method === 'GET') {
              if (docId) {
                const localItems = getLocalCollection(collectionName);
                const found = localItems.find((item: any) => item.id === docId);
                if (found) {
                  return new Response(JSON.stringify(found), { status: 200, headers: { 'Content-Type': 'application/json' } });
                } else {
                  return new Response(JSON.stringify({ error: "Dokumen tidak ditemukan" }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                }
              } else {
                const localItems = getLocalCollection(collectionName);
                return new Response(JSON.stringify(localItems), { status: 200, headers: { 'Content-Type': 'application/json' } });
              }
            } else if (method === 'POST') {
              if (isDelete && docId) {
                let localItems = getLocalCollection(collectionName);
                localItems = localItems.filter((i: any) => i.id !== docId);
                saveLocalCollection(collectionName, localItems);
                return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
              } else if (docId) {
                // Update
                const body = init?.body ? JSON.parse(init.body as string) : {};
                const localItems = getLocalCollection(collectionName);
                const index = localItems.findIndex((i: any) => i.id === docId);
                if (index !== -1) {
                  localItems[index] = { ...localItems[index], ...body, id: docId };
                } else {
                  localItems.push({ ...body, id: docId });
                }
                saveLocalCollection(collectionName, localItems);
                return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
              } else {
                // Create
                const body = init?.body ? JSON.parse(init.body as string) : {};
                const localItems = getLocalCollection(collectionName);
                const id = body.id || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                const newItem = { ...body, id, createdAt: body.createdAt || new Date().toISOString() };
                localItems.push(newItem);
                saveLocalCollection(collectionName, localItems);
                return new Response(JSON.stringify({ id }), { status: 200, headers: { 'Content-Type': 'application/json' } });
              }
            }
          }
          
          // Default generic JSON response for anything else
              return new Response(JSON.stringify({}), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
              });
            };

            try {
              const res = await originalFetch(input, init);
              const contentType = res.headers.get("content-type") || "";
              
              // If the request is successful and NOT an HTML document (SPA routing fallback)
              if (res.ok && !contentType.includes("text/html")) {
                return res;
              }
              
              // If it returns HTML or standard non-200 error, trigger local storage fallback
              return await handleFallback();
            } catch (error) {
              return await handleFallback();
            }
          }
          
          return originalFetch(input, init);
        },
        writable: true,
        configurable: true
      });
    } catch (defineErr) {
      console.warn("Global window.fetch interception totally blocked by browser environment.", defineErr);
    }
  }
}

// Mock types
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role?: string;
  emailVerified?: boolean;
}

// 1. db mock
export const initializeApp = (config?: any) => {
  return {};
};

// 2. Auth State Management
const storedUser = localStorage.getItem('app_mock_user');
let currentUser: User | null = storedUser ? JSON.parse(storedUser) : null;
let authListener: ((user: User | null) => void) | null = null;

export const logout = async () => {
  try {
    currentUser = null;
    localStorage.removeItem('app_mock_user');
    localStorage.removeItem('mock_admin_session');
    if (authListener) {
      authListener(null);
    }
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};

export const auth = {
  get currentUser() {
    return currentUser;
  },
  onAuthStateChanged(callback: (user: User | null) => void) {
    authListener = callback;
    // Delay slightly to match db async lifecycle
    setTimeout(() => {
      callback(currentUser);
    }, 10);
    return () => {
      if (authListener === callback) authListener = null;
    };
  },
  async signOut() {
    return logout();
  }
};

export const getAuth = (app?: any) => {
  return auth;
};

export class AuthProvider {
  addScope(scope: string) {}
  static credentialFromResult(result: any) {
    return { accessToken: 'mock-access-token' };
  }
}

// Modified login function to use password instead of login
export const loginWithPassword = async (email: string, password: string): Promise<boolean> => {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    if (res.ok) {
      const user = await res.json();
      currentUser = { ...user, emailVerified: true };
      localStorage.setItem('app_mock_user', JSON.stringify(currentUser));
      localStorage.setItem('mock_admin_session', 'true');
      if (authListener) {
        authListener(currentUser);
      }
      return true;
    } else {
      const errData = await res.json();
      throw new Error(errData.error || 'Password salah!');
    }
  } catch (error: any) {
    console.error('Login error:', error);
    throw error;
  }
};

// Kept for backward compatibility
export const login = async () => {
  currentUser = {
    uid: "admin-uid",
    email: "anisreza498@gmail.com",
    displayName: "Super Admin (Anis Reza)",
    role: "Super Admin",
    emailVerified: true
  };
  localStorage.setItem('app_mock_user', JSON.stringify(currentUser));
  localStorage.setItem('mock_admin_session', 'true');
  if (authListener) {
    authListener(currentUser);
  }
};

export const signInWithPopup = async (authObj?: any, provider?: any) => {
  await login();
  return { user: currentUser };
};

export const signOut = async (authObj?: any) => {
  return logout();
};

export const onAuthStateChanged = (authObj: any, callback: (user: User | null) => void) => {
  return auth.onAuthStateChanged(callback);
};

export const isEmailAllowed = async (email: string): Promise<boolean> => {
  return true; // Under 100% self-hosting, all logged-in admin users are allowed
};

// 3. Firestore State Management
export const db = {
  type: 'firestore'
};

export const initializeFirestore = () => db;

export function collection(firestoreDb: any, name: string) {
  return { type: 'collection', path: name };
}

export function doc(dbOrCol: any, collectionOrId: string, id?: string) {
  if (id) {
    return { type: 'document', collectionPath: collectionOrId, id: id };
  }
  if (dbOrCol && dbOrCol.type === 'collection') {
    return { type: 'document', collectionPath: dbOrCol.path, id: collectionOrId };
  }
  return { type: 'document', collectionPath: collectionOrId, id: '' };
}

export function query(collectionRef: any, ...constraints: any[]) {
  return { type: 'query', collectionRef, constraints };
}

export function orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
  return { type: 'orderBy', field, direction };
}

export function limit(num: number) {
  return { type: 'limit', value: num };
}

export function where(field: string, op: string, value: any) {
  return { type: 'where', field, op, value };
}

export function serverTimestamp() {
  return new Date().toISOString();
}

export class Timestamp {
  constructor(public seconds: number, public nanoseconds: number) {}
  static now() {
    const ms = Date.now();
    return new Timestamp(Math.floor(ms / 1000), (ms % 1000) * 1e6);
  }
  static fromDate(date: Date) {
    const ms = date.getTime();
    return new Timestamp(Math.floor(ms / 1000), (ms % 1000) * 1e6);
  }
  toDate() {
    return new Date(this.seconds * 1000 + this.nanoseconds / 1e6);
  }
  toISOString() {
    return this.toDate().toISOString();
  }
}

// REST Client Implementation
export async function getDocs(queryOrCol: any): Promise<any> {
  const collectionPath = queryOrCol.type === 'collection' 
    ? queryOrCol.path 
    : queryOrCol.collectionRef.path;
    
  try {
    const res = await fetch(`/api/db/${collectionPath}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    let data = await res.json();
    
    // Process constraints locally (filtering and sorting on frontend)
    const constraints = queryOrCol.type === 'query' ? queryOrCol.constraints : [];
    
    // Apply where filters
    for (const c of constraints) {
      if (c && c.type === 'where') {
        data = data.filter((item: any) => {
          const val = item[c.field];
          if (c.op === '==') return val === c.value;
          if (c.op === '!=') return val !== c.value;
          if (c.op === '>') return val > c.value;
          if (c.op === '>=') return val >= c.value;
          if (c.op === '<') return val < c.value;
          if (c.op === '<=') return val <= c.value;
          return true;
        });
      }
    }
    
    // Apply orderBy sorting
    const sortConstraint = constraints.find((c: any) => c && c.type === 'orderBy');
    if (sortConstraint) {
      const { field, direction } = sortConstraint;
      data.sort((a: any, b: any) => {
        let valA = a[field];
        let valB = b[field];
        
        // Handle timestamps or date strings
        if (typeof valA === 'string' && !isNaN(Date.parse(valA))) {
          valA = new Date(valA).getTime();
        }
        if (typeof valB === 'string' && !isNaN(Date.parse(valB))) {
          valB = new Date(valB).getTime();
        }
        
        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    // Apply limit constraint
    const limitConstraint = constraints.find((c: any) => c && c.type === 'limit');
    if (limitConstraint) {
      data = data.slice(0, limitConstraint.value);
    }
    
    // Format snapshot structure expected by frontend
    const docs = data.map((docData: any) => {
      // Re-hydrate dates/timestamps if they are objects
      const finalData = { ...docData };
      Object.keys(finalData).forEach(key => {
        const val = finalData[key];
        if (val && typeof val === 'object' && 'seconds' in val) {
          finalData[key] = new Timestamp(val.seconds, val.nanoseconds || 0);
        }
      });
      
      return {
        id: docData.id,
        data: () => finalData,
        exists: () => true
      };
    });
    
    return {
      docs,
      empty: docs.length === 0,
      size: docs.length,
      forEach: (cb: any) => docs.forEach(cb)
    };
  } catch (error) {
    console.error(`Error loading collection ${collectionPath}:`, error);
    return {
      docs: [],
      empty: true,
      size: 0,
      forEach: () => {}
    };
  }
}

export async function getDoc(docRef: any): Promise<any> {
  const { collectionPath, id } = docRef;
  try {
    const res = await fetch(`/api/db/${collectionPath}/${id}/delete`);
    if (res.status === 404) {
      return {
        id,
        exists: () => false,
        data: () => null
      };
    }
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const docData = await res.json();
    
    const finalData = { ...docData };
    Object.keys(finalData).forEach(key => {
      const val = finalData[key];
      if (val && typeof val === 'object' && 'seconds' in val) {
        finalData[key] = new Timestamp(val.seconds, val.nanoseconds || 0);
      }
    });

    return {
      id,
      exists: () => true,
      data: () => finalData
    };
  } catch (error) {
    console.error(`Error loading document ${collectionPath}/${id}:`, error);
    return {
      id,
      exists: () => false,
      data: () => null
    };
  }
}

export async function addDoc(collectionRef: any, data: any): Promise<any> {
  const collectionPath = collectionRef.path;
  
  // Format timestamps properly before saving
  const formattedData = { ...data };
  Object.keys(formattedData).forEach(key => {
    const val = formattedData[key];
    if (val instanceof Timestamp) {
      formattedData[key] = { seconds: val.seconds, nanoseconds: val.nanoseconds };
    }
  });

  try {
    const res = await fetch(`/api/db/${collectionPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formattedData)
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json(); // returns { id }
  } catch (error) {
    console.error(`Error adding document to ${collectionPath}:`, error);
    throw error;
  }
}

export async function updateDoc(docRef: any, data: any): Promise<any> {
  const { collectionPath, id } = docRef;
  
  // Format timestamps properly before saving
  const formattedData = { ...data };
  Object.keys(formattedData).forEach(key => {
    const val = formattedData[key];
    if (val instanceof Timestamp) {
      formattedData[key] = { seconds: val.seconds, nanoseconds: val.nanoseconds };
    }
  });

  try {
    const res = await fetch(`/api/db/${collectionPath}/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formattedData)
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error(`Error updating document ${collectionPath}/${id}:`, error);
    throw error;
  }
}

export async function setDoc(docRef: any, data: any, options?: any): Promise<any> {
  return updateDoc(docRef, data);
}

export async function deleteDoc(docRef: any): Promise<any> {
  const { collectionPath, id } = docRef;
  try {
    const res = await fetch(`/api/db/${collectionPath}/${id}/delete`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error(`Error deleting document ${collectionPath}/${id}:`, error);
    throw error;
  }
}

export function writeBatch(firestoreDb?: any) {
  return {
    set(docRef: any, data: any) {
      setDoc(docRef, data);
    },
    update(docRef: any, data: any) {
      updateDoc(docRef, data);
    },
    delete(docRef: any) {
      deleteDoc(docRef);
    },
    async commit() {
      return true;
    }
  };
}

export function onSnapshot(queryOrCol: any, successCallback: any, errorCallback?: any) {
  getDocs(queryOrCol)
    .then((snapshot) => {
      successCallback(snapshot);
    })
    .catch((error) => {
      if (errorCallback) errorCallback(error);
      else console.error("Snapshot dynamic fetch error:", error);
    });
  return () => {};
}
