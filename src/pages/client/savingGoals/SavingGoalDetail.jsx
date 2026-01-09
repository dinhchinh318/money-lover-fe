import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Target, Edit, Trash2, CheckCircle } from "lucide-react";
import { message, Modal, Tabs, InputNumber } from "antd";
import { getSavingGoalByIdAPI, deleteSavingGoalAPI, depositSavingGoalAPI, withdrawSavingGoalAPI } from "../../../services/api.savingGoal";
import SavingGoalModal from "../../../components/savingGoals/SavingGoalModal";
import dayjs from "dayjs";

const SavingGoalDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [goal, setGoal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("info");
    const [modalOpen, setModalOpen] = useState(false);
    const [amount, setAmount] = useState(0);


    useEffect(() => {
        if (id) {
            loadGoal();
        }
    }, [id]);

    const loadGoal = async () => {
        try {
            setLoading(true);
            const res = await getSavingGoalByIdAPI(id);
            if (res.status || res.EC === 0) {
                setGoal(res.data);
            } else {
                message.error("Không tìm thấy mục tiêu!");
                navigate("/saving-goals");
            }
        } catch (error) {
            message.error("Có lỗi xảy ra khi tải thông tin mục tiêu!");
            navigate("/saving-goals");
        } finally {
            setLoading(false);
        }
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
    const getTimeRemaining = () => {
        if (!goal || !goal.target_date) return null;
        const now = dayjs();
        const target = dayjs(goal.target_date);
        const diff = target.diff(now, "day");

        if (diff < 0) return { text: "Đã quá hạn", color: "#EF4444" };
        if (diff < 30) return { text: `Còn ${diff} ngày`, color: "#F59E0B" };
        return { text: `Còn ${diff} ngày`, color: "#6B7280" };
    };

    const handleEdit = () => {
        setModalOpen(true);
    };
    const handleCompleteGoal = () => {
        Modal.confirm({
            title: "Đánh dấu hoàn thành mục tiêu?",
            content: "Sau khi hoàn thành, tiến độ sẽ được giữ cố định 100%.",
            okText: "Hoàn thành",
            cancelText: "Hủy",
            onOk: async () => {
                try {
                    const res = await completeSavingGoalAPI(goal._id);
                    if (res?.status || res?.data?.status) {
                        message.success("Đã hoàn thành mục tiêu!");
                        loadGoal();
                    } else {
                        message.error("Thao tác thất bại");
                    }
                } catch (err) {
                    message.error("Có lỗi xảy ra");
                }
            },
        });
    };
    const handleDeposit = async () => {
        if (amount <= 0) {
            message.error("Số tiền phải lớn hơn 0");
            return;
        }

        try {
            await depositSavingGoalAPI(goal._id, amount);
            message.success("Đã thêm tiền vào mục tiêu");
            setAmount(0);
            loadGoal();
        } catch (err) {
            message.error(err.response?.data?.message || "Thêm tiền thất bại");
        }
    };

    const handleWithdraw = async () => {
        if (amount <= 0) {
            message.error("Số tiền phải lớn hơn 0");
            return;
        }

        try {
            await withdrawSavingGoalAPI(goal._id, amount);
            message.success("Đã rút tiền về ví");
            setAmount(0);
            loadGoal();
        } catch (err) {
            message.error(err.response?.data?.message || "Rút tiền thất bại");
        }
    };

    const handleDelete = () => {
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
                        navigate("/saving-goals");
                    } else {
                        message.error(res.message || "Xóa thất bại!");
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

    if (!goal) {
        return null;
    }

    const isCompleted = goal.is_completed;

    const progress = isCompleted ? 100 : (goal.progress || 0);

    const current = isCompleted
        ? goal.target_amount
        : (goal.current_amount || 0);

    const target = goal.target_amount || 1;
    const remaining = target - current;
    const timeRemaining = getTimeRemaining();


    const tabItems = [
        {
            key: "info",
            label: "Thông tin",
            children: (
                <div className="space-y-6">
                    {/* Main Info Card */}
                    <div className="ds-card">
                        <div className="flex items-start gap-6 mb-6">
                            <div className="w-20 h-20 rounded-full bg-[#10B981]/10 flex items-center justify-center flex-shrink-0">
                                <Target className="text-[#10B981] w-10 h-10" />
                            </div>
                            <div className="flex-1">
                                <h2 className="ds-heading-2 mb-2">{goal.name}</h2>
                                <div className="flex items-center gap-3 mb-4">
                                    {isCompleted && (
                                        <span className="ds-badge ds-badge-success">Đã hoàn thành</span>
                                    )}
                                    {!goal.is_active && (
                                        <span className="ds-badge ds-badge-warning">Đã tạm dừng</span>
                                    )}
                                    {!isCompleted && timeRemaining && timeRemaining.color === "#F59E0B" && (
                                        <span className="ds-badge" style={{ backgroundColor: "#F59E0B20", color: "#F59E0B" }}>
                                            Sắp đến hạn
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Progress Overview */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="ds-text-secondary">Tiến độ</span>
                                <span className="text-3xl font-bold text-[#10B981]">{progress.toFixed(1)}%</span>
                            </div>
                            <div className="ds-progress-bar" style={{ height: "20px" }}>
                                <div
                                    className="ds-progress-bar-fill ds-progress-bar-fill-success"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                        {/* Deposit / Withdraw */}
                        {goal.is_active && (
                            <div className="flex gap-3 mb-6">
                                <InputNumber
                                    min={1}
                                    value={amount}
                                    onChange={setAmount}
                                    style={{ width: 200 }}
                                    placeholder="Nhập số tiền"
                                    formatter={(value) =>
                                        `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                                    }
                                    parser={(value) => value.replace(/,/g, "")}
                                    addonAfter="VND"
                                />

                                <button
                                    onClick={handleDeposit}
                                    className="ds-button-primary"
                                >
                                    Thêm tiền
                                </button>

                                <button
                                    onClick={handleWithdraw}
                                    className="ds-button-secondary"
                                    disabled={current <= 0}
                                >
                                    Rút về ví
                                </button>
                            </div>
                        )}


                        {/* Details */}
                        <div className="grid grid-cols-2 gap-4 border-t border-[#E5E7EB] pt-6">
                            <div>
                                <p className="ds-text-secondary mb-1">Ví</p>
                                <p className="font-semibold">{goal.wallet?.name || "N/A"}</p>
                            </div>
                            <div>
                                <p className="ds-text-secondary mb-1">Mục tiêu</p>
                                <p className="font-bold text-[#3B82F6] text-lg">{formatCurrency(target)}</p>
                            </div>
                            <div>
                                <p className="ds-text-secondary mb-1">Đã tiết kiệm</p>
                                <p className="font-bold text-[#10B981] text-lg">{formatCurrency(current)}</p>
                            </div>
                            <div>
                                <p className="ds-text-secondary mb-1">Còn thiếu</p>
                                <p className={`font-bold text-lg ${remaining < 0 ? "text-[#EF4444]" : "text-[#10B981]"}`}>
                                    {formatCurrency(remaining)}
                                </p>
                            </div>
                            <div>
                                <p className="ds-text-secondary mb-1">Ngày đạt mục tiêu</p>
                                <p className="font-semibold">{formatDate(goal.target_date)}</p>
                            </div>
                            {timeRemaining && (
                                <div>
                                    <p className="ds-text-secondary mb-1">Thời gian còn lại</p>
                                    <p className="font-semibold" style={{ color: timeRemaining.color }}>
                                        {timeRemaining.text}
                                    </p>
                                </div>
                            )}
                        </div>

                        {goal.description && (
                            <div className="mt-6 pt-6 border-t border-[#E5E7EB]">
                                <p className="ds-text-secondary mb-1">Mô tả</p>
                                <p className="ds-body">{goal.description}</p>
                            </div>
                        )}

                        {/* Actions */}

                        <div className="flex gap-3 mt-6 pt-6 border-t border-[#E5E7EB]">
                            {!goal.is_completed && (
                                <button
                                    onClick={handleCompleteGoal}
                                    className="ds-button-primary"
                                    style={{ display: "flex", alignItems: "center", gap: "8px" }}
                                >
                                    <CheckCircle size={18} />
                                    Đánh dấu hoàn thành
                                </button>
                            )}

                            <button
                                onClick={handleEdit}
                                className="ds-button-secondary"
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
    ];

    return (
        <div className="min-h-screen bg-[#F9FAFB]">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Back Button */}
                <button
                    onClick={() => navigate("/saving-goals")}
                    className="flex items-center gap-2 text-[#6B7280] hover:text-[#111827] mb-6 transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span>Quay lại danh sách mục tiêu</span>
                </button>

                {/* Tabs */}
                <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
                    <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} size="large" />
                </div>
            </div>

            {/* Saving Goal Modal */}
            <SavingGoalModal
                open={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                }}
                goal={goal}
                onSuccess={() => {
                    loadGoal();
                    setModalOpen(false);
                }}
            />
        </div>
    );
};

export default SavingGoalDetail;



