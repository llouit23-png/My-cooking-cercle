import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, where, onSnapshot, getDocFromServer, FirestoreError } from 'firebase/firestore';

// Fallback config for local development/AI Studio
let firebaseConfig: any = {};
try {
  // @ts-ignore
  firebaseConfig = (await import('../firebase-applet-config.json')).default;
} catch (e) {
  // Config will be taken from environment variables if JSON is missing
}

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfig.measurementId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfig.firestoreDatabaseId
};

// Initialize Firebase
const app = initializeApp(config);
export const auth = getAuth(app);
export const db = getFirestore(app, config.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

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
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();

export { signInWithPopup, onAuthStateChanged, collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, where, onSnapshot };
export type { FirebaseUser };
