import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App only once
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive',
];

const provider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach((scope) => {
  provider.addScope(scope);
});

export const ADMIN_EMAIL = 'mdmsakib2242@gmail.com';

export const isAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();
};

export const isAdminUser = (user: User | null | { email?: string | null }): boolean => {
  return isAdminEmail(user?.email);
};

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;
// Cache the access token in memory with localStorage + sessionStorage backing for persistence
let cachedAccessToken: string | null = null;
const TOKEN_STORAGE_KEY = 'letoile_google_access_token';

export const getStoredAccessToken = (): string | null => {
  if (cachedAccessToken) return cachedAccessToken;
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (local) {
        cachedAccessToken = local;
        return local;
      }
      const session = sessionStorage.getItem(TOKEN_STORAGE_KEY);
      if (session) {
        cachedAccessToken = session;
        return session;
      }
    } catch {}
  }
  return null;
};

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  if (typeof window !== 'undefined') {
    try {
      if (token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
        sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch {}
  }
};

export const ensureAccessToken = async (): Promise<string> => {
  const existing = getStoredAccessToken();
  if (existing) return existing;
  const res = await googleSignIn();
  if (res?.accessToken) {
    return res.accessToken;
  }
  throw new Error('Google authorization is required. Please sign in with Google to continue.');
};

// Initialize auth state listener.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const token = getStoredAccessToken() || '';
      if (onAuthSuccess) {
        onAuthSuccess(user, token);
      }
    } else {
      setCachedAccessToken(null);
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Must be called from a button click or user interaction
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    setCachedAccessToken(credential.accessToken);
    return { user: result.user, accessToken: credential.accessToken };
  } catch (error: unknown) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return getStoredAccessToken();
};

export const logout = async () => {
  await auth.signOut();
  setCachedAccessToken(null);
};

