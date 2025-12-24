import { useState, useEffect } from "react";
import { Card, Spin, message, Badge, Button, Modal, Drawer, Tabs, Alert } from "antd";
import {
    suggestOptimizeSpendingAPI,
    suggestBudgetAdjustmentAPI,
    suggestWalletTransferAPI,
    createSmartAlertsAPI,
    getAlertHistoryAPI,
    markAlertAsReadAPI,
} from "../../../services/api.analytics";
import { BellOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import {
    Eye,
    ArrowRight,
    TrendingDown,
    Wallet,
    AlertTriangle,
    Sparkles,
    ArrowRightLeft,
    PiggyBank,
    Target,
    Zap
} from "lucide-react";
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

            console.log("🔍 [Optimize] API Response:", optRes);
            console.log("🔍 [Budget] API Response:", budgetRes);

            // Xử lý response optimize - chỉ dùng dữ liệu từ API
            let suggestions = [];
            let savings = 0;

            if (optRes?.status === true && optRes?.data) {
                suggestions = optRes.data.suggestions || optRes.data || [];
                suggestions = Array.isArray(suggestions) ? suggestions : [];
                savings = optRes.data.potentialTotalSavings ||
                    suggestions.reduce((sum, item) => sum + (item.suggestion?.potentialSavings || item.potentialSavings || 0), 0);
                console.log("✅ [Optimize] Loaded suggestions:", suggestions.length, "items, savings:", savings);
            } else if (optRes?.EC === 0 && optRes?.data) {
                suggestions = optRes.data.suggestions || optRes.data || [];
                suggestions = Array.isArray(suggestions) ? suggestions : [];
                savings = suggestions.reduce((sum, item) => sum + (item.suggestion?.potentialSavings || item.potentialSavings || 0), 0);
                console.log("✅ [Optimize] Loaded suggestions (EC=0):", suggestions.length, "items, savings:", savings);
            } else {
                console.warn("⚠️ [Optimize] No valid data in response:", optRes);
            }

            setOptimizeSuggestions(suggestions);
            setTotalSavings(savings);

            // Xử lý response budget - chỉ dùng dữ liệu từ API
            let budgetSuggestions = [];

            if (budgetRes?.status === true && budgetRes?.data) {
                budgetSuggestions = budgetRes.data.suggestions || budgetRes.data || [];
                budgetSuggestions = Array.isArray(budgetSuggestions) ? budgetSuggestions : [];
                console.log("✅ [Budget] Loaded suggestions:", budgetSuggestions.length, "items");
            } else if (budgetRes?.EC === 0 && budgetRes?.data) {
                budgetSuggestions = budgetRes.data.suggestions || budgetRes.data || [];
                budgetSuggestions = Array.isArray(budgetSuggestions) ? budgetSuggestions : [];
                console.log("✅ [Budget] Loaded suggestions (EC=0):", budgetSuggestions.length, "items");
            } else {
                console.warn("⚠️ [Budget] No valid data in response:", budgetRes);
            }

            setBudgetSuggestions(budgetSuggestions);
        } catch (error) {
            console.error("❌ Error loading optimize data:", error);
            // Khi có lỗi, set về giá trị mặc định (rỗng)
            setOptimizeSuggestions([]);
            setBudgetSuggestions([]);
            setTotalSavings(0);
        }
    };

    const loadTransferData = async () => {
        try {
            const res = await suggestWalletTransferAPI();

            console.log("🔍 [Transfer] API Response:", res);

            // Xử lý response - chỉ dùng dữ liệu từ API
            let suggestions = [];

            if (res?.status === true && res?.data) {
                suggestions = res.data.suggestions || res.data || [];
                suggestions = Array.isArray(suggestions) ? suggestions : [];
                console.log("✅ [Transfer] Loaded suggestions:", suggestions.length, "items");
            } else if (res?.EC === 0 && res?.data) {
                suggestions = res.data.suggestions || res.data || [];
                suggestions = Array.isArray(suggestions) ? suggestions : [];
                console.log("✅ [Transfer] Loaded suggestions (EC=0):", suggestions.length, "items");
            } else {
                console.warn("⚠️ [Transfer] No valid data in response:", res);
            }

            setTransferSuggestions(suggestions);
        } catch (error) {
            console.error("❌ Error loading transfer data:", error);
            // Khi có lỗi, set về giá trị mặc định (rỗng)
            setTransferSuggestions([]);
        }
    };

    const loadAlerts = async () => {
        try {
            // Đầu tiên, tạo cảnh báo mới bằng thuật toán (nếu cần)
            try {
                await createSmartAlertsAPI({});
            } catch (createError) {
                console.warn("Could not create new alerts, will load existing ones:", createError);
            }

            // Sau đó load lịch sử cảnh báo
            const params = alertFilter !== "all" ? { isRead: alertFilter === "read" } : {};
            const res = await getAlertHistoryAPI(params);

            let alertData = [];
            if (res?.status === true && res?.data) {
                alertData = res.data.alerts || res.data || [];
                alertData = Array.isArray(alertData) ? alertData : [];
            } else if (res?.EC === 0 && res?.data) {
                alertData = res.data.alerts || res.data || [];
                alertData = Array.isArray(alertData) ? alertData : [];
            }

            // Không filter ở đây, sẽ filter ở render dựa trên alertFilter state
            setAlerts(alertData);
            setUnreadCount(alertData.filter((a) => !a.isRead).length);
        } catch (error) {
            console.error("Error loading alerts:", error);
            // Khi có lỗi, set về giá trị mặc định (rỗng)
            setAlerts([]);
            setUnreadCount(0);
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

    // Helper function để lấy icon cho category
    const getCategoryIcon = (categoryName) => {
        const iconMap = {
            "ăn uống": "🍔",
            "mua sắm": "🛍️",
            "di chuyển": "🚗",
            "giải trí": "🎮",
            "y tế": "🏥",
            "hóa đơn": "📄",
            "giáo dục": "📚",
            "du lịch": "✈️",
            "quà tặng": "🎁",
            "khác": "💰",
        };
        return iconMap[categoryName?.toLowerCase()] || "💰";
    };

    // Helper function để lấy icon cho alert type
    const getAlertIcon = (type) => {
        switch (type?.toLowerCase()) {
            case "budget":
            case "budget_overrun_predicted":
            case "budget_almost_depleted":
            case "budget_overrun":
                return "📊";
            case "spending":
            case "unusual_spending_detected":
            case "category_spending_spike":
            case "monthly_spending_increase":
            case "weekly_spending_spike":
                return "📈";
            case "wallet":
            case "low_wallet_balance":
                return "💳";
            case "suggest_optimize_spending":
                return "💡";
            default:
                return "🔔";
        }
    };

    // Helper function để format alert type label
    const getAlertTypeLabel = (type) => {
        switch (type?.toLowerCase()) {
            case "budget_almost_depleted":
                return "budget";
            case "budget_overrun":
            case "budget_overrun_predicted":
                return "budget";
            case "monthly_spending_increase":
            case "weekly_spending_spike":
            case "category_spending_spike":
                return "spending";
            case "low_wallet_balance":
                return "wallet";
            case "suggest_optimize_spending":
                return "suggestion";
            default:
                return type?.toLowerCase().replace(/_/g, " ") || "cảnh báo";
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="mb-10">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                        <div className="p-4 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 rounded-2xl shadow-xl shadow-purple-500/20 transform hover:scale-105 transition-transform duration-300">
                            <Sparkles className="text-white" size={28} />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent mb-2">
                                Khuyến nghị Hành động
                            </h1>
                            <p className="text-gray-600 text-base sm:text-lg max-w-2xl">
                                Gợi ý tối ưu, khuyến nghị và cảnh báo thông minh để quản lý tài chính hiệu quả
                            </p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col justify-center items-center py-32">
                        <div className="relative">
                            <Spin size="large" className="custom-spin" />
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
                        </div>
                        <p className="mt-6 text-gray-600 font-medium text-lg">Đang tải khuyến nghị thông minh...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                        {/* Section A: Gợi ý Tối ưu */}
                        <div className="lg:col-span-1 space-y-6">
                            <Card
                                className="shadow-xl hover:shadow-2xl transition-all duration-500 border-0 rounded-3xl overflow-hidden bg-white backdrop-blur-sm"
                                title={
                                    <div className="flex items-center gap-3 pb-2">
                                        <div className="p-3 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 rounded-xl shadow-lg shadow-green-500/30">
                                            <Target className="text-white" size={22} />
                                        </div>
                                        <span className="font-bold text-lg text-gray-800">Gợi ý Tối ưu Chi tiêu</span>
                                    </div>
                                }
                            >
                                {/* A1: Tổng số tiền có thể tiết kiệm */}
                                <div className="mb-8 p-6 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200/60 rounded-2xl shadow-lg relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                    <div className="relative text-center">
                                        <div className="flex items-center justify-center gap-2 mb-4">
                                            <PiggyBank className="text-green-600" size={24} />
                                            <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                                                Số tiền có thể tiết kiệm
                                            </span>
                                        </div>
                                        <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 mb-4">
                                            {formatCurrency(totalSavings)}
                                        </div>
                                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border-2 border-green-200 shadow-md">
                                            <Zap className="text-green-500 animate-pulse" size={16} />
                                            <span className="text-xs font-bold text-gray-700">
                                                {optimizeSuggestions.length} danh mục được gợi ý
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* A2: Các thẻ đề xuất cắt giảm */}
                                <div className="space-y-4 mb-8">
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
                                                    className="mb-3 border-2 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 rounded-2xl overflow-hidden cursor-pointer group"
                                                    style={{
                                                        borderColor: getPriorityColor(priority) + "50",
                                                        backgroundColor: "white",
                                                    }}
                                                    onClick={() => handleViewDetails(suggestion)}
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow">
                                                            <span className="text-3xl transform group-hover:scale-110 transition-transform">{getCategoryIcon(suggestion.categoryName)}</span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                    <TrendingDown className="text-red-500 flex-shrink-0" size={18} />
                                                                    <span className="font-bold text-base text-gray-900 truncate">
                                                                        Giảm {reductionPercent}% {suggestion.categoryName}
                                                                    </span>
                                                                </div>
                                                                <Badge
                                                                    count={getPriorityText(priority)}
                                                                    className="ml-2 flex-shrink-0"
                                                                    style={{
                                                                        backgroundColor: getPriorityColor(priority),
                                                                        fontSize: '11px',
                                                                        fontWeight: 'bold',
                                                                        padding: '2px 8px'
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="space-y-2 mb-4">
                                                                <div className="flex items-center justify-between text-sm">
                                                                    <span className="text-gray-600">Chi tiêu hiện tại:</span>
                                                                    <span className="font-bold text-gray-900">{formatCurrency(currentSpending)}</span>
                                                                </div>
                                                                <div className="flex items-center justify-between text-sm bg-green-50 p-2 rounded-lg border border-green-200">
                                                                    <span className="text-gray-700 font-semibold">Có thể tiết kiệm:</span>
                                                                    <span className="font-extrabold text-green-600 text-base">{formatCurrency(potentialSavings)}</span>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                type="link"
                                                                size="small"
                                                                icon={<Eye size={16} />}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleViewDetails(suggestion);
                                                                }}
                                                                className="p-0 h-auto text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1"
                                                            >
                                                                Xem chi tiết
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </Card>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-12 px-4">
                                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                                                <Target className="text-gray-400" size={40} />
                                            </div>
                                            <p className="text-gray-500 font-medium text-base mb-1">Không có gợi ý</p>
                                            <p className="text-gray-400 text-sm">Hãy thêm giao dịch để nhận gợi ý tối ưu</p>
                                        </div>
                                    )}
                                </div>

                                {/* A3: Đề xuất điều chỉnh ngân sách */}
                                <div className="mt-8 pt-6 border-t border-gray-200">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg">
                                            <Target className="text-white" size={18} />
                                        </div>
                                        <h3 className="text-base font-bold text-gray-800">Hạn mức Budget</h3>
                                    </div>
                                    <div className="space-y-4">
                                        {budgetSuggestions.length > 0 ? (
                                            budgetSuggestions.map((budget, index) => {
                                                const currentLimit = budget.current?.limit || budget.currentLimit || 0;
                                                const suggestedLimit = budget.suggestion?.suggestedLimit || budget.suggestedLimit || 0;
                                                const differencePercent = budget.suggestion?.differencePercent ||
                                                    (currentLimit > 0 ? Math.round(((suggestedLimit - currentLimit) / currentLimit) * 100) : 0);
                                                const reason = budget.suggestion?.reason || budget.reason || "";

                                                return (
                                                    <Card
                                                        key={index}
                                                        className="border-2 border-yellow-200/60 hover:border-yellow-300 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 rounded-2xl bg-gradient-to-br from-yellow-50/80 to-amber-50/80 backdrop-blur-sm"
                                                    >
                                                        <div className="mb-4">
                                                            <div className="flex items-center gap-3 mb-4">
                                                                <span className="text-2xl">{getCategoryIcon(budget.category?.name || budget.budgetName)}</span>
                                                                <div className="font-bold text-base text-gray-900">
                                                                    {budget.category?.name || budget.budgetName}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-3 mb-4">
                                                                <div className="flex items-center gap-2 p-2 bg-white/60 rounded-lg">
                                                                    <TrendingDown className="text-red-500" size={16} />
                                                                    <span className="text-sm font-bold text-gray-700">
                                                                        {differencePercent > 0 ? 'Tăng' : 'Giảm'} {Math.abs(differencePercent)}%
                                                                    </span>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    <div className="p-2 bg-white/60 rounded-lg">
                                                                        <div className="text-xs text-gray-500 mb-1">Hiện tại</div>
                                                                        <div className="text-sm font-bold text-gray-900">{formatCurrency(currentLimit)}</div>
                                                                    </div>
                                                                    <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
                                                                        <div className="text-xs text-gray-600 mb-1">Đề xuất</div>
                                                                        <div className="text-sm font-extrabold text-green-600">{formatCurrency(suggestedLimit)}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-xs text-gray-600 italic bg-white/40 p-2 rounded-lg border border-gray-200">
                                                                    {reason}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            type="primary"
                                                            size="middle"
                                                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-0 shadow-lg hover:shadow-xl font-semibold h-10"
                                                            onClick={() => handleApplyBudget(budget)}
                                                        >
                                                            Áp dụng ngay
                                                        </Button>
                                                    </Card>
                                                );
                                            })
                                        ) : (
                                            <div className="text-center py-10 px-4">
                                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-3">
                                                    <Target className="text-gray-400" size={32} />
                                                </div>
                                                <p className="text-gray-500 font-medium text-sm">Không có đề xuất</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Section B: Khuyến nghị Chuyển tiền */}
                        <div className="lg:col-span-1 space-y-6">
                            <Card
                                className="shadow-xl hover:shadow-2xl transition-all duration-500 border-0 rounded-3xl overflow-hidden bg-white backdrop-blur-sm"
                                title={
                                    <div className="flex items-center gap-3 pb-2">
                                        <div className="p-3 bg-gradient-to-br from-blue-400 via-cyan-500 to-teal-500 rounded-xl shadow-lg shadow-blue-500/30">
                                            <ArrowRightLeft className="text-white" size={22} />
                                        </div>
                                        <span className="font-bold text-lg text-gray-800">Khuyến nghị Chuyển tiền</span>
                                    </div>
                                }
                            >
                                {/* Tabs */}
                                <Tabs
                                    activeKey={transferTab}
                                    onChange={setTransferTab}
                                    items={[
                                        {
                                            key: "low",
                                            label: (
                                                <span className="font-semibold">
                                                    {transferSuggestions.filter(s => s.toWallet?.isLow || s.priority === "high" || s.priority === "medium").length} ví sắp hết tiền
                                                </span>
                                            ),
                                        },
                                        {
                                            key: "high",
                                            label: (
                                                <span className="font-semibold">
                                                    {transferSuggestions.filter(s => !s.toWallet?.isLow && (s.priority === "low" || s.priority === "medium")).length} ví dư tiền
                                                </span>
                                            ),
                                        },
                                    ]}
                                    className="mb-6"
                                />

                                {/* Danh sách khuyến nghị chuyển tiền */}
                                <div className="space-y-4">
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
                                                    className="border-2 border-purple-200/60 hover:border-purple-300 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 rounded-2xl bg-gradient-to-br from-purple-50/80 via-blue-50/80 to-indigo-50/80 backdrop-blur-sm"
                                                >
                                                    <div className="mb-5">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="p-2 bg-purple-100 rounded-lg">
                                                                    <Wallet className="text-purple-600" size={18} />
                                                                </div>
                                                                <Badge
                                                                    count={getPriorityText(priority)}
                                                                    className="ml-2"
                                                                    style={{
                                                                        backgroundColor: getPriorityColor(priority),
                                                                        fontSize: '11px',
                                                                        fontWeight: 'bold',
                                                                        padding: '2px 8px'
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <div className="flex-1 p-3 bg-white rounded-xl border-2 border-gray-200 shadow-sm">
                                                                <div className="text-xs text-gray-500 mb-1 font-medium">Từ</div>
                                                                <div className="font-bold text-sm text-gray-900 truncate">{fromWallet}</div>
                                                            </div>
                                                            <div className="flex-shrink-0 p-2 bg-purple-100 rounded-full">
                                                                <ArrowRight className="text-purple-600" size={20} />
                                                            </div>
                                                            <div className="flex-1 p-3 bg-white rounded-xl border-2 border-purple-200 shadow-sm">
                                                                <div className="text-xs text-gray-500 mb-1 font-medium">Đến</div>
                                                                <div className="font-bold text-sm text-purple-700 truncate">{toWallet}</div>
                                                            </div>
                                                        </div>
                                                        <div className="mb-4 p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl border border-purple-200">
                                                            <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-2">
                                                                {formatCurrency(amount)}
                                                            </div>
                                                            <div className="text-sm text-gray-700 italic font-medium">
                                                                {reason}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        type="primary"
                                                        size="large"
                                                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-0 shadow-lg hover:shadow-xl font-bold h-12 text-base"
                                                        onClick={() => handleTransferMoney(suggestion)}
                                                        loading={transferring}
                                                    >
                                                        Chuyển ngay
                                                    </Button>
                                                </Card>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-12 px-4">
                                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                                                <ArrowRightLeft className="text-gray-400" size={40} />
                                            </div>
                                            <p className="text-gray-500 font-medium text-base mb-1">Không có khuyến nghị</p>
                                            <p className="text-gray-400 text-sm">Số dư các ví đã được cân đối</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>

                        {/* Section C: Cảnh báo Thông minh */}
                        <div className="lg:col-span-1 space-y-6">
                            <Card
                                className="shadow-xl hover:shadow-2xl transition-all duration-500 border-0 rounded-3xl overflow-hidden bg-white backdrop-blur-sm"
                                title={
                                    <div className="flex items-center gap-3 pb-2">
                                        <div className="p-3 bg-gradient-to-br from-red-400 via-pink-500 to-rose-500 rounded-xl shadow-lg shadow-red-500/30">
                                            <AlertTriangle className="text-white" size={22} />
                                        </div>
                                        <span className="font-bold text-lg text-gray-800">Cảnh báo Thông minh</span>
                                    </div>
                                }
                            >
                                {/* Summary và Mark all as read */}
                                <div className="flex items-center justify-between mb-6 p-4 bg-gradient-to-r from-red-50 via-orange-50 to-amber-50 border-2 border-red-200/60 rounded-xl shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-red-100 rounded-lg">
                                            <BellOutlined className="text-red-600 text-lg" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-gray-800">
                                                {unreadCount} cảnh báo chưa đọc
                                            </div>
                                        </div>
                                    </div>
                                    {unreadCount > 0 && (
                                        <Button
                                            type="link"
                                            size="small"
                                            onClick={handleMarkAllAsRead}
                                            loading={markingAllRead}
                                            className="text-red-600 hover:text-red-700 font-bold text-sm"
                                        >
                                            Đánh dấu tất cả
                                        </Button>
                                    )}
                                </div>

                                {/* Filters */}
                                <Tabs
                                    activeKey={alertFilter}
                                    onChange={setAlertFilter}
                                    items={[
                                        {
                                            key: "all",
                                            label: <span className="font-semibold">Tất cả</span>,
                                        },
                                        {
                                            key: "unread",
                                            label: <span className="font-semibold">Chưa đọc</span>,
                                        },
                                        {
                                            key: "read",
                                            label: <span className="font-semibold">Đã đọc</span>,
                                        },
                                    ]}
                                    className="mb-6"
                                />

                                {/* Danh sách cảnh báo */}
                                <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                                    {filteredAlerts.length > 0 ? (
                                        filteredAlerts.map((alert, index) => (
                                            <Card
                                                key={index}
                                                className={`border-2 rounded-2xl transition-all duration-300 hover:shadow-lg hover:scale-[1.01] ${!alert.isRead
                                                    ? "bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 border-yellow-300/60 shadow-md"
                                                    : "bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200/60"
                                                    }`}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${!alert.isRead
                                                        ? "bg-gradient-to-br from-yellow-100 to-amber-100 border-2 border-yellow-300"
                                                        : "bg-gradient-to-br from-gray-100 to-slate-100 border-2 border-gray-300"
                                                        }`}>
                                                        <span className="text-2xl">{getAlertIcon(alert.type)}</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <span className="font-bold text-base text-gray-900">
                                                                {alert.title || "Cảnh báo Thông minh"}
                                                            </span>
                                                            {alert.isRead && (
                                                                <CheckCircleOutlined className="text-green-500 text-lg flex-shrink-0 ml-2" />
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <Badge
                                                                count={getAlertTypeLabel(alert.type)}
                                                                style={{
                                                                    backgroundColor: !alert.isRead ? "#F59E0B" : "#6B7280",
                                                                    fontSize: '11px',
                                                                    fontWeight: 'bold',
                                                                    padding: '2px 8px'
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="text-sm text-gray-700 mb-3 leading-relaxed bg-white/60 p-3 rounded-lg border border-gray-200">
                                                            {alert.message || alert.content || ""}
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <div className="text-xs text-gray-500 font-medium">
                                                                {dayjs(alert.createdAt || alert.date).format("DD/MM/YYYY HH:mm")}
                                                            </div>
                                                            {!alert.isRead && (
                                                                <Button
                                                                    type="link"
                                                                    size="small"
                                                                    onClick={() => handleMarkAsRead(alert._id || alert.id)}
                                                                    className="p-0 h-auto text-xs text-yellow-700 hover:text-yellow-800 font-bold"
                                                                >
                                                                    Đánh dấu đã đọc
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 px-4">
                                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                                                <AlertTriangle className="text-gray-400" size={40} />
                                            </div>
                                            <p className="text-gray-500 font-medium text-base mb-1">Không có cảnh báo</p>
                                            <p className="text-gray-400 text-sm">Mọi thứ đang diễn ra tốt đẹp!</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {/* Modal Xem chi tiết */}
                <Modal
                    title={
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                                <Target className="text-white" size={20} />
                            </div>
                            <span className="text-xl font-bold">Chi tiết Gợi ý</span>
                        </div>
                    }
                    open={detailModalVisible}
                    onCancel={() => setDetailModalVisible(false)}
                    footer={null}
                    width={600}
                    className="custom-modal"
                >
                    {selectedSuggestion && (
                        <div className="space-y-6 py-4">
                            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-4xl">{getCategoryIcon(selectedSuggestion.categoryName)}</span>
                                    <div className="font-bold text-xl text-gray-900">{selectedSuggestion.categoryName}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                                        <div className="text-gray-500 mb-1">Chi tiêu hiện tại</div>
                                        <div className="font-bold text-gray-900 text-base">{formatCurrency(selectedSuggestion.currentSpending?.total || 0)}</div>
                                    </div>
                                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                                        <div className="text-gray-500 mb-1">Số giao dịch</div>
                                        <div className="font-bold text-gray-900 text-base">{selectedSuggestion.currentSpending?.count || 0}</div>
                                    </div>
                                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                                        <div className="text-gray-500 mb-1">Trung bình/giao dịch</div>
                                        <div className="font-bold text-gray-900 text-base">{formatCurrency(selectedSuggestion.currentSpending?.avgPerTransaction || 0)}</div>
                                    </div>
                                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                                        <div className="text-gray-500 mb-1">% tổng chi</div>
                                        <div className="font-bold text-gray-900 text-base">{selectedSuggestion.currentSpending?.percentageOfTotal?.toFixed(1) || 0}%</div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                                <div className="font-bold text-lg mb-4 text-gray-900">Gợi ý tiết kiệm</div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                                        <span className="text-gray-700 font-medium">Giảm</span>
                                        <span className="font-bold text-red-600">{selectedSuggestion.suggestion?.reductionPercent || 0}%</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-white rounded-lg border-2 border-green-300">
                                        <span className="text-gray-700 font-medium">Có thể tiết kiệm</span>
                                        <span className="font-extrabold text-green-600 text-lg">{formatCurrency(selectedSuggestion.suggestion?.potentialSavings || 0)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                                        <span className="text-gray-700 font-medium">Số tiền mới đề xuất</span>
                                        <span className="font-bold text-gray-900">{formatCurrency(selectedSuggestion.suggestion?.suggestedNewAmount || 0)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                                <div className="font-bold text-lg mb-2 text-gray-900">Lý do</div>
                                <div className="text-sm text-gray-700 leading-relaxed bg-white p-3 rounded-lg border border-gray-200">
                                    {selectedSuggestion.suggestion?.reason || "Để tối ưu chi tiêu và đạt mục tiêu tiết kiệm"}
                                </div>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </div>
    );
};

export default AnalyticsPrescriptive;
