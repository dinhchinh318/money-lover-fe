import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus, Edit, Trash2, TrendingUp, TrendingDown, Wallet, BarChart3,
  ChevronLeft, ChevronRight, SlidersHorizontal
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

const TransactionsIndex = () => {
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
  const [limit, setLimit] = useState(30); // mobile list mượt hơn với page nhỏ
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // mobile ui
  const [filterOpen, setFilterOpen] = useState(false);
  const listTopRef = useRef(null);

  const tabs = [
    { key: "all", label: "Tất cả" },
    { key: "income", label: "Thu nhập" },
    { key: "expense", label: "Chi tiêu" },
    { key: "transfer", label: "Chuyển tiền" },
    { key: "debt_loan", label: "Nợ & Vay" },
    { key: "recurring", label: "Định kỳ" },
  ];

  const transactionMenuItems = [
    { key: "income", label: "Thu nhập", onClick: () => handleAddTransaction("income") },
    { key: "expense", label: "Chi tiêu", onClick: () => handleAddTransaction("expense") },
    { key: "transfer", label: "Chuyển tiền", onClick: () => handleAddTransaction("transfer") },
    { key: "debt", label: "Nợ phải thu", onClick: () => handleAddTransaction("debt") },
    { key: "loan", label: "Nợ phải trả", onClick: () => handleAddTransaction("loan") },
    { key: "adjust", label: "Điều chỉnh", onClick: () => handleAddTransaction("adjust") },
  ];

  // ---------- helpers ----------
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

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
      income: "Thu nhập",
      expense: "Chi tiêu",
      transfer: "Chuyển tiền",
      debt: "Nợ phải thu",
      loan: "Nợ phải trả",
      adjust: "Điều chỉnh",
    };
    return labels[type] || type;
  };

  const getDateKey = (d) => {
    const date = dayjs(d);
    const today = dayjs();
    const yesterday = today.subtract(1, "day");
    if (date.isSame(today, "day")) return "Hôm nay";
    if (date.isSame(yesterday, "day")) return "Hôm qua";
    return date.format("DD/MM/YYYY");
  };

  // group + flatten (for virtuoso)
  const flatList = useMemo(() => {
    // group by dateKey, keep order as incoming list order
    const grouped = new Map();
    for (const tx of transactions) {
      const key = getDateKey(tx.date);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(tx);
    }

    // flatten => {type:'header', key} | {type:'item', tx}
    const out = [];
    for (const [key, arr] of grouped.entries()) {
      out.push({ type: "header", key });
      for (const tx of arr) out.push({ type: "item", tx });
    }
    return out;
  }, [transactions]);

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
      // reset paging
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

    // tab overrides
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
        message.error("Không thể tải danh sách giao dịch!");
        return;
      }

      const data = res?.data?.transactions || res?.data || [];
      const totalCount = res?.data?.total || res?.total || 0;

      setTotal(totalCount);

      setTransactions((prev) => (mode === "append" ? [...prev, ...data] : data));

      const loadedCount = (mode === "append" ? transactions.length : 0) + data.length;
      setHasMore(loadedCount < totalCount);
    } catch (e) {
      message.error("Có lỗi xảy ra khi tải giao dịch!");
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
      title: "Xác nhận xóa giao dịch",
      content: "Bạn có chắc chắn muốn xóa giao dịch này?",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          const res = await deleteTransactionAPI(transaction._id);
          if (res?.status || res?.EC === 0) {
            message.success("Xóa giao dịch thành công!");
            // reload from scratch (an toàn khi đang infinite)
            setPage(1);
            setTransactions([]);
            setHasMore(true);
            await loadPage(1, "replace");
            await loadStats();
          } else {
            message.error(res?.message || "Xóa giao dịch thất bại!");
          }
        } catch (e) {
          message.error("Có lỗi xảy ra!");
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
            <p className="text-xs text-gray-500">Tổng thu</p>
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
            <p className="text-xs text-gray-500">Tổng chi</p>
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
            <p className="text-xs text-gray-500">Số dư ví</p>
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
            <p className="text-xs text-gray-500">Số giao dịch</p>
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
          <label className="block text-sm font-semibold text-gray-700 mb-2">Khoảng thời gian</label>
          <DateRangePicker
            value={[filters.startDate, filters.endDate]}
            onChange={(dates) => {
              if (dates) setFilters((p) => ({ ...p, startDate: dates[0], endDate: dates[1] }));
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Loại giao dịch</label>
          <Select style={{ width: "100%" }} value={filters.type}
            onChange={(value) => setFilters((p) => ({ ...p, type: value }))}>
            <Select.Option value="all">Tất cả</Select.Option>
            <Select.Option value="income">Thu nhập</Select.Option>
            <Select.Option value="expense">Chi tiêu</Select.Option>
            <Select.Option value="transfer">Chuyển tiền</Select.Option>
            <Select.Option value="debt">Nợ phải thu</Select.Option>
            <Select.Option value="loan">Nợ phải trả</Select.Option>
            <Select.Option value="adjust">Điều chỉnh</Select.Option>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Ví</label>
          <Select style={{ width: "100%" }} value={filters.walletId}
            onChange={(value) => setFilters((p) => ({ ...p, walletId: value }))}>
            <Select.Option value="all">Tất cả ví</Select.Option>
            {wallets.map((w) => (
              <Select.Option key={w._id} value={w._id}>{w.name}</Select.Option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Danh mục</label>
          <Select style={{ width: "100%" }} value={filters.categoryId}
            onChange={(value) => setFilters((p) => ({ ...p, categoryId: value }))}>
            <Select.Option value="all">Tất cả danh mục</Select.Option>
            {categories.map((c) => (
              <Select.Option key={c._id} value={c._id}>{c.name}</Select.Option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        {[
          { key: "today", label: "Hôm nay" },
          { key: "week", label: "Tuần này" },
          { key: "month", label: "Tháng này" },
          { key: "year", label: "Năm này" },
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
          Chỉ định kỳ
        </label>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 bg-white hover:bg-gray-50"
          >
            Xóa lọc
          </button>
          <button
            onClick={() => setFilterOpen(false)}
            className={`px-4 py-2 text-sm font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 ${inDrawer ? "" : "hidden"}`}
          >
            Xong
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
      <div
        className="bg-white rounded-2xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all group"
      >
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
                Định kỳ
              </span>
            )}
            {transaction.isSettled && (
              <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                Đã TT
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
              title="Chỉnh sửa"
            >
              <Edit size={18} className="text-sky-600" />
            </button>
            <button
              onClick={() => handleDeleteTransaction(transaction)}
              className="p-2 rounded-xl hover:bg-rose-50"
              title="Xóa"
            >
              <Trash2 size={18} className="text-rose-600" />
            </button>
          </div>

          {/* Mobile actions */}
          <div className="sm:hidden flex flex-col gap-1">
            <button
              onClick={() => handleEditTransaction(transaction)}
              className="p-2 rounded-xl bg-sky-50"
              title="Sửa"
            >
              <Edit size={16} className="text-sky-600" />
            </button>
            <button
              onClick={() => handleDeleteTransaction(transaction)}
              className="p-2 rounded-xl bg-rose-50"
              title="Xóa"
            >
              <Trash2 size={16} className="text-rose-600" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/70 via-white to-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8" ref={listTopRef}>
        {/* Header - sticky 느낌 */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-black text-gray-900 truncate">Giao dịch</h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">
              Quản lý và theo dõi tất cả giao dịch của bạn
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile filter button */}
            <button
              onClick={() => setFilterOpen(true)}
              className="sm:hidden inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white"
            >
              <SlidersHorizontal size={18} />
              <span className="text-sm font-semibold">Lọc</span>
            </button>

            {/* Add */}
            <Dropdown menu={{ items: transactionMenuItems }} trigger={["click"]} placement="bottomRight">
              <button className="hidden sm:flex px-5 py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 shadow-md items-center gap-2">
                <Plus size={20} />
                Thêm giao dịch
              </button>
            </Dropdown>
          </div>
        </div>

        <SummaryRow />

        {/* Desktop filters */}
        <div className="hidden sm:block mb-5">
          <FilterPanel />
        </div>

        {/* Tabs - horizontal scroll on mobile */}
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

        {/* Virtualized list */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-3 sm:px-4 py-3 border-b border-gray-100">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-extrabold">
                    Đã tải
                    <span className="text-emerald-900">{transactions.length}</span>
                    <span className="text-emerald-400">/</span>
                    <span className="text-emerald-900">{total || transactions.length || "—"}</span>
                    </span>

                    {hasMore ? (
                    <span className="text-xs font-semibold text-gray-500">• Kéo xuống để tải thêm</span>
                    ) : (
                    <span className="text-xs font-semibold text-gray-500">• Đã tải hết</span>
                    )}
                </div>

                {/* progress bar nhẹ */}
                <div className="mt-2 h-1.5 w-full max-w-[360px] bg-gray-100 rounded-full overflow-hidden">
                    <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{
                        width: total ? `${Math.min(100, Math.round((transactions.length / total) * 100))}%` : "0%",
                    }}
                    />
                </div>
                </div>

                {/* Page size pill */}
                <div className="shrink-0">
                <Select
                    value={limit}
                    onChange={(v) => setLimit(v)}
                    size="middle"
                    popupMatchSelectWidth={false}
                    className="min-w-[132px]"
                >
                    <Select.Option value={20}>20 giao dịch/ trang</Select.Option>
                    <Select.Option value={30}>30 giao dịch/ trang</Select.Option>
                    <Select.Option value={50}>50 giao dịch/ trang</Select.Option>
                </Select>

                </div>
            </div>
            </div>

          {flatList.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-14">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <BarChart3 className="text-gray-400" size={32} />
              </div>
              <p className="text-base font-extrabold text-gray-700">Chưa có giao dịch</p>
              <p className="text-sm text-gray-500 mt-1">Hãy thêm giao dịch đầu tiên</p>
            </div>
          ) : (
            <div className="h-[70vh]">
              <Virtuoso
                data={flatList}
                itemContent={(index, row) => (
                  <div className="px-2 sm:px-4 py-2">{renderRow(row)}</div>
                )}
                endReached={loadMore}
                overscan={400}
                increaseViewportBy={{ top: 400, bottom: 800 }}
                components={{
                  Footer: () => (
                    <div className="py-4 text-center text-sm text-gray-500">
                      {loading ? "Đang tải..." : hasMore ? "Kéo xuống để tải thêm" : "Đã tải hết"}
                    </div>
                  ),
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Mobile floating add button */}
      <div className="sm:hidden fixed bottom-5 right-5 z-50">
        <Dropdown menu={{ items: transactionMenuItems }} trigger={["click"]} placement="topRight">
          <button className="w-14 h-14 rounded-2xl bg-emerald-600 text-white shadow-lg flex items-center justify-center active:scale-95">
            <Plus size={24} />
          </button>
        </Dropdown>
      </div>

      {/* Mobile filter drawer */}
      <Drawer
        title={<span className="font-extrabold">Bộ lọc</span>}
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        placement="bottom"
        height="78vh"
      >
        <FilterPanel inDrawer />
      </Drawer>

      {/* Modal */}
      <TransactionModal
        open={modalOpen}
        initialType={initialType}
        onClose={() => {
          setModalOpen(false);
          setEditingTransaction(null);
        }}
        transaction={editingTransaction}
        onSuccess={async () => {
          // reload to reflect changes
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
