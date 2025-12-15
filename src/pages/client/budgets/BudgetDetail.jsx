import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Wallet, Edit, Trash2, Copy, Pause } from "lucide-react";
import { message, Modal, Tabs } from "antd";
import { getBudgetByIdAPI, deleteBudgetAPI, getBudgetStatsAPI } from "../../../services/api.budget";
import BudgetModal from "../../../components/budgets/BudgetModal";
import dayjs from "dayjs";

const BudgetDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [budget, setBudget] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("info");
    const [modalOpen, setModalOpen] = useState(false);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        if (id) {
            loadBudget();
        }
    }, [id]);

    useEffect(() => {
        if (activeTab === "transactions" && budget) {
            loadStats();
        }
    }, [activeTab, budget]);

    const loadBudget = async () => {
        try {
            setLoading(true);
            const res = await getBudgetByIdAPI(id);
            if (res.status || res.EC === 0) {
                setBudget(res.data);
            } else {
                message.error("Không tìm thấy ngân sách!");
                navigate("/budgets");
            }
        } catch (error) {
            message.error("Có lỗi xảy ra khi tải thông tin ngân sách!");
            navigate("/budgets");
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const res = await getBudgetStatsAPI(id);
            if (res.status || res.EC === 0) {
                setStats(res.data);
            }
        } catch (error) {
            console.error("Error loading stats:", error);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount);
    };

    const formatDate = (date) => {
        if (!date) return "N/A";
        return dayjs(date).format("DD/MM/YYYY");
    };

    const calculateBudgetStatus = () => {
        if (!budget) return { percentage: 0, status: "safe", statusColor: "#10B981" };
        const spent = budget.spent_amount || 0;
        const limit = budget.limit_amount || 1;
        const percentage = Math.min((spent / limit) * 100, 100);

        let statusColor = "#10B981";
        if (percentage >= 100) statusColor = "#EF4444";
        else if (percentage >= 80) statusColor = "#F59E0B";
        else if (percentage >= 50) statusColor = "#3B82F6";

        return { percentage, statusColor };
    };

    const handleEdit = () => {
        setModalOpen(true);
    };

    const handleDelete = () => {
        Modal.confirm({
            title: "Xác nhận xóa ngân sách",
            content: `Bạn có chắc chắn muốn xóa ngân sách này?`,
            okText: "Xóa",
            okType: "danger",
            cancelText: "Hủy",
            onOk: async () => {
                try {
                    const res = await deleteBudgetAPI(budget._id);
                    if (res.status || res.EC === 0) {
                        message.success("Xóa ngân sách thành công!");
                        navigate("/budgets");
                    } else {
                        message.error(res.message || "Xóa ngân sách thất bại!");
                    }
                } catch (error) {
                    message.error("Có lỗi xảy ra!");
                }
            },
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
                <div className="text-center">
                    <div className="ds-skeleton w-64 h-64 rounded-lg mb-4"></div>
                    <p className="ds-text-secondary">Đang tải...</p>
                </div>
            </div>
        );
    }

    if (!budget) {
        return null;
    }

    const budgetStatus = calculateBudgetStatus();
    const spent = budget.spent_amount || 0;
    const limit = budget.limit_amount || 1;
    const remaining = limit - spent;

    const tabItems = [
        {
            key: "info",
            label: "Thông tin",
            children: (
                <div className="space-y-6">
                    {/* Main Info Card */}
                    <div className="ds-card">
                        <div className="flex items-start gap-6 mb-6">
                            <div className="w-20 h-20 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center flex-shrink-0">
                                <Wallet className="text-[#3B82F6] w-10 h-10" />
                            </div>
                            <div className="flex-1">
                                <h2 className="ds-heading-2 mb-2">
                                    {budget.name || budget.category?.name || "Ngân sách"}
                                </h2>
                                <div className="flex items-center gap-4 mb-4">
                                    <span className="ds-badge ds-badge-primary">
                                        {budget.period === "weekly"
                                            ? "Hàng tuần"
                                            : budget.period === "monthly"
                                            ? "Hàng tháng"
                                            : budget.period === "yearly"
                                            ? "Hàng năm"
                                            : "Tùy chỉnh"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Progress Overview */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="ds-text-secondary">Tiến độ</span>
                                <span className="text-2xl font-bold" style={{ color: budgetStatus.statusColor }}>
                                    {budgetStatus.percentage.toFixed(1)}%
                                </span>
                            </div>
                            <div className="ds-progress-bar" style={{ height: "20px" }}>
                                <div
                                    className="ds-progress-bar-fill"
                                    style={{
                                        width: `${budgetStatus.percentage}%`,
                                        backgroundColor: budgetStatus.statusColor,
                                        borderRadius: "10px",
                                    }}
                                />
                            </div>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-4 border-t border-[#E5E7EB] pt-6">
                            <div>
                                <p className="ds-text-secondary mb-1">Danh mục</p>
                                <p className="font-semibold">{budget.category?.name || "N/A"}</p>
                            </div>
                            <div>
                                <p className="ds-text-secondary mb-1">Ví</p>
                                <p className="font-semibold">{budget.wallet?.name || "Tất cả ví"}</p>
                            </div>
                            <div>
                                <p className="ds-text-secondary mb-1">Hạn mức</p>
                                <p className="font-bold text-[#3B82F6] text-lg">{formatCurrency(limit)}</p>
                            </div>
                            <div>
                                <p className="ds-text-secondary mb-1">Đã chi</p>
                                <p className={`font-bold text-lg ${spent > limit ? "text-[#EF4444]" : ""}`}>
                                    {formatCurrency(spent)}
                                </p>
                            </div>
                            <div>
                                <p className="ds-text-secondary mb-1">Còn lại</p>
                                <p className={`font-bold text-lg ${remaining < 0 ? "text-[#EF4444]" : "text-[#10B981]"}`}>
                                    {formatCurrency(remaining)}
                                </p>
                            </div>
                            <div>
                                <p className="ds-text-secondary mb-1">Thời gian</p>
                                <p className="font-semibold">
                                    {budget.start_date
                                        ? `${formatDate(budget.start_date)} - ${formatDate(budget.end_date)}`
                                        : formatDate(budget.end_date)}
                                </p>
                            </div>
                        </div>

                        {budget.description && (
                            <div className="mt-6 pt-6 border-t border-[#E5E7EB]">
                                <p className="ds-text-secondary mb-1">Mô tả</p>
                                <p className="ds-body">{budget.description}</p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 mt-6 pt-6 border-t border-[#E5E7EB]">
                            <button
                                onClick={handleEdit}
                                className="ds-button-primary"
                                style={{ display: "flex", alignItems: "center", gap: "8px" }}
                            >
                                <Edit size={18} />
                                Sửa
                            </button>
                            <button
                                onClick={handleDelete}
                                className="ds-button-danger"
                                style={{ display: "flex", alignItems: "center", gap: "8px" }}
                            >
                                <Trash2 size={18} />
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            key: "transactions",
            label: "Chi tiêu",
            children: (
                <div className="space-y-6">
                    <div className="ds-card">
                        <h3 className="ds-heading-3 mb-4">Giao dịch trong ngân sách</h3>
                        <div className="ds-empty-state" style={{ minHeight: "200px" }}>
                            <p className="ds-empty-state-text">Danh sách giao dịch sẽ được hiển thị ở đây</p>
                            <p className="ds-text-small">Tính năng đang phát triển</p>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            key: "statistics",
            label: "Thống kê",
            children: (
                <div className="space-y-6">
                    <div className="ds-card">
                        <h3 className="ds-heading-3 mb-4">Biểu đồ chi tiêu</h3>
                        <div className="ds-empty-state" style={{ minHeight: "300px" }}>
                            <p className="ds-empty-state-text">Biểu đồ sẽ được hiển thị ở đây</p>
                            <p className="ds-text-small">Tính năng đang phát triển</p>
                        </div>
                    </div>
                </div>
            ),
        },
    ];

    return (
        <div className="min-h-screen bg-[#F9FAFB]">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Back Button */}
                <button
                    onClick={() => navigate("/budgets")}
                    className="flex items-center gap-2 text-[#6B7280] hover:text-[#111827] mb-6 transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span>Quay lại danh sách ngân sách</span>
                </button>

                {/* Tabs */}
                <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
                    <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} size="large" />
                </div>
            </div>

            {/* Budget Modal */}
            <BudgetModal
                open={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                }}
                budget={budget}
                onSuccess={() => {
                    loadBudget();
                    setModalOpen(false);
                }}
            />
        </div>
    );
};

export default BudgetDetail;

