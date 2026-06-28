import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  collection, 
  doc, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  getDoc,
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { SharedSession, EvaluationSubmission, EvaluationAnswers } from './types';

const firebaseConfig = {
  apiKey: "AIzaSyAOv83foIixVu4C0004kNB2ilIGVWo5cRY",
  authDomain: "astral-scholar-907pf.firebaseapp.com",
  projectId: "astral-scholar-907pf",
  storageBucket: "astral-scholar-907pf.firebasestorage.app",
  messagingSenderId: "5883385300",
  appId: "1:5883385300:web:e8a77b250b9a3f4d98b241"
};

const app = initializeApp(firebaseConfig);

// Use custom databaseId from config if provided
export const db = initializeFirestore(app, {}, "ai-studio-apreciacindeldis-77ef307a-158f-400c-ae1d-d7d06ca50756");
export const auth = getAuth(app);

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
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Helper: generate random simple ID or token
export function generateToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// 1. Create a shared session
export async function createSharedSession(
  orador: string,
  tema: string,
  congregacion: string,
  adminToken: string
): Promise<string> {
  const sessionsCol = collection(db, 'sessions');
  const dateObj = new Date();
  const shortMonths = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const fullMonths = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const currentShortDate = `${dateObj.getDate()} ${shortMonths[dateObj.getMonth()]}`;
  const currentFullDate = `${dateObj.getDate()} de ${fullMonths[dateObj.getMonth()]} de ${dateObj.getFullYear()}`;

  const sessionData = {
    orador,
    tema: tema || 'Discurso Público',
    congregacion: congregacion || 'Local',
    fecha: currentShortDate,
    fechaCompleta: currentFullDate,
    status: 'active' as const,
    adminToken,
    createdAt: new Date().toISOString()
  };

  try {
    const docRef = await addDoc(sessionsCol, sessionData);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'sessions');
  }
}

// 2. Real-time subscription to a single session
export function subscribeToSession(
  sessionId: string,
  onUpdate: (session: SharedSession | null) => void
) {
  const sessionRef = doc(db, 'sessions', sessionId);
  return onSnapshot(sessionRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate({ id: docSnap.id, ...docSnap.data() } as SharedSession);
    } else {
      onUpdate(null);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, `sessions/${sessionId}`);
  });
}

// 3. Real-time subscription to all sessions
export function subscribeToAllSessions(
  onUpdate: (sessions: SharedSession[]) => void
) {
  const sessionsCol = collection(db, 'sessions');
  const q = query(sessionsCol, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const list: SharedSession[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as SharedSession);
    });
    onUpdate(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'sessions');
  });
}

// 4. Real-time subscription to evaluations of a session
export function subscribeToEvaluations(
  sessionId: string,
  onUpdate: (evaluations: EvaluationSubmission[]) => void
) {
  const evalsCol = collection(db, 'sessions', sessionId, 'evaluations');
  const q = query(evalsCol, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const list: EvaluationSubmission[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as EvaluationSubmission);
    });
    onUpdate(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, `sessions/${sessionId}/evaluations`);
  });
}

// 5. Submit individual evaluation inside a session
export async function submitEvaluation(
  sessionId: string,
  userToken: string,
  respuestas: EvaluationAnswers,
  puntoFuerte: string,
  sugerencia: string
) {
  // Use userToken as the document ID in subcollection to allow editing/updating by the same user if needed,
  // or simple single-submission guarantee.
  const evalDocRef = doc(db, 'sessions', sessionId, 'evaluations', userToken);
  try {
    await setDoc(evalDocRef, {
      respuestas,
      puntoFuerte,
      sugerencia,
      userToken,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `sessions/${sessionId}/evaluations/${userToken}`);
  }
}

// 6. Finalize session
export async function finalizeSession(sessionId: string) {
  const sessionRef = doc(db, 'sessions', sessionId);
  try {
    await updateDoc(sessionRef, {
      status: 'finalized'
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `sessions/${sessionId}`);
  }
}

// 7. Delete session
export async function deleteSession(sessionId: string) {
  const sessionRef = doc(db, 'sessions', sessionId);
  try {
    await deleteDoc(sessionRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `sessions/${sessionId}`);
  }
}
