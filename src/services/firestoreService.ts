import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Transaction, Account, UserActivityLog } from '../types';

const TRANSACTIONS_COLLECTION = 'transactions';
const ACCOUNTS_COLLECTION = 'accounts';
const ACTIVITY_LOGS_COLLECTION = 'activity_logs';

/**
 * Subscribe to real-time transactions from Firestore
 */
export function subscribeToTransactions(
  onData: (transactions: Transaction[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const colRef = collection(db, TRANSACTIONS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Transaction[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Transaction);
      });
      // Sort chronologically and by ID
      items.sort((a, b) => {
        const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        return a.id - b.id;
      });
      onData(items);
    },
    (error) => {
      console.error('Transactions onSnapshot error:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, TRANSACTIONS_COLLECTION);
    }
  );
}

/**
 * Fetch all transactions from Firestore using getDocs
 */
export async function getTransactionsFromFirestore(): Promise<Transaction[]> {
  try {
    const colRef = collection(db, TRANSACTIONS_COLLECTION);
    const snapshot = await getDocs(colRef);
    const items: Transaction[] = [];
    snapshot.forEach((docSnap) => {
      items.push(docSnap.data() as Transaction);
    });
    items.sort((a, b) => {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.id - b.id;
    });
    return items;
  } catch (error) {
    console.error('[Firestore Error] Failed fetching transactions with getDocs:', error);
    return [];
  }
}

/**
 * Save or update a transaction in Firestore using setDoc
 */
export async function saveTransactionToFirestore(transaction: Transaction): Promise<void> {
  const path = `${TRANSACTIONS_COLLECTION}/${transaction.id}`;
  try {
    const docRef = doc(db, TRANSACTIONS_COLLECTION, String(transaction.id));
    await setDoc(docRef, transaction);
    console.log(`[Firestore] Successfully saved transaction #${transaction.id} (${transaction.type}) to collection "${TRANSACTIONS_COLLECTION}"`);
  } catch (error) {
    console.error(`[Firestore Error] Failed saving transaction #${transaction.id} to "${path}":`, error);
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete a transaction from Firestore using deleteDoc
 */
export async function deleteTransactionFromFirestore(transactionId: number): Promise<void> {
  const path = `${TRANSACTIONS_COLLECTION}/${transactionId}`;
  try {
    const docRef = doc(db, TRANSACTIONS_COLLECTION, String(transactionId));
    await deleteDoc(docRef);
    console.log(`[Firestore] Successfully deleted transaction #${transactionId} from collection "${TRANSACTIONS_COLLECTION}"`);
  } catch (error) {
    console.error(`[Firestore Error] Failed deleting transaction #${transactionId} from "${path}":`, error);
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Subscribe to real-time accounts from Firestore
 */
export function subscribeToAccounts(
  onData: (accounts: Account[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const colRef = collection(db, ACCOUNTS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Account[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Account);
      });
      onData(items);
    },
    (error) => {
      console.error('Accounts onSnapshot error:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, ACCOUNTS_COLLECTION);
    }
  );
}

/**
 * Save or update an account in Firestore
 */
export async function saveAccountToFirestore(account: Account): Promise<void> {
  const path = `${ACCOUNTS_COLLECTION}/${account.id}`;
  try {
    const docRef = doc(db, ACCOUNTS_COLLECTION, account.id);
    await setDoc(docRef, account);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete an account from Firestore
 */
export async function deleteAccountFromFirestore(accountId: string): Promise<void> {
  const path = `${ACCOUNTS_COLLECTION}/${accountId}`;
  try {
    const docRef = doc(db, ACCOUNTS_COLLECTION, accountId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Subscribe to real-time user activity logs
 */
export function subscribeToActivityLogs(
  onData: (logs: UserActivityLog[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const colRef = collection(db, ACTIVITY_LOGS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: UserActivityLog[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as UserActivityLog);
      });
      items.sort((a, b) => b.sequence - a.sequence);
      onData(items);
    },
    (error) => {
      console.error('Activity logs onSnapshot error:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, ACTIVITY_LOGS_COLLECTION);
    }
  );
}

/**
 * Save an activity log entry
 */
export async function saveActivityLogToFirestore(log: UserActivityLog): Promise<void> {
  const path = `${ACTIVITY_LOGS_COLLECTION}/${log.id}`;
  try {
    const docRef = doc(db, ACTIVITY_LOGS_COLLECTION, log.id);
    await setDoc(docRef, log);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Initialize Firestore data with existing local data if Firestore is empty
 */
export async function seedInitialFirestoreData(
  initialTransactions: Transaction[],
  initialAccounts: Account[],
  initialLogs: UserActivityLog[]
): Promise<boolean> {
  try {
    const txSnapshot = await getDocs(collection(db, TRANSACTIONS_COLLECTION));
    if (txSnapshot.empty && initialTransactions.length > 0) {
      const batch = writeBatch(db);
      for (const tx of initialTransactions) {
        batch.set(doc(db, TRANSACTIONS_COLLECTION, String(tx.id)), tx);
      }
      for (const acc of initialAccounts) {
        batch.set(doc(db, ACCOUNTS_COLLECTION, acc.id), acc);
      }
      for (const lg of initialLogs) {
        batch.set(doc(db, ACTIVITY_LOGS_COLLECTION, lg.id), lg);
      }
      await batch.commit();
      return true;
    }
    return false;
  } catch (error) {
    console.warn('Could not auto-seed Firestore data:', error);
    return false;
  }
}
