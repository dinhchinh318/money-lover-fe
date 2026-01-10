import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  Wallet,
  BarChart3,
  SlidersHorizontal,
} from "lucide-react";
import { message, Dropdown, Modal, Select, Drawer } from "antd";
import { Virtuoso } from "react-virtuoso";
import dayjs from "dayjs";

import {
  getAllTransactionsAPI,
  deleteTransactionAPI,
  getOverviewStatsAPI,
} from "../../../services/api.transaction";
import { getWalletsAPI } from "../../../services/api.wallet";
import { getCategoriesAPI } from "../../../services/api.category";
import TransactionModal from "../../../components/transactions/TransactionModal";
import DateRangePicker from "../../../components/common/DateRangePicker";

// ✅ i18n
import { useTranslation } from "react-i18next";

const TransactionsIndex = () => {
  const { t, i18n } = useTranslation();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // data
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // stats
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    totalWalletBalance: 0,
    transactionCount: 0,
  });

  // filters
  const [filters, setFilters] = useState({
    startDate: dayjs().startOf("month"),
    endDate: dayjs().endOf("month"),
    type: "all",
    walletId: "all",
    categoryId: "all",
    isRecurring: false,
  });

  const [activeTab, setActiveTab] = useState("all");

  // modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [initialType, setInitialType] = useState("expense");

  // options
  const [wallets, setWallets] = useState([]);
  const [categories, setCategories] = useState([]);

  // infinite paging (append)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(30);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // mobile ui
  const [filterOpen, setFilterOpen] = useState(false);
  const listTopRef = useRef(null);

  const tabs = useMemo(
    () => [
      { key: "all", label: t("transactions.tabs.all") },
      { key: "income", label: t("transactions.tabs.income") },
      { key: "expense", label: t("transactions.tabs.expense") },
      { key: "transfer", label: t("transactions.tabs.transfer") },
      { key: "debt_loan", label: t("transactions.tabs.debtLoan") },
      { key: "recurring", label: t("transactions.tabs.recurring") },
    ],
    [t]
  );

  // ---------- helpers ----------
  const formatCurrency = (amount) => {
    const locale = i18n.language === "en" ? "en-US" : "vi-VN";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatTime = (date) => dayjs(date).format("HH:mm");

  const getTransactionTypeColor = (type) => {
    const colors = {
      income: "#10B981",
      expense: "#EF4444",
      transfer: "#3B82F6",
      debt: "#F59E0B",
      loan: "#F97316",
      adjust: "#6B7280",
    };
    return colors[type] || "#6B7280";
  };

  const getTransactionTypeLabel = (type) => {
    const labels = {
      income: t("transactions.type.income"),
      expense: t("transactions.type.expense"),
      transfer: t("transactions.type.transfer"),
      debt: t("transactions.type.debt"),
      loan: t("transactions.type.loan"),
      adjust: t("transactions.type.adjust"),
    };
    return labels[type] || type;
  };

  const getDateKey = (d) => {
    const date = dayjs(d);
    const today = dayjs();
    const yesterday = today.subtract(1, "day");
    if (date.isSame(today, "day")) return t("transactions.date.today");
    if (date.isSame(yesterday, "day")) return t("transactions.date.yesterday");
    return date.format("DD/MM/YYYY");
  };

  // group + flatten (for virtuoso)
  const flatList = useMemo(() => {
    const grouped = new Map();
    for (const tx of transactions) {
      const key = getDateKey(tx.date);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(tx);
    }

    const out = [];
    for (const [key, arr] of grouped.entries()) {
      out.push({ type: "header", key });
      for (const tx of arr) out.push({ type: "item", tx });
    }
    return out;
  }, [transactions, t]); // ✅ include t (date label changes)

  // menu items
  const transactionMenuItems = useMemo(
    () => [
      { key: "income", label: t("transactions.type.income"), onClick: () => handleAddTransaction("income") },
      { key: "expense", label: t("transactions.type.expense"), onClick: () => handleAddTransaction("expense") },
      { key: "transfer", label: t("transactions.type.transfer"), onClick: () => handleAddTransaction("transfer") },
      { key: "debt", label: t("transactions.type.debt"), onClick: () => handleAddTransaction("debt") },
      { key: "loan", label: t("transactions.type.loan"), onClick: () => handleAddTransaction("loan") },
      { key: "adjust", label: t("transactions.type.adjust"), onClick: () => handleAddTransaction("adjust") },
    ],
    [t]
  );

  // ---------- load options ----------
  useEffect(() => {
    (async () => {
      try {
        const [wRes, cRes] = await Promise.all([getWalletsAPI(), getCategoriesAPI()]);
        if (wRes?.EC === 0 && Array.isArray(wRes?.data)) {
          setWallets(wRes.data.filter((w) => !w.is_archived));
        } else setWallets([]);
        if (cRes?.EC === 0 && Array.isArray(cRes?.data)) setCategories(cRes.data);
        else setCategories([]);
      } catch (e) {
        setWallets([]);
        setCategories([]);
      }
    })();
  }, []);

  // ---------- read URL params (analytics -> transactions) ----------
  useEffect(() => {
    const categoryId = searchParams.get("categoryId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type");

    if (categoryId || startDate || endDate || type) {
      const newFilters = {
        startDate: startDate ? dayjs(startDate) : dayjs().startOf("month"),
        endDate: endDate ? dayjs(endDate) : dayjs().endOf("month"),
        type: type || "all",
        walletId: "all",
        categoryId: categoryId || "all",
        isRecurring: false,
      };
      setFilters(newFilters);
      if (type && type !== "all") setActiveTab(type);
      setPage(1);
      setTransactions([]);
      setHasMore(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- load stats whenever filter range changes ----------
  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.startDate, filters.endDate]);

  const buildQueryParams = (pageArg) => {
    const params = {
      page: pageArg,
      limit,
      startDate: filters.startDate?.toISOString(),
      endDate: filters.endDate?.toISOString(),
      isRecurring: activeTab === "recurring" ? true : filters.isRecurring,
    };

    if (activeTab !== "all" && activeTab !== "recurring") {
      params.type = activeTab === "debt_loan" ? "debt,loan" : activeTab;
    } else if (filters.type !== "all") {
      params.type = filters.type;
    }

    if (filters.walletId !== "all") params.walletId = filters.walletId;
    if (filters.categoryId !== "all") params.categoryId = filters.categoryId;

    return params;
  };

  const loadPage = async (pageArg, mode = "replace") => {
    try {
      setLoading(true);
      const params = buildQueryParams(pageArg);
      const res = await getAllTransactionsAPI(params);

      if (!(res?.status || res?.EC === 0)) {
        message.error(t("transactions.toast.loadListFail"));
        return;
      }

      const data = res?.data?.transactions || res?.data || [];
      const totalCount = res?.data?.total || res?.total || 0;

      setTotal(totalCount);

      setTransactions((prev) => (mode === "append" ? [...prev, ...data] : data));

      const prevCount = mode === "append" ? transactions.length : 0;
      const loadedCount = prevCount + data.length;
      setHasMore(loadedCount < totalCount);
    } catch (e) {
      message.error(t("transactions.toast.loadListError"));
    } finally {
      setLoading(false);
    }
  };

  // reload when filters/tab changes (reset + load page 1)
  useEffect(() => {
    setPage(1);
    setTransactions([]);
    setHasMore(true);
    loadPage(1, "replace");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTab,
    filters.type,
    filters.walletId,
    filters.categoryId,
    filters.isRecurring,
    filters.startDate,
    filters.endDate,
    limit,
  ]);

  const loadMore = async () => {
    if (loading || !hasMore) return;
    const next = page + 1;
    setPage(next);
    await loadPage(next, "append");
  };

  const loadStats = async () => {
    try {
      const params = {
        startDate: filters.startDate?.toISOString(),
        endDate: filters.endDate?.toISOString(),
      };
      const res = await getOverviewStatsAPI(params);
      if (res?.status || res?.EC === 0) {
        const data = res?.data || {};
        setStats({
          totalIncome: data.totalIncome || 0,
          totalExpense: data.totalExpense || 0,
          balance: (data.totalIncome || 0) - (data.totalExpense || 0),
          totalWalletBalance: data.totalWalletBalance || 0,
          transactionCount: data.transactionCount || 0,
        });
      }
    } catch (e) {}
  };

  // ---------- actions ----------
  const handleAddTransaction = (type) => {
    setEditingTransaction(null);
    setInitialType(type || "expense");
    setModalOpen(true);
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setModalOpen(true);
  };

  const handleDeleteTransaction = (transaction) => {
    Modal.confirm({
      title: t("transactions.confirm.delete.title"),
      content: t("transactions.confirm.delete.content"),
      okText: t("transactions.confirm.delete.ok"),
      okType: "danger",
      cancelText: t("transactions.confirm.delete.cancel"),
      onOk: async () => {
        try {
          const res = await deleteTransactionAPI(transaction._id);
          if (res?.status || res?.EC === 0) {
            message.success(t("transactions.toast.deleteSuccess"));
            setPage(1);
            setTransactions([]);
            setHasMore(true);
            await loadPage(1, "replace");
            await loadStats();
          } else {
            message.error(res?.message || t("transactions.toast.deleteFail"));
          }
        } catch (e) {
          message.error(t("transactions.toast.genericError"));
        }
      },
    });
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: dayjs().startOf("month"),
      endDate: dayjs().endOf("month"),
      type: "all",
      walletId: "all",
      categoryId: "all",
      isRecurring: false,
    });
    setActiveTab("all");
  };

  const handleQuickDateFilter = (period) => {
    const today = dayjs();
    let startDate, endDate;
    switch (period) {
      case "today":
        startDate = today.startOf("day");
        endDate = today.endOf("day");
        break;
      case "week":
        startDate = today.startOf("week");
        endDate = today.endOf("week");
        break;
      case "month":
        startDate = today.startOf("month");
        endDate = today.endOf("month");
        break;
      case "year":
        startDate = today.startOf("year");
        endDate = today.endOf("year");
        break;
      default:
        return;
    }
    setFilters((prev) => ({ ...prev, startDate, endDate }));
  };

  // ---------- UI pieces ----------
  const SummaryRow = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
      <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500">{t("transactions.summary.totalIncome")}</p>
            <p className="text-lg sm:text-xl font-extrabold text-emerald-600 truncate">
              {formatCurrency(stats.totalIncome)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-rose-100 flex items-center justify-center">
            <TrendingDown className="w-6 h-6 text-rose-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500">{t("transactions.summary.totalExpense")}</p>
            <p className="text-lg sm:text-xl font-extrabold text-rose-600 truncate">
              {formatCurrency(stats.totalExpense)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-sky-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-sky-100 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-sky-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500">{t("transactions.summary.totalWalletBalance")}</p>
            <p className="text-lg sm:text-xl font-extrabold text-sky-600 truncate">
              {formatCurrency(stats.totalWalletBalance)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-gray-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500">{t("transactions.summary.transactionCount")}</p>
            <p className="text-lg sm:text-xl font-extrabold text-gray-800 truncate">
              {stats.transactionCount}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const FilterPanel = ({ inDrawer = false }) => (
    <div className={`${inDrawer ? "" : "bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm"} `}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t("transactions.filters.dateRange")}
          </label>
          <DateRangePicker
            value={[filters.startDate, filters.endDate]}
            onChange={(dates) => {
              if (dates) setFilters((p) => ({ ...p, startDate: dates[0], endDate: dates[1] }));
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t("transactions.filters.type")}
          </label>
          <Select
            style={{ width: "100%" }}
            value={filters.type}
            onChange={(value) => setFilters((p) => ({ ...p, type: value }))}
          >
            <Select.Option value="all">{t("transactions.filters.all")}</Select.Option>
            <Select.Option value="income">{t("transactions.type.income")}</Select.Option>
            <Select.Option value="expense">{t("transactions.type.expense")}</Select.Option>
            <Select.Option value="transfer">{t("transactions.type.transfer")}</Select.Option>
            <Select.Option value="debt">{t("transactions.type.debt")}</Select.Option>
            <Select.Option value="loan">{t("transactions.type.loan")}</Select.Option>
            <Select.Option value="adjust">{t("transactions.type.adjust")}</Select.Option>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t("transactions.filters.wallet")}
          </label>
          <Select
            style={{ width: "100%" }}
            value={filters.walletId}
            onChange={(value) => setFilters((p) => ({ ...p, walletId: value }))}
          >
            <Select.Option value="all">{t("transactions.filters.allWallets")}</Select.Option>
            {wallets.map((w) => (
              <Select.Option key={w._id} value={w._id}>
                {w.name}
              </Select.Option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t("transactions.filters.category")}
          </label>
          <Select
            style={{ width: "100%" }}
            value={filters.categoryId}
            onChange={(value) => setFilters((p) => ({ ...p, categoryId: value }))}
          >
            <Select.Option value="all">{t("transactions.filters.allCategories")}</Select.Option>
            {categories.map((c) => (
              <Select.Option key={c._id} value={c._id}>
                {c.name}
              </Select.Option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        {[
          { key: "today", label: t("transactions.quick.today") },
          { key: "week", label: t("transactions.quick.week") },
          { key: "month", label: t("transactions.quick.month") },
          { key: "year", label: t("transactions.quick.year") },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => handleQuickDateFilter(item.key)}
            className="px-3 py-2 text-sm font-semibold rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100"
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filters.isRecurring}
            onChange={(e) => setFilters((p) => ({ ...p, isRecurring: e.target.checked }))}
            className="w-4 h-4 accent-emerald-600"
          />
          {t("transactions.filters.onlyRecurring")}
        </label>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 bg-white hover:bg-gray-50"
          >
            {t("transactions.actions.clearFilters")}
          </button>
          <button
            onClick={() => setFilterOpen(false)}
            className={`px-4 py-2 text-sm font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 ${
              inDrawer ? "" : "hidden"
            }`}
          >
            {t("transactions.actions.done")}
          </button>
        </div>
      </div>
    </div>
  );

  const renderRow = (row) => {
    if (row.type === "header") {
      return (
        <div className="sticky top-0 z-10">
          <div className="mx-1 sm:mx-0 bg-gradient-to-r from-gray-50 to-gray-100 px-3 py-2 rounded-xl border border-gray-200">
            <h3 className="font-extrabold text-gray-800 text-xs sm:text-sm">{row.key}</h3>
          </div>
        </div>
      );
    }

    const transaction = row.tx;
    const color = getTransactionTypeColor(transaction.type);

    return (
      <div className="bg-white rounded-2xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all group">
        <div
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${color}22 0%, ${color}10 100%)` }}
        >
          {transaction.type === "income" ? (
            <TrendingUp size={26} style={{ color }} />
          ) : (
            <TrendingDown size={26} style={{ color }} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-extrabold text-gray-900 text-sm sm:text-base truncate">
              {transaction.categoryId?.name ||
                transaction.walletId?.name ||
                getTransactionTypeLabel(transaction.type)}
            </p>

            {transaction.isRecurring && (
              <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                {t("transactions.badges.recurring")}
              </span>
            )}
            {transaction.isSettled && (
              <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                {t("transactions.badges.settledShort")}
              </span>
            )}
          </div>

          {transaction.note && (
            <p className="text-xs sm:text-sm text-gray-600 truncate mt-0.5">{transaction.note}</p>
          )}

          <p className="text-[11px] sm:text-xs text-gray-500 font-semibold mt-1">
            {formatTime(transaction.date)}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <p className="text-base sm:text-xl font-black tabular-nums" style={{ color }}>
            {transaction.type === "income" ? "+" : transaction.type === "transfer" ? "→" : "-"}
            {formatCurrency(Math.abs(transaction.amount))}
          </p>

          <div className="hidden sm:flex gap-1 opacity-0 group-hover:opacity-100 transition">
            <button
              onClick={() => handleEditTransaction(transaction)}
              className="p-2 rounded-xl hover:bg-sky-50"
              title={t("transactions.actions.edit")}
            >
              <Edit size={18} className="text-sky-600" />
            </button>
            <button
              onClick={() => handleDeleteTransaction(transaction)}
              className="p-2 rounded-xl hover:bg-rose-50"
              title={t("transactions.actions.delete")}
            >
              <Trash2 size={18} className="text-rose-600" />
            </button>
          </div>

          {/* Mobile actions */}
          <div className="sm:hidden flex flex-col gap-1">
            <button
              onClick={() => handleEditTransaction(transaction)}
              className="p-2 rounded-xl bg-sky-50"
              title={t("transactions.actions.editShort")}
            >
              <Edit size={16} className="text-sky-600" />
            </button>
            <button
              onClick={() => handleDeleteTransaction(transaction)}
              className="p-2 rounded-xl bg-rose-50"
              title={t("transactions.actions.delete")}
            >
              <Trash2 size={16} className="text-rose-600" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="
        min-h-screen
        bg-gradient-to-b from-emerald-50/70 via-white to-white
        dark:bg-none dark:bg-[var(--color-background)]
      "
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8" ref={listTopRef}>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-black text-gray-900 truncate">
              {t("transactions.title")}
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">
              {t("transactions.subtitle")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterOpen(true)}
              className="sm:hidden inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white"
            >
              <SlidersHorizontal size={18} />
              <span className="text-sm font-semibold">{t("transactions.actions.filter")}</span>
            </button>

            <Dropdown menu={{ items: transactionMenuItems }} trigger={["click"]} placement="bottomRight">
              <button className="hidden sm:flex px-5 py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 shadow-md items-center gap-2">
                <Plus size={20} />
                {t("transactions.actions.add")}
              </button>
            </Dropdown>
          </div>
        </div>

        <SummaryRow />

        <div className="hidden sm:block mb-5">
          <FilterPanel />
        </div>

        <div className="mb-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar bg-white p-1.5 rounded-2xl border border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`shrink-0 px-4 py-2 rounded-xl font-extrabold text-sm transition ${
                  activeTab === tab.key
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-3 sm:px-4 py-3 border-b border-gray-100">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-extrabold">
                    {t("transactions.loaded.prefix")}
                    <span className="text-emerald-900">{transactions.length}</span>
                    <span className="text-emerald-400">/</span>
                    <span className="text-emerald-900">{total || transactions.length || "—"}</span>
                  </span>

                  {hasMore ? (
                    <span className="text-xs font-semibold text-gray-500">
                      • {t("transactions.loaded.pullToLoad")}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-gray-500">
                      • {t("transactions.loaded.allLoaded")}
                    </span>
                  )}
                </div>

                <div className="mt-2 h-1.5 w-full max-w-[360px] bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{
                      width: total ? `${Math.min(100, Math.round((transactions.length / total) * 100))}%` : "0%",
                    }}
                  />
                </div>
              </div>

              <div className="shrink-0">
                <Select
                  value={limit}
                  onChange={(v) => setLimit(v)}
                  size="middle"
                  popupMatchSelectWidth={false}
                  className="min-w-[132px]"
                >
                  <Select.Option value={20}>{t("transactions.pageSize.20")}</Select.Option>
                  <Select.Option value={30}>{t("transactions.pageSize.30")}</Select.Option>
                  <Select.Option value={50}>{t("transactions.pageSize.50")}</Select.Option>
                </Select>
              </div>
            </div>
          </div>

          {flatList.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-14">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <BarChart3 className="text-gray-400" size={32} />
              </div>
              <p className="text-base font-extrabold text-gray-700">{t("transactions.empty.title")}</p>
              <p className="text-sm text-gray-500 mt-1">{t("transactions.empty.hint")}</p>
            </div>
          ) : (
            <div className="h-[70vh]">
              <Virtuoso
                data={flatList}
                itemContent={(index, row) => <div className="px-2 sm:px-4 py-2">{renderRow(row)}</div>}
                endReached={loadMore}
                overscan={400}
                increaseViewportBy={{ top: 400, bottom: 800 }}
                components={{
                  Footer: () => (
                    <div className="py-4 text-center text-sm text-gray-500">
                      {loading
                        ? t("transactions.footer.loading")
                        : hasMore
                        ? t("transactions.footer.pullToLoad")
                        : t("transactions.footer.allLoaded")}
                    </div>
                  ),
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="sm:hidden fixed bottom-5 right-5 z-50">
        <Dropdown menu={{ items: transactionMenuItems }} trigger={["click"]} placement="topRight">
          <button className="w-14 h-14 rounded-2xl bg-emerald-600 text-white shadow-lg flex items-center justify-center active:scale-95">
            <Plus size={24} />
          </button>
        </Dropdown>
      </div>

      <Drawer
        title={<span className="font-extrabold">{t("transactions.drawer.title")}</span>}
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        placement="bottom"
        height="78vh"
      >
        <FilterPanel inDrawer />
      </Drawer>

      <TransactionModal
        open={modalOpen}
        initialType={initialType}
        onClose={() => {
          setModalOpen(false);
          setEditingTransaction(null);
        }}
        transaction={editingTransaction}
        onSuccess={async () => {
          setPage(1);
          setTransactions([]);
          setHasMore(true);
          await loadPage(1, "replace");
          await loadStats();
          setModalOpen(false);
        }}
      />
    </div>
  );
};

export default TransactionsIndex;
