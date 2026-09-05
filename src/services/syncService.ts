import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  User,
} from './firebase';
import { StorageService } from './storage';
import { CloudSyncStatus } from '../types';

let currentUser: User | null = null;
let currentSyncStatus: CloudSyncStatus = 'offline';
let lastSyncedAt: Date | null = null;
let unsubscribeSnapshot: (() => void) | null = null;
let writeTimeout: any = null;
let isApplyingRemoteChange = false;

type AuthListener = (user: User | null) => void;
type SyncStatusListener = (status: CloudSyncStatus, lastSyncedAt: Date | null, errorMessage?: string) => void;

const authListeners = new Set<AuthListener>();
const syncListeners = new Set<SyncStatusListener>();

function notifyAuth(user: User | null): void {
  authListeners.forEach((cb) => {
    try {
      cb(user);
    } catch (e) {
      console.error('Error in auth listener:', e);
    }
  });
}

function notifySync(status: CloudSyncStatus, lastSync: Date | null, err?: string): void {
  currentSyncStatus = status;
  if (lastSync) lastSyncedAt = lastSync;
  syncListeners.forEach((cb) => {
    try {
      cb(status, lastSyncedAt, err);
    } catch (e) {
      console.error('Error in sync listener:', e);
    }
  });
}

// Initialize Auth Listener & Realtime Sync
export function initSyncService(): () => void {
  // Listen to Auth State Changes
  const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    notifyAuth(user);

    // Clean up previous snapshot listener if any
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
      unsubscribeSnapshot = null;
    }

    if (user) {
      notifySync('syncing', null);
      const userDocRef = doc(db, 'users', user.uid);

      try {
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          // Cloud data exists, pull it down to client
          const cloudData = snap.data();
          isApplyingRemoteChange = true;
          StorageService.applyCloudState(cloudData, true);
          isApplyingRemoteChange = false;
          notifySync('synced', new Date());
        } else {
          // New user in cloud: push current local state to cloud
          const initialLocalData = StorageService.getFullDatabaseObject();
          await setDoc(userDocRef, {
            ...initialLocalData,
            userEmail: user.email,
            userName: user.displayName,
            updatedAt: serverTimestamp(),
          });
          notifySync('synced', new Date());
        }

        // Set up real-time listener for changes from other devices
        unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
          if (!docSnap.exists()) return;

          // If changes were made remotely (not pending local writes)
          if (!docSnap.metadata.hasPendingWrites) {
            const data = docSnap.data();
            isApplyingRemoteChange = true;
            StorageService.applyCloudState(data, true);
            isApplyingRemoteChange = false;
            notifySync('synced', new Date());
          }
        }, (err) => {
          console.error('Firestore snapshot subscription error:', err);
          notifySync('error', null, err.message);
        });

      } catch (err: any) {
        console.error('Error syncing with Firestore:', err);
        notifySync('error', null, err.message);
      }
    } else {
      notifySync('offline', null);
    }
  });

  // Listen to local StorageService modifications
  const unsubscribeStorage = StorageService.subscribe(() => {
    if (!currentUser || isApplyingRemoteChange) return;

    notifySync('syncing', null);

    if (writeTimeout) {
      clearTimeout(writeTimeout);
    }

    // Debounce writes to Firestore to avoid excessive database operations
    writeTimeout = setTimeout(async () => {
      if (!currentUser) return;
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const dataToSave = StorageService.getFullDatabaseObject();
        await setDoc(
          userDocRef,
          {
            ...dataToSave,
            updatedAt: serverTimestamp(),
            lastUpdatedBy: currentUser.email || 'user',
          },
          { merge: true }
        );
        notifySync('synced', new Date());
      } catch (err: any) {
        console.error('Failed to push changes to Firestore:', err);
        notifySync('error', null, err.message);
      }
    }, 800);
  });

  return () => {
    unsubscribeAuth();
    if (unsubscribeSnapshot) unsubscribeSnapshot();
    unsubscribeStorage();
    if (writeTimeout) clearTimeout(writeTimeout);
  };
}

export const SyncService = {
  getUser(): User | null {
    return currentUser;
  },
  getSyncStatus(): { status: CloudSyncStatus; lastSyncedAt: Date | null } {
    return { status: currentSyncStatus, lastSyncedAt };
  },
  async loginWithGoogle(): Promise<User> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      throw err;
    }
  },
  async logout(): Promise<void> {
    try {
      if (writeTimeout) clearTimeout(writeTimeout);
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }
      await signOut(auth);
      currentUser = null;
      notifyAuth(null);
      notifySync('offline', null);
    } catch (err: any) {
      console.error('Google Sign Out Error:', err);
      throw err;
    }
  },
  async forceSyncNow(): Promise<void> {
    if (!currentUser) return;
    notifySync('syncing', null);
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const dataToSave = StorageService.getFullDatabaseObject();
      await setDoc(
        userDocRef,
        {
          ...dataToSave,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      notifySync('synced', new Date());
    } catch (err: any) {
      console.error('Force sync error:', err);
      notifySync('error', null, err.message);
    }
  },
  subscribeAuth(cb: AuthListener): () => void {
    authListeners.add(cb);
    // Send current state immediately
    cb(currentUser);
    return () => authListeners.delete(cb);
  },
  subscribeSync(cb: SyncStatusListener): () => void {
    syncListeners.add(cb);
    // Send current state immediately
    cb(currentSyncStatus, lastSyncedAt);
    return () => syncListeners.delete(cb);
  },
};
