import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, TrendingUp, TrendingDown, ArrowRight, Wallet, BarChart3 } from "lucide-react";
import { message, Dropdown, Modal, Pagination, Select } from "antd";
import { getAllTransactionsAPI, deleteTransactionAPI, getOverviewStatsAPI } from "../../../services/api.transaction";
import { getWalletsAPI } from "../../../services/api.wallet";
import { getCategoriesAPI } from "../../../services/api.category";
import TransactionModal from "../../../components/transactions/TransactionModal";
import DateRangePicker from "../../../components/common/DateRangePicker";
import dayjs from "dayjs";

const TransactionsIndex = () => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [groupedTransactions, setGroupedTransactions] = useState({});
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
        transactionCount: 0,
    });
    const [filters, setFilters] = useState({
        startDate: dayjs().startOf("month"),
        endDate: dayjs().endOf("month"),
        type: "all",
        walletId: "all",
        categoryId: "all",
        isRecurring: false,
    });
    const [activeTab, setActiveTab] = useState("all");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [initialType, setInitialType] = useState("expense");
    const [wallets, setWallets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    useEffect(() => {
        loadWallets();
        loadCategories();
    }, []);

    useEffect(() => {
        loadTransactions();
        loadStats();
    }, [filters, pagination.current, pagination.pageSize, activeTab]);

    const loadWallets = async () => {
        try {
            const res = await getWalletsAPI();
            if (res.EC === 0 && res.data) {
                // Đảm bảo res.data là mảng
                const walletsData = Array.isArray(res.data) ? res.data : [];
                setWallets(walletsData.filter((w) => !w.is_archived));
            } else {
                setWallets([]);
            }
        } catch (error) {
            console.error("Error loading wallets:", error);
            setWallets([]);
        }
    };

    const loadCategories = async () => {
        try {
            const res = await getCategoriesAPI();
            if (res.EC === 0 && res.data) {
                // Đảm bảo res.data là mảng
                setCategories(Array.isArray(res.data) ? res.data : []);
            } else {
                setCategories([]);
            }
        } catch (error) {
            console.error("Error loading categories:", error);
            setCategories([]);
        }
    };

    const loadTransactions = async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.current,
                limit: pagination.pageSize,
                startDate: filters.startDate?.toISOString(),
                endDate: filters.endDate?.toISOString(),
                isRecurring: filters.isRecurring,
            };

            if (activeTab !== "all") {
                if (activeTab === "debt_loan") {
                    params.type = "debt,loan";
                } else {
                    params.type = activeTab;
                }
            } else if (filters.type !== "all") {
                params.type = filters.type;
            }

            if (filters.walletId !== "all") {
                params.walletId = filters.walletId;
            }

            if (filters.categoryId !== "all") {
                params.categoryId = filters.categoryId;
            }

            const res = await getAllTransactionsAPI(params);
            if (res.status || res.EC === 0) {
                const data = res.data?.transactions || res.data || [];
                setTransactions(data);
                setPagination((prev) => ({
                    ...prev,
                    total: res.data?.total || res.total || 0,
                }));
                groupTransactionsByDate(data);
            } else {
                message.error("Không thể tải danh sách giao dịch!");
            }
        } catch (error) {
            message.error("Có lỗi xảy ra khi tải giao dịch!");
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const params = {
                startDate: filters.startDate?.toISOString(),
                endDate: filters.endDate?.toISOString(),
            };
            const res = await getOverviewStatsAPI(params);
            if (res.status || res.EC === 0) {
                const data = res.data || {};
                setStats({
                    totalIncome: data.totalIncome || 0,
                    totalExpense: data.totalExpense || 0,
                    balance: (data.totalIncome || 0) - (data.totalExpense || 0),
                    transactionCount: data.transactionCount || 0,
                });
            }
        } catch (error) {
            console.error("Error loading stats:", error);
        }
    };

    const groupTransactionsByDate = (transactionsList) => {
        const grouped = {};
        transactionsList.forEach((transaction) => {
            const date = dayjs(transaction.date);
            const today = dayjs();
            const yesterday = today.subtract(1, "day");

            let dateKey;
            if (date.isSame(today, "day")) {
                dateKey = "Hôm nay";
            } else if (date.isSame(yesterday, "day")) {
                dateKey = "Hôm qua";
            } else {
                dateKey = date.format("DD/MM/YYYY");
            }

            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(transaction);
        });
        setGroupedTransactions(grouped);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount);
    };

    const formatTime = (date) => {
        return dayjs(date).format("HH:mm");
    };

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

    const handleAddTransaction = (type) => {
        // Khi thêm mới, luôn reset transaction đang sửa
        setEditingTransaction(null);
        // Lưu loại giao dịch được chọn để truyền xuống modal
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
            content: `Bạn có chắc chắn muốn xóa giao dịch này?`,
            okText: "Xóa",
            okType: "danger",
            cancelText: "Hủy",
            onOk: async () => {
                try {
                    const res = await deleteTransactionAPI(transaction._id);
                    if (res.status || res.EC === 0) {
                        message.success("Xóa giao dịch thành công!");
                        loadTransactions();
                        loadStats();
                    } else {
                        message.error(res.message || "Xóa giao dịch thất bại!");
                    }
                } catch (error) {
                    message.error("Có lỗi xảy ra!");
                }
            },
        });
    };

    const handleApplyFilters = () => {
        setPagination((prev) => ({ ...prev, current: 1 }));
        loadTransactions();
        loadStats();
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
        setPagination((prev) => ({ ...prev, current: 1 }));
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

    const transactionMenuItems = [
        { key: "income", label: "Thu nhập", onClick: () => handleAddTransaction("income") },
        { key: "expense", label: "Chi tiêu", onClick: () => handleAddTransaction("expense") },
        { key: "transfer", label: "Chuyển tiền", onClick: () => handleAddTransaction("transfer") },
        { key: "debt", label: "Nợ phải thu", onClick: () => handleAddTransaction("debt") },
        { key: "loan", label: "Nợ phải trả", onClick: () => handleAddTransaction("loan") },
        { key: "adjust", label: "Điều chỉnh", onClick: () => handleAddTransaction("adjust") },
    ];

    const tabs = [
        { key: "all", label: "Tất cả" },
        { key: "income", label: "Thu nhập" },
        { key: "expense", label: "Chi tiêu" },
        { key: "transfer", label: "Chuyển tiền" },
        { key: "debt_loan", label: "Nợ & Vay" },
        { key: "recurring", label: "Định kỳ" },
    ];

    return (
        <div className="min-h-screen bg-[#F9FAFB]">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header Section - Redesigned */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 bg-clip-text text-transparent">
                            Giao dịch
                        </h1>
                        <p className="text-gray-600 mt-1 text-sm">Quản lý và theo dõi tất cả giao dịch của bạn</p>
                    </div>
                    <Dropdown
                        menu={{ items: transactionMenuItems }}
                        trigger={["click"]}
                        placement="bottomRight"
                    >
                        <button
                            className="px-5 py-3 bg-gradient-to-r from-[#10B981] to-emerald-600 text-white font-semibold rounded-xl hover:from-[#059669] hover:to-[#10B981] shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                        >
                            <Plus size={20} />
                            Thêm giao dịch
                        </button>
                    </Dropdown>
                </div>

                {/* Summary Cards - Redesigned */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Income Card */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 rounded-2xl p-6 border border-green-100 shadow-lg hover:shadow-xl transition-all duration-300 group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                    <TrendingUp className="text-white w-7 h-7" />
                                </div>
                            </div>
                            <p className="text-sm font-medium text-gray-600 mb-2">Tổng thu</p>
                            <p className="text-3xl font-bold text-[#10B981] mb-1">
                                {formatCurrency(stats.totalIncome)}
                            </p>
                        </div>
                    </div>

                    {/* Total Expense Card */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-red-50 via-pink-50 to-red-100 rounded-2xl p-6 border border-red-100 shadow-lg hover:shadow-xl transition-all duration-300 group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-200 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-red-400 to-pink-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                    <TrendingDown className="text-white w-7 h-7" />
                                </div>
                            </div>
                            <p className="text-sm font-medium text-gray-600 mb-2">Tổng chi</p>
                            <p className="text-3xl font-bold text-[#EF4444] mb-1">
                                {formatCurrency(stats.totalExpense)}
                            </p>
                        </div>
                    </div>

                    {/* Balance Card */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300 group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                    <Wallet className="text-white w-7 h-7" />
                                </div>
                            </div>
                            <p className="text-sm font-medium text-gray-600 mb-2">Số dư</p>
                            <p className="text-3xl font-bold text-[#3B82F6] mb-1">
                                {formatCurrency(stats.balance)}
                            </p>
                        </div>
                    </div>

                    {/* Transaction Count Card */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gray-200 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-gray-400 to-slate-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                    <BarChart3 className="text-white w-7 h-7" />
                                </div>
                            </div>
                            <p className="text-sm font-medium text-gray-600 mb-2">Số giao dịch</p>
                            <p className="text-3xl font-bold text-[#6B7280] mb-1">
                                {stats.transactionCount}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filter Bar - Redesigned */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Khoảng thời gian</label>
                            <DateRangePicker
                                value={[filters.startDate, filters.endDate]}
                                onChange={(dates) => {
                                    if (dates) {
                                        setFilters((prev) => ({
                                            ...prev,
                                            startDate: dates[0],
                                            endDate: dates[1],
                                        }));
                                    }
                                }}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Loại giao dịch</label>
                            <Select
                                style={{ width: "100%" }}
                                value={filters.type}
                                onChange={(value) => setFilters((prev) => ({ ...prev, type: value }))}
                            >
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
                            <label className="block text-sm font-medium mb-2">Ví</label>
                            <Select
                                style={{ width: "100%" }}
                                value={filters.walletId}
                                onChange={(value) => setFilters((prev) => ({ ...prev, walletId: value }))}
                            >
                                <Select.Option value="all">Tất cả ví</Select.Option>
                                {Array.isArray(wallets) && wallets.map((wallet) => (
                                    <Select.Option key={wallet._id} value={wallet._id}>
                                        {wallet.name}
                                    </Select.Option>
                                ))}
                            </Select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Danh mục</label>
                            <Select
                                style={{ width: "100%" }}
                                value={filters.categoryId}
                                onChange={(value) => setFilters((prev) => ({ ...prev, categoryId: value }))}
                            >
                                <Select.Option value="all">Tất cả danh mục</Select.Option>
                                {Array.isArray(categories) && categories.map((category) => (
                                    <Select.Option key={category._id} value={category._id}>
                                        {category.name}
                                    </Select.Option>
                                ))}
                            </Select>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-gray-100">
                        <div className="flex flex-wrap gap-2">
                            {[
                                { key: "today", label: "Hôm nay" },
                                { key: "week", label: "Tuần này" },
                                { key: "month", label: "Tháng này" },
                                { key: "year", label: "Năm này" },
                            ].map((item) => (
                                <button
                                    key={item.key}
                                    onClick={() => handleQuickDateFilter(item.key)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-all duration-200"
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={filters.isRecurring}
                                    onChange={(e) =>
                                        setFilters((prev) => ({ ...prev, isRecurring: e.target.checked }))
                                    }
                                    className="w-4 h-4 text-[#10B981] border-gray-300 rounded focus:ring-[#10B981]"
                                />
                                <span className="text-sm text-gray-700">Chỉ hiển thị giao dịch định kỳ</span>
                            </label>
                            <button
                                onClick={handleClearFilters}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
                            >
                                Xóa bộ lọc
                            </button>
                            <button
                                onClick={handleApplyFilters}
                                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#10B981] to-emerald-600 rounded-lg hover:from-[#059669] hover:to-[#10B981] shadow-md hover:shadow-lg transition-all duration-200"
                            >
                                Áp dụng
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs - Redesigned */}
                <div className="flex gap-2 mb-6 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm inline-flex">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${activeTab === tab.key
                                    ? "bg-gradient-to-r from-[#10B981] to-emerald-600 text-white shadow-md"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Transactions List */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="ds-card ds-skeleton" style={{ height: "80px" }}></div>
                        ))}
                    </div>
                ) : Object.keys(groupedTransactions).length > 0 ? (
                    <div className="space-y-6">
                        {Object.entries(groupedTransactions).map(([dateKey, dateTransactions]) => (
                            <div key={dateKey}>
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-2.5 mb-3 rounded-lg border border-gray-200">
                                    <h3 className="font-semibold text-gray-800 text-sm">{dateKey}</h3>
                                </div>
                                <div className="space-y-3">
                                    {dateTransactions.map((transaction) => (
                                        <div
                                            key={transaction._id}
                                            className="bg-white rounded-xl p-4 flex items-center gap-4 hover:shadow-md border border-gray-200 hover:border-gray-300 transition-all duration-200 group cursor-pointer"
                                        >
                                            <div
                                                className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform"
                                                style={{
                                                    background: `linear-gradient(135deg, ${getTransactionTypeColor(transaction.type)}20 0%, ${getTransactionTypeColor(transaction.type)}10 100%)`,
                                                }}
                                            >
                                                {transaction.type === "income" ? (
                                                    <TrendingUp
                                                        size={28}
                                                        style={{ color: getTransactionTypeColor(transaction.type) }}
                                                    />
                                                ) : (
                                                    <TrendingDown
                                                        size={28}
                                                        style={{ color: getTransactionTypeColor(transaction.type) }}
                                                    />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <p className="font-semibold text-gray-900 text-base">
                                                        {transaction.categoryId?.name ||
                                                            transaction.walletId?.name ||
                                                            getTransactionTypeLabel(transaction.type)}
                                                    </p>
                                                    {transaction.isRecurring && (
                                                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-md border border-purple-200">
                                                            Định kỳ
                                                        </span>
                                                    )}
                                                    {transaction.isSettled && (
                                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-md border border-green-200">
                                                            Đã thanh toán
                                                        </span>
                                                    )}
                                                </div>
                                                {transaction.note && (
                                                    <p className="text-sm text-gray-600 truncate mb-1">{transaction.note}</p>
                                                )}
                                                <p className="text-xs text-gray-500 font-medium">
                                                    {formatTime(transaction.date)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <p
                                                    className="text-xl font-bold"
                                                    style={{ color: getTransactionTypeColor(transaction.type) }}
                                                >
                                                    {transaction.type === "income" ? "+" : transaction.type === "transfer" ? "→" : "-"}
                                                    {formatCurrency(Math.abs(transaction.amount))}
                                                </p>
                                                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEditTransaction(transaction);
                                                        }}
                                                        className="p-2.5 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Edit size={18} className="text-blue-600" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteTransaction(transaction);
                                                        }}
                                                        className="p-2.5 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 size={18} className="text-red-600" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-200">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <BarChart3 className="text-gray-400" size={40} />
                        </div>
                        <p className="text-lg font-semibold text-gray-700 mb-2">Chưa có giao dịch nào</p>
                        <p className="text-sm text-gray-500 mb-6">Hãy bắt đầu bằng cách thêm giao dịch đầu tiên của bạn</p>
                        <button
                            onClick={() => handleAddTransaction()}
                            className="px-6 py-3 bg-gradient-to-r from-[#10B981] to-emerald-600 text-white font-semibold rounded-lg hover:from-[#059669] hover:to-[#10B981] shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                        >
                            <Plus size={20} />
                            Thêm giao dịch đầu tiên
                        </button>
                    </div>
                )}

                {/* Pagination - Redesigned */}
                {pagination.total > 0 && (
                    <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex flex-wrap items-center gap-4">
                            <span className="text-sm text-gray-600 font-medium">
                                Hiển thị <span className="font-bold text-gray-900">{(pagination.current - 1) * pagination.pageSize + 1}</span>-
                                <span className="font-bold text-gray-900">{Math.min(pagination.current * pagination.pageSize, pagination.total)}</span> trong tổng{" "}
                                <span className="font-bold text-gray-900">{pagination.total}</span> giao dịch
                            </span>
                            <Select
                                value={pagination.pageSize}
                                onChange={(value) =>
                                    setPagination((prev) => ({ ...prev, pageSize: value, current: 1 }))
                                }
                                className="min-w-[120px]"
                                size="middle"
                            >
                                <Select.Option value={10}>10/trang</Select.Option>
                                <Select.Option value={20}>20/trang</Select.Option>
                                <Select.Option value={50}>50/trang</Select.Option>
                                <Select.Option value={100}>100/trang</Select.Option>
                            </Select>
                        </div>
                        <Pagination
                            current={pagination.current}
                            total={pagination.total}
                            pageSize={pagination.pageSize}
                            onChange={(page) => setPagination((prev) => ({ ...prev, current: page }))}
                            showSizeChanger={false}
                            className="[&_.ant-pagination-item]:rounded-lg [&_.ant-pagination-item-active]:bg-gradient-to-r [&_.ant-pagination-item-active]:from-[#10B981] [&_.ant-pagination-item-active]:to-emerald-600 [&_.ant-pagination-item-active]:border-none [&_.ant-pagination-item-active_a]:text-white"
                        />
                    </div>
                )}
            </div>

            {/* Transaction Modal */}
            <TransactionModal
                open={modalOpen}
                initialType={initialType}
                onClose={() => {
                    setModalOpen(false);
                    setEditingTransaction(null);
                }}
                transaction={editingTransaction}
                onSuccess={() => {
                    loadTransactions();
                    loadStats();
                    setModalOpen(false);
                }}
            />
        </div>
    );
};

export default TransactionsIndex;

