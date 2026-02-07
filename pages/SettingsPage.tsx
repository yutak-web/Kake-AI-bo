import React, { useState, useEffect } from "react";
import {
  getWallets,
  getCategories,
  addWallet,
  updateWallet,
  deleteWallet,
  updateWalletOrder,
  addCategory,
  updateCategory,
  deleteCategory,
  updateCategoryOrder,
} from "../services/db";
import { Wallet, Category, WalletType } from "../types";

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

const UpIcon = () => (
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
      d="M4.5 15.75l7.5-7.5 7.5 7.5"
    />
  </svg>
);

const DownIcon = () => (
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
      d="M19.5 8.25l-7.5 7.5-7.5-7.5"
    />
  </svg>
);

const SettingsPage: React.FC = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [modal, setModal] = useState<"wallet" | "category" | null>(null);

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [wName, setWName] = useState("");
  const [wType, setWType] = useState<WalletType>("bank");
  const [wBalance, setWBalance] = useState("");
  const [wColor, setWColor] = useState("#3b82f6");

  const [closingDay, setClosingDay] = useState("31");
  const [paymentDay, setPaymentDay] = useState("26");
  const [initialPaymentAmount, setInitialPaymentAmount] = useState("");
  const [wWithdrawalWalletId, setWWithdrawalWalletId] = useState("");

  const [cName, setCName] = useState("");
  const [cType, setCType] = useState<"income" | "expense">("expense");
  const [cColor, setCColor] = useState("#ef4444");

  const fetchData = async () => {
    const [w, c] = await Promise.all([getWallets(), getCategories()]);
    setWallets(w);
    setCategories(c);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const assetWallets = wallets.filter((w) => w.type !== "card");
  const cardWallets = wallets.filter((w) => w.type === "card");
  const bankWallets = wallets.filter((w) => w.type === "bank");

  const handleWalletSubmit = async () => {
    if (!wName) return;

    const walletData: any = {
      name: wName,
      type: wType,
      initialBalance:
        wType === "card"
          ? -(Number(initialPaymentAmount) || 0)
          : Number(wBalance) || 0,
      color: wColor,
    };

    if (wType === "card") {
      if (closingDay) walletData.closingDay = Number(closingDay);
      if (paymentDay) walletData.paymentDay = Number(paymentDay);
      walletData.initialPaymentAmount = Number(initialPaymentAmount) || 0;
      if (wWithdrawalWalletId)
        walletData.withdrawalWalletId = wWithdrawalWalletId;
    }

    try {
      if (editingId) {
        await updateWallet(editingId, walletData);
      } else {
        await addWallet(walletData);
      }

      resetWalletForm();
      fetchData();
    } catch (e) {
      console.error(e);
      alert("保存に失敗しました。");
    }
  };

  const handleEditWallet = (w: Wallet) => {
    setEditingId(w.id);
    setWName(w.name);
    setWType(w.type);
    setWBalance(String(w.initialBalance || "0"));
    setWColor(w.color || "#3b82f6");
    setClosingDay(String(w.closingDay || "31"));
    setPaymentDay(String(w.paymentDay || "26"));
    setInitialPaymentAmount(String(w.initialPaymentAmount || ""));
    setWWithdrawalWalletId(w.withdrawalWalletId || "");
  };

  const handleDeleteWallet = async (id: string) => {
    if (
      window.confirm(
        "この財布を削除しますか？関連する履歴の表示に影響が出る可能性があります。",
      )
    ) {
      await deleteWallet(id);
      fetchData();
    }
  };

  const handleMoveWallet = async (
    index: number,
    direction: "up" | "down",
    list: Wallet[],
  ) => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === list.length - 1) return;

    const newWallets = [...wallets];
    const targetListIndex = wallets.findIndex((w) => w.id === list[index].id);
    const swapListIndex = wallets.findIndex(
      (w) => w.id === list[index + (direction === "up" ? -1 : 1)].id,
    );

    if (targetListIndex === -1 || swapListIndex === -1) return;

    // Swap in the main list
    [newWallets[targetListIndex], newWallets[swapListIndex]] = [
      newWallets[swapListIndex],
      newWallets[targetListIndex],
    ];

    setWallets(newWallets); // Optimistic update
    await updateWalletOrder(newWallets);
  };

  const resetWalletForm = () => {
    setEditingId(null);
    setWName("");
    setWType("bank");
    setWBalance("");
    setWColor("#3b82f6");
    setClosingDay("31");
    setPaymentDay("26");
    setInitialPaymentAmount("");
    setWWithdrawalWalletId("");
  };

  const handleCategorySubmit = async () => {
    if (!cName) return;
    const categoryData = { name: cName, type: cType, color: cColor };

    try {
      if (editingId) {
        await updateCategory(editingId, categoryData);
      } else {
        await addCategory(categoryData);
      }

      resetCategoryForm();
      fetchData();
    } catch (e) {
      console.error(e);
      alert("保存に失敗しました。");
    }
  };

  const handleEditCategory = (c: Category) => {
    setEditingId(c.id);
    setCName(c.name);
    setCType(c.type);
    setCColor(c.color || (c.type === "expense" ? "#ef4444" : "#10b981"));
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm("このカテゴリーを削除しますか？")) {
      await deleteCategory(id);
      fetchData();
    }
  };

  const handleMoveCategory = async (
    index: number,
    direction: "up" | "down",
    filteredList: Category[],
  ) => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === filteredList.length - 1) return;

    // We need to reorder the entire categories list, but essentially we are just swapping orders of the two items
    const itemA = filteredList[index];
    const itemB = filteredList[index + (direction === "up" ? -1 : 1)];

    const newCategories = [...categories];
    const indexA = newCategories.findIndex((c) => c.id === itemA.id);
    const indexB = newCategories.findIndex((c) => c.id === itemB.id);

    if (indexA === -1 || indexB === -1) return;

    [newCategories[indexA], newCategories[indexB]] = [
      newCategories[indexB],
      newCategories[indexA],
    ];

    setCategories(newCategories);
    await updateCategoryOrder(newCategories);
  };

  const resetCategoryForm = () => {
    setEditingId(null);
    setCName("");
    setCColor(cType === "expense" ? "#ef4444" : "#10b981");
  };

  const getTypeName = (type: WalletType) => {
    switch (type) {
      case "bank":
        return "口座";
      case "other":
        return "その他財布";
      case "card":
        return "クレカ";
      default:
        return type;
    }
  };

  const renderWalletItem = (w: Wallet, index: number, list: Wallet[]) => (
    <div
      key={w.id}
      className="flex justify-between py-2 items-center bg-gray-50 px-3 rounded-lg group"
    >
      <div className="flex items-center space-x-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: w.color || "#333" }}
        />
        <div className="flex flex-col">
          <span className="font-medium text-sm">{w.name}</span>
          <span className="text-[10px] text-gray-400 uppercase">
            {getTypeName(w.type)}
            {w.type === "card" && w.withdrawalWalletId && (
              <span className="ml-1 text-blue-400">
                (引落:{" "}
                {bankWallets.find((bw) => bw.id === w.withdrawalWalletId)
                  ?.name || "不明"}
                )
              </span>
            )}
          </span>
        </div>
      </div>
      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity items-center">
        <div className="flex flex-col mr-2 space-y-1">
          <button
            onClick={() => handleMoveWallet(index, "up", list)}
            disabled={index === 0}
            className={`p-0.5 rounded hover:bg-gray-200 ${
              index === 0 ? "text-gray-300" : "text-gray-600"
            }`}
          >
            <UpIcon />
          </button>
          <button
            onClick={() => handleMoveWallet(index, "down", list)}
            disabled={index === list.length - 1}
            className={`p-0.5 rounded hover:bg-gray-200 ${
              index === list.length - 1 ? "text-gray-300" : "text-gray-600"
            }`}
          >
            <DownIcon />
          </button>
        </div>
        <button
          onClick={() => handleEditWallet(w)}
          className="p-1.5 hover:bg-blue-100 rounded text-blue-600 transition-colors"
          title="編集"
        >
          <EditIcon />
        </button>
        <button
          onClick={() => handleDeleteWallet(w.id)}
          className="p-1.5 hover:bg-red-100 rounded text-red-600 transition-colors"
          title="削除"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <button
          onClick={() => {
            resetWalletForm();
            setModal("wallet");
          }}
          className="w-full h-16 bg-white sketch-border flex items-center justify-center text-lg hover:bg-gray-50 transition-colors"
        >
          財布・クレカ一覧
        </button>
        <button
          onClick={() => {
            setCType("expense");
            resetCategoryForm();
            setModal("category");
          }}
          className="w-full h-16 bg-white sketch-border flex items-center justify-center text-lg hover:bg-gray-50 transition-colors"
        >
          支出カテゴリー一覧・編集
        </button>
        <button
          onClick={() => {
            setCType("income");
            resetCategoryForm();
            setModal("category");
          }}
          className="w-full h-16 bg-white sketch-border flex items-center justify-center text-lg hover:bg-gray-50 transition-colors"
        >
          収入カテゴリー一覧・編集
        </button>
      </div>

      {modal === "wallet" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md sketch-border p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-6">財布・クレカ一覧</h2>

            <div className="max-h-64 overflow-y-auto mb-6 space-y-4 border-b pb-6">
              {wallets.length === 0 ? (
                <p className="text-gray-400 text-sm">
                  登録されている財布はありません
                </p>
              ) : (
                <>
                  <section>
                    <h4 className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-tighter">
                      資産 (口座・現金)
                    </h4>
                    <div className="space-y-2">
                      {assetWallets.map((w, i) =>
                        renderWalletItem(w, i, assetWallets),
                      )}
                      {assetWallets.length === 0 && (
                        <p className="text-[10px] text-gray-300 italic px-2">
                          なし
                        </p>
                      )}
                    </div>
                  </section>
                  <section>
                    <h4 className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-tighter">
                      負債 (クレカ)
                    </h4>
                    <div className="space-y-2">
                      {cardWallets.map((w, i) =>
                        renderWalletItem(w, i, cardWallets),
                      )}
                      {cardWallets.length === 0 && (
                        <p className="text-[10px] text-gray-300 italic px-2">
                          なし
                        </p>
                      )}
                    </div>
                  </section>
                </>
              )}
            </div>

            <h3 className="font-bold mb-4 flex justify-between items-center">
              <span>{editingId ? "項目を編集" : "新規追加"}</span>
              {editingId && (
                <button
                  onClick={resetWalletForm}
                  className="text-xs text-blue-500 hover:underline"
                >
                  新規追加に戻る
                </button>
              )}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">名前</label>
                <input
                  type="text"
                  placeholder="例: 三菱UFJ, 現金, 楽天カード"
                  value={wName}
                  onChange={(e) => setWName(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded px-3 py-2 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    分類
                  </label>
                  <select
                    value={wType}
                    onChange={(e) => setWType(e.target.value as WalletType)}
                    className="w-full border-2 border-gray-300 rounded px-3 py-2 focus:border-blue-500 outline-none"
                  >
                    <option value="bank">口座</option>
                    <option value="other">その他財布</option>
                    <option value="card">クレカ</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    カラー
                  </label>
                  <div className="flex items-center space-x-2 border-2 border-gray-300 rounded px-2 py-1">
                    <input
                      type="color"
                      value={wColor}
                      onChange={(e) => setWColor(e.target.value)}
                      className="w-8 h-8 cursor-pointer bg-transparent border-none"
                    />
                    <span className="text-[10px] uppercase font-mono">
                      {wColor}
                    </span>
                  </div>
                </div>
              </div>

              {wType !== "card" ? (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    初期残高
                  </label>
                  <input
                    type="number"
                    placeholder="金額"
                    value={wBalance}
                    onChange={(e) => setWBalance(e.target.value)}
                    className="w-full border-2 border-gray-300 rounded px-3 py-2 focus:border-blue-500 outline-none"
                  />
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg space-y-4 border border-gray-200">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      引き落とし口座
                    </label>
                    <select
                      value={wWithdrawalWalletId}
                      onChange={(e) => setWWithdrawalWalletId(e.target.value)}
                      className="w-full border-2 border-gray-300 rounded px-3 py-2 focus:border-blue-500 outline-none bg-white"
                    >
                      <option value="">設定なし</option>
                      {bankWallets.map((bw) => (
                        <option key={bw.id} value={bw.id}>
                          {bw.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        締日 (日)
                      </label>
                      <input
                        type="number"
                        placeholder="31"
                        value={closingDay}
                        onChange={(e) => setClosingDay(e.target.value)}
                        className="w-full border-2 border-gray-300 rounded px-3 py-2 focus:border-blue-500 outline-none"
                        min="1"
                        max="31"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        支払日 (日)
                      </label>
                      <input
                        type="number"
                        placeholder="26"
                        value={paymentDay}
                        onChange={(e) => setPaymentDay(e.target.value)}
                        className="w-full border-2 border-gray-300 rounded px-3 py-2 focus:border-blue-500 outline-none"
                        min="1"
                        max="31"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      初回の支払い予定額
                    </label>
                    <input
                      type="number"
                      placeholder="金額"
                      value={initialPaymentAmount}
                      onChange={(e) => setInitialPaymentAmount(e.target.value)}
                      className="w-full border-2 border-gray-300 rounded px-3 py-2 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end space-x-4">
              <button
                onClick={() => setModal(null)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                閉じる
              </button>
              <button
                onClick={handleWalletSubmit}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold transition-colors"
              >
                {editingId ? "更新" : "追加"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === "category" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md sketch-border p-8">
            <h2 className="text-xl font-bold mb-6">
              {cType === "expense" ? "支出" : "収入"}カテゴリー一覧
            </h2>
            <div className="max-h-60 overflow-y-auto mb-6 space-y-2 border-b pb-4">
              {categories.filter((c) => c.type === cType).length === 0 ? (
                <p className="text-gray-400 text-sm italic">
                  カテゴリーがありません
                </p>
              ) : (
                categories
                  .filter((c) => c.type === cType)
                  .map((c, i, arr) => (
                    <div
                      key={c.id}
                      className="py-2 px-3 bg-gray-50 rounded-lg flex items-center justify-between group"
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: c.color || "#333" }}
                        />
                        <span className="text-sm font-medium">{c.name}</span>
                      </div>
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity items-center">
                        <div className="flex flex-col mr-2 space-y-1">
                          <button
                            onClick={() => handleMoveCategory(i, "up", arr)}
                            disabled={i === 0}
                            className={`p-0.5 rounded hover:bg-gray-200 ${
                              i === 0 ? "text-gray-300" : "text-gray-600"
                            }`}
                          >
                            <UpIcon />
                          </button>
                          <button
                            onClick={() => handleMoveCategory(i, "down", arr)}
                            disabled={i === arr.length - 1}
                            className={`p-0.5 rounded hover:bg-gray-200 ${
                              i === arr.length - 1
                                ? "text-gray-300"
                                : "text-gray-600"
                            }`}
                          >
                            <DownIcon />
                          </button>
                        </div>
                        <button
                          onClick={() => handleEditCategory(c)}
                          className="p-1.5 hover:bg-blue-100 rounded text-blue-600 transition-colors"
                          title="編集"
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(c.id)}
                          className="p-1.5 hover:bg-red-100 rounded text-red-600 transition-colors"
                          title="削除"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
            <h3 className="font-bold mb-4 border-t pt-4 flex justify-between items-center">
              <span>{editingId ? "カテゴリーを編集" : "新規追加"}</span>
              {editingId && (
                <button
                  onClick={resetCategoryForm}
                  className="text-xs text-blue-500 hover:underline"
                >
                  新規追加に戻る
                </button>
              )}
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="名前"
                value={cName}
                onChange={(e) => setCName(e.target.value)}
                className="w-full border-2 border-gray-300 rounded px-3 py-2 focus:border-blue-500 outline-none"
              />
              <div className="flex items-center space-x-4">
                <label className="text-xs text-gray-500 block">カラー</label>
                <div className="flex items-center space-x-2 border-2 border-gray-300 rounded px-2 py-1 flex-1">
                  <input
                    type="color"
                    value={cColor}
                    onChange={(e) => setCColor(e.target.value)}
                    className="w-8 h-8 cursor-pointer bg-transparent border-none"
                  />
                  <span className="text-[10px] uppercase font-mono">
                    {cColor}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setModal(null)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                閉じる
              </button>
              <button
                onClick={handleCategorySubmit}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold transition-colors"
              >
                {editingId ? "更新" : "追加"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
