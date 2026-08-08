import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  signInAnonymously,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { StudySession } from '../types';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);

// Initialize Firestore with specific database ID if configured
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const googleProvider = new GoogleAuthProvider();

// User Auth State Listener
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// Auth Actions
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      try {
        await setDoc(doc(db, 'users', result.user.uid), {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName || result.user.email?.split('@')[0],
          photoURL: result.user.photoURL,
          lastLoginAt: new Date().toISOString()
        }, { merge: true });
      } catch (fsErr) {
        console.warn('Firestore user profile notice:', fsErr);
      }
    }
    return result.user;
  } catch (error: any) {
    console.warn('Google Auth notice:', error?.code || error?.message);
    throw error;
  }
}

export async function loginWithEmail(email: string, pass: string) {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  return result.user;
}

export async function registerWithEmail(email: string, pass: string, name?: string) {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  if (result.user && name) {
    try {
      await updateProfile(result.user, { displayName: name });
    } catch (profErr) {
      console.warn('Profile update notice:', profErr);
    }
  }
  if (result.user) {
    try {
      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid,
        email: result.user.email,
        displayName: name || email.split('@')[0],
        createdAt: new Date().toISOString()
      }, { merge: true });
    } catch (fsErr) {
      console.warn('Firestore user profile notice:', fsErr);
    }
  }
  return result.user;
}

export async function loginAnonymously() {
  const result = await signInAnonymously(auth);
  if (result.user) {
    try {
      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid,
        displayName: 'Aluno Convidado',
        createdAt: new Date().toISOString()
      }, { merge: true });
    } catch (fsErr) {
      console.warn('Firestore guest profile notice:', fsErr);
    }
  }
  return result.user;
}

export async function logoutUser() {
  await signOut(auth);
}

// Real-time Firestore Listener for User's Study Sessions
export function subscribeToUserStudies(userId: string, onUpdate: (sessions: StudySession[]) => void) {
  const userStudiesRef = collection(db, 'users', userId, 'studies');
  
  return onSnapshot(userStudiesRef, (snapshot) => {
    const sessionsList: StudySession[] = [];
    snapshot.forEach((docSnap) => {
      sessionsList.push(docSnap.data() as StudySession);
    });

    // Sort by lastAccessedAt or createdAt descending
    sessionsList.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    onUpdate(sessionsList);
  }, (error) => {
    console.warn('Firestore subscription notice (using local storage mode):', error?.message || error);
  });
}

// Save or Update Study Session in Firestore
export async function saveStudySessionToFirestore(userId: string, session: StudySession) {
  try {
    const sessionDocRef = doc(db, 'users', userId, 'studies', session.id);
    const sessionData = {
      ...session,
      userId,
      lastAccessedAt: new Date().toISOString()
    };
    await setDoc(sessionDocRef, sessionData, { merge: true });
  } catch (error) {
    console.warn('Firestore save notice (using local storage mode):', error);
  }
}

// Delete Study Session from Firestore
export async function deleteStudySessionFromFirestore(userId: string, sessionId: string) {
  try {
    const sessionDocRef = doc(db, 'users', userId, 'studies', sessionId);
    await deleteDoc(sessionDocRef);
  } catch (error) {
    console.warn('Firestore delete notice (using local storage mode):', error);
  }
}
