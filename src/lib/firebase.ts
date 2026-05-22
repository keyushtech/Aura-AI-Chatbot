import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  collection,
  query,
  where,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Memory, ChatSession, ChatMessage } from '../types';

// Initialize core Firebase services
export const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);
export const auth = getAuth(firebaseApp);

const provider = new GoogleAuthProvider();
// Google Drive scope for file backing and retrieval
provider.addScope('https://www.googleapis.com/auth/drive');

// In-memory access token cache
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Callbacks container to solve race condition
let authSuccessCallback: ((user: User, token: string) => void) | null = null;
let authFailureCallback: (() => void) | null = null;

// --- Error Handling Specification conformance (3. Create error handlers) ---
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(p => ({
        providerId: p.providerId,
        email: p.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('[Aura Firestore Security Audit Exception]', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Connection validation on initial boot ---
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Aura database warning: client is offline.");
    }
  }
}

// --- Auth state manager ---
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  if (onAuthSuccess) authSuccessCallback = onAuthSuccess;
  if (onAuthFailure) authFailureCallback = onAuthFailure;

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const token = cachedAccessToken || localStorage.getItem('aura_drive_token');
      if (token) {
        cachedAccessToken = token;
        if (onAuthSuccess) onAuthSuccess(user, token);
      } else {
        if (!isSigningIn) {
          cachedAccessToken = null;
          if (onAuthFailure) onAuthFailure();
        }
      }
    } else {
      cachedAccessToken = null;
      localStorage.removeItem('aura_drive_token');
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    if (!token) {
      throw new Error('Failed to extract Google Drive OAuth access token from auth credential');
    }

    cachedAccessToken = token;
    localStorage.setItem('aura_drive_token', token);

    if (authSuccessCallback) {
      authSuccessCallback(result.user, token);
    }

    return { user: result.user, accessToken: token };
  } catch (error) {
    console.error('Sign in process failed:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  localStorage.removeItem('aura_drive_token');
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

// Helper to recursively remove undefined properties from an object for Firestore safety
function sanitizeForFirestore(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirestore(item));
  }
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        if (val !== undefined) {
          sanitized[key] = sanitizeForFirestore(val);
        }
      }
    }
    return sanitized;
  }
  return obj;
}

// --- Firestore synchronize operations ---

export async function saveMemoryToFirestore(memory: Memory, userId: string) {
  const model = sanitizeForFirestore({ ...memory, userId });
  const docPath = `memories/${memory.id}`;
  try {
    await setDoc(doc(db, 'memories', memory.id), model);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function deleteMemoryFromFirestore(memoryId: string, userId: string) {
  const docPath = `memories/${memoryId}`;
  try {
    await deleteDoc(doc(db, 'memories', memoryId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function saveSessionToFirestore(session: ChatSession, userId: string) {
  const model = sanitizeForFirestore({ ...session, userId });
  const docPath = `sessions/${session.id}`;
  try {
    await setDoc(doc(db, 'sessions', session.id), model);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function deleteSessionFromFirestore(sessionId: string, userId: string) {
  const docPath = `sessions/${sessionId}`;
  try {
    await deleteDoc(doc(db, 'sessions', sessionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function loadMemoriesFromFirestore(userId: string): Promise<Memory[]> {
  const colPath = 'memories';
  try {
    const q = query(collection(db, colPath), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const results: Memory[] = [];
    snapshot.forEach(d => {
      const data = d.data();
      results.push({
        id: data.id,
        fact: data.fact,
        category: data.category,
        createdAt: data.createdAt,
        sourceContext: data.sourceContext,
        isActive: data.isActive
      });
    });
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, colPath);
  }
}

export async function loadSessionsFromFirestore(userId: string): Promise<ChatSession[]> {
  const colPath = 'sessions';
  try {
    const q = query(collection(db, colPath), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const results: ChatSession[] = [];
    snapshot.forEach(d => {
      const data = d.data();
      results.push({
        id: data.id,
        title: data.title,
        createdAt: data.createdAt,
        messages: data.messages || []
      });
    });
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, colPath);
  }
}

// --- Google Drive integration APIs ---

// Structure representing an Aura Backup File in Drive
export interface DriveBackupFile {
  id: string;
  name: string;
  createdTime: string;
  size?: string;
}

export async function listDriveBackups(token: string): Promise<DriveBackupFile[]> {
  try {
    const queryStr = encodeURIComponent("name contains 'aura_brain_backup_' and mimeType = 'application/json' and trashed = false");
    const fields = 'files(id,name,createdTime,size)';
    const url = `https://www.googleapis.com/drive/v3/files?q=${queryStr}&fields=${fields}&orderBy=createdTime%20desc`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Google Drive API error listing Backups: ${response.statusText} (${errBody})`);
    }

    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error('listDriveBackups error:', error);
    throw error;
  }
}

export async function createDriveBackup(
  token: string,
  memories: Memory[],
  sessions: ChatSession[]
): Promise<DriveBackupFile> {
  try {
    const backupData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      memories,
      sessions
    };

    const boundary = 'AURA_BACKUP_BOUNDARY';
    const metadata = {
      name: `aura_brain_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
      mimeType: 'application/json'
    };

    const body = [
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      JSON.stringify(metadata),
      `--${boundary}`,
      'Content-Type: application/json',
      '',
      JSON.stringify(backupData),
      `--${boundary}--`
    ].join('\r\n');

    const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,createdTime,size';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Google Drive upload failed: ${response.statusText} (${errBody})`);
    }

    return await response.json();
  } catch (error) {
    console.error('createDriveBackup error:', error);
    throw error;
  }
}

export async function downloadDriveBackup(
  token: string,
  fileId: string
): Promise<{ memories: Memory[]; sessions: ChatSession[] }> {
  try {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Google Drive fetch file failed: ${response.statusText} (${errBody})`);
    }

    const data = await response.json();
    if (!data.memories || !data.sessions) {
      throw new Error('Invalid Aura backup file structure downloaded from Google Drive');
    }

    return {
      memories: data.memories,
      sessions: data.sessions
    };
  } catch (error) {
    console.error('downloadDriveBackup error:', error);
    throw error;
  }
}

export async function deleteDriveBackupFile(token: string, fileId: string): Promise<void> {
  try {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok && response.status !== 404) {
      const errBody = await response.text();
      throw new Error(`Google Drive file deletion failed: ${response.statusText} (${errBody})`);
    }
  } catch (error) {
    console.error('deleteDriveBackupFile error:', error);
    throw error;
  }
}
