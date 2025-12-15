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
        setEditingTransaction(null);
        setModalOpen(true);
        // Set transaction type if provided
        if (type) {
            setTimeout(() => {
                // Type will be set in modal
            }, 100);
        }
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
                {/* Header Section */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="ds-heading-1" style={{ fontSize: "24px", fontWeight: 700 }}>
                        Giao dịch
                    </h1>
                    <Dropdown
                        menu={{ items: transactionMenuItems }}
                        trigger={["click"]}
                        placement="bottomRight"
                    >
                        <button
                            className="ds-button-primary"
                            style={{ display: "flex", alignItems: "center", gap: "8px" }}
                        >
                            <Plus size={18} />
                            Thêm giao dịch
                        </button>
                    </Dropdown>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div className="ds-card">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-[#10B981]/10 rounded-lg flex items-center justify-center">
                                <TrendingUp className="text-[#10B981] w-6 h-6" />
                            </div>
                        </div>
                        <p className="ds-text-secondary mb-1">Tổng thu</p>
                        <p className="text-2xl font-bold text-[#10B981]">
                            {formatCurrency(stats.totalIncome)}
                        </p>
                    </div>

                    <div className="ds-card">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-[#EF4444]/10 rounded-lg flex items-center justify-center">
                                <TrendingDown className="text-[#EF4444] w-6 h-6" />
                            </div>
                        </div>
                        <p className="ds-text-secondary mb-1">Tổng chi</p>
                        <p className="text-2xl font-bold text-[#EF4444]">
                            {formatCurrency(stats.totalExpense)}
                        </p>
                    </div>

                    <div className="ds-card">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-[#3B82F6]/10 rounded-lg flex items-center justify-center">
                                <Wallet className="text-[#3B82F6] w-6 h-6" />
                            </div>
                        </div>
                        <p className="ds-text-secondary mb-1">Số dư</p>
                        <p className="text-2xl font-bold text-[#3B82F6]">
                            {formatCurrency(stats.balance)}
                        </p>
                    </div>

                    <div className="ds-card">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-[#6B7280]/10 rounded-lg flex items-center justify-center">
                                <BarChart3 className="text-[#6B7280] w-6 h-6" />
                            </div>
                        </div>
                        <p className="ds-text-secondary mb-1">Số giao dịch</p>
                        <p className="text-2xl font-bold text-[#6B7280]">
                            {stats.transactionCount}
                        </p>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="ds-card mb-6">
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

                    <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleQuickDateFilter("today")}
                                className="px-3 py-1 text-sm border border-[#E5E7EB] rounded-md hover:bg-[#F9FAFB]"
                            >
                                Hôm nay
                            </button>
                            <button
                                onClick={() => handleQuickDateFilter("week")}
                                className="px-3 py-1 text-sm border border-[#E5E7EB] rounded-md hover:bg-[#F9FAFB]"
                            >
                                Tuần này
                            </button>
                            <button
                                onClick={() => handleQuickDateFilter("month")}
                                className="px-3 py-1 text-sm border border-[#E5E7EB] rounded-md hover:bg-[#F9FAFB]"
                            >
                                Tháng này
                            </button>
                            <button
                                onClick={() => handleQuickDateFilter("year")}
                                className="px-3 py-1 text-sm border border-[#E5E7EB] rounded-md hover:bg-[#F9FAFB]"
                            >
                                Năm này
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={filters.isRecurring}
                                    onChange={(e) =>
                                        setFilters((prev) => ({ ...prev, isRecurring: e.target.checked }))
                                    }
                                />
                                <span className="text-sm">Chỉ hiển thị giao dịch định kỳ</span>
                            </label>
                            <button onClick={handleApplyFilters} className="ds-button-primary">
                                Áp dụng
                            </button>
                            <button onClick={handleClearFilters} className="ds-button-secondary">
                                Xóa bộ lọc
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 bg-white p-1 rounded-lg border border-[#E5E7EB] inline-flex">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-2 rounded-md font-medium transition-all ${
                                activeTab === tab.key
                                    ? "bg-[#10B981] text-white shadow-sm"
                                    : "text-[#6B7280] hover:bg-[#F9FAFB]"
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
                                <div className="bg-[#F9FAFB] px-4 py-2 mb-2 rounded-lg">
                                    <h3 className="font-semibold text-[#111827]">{dateKey}</h3>
                                </div>
                                <div className="space-y-2">
                                    {dateTransactions.map((transaction) => (
                                        <div
                                            key={transaction._id}
                                            className="ds-card flex items-center gap-4 hover:bg-[#F9FAFB] transition-colors group"
                                        >
                                            <div
                                                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                                                style={{
                                                    backgroundColor: `${getTransactionTypeColor(transaction.type)}20`,
                                                }}
                                            >
                                                {transaction.type === "income" ? (
                                                    <TrendingUp
                                                        size={24}
                                                        style={{ color: getTransactionTypeColor(transaction.type) }}
                                                    />
                                                ) : (
                                                    <TrendingDown
                                                        size={24}
                                                        style={{ color: getTransactionTypeColor(transaction.type) }}
                                                    />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-semibold text-[#111827]">
                                                        {transaction.categoryId?.name ||
                                                            transaction.walletId?.name ||
                                                            getTransactionTypeLabel(transaction.type)}
                                                    </p>
                                                    {transaction.isRecurring && (
                                                        <span className="ds-badge" style={{ backgroundColor: "#A855F720", color: "#A855F7" }}>
                                                            Định kỳ
                                                        </span>
                                                    )}
                                                    {transaction.isSettled && (
                                                        <span className="ds-badge ds-badge-success">
                                                            Đã thanh toán
                                                        </span>
                                                    )}
                                                </div>
                                                {transaction.note && (
                                                    <p className="text-sm text-[#6B7280] truncate">{transaction.note}</p>
                                                )}
                                                <p className="text-xs text-[#6B7280]">
                                                    {formatTime(transaction.date)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <p
                                                    className="text-lg font-bold"
                                                    style={{ color: getTransactionTypeColor(transaction.type) }}
                                                >
                                                    {transaction.type === "income" ? "+" : transaction.type === "transfer" ? "→" : "-"}
                                                    {formatCurrency(Math.abs(transaction.amount))}
                                                </p>
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEditTransaction(transaction)}
                                                        className="p-2 hover:bg-[#E5E7EB] rounded-lg transition-colors"
                                                    >
                                                        <Edit size={16} className="text-[#6B7280]" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteTransaction(transaction)}
                                                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={16} className="text-[#EF4444]" />
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
                    <div className="ds-empty-state">
                        <BarChart3 className="ds-empty-state-icon" size={64} />
                        <p className="ds-empty-state-text">Chưa có giao dịch nào</p>
                        <button
                            onClick={() => handleAddTransaction()}
                            className="ds-button-primary mt-4"
                        >
                            Thêm giao dịch đầu tiên
                        </button>
                    </div>
                )}

                {/* Pagination */}
                {pagination.total > 0 && (
                    <div className="mt-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-[#6B7280]">
                                Hiển thị {(pagination.current - 1) * pagination.pageSize + 1}-
                                {Math.min(pagination.current * pagination.pageSize, pagination.total)} trong tổng{" "}
                                {pagination.total} giao dịch
                            </span>
                            <Select
                                value={pagination.pageSize}
                                onChange={(value) =>
                                    setPagination((prev) => ({ ...prev, pageSize: value, current: 1 }))
                                }
                                style={{ width: 120 }}
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
                        />
                    </div>
                )}
            </div>

            {/* Transaction Modal */}
            <TransactionModal
                open={modalOpen}
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

