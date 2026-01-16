export type WalletType = "bank" | "other" | "card";

export interface Wallet {
  id: string;
  userId?: string;
  name: string;
  type: WalletType;
  initialBalance: number;
  color?: string;
  // For credit cards
  closingDay?: number;
  paymentDay?: number;
  initialPaymentAmount?: number;
  withdrawalWalletId?: string; // 引き落とし口座のID
}

export interface Category {
  id: string;
  userId?: string;
  name: string;
  type: "income" | "expense";
  color?: string;
}

export type TransactionType = "income" | "expense" | "transfer";

export interface Transaction {
  id: string;
  userId: string;
  date: string; // ISO format
  amount: number;
  type: TransactionType;
  fromWalletId?: string; // used for expense and transfer
  toWalletId?: string; // used for income and transfer
  categoryId?: string;
  description: string; // "内容"
  note: string; // "備考"
}
