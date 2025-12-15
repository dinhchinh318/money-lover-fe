import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Pause, Play, CreditCard, Calendar, Wallet, CheckCircle } from "lucide-react";
import { message, Modal, Dropdown } from "antd";
import { getAllRecurringBillsAPI, deleteRecurringBillAPI, payRecurringBillAPI } from "../../../services/api.recurringBill";
import RecurringBillModal from "../../../components/recurringBills/RecurringBillModal";
import dayjs from "dayjs";

const RecurringBillsIndex = () => {
    const [bills, setBills] = useState([]);
    const [filteredBills, setFilteredBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingBill, setEditingBill] = useState(null);
    const [summary, setSummary] = useState({
        totalBills: 0,
        totalAmount: 0,
        upcomingCount: 0,
        paidThisMonth: 0,
    });

    useEffect(() => {
        loadBills();
    }, []);

    useEffect(() => {
        filterBills();
        calculateSummary();
    }, [bills, activeTab]);

    const loadBills = async () => {
        try {
            setLoading(true);
            const res = await getAllRecurringBillsAPI();
            if (res.status || res.EC === 0) {
                const billsData = res.data?.bills || res.data || [];
                setBills(Array.isArray(billsData) ? billsData : []);
            } else {
                message.error("Không thể tải danh sách hóa đơn!");
            }
        } catch (error) {
            message.error("Có lỗi xảy ra khi tải danh sách hóa đơn!");
        } finally {
            setLoading(false);
        }
    };

    const filterBills = () => {
        let filtered = [...bills];
        if (activeTab === "active") {
            filtered = filtered.filter((b) => b.active);
        } else if (activeTab === "paused") {
            filtered = filtered.filter((b) => !b.active);
        }
        setFilteredBills(filtered);
    };

    const calculateSummary = () => {
        const total = bills.length;
        const totalAmount = bills.reduce((sum, b) => sum + (b.amount || 0), 0);
        const now = dayjs();
        const upcoming = bills.filter((b) => {
            if (!b.active) return false;
            const nextRun = dayjs(b.next_run);
            return nextRun.isAfter(now) && nextRun.isBefore(now.add(7, "days"));
        }).length;

        setSummary({
            totalBills: total,
            totalAmount,
            upcomingCount: upcoming,
            paidThisMonth: 0, // TODO: Calculate from transactions
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount);
    };

    const formatDate = (date) => {
        if (!date) return "Không giới hạn";
        return dayjs(date).format("DD/MM/YYYY");
    };

    const formatDateTime = (date) => {
        return dayjs(date).format("DD/MM/YYYY HH:mm");
    };

    const getTimeRemaining = (nextRun) => {
        const now = dayjs();
        const next = dayjs(nextRun);
        const diff = next.diff(now, "day");

        if (diff < 0) return "Đã quá hạn";
        if (diff === 0) return "Hôm nay";
        if (diff === 1) return "Ngày mai";
        return `Còn ${diff} ngày`;
    };

    const getFrequencyLabel = (frequency) => {
        const labels = {
            daily: "Hàng ngày",
            weekly: "Hàng tuần",
            biweekly: "2 tuần một lần",
            monthly: "Hàng tháng",
            yearly: "Hàng năm",
            custom: "Tùy chỉnh",
        };
        return labels[frequency] || frequency;
    };

    const handleAddBill = () => {
        setEditingBill(null);
        setModalOpen(true);
    };

    const handleEditBill = (bill) => {
        setEditingBill(bill);
        setModalOpen(true);
    };

    const handleDeleteBill = (bill) => {
        Modal.confirm({
            title: "Xác nhận xóa hóa đơn",
            content: `Bạn có chắc chắn muốn xóa hóa đơn "${bill.name}"?`,
            okText: "Xóa",
            okType: "danger",
            cancelText: "Hủy",
            onOk: async () => {
                try {
                    const res = await deleteRecurringBillAPI(bill._id);
                    if (res.status || res.EC === 0) {
                        message.success("Xóa hóa đơn thành công!");
                        loadBills();
                    } else {
                        message.error(res.message || "Xóa thất bại!");
                    }
                } catch (error) {
                    message.error("Có lỗi xảy ra!");
                }
            },
        });
    };

    const handlePayNow = async (bill) => {
        try {
            const res = await payRecurringBillAPI(bill._id);
            if (res.status || res.EC === 0) {
                message.success("Thanh toán thành công!");
                loadBills();
            } else {
                message.error(res.message || "Thanh toán thất bại!");
            }
        } catch (error) {
            message.error("Có lỗi xảy ra!");
        }
    };

    const handleToggleActive = async (bill) => {
        // TODO: Implement toggle active API
        message.info("Tính năng đang phát triển");
    };

    const getBillMenuItems = (bill) => {
        return [
            {
                key: "pay",
                label: "Thanh toán ngay",
                icon: <CreditCard size={16} />,
                onClick: () => handlePayNow(bill),
            },
            {
                key: "edit",
                label: "Chỉnh sửa",
                icon: <Edit size={16} />,
                onClick: () => handleEditBill(bill),
            },
            {
                key: "toggle",
                label: bill.active ? "Tạm dừng" : "Kích hoạt",
                icon: bill.active ? <Pause size={16} /> : <Play size={16} />,
                onClick: () => handleToggleActive(bill),
            },
            {
                type: "divider",
            },
            {
                key: "delete",
                label: "Xóa",
                icon: <Trash2 size={16} />,
                danger: true,
                onClick: () => handleDeleteBill(bill),
            },
        ];
    };

    const tabs = [
        { key: "all", label: "Tất cả" },
        { key: "active", label: "Đang hoạt động" },
        { key: "paused", label: "Đã tạm dừng" },
    ];

    return (
        <div className="min-h-screen bg-[#F9FAFB]">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header Section */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="ds-heading-1" style={{ fontSize: "24px", fontWeight: 700 }}>
                        Quản lý Hóa đơn Định kỳ
                    </h1>
                    <button
                        onClick={handleAddBill}
                        className="ds-button-primary"
                        style={{ display: "flex", alignItems: "center", gap: "8px" }}
                    >
                        <Plus size={18} />
                        Thêm hóa đơn
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div className="ds-card">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-[#3B82F6]/10 rounded-lg flex items-center justify-center">
                                <CreditCard className="text-[#3B82F6] w-6 h-6" />
                            </div>
                        </div>
                        <p className="ds-text-secondary mb-1">Tổng hóa đơn</p>
                        <p className="text-2xl font-bold text-[#3B82F6]">{summary.totalBills}</p>
                    </div>

                    <div className="ds-card">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-[#10B981]/10 rounded-lg flex items-center justify-center">
                                <Wallet className="text-[#10B981] w-6 h-6" />
                            </div>
                        </div>
                        <p className="ds-text-secondary mb-1">Tổng số tiền/tháng</p>
                        <p className="text-2xl font-bold text-[#10B981]">
                            {formatCurrency(summary.totalAmount)}
                        </p>
                    </div>

                    <div className="ds-card">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-[#F59E0B]/10 rounded-lg flex items-center justify-center">
                                <Calendar className="text-[#F59E0B] w-6 h-6" />
                            </div>
                        </div>
                        <p className="ds-text-secondary mb-1">Sắp đến hạn</p>
                        <p className="text-2xl font-bold text-[#F59E0B]">{summary.upcomingCount}</p>
                    </div>

                    <div className="ds-card">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-[#10B981]/10 rounded-lg flex items-center justify-center">
                                <CheckCircle className="text-[#10B981] w-6 h-6" />
                            </div>
                        </div>
                        <p className="ds-text-secondary mb-1">Đã thanh toán tháng này</p>
                        <p className="text-2xl font-bold text-[#10B981]">{summary.paidThisMonth}</p>
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

                {/* Bills List */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="ds-card ds-skeleton" style={{ height: "180px" }}></div>
                        ))}
                    </div>
                ) : filteredBills.length > 0 ? (
                    <div className="space-y-4">
                        {filteredBills.map((bill) => {
                            const isUpcoming = dayjs(bill.next_run).diff(dayjs(), "day") <= 7 && bill.active;
                            return (
                                <div
                                    key={bill._id}
                                    className="ds-card relative"
                                    style={{
                                        border: isUpcoming ? "2px solid #F59E0B" : "1px solid #E5E7EB",
                                    }}
                                >
                                    {/* Actions Menu */}
                                    <div className="absolute top-4 right-4 z-10">
                                        <Dropdown
                                            menu={{ items: getBillMenuItems(bill) }}
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
                                        <div
                                            className={`w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                bill.type === "income"
                                                    ? "bg-[#10B981]/10"
                                                    : "bg-[#EF4444]/10"
                                            }`}
                                        >
                                            <CreditCard
                                                className={`w-8 h-8 ${
                                                    bill.type === "income" ? "text-[#10B981]" : "text-[#EF4444]"
                                                }`}
                                            />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="ds-heading-3">{bill.name}</h3>
                                                <span
                                                    className={`ds-badge ${
                                                        bill.active ? "ds-badge-success" : "ds-badge-warning"
                                                    }`}
                                                >
                                                    {bill.active ? "Đang hoạt động" : "Đã tạm dừng"}
                                                </span>
                                                {isUpcoming && (
                                                    <span className="ds-badge" style={{ backgroundColor: "#F59E0B20", color: "#F59E0B" }}>
                                                        Sắp đến hạn
                                                    </span>
                                                )}
                                            </div>

                                            <p
                                                className={`text-2xl font-bold mb-4 ${
                                                    bill.type === "income" ? "text-[#10B981]" : "text-[#EF4444]"
                                                }`}
                                            >
                                                {bill.type === "income" ? "+" : "-"}
                                                {formatCurrency(bill.amount)}
                                            </p>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                <div>
                                                    <p className="ds-text-small text-[#6B7280] mb-1">Tần suất</p>
                                                    <p className="font-semibold">{getFrequencyLabel(bill.frequency)}</p>
                                                </div>
                                                <div>
                                                    <p className="ds-text-small text-[#6B7280] mb-1">Ví</p>
                                                    <p className="font-semibold">{bill.wallet?.name || "N/A"}</p>
                                                </div>
                                                <div>
                                                    <p className="ds-text-small text-[#6B7280] mb-1">Danh mục</p>
                                                    <p className="font-semibold">{bill.category?.name || "N/A"}</p>
                                                </div>
                                                <div>
                                                    <p className="ds-text-small text-[#6B7280] mb-1">Loại</p>
                                                    <p className="font-semibold">
                                                        {bill.type === "income" ? "Thu nhập" : "Chi tiêu"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#E5E7EB]">
                                                <div>
                                                    <p className="ds-text-small text-[#6B7280] mb-1">
                                                        Lần thanh toán tiếp theo
                                                    </p>
                                                    <p className="font-semibold">{formatDateTime(bill.next_run)}</p>
                                                    <p className="text-sm text-[#F59E0B] mt-1">
                                                        {getTimeRemaining(bill.next_run)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="ds-text-small text-[#6B7280] mb-1">Ngày kết thúc</p>
                                                    <p className="font-semibold">{formatDate(bill.ends_at)}</p>
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
                        <CreditCard className="ds-empty-state-icon" size={64} />
                        <p className="ds-empty-state-text">
                            {activeTab === "paused"
                                ? "Chưa có hóa đơn nào bị tạm dừng"
                                : activeTab === "active"
                                ? "Chưa có hóa đơn đang hoạt động"
                                : "Chưa có hóa đơn định kỳ nào"}
                        </p>
                        <button onClick={handleAddBill} className="ds-button-primary mt-4">
                            Thêm hóa đơn đầu tiên
                        </button>
                    </div>
                )}
            </div>

            {/* Recurring Bill Modal */}
            <RecurringBillModal
                open={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setEditingBill(null);
                }}
                bill={editingBill}
                onSuccess={loadBills}
            />
        </div>
    );
};

export default RecurringBillsIndex;

