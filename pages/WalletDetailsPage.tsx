import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getWallets,
  getTransactions,
  getCategories,
  deleteTransaction,
  updateTransaction,
} from "../services/db";
import { Wallet, Transaction, Category } from "../types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import TransactionModal from "../components/TransactionModal";

const formatDateLocal = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const EditIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-4 h-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
    />
  </svg>
);

const TrashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-4 h-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
    />
  </svg>
);

type PeriodOption = { label: string; days: number };
const PERIODS: PeriodOption[] = [
  { label: "1週間", days: 7 },
  { label: "1ヶ月", days: 30 },
  { label: "3ヶ月", days: 90 },
  { label: "半年", days: 180 },
  { label: "1年", days: 365 },
];

const WalletDetailsPage: React.FC = () => {
  const { walletId } = useParams<{ walletId: string }>();
  const [allWallets, setAllWallets] = useState<Wallet[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [periodDays, setPeriodDays] = useState<number>(30);

  const fetchData = async () => {
    const [w, t, c] = await Promise.all([
      getWallets(),
      getTransactions(),
      getCategories(),
    ]);
    setAllWallets(w);
    setWallet(w.find((x) => x.id === walletId) || null);
    // Filter transactions for this wallet
    setTransactions(
      t.filter(
        (tx) => tx.fromWalletId === walletId || tx.toWalletId === walletId
      )
    );
    setCategories(c);
  };

  useEffect(() => {
    fetchData();
  }, [walletId]);

  const handleUpdateTx = async (payload: any) => {
    if (!editingTx) return;
    try {
      await updateTransaction(editingTx.id, payload);
      setEditingTx(null);
      fetchData();
      alert("更新しました");
    } catch (e) {
      console.error(e);
      alert("更新に失敗しました");
    }
  };

  const handleDeleteTx = async (id: string) => {
    if (window.confirm("この履歴を削除しますか？")) {
      try {
        await deleteTransaction(id);
        fetchData();
      } catch (e) {
        console.error(e);
        alert("削除に失敗しました");
      }
    }
  };

  const { chartData, currentBalance } = useMemo(() => {
    if (!wallet) return { chartData: [], currentBalance: 0 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - periodDays);
    const startDateStr = formatDateLocal(startDate);

    // Calculate total current balance
    const totalBalance = transactions.reduce((acc, tx) => {
      if (tx.fromWalletId === wallet.id) return acc - tx.amount;
      if (tx.toWalletId === wallet.id) return acc + tx.amount;
      return acc;
    }, Number(wallet.initialBalance));

    // Calculate starting balance for the chart period
    let balanceAtStart = Number(wallet.initialBalance);
    transactions.forEach((tx) => {
      if (tx.date < startDateStr) {
        if (tx.fromWalletId === wallet.id) balanceAtStart -= tx.amount;
        if (tx.toWalletId === wallet.id) balanceAtStart += tx.amount;
      }
    });

    // Build chart data day by day
    const data = [];
    let runningBalance = balanceAtStart;

    for (let i = 0; i <= periodDays; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const currentDateStr = formatDateLocal(currentDate);

      // Add all transactions for this specific day
      transactions.forEach((tx) => {
        if (tx.date === currentDateStr) {
          if (tx.fromWalletId === wallet.id) runningBalance -= tx.amount;
          if (tx.toWalletId === wallet.id) runningBalance += tx.amount;
        }
      });

      data.push({
        date: currentDateStr,
        displayDate:
          periodDays > 180
            ? `${currentDate.getMonth() + 1}月` // Yearly view: show months
            : `${currentDate.getMonth() + 1}/${currentDate.getDate()}`, // Others: show day/month
        balance: runningBalance,
      });
    }

    return { chartData: data, currentBalance: totalBalance };
  }, [wallet, transactions, periodDays]);

  if (!wallet)
    return (
      <div className="flex justify-center items-center h-64 text-gray-400">
        読み込み中...
      </div>
    );

  // Determine label intervals for chart to prevent crowding
  const getXAxisInterval = () => {
    if (periodDays <= 7) return 0;
    if (periodDays <= 30) return 6;
    if (periodDays <= 90) return 14;
    if (periodDays <= 180) return 29;
    return 60;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-10">
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <Link to="/aggregation" className="hover:underline">
          集計
        </Link>
        <span>&gt;</span>
        <span className="flex items-center space-x-1">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: wallet.color }}
          />
          <span>{wallet.name}</span>
        </span>
      </div>

      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">{wallet.name}</h2>
        <p className="text-xl mt-2 text-gray-600 font-mono">
          現在の残高: ¥{currentBalance.toLocaleString()}
        </p>
      </div>

      <div className="space-y-4">
        {/* Period Selector */}
        <div className="flex justify-center space-x-1">
          {PERIODS.map((p) => (
            <button
              key={p.days}
              onClick={() => setPeriodDays(p.days)}
              className={`px-3 py-1 text-[10px] sm:text-xs sketch-border transition-all duration-200 ${
                periodDays === p.days
                  ? "bg-gray-800 text-white translate-y-0.5"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="h-80 sketch-border p-4 bg-white shadow-sm">
          <h4 className="text-sm font-bold text-gray-400 mb-4 flex justify-between items-center">
            <span>
              残高推移 ({PERIODS.find((p) => p.days === periodDays)?.label})
            </span>
            <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500 uppercase">
              Daily Final Balance
            </span>
          </h4>
          <div className="h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f0f0f0"
                />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fontSize: 9, fill: "#9ca3af" }}
                  interval={getXAxisInterval()}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "2px solid #333",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [
                    `¥${value.toLocaleString()}`,
                    "残高",
                  ]}
                  labelFormatter={(label, payload) => {
                    const item = payload[0]?.payload;
                    return item ? `日付: ${item.date}` : label;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke={wallet.color || "#333"}
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
                  animationDuration={800}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-bold border-b border-gray-200 pb-2 flex justify-between items-center">
          <span>履歴一覧</span>
          <span className="text-xs font-normal text-gray-400">
            {transactions.length} 件
          </span>
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-2 py-2 text-left text-gray-500 font-medium">
                  日付
                </th>
                <th className="px-2 py-2 text-left text-gray-500 font-medium">
                  内容・詳細
                </th>
                <th className="px-2 py-2 text-right text-gray-500 font-medium">
                  金額
                </th>
                <th className="px-2 py-2 text-center text-gray-500 font-medium w-16">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[...transactions]
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                )
                .map((tx) => {
                  const isOut = tx.fromWalletId === wallet.id;
                  const cat = categories.find((c) => c.id === tx.categoryId);
                  const otherWalletId = isOut ? tx.toWalletId : tx.fromWalletId;
                  const otherWallet = allWallets.find(
                    (w) => w.id === otherWalletId
                  );
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-gray-50 transition-colors group"
                    >
                      <td className="px-2 py-4 whitespace-nowrap">
                        <div className="text-gray-500 text-[10px]">
                          {tx.date}
                        </div>
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold mt-1 ${
                            tx.type === "income"
                              ? "bg-green-100 text-green-800"
                              : tx.type === "expense"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {tx.type === "income"
                            ? "収入"
                            : tx.type === "expense"
                            ? "支出"
                            : "移動"}
                        </span>
                      </td>
                      <td className="px-2 py-4">
                        <div className="flex items-center space-x-1 mb-1">
                          {tx.type !== "transfer" && cat?.color && (
                            <div
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: cat.color }}
                            />
                          )}
                          <div className="text-[10px] text-gray-400 font-bold uppercase truncate max-w-[120px]">
                            {tx.type === "transfer"
                              ? "資金移動"
                              : cat?.name || "未設定"}
                          </div>
                        </div>
                        <div className="font-medium text-gray-800 mb-1">
                          {tx.description || "内容なし"}
                        </div>
                        <div className="text-[9px] text-gray-500 bg-gray-100 inline-block px-1 rounded">
                          {tx.type === "transfer" ? (
                            <span>
                              {isOut
                                ? `→ ${otherWallet?.name || "不明"}`
                                : `← ${otherWallet?.name || "不明"}`}
                            </span>
                          ) : (
                            <span>
                              {isOut
                                ? `支払財布: ${wallet.name}`
                                : `入金財布: ${wallet.name}`}
                            </span>
                          )}
                        </div>
                      </td>
                      <td
                        className={`px-2 py-4 text-right font-bold font-mono whitespace-nowrap ${
                          isOut ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {isOut ? "-" : "+"}¥{tx.amount.toLocaleString()}
                      </td>
                      <td className="px-2 py-4 text-center">
                        <div className="flex justify-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingTx(tx)}
                            className="p-1 hover:bg-blue-100 rounded text-blue-600"
                            title="編集"
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => handleDeleteTx(tx.id)}
                            className="p-1 hover:bg-red-100 rounded text-red-600"
                            title="削除"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              {transactions.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-2 py-8 text-center text-gray-400 italic"
                  >
                    取引履歴がありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingTx && (
        <TransactionModal
          type={editingTx.type}
          transaction={editingTx}
          wallets={allWallets}
          categories={categories}
          onClose={() => setEditingTx(null)}
          onSave={handleUpdateTx}
        />
      )}
    </div>
  );
};

export default WalletDetailsPage;
