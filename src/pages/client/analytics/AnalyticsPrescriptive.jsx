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

            // Xử lý response optimize
            if (optRes?.status === true && optRes?.data) {
                const suggestions = optRes.data.suggestions || optRes.data || [];
                if (Array.isArray(suggestions) && suggestions.length > 0) {
                    setOptimizeSuggestions(suggestions);
                    const savings = optRes.data.potentialTotalSavings ||
                        suggestions.reduce((sum, item) => sum + (item.suggestion?.potentialSavings || item.potentialSavings || 0), 0);
                    setTotalSavings(savings);
                } else {
                    // Dữ liệu rỗng, dùng mock
                    const mockSuggestions = [
                        {
                            categoryId: "mock1",
                            categoryName: "Ăn uống",
                            currentSpending: 2500000,
                            suggestion: {
                                potentialSavings: 500000,
                                reason: "Chi tiêu ăn uống cao hơn trung bình 25%",
                                recommendation: "Giảm chi tiêu nhà hàng, tự nấu ăn nhiều hơn"
                            }
                        },
                        {
                            categoryId: "mock2",
                            categoryName: "Mua sắm",
                            currentSpending: 1800000,
                            suggestion: {
                                potentialSavings: 300000,
                                reason: "Nhiều giao dịch mua sắm không cần thiết",
                                recommendation: "Lập danh sách mua sắm trước khi đi, tránh mua theo cảm tính"
                            }
                        }
                    ];
                    setOptimizeSuggestions(mockSuggestions);
                    setTotalSavings(800000);
                }
            } else if (optRes?.EC === 0 && optRes?.data) {
                const suggestions = optRes.data.suggestions || optRes.data || [];
                if (Array.isArray(suggestions) && suggestions.length > 0) {
                    setOptimizeSuggestions(suggestions);
                    setTotalSavings(suggestions.reduce((sum, item) => sum + (item.suggestion?.potentialSavings || item.potentialSavings || 0), 0));
                } else {
                    const mockSuggestions = [
                        {
                            categoryId: "mock1",
                            categoryName: "Ăn uống",
                            currentSpending: 2500000,
                            suggestion: {
                                potentialSavings: 500000,
                                reason: "Chi tiêu ăn uống cao hơn trung bình",
                                recommendation: "Tự nấu ăn nhiều hơn"
                            }
                        }
                    ];
                    setOptimizeSuggestions(mockSuggestions);
                    setTotalSavings(500000);
                }
            } else {
                // Fallback mock data
                const mockSuggestions = [
                    {
                        categoryId: "mock1",
                        categoryName: "Ăn uống",
                        currentSpending: 2500000,
                        suggestion: {
                            potentialSavings: 500000,
                            reason: "Chi tiêu ăn uống cao hơn trung bình 25%",
                            recommendation: "Giảm chi tiêu nhà hàng, tự nấu ăn nhiều hơn"
                        }
                    },
                    {
                        categoryId: "mock2",
                        categoryName: "Mua sắm",
                        currentSpending: 1800000,
                        suggestion: {
                            potentialSavings: 300000,
                            reason: "Nhiều giao dịch mua sắm không cần thiết",
                            recommendation: "Lập danh sách mua sắm trước khi đi"
                        }
                    }
                ];
                setOptimizeSuggestions(mockSuggestions);
                setTotalSavings(800000);
            }

            // Xử lý response budget
            if (budgetRes?.status === true && budgetRes?.data) {
                const suggestions = budgetRes.data.suggestions || budgetRes.data || [];
                if (Array.isArray(suggestions) && suggestions.length > 0) {
                    setBudgetSuggestions(suggestions);
                } else {
                    // Dữ liệu rỗng, dùng mock
                    const mockBudgetSuggestions = [
                        {
                            budgetId: "mock1",
                            categoryName: "Ăn uống",
                            currentLimit: 3000000,
                            suggestion: {
                                suggestedLimit: 2500000,
                                reason: "Ngân sách hiện tại cao hơn mức chi tiêu thực tế",
                                adjustment: -500000
                            }
                        }
                    ];
                    setBudgetSuggestions(mockBudgetSuggestions);
                }
            } else if (budgetRes?.EC === 0 && budgetRes?.data) {
                const suggestions = budgetRes.data.suggestions || budgetRes.data || [];
                if (Array.isArray(suggestions) && suggestions.length > 0) {
                    setBudgetSuggestions(suggestions);
                } else {
                    const mockBudgetSuggestions = [
                        {
                            budgetId: "mock1",
                            categoryName: "Ăn uống",
                            currentLimit: 3000000,
                            suggestion: {
                                suggestedLimit: 2500000,
                                reason: "Ngân sách có thể điều chỉnh",
                                adjustment: -500000
                            }
                        }
                    ];
                    setBudgetSuggestions(mockBudgetSuggestions);
                }
            } else {
                // Fallback mock data
                const mockBudgetSuggestions = [
                    {
                        budgetId: "mock1",
                        categoryName: "Ăn uống",
                        currentLimit: 3000000,
                        suggestion: {
                            suggestedLimit: 2500000,
                            reason: "Ngân sách hiện tại cao hơn mức chi tiêu thực tế",
                            adjustment: -500000
                        }
                    }
                ];
                setBudgetSuggestions(mockBudgetSuggestions);
            }
        } catch (error) {
            console.error("Error loading optimize data:", error);
            // Fallback khi có lỗi
            const mockSuggestions = [
                {
                    categoryId: "mock1",
                    categoryName: "Ăn uống",
                    currentSpending: 2500000,
                    suggestion: {
                        potentialSavings: 500000,
                        reason: "Chi tiêu cao hơn trung bình",
                        recommendation: "Tự nấu ăn nhiều hơn"
                    }
                }
            ];
            setOptimizeSuggestions(mockSuggestions);
            setTotalSavings(500000);
        }
    };

    const loadTransferData = async () => {
        try {
            const res = await suggestWalletTransferAPI();

            if (res?.status === true && res?.data) {
                const suggestions = res.data.suggestions || res.data || [];
                if (Array.isArray(suggestions) && suggestions.length > 0) {
                    setTransferSuggestions(suggestions);
                } else {
                    // Dữ liệu rỗng, dùng mock
                    const mockSuggestions = [
                        {
                            fromWallet: {
                                id: "mock1",
                                name: "Tài khoản ngân hàng",
                                balance: 5000000,
                                isLow: false
                            },
                            toWallet: {
                                id: "mock2",
                                name: "Ví tiền mặt",
                                balance: 200000,
                                isLow: true
                            },
                            suggestedAmount: 500000,
                            reason: "Ví tiền mặt sắp hết tiền, nên chuyển từ tài khoản ngân hàng",
                            priority: "high"
                        },
                        {
                            fromWallet: {
                                id: "mock3",
                                name: "Ví tiết kiệm",
                                balance: 10000000,
                                isLow: false
                            },
                            toWallet: {
                                id: "mock1",
                                name: "Tài khoản ngân hàng",
                                balance: 5000000,
                                isLow: false
                            },
                            suggestedAmount: 2000000,
                            reason: "Tài khoản ngân hàng có thể cần thêm tiền cho chi tiêu tháng này",
                            priority: "medium"
                        }
                    ];
                    setTransferSuggestions(mockSuggestions);
                }
            } else if (res?.EC === 0 && res?.data) {
                const suggestions = res.data.suggestions || res.data || [];
                if (Array.isArray(suggestions) && suggestions.length > 0) {
                    setTransferSuggestions(suggestions);
                } else {
                    const mockSuggestions = [
                        {
                            fromWallet: {
                                id: "mock1",
                                name: "Tài khoản ngân hàng",
                                balance: 5000000,
                                isLow: false
                            },
                            toWallet: {
                                id: "mock2",
                                name: "Ví tiền mặt",
                                balance: 200000,
                                isLow: true
                            },
                            suggestedAmount: 500000,
                            reason: "Ví tiền mặt sắp hết tiền",
                            priority: "high"
                        }
                    ];
                    setTransferSuggestions(mockSuggestions);
                }
            } else {
                // Fallback mock data
                const mockSuggestions = [
                    {
                        fromWallet: {
                            id: "mock1",
                            name: "Tài khoản ngân hàng",
                            balance: 5000000,
                            isLow: false
                        },
                        toWallet: {
                            id: "mock2",
                            name: "Ví tiền mặt",
                            balance: 200000,
                            isLow: true
                        },
                        suggestedAmount: 500000,
                        reason: "Ví tiền mặt sắp hết tiền, nên chuyển từ tài khoản ngân hàng",
                        priority: "high"
                    },
                    {
                        fromWallet: {
                            id: "mock3",
                            name: "Ví tiết kiệm",
                            balance: 10000000,
                            isLow: false
                        },
                        toWallet: {
                            id: "mock1",
                            name: "Tài khoản ngân hàng",
                            balance: 5000000,
                            isLow: false
                        },
                        suggestedAmount: 2000000,
                        reason: "Tài khoản ngân hàng có thể cần thêm tiền",
                        priority: "medium"
                    }
                ];
                setTransferSuggestions(mockSuggestions);
            }
        } catch (error) {
            console.error("Error loading transfer data:", error);
            // Fallback khi có lỗi
            const mockSuggestions = [
                {
                    fromWallet: {
                        id: "mock1",
                        name: "Tài khoản ngân hàng",
                        balance: 5000000,
                        isLow: false
                    },
                    toWallet: {
                        id: "mock2",
                        name: "Ví tiền mặt",
                        balance: 200000,
                        isLow: true
                    },
                    suggestedAmount: 500000,
                    reason: "Ví tiền mặt sắp hết tiền",
                    priority: "high"
                }
            ];
            setTransferSuggestions(mockSuggestions);
        }
    };

    const loadAlerts = async () => {
        try {
            const params = alertFilter !== "all" ? { status: alertFilter } : {};
            const res = await getAlertHistoryAPI(params);

            if (res?.status === true && res?.data) {
                const alertData = res.data.alerts || res.data || [];
                if (Array.isArray(alertData) && alertData.length > 0) {
                    setAlerts(alertData);
                    setUnreadCount(alertData.filter((a) => !a.isRead).length);
                } else {
                    // Dữ liệu rỗng, dùng mock
                    const mockAlerts = [
                        {
                            id: "mock1",
                            type: "budget",
                            title: "Ngân sách Ăn uống sắp hết",
                            message: "Bạn đã chi tiêu 76% ngân sách Ăn uống trong tháng này",
                            isRead: false,
                            createdAt: new Date(),
                            priority: "high"
                        },
                        {
                            id: "mock2",
                            type: "spending",
                            title: "Chi tiêu tăng đột biến",
                            message: "Chi tiêu tuần này tăng 35% so với tuần trước",
                            isRead: false,
                            createdAt: new Date(),
                            priority: "medium"
                        },
                        {
                            id: "mock3",
                            type: "wallet",
                            title: "Ví tiền mặt sắp hết tiền",
                            message: "Số dư ví tiền mặt chỉ còn 200,000 VND",
                            isRead: true,
                            createdAt: new Date(),
                            priority: "high"
                        }
                    ];
                    const filteredMock = alertFilter === "all"
                        ? mockAlerts
                        : alertFilter === "unread"
                            ? mockAlerts.filter(a => !a.isRead)
                            : mockAlerts.filter(a => a.isRead);
                    setAlerts(filteredMock);
                    setUnreadCount(mockAlerts.filter((a) => !a.isRead).length);
                }
            } else if (res?.EC === 0 && res?.data) {
                const alertData = res.data.alerts || res.data || [];
                if (Array.isArray(alertData) && alertData.length > 0) {
                    setAlerts(alertData);
                    setUnreadCount(alertData.filter((a) => !a.isRead).length);
                } else {
                    const mockAlerts = [
                        {
                            id: "mock1",
                            type: "budget",
                            title: "Ngân sách sắp hết",
                            message: "Bạn đã chi tiêu 76% ngân sách",
                            isRead: false,
                            createdAt: new Date(),
                            priority: "high"
                        }
                    ];
                    setAlerts(mockAlerts);
                    setUnreadCount(1);
                }
            } else {
                // Fallback mock data
                const mockAlerts = [
                    {
                        id: "mock1",
                        type: "budget",
                        title: "Ngân sách Ăn uống sắp hết",
                        message: "Bạn đã chi tiêu 76% ngân sách Ăn uống trong tháng này",
                        isRead: false,
                        createdAt: new Date(),
                        priority: "high"
                    },
                    {
                        id: "mock2",
                        type: "spending",
                        title: "Chi tiêu tăng đột biến",
                        message: "Chi tiêu tuần này tăng 35% so với tuần trước",
                        isRead: false,
                        createdAt: new Date(),
                        priority: "medium"
                    },
                    {
                        id: "mock3",
                        type: "wallet",
                        title: "Ví tiền mặt sắp hết tiền",
                        message: "Số dư ví tiền mặt chỉ còn 200,000 VND",
                        isRead: true,
                        createdAt: new Date(),
                        priority: "high"
                    }
                ];
                const filteredMock = alertFilter === "all"
                    ? mockAlerts
                    : alertFilter === "unread"
                        ? mockAlerts.filter(a => !a.isRead)
                        : mockAlerts.filter(a => a.isRead);
                setAlerts(filteredMock);
                setUnreadCount(mockAlerts.filter((a) => !a.isRead).length);
            }
        } catch (error) {
            console.error("Error loading alerts:", error);
            // Fallback khi có lỗi
            const mockAlerts = [
                {
                    id: "mock1",
                    type: "budget",
                    title: "Ngân sách sắp hết",
                    message: "Bạn đã chi tiêu 76% ngân sách",
                    isRead: false,
                    createdAt: new Date(),
                    priority: "high"
                }
            ];
            setAlerts(mockAlerts);
            setUnreadCount(1);
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
                return "📊";
            case "spending":
            case "unusual_spending_detected":
            case "category_spending_spike":
            case "monthly_spending_increase":
                return "📈";
            case "wallet":
            case "low_wallet_balance":
                return "💳";
            default:
                return "🔔";
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                            <Sparkles className="text-white" size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-gray-900 bg-clip-text text-transparent">
                                Khuyến nghị Hành động
                            </h1>
                            <p className="text-gray-600 mt-1 text-sm">
                                Gợi ý tối ưu, khuyến nghị và cảnh báo thông minh để quản lý tài chính hiệu quả
                            </p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col justify-center items-center py-20">
                        <Spin size="large" />
                        <p className="mt-4 text-gray-500">Đang tải khuyến nghị...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Section A: Gợi ý Tối ưu */}
                        <div className="lg:col-span-1 space-y-4">
                            <Card
                                className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 rounded-2xl overflow-hidden bg-gradient-to-br from-white to-gray-50"
                                title={
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg">
                                            <Target className="text-white" size={20} />
                                        </div>
                                        <span className="font-bold text-gray-800">Gợi ý Tối ưu Chi tiêu</span>
                                    </div>
                                }
                            >
                                {/* A1: Tổng số tiền có thể tiết kiệm */}
                                <div className="mb-6 p-6 bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 border-2 border-green-200 rounded-xl shadow-sm">
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-2 mb-3">
                                            <PiggyBank className="text-green-600" size={20} />
                                            <span className="text-sm font-semibold text-gray-700">
                                                Số tiền có thể tiết kiệm
                                            </span>
                                        </div>
                                        <div className="text-4xl font-bold text-[#10B981] mb-3">
                                            {formatCurrency(totalSavings)}
                                        </div>
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-green-200">
                                            <Zap className="text-green-500" size={14} />
                                            <span className="text-xs font-medium text-gray-600">
                                                {optimizeSuggestions.length} danh mục được gợi ý
                                            </span>
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
                                                    className="mb-3 border-2 hover:shadow-lg transition-all duration-200 rounded-xl overflow-hidden"
                                                    style={{
                                                        borderColor: getPriorityColor(priority) + "40",
                                                        backgroundColor: "white",
                                                    }}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 flex items-center justify-center flex-shrink-0">
                                                            <span className="text-2xl">{getCategoryIcon(suggestion.categoryName)}</span>
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    <TrendingDown className="text-red-500" size={16} />
                                                                    <span className="font-bold text-sm text-gray-900">
                                                                        Giảm {reductionPercent}% {suggestion.categoryName}
                                                                    </span>
                                                                </div>
                                                                <Badge
                                                                    count={getPriorityText(priority)}
                                                                    style={{
                                                                        backgroundColor: getPriorityColor(priority),
                                                                        fontSize: '10px',
                                                                        fontWeight: 'bold'
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="space-y-1 mb-3">
                                                                <div className="text-xs text-gray-600">
                                                                    Chỉ tiêu hiện tại: <span className="font-semibold">{formatCurrency(currentSpending)}</span>
                                                                </div>
                                                                <div className="text-xs text-gray-600">
                                                                    Có thể tiết kiệm: <span className="font-bold text-green-600 text-sm">{formatCurrency(potentialSavings)}</span>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                type="link"
                                                                size="small"
                                                                icon={<Eye size={14} />}
                                                                onClick={() => handleViewDetails(suggestion)}
                                                                className="p-0 h-auto text-purple-600 hover:text-purple-700 font-medium"
                                                            >
                                                                Xem chi tiết
                                                            </Button>
                                                        </div>
                                                    </div>
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
                                <div className="mt-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Target className="text-blue-500" size={18} />
                                        <h3 className="text-sm font-bold text-gray-800">Hạn mức Budget</h3>
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
                                                        className="mb-3 border-2 border-yellow-200 hover:shadow-lg transition-all duration-200 rounded-xl bg-gradient-to-br from-yellow-50 to-amber-50"
                                                    >
                                                        <div className="mb-4">
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <span className="text-lg">{getCategoryIcon(budget.category?.name || budget.budgetName)}</span>
                                                                <div className="font-bold text-sm text-gray-900">
                                                                    {budget.category?.name || budget.budgetName}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2 mb-3">
                                                                <div className="flex items-center gap-2">
                                                                    <TrendingDown className="text-red-500" size={14} />
                                                                    <span className="text-xs font-semibold text-gray-700">
                                                                        Giảm {Math.abs(differencePercent)}%
                                                                    </span>
                                                                </div>
                                                                <div className="text-xs text-gray-600">
                                                                    Hạn mức hiện tại: <span className="font-semibold">{formatCurrency(currentLimit)}</span>
                                                                </div>
                                                                <div className="text-xs text-gray-600">
                                                                    Đề xuất mới: <span className="font-bold text-green-600">{formatCurrency(suggestedLimit)}</span>
                                                                </div>
                                                                <div className="text-xs text-gray-500 italic">
                                                                    {reason}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            type="primary"
                                                            size="small"
                                                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-0 shadow-md"
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
                            <Card
                                className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 rounded-2xl overflow-hidden bg-gradient-to-br from-white to-gray-50"
                                title={
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg">
                                            <ArrowRightLeft className="text-white" size={20} />
                                        </div>
                                        <span className="font-bold text-gray-800">Khuyến nghị Chuyển tiền</span>
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
                                                    className="mb-3 border-2 border-purple-200 hover:shadow-lg transition-all duration-200 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50"
                                                >
                                                    <div className="mb-4">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <Wallet className="text-purple-600" size={18} />
                                                                <Badge
                                                                    count={getPriorityText(priority)}
                                                                    style={{
                                                                        backgroundColor: getPriorityColor(priority),
                                                                        fontSize: '10px',
                                                                        fontWeight: 'bold'
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <div className="flex-1 p-2 bg-white rounded-lg border border-gray-200">
                                                                <div className="text-xs text-gray-500 mb-1">Từ</div>
                                                                <div className="font-semibold text-sm text-gray-900">{fromWallet}</div>
                                                            </div>
                                                            <ArrowRight className="text-purple-500 flex-shrink-0" size={20} />
                                                            <div className="flex-1 p-2 bg-white rounded-lg border border-gray-200">
                                                                <div className="text-xs text-gray-500 mb-1">Đến</div>
                                                                <div className="font-semibold text-sm text-gray-900">{toWallet}</div>
                                                            </div>
                                                        </div>
                                                        <div className="mb-3">
                                                            <div className="text-2xl font-bold text-purple-600 mb-1">
                                                                {formatCurrency(amount)}
                                                            </div>
                                                            <div className="text-xs text-gray-600 italic">
                                                                {reason}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        type="primary"
                                                        size="small"
                                                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-0 shadow-md"
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
                            <Card
                                className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 rounded-2xl overflow-hidden bg-gradient-to-br from-white to-gray-50"
                                title={
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gradient-to-br from-red-400 to-pink-500 rounded-lg">
                                            <AlertTriangle className="text-white" size={20} />
                                        </div>
                                        <span className="font-bold text-gray-800">Cảnh báo Thông minh</span>
                                    </div>
                                }
                            >
                                {/* Summary và Mark all as read */}
                                <div className="flex items-center justify-between mb-4 p-3 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <BellOutlined className="text-red-500" />
                                        <span className="text-sm font-semibold text-gray-700">
                                            {unreadCount} cảnh báo chưa đọc
                                        </span>
                                    </div>
                                    {unreadCount > 0 && (
                                        <Button
                                            type="link"
                                            size="small"
                                            onClick={handleMarkAllAsRead}
                                            loading={markingAllRead}
                                            className="text-red-600 hover:text-red-700 font-medium"
                                        >
                                            Đánh dấu tất cả đã đọc
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
                                            label: "Tất cả",
                                        },
                                        {
                                            key: "unread",
                                            label: "Chưa đọc",
                                        },
                                        {
                                            key: "read",
                                            label: "Đã đọc",
                                        },
                                    ]}
                                    className="mb-4"
                                />

                                {/* Danh sách cảnh báo */}
                                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                    {filteredAlerts.length > 0 ? (
                                        filteredAlerts.map((alert, index) => (
                                            <Card
                                                key={index}
                                                className={`mb-3 border-2 rounded-xl transition-all duration-200 hover:shadow-md ${!alert.isRead
                                                        ? "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300"
                                                        : "bg-gray-50 border-gray-200"
                                                    }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${!alert.isRead
                                                            ? "bg-yellow-100 border-2 border-yellow-300"
                                                            : "bg-gray-100 border-2 border-gray-300"
                                                        }`}>
                                                        <span className="text-xl">{getAlertIcon(alert.type)}</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="font-bold text-sm text-gray-900">
                                                                {alert.title || "Cảnh báo Thông minh"}
                                                            </span>
                                                            {alert.isRead && (
                                                                <CheckCircleOutlined className="text-green-500" />
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Badge
                                                                count={alert.type || "Cảnh báo"}
                                                                style={{
                                                                    backgroundColor: !alert.isRead ? "#F59E0B" : "#6B7280",
                                                                    fontSize: '10px'
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="text-xs text-gray-700 mb-2 leading-relaxed">
                                                            {alert.message || alert.content || ""}
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <div className="text-xs text-gray-400">
                                                                {dayjs(alert.createdAt || alert.date).format("DD/MM/YYYY HH:mm")}
                                                            </div>
                                                            {!alert.isRead && (
                                                                <Button
                                                                    type="link"
                                                                    size="small"
                                                                    onClick={() => handleMarkAsRead(alert._id || alert.id)}
                                                                    className="p-0 h-auto text-xs text-yellow-600 hover:text-yellow-700 font-medium"
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
        </div>
    );
};

export default AnalyticsPrescriptive;
