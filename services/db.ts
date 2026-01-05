
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc,
  runTransaction,
  getDoc,
  setDoc,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Wallet, Category, Transaction, UserConfig } from '../types';

const getUserId = () => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");
  return user.uid;
};

// --- User Operations ---
export const ensureUserExists = async (user: any) => {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  
  const userData: UserConfig = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    lastLoginAt: new Date().toISOString(),
    createdAt: userSnap.exists() ? userSnap.data().createdAt : new Date().toISOString()
  };

  await setDoc(userRef, userData, { merge: true });
  return userData;
};

// --- Wallet Operations ---
export const getWallets = async (): Promise<Wallet[]> => {
  const uid = getUserId();
  const q = query(collection(db, 'wallets'), where('userId', '==', uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Wallet));
};

export const addWallet = async (wallet: Omit<Wallet, 'id' | 'currentBalance'>) => {
  const uid = getUserId();
  // 新規作成時は currentBalance を initialBalance と同じにする
  return addDoc(collection(db, 'wallets'), { 
    ...wallet, 
    currentBalance: wallet.initialBalance,
    userId: uid 
  });
};

export const updateWallet = async (id: string, wallet: Partial<Wallet>) => {
  const walletRef = doc(db, 'wallets', id);
  // もし initialBalance が変更された場合、差分を残高に適用するなどのロジックが必要だが、
  // 現状は単純な上書きとする（必要に応じて拡張）
  return updateDoc(walletRef, wallet);
};

export const deleteWallet = async (id: string) => {
  const walletRef = doc(db, 'wallets', id);
  return deleteDoc(walletRef);
};

// --- Category Operations ---
export const getCategories = async (): Promise<Category[]> => {
  const uid = getUserId();
  const q = query(collection(db, 'categories'), where('userId', '==', uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
};

export const addCategory = async (category: Omit<Category, 'id'>) => {
  const uid = getUserId();
  return addDoc(collection(db, 'categories'), { ...category, userId: uid });
};

export const updateCategory = async (id: string, category: Partial<Category>) => {
  const categoryRef = doc(db, 'categories', id);
  return updateDoc(categoryRef, category);
};

export const deleteCategory = async (id: string) => {
  const categoryRef = doc(db, 'categories', id);
  return deleteDoc(categoryRef);
};

// --- Transaction Operations with Balance Update ---

// ヘルパー：残高更新ロジック
const adjustBalance = (transaction: any, walletId: string, amount: number, isAdding: boolean) => {
  // isAdding が true の場合は取引発生時の処理、false の場合は取引削除（取り消し）時の処理
  const factor = isAdding ? 1 : -1;
  
  if (transaction.type === 'expense') {
    return walletId === transaction.fromWalletId ? -(amount * factor) : 0;
  }
  if (transaction.type === 'income') {
    return walletId === transaction.toWalletId ? (amount * factor) : 0;
  }
  if (transaction.type === 'transfer') {
    if (walletId === transaction.fromWalletId) return -(amount * factor);
    if (walletId === transaction.toWalletId) return (amount * factor);
  }
  return 0;
};

export const addTransaction = async (txData: Omit<Transaction, 'id' | 'userId'>) => {
  const uid = getUserId();
  
  return await runTransaction(db, async (transaction) => {
    // 1. 財布の参照を取得
    const walletRefs: any = {};
    if (txData.fromWalletId) walletRefs.from = doc(db, 'wallets', txData.fromWalletId);
    if (txData.toWalletId) walletRefs.to = doc(db, 'wallets', txData.toWalletId);

    // 2. 残高を更新
    for (const key in walletRefs) {
      const walletSnap = await transaction.get(walletRefs[key]);
      if (!walletSnap.exists()) throw new Error("Wallet not found");
      const currentBal = walletSnap.data().currentBalance || 0;
      const change = adjustBalance(txData, walletSnap.id, txData.amount, true);
      transaction.update(walletRefs[key], { currentBalance: currentBal + change });
    }

    // 3. 取引ドキュメントを作成
    const newTxRef = doc(collection(db, 'transactions'));
    transaction.set(newTxRef, { ...txData, userId: uid });
    return newTxRef;
  });
};

export const deleteTransaction = async (id: string) => {
  return await runTransaction(db, async (transaction) => {
    const txRef = doc(db, 'transactions', id);
    const txSnap = await transaction.get(txRef);
    if (!txSnap.exists()) throw new Error("Transaction not found");
    const txData = txSnap.data() as Transaction;

    // 1. 財布の参照を取得して残高を戻す (isAdding = false)
    if (txData.fromWalletId) {
      const fromRef = doc(db, 'wallets', txData.fromWalletId);
      const snap = await transaction.get(fromRef);
      if (snap.exists()) {
        const change = adjustBalance(txData, snap.id, txData.amount, false);
        transaction.update(fromRef, { currentBalance: (snap.data().currentBalance || 0) + change });
      }
    }
    if (txData.toWalletId) {
      const toRef = doc(db, 'wallets', txData.toWalletId);
      const snap = await transaction.get(toRef);
      if (snap.exists()) {
        const change = adjustBalance(txData, snap.id, txData.amount, false);
        transaction.update(toRef, { currentBalance: (snap.data().currentBalance || 0) + change });
      }
    }

    // 2. 取引を削除
    transaction.delete(txRef);
  });
};

export const updateTransaction = async (id: string, newTxData: Partial<Transaction>) => {
  return await runTransaction(db, async (transaction) => {
    const txRef = doc(db, 'transactions', id);
    const txSnap = await transaction.get(txRef);
    if (!txSnap.exists()) throw new Error("Transaction not found");
    const oldTxData = txSnap.data() as Transaction;
    const finalTxData = { ...oldTxData, ...newTxData };

    // 1. 旧取引の影響をリセット
    const affectedWalletIds = new Set<string>();
    if (oldTxData.fromWalletId) affectedWalletIds.add(oldTxData.fromWalletId);
    if (oldTxData.toWalletId) affectedWalletIds.add(oldTxData.toWalletId);
    if (finalTxData.fromWalletId) affectedWalletIds.add(finalTxData.fromWalletId);
    if (finalTxData.toWalletId) affectedWalletIds.add(finalTxData.toWalletId);

    for (const wId of affectedWalletIds) {
      const wRef = doc(db, 'wallets', wId);
      const wSnap = await transaction.get(wRef);
      if (!wSnap.exists()) continue;

      let balance = wSnap.data().currentBalance || 0;
      // 旧取引を引く（元に戻す）
      balance += adjustBalance(oldTxData, wId, oldTxData.amount, false);
      // 新取引を足す（適用する）
      balance += adjustBalance(finalTxData, wId, finalTxData.amount, true);

      transaction.update(wRef, { currentBalance: balance });
    }

    // 2. 取引データを更新
    transaction.update(txRef, newTxData);
  });
};

export const getTransactions = async (): Promise<Transaction[]> => {
  const uid = getUserId();
  const q = query(collection(db, 'transactions'), where('userId', '==', uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
};
