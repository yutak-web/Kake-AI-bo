export type WalletType = "bank" | "other" | "card";

export interface Wallet {
  id: string;
  userId?: string;
  name: string;
  order?: number;
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
  order?: number;
  type: "income" | "expense";
  color?: string;
}

export type TransactionType = "income" | "expense" | "transfer";

export interface Transaction {
  id: string;
  userId: string;
  date: string; // ISO format
  createdAt?: string; // 登録日時 (ISO format)
  amount: number;
  type: TransactionType;
  fromWalletId?: string; // used for expense and transfer
  toWalletId?: string; // used for income and transfer
  categoryId?: string;
  creditPaymentDate?: string; // クレカの引き落とし日 (ISO format)
  isReimbursement?: boolean; // 立替申請フラグ
  isReimbursed?: boolean; // 立替済みフラグ
  description: string; // "内容"
  note: string; // "備考"
}
