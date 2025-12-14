import { useState, useEffect } from "react";
import { Card, Spin, message, Badge, Button, Modal, Drawer, Tabs, Alert } from "antd";
import {
    suggestOptimizeSpendingAPI,
    suggestBudgetAdjustmentAPI,
    suggestWalletTransferAPI,
    getAlertHistoryAPI,
    markAlertAsReadAPI,
} from "../../../services/api.analytics";
import { BellOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { Eye, ArrowRight } from "lucide-react";
import dayjs from "dayjs";
import axios from "../../../services/axios.customize";

const AnalyticsPrescriptive = () => {
    const [loading, setLoading] = useState(false);

    // Section A: Gợi ý Tối ưu
    const [optimizeSuggestions, setOptimizeSuggestions] = useState([]);
    const [budgetSuggestions, setBudgetSuggestions] = useState([]);
    const [totalSavings, setTotalSavings] = useState(0);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedSuggestion, setSelectedSuggestion] = useState(null);

    // Section B: Khuyến nghị Chuyển tiền
    const [transferSuggestions, setTransferSuggestions] = useState([]);
    const [transferTab, setTransferTab] = useState("low"); // "low" hoặc "high"
    const [transferring, setTransferring] = useState(false);

    // Section C: Cảnh báo Thông minh
    const [alerts, setAlerts] = useState([]);
    const [alertFilter, setAlertFilter] = useState("all");
    const [unreadCount, setUnreadCount] = useState(0);
    const [markingAllRead, setMarkingAllRead] = useState(false);

    useEffect(() => {
        loadAllData();
    }, []);

    useEffect(() => {
        if (alertFilter) {
            loadAlerts();
        }
    }, [alertFilter]);

    const loadAllData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadOptimizeData(),
                loadTransferData(),
                loadAlerts(),
            ]);
        } catch (error) {
            console.error("Error loading prescriptive data:", error);
            message.error("Có lỗi xảy ra khi tải dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    const loadOptimizeData = async () => {
        try {
            const [optRes, budgetRes] = await Promise.all([
                suggestOptimizeSpendingAPI(),
                suggestBudgetAdjustmentAPI(),
            ]);

            console.log("Optimize responses:", { optRes, budgetRes });

            // Xử lý response optimize
            if (optRes?.status === true && optRes?.data) {
                const suggestions = optRes.data.suggestions || optRes.data || [];
                setOptimizeSuggestions(Array.isArray(suggestions) ? suggestions : []);
                const savings = optRes.data.potentialTotalSavings || 
                    suggestions.reduce((sum, item) => sum + (item.suggestion?.potentialSavings || 0), 0);
                setTotalSavings(savings);
            } else if (optRes?.EC === 0) {
                const suggestions = optRes.data || [];
                setOptimizeSuggestions(Array.isArray(suggestions) ? suggestions : []);
                setTotalSavings(suggestions.reduce((sum, item) => sum + (item.suggestion?.potentialSavings || 0), 0));
            }

            // Xử lý response budget
            if (budgetRes?.status === true && budgetRes?.data) {
                const suggestions = budgetRes.data.suggestions || budgetRes.data || [];
                setBudgetSuggestions(Array.isArray(suggestions) ? suggestions : []);
            } else if (budgetRes?.EC === 0) {
                setBudgetSuggestions(budgetRes.data || []);
            }
        } catch (error) {
            console.error("Error loading optimize data:", error);
        }
    };

    const loadTransferData = async () => {
        try {
            const res = await suggestWalletTransferAPI();
            console.log("Transfer response:", res);
            
            if (res?.status === true && res?.data) {
                const suggestions = res.data.suggestions || res.data || [];
                setTransferSuggestions(Array.isArray(suggestions) ? suggestions : []);
            } else if (res?.EC === 0) {
                setTransferSuggestions(res.data || []);
            }
        } catch (error) {
            console.error("Error loading transfer data:", error);
        }
    };

    const loadAlerts = async () => {
        try {
            const params = alertFilter !== "all" ? { status: alertFilter } : {};
            const res = await getAlertHistoryAPI(params);
            console.log("Alerts response:", res);
            
            if (res?.status === true && res?.data) {
                const alertData = res.data.alerts || res.data || [];
                setAlerts(Array.isArray(alertData) ? alertData : []);
                setUnreadCount(alertData.filter((a) => !a.isRead).length);
            } else if (res?.EC === 0) {
                const alertData = res.data || [];
                setAlerts(Array.isArray(alertData) ? alertData : []);
                setUnreadCount(alertData.filter((a) => !a.isRead).length);
            }
        } catch (error) {
            console.error("Error loading alerts:", error);
        }
    };

    // Áp dụng ngân sách mới
    const handleApplyBudget = async (budget) => {
        try {
            const budgetId = budget.budgetId || budget._id;
            const newLimit = budget.suggestion?.suggestedLimit || budget.suggestedLimit;
            
            if (!budgetId || !newLimit) {
                message.error("Thiếu thông tin ngân sách");
                return;
            }

            // Gọi API update budget
            const res = await axios.put(`/v1/api/budget/${budgetId}`, {
                limit_amount: newLimit,
            });

            if (res?.status === true || res?.EC === 0) {
                message.success("Đã áp dụng ngân sách mới thành công!");
                loadOptimizeData(); // Reload data
            } else {
                message.error(res?.message || "Có lỗi xảy ra khi áp dụng ngân sách");
            }
        } catch (error) {
            console.error("Error applying budget:", error);
            message.error("Có lỗi xảy ra khi áp dụng ngân sách");
        }
    };

    // Thực hiện chuyển tiền
    const handleTransferMoney = async (suggestion) => {
        try {
            setTransferring(true);
            const fromWalletId = suggestion.fromWallet?.id || suggestion.fromWalletId;
            const toWalletId = suggestion.toWallet?.id || suggestion.toWalletId;
            const amount = suggestion.suggestedAmount || suggestion.amount;

            if (!fromWalletId || !toWalletId || !amount) {
                message.error("Thiếu thông tin chuyển tiền");
                return;
            }

            // Tạo transaction chuyển tiền
            const res = await axios.post("/v1/api/transaction", {
                walletId: fromWalletId,
                toWalletId: toWalletId,
                amount: amount,
                type: "transfer",
                date: new Date(),
                note: `Chuyển tiền tự động: ${suggestion.reason || ""}`,
            });

            if (res?.status === true || res?.EC === 0) {
                message.success("Chuyển tiền thành công!");
                loadTransferData(); // Reload data
            } else {
                message.error(res?.message || "Có lỗi xảy ra khi chuyển tiền");
            }
        } catch (error) {
            console.error("Error transferring money:", error);
            message.error(error?.response?.data?.message || "Có lỗi xảy ra khi chuyển tiền");
        } finally {
            setTransferring(false);
        }
    };

    // Xem chi tiết gợi ý
    const handleViewDetails = (suggestion) => {
        setSelectedSuggestion(suggestion);
        setDetailModalVisible(true);
    };

    // Đánh dấu đã đọc
    const handleMarkAsRead = async (alertId) => {
        try {
            await markAlertAsReadAPI(alertId);
            message.success("Đã đánh dấu đã đọc");
            loadAlerts();
        } catch (error) {
            message.error("Có lỗi xảy ra");
        }
    };

    // Đánh dấu tất cả đã đọc
    const handleMarkAllAsRead = async () => {
        try {
            setMarkingAllRead(true);
            const unreadAlerts = alerts.filter(a => !a.isRead);
            await Promise.all(unreadAlerts.map(alert => markAlertAsReadAPI(alert._id || alert.id)));
            message.success("Đã đánh dấu tất cả đã đọc");
            loadAlerts();
        } catch (error) {
            message.error("Có lỗi xảy ra");
        } finally {
            setMarkingAllRead(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(value || 0);
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case "high":
                return "#EF4444";
            case "medium":
                return "#F59E0B";
            case "low":
                return "#10B981";
            default:
                return "#6B7280";
        }
    };

    const getPriorityText = (priority) => {
        switch (priority) {
            case "high":
                return "Cao";
            case "medium":
                return "Trung bình";
            case "low":
                return "Thấp";
            default:
                return "Không xác định";
        }
    };

    // Lọc transfer suggestions theo tab
    const filteredTransferSuggestions = transferSuggestions.filter(s => {
        if (transferTab === "low") {
            return s.toWallet?.isLow || s.priority === "high" || s.priority === "medium";
        } else {
            return !s.toWallet?.isLow && (s.priority === "low" || s.priority === "medium");
        }
    });

    // Lọc alerts theo filter
    const filteredAlerts = alerts.filter(alert => {
        if (alertFilter === "all") return true;
        if (alertFilter === "unread") return !alert.isRead;
        if (alertFilter === "read") return alert.isRead;
        if (alertFilter === "type") return alert.type === alertFilter;
        return true;
    });

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    Khuyến nghị Hành động
                </h1>
                <p className="text-gray-600 mt-1">
                    Gợi ý tối ưu, khuyến nghị và cảnh báo thông minh
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Spin size="large" />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Section A: Gợi ý Tối ưu */}
                    <div className="lg:col-span-1 space-y-4">
                        <Card title="Gợi ý Tối ưu Chi tiêu" className="shadow-sm">
                            {/* A1: Tổng số tiền có thể tiết kiệm */}
                            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg">
                                <div className="text-center">
                                    <div className="text-sm text-gray-600 mb-2">
                                        Số tiền có thể tiết kiệm
                                    </div>
                                    <div className="text-3xl font-bold text-[#10B981] mb-2">
                                        {formatCurrency(totalSavings)}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {optimizeSuggestions.length} danh mục được gợi ý
                                    </div>
                                </div>
                            </div>

                            {/* A2: Các thẻ đề xuất cắt giảm */}
                            <div className="space-y-3 mb-6">
                                {optimizeSuggestions.length > 0 ? (
                                    optimizeSuggestions.map((suggestion, index) => {
                                        const currentSpending = suggestion.currentSpending?.total || suggestion.currentSpending || 0;
                                        const potentialSavings = suggestion.suggestion?.potentialSavings || suggestion.potentialSavings || 0;
                                        const reductionPercent = suggestion.suggestion?.reductionPercent || 
                                            (currentSpending > 0 ? Math.round((potentialSavings / currentSpending) * 100) : 0);
                                        const priority = suggestion.priority || "medium";
                                        
                                        return (
                                            <Card
                                                key={index}
                                                size="small"
                                                className="border-l-4 hover:shadow-md transition-shadow"
                                                style={{
                                                    borderLeftColor: getPriorityColor(priority),
                                                }}
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="font-semibold text-sm">
                                                                Giảm {reductionPercent}% {suggestion.categoryName}
                                                            </span>
                                                            <Badge
                                                                count={getPriorityText(priority)}
                                                                style={{
                                                                    backgroundColor: getPriorityColor(priority),
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="text-xs text-gray-600 mb-1">
                                                            Chỉ tiêu hiện tại: {formatCurrency(currentSpending)}
                                                        </div>
                                                        <div className="text-xs text-gray-600 mb-1">
                                                            Có thể tiết kiệm: <span className="font-semibold text-green-600">{formatCurrency(potentialSavings)}</span>
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            Priority: {getPriorityText(priority)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    type="link"
                                                    size="small"
                                                    icon={<Eye size={14} />}
                                                    onClick={() => handleViewDetails(suggestion)}
                                                    className="p-0 h-auto"
                                                >
                                                    Xem chi tiết
                                                </Button>
                                            </Card>
                                        );
                                    })
                                ) : (
                                    <div className="text-sm text-gray-500 text-center py-4">
                                        Không có gợi ý
                                    </div>
                                )}
                            </div>

                            {/* A3: Đề xuất điều chỉnh ngân sách */}
                            <div>
                                <div className="text-sm font-semibold text-gray-700 mb-3">
                                    Hạn mức Budget
                                </div>
                                <div className="space-y-3">
                                    {budgetSuggestions.length > 0 ? (
                                        budgetSuggestions.map((budget, index) => {
                                            const currentLimit = budget.current?.limit || budget.currentLimit || 0;
                                            const suggestedLimit = budget.suggestion?.suggestedLimit || budget.suggestedLimit || 0;
                                            const differencePercent = budget.suggestion?.differencePercent || 
                                                (currentLimit > 0 ? Math.round(((currentLimit - suggestedLimit) / currentLimit) * 100) : 0);
                                            const reason = budget.suggestion?.reason || budget.reason || "";
                                            
                                            return (
                                                <Card
                                                    key={index}
                                                    size="small"
                                                    className="border border-gray-200 hover:shadow-md transition-shadow"
                                                >
                                                    <div className="mb-2">
                                                        <div className="font-semibold text-sm mb-1">
                                                            {budget.category?.name || budget.budgetName}
                                                        </div>
                                                        <div className="text-xs text-gray-600 mb-1">
                                                            Giảm {Math.abs(differencePercent)}%
                                                        </div>
                                                        <div className="text-xs text-gray-600 mb-1">
                                                            Hạn mức hiện tại: {formatCurrency(currentLimit)}
                                                        </div>
                                                        <div className="text-xs text-gray-600 mb-1">
                                                            Đề xuất mới: {formatCurrency(suggestedLimit)}
                                                        </div>
                                                        <div className="text-xs text-gray-500 mb-2">
                                                            Lý do: {reason}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        type="primary"
                                                        size="small"
                                                        className="w-full bg-[#10B981] hover:bg-[#059669] border-[#10B981]"
                                                        onClick={() => handleApplyBudget(budget)}
                                                    >
                                                        Áp dụng
                                                    </Button>
                                                </Card>
                                            );
                                        })
                                    ) : (
                                        <div className="text-sm text-gray-500 text-center py-4">
                                            Không có đề xuất
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Section B: Khuyến nghị Chuyển tiền */}
                    <div className="lg:col-span-1 space-y-4">
                        <Card title="Khuyến nghị Chuyển tiền" className="shadow-sm">
                            {/* Tabs */}
                            <Tabs
                                activeKey={transferTab}
                                onChange={setTransferTab}
                                items={[
                                    {
                                        key: "low",
                                        label: `${transferSuggestions.filter(s => s.toWallet?.isLow || s.priority === "high").length} ví sắp hết tiền`,
                                    },
                                    {
                                        key: "high",
                                        label: `${transferSuggestions.filter(s => !s.toWallet?.isLow).length} ví dư tiền`,
                                    },
                                ]}
                                className="mb-4"
                            />

                            {/* Danh sách khuyến nghị chuyển tiền */}
                            <div className="space-y-3">
                                {filteredTransferSuggestions.length > 0 ? (
                                    filteredTransferSuggestions.map((suggestion, index) => {
                                        const fromWallet = suggestion.fromWallet?.name || suggestion.fromWalletName || "Ví Wallet";
                                        const toWallet = suggestion.toWallet?.name || suggestion.toWalletName || "Ví Wallet";
                                        const amount = suggestion.suggestedAmount || suggestion.amount || 0;
                                        const reason = suggestion.reason || "";
                                        const priority = suggestion.priority || "medium";
                                        
                                        return (
                                            <Card
                                                key={index}
                                                size="small"
                                                className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow"
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="font-semibold text-sm">
                                                                From: {fromWallet} <ArrowRight size={14} className="inline mx-1" /> To: {toWallet}
                                                            </span>
                                                            <Badge
                                                                count={getPriorityText(priority)}
                                                                style={{
                                                                    backgroundColor: getPriorityColor(priority),
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="text-lg font-bold text-blue-600 mb-2">
                                                            {formatCurrency(amount)}
                                                        </div>
                                                        <div className="text-xs text-gray-500 mb-2">
                                                            Lý do: {reason}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    type="primary"
                                                    size="small"
                                                    className="w-full bg-[#10B981] hover:bg-[#059669] border-[#10B981]"
                                                    onClick={() => handleTransferMoney(suggestion)}
                                                    loading={transferring}
                                                >
                                                    Chuyển ngay
                                                </Button>
                                            </Card>
                                        );
                                    })
                                ) : (
                                    <div className="text-sm text-gray-500 text-center py-4">
                                        Không có khuyến nghị
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Section C: Cảnh báo Thông minh */}
                    <div className="lg:col-span-1 space-y-4">
                        <Card title="Cảnh báo Thông minh" className="shadow-sm">
                            {/* Summary và Mark all as read */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-sm text-gray-600">
                                    {unreadCount} cảnh báo chưa đọc
                                </div>
                                {unreadCount > 0 && (
                                    <Button
                                        type="link"
                                        size="small"
                                        onClick={handleMarkAllAsRead}
                                        loading={markingAllRead}
                                    >
                                        Đánh dấu tất cả đã đọc
                                    </Button>
                                )}
                            </div>

                            {/* Filters */}
                            <div className="flex gap-2 mb-4 flex-wrap">
                                <Button
                                    size="small"
                                    type={alertFilter === "all" ? "primary" : "default"}
                                    onClick={() => setAlertFilter("all")}
                                >
                                    Tất cả
                                </Button>
                                <Button
                                    size="small"
                                    type={alertFilter === "unread" ? "primary" : "default"}
                                    onClick={() => setAlertFilter("unread")}
                                >
                                    Chưa đọc
                                </Button>
                                <Button
                                    size="small"
                                    type={alertFilter === "read" ? "primary" : "default"}
                                    onClick={() => setAlertFilter("read")}
                                >
                                    Đã đọc
                                </Button>
                            </div>

                            {/* Danh sách cảnh báo */}
                            <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                {filteredAlerts.length > 0 ? (
                                    filteredAlerts.map((alert, index) => (
                                        <div
                                            key={index}
                                            className={`p-3 rounded-lg border transition-all ${
                                                !alert.isRead 
                                                    ? "bg-yellow-50 border-yellow-200 border-l-4" 
                                                    : "bg-gray-50 border-gray-200"
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <ExclamationCircleOutlined 
                                                    className={`text-lg mt-1 ${
                                                        !alert.isRead ? "text-yellow-600" : "text-gray-400"
                                                    }`}
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-semibold text-sm">
                                                            {alert.title || "Cảnh báo Thông minh"}
                                                        </span>
                                                        {alert.isRead && (
                                                            <CheckCircleOutlined className="text-green-500 text-xs" />
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mb-1">
                                                        Loại: {alert.type || "Cảnh báo"}
                                                    </div>
                                                    <div className="text-xs text-gray-700 mb-2">
                                                        {alert.message || alert.content || ""}
                                                    </div>
                                                    <div className="text-xs text-gray-400 mb-2">
                                                        {dayjs(alert.createdAt || alert.date).format("DD/MM/YYYY HH:mm")}
                                                    </div>
                                                    {!alert.isRead && (
                                                        <Button
                                                            type="link"
                                                            size="small"
                                                            onClick={() => handleMarkAsRead(alert._id || alert.id)}
                                                            className="p-0 h-auto text-xs"
                                                        >
                                                            Đánh dấu đã đọc
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-sm text-gray-500 text-center py-4">
                                        Không có cảnh báo
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {/* Modal Xem chi tiết */}
            <Modal
                title="Chi tiết Gợi ý"
                open={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={null}
            >
                {selectedSuggestion && (
                    <div className="space-y-4">
                        <div>
                            <div className="font-semibold mb-2">{selectedSuggestion.categoryName}</div>
                            <div className="text-sm text-gray-600 mb-2">
                                <div>Chỉ tiêu hiện tại: {formatCurrency(selectedSuggestion.currentSpending?.total || 0)}</div>
                                <div>Số giao dịch: {selectedSuggestion.currentSpending?.count || 0}</div>
                                <div>Trung bình/giao dịch: {formatCurrency(selectedSuggestion.currentSpending?.avgPerTransaction || 0)}</div>
                                <div>% tổng chi: {selectedSuggestion.currentSpending?.percentageOfTotal?.toFixed(1) || 0}%</div>
                            </div>
                        </div>
                        <div>
                            <div className="font-semibold mb-2">Gợi ý tiết kiệm</div>
                            <div className="text-sm text-gray-600">
                                <div>Giảm: {selectedSuggestion.suggestion?.reductionPercent || 0}%</div>
                                <div>Có thể tiết kiệm: <span className="font-semibold text-green-600">{formatCurrency(selectedSuggestion.suggestion?.potentialSavings || 0)}</span></div>
                                <div>Số tiền mới đề xuất: {formatCurrency(selectedSuggestion.suggestion?.suggestedNewAmount || 0)}</div>
                            </div>
                        </div>
                        <div>
                            <div className="font-semibold mb-2">Lý do</div>
                            <div className="text-sm text-gray-600">
                                {selectedSuggestion.suggestion?.reason || "Để tối ưu chi tiêu và đạt mục tiêu tiết kiệm"}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AnalyticsPrescriptive;
