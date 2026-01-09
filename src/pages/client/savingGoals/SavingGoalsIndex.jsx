import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Pause, Play, Target, Wallet, TrendingUp, AlertCircle, CheckCircle, PiggyBank, Calendar } from "lucide-react";
import { message, Modal, Dropdown, InputNumber, Badge, Alert } from "antd";
import { getAllSavingGoalsAPI, deleteSavingGoalAPI, completeSavingGoalAPI, depositSavingGoalAPI, withdrawSavingGoalAPI } from "../../../services/api.savingGoal";
import SavingGoalModal from "../../../components/savingGoals/SavingGoalModal";
import dayjs from "dayjs";

const SavingGoalsIndex = () => {
    const navigate = useNavigate();
    const [goals, setGoals] = useState([]);
    const [filteredGoals, setFilteredGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all");
    const [modalOpen, setModalOpen] = useState(false);
    const [moneyModalOpen, setMoneyModalOpen] = useState(false);
    const [moneyAction, setMoneyAction] = useState(null); // "deposit" | "withdraw"
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [amount, setAmount] = useState(0);
    const [editingGoal, setEditingGoal] = useState(null);
    const [summary, setSummary] = useState({
        totalGoals: 0,
        totalTarget: 0,
        totalSaved: 0,
        averageProgress: 0,
    });

    useEffect(() => {
        loadGoals();
    }, []);

    useEffect(() => {
        filterGoals();
        calculateSummary();
    }, [goals, activeTab]);

    const loadGoals = async () => {
        try {
            setLoading(true);
            const res = await getAllSavingGoalsAPI();
            if (res.status || res.EC === 0) {
                const goalsData = res.data?.goals || res.data || [];
                setGoals(Array.isArray(goalsData) ? goalsData : []);
            } else {
                message.error("Không thể tải danh sách mục tiêu!");
            }
        } catch (error) {
            message.error("Có lỗi xảy ra khi tải danh sách mục tiêu!");
        } finally {
            setLoading(false);
        }
    };

    const filterGoals = () => {
        let filtered = [...goals];

        if (activeTab === "active") {
            filtered = filtered.filter(
                (g) => g.is_active && !g.is_completed
            );
        }

        if (activeTab === "completed") {
            filtered = filtered.filter(
                (g) => g.is_completed
            );
        }

        setFilteredGoals(filtered);
    };
    const openMoneyModal = (goal, action) => {
        setSelectedGoal(goal);
        setMoneyAction(action);
        setAmount(0);
        setMoneyModalOpen(true);
    };

    const calculateSummary = () => {
        const total = goals.length;
        const totalTarget = goals.reduce((sum, g) => sum + (g.target_amount || 0), 0);
        const totalSaved = goals.reduce(
            (sum, g) => sum + (g.current_amount || 0),
            0
        );
        const averageProgress =
            goals.length > 0
                ? goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length
                : 0;

        setSummary({
            totalGoals: total,
            totalTarget,
            totalSaved,
            averageProgress: Math.round(averageProgress),
        });
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

    const getTimeRemaining = (targetDate) => {
        if (!targetDate) return null;
        const now = dayjs();
        const target = dayjs(targetDate);
        const diff = target.diff(now, "day");

        if (diff < 0) return { text: "Đã quá hạn", color: "#EF4444" };
        if (diff < 30) return { text: `Còn ${diff} ngày`, color: "#F59E0B" };
        return { text: `Còn ${diff} ngày`, color: "#6B7280" };
    };
    const handleAddGoal = () => {
        setEditingGoal(null);
        setModalOpen(true);
    };

    const handleEditGoal = (goal) => {
        setEditingGoal(goal);
        setModalOpen(true);
    };
    const handleCompleteGoal = (goal) => {
        Modal.confirm({
            title: "Đánh dấu hoàn thành?",
            content: "Sau khi hoàn thành, tiến độ sẽ được giữ cố định 100%.",
            okText: "Hoàn thành",
            cancelText: "Hủy",
            onOk: async () => {
                const res = await completeSavingGoalAPI(goal._id);
                if (res.status || res.EC === 0) {
                    message.success("Đã đánh dấu hoàn thành!");
                    loadGoals();
                } else {
                    message.error("Thao tác thất bại");
                }
            },
        });
    };

    const handleDeleteGoal = (goal) => {
        Modal.confirm({
            title: "Xác nhận xóa mục tiêu",
            content: `Bạn có chắc chắn muốn xóa mục tiêu "${goal.name}"?`,
            okText: "Xóa",
            okType: "danger",
            cancelText: "Hủy",
            onOk: async () => {
                try {
                    const res = await deleteSavingGoalAPI(goal._id);
                    if (res.status || res.EC === 0) {
                        message.success("Xóa mục tiêu thành công!");
                        loadGoals();
                    } else {
                        message.error(res.message || "Xóa thất bại!");
                    }
                } catch (error) {
                    message.error("Có lỗi xảy ra!");
                }
            },
        });
    };


    const getGoalMenuItems = (goal) => {
        const items = [];

        if (!goal.is_completed) {
            items.push({
                key: "complete",
                label: "Đánh dấu đã hoàn thành",
                icon: <CheckCircle size={16} />,
                onClick: () => handleCompleteGoal(goal),
            });
        }

        items.push(
            {
                key: "edit",
                label: "Chỉnh sửa",
                icon: <Edit size={16} />,
                onClick: () => handleEditGoal(goal),
            },
            {
                type: "divider",
            },
            {
                key: "delete",
                label: "Xóa",
                icon: <Trash2 size={16} />,
                danger: true,
                onClick: () => handleDeleteGoal(goal),
            }
        );

        return items;
    };


    const tabs = [
        { key: "all", label: "Tất cả" },
        { key: "active", label: "Đang theo dõi" },
        { key: "completed", label: "Đã hoàn thành" },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50/70 via-white to-white">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header Section */}
                <div className="flex items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                    <div className="min-w-0">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 truncate">
                            Mục tiêu Tiết kiệm
                        </h1>
                        <p className="text-gray-600 mt-1 text-sm">
                            Theo dõi và đạt được các mục tiêu tài chính
                        </p>
                    </div>

                    <button
                        onClick={handleAddGoal}
                        className="shrink-0 px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-700 shadow-md hover:shadow-lg transition flex items-center gap-2"
                    >
                        <Plus size={18} />
                        <span className="hidden sm:inline">Thêm mục tiêu</span>
                    </button>
                </div>


                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-500">Tổng mục tiêu</span>
                            <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                                <Target className="text-emerald-600" size={18} />
                            </div>
                        </div>
                        <div className="mt-2 text-xl sm:text-2xl font-extrabold text-gray-900">
                            {summary.totalGoals}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-500">Tổng mục tiêu tiền</span>
                            <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center">
                                <Wallet className="text-blue-600" size={18} />
                            </div>
                        </div>
                        <div className="mt-2 text-base sm:text-lg font-extrabold text-blue-700 truncate">
                            {formatCurrency(summary.totalTarget)}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-500">Đã tiết kiệm</span>
                            <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                                <TrendingUp className="text-emerald-600" size={18} />
                            </div>
                        </div>
                        <div className="mt-2 text-base sm:text-lg font-extrabold text-emerald-700 truncate">
                            {formatCurrency(summary.totalSaved)}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-500">Tiến độ TB</span>
                            <div className="h-9 w-9 rounded-xl bg-violet-50 flex items-center justify-center">
                                <PiggyBank className="text-violet-600" size={18} />
                            </div>
                        </div>
                        <div className="mt-2 text-xl sm:text-2xl font-extrabold text-gray-900">
                            {summary.averageProgress}%
                        </div>
                    </div>
                </div>
                {/* Filter Tabs */}
                <div className="sticky top-0 z-10 bg-white mb-4">
                    <div className="flex gap-2 mb-6 bg-white p-1.5 rounded-xl border-2 border-gray-200 shadow-sm inline-flex">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 ${activeTab === tab.key
                                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
                                    : "text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Goals Grid */}
                <div className="mt-4 h-[65vh] sm:h-[70vh] overflow-y-auto pr-1">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="ds-card ds-skeleton" style={{ height: "300px" }}></div>
                            ))}
                        </div>
                    ) : filteredGoals.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredGoals.map((goal) => {
                                const progress = goal.progress || 0;
                                const current = goal.current_amount || 0;
                                const target = goal.target_amount || 1;
                                const remaining = target - current;
                                const timeRemaining = getTimeRemaining(goal.target_date);
                                const isCompleted = current >= target;
                                const isOverdue = timeRemaining && timeRemaining.text === "Đã quá hạn";

                                return (
                                    <div
                                        key={goal._id}
                                        className={`relative group cursor-pointer hover:scale-[1.02] transition-all duration-300 rounded-2xl shadow-lg hover:shadow-xl p-6 ${isCompleted
                                            ? "bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300"
                                            : isOverdue
                                                ? "bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-300"
                                                : timeRemaining && timeRemaining.color === "#F59E0B"
                                                    ? "bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300"
                                                    : "bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200"
                                            }`}
                                        onClick={() => navigate(`/saving-goals/${goal._id}`)}
                                    >
                                        {/* Actions Menu */}
                                        <div
                                            className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Dropdown
                                                menu={{ items: getGoalMenuItems(goal) }}
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

                                        {/* Badges */}
                                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                                            {isCompleted && (
                                                <Badge
                                                    count="Đã hoàn thành"
                                                    style={{
                                                        backgroundColor: "#10B981",
                                                        color: "white",
                                                        padding: "4px 12px",
                                                        borderRadius: "8px",
                                                        fontSize: "12px",
                                                        fontWeight: "600",
                                                    }}
                                                />
                                            )}
                                            {!goal.is_active && (
                                                <Badge
                                                    count="Đã tạm dừng"
                                                    style={{
                                                        backgroundColor: "#F59E0B",
                                                        color: "white",
                                                        padding: "4px 12px",
                                                        borderRadius: "8px",
                                                        fontSize: "12px",
                                                        fontWeight: "600",
                                                    }}
                                                />
                                            )}
                                            {timeRemaining && timeRemaining.color === "#F59E0B" && (
                                                <Badge
                                                    count="Sắp đến hạn"
                                                    style={{
                                                        backgroundColor: "#F59E0B",
                                                        color: "white",
                                                        padding: "4px 12px",
                                                        borderRadius: "8px",
                                                        fontSize: "12px",
                                                        fontWeight: "600",
                                                    }}
                                                />
                                            )}
                                            {isOverdue && (
                                                <Badge
                                                    count="Quá hạn"
                                                    style={{
                                                        backgroundColor: "#EF4444",
                                                        color: "white",
                                                        padding: "4px 12px",
                                                        borderRadius: "8px",
                                                        fontSize: "12px",
                                                        fontWeight: "600",
                                                    }}
                                                />
                                            )}
                                        </div>

                                        {/* Icon */}
                                        <div className="flex justify-center mb-4 mt-8">
                                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-md">
                                                <PiggyBank className="text-white w-10 h-10" />
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="text-center mb-4">
                                            <h3 className="ds-heading-3 mb-2">{goal.name}</h3>
                                            <p className="text-2xl font-bold text-[#3B82F6] mb-2">
                                                {formatCurrency(target)}
                                            </p>
                                            <p className="text-lg font-semibold text-[#10B981] mb-1">
                                                {formatCurrency(current)}
                                            </p>
                                            <p className="ds-text-small text-[#6B7280]">
                                                Còn thiếu:{" "}
                                                <span className={remaining < 0 ? "text-[#EF4444]" : ""}>
                                                    {formatCurrency(remaining)}
                                                </span>
                                            </p>
                                        </div>

                                        {/* Progress */}
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="ds-text-small text-[#6B7280]">Tiến độ</span>
                                                <span className="text-lg font-bold text-[#10B981]">
                                                    {progress.toFixed(0)}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                                                <div
                                                    className="h-full rounded-full transition-all duration-500 shadow-md"
                                                    style={{
                                                        width: `${progress}%`,
                                                        background: isCompleted
                                                            ? "linear-gradient(90deg, #10B981, #059669)"
                                                            : "linear-gradient(90deg, #3B82F6, #2563EB)",
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        {/* Quick Actions */}
                                        {goal.is_active && (
                                            <div
                                                className="flex gap-2 mt-3"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <button
                                                    className="ds-button-primary"
                                                    onClick={() => openMoneyModal(goal, "deposit")}
                                                >
                                                    + Thêm tiền
                                                </button>

                                                <button
                                                    className="ds-button-secondary"
                                                    disabled={current <= 0}
                                                    onClick={() => openMoneyModal(goal, "withdraw")}
                                                >
                                                    − Rút tiền
                                                </button>
                                            </div>
                                        )}

                                        {/* Time Info */}
                                        <div className="border-t border-[#E5E7EB] pt-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="ds-text-small text-[#6B7280]">Mục tiêu:</span>
                                                <span className="font-semibold">{formatDate(goal.target_date)}</span>
                                            </div>
                                            {timeRemaining && (
                                                <div className="flex items-center justify-between">
                                                    <span className="ds-text-small text-[#6B7280]">Thời gian còn lại:</span>
                                                    <span
                                                        className="font-semibold"
                                                        style={{ color: timeRemaining.color }}
                                                    >
                                                        {timeRemaining.text}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-300">
                            <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mb-4">
                                <PiggyBank className="text-emerald-600" size={40} />
                            </div>
                            <p className="text-xl font-semibold text-gray-700 mb-2">
                                {activeTab === "completed"
                                    ? "Chưa có mục tiêu nào hoàn thành"
                                    : activeTab === "active"
                                        ? "Chưa có mục tiêu đang theo dõi"
                                        : "Chưa có mục tiêu nào"}
                            </p>
                            <p className="text-gray-500 mb-6">Tạo mục tiêu tiết kiệm để đạt được ước mơ của bạn</p>
                            <button
                                onClick={handleAddGoal}
                                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                            >
                                <Plus size={20} />
                                Thêm mục tiêu đầu tiên
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <Modal
                open={moneyModalOpen}
                title={moneyAction === "deposit" ? "Thêm tiền vào mục tiêu" : "Rút tiền về ví"}
                onCancel={() => setMoneyModalOpen(false)}
                onOk={async () => {
                    if (!amount || amount <= 0) {
                        message.error("Vui lòng nhập số tiền hợp lệ");
                        return;
                    }
                    if (
                        moneyAction === "withdraw" &&
                        amount > (selectedGoal?.current_amount || 0)
                    ) {
                        message.error("Không thể rút nhiều hơn số tiền đã tiết kiệm");
                        return;
                    }
                    try {
                        if (moneyAction === "deposit") {
                            await depositSavingGoalAPI(selectedGoal._id, amount);
                            message.success("Đã thêm tiền");
                        } else {
                            await withdrawSavingGoalAPI(selectedGoal._id, amount);
                            message.success("Đã rút tiền");
                        }
                        setMoneyModalOpen(false);
                        setAmount(0);
                        loadGoals(); // refresh list
                    } catch (err) {
                        message.error(err.response?.data?.message || "Thao tác thất bại");
                    }
                }}
            >
                <InputNumber
                    autoFocus
                    min={1}
                    value={amount}
                    onChange={setAmount}
                    style={{ width: "100%" }}
                    placeholder="Nhập số tiền"
                    addonAfter="₫"
                    formatter={(value) =>
                        value
                            ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                            : ""
                    }
                    parser={(value) =>
                        value ? value.replace(/\./g, "") : ""
                    }
                />
            </Modal>

            {/* Saving Goal Modal */}
            <SavingGoalModal
                open={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setEditingGoal(null);
                }}
                goal={editingGoal}
                onSuccess={loadGoals}
            />
        </div>
    );
};

export default SavingGoalsIndex;



