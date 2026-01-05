
import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, Wallet, Category } from '../types';

const formatDateLocal = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
  onSave 
}) => {
  const [date, setDate] = useState(formatDateLocal(new Date()));
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [fromWalletId, setFromWalletId] = useState('');
  const [toWalletId, setToWalletId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (transaction) {
      setDate(transaction.date);
      setDescription(transaction.description);
      setAmount(String(transaction.amount));
      setFromWalletId(transaction.fromWalletId || '');
      setToWalletId(transaction.toWalletId || '');
      setCategoryId(transaction.categoryId || '');
      setNote(transaction.note || '');
    }
  }, [transaction]);

  const handleSave = async () => {
    if (!amount || !modalType) return;

    const payload: any = {
      date,
      description,
      amount: Number(amount),
      type: modalType,
      note,
    };

    if (modalType !== 'income') payload.fromWalletId = fromWalletId;
    if (modalType === 'transfer') payload.toWalletId = toWalletId;
    if (modalType === 'income') payload.toWalletId = toWalletId || fromWalletId; // legacy sync
    if (categoryId) payload.categoryId = categoryId;

    await onSave(payload);
  };

  const filteredCategories = categories.filter(c => c.type === (modalType === 'transfer' ? 'expense' : modalType));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-md sketch-border p-8 relative max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">
          {transaction ? '取引を編集' : (modalType === 'expense' ? '支出登録' : modalType === 'income' ? '収入登録' : '移動登録')}
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">日付</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              className="w-full mt-1 border-2 border-gray-300 rounded px-3 py-2 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">内容</label>
            <input 
              type="text" 
              placeholder="例: スーパーでの買い物, 給料" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              className="w-full mt-1 border-2 border-gray-300 rounded px-3 py-2 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">金額</label>
            <input 
              type="number" 
              placeholder="金額を入力" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)}
              className="w-full mt-1 border-2 border-gray-300 rounded px-3 py-2 focus:border-blue-500 outline-none"
            />
          </div>

          {modalType !== 'income' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {modalType === 'transfer' ? '財布(From)' : '使用財布・クレカ'}
              </label>
              <select 
                value={fromWalletId} 
                onChange={(e) => setFromWalletId(e.target.value)}
                className="w-full mt-1 border-2 border-gray-300 rounded px-3 py-2 focus:border-blue-500 outline-none"
              >
                <option value="">財布を選択</option>
                {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          )}

          {modalType !== 'expense' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {modalType === 'transfer' ? '財布(To)' : '入金先財布'}
              </label>
              <select 
                value={toWalletId || fromWalletId} 
                onChange={(e) => setToWalletId(e.target.value)}
                className="w-full mt-1 border-2 border-gray-300 rounded px-3 py-2 focus:border-blue-500 outline-none"
              >
                <option value="">財布を選択</option>
                {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          )}

          {modalType !== 'transfer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">カテゴリー</label>
              <select 
                value={categoryId} 
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full mt-1 border-2 border-gray-300 rounded px-3 py-2 focus:border-blue-500 outline-none"
              >
                <option value="">カテゴリーを選択</option>
                {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">備考(任意)</label>
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
