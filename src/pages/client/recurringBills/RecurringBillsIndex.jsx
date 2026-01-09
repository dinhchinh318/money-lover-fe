import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Pause, Play, CreditCard, Calendar, Wallet, CheckCircle, Receipt, Clock, AlertCircle } from "lucide-react";
import { message, Modal, Dropdown, Badge, Alert } from "antd";
import { getAllRecurringBillsAPI, deleteRecurringBillAPI, payRecurringBillAPI, pauseRecurringBillAPI, resumeRecurringBillAPI } from "../../../services/api.recurringBill";
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
        const totalBills = bills.length;

        const totalAmount = bills.reduce(
            (sum, b) => sum + (b.amount || 0),
            0
        );

        const now = dayjs();

        const upcomingCount = bills.filter((b) => {
            if (!b.active) return false;
            const nextRun = dayjs(b.next_run);
            return nextRun.isAfter(now) && nextRun.isBefore(now.add(7, "days"));
        }).length;

        // 🔥 NEW: ĐÃ THANH TOÁN THÁNG NÀY
        const paidThisMonth = bills.filter((b) => {
            if (!b.last_paid_at) return false;
            return dayjs(b.last_paid_at).isSame(now, "month");
        }).length;

        setSummary({
            totalBills,
            totalAmount,
            upcomingCount,
            paidThisMonth,
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
        Modal.confirm({
            title: bill.active ? "Tạm dừng hóa đơn" : "Kích hoạt hóa đơn",
            content: bill.active
                ? `Bạn có chắc chắn muốn tạm dừng "${bill.name}"?`
                : `Bạn có chắc chắn muốn kích hoạt lại "${bill.name}"?`,
            okText: bill.active ? "Tạm dừng" : "Kích hoạt",
            cancelText: "Hủy",
            okType: bill.active ? "danger" : "primary",
            onOk: async () => {
                try {
                    const res = bill.active
                        ? await pauseRecurringBillAPI(bill._id)
                        : await resumeRecurringBillAPI(bill._id);

                    if (res?.data?.status || res?.status || res?.EC === 0) {
                        message.success(
                            bill.active
                                ? "Đã tạm dừng hóa đơn!"
                                : "Đã kích hoạt hóa đơn!"
                        );
                        loadBills(); // reload list
                    } else {
                        message.error(res?.data?.message || "Thao tác thất bại!");
                    }
                } catch (error) {
                    message.error("Có lỗi xảy ra!");
                }
            },
        });
    };


    const getBillMenuItems = (bill) => {
        const isPaidThisMonth =
            bill.last_paid_at &&
            dayjs(bill.last_paid_at).isSame(dayjs(), "month");
        return [
            {
                key: "pay",
                label: isPaidThisMonth ? "Đã thanh toán" : "Thanh toán ngay",
                icon: <CreditCard size={16} />,
                disabled: isPaidThisMonth,
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
        <div className="min-h-screen bg-gradient-to-b from-emerald-50/70 via-white to-white">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg">
                            <Receipt className="text-white" size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 bg-clip-text text-transparent">
                                Quản lý Hóa đơn Định kỳ
                            </h1>
                            <p className="text-gray-600 mt-1 text-sm">
                                Tự động tạo giao dịch định kỳ theo tần suất bạn chọn
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleAddBill}
                        className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Thêm hóa đơn
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                                <Receipt className="text-white w-7 h-7" />
                            </div>
                        </div>
                        <p className="text-gray-600 mb-1 text-sm font-medium">Tổng hóa đơn</p>
                        <p className="text-3xl font-bold text-blue-600">{summary.totalBills}</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-green-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                                <Wallet className="text-white w-7 h-7" />
                            </div>
                        </div>
                        <p className="text-gray-600 mb-1 text-sm font-medium">Tổng số tiền/tháng</p>
                        <p className="text-3xl font-bold text-green-600">
                            {formatCurrency(summary.totalAmount)}
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-amber-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                                <Clock className="text-white w-7 h-7" />
                            </div>
                        </div>
                        <p className="text-gray-600 mb-1 text-sm font-medium">Sắp đến hạn</p>
                        <p className="text-3xl font-bold text-amber-600">{summary.upcomingCount}</p>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-50 to-teal-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-emerald-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
                                <CheckCircle className="text-white w-7 h-7" />
                            </div>
                        </div>
                        <p className="text-gray-600 mb-1 text-sm font-medium">Đã thanh toán tháng này</p>
                        <p className="text-3xl font-bold text-emerald-600">{summary.paidThisMonth}</p>
                    </div>
                </div>

                {/* Upcoming Alert */}
                {summary.upcomingCount > 0 && (
                    <Alert
                        message={`Bạn có ${summary.upcomingCount} hóa đơn sắp đến hạn trong 7 ngày tới`}
                        type="info"
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
                                ? "bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg"
                                : "text-gray-600 hover:bg-gray-50"
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
                            const isUpcoming =
                                dayjs(bill.next_run).diff(dayjs(), "day") <= 7 && bill.active;

                            const isPaidThisMonth =
                                bill.last_paid_at &&
                                dayjs(bill.last_paid_at).isSame(dayjs(), "month");
                            return (
                                <div
                                    key={bill._id}
                                    className={`relative rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 ${isUpcoming
                                        ? "bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300"
                                        : bill.type === "income"
                                            ? "bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200"
                                            : "bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200"
                                        }`}
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
                                            className={`w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${bill.type === "income"
                                                ? "bg-gradient-to-br from-green-400 to-emerald-600"
                                                : "bg-gradient-to-br from-red-400 to-rose-600"
                                                }`}
                                        >
                                            <CreditCard className="text-white w-10 h-10" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                {isPaidThisMonth && (
                                                    <Badge
                                                        color="green"
                                                        text="Đã thanh toán tháng này"
                                                    />
                                                )}
                                                {bill.auto_create_transaction && (
                                                    <Badge
                                                        color="blue"
                                                        text="Tự động"
                                                    />
                                                )}

                                                <h3 className="ds-heading-3">{bill.name}</h3>
                                                <Badge
                                                    count={bill.active ? "Đang hoạt động" : "Đã tạm dừng"}
                                                    style={{
                                                        backgroundColor: bill.active ? "#10B981" : "#F59E0B",
                                                        color: "white",
                                                        padding: "4px 12px",
                                                        borderRadius: "8px",
                                                        fontSize: "12px",
                                                        fontWeight: "600",
                                                    }}
                                                />
                                                {isUpcoming && (
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
                                            </div>

                                            <p
                                                className={`text-2xl font-bold mb-4 ${bill.type === "income" ? "text-[#10B981]" : "text-[#EF4444]"
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
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-300">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mb-4">
                            <Receipt className="text-blue-600" size={40} />
                        </div>
                        <p className="text-xl font-semibold text-gray-700 mb-2">
                            {activeTab === "paused"
                                ? "Chưa có hóa đơn nào bị tạm dừng"
                                : activeTab === "active"
                                    ? "Chưa có hóa đơn đang hoạt động"
                                    : "Chưa có hóa đơn định kỳ nào"}
                        </p>
                        <p className="text-gray-500 mb-6">Tạo hóa đơn định kỳ để tự động quản lý chi tiêu</p>
                        <button
                            onClick={handleAddBill}
                            className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                        >
                            <Plus size={20} />
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

