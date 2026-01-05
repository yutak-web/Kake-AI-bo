
export type WalletType = 'bank' | 'other' | 'card';

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  initialBalance: number;
  currentBalance: number; // データベースに保存される現在の実残高
  color?: string;
  // For credit cards
  closingDay?: number;
  paymentDay?: number;
  initialPaymentAmount?: number;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color?: string;
}

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  userId: string;
  date: string; // ISO format
  amount: number;
  type: TransactionType;
  fromWalletId?: string; // used for expense and transfer
  toWalletId?: string;   // used for income and transfer
  categoryId?: string;
  description: string; // "内容"
  note: string;        // "備考"
}

export interface UserConfig {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
  lastLoginAt: string;
}
