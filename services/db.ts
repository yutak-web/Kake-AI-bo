import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { Wallet, Category, Transaction } from "../types";

import { auth } from "../firebase";

// Get current user ID from Firebase Auth
const getUserId = () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not authenticated");
  }
  return user.uid;
};

// Wallet Operations
export const getWallets = async (): Promise<Wallet[]> => {
  try {
    const uid = getUserId();
    const q = query(collection(db, "wallets"), where("userId", "==", uid));
    const snapshot = await getDocs(q);
    const wallets = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as Wallet,
    );
    // Sort by order asc, nulls last
    return wallets.sort((a, b) => {
      const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });
  } catch (e) {
    console.warn(
      "Using default/empty wallets because user is not logged in:",
      e,
    );
    return [];
  }
};

export const addWallet = async (wallet: Omit<Wallet, "id" | "userId">) => {
  const uid = getUserId();
  const existingWallets = await getWallets();
  const maxOrder = existingWallets.reduce(
    (max, w) => Math.max(max, w.order || 0),
    0,
  );
  return addDoc(collection(db, "wallets"), {
    ...wallet,
    userId: uid,
    order: maxOrder + 1,
  });
};

export const updateWallet = async (id: string, wallet: Partial<Wallet>) => {
  const walletRef = doc(db, "wallets", id);
  return updateDoc(walletRef, wallet);
};

export const deleteWallet = async (id: string) => {
  const walletRef = doc(db, "wallets", id);
  return deleteDoc(walletRef);
};

export const updateWalletOrder = async (wallets: Wallet[]) => {
  const batchUpdates = wallets.map((w, index) => {
    const walletRef = doc(db, "wallets", w.id);
    return updateDoc(walletRef, { order: index });
  });
  await Promise.all(batchUpdates);
};

// Category Operations
export const getCategories = async (): Promise<Category[]> => {
  try {
    const uid = getUserId();
    const q = query(collection(db, "categories"), where("userId", "==", uid));
    const snapshot = await getDocs(q);
    const categories = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as Category,
    );
    // Sort by order asc, nulls last
    return categories.sort((a, b) => {
      const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });
  } catch (e) {
    console.warn(
      "Using default/empty categories because user is not logged in:",
      e,
    );
    return [];
  }
};

export const addCategory = async (
  category: Omit<Category, "id" | "userId">,
) => {
  const uid = getUserId();
  const existingCategories = await getCategories();
  const maxOrder = existingCategories.reduce(
    (max, c) => Math.max(max, c.order || 0),
    0,
  );
  return addDoc(collection(db, "categories"), {
    ...category,
    userId: uid,
    order: maxOrder + 1,
  });
};

export const updateCategory = async (
  id: string,
  category: Partial<Category>,
) => {
  const categoryRef = doc(db, "categories", id);
  return updateDoc(categoryRef, category);
};

export const deleteCategory = async (id: string) => {
  const categoryRef = doc(db, "categories", id);
  return deleteDoc(categoryRef);
};

export const updateCategoryOrder = async (categories: Category[]) => {
  const batchUpdates = categories.map((c, index) => {
    const categoryRef = doc(db, "categories", c.id);
    return updateDoc(categoryRef, { order: index });
  });
  await Promise.all(batchUpdates);
};

// Transaction Operations
export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    const uid = getUserId();
    const q = query(collection(db, "transactions"), where("userId", "==", uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as Transaction,
    );
  } catch (e) {
    console.warn(
      "Using default/empty transactions because user is not logged in:",
      e,
    );
    return [];
  }
};

export const addTransaction = async (
  tx: Omit<Transaction, "id" | "userId">,
) => {
  const uid = getUserId();
  return addDoc(collection(db, "transactions"), { ...tx, userId: uid });
};

export const updateTransaction = async (
  id: string,
  tx: Partial<Transaction>,
) => {
  const txRef = doc(db, "transactions", id);
  return updateDoc(txRef, tx);
};

export const deleteTransaction = async (id: string) => {
  const txRef = doc(db, "transactions", id);
  return deleteDoc(txRef);
};
