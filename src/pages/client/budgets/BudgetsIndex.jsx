import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Copy, Pause, TrendingUp, Wallet, AlertTriangle, CheckCircle } from "lucide-react";
import { message, Dropdown, Modal } from "antd";
import { getAllBudgetsAPI, deleteBudgetAPI } from "../../../services/api.budget";
import { getCategoriesAPI } from "../../../services/api.category";
import BudgetModal from "../../../components/budgets/BudgetModal";
import dayjs from "dayjs";

const BudgetsIndex = () => {
    const navigate = useNavigate();
    const [budgets, setBudgets] = useState([]);
    const [filteredBudgets, setFilteredBudgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all"); // all, active, expired
    const [modalOpen, setModalOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState(null);
    const [summary, setSummary] = useState({
        totalBudgets: 0,
        totalLimit: 0,
        totalSpent: 0,
        warningCount: 0,
    });

    useEffect(() => {
        loadBudgets();
    }, []);

    useEffect(() => {
        filterBudgets();
        calculateSummary();
    }, [budgets, activeTab]);

    const loadBudgets = async () => {
        try {
            setLoading(true);
            const res = await getAllBudgetsAPI();
            if (res.status || res.EC === 0) {
                const budgetsData = res.data?.budgets || res.data || [];
                setBudgets(Array.isArray(budgetsData) ? budgetsData : []);
            } else {
                message.error("Không thể tải danh sách ngân sách!");
            }
        } catch (error) {
            message.error("Có lỗi xảy ra khi tải danh sách ngân sách!");
        } finally {
            setLoading(false);
        }
    };

    const filterBudgets = () => {
        let filtered = [...budgets];
        const now = dayjs();

        if (activeTab === "active") {
            filtered = filtered.filter((budget) => {
                if (!budget.end_date) return true;
                return dayjs(budget.end_date).isAfter(now);
            });
        } else if (activeTab === "expired") {
            filtered = filtered.filter((budget) => {
                if (!budget.end_date) return false;
                return dayjs(budget.end_date).isBefore(now);
            });
        }

        setFilteredBudgets(filtered);
    };

    const calculateSummary = () => {
        const total = budgets.length;
        const totalLimit = budgets.reduce((sum, b) => sum + (b.limit_amount || 0), 0);
        const totalSpent = budgets.reduce((sum, b) => sum + (b.spent_amount || 0), 0);
        const warning = budgets.filter((b) => {
            const percentage = ((b.spent_amount || 0) / (b.limit_amount || 1)) * 100;
            return percentage >= 80;
        }).length;

        setSummary({
            totalBudgets: total,
            totalLimit,
            totalSpent,
            warningCount: warning,
        });
    };

    const calculateBudgetStatus = (budget) => {
        const spent = budget.spent_amount || 0;
        const limit = budget.limit_amount || 1;
        const percentage = (spent / limit) * 100;
        const now = dayjs();
        const endDate = budget.end_date ? dayjs(budget.end_date) : null;

        let status = "safe";
        let statusLabel = "An toàn";
        let statusColor = "#10B981";

        if (endDate && endDate.isBefore(now)) {
            status = "expired";
            statusLabel = "Đã hết hạn";
            statusColor = "#6B7280";
        } else if (percentage >= 100) {
            status = "danger";
            statusLabel = "Vượt ngân sách";
            statusColor = "#EF4444";
        } else if (percentage >= 80) {
            status = "warning";
            statusLabel = "Cảnh báo";
            statusColor = "#F59E0B";
        } else if (percentage >= 50) {
            status = "notice";
            statusLabel = "Chú ý";
            statusColor = "#3B82F6";
        }

        return { status, statusLabel, statusColor, percentage };
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount);
    };

    const formatDate = (date) => {
        if (!date) return "Không có hạn";
        return dayjs(date).format("DD/MM/YYYY");
    };

    const handleAddBudget = () => {
        setEditingBudget(null);
        setModalOpen(true);
    };

    const handleEditBudget = (budget) => {
        setEditingBudget(budget);
        setModalOpen(true);
    };

    const handleDeleteBudget = (budget) => {
        Modal.confirm({
            title: "Xác nhận xóa ngân sách",
            content: `Bạn có chắc chắn muốn xóa ngân sách "${budget.name || budget.category?.name}"?`,
            okText: "Xóa",
            okType: "danger",
            cancelText: "Hủy",
            onOk: async () => {
                try {
                    const res = await deleteBudgetAPI(budget._id);
                    if (res.status || res.EC === 0) {
                        message.success("Xóa ngân sách thành công!");
                        loadBudgets();
                    } else {
                        message.error(res.message || "Xóa ngân sách thất bại!");
                    }
                } catch (error) {
                    message.error("Có lỗi xảy ra!");
                }
            },
        });
    };

    const handleCopyBudget = (budget) => {
        setEditingBudget({ ...budget, _id: null, name: `${budget.name || budget.category?.name} (Copy)` });
        setModalOpen(true);
    };

    const getBudgetMenuItems = (budget) => {
        return [
            {
                key: "edit",
                label: "Chỉnh sửa",
                icon: <Edit size={16} />,
                onClick: () => handleEditBudget(budget),
            },
            {
                key: "copy",
                label: "Sao chép",
                icon: <Copy size={16} />,
                onClick: () => handleCopyBudget(budget),
            },
            {
                type: "divider",
            },
            {
                key: "delete",
                label: "Xóa",
                icon: <Trash2 size={16} />,
                danger: true,
                onClick: () => handleDeleteBudget(budget),
            },
        ];
    };

    const tabs = [
        { key: "all", label: "Tất cả" },
        { key: "active", label: "Đang hoạt động" },
        { key: "expired", label: "Đã hết hạn" },
    ];

    return (
        <div className="min-h-screen bg-[#F9FAFB]">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header Section */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="ds-heading-1" style={{ fontSize: "24px", fontWeight: 700 }}>
                        Quản lý Ngân sách
                    </h1>
                    <button
                        onClick={handleAddBudget}
                        className="ds-button-primary"
                        style={{ display: "flex", alignItems: "center", gap: "8px" }}
                    >
                        <Plus size={18} />
                        Thêm ngân sách
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div className="ds-card">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-[#3B82F6]/10 rounded-lg flex items-center justify-center">
                                <Wallet className="text-[#3B82F6] w-6 h-6" />
                            </div>
                        </div>
                        <p className="ds-text-secondary mb-1">Tổng ngân sách</p>
                        <p className="text-2xl font-bold text-[#3B82F6]">
                            {loading ? "..." : summary.totalBudgets}
                        </p>
                    </div>

                    <div className="ds-card">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-[#10B981]/10 rounded-lg flex items-center justify-center">
                                <TrendingUp className="text-[#10B981] w-6 h-6" />
                            </div>
                        </div>
                        <p className="ds-text-secondary mb-1">Tổng hạn mức</p>
                        <p className="text-2xl font-bold text-[#10B981]">
                            {loading ? "..." : formatCurrency(summary.totalLimit)}
                        </p>
                    </div>

                    <div className="ds-card">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-[#EF4444]/10 rounded-lg flex items-center justify-center">
                                <TrendingUp className="text-[#EF4444] w-6 h-6" />
                            </div>
                        </div>
                        <p className="ds-text-secondary mb-1">Tổng đã chi</p>
                        <p className="text-2xl font-bold text-[#EF4444]">
                            {loading ? "..." : formatCurrency(summary.totalSpent)}
                        </p>
                    </div>

                    <div className="ds-card">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-[#F59E0B]/10 rounded-lg flex items-center justify-center">
                                <AlertTriangle className="text-[#F59E0B] w-6 h-6" />
                            </div>
                        </div>
                        <p className="ds-text-secondary mb-1">Ngân sách cảnh báo</p>
                        <p className="text-2xl font-bold text-[#F59E0B]">
                            {loading ? "..." : summary.warningCount}
                        </p>
                    </div>
                </div>

                {/* Filter Tabs */}
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

                {/* Budgets List */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="ds-card ds-skeleton" style={{ height: "200px" }}></div>
                        ))}
                    </div>
                ) : filteredBudgets.length > 0 ? (
                    <div className="space-y-4">
                        {filteredBudgets.map((budget) => {
                            const budgetStatus = calculateBudgetStatus(budget);
                            const spent = budget.spent_amount || 0;
                            const limit = budget.limit_amount || 1;
                            const remaining = limit - spent;
                            const percentage = Math.min((spent / limit) * 100, 100);

                            return (
                                <div
                                    key={budget._id}
                                    className="ds-card relative"
                                    style={{
                                        border:
                                            budgetStatus.status === "danger"
                                                ? "2px solid #EF4444"
                                                : budgetStatus.status === "warning"
                                                ? "2px solid #F59E0B"
                                                : "1px solid #E5E7EB",
                                    }}
                                >
                                    {/* Actions Menu */}
                                    <div className="absolute top-4 right-4 z-10">
                                        <Dropdown
                                            menu={{ items: getBudgetMenuItems(budget) }}
                                            trigger={["click"]}
                                            placement="bottomRight"
                                        >
                                            <button className="p-2 hover:bg-[#F9FAFB] rounded-lg transition-colors">
                                                <svg
                                                    className="w-5 h-5 text-[#6B7280]"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                                                    />
                                                </svg>
                                            </button>
                                        </Dropdown>
                                    </div>

                                    <div className="flex items-start gap-6">
                                        {/* Icon */}
                                        <div className="w-16 h-16 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center flex-shrink-0">
                                            <Wallet className="text-[#3B82F6] w-8 h-8" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="ds-heading-3">
                                                    {budget.name || budget.category?.name || "Ngân sách"}
                                                </h3>
                                                <span
                                                    className="ds-badge"
                                                    style={{
                                                        backgroundColor: `${budgetStatus.statusColor}20`,
                                                        color: budgetStatus.statusColor,
                                                    }}
                                                >
                                                    {budgetStatus.statusLabel}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                <div>
                                                    <p className="ds-text-small text-[#6B7280] mb-1">Danh mục</p>
                                                    <p className="font-semibold">{budget.category?.name || "N/A"}</p>
                                                </div>
                                                <div>
                                                    <p className="ds-text-small text-[#6B7280] mb-1">Ví</p>
                                                    <p className="font-semibold">
                                                        {budget.wallet?.name || "Tất cả ví"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="ds-text-small text-[#6B7280] mb-1">Kỳ</p>
                                                    <p className="font-semibold">
                                                        {budget.period === "weekly"
                                                            ? "Hàng tuần"
                                                            : budget.period === "monthly"
                                                            ? "Hàng tháng"
                                                            : budget.period === "yearly"
                                                            ? "Hàng năm"
                                                            : "Tùy chỉnh"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="ds-text-small text-[#6B7280] mb-1">Thời gian</p>
                                                    <p className="font-semibold">
                                                        {budget.start_date
                                                            ? `${formatDate(budget.start_date)} - ${formatDate(budget.end_date)}`
                                                            : formatDate(budget.end_date)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Progress Section */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="ds-text-small text-[#6B7280]">
                                                        Tiến độ: {percentage.toFixed(1)}%
                                                    </span>
                                                    <span
                                                        className="text-lg font-bold"
                                                        style={{ color: budgetStatus.statusColor }}
                                                    >
                                                        {percentage.toFixed(0)}%
                                                    </span>
                                                </div>
                                                <div className="ds-progress-bar" style={{ height: "12px" }}>
                                                    <div
                                                        className="ds-progress-bar-fill"
                                                        style={{
                                                            width: `${percentage}%`,
                                                            backgroundColor:
                                                                percentage >= 100
                                                                    ? "#EF4444"
                                                                    : percentage >= 80
                                                                    ? "#F59E0B"
                                                                    : percentage >= 50
                                                                    ? "#3B82F6"
                                                                    : "#10B981",
                                                            borderRadius: "6px",
                                                        }}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-3 gap-4 mt-3">
                                                    <div>
                                                        <p className="ds-text-small text-[#6B7280] mb-1">Hạn mức</p>
                                                        <p className="font-bold text-[#3B82F6]">
                                                            {formatCurrency(limit)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="ds-text-small text-[#6B7280] mb-1">Đã chi</p>
                                                        <p className={`font-bold ${spent > limit ? "text-[#EF4444]" : ""}`}>
                                                            {formatCurrency(spent)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="ds-text-small text-[#6B7280] mb-1">Còn lại</p>
                                                        <p
                                                            className={`font-bold ${
                                                                remaining < 0 ? "text-[#EF4444]" : "text-[#10B981]"
                                                            }`}
                                                        >
                                                            {formatCurrency(remaining)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="ds-empty-state">
                        <Wallet className="ds-empty-state-icon" size={64} />
                        <p className="ds-empty-state-text">
                            {activeTab === "expired"
                                ? "Chưa có ngân sách nào hết hạn"
                                : activeTab === "active"
                                ? "Chưa có ngân sách đang hoạt động"
                                : "Chưa có ngân sách nào"}
                        </p>
                        <button onClick={handleAddBudget} className="ds-button-primary mt-4">
                            Thêm ngân sách đầu tiên
                        </button>
                    </div>
                )}
            </div>

            {/* Budget Modal */}
            <BudgetModal
                open={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setEditingBudget(null);
                }}
                budget={editingBudget}
                onSuccess={loadBudgets}
            />
        </div>
    );
};

export default BudgetsIndex;

