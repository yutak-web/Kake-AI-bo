import React, { useState, useEffect } from "react";
import { getWallets, getCategories, addTransaction } from "../services/db";
import { Wallet, Category, TransactionType } from "../types";
import TransactionModal from "../components/TransactionModal";

const RegistrationPage: React.FC = () => {
  const [modalType, setModalType] = useState<TransactionType | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [w, c] = await Promise.all([getWallets(), getCategories()]);
      setWallets(w);
      setCategories(c);
    };
    fetchData();
  }, []);

  const handleSave = async (payload: any) => {
    try {
      await addTransaction(payload);
      setModalType(null);
    } catch (e) {
      console.error(e);
      alert("保存に失敗しました。");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-10 w-full max-w-sm mx-auto">
      <button
        onClick={() => setModalType("expense")}
        className="w-full h-24 bg-indigo-100 hover:bg-indigo-200 sketch-border flex items-center justify-center text-2xl font-bold text-indigo-800 transition-colors shadow-sm active:translate-y-0.5"
      >
        支出
      </button>
      <button
        onClick={() => setModalType("income")}
        className="w-full h-24 bg-green-100 hover:bg-green-200 sketch-border flex items-center justify-center text-2xl font-bold text-green-800 transition-colors shadow-sm active:translate-y-0.5"
      >
        収入
      </button>
      <button
        onClick={() => setModalType("transfer")}
        className="w-full h-24 bg-yellow-100 hover:bg-yellow-200 sketch-border flex items-center justify-center text-2xl font-bold text-yellow-800 transition-colors shadow-sm active:translate-y-0.5"
      >
        移動
      </button>

      {modalType && (
        <TransactionModal
          type={modalType}
          wallets={wallets}
          categories={categories}
          onClose={() => setModalType(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default RegistrationPage;
