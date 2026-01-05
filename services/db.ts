
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Wallet, Category, Transaction } from '../types';

// 実際のログインユーザーIDを取得
const getUserId = () => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");
  return user.uid;
};

// Wallet Operations
export const getWallets = async (): Promise<Wallet[]> => {
  const uid = getUserId();
  const q = query(collection(db, 'wallets'), where('userId', '==', uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Wallet));
};

export const addWallet = async (wallet: Omit<Wallet, 'id'>) => {
  const uid = getUserId();
  return addDoc(collection(db, 'wallets'), { ...wallet, userId: uid });
};

export const updateWallet = async (id: string, wallet: Partial<Wallet>) => {
  const walletRef = doc(db, 'wallets', id);
  return updateDoc(walletRef, wallet);
};

export const deleteWallet = async (id: string) => {
  const walletRef = doc(db, 'wallets', id);
  return deleteDoc(walletRef);
};

// Category Operations
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

// Transaction Operations
export const getTransactions = async (): Promise<Transaction[]> => {
  const uid = getUserId();
  const q = query(collection(db, 'transactions'), where('userId', '==', uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
};

export const addTransaction = async (tx: Omit<Transaction, 'id' | 'userId'>) => {
  const uid = getUserId();
  return addDoc(collection(db, 'transactions'), { ...tx, userId: uid });
};

export const updateTransaction = async (id: string, tx: Partial<Transaction>) => {
  const txRef = doc(db, 'transactions', id);
  return updateDoc(txRef, tx);
};

export const deleteTransaction = async (id: string) => {
  const txRef = doc(db, 'transactions', id);
  return deleteDoc(txRef);
};
