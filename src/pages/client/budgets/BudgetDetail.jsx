import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Wallet, Edit, Trash2, Copy, Pause } from "lucide-react";
import { message, Modal, Tabs } from "antd";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { getBudgetByIdAPI, deleteBudgetAPI, getBudgetStatsAPI, getBudgetTransactionsAPI } from "../../../services/api.budget";
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
    const [transactions, setTransactions] = useState([]);
    const [loadingTx, setLoadingTx] = useState(false);

    useEffect(() => {
        if (id) {
            loadBudget();
        }
    }, [id]);
    useEffect(() => {
        if (activeTab === "transactions" && budget) {
            loadTransactions();
        }
    }, [activeTab, budget]);

    useEffect(() => {
        if (activeTab === "statistics" && budget) {
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
    const loadTransactions = async () => {
        try {
            setLoadingTx(true);
            const res = await getBudgetTransactionsAPI(budget._id);
            if (res.status || res.EC === 0) {
                const raw = res.data || [];
                const mapped = raw.map(t => ({
                    id: t._id,
                    amount: Number(t.amount),
                    date: t.date || t.createdAt,
                    category: t.categoryId?.name || "Chi tiêu",
                    note: t.note || "",
                }));
                setTransactions(mapped);
            }
        } catch (e) {
            message.error("Không thể tải giao dịch");
        } finally {
            setLoadingTx(false);
        }
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
    const safeStats = stats || {
        limit: budget.limit_amount || 0,
        spent: budget.spent_amount || 0,
        remaining: (budget.limit_amount || 0) - (budget.spent_amount || 0),
        percent: 0,
        byDate: [],
    };
    const groupedTransactions = transactions.reduce((acc, tx) => {
        const dateKey = dayjs(tx.date).format("DD/MM/YYYY");
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(tx);
        return acc;
    }, {});

    const budgetStatus = calculateBudgetStatus();
    const spent = safeStats.spent;
    const limit = safeStats.limit || 1;
    const remaining = safeStats.remaining;
    const percent = safeStats.percent;

    const progressColor =
        percent >= 100
            ? "#EF4444"
            : percent >= 80
                ? "#F59E0B"
                : "#10B981";

    const pieData = [
        {
            name: "Đã chi",
            value: safeStats.spent,
            color: "#EF4444",
        },
        {
            name: "Còn lại",
            value: Math.max(safeStats.limit - safeStats.spent, 0),
            color: "#10B981",
        },
    ];

    const tabItems = [
        {
            key: "info",
            label: "Thông tin",
            children: (
                <div className="space-y-6">
                    {/* Main Info Card */}
                    <div className="ds-card">
                        <div className="flex items-start gap-4 mb-6 flex-wrap sm:flex-nowrap">
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
                            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#E5E7EB] pt-6">
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
                                <p className="font-bold text-[#3B82F6] text-lg break-words">{formatCurrency(limit)}</p>
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
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="ds-heading-3">Danh sách chi tiêu</h3>
                            <span className="ds-text-secondary">
                                {transactions.length} mục
                            </span>
                        </div>

                        {loadingTx ? (
                            <p className="ds-text-secondary">Đang tải...</p>
                        ) : transactions.length > 0 ? (
                            <div className="space-y-6">
                                {Object.entries(groupedTransactions).map(([date, items]) => (
                                    <div key={date}>
                                        {/* Date header */}
                                        <p className="text-sm font-semibold text-gray-500 mb-2">
                                            {date}
                                        </p>

                                        <div className="space-y-2">
                                            {items.map((t) => (
                                                <div
                                                    key={t.id}
                                                    className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition"
                                                >
                                                    {/* Left */}
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                                                            <span className="text-rose-600 font-bold">₫</span>
                                                        </div>

                                                        <div>
                                                            <p className="font-semibold text-gray-900">
                                                                {t.note || t.category}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {dayjs(t.date).format("HH:mm")}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Right */}
                                                    <p className="font-extrabold text-rose-600">
                                                        - {formatCurrency(t.amount)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="ds-empty-state">
                                <p className="ds-empty-state-text">
                                    Chưa có chi tiêu nào trong ngân sách này
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            ),
        },

        {
            key: "statistics",
            label: "Thống kê",
            children: (
                <div className="space-y-4">
                    {/* Summary cards */}
                    {stats ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="ds-card">
                                <p className="ds-text-secondary">Hạn mức</p>
                                <p className="text-emerald-700 font-extrabold text-xl">
                                    {formatCurrency(safeStats.limit)}
                                </p>
                            </div>

                            <div className="ds-card">
                                <p className="ds-text-secondary">Đã chi</p>
                                <p className="text-rose-600 font-extrabold text-xl">
                                    {formatCurrency(safeStats.spent)}
                                </p>
                            </div>

                            <div className="ds-card">
                                <p className="ds-text-secondary">Còn lại</p>
                                <p className="text-sky-600 font-extrabold text-xl">
                                    {formatCurrency(safeStats.remaining)}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="ds-card">Đang tải...</div>
                    )}

                    {/* Progress */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-5">
                        <p className="text-sm text-gray-500 mb-2">Tiến độ sử dụng</p>

                        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                    width: `${percent}%`,
                                    backgroundColor: progressColor,
                                }}
                            />
                        </div>

                        <div className="flex justify-end mt-2">
                            <span
                                className="font-semibold text-sm"
                                style={{ color: progressColor }}
                            >
                                {percent}%
                            </span>
                        </div>
                    </div>
                    {/* Pie Chart */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">Phân bổ ngân sách</h3>
                            <span className="text-sm text-gray-500">
                                Tổng: {formatCurrency(safeStats.limit)}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                            {/* Donut */}
                            <div className="h-[260px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            innerRadius={70}
                                            outerRadius={100}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={index} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(v) =>
                                                `${new Intl.NumberFormat("vi-VN").format(v)} đ`
                                            }
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Legend */}
                            <div className="space-y-4">
                                {pieData.map((item) => {
                                    const percent = Math.round(
                                        (item.value / safeStats.limit) * 100
                                    );

                                    return (
                                        <div key={item.name}>
                                            <div className="flex justify-between text-sm font-medium">
                                                <span>{item.name}</span>
                                                <span>{percent}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-gray-200 rounded-full mt-1">
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{
                                                        width: `${percent}%`,
                                                        backgroundColor: item.color,
                                                    }}
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {formatCurrency(item.value)}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Chart */}
                    {stats?.byDate && safeStats.byDate.length > 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">
                                Chi tiêu theo thời gian
                            </h3>

                            {/* QUAN TRỌNG: container PHẢI có height */}
                            <div className="h-[320px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={safeStats.byDate}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 12 }}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 12 }}
                                            tickFormatter={(v) =>
                                                new Intl.NumberFormat("vi-VN").format(v)
                                            }
                                        />
                                        <Tooltip
                                            formatter={(value) =>
                                                `${new Intl.NumberFormat("vi-VN").format(value)} đ`
                                            }
                                            labelFormatter={(label) => `Ngày ${label}`}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="amount"
                                            stroke="#3B82F6"
                                            strokeWidth={3}
                                            dot={{ r: 4 }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center">
                            <p className="text-gray-500 font-medium">
                                Chưa có dữ liệu chi tiêu theo thời gian
                            </p>
                        </div>
                    )}
                </div>
            ),
        }


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




