import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Copy, Pause, TrendingUp, Wallet, AlertTriangle, CheckCircle, Target, DollarSign, BarChart3 } from "lucide-react";
import { message, Dropdown, Modal, Badge, Alert } from "antd";
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
        setEditingBudget({ ...budget, _id: undefined, name: `${budget.name || budget.category?.name} (Copy)` });
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
        <div className="min-h-screen bg-gradient-to-b from-emerald-50/70 via-white to-white">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                            <Target className="text-white" size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-indigo-800 to-gray-900 bg-clip-text text-transparent">
                                Quản lý Ngân sách
                            </h1>
                            <p className="text-gray-600 mt-1 text-sm">
                                Đặt hạn mức chi tiêu và theo dõi mức độ sử dụng ngân sách
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleAddBudget}
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Thêm ngân sách
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                                <Target className="text-white w-7 h-7" />
                            </div>
                        </div>
                        <p className="text-gray-600 mb-1 text-sm font-medium">Tổng ngân sách</p>
                        <p className="text-3xl font-bold text-blue-600">
                            {loading ? "..." : summary.totalBudgets}
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-green-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                                <DollarSign className="text-white w-7 h-7" />
                            </div>
                        </div>
                        <p className="text-gray-600 mb-1 text-sm font-medium">Tổng hạn mức</p>
                        <p className="text-3xl font-bold text-green-600">
                            {loading ? "..." : formatCurrency(summary.totalLimit)}
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-red-50 to-rose-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-red-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-red-400 to-rose-600 rounded-xl flex items-center justify-center shadow-md">
                                <TrendingUp className="text-white w-7 h-7" />
                            </div>
                        </div>
                        <p className="text-gray-600 mb-1 text-sm font-medium">Tổng đã chi</p>
                        <p className="text-3xl font-bold text-red-600">
                            {loading ? "..." : formatCurrency(summary.totalSpent)}
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-amber-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                                <AlertTriangle className="text-white w-7 h-7" />
                            </div>
                        </div>
                        <p className="text-gray-600 mb-1 text-sm font-medium">Ngân sách cảnh báo</p>
                        <p className="text-3xl font-bold text-amber-600">
                            {loading ? "..." : summary.warningCount}
                        </p>
                    </div>
                </div>

                {/* Warning Alert */}
                {summary.warningCount > 0 && (
                    <Alert
                        message={`Bạn có ${summary.warningCount} ngân sách đang ở mức cảnh báo (≥80%) hoặc đã vượt hạn mức`}
                        type="warning"
                        showIcon
                        className="mb-6 rounded-xl"
                        closable
                    />
                )}

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6 bg-white p-1.5 rounded-xl border-2 border-gray-200 shadow-sm inline-flex">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 ${activeTab === tab.key
                                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                                : "text-gray-600 hover:bg-gray-50"
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
                        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                            <div className="h-[70vh] overflow-y-auto">
                                <div className="space-y-2 p-3 sm:p-4">
                                    {filteredBudgets.map((budget) => (
                                        <BudgetRow
                                            key={budget._id}
                                            budget={budget}
                                            onClick={() => navigate(`/budgets/${budget._id}`)}
                                            onEdit={() => handleEditBudget(budget)}
                                            onDelete={() => handleDeleteBudget(budget)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-300">
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
                            <Target className="text-indigo-600" size={40} />
                        </div>
                        <p className="text-xl font-semibold text-gray-700 mb-2">
                            {activeTab === "expired"
                                ? "Chưa có ngân sách nào hết hạn"
                                : activeTab === "active"
                                    ? "Chưa có ngân sách đang hoạt động"
                                    : "Chưa có ngân sách nào"}
                        </p>
                        <p className="text-gray-500 mb-6">Bắt đầu tạo ngân sách để quản lý chi tiêu hiệu quả</p>
                        <button
                            onClick={handleAddBudget}
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                        >
                            <Plus size={20} />
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
const BudgetRow = ({ budget, onClick, onEdit, onDelete }) => {
    const spent = budget.spent_amount || 0;
    const limit = budget.limit_amount || 1;
    const percent = Math.min((spent / limit) * 100, 100);

    const getColor = () => {
        if (percent >= 100) return "#EF4444";
        if (percent >= 80) return "#F59E0B";
        if (percent >= 50) return "#3B82F6";
        return "#10B981";
    };

    const color = getColor();

    return (
        <div
            onClick={onClick}
            className="group flex items-center gap-3 sm:gap-4
                 bg-white rounded-xl p-3 sm:p-4
                 border border-gray-200
                 hover:border-gray-300 hover:shadow-sm
                 transition cursor-pointer"
        >
            {/* Icon */}
            <div
                className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}22` }}
            >
                <BarChart3 size={26} style={{ color }} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm sm:text-base truncate">
                    {budget.name || budget.category?.name || "Ngân sách"}
                </p>

                <p className="text-xs sm:text-sm text-gray-500 truncate mt-0.5">
                    {budget.start_date
                        ? `${dayjs(budget.start_date).format("DD/MM")} – ${dayjs(
                            budget.end_date
                        ).format("DD/MM")}`
                        : dayjs(budget.end_date).format("DD/MM")}
                </p>

                <div className="mt-1.5 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full"
                        style={{ width: `${percent}%`, backgroundColor: color }}
                    />
                </div>
            </div>

            {/* Right */}
            <div className="flex flex-col items-end gap-1">
                <span className="text-sm sm:text-lg font-extrabold tabular-nums" style={{ color }}>
                    {percent.toFixed(0)}%
                </span>

                <span className="text-xs sm:text-sm font-semibold text-gray-700">
                    {new Intl.NumberFormat("vi-VN").format(limit)}đ
                </span>
            </div>

            {/* Actions desktop */}
            <div className="hidden sm:flex gap-1 opacity-0 group-hover:opacity-100 transition">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                    }}
                    className="p-2 rounded-lg hover:bg-blue-50"
                >
                    <Edit size={16} className="text-blue-600" />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="p-2 rounded-lg hover:bg-red-50"
                >
                    <Trash2 size={16} className="text-red-600" />
                </button>
            </div>
        </div>
    );
};

export default BudgetsIndex;



