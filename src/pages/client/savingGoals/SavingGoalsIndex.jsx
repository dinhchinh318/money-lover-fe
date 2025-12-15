import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Pause, Play, Target, Wallet, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { message, Modal, Dropdown, InputNumber } from "antd";
import { getAllSavingGoalsAPI, deleteSavingGoalAPI, addAmountAPI, withdrawAmountAPI } from "../../../services/api.savingGoal";
import SavingGoalModal from "../../../components/savingGoals/SavingGoalModal";
import dayjs from "dayjs";

const SavingGoalsIndex = () => {
    const navigate = useNavigate();
    const [goals, setGoals] = useState([]);
    const [filteredGoals, setFilteredGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);
    const [amountModalOpen, setAmountModalOpen] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [amountType, setAmountType] = useState("add"); // add or withdraw
    const [amount, setAmount] = useState(0);
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
            filtered = filtered.filter((g) => g.is_active);
        } else if (activeTab === "completed") {
            filtered = filtered.filter((g) => {
                const current = g.current_amount || 0;
                const target = g.target_amount || 1;
                return current >= target;
            });
        }
        setFilteredGoals(filtered);
    };

    const calculateSummary = () => {
        const total = goals.length;
        const totalTarget = goals.reduce((sum, g) => sum + (g.target_amount || 0), 0);
        const totalSaved = goals.reduce((sum, g) => sum + (g.current_amount || 0), 0);
        const averageProgress =
            goals.length > 0
                ? goals.reduce((sum, g) => {
                      const current = g.current_amount || 0;
                      const target = g.target_amount || 1;
                      return sum + (current / target) * 100;
                  }, 0) / goals.length
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

    const calculateProgress = (goal) => {
        const current = goal.current_amount || 0;
        const target = goal.target_amount || 1;
        return Math.min((current / target) * 100, 100);
    };

    const handleAddGoal = () => {
        setEditingGoal(null);
        setModalOpen(true);
    };

    const handleEditGoal = (goal) => {
        setEditingGoal(goal);
        setModalOpen(true);
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

    const handleAddAmount = (goal) => {
        setSelectedGoal(goal);
        setAmountType("add");
        setAmount(0);
        setAmountModalOpen(true);
    };

    const handleWithdrawAmount = (goal) => {
        setSelectedGoal(goal);
        setAmountType("withdraw");
        setAmount(0);
        setAmountModalOpen(true);
    };

    const handleSubmitAmount = async () => {
        if (!selectedGoal || amount <= 0) {
            message.error("Vui lòng nhập số tiền hợp lệ!");
            return;
        }

        try {
            let res;
            if (amountType === "add") {
                res = await addAmountAPI(selectedGoal._id, amount);
            } else {
                if (amount > (selectedGoal.current_amount || 0)) {
                    message.error("Số tiền rút không được vượt quá số tiền hiện có!");
                    return;
                }
                res = await withdrawAmountAPI(selectedGoal._id, amount);
            }

            if (res.status || res.EC === 0) {
                message.success(`${amountType === "add" ? "Thêm" : "Rút"} tiền thành công!`);
                setAmountModalOpen(false);
                setSelectedGoal(null);
                setAmount(0);
                loadGoals();
            } else {
                message.error(res.message || "Thao tác thất bại!");
            }
        } catch (error) {
            message.error("Có lỗi xảy ra!");
        }
    };

    const getGoalMenuItems = (goal) => {
        return [
            {
                key: "add",
                label: "Thêm tiền",
                icon: <TrendingUp size={16} />,
                onClick: () => handleAddAmount(goal),
            },
            {
                key: "withdraw",
                label: "Rút tiền",
                icon: <TrendingUp size={16} />,
                onClick: () => handleWithdrawAmount(goal),
            },
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
            },
        ];
    };

    const tabs = [
        { key: "all", label: "Tất cả" },
        { key: "active", label: "Đang theo dõi" },
        { key: "completed", label: "Đã hoàn thành" },
    ];

    return (
        <div className="min-h-screen bg-[#F9FAFB]">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header Section */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="ds-heading-1" style={{ fontSize: "24px", fontWeight: 700 }}>
                        Quản lý Mục tiêu Tiết kiệm
                    </h1>
                    <button
                        onClick={handleAddGoal}
                        className="ds-button-primary"
                        style={{ display: "flex", alignItems: "center", gap: "8px" }}
                    >
                        <Plus size={18} />
                        Thêm mục tiêu
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div className="ds-card">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-[#3B82F6]/10 rounded-lg flex items-center justify-center">
                                <Target className="text-[#3B82F6] w-6 h-6" />
                            </div>
                        </div>
                        <p className="ds-text-secondary mb-1">Tổng mục tiêu</p>
                        <p className="text-2xl font-bold text-[#3B82F6]">{summary.totalGoals}</p>
                    </div>

                    <div className="ds-card">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-[#10B981]/10 rounded-lg flex items-center justify-center">
                                <Wallet className="text-[#10B981] w-6 h-6" />
                            </div>
                        </div>
                        <p className="ds-text-secondary mb-1">Tổng số tiền mục tiêu</p>
                        <p className="text-2xl font-bold text-[#10B981]">
                            {formatCurrency(summary.totalTarget)}
                        </p>
                    </div>

                    <div className="ds-card">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-[#10B981]/10 rounded-lg flex items-center justify-center">
                                <TrendingUp className="text-[#10B981] w-6 h-6" />
                            </div>
                        </div>
                        <p className="ds-text-secondary mb-1">Tổng đã tiết kiệm</p>
                        <p className="text-2xl font-bold text-[#10B981]">
                            {formatCurrency(summary.totalSaved)}
                        </p>
                    </div>

                    <div className="ds-card">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-[#3B82F6]/10 rounded-lg flex items-center justify-center">
                                <Target className="text-[#3B82F6] w-6 h-6" />
                            </div>
                        </div>
                        <p className="ds-text-secondary mb-1">Tiến độ trung bình</p>
                        <p className="text-2xl font-bold text-[#3B82F6]">{summary.averageProgress}%</p>
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

                {/* Goals Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="ds-card ds-skeleton" style={{ height: "300px" }}></div>
                        ))}
                    </div>
                ) : filteredGoals.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredGoals.map((goal) => {
                            const progress = calculateProgress(goal);
                            const current = goal.current_amount || 0;
                            const target = goal.target_amount || 1;
                            const remaining = target - current;
                            const timeRemaining = getTimeRemaining(goal.target_date);
                            const isCompleted = current >= target;
                            const isOverdue = timeRemaining && timeRemaining.text === "Đã quá hạn";

                            return (
                                <div
                                    key={goal._id}
                                    className="ds-card relative group cursor-pointer hover:scale-[1.02] transition-transform"
                                    style={{
                                        border: isCompleted
                                            ? "2px solid #10B981"
                                            : isOverdue
                                            ? "2px solid #EF4444"
                                            : timeRemaining && timeRemaining.color === "#F59E0B"
                                            ? "2px solid #F59E0B"
                                            : "1px solid #E5E7EB",
                                    }}
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
                                            <span className="ds-badge ds-badge-success">Đã hoàn thành</span>
                                        )}
                                        {!goal.is_active && (
                                            <span className="ds-badge ds-badge-warning">Đã tạm dừng</span>
                                        )}
                                        {timeRemaining && timeRemaining.color === "#F59E0B" && (
                                            <span className="ds-badge" style={{ backgroundColor: "#F59E0B20", color: "#F59E0B" }}>
                                                Sắp đến hạn
                                            </span>
                                        )}
                                        {isOverdue && (
                                            <span className="ds-badge ds-badge-danger">Quá hạn</span>
                                        )}
                                    </div>

                                    {/* Icon */}
                                    <div className="flex justify-center mb-4 mt-8">
                                        <div className="w-16 h-16 rounded-full bg-[#10B981]/10 flex items-center justify-center">
                                            <Target className="text-[#10B981] w-8 h-8" />
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
                                        <div className="ds-progress-bar" style={{ height: "12px" }}>
                                            <div
                                                className="ds-progress-bar-fill ds-progress-bar-fill-success"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>

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
                    <div className="ds-empty-state">
                        <Target className="ds-empty-state-icon" size={64} />
                        <p className="ds-empty-state-text">
                            {activeTab === "completed"
                                ? "Chưa có mục tiêu nào hoàn thành"
                                : activeTab === "active"
                                ? "Chưa có mục tiêu đang theo dõi"
                                : "Chưa có mục tiêu nào"}
                        </p>
                        <button onClick={handleAddGoal} className="ds-button-primary mt-4">
                            Thêm mục tiêu đầu tiên
                        </button>
                    </div>
                )}
            </div>

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

            {/* Amount Modal */}
            <Modal
                title={amountType === "add" ? "Thêm tiền" : "Rút tiền"}
                open={amountModalOpen}
                onCancel={() => {
                    setAmountModalOpen(false);
                    setSelectedGoal(null);
                    setAmount(0);
                }}
                onOk={handleSubmitAmount}
                okText={amountType === "add" ? "Thêm" : "Rút"}
                cancelText="Hủy"
            >
                {selectedGoal && (
                    <div className="space-y-4">
                        <div>
                            <p className="ds-text-secondary mb-1">Mục tiêu</p>
                            <p className="font-semibold">{selectedGoal.name}</p>
                        </div>
                        <div>
                            <p className="ds-text-secondary mb-1">Số tiền hiện tại</p>
                            <p className="font-semibold text-[#10B981]">
                                {formatCurrency(selectedGoal.current_amount || 0)}
                            </p>
                        </div>
                        <div>
                            <label className="block ds-text-secondary mb-2">
                                Số tiền {amountType === "add" ? "thêm" : "rút"}
                            </label>
                            <InputNumber
                                style={{ width: "100%" }}
                                placeholder="0"
                                value={amount}
                                onChange={(value) => setAmount(value || 0)}
                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                                min={1}
                                addonAfter="VND"
                            />
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default SavingGoalsIndex;

