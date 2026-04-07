import React, { useState, useEffect } from "react";
import { Transaction, TransactionType, Wallet, Category } from "../types";

const formatDateLocal = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/** 取引日とクレカのclosingDay/paymentDayから引き落とし日を計算 */
const calcCreditPaymentDate = (
  transactionDateStr: string,
  closingDay: number,
  paymentDay: number,
): string => {
  const d = new Date(transactionDateStr);
  let closingYear = d.getFullYear();
  let closingMonth = d.getMonth();
  if (d.getDate() > closingDay) closingMonth += 1;
  const paymentDate = new Date(closingYear, closingMonth + 1, paymentDay);
  return formatDateLocal(paymentDate);
};

interface TransactionModalProps {
  type: TransactionType;
  transaction?: Transaction | null;
  wallets: Wallet[];
  categories: Category[];
  onClose: () => void;
  onSave: (payload: any) => Promise<void>;
}

const TransactionModal: React.FC<TransactionModalProps> = ({
  type: modalType,
  transaction,
  wallets,
  categories,
  onClose,
  onSave,
}) => {
  const [date, setDate] = useState(formatDateLocal(new Date()));
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [fromWalletId, setFromWalletId] = useState("");
  const [toWalletId, setToWalletId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");
  const [isReimbursement, setIsReimbursement] = useState(false);
  const [isReimbursed, setIsReimbursed] = useState(false);
  const [creditPaymentDate, setCreditPaymentDate] = useState("");

  // 選択中の財布がクレカかどうか
  const selectedWallet = wallets.find((w) => w.id === fromWalletId);
  const isCard = selectedWallet?.type === "card";

  // 支払日を自動計算するヘルパー
  const updateCreditPaymentDate = (
    walletId: string,
    transactionDate: string,
  ) => {
    const wallet = wallets.find((w) => w.id === walletId);
    if (wallet?.type === "card") {
      const closingDay = wallet.closingDay || 31;
      const paymentDay = wallet.paymentDay || 26;
      setCreditPaymentDate(
        calcCreditPaymentDate(transactionDate, closingDay, paymentDay),
      );
    } else {
      setCreditPaymentDate("");
    }
  };

  useEffect(() => {
    if (transaction) {
      setDate(transaction.date);
      setDescription(transaction.description);
      setAmount(String(transaction.amount));
      setFromWalletId(transaction.fromWalletId || "");
      setToWalletId(transaction.toWalletId || "");
      setCategoryId(transaction.categoryId || "");
      setNote(transaction.note || "");
      setIsReimbursement(transaction.isReimbursement || false);
      setIsReimbursed(transaction.isReimbursed || false);
      if (transaction.creditPaymentDate) {
        setCreditPaymentDate(transaction.creditPaymentDate);
      } else if (transaction.fromWalletId) {
        // 既存データで creditPaymentDate がない場合は自動計算
        const w = wallets.find((w) => w.id === transaction.fromWalletId);
        if (w?.type === "card") {
          const closingDay = w.closingDay || 31;
          const paymentDay = w.paymentDay || 26;
          setCreditPaymentDate(
            calcCreditPaymentDate(transaction.date, closingDay, paymentDay),
          );
        }
      }
    }
  }, [transaction, wallets]);

  // fromWalletId 変更時に支払日を再計算
  const handleFromWalletChange = (walletId: string) => {
    setFromWalletId(walletId);
    updateCreditPaymentDate(walletId, date);
  };

  // 日付変更時も支払日を再計算（クレカ選択中の場合）
  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    if (isCard) {
      updateCreditPaymentDate(fromWalletId, newDate);
    }
  };

  const handleSave = async () => {
    if (!amount || !modalType) return;

    const payload: any = {
      date,
      description,
      amount: Number(amount),
      type: modalType,
      note,
    };

    if (modalType !== "income") payload.fromWalletId = fromWalletId;
    if (modalType === "transfer") payload.toWalletId = toWalletId;
    if (modalType === "income") payload.toWalletId = toWalletId || fromWalletId; // legacy sync
    if (categoryId) payload.categoryId = categoryId;
    if (isCard && creditPaymentDate) {
      payload.creditPaymentDate = creditPaymentDate;
    }
    if (modalType === "expense") {
      payload.isReimbursement = isReimbursement;
      payload.isReimbursed = isReimbursement ? isReimbursed : false;
    }

    await onSave(payload);
  };

  const filteredCategories = categories.filter(
    (c) => c.type === (modalType === "transfer" ? "expense" : modalType),
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-md sketch-border p-8 relative max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">
          {transaction
            ? "取引を編集"
            : modalType === "expense"
              ? "支出登録"
              : modalType === "income"
                ? "収入登録"
                : "移動登録"}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              日付
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full mt-1 border-2 border-gray-300 rounded px-3 py-2 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              金額
            </label>
            <input
              type="number"
              placeholder="金額を入力"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full mt-1 border-2 border-gray-300 rounded px-3 py-2 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              内容
            </label>
            <input
              type="text"
              placeholder="例: スーパーでの買い物, 給料"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full mt-1 border-2 border-gray-300 rounded px-3 py-2 focus:border-blue-500 outline-none"
            />
          </div>

          {modalType !== "income" && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {modalType === "transfer" ? "財布(From)" : "使用財布・クレカ"}
              </label>
              <select
                value={fromWalletId}
                onChange={(e) => handleFromWalletChange(e.target.value)}
                className="w-full mt-1 border-2 border-gray-300 rounded px-3 py-2 focus:border-blue-500 outline-none"
              >
                <option value="">財布を選択</option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {modalType !== "income" && isCard && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                支払日（引き落とし日）
              </label>
              <input
                type="date"
                value={creditPaymentDate}
                onChange={(e) => setCreditPaymentDate(e.target.value)}
                className="w-full mt-1 border-2 border-gray-300 rounded px-3 py-2 focus:border-blue-500 outline-none"
              />
            </div>
          )}

          {modalType !== "expense" && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {modalType === "transfer" ? "財布(To)" : "入金先財布"}
              </label>
              <select
                value={toWalletId || fromWalletId}
                onChange={(e) => setToWalletId(e.target.value)}
                className="w-full mt-1 border-2 border-gray-300 rounded px-3 py-2 focus:border-blue-500 outline-none"
              >
                <option value="">財布を選択</option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {modalType !== "transfer" && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                カテゴリー
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full mt-1 border-2 border-gray-300 rounded px-3 py-2 focus:border-blue-500 outline-none"
              >
                <option value="">カテゴリーを選択</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {modalType === "expense" && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isReimbursement"
                  checked={isReimbursement}
                  onChange={(e) => {
                    setIsReimbursement(e.target.checked);
                    if (!e.target.checked) setIsReimbursed(false);
                  }}
                  className="w-4 h-4 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isReimbursement" className="text-sm font-medium text-gray-700 cursor-pointer">
                  立替申請
                </label>
              </div>
              {isReimbursement && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isReimbursed"
                    checked={isReimbursed}
                    onChange={(e) => setIsReimbursed(e.target.checked)}
                    className="w-4 h-4 text-green-600 border-2 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label htmlFor="isReimbursed" className="text-sm font-medium text-gray-700 cursor-pointer">
                    立替済み
                  </label>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              備考(任意)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full mt-1 border-2 border-gray-300 rounded px-3 py-2 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-2 border-2 border-gray-300 rounded hover:bg-gray-100 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-bold"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionModal;
