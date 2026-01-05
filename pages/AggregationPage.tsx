
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getWallets, 
  getTransactions, 
  getCategories,
  deleteTransaction,
  updateTransaction
} from '../services/db';
import { Wallet, Transaction, Category } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import TransactionModal from '../components/TransactionModal';

type AggView = 'balance' | 'wallet' | 'expense' | 'income';

const formatDateLocal = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

const AggregationPage: React.FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<AggView>('balance');
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const { firstDay, lastDay } = useMemo(() => {
    const today = new Date();
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return {
      firstDay: formatDateLocal(first),
      lastDay: formatDateLocal(last)
    };
  }, []);
  
  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  const fetchData = async () => {
    const [w, t, c] = await Promise.all([getWallets(), getTransactions(), getCategories()]);
    setWallets(w);
    setTransactions(t);
    setCategories(c);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateTx = async (payload: any) => {
    if (!editingTx) return;
    try {
      await updateTransaction(editingTx.id, payload);
      setEditingTx(null);
      fetchData();
    } catch (e) {
      console.error(e);
      alert('更新に失敗しました');
    }
  };

  const handleDeleteTx = async (id: string) => {
    if (window.confirm('この履歴を削除しますか？')) {
      try {
        await deleteTransaction(id);
        fetchData();
      } catch (e) {
        console.error(e);
        alert('削除に失敗しました');
      }
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const dateInRange = (!startDate || tx.date >= startDate) && (!endDate || tx.date <= endDate);
      const categoryMatches = !selectedCategoryId || tx.categoryId === selectedCategoryId;
      if (view === 'expense' || view === 'income') {
        return tx.type === view && dateInRange && categoryMatches;
      }
      return dateInRange && categoryMatches;
    });
  }, [transactions, view, startDate, endDate, selectedCategoryId]);

  // Use stored currentBalance
  const assetWallets = wallets
    .filter(w => w.type !== 'card')
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === 'bank' ? -1 : 1;
      return a.name.localeCompare(b.name, 'ja');
    });

  const cardWallets = wallets
    .filter(w => w.type === 'card')
    .sort((a, b) => a.name.localeCompare(b.name, 'ja'));

  const totalAssetBalance = assetWallets.reduce((acc, curr) => acc + (curr.currentBalance || 0), 0);

  const getCardPayments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return cardWallets.map(card => {
      const closingDay = card.closingDay || 31;
      const paymentDay = card.paymentDay || 26;
      
      const getPaymentDateForTransaction = (dateStr: string) => {
        const d = new Date(dateStr);
        let closingYear = d.getFullYear();
        let closingMonth = d.getMonth();
        if (d.getDate() > closingDay) closingMonth += 1;
        return new Date(closingYear, closingMonth + 1, paymentDay);
      };

      let p1 = new Date(today.getFullYear(), today.getMonth(), paymentDay);
      if (p1 < today) p1 = new Date(today.getFullYear(), today.getMonth() + 1, paymentDay);
      let p2 = new Date(p1.getFullYear(), p1.getMonth() + 1, paymentDay);

      const p1Key = formatDateLocal(p1);
      const p2Key = formatDateLocal(p2);

      let p1Amount = 0;
      let p2Amount = 0;

      transactions.filter(tx => tx.fromWalletId === card.id).forEach(tx => {
        const pDate = getPaymentDateForTransaction(tx.date);
        const pKey = formatDateLocal(pDate);
        if (pKey === p1Key) p1Amount += tx.amount;
        if (pKey === p2Key) p2Amount += tx.amount;
      });

      if (card.initialPaymentAmount) p1Amount += card.initialPaymentAmount;
      else if (card.initialBalance < 0) p1Amount += Math.abs(card.initialBalance);

      const formatLabel = (d: Date) => `${d.getMonth() + 1}/${d.getDate()} 支払い`;

      return {
        id: card.id,
        name: card.name,
        color: card.color,
        paymentDay,
        payments: [
          { date: p1, amount: p1Amount, label: formatLabel(p1) },
          { date: p2, amount: p2Amount, label: formatLabel(p2) }
        ]
      };
    });
  };

  const cardPayments = getCardPayments();

  const getCategoryData = (type: 'expense' | 'income') => {
    const data: Record<string, { value: number; color: string }> = {};
    filteredTransactions
      .filter(tx => tx.type === type)
      .forEach(tx => {
        const cat = categories.find(c => c.id === tx.categoryId);
        const name = cat ? cat.name : 'その他';
        const color = cat?.color || '#cbd5e1'; 
        if (!data[name]) data[name] = { value: 0, color };
        data[name].value += tx.amount;
      });
    
    return Object.entries(data)
      .map(([name, { value, color }]) => ({ name, value, color }))
      .sort((a, b) => b.value - a.value);
  };

  const DEFAULT_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00c49f'];

  const renderTransactionTable = (type: 'expense' | 'income' | 'all') => {
    const txList = type === 'all' 
      ? transactions.filter(tx => {
          const dateInRange = (!startDate || tx.date >= startDate) && (!endDate || tx.date <= endDate);
          const categoryMatches = !selectedCategoryId || tx.categoryId === selectedCategoryId;
          return dateInRange && categoryMatches;
        })
      : filteredTransactions;

    const sortedTxs = [...txList].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
      <div className="mt-12 space-y-4">
        <h4 className="font-bold border-b border-gray-200 pb-2 flex justify-between items-center">
          <span>取引履歴</span>
          <span className="text-xs font-normal text-gray-400">{sortedTxs.length} 件</span>
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-2 py-2 text-left text-gray-500 font-medium">日付</th>
                <th className="px-2 py-2 text-left text-gray-500 font-medium">内容</th>
                <th className="px-2 py-2 text-right text-gray-500 font-medium">金額</th>
                <th className="px-2 py-2 text-center text-gray-500 font-medium w-16">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedTxs.map(tx => {
                const cat = categories.find(c => c.id === tx.categoryId);
                const fromW = wallets.find(w => w.id === tx.fromWalletId);
                const toW = wallets.find(w => w.id === tx.toWalletId);
                return (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-2 py-4 whitespace-nowrap">
                      <div className="text-gray-500 text-[10px]">{tx.date}</div>
                      <span className={`inline-block px-1 py-0.5 rounded text-[8px] font-bold mt-1 ${
                        tx.type === 'income' ? 'bg-green-100 text-green-800' :
                        tx.type === 'expense' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {tx.type === 'income' ? '収入' : tx.type === 'expense' ? '支出' : '移動'}
                      </span>
                    </td>
                    <td className="px-2 py-4">
                      <div className="flex items-center space-x-1 mb-1">
                        {tx.type !== 'transfer' && cat?.color && (
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                        )}
                        <div className="text-[10px] text-gray-400 font-bold uppercase truncate max-w-[120px]">
                          {tx.type === 'transfer' ? '資金移動' : (cat?.name || '未設定')}
                        </div>
                      </div>
                      <div className="font-medium text-gray-800 mb-1">{tx.description || '内容なし'}</div>
                      <div className="text-[9px] text-gray-500 bg-gray-100 inline-block px-1 rounded">
                        {tx.type === 'transfer' ? (
                          <span className="flex items-center">
                            {fromW?.name || '?'} <span className="mx-1">→</span> {toW?.name || '?'}
                          </span>
                        ) : tx.type === 'expense' ? (
                          <span>支払: {fromW?.name || '?'}</span>
                        ) : (
                          <span>入金: {toW?.name || '?'}</span>
                        )}
                      </div>
                    </td>
                    <td className={`px-2 py-4 text-right font-bold font-mono whitespace-nowrap ${
                      tx.type === 'expense' ? 'text-red-600' : 
                      tx.type === 'income' ? 'text-green-600' : 
                      'text-gray-600'
                    }`}>
                      {tx.type === 'expense' ? '-' : tx.type === 'income' ? '+' : ''}¥{tx.amount.toLocaleString()}
                    </td>
                    <td className="px-2 py-4 text-center">
                      <div className="flex justify-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditingTx(tx)} className="p-1 hover:bg-blue-100 rounded text-blue-600"><EditIcon /></button>
                        <button onClick={() => handleDeleteTx(tx.id)} className="p-1 hover:bg-red-100 rounded text-red-600"><TrashIcon /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="flex justify-center space-x-2 mb-8">
        {(['balance', 'wallet', 'expense', 'income'] as AggView[]).map(tab => (
          <button
            key={tab}
            onClick={() => setView(tab)}
            className={`px-4 py-1 sketch-border transition ${view === tab ? 'bg-gray-300' : 'bg-white hover:bg-gray-50'}`}
          >
            {tab === 'balance' ? '残高' : tab === 'wallet' ? '財布' : tab === 'expense' ? '支出' : '収入'}
          </button>
        ))}
      </div>

      {view === 'balance' && (
        <div className="space-y-6">
          <div className="sketch-border p-6 bg-white shadow-sm">
            <div className="flex justify-between items-center border-b pb-4">
              <span className="text-xl text-gray-500 font-medium">総資産残高</span>
              <span className="text-3xl font-bold text-green-700">¥{totalAssetBalance.toLocaleString()}</span>
            </div>
            <div className="space-y-3 pt-4">
              {assetWallets.map(w => (
                <div key={w.id} className="flex justify-between items-center group">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: w.color || '#333' }} />
                    <span className="text-gray-600">{w.name}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="font-medium">¥{(w.currentBalance || 0).toLocaleString()}</span>
                    <button onClick={() => navigate(`/wallet/${w.id}`)} className="text-blue-500 text-xs opacity-0 group-hover:opacity-100 underline">詳細</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Credit card payments section... */}
        </div>
      )}

      {/* Other views (expense, income, wallet) rendering logic... */}
      {(view === 'expense' || view === 'income') && (
        <div className="space-y-8">
           {/* Filters and charts... */}
           {renderTransactionTable(view as any)}
        </div>
      )}

      {view === 'wallet' && (
        <div className="space-y-8">
          {/* Wallet list and transactions... */}
          {renderTransactionTable('all')}
        </div>
      )}

      {editingTx && (
        <TransactionModal 
          type={editingTx.type}
          transaction={editingTx}
          wallets={wallets}
          categories={categories}
          onClose={() => setEditingTx(null)}
          onSave={handleUpdateTx}
        />
      )}
    </div>
  );
};

export default AggregationPage;
