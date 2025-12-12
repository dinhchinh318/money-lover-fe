import { useState, useEffect } from "react";
import { Card, Tabs, Spin, message, Badge, Button, Select, List, Avatar } from "antd";
import {
    suggestOptimizeSpendingAPI,
    suggestBudgetAdjustmentAPI,
    suggestWalletTransferAPI,
    getAlertHistoryAPI,
    markAlertAsReadAPI,
} from "../../../services/api.analytics";
import { BellOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Option } = Select;

const AnalyticsPrescriptive = () => {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("optimize");

    // Tab 1: Gợi ý tối ưu
    const [optimizeSuggestions, setOptimizeSuggestions] = useState([]);
    const [budgetSuggestions, setBudgetSuggestions] = useState([]);
    const [totalSavings, setTotalSavings] = useState(0);

    // Tab 2: Khuyến nghị chuyển tiền
    const [transferSuggestions, setTransferSuggestions] = useState([]);

    // Tab 3: Cảnh báo thông minh
    const [alerts, setAlerts] = useState([]);
    const [alertFilter, setAlertFilter] = useState("all");
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        loadTabData(activeTab);
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === "alerts") {
            loadAlerts();
        }
    }, [alertFilter]);

    const loadTabData = async (tab) => {
        setLoading(true);
        try {
            switch (tab) {
                case "optimize":
                    await loadOptimizeData();
                    break;
                case "transfer":
                    await loadTransferData();
                    break;
                case "alerts":
                    await loadAlerts();
                    break;
            }
        } catch (error) {
            console.error("Error loading prescriptive data:", error);
            message.error("Có lỗi xảy ra khi tải dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    const loadOptimizeData = async () => {
        const [optRes, budgetRes] = await Promise.all([
            suggestOptimizeSpendingAPI(),
            suggestBudgetAdjustmentAPI(),
        ]);

        if (optRes?.EC === 0) {
            const suggestions = optRes.data || [];
            setOptimizeSuggestions(suggestions);
            setTotalSavings(
                suggestions.reduce((sum, item) => sum + (item.potentialSavings || 0), 0)
            );
        }

        if (budgetRes?.EC === 0) {
            setBudgetSuggestions(budgetRes.data || []);
        }
    };

    const loadTransferData = async () => {
        const res = await suggestWalletTransferAPI();
        if (res?.EC === 0) {
            setTransferSuggestions(res.data || []);
        }
    };

    const loadAlerts = async () => {
        const params = alertFilter !== "all" ? { status: alertFilter } : {};
        const res = await getAlertHistoryAPI(params);
        if (res?.EC === 0) {
            const alertData = res.data || [];
            setAlerts(alertData);
            setUnreadCount(alertData.filter((a) => !a.isRead).length);
        }
    };

    const handleMarkAsRead = async (alertId) => {
        try {
            await markAlertAsReadAPI(alertId);
            loadAlerts();
            message.success("Đã đánh dấu đã đọc");
        } catch (error) {
            message.error("Có lỗi xảy ra");
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
                return "Ưu tiên cao";
            case "medium":
                return "Ưu tiên trung bình";
            case "low":
                return "Ưu tiên thấp";
            default:
                return "Không xác định";
        }
    };

    const tabItems = [
        {
            key: "optimize",
            label: "Gợi ý tối ưu",
            children: (
                <div className="space-y-6">
                    {/* Total Savings Card */}
                    <Card className="shadow-sm bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                        <div className="text-center">
                            <div className="text-sm text-gray-600 mb-2">Số tiền có thể tiết kiệm</div>
                            <div className="text-4xl font-bold text-[#10B981]">
                                {formatCurrency(totalSavings)}
                            </div>
                        </div>
                    </Card>

                    {/* Optimize Suggestions */}
                    <Card title="Gợi ý tối ưu chi tiêu" className="shadow-sm">
                        <div className="space-y-4">
                            {optimizeSuggestions.map((suggestion, index) => (
                                <Card
                                    key={index}
                                    size="small"
                                    className="border-l-4"
                                    style={{
                                        borderLeftColor: getPriorityColor(suggestion.priority),
                                    }}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="font-semibold">
                                                    {suggestion.categoryName}
                                                </span>
                                                <Badge
                                                    count={getPriorityText(suggestion.priority)}
                                                    style={{
                                                        backgroundColor: getPriorityColor(
                                                            suggestion.priority
                                                        ),
                                                    }}
                                                />
                                            </div>
                                            <div className="text-sm text-gray-600 mb-2">
                                                {suggestion.reason}
                                            </div>
                                            <div className="text-sm">
                                                <span className="text-gray-600">Có thể tiết kiệm: </span>
                                                <span className="font-semibold text-green-600">
                                                    {formatCurrency(suggestion.potentialSavings)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </Card>

                    {/* Budget Adjustments */}
                    <Card title="Đề xuất điều chỉnh ngân sách" className="shadow-sm">
                        <div className="space-y-3">
                            {budgetSuggestions.map((suggestion, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                                >
                                    <div>
                                        <div className="font-semibold">{suggestion.budgetName}</div>
                                        <div className="text-sm text-gray-600">
                                            Đề xuất: {formatCurrency(suggestion.suggestedAmount)}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {suggestion.reason}
                                        </div>
                                    </div>
                                    <Button
                                        type="primary"
                                        className="bg-[#10B981] hover:bg-[#059669] border-[#10B981]"
                                    >
                                        Áp dụng
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            ),
        },
        {
            key: "transfer",
            label: "Khuyến nghị chuyển tiền",
            children: (
                <div className="space-y-6">
                    <Card title="Khuyến nghị chuyển tiền giữa các ví" className="shadow-sm">
                        <div className="space-y-4">
                            {transferSuggestions.map((suggestion, index) => (
                                <Card
                                    key={index}
                                    size="small"
                                    className="border-l-4 border-l-blue-500"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="font-semibold">
                                                    {suggestion.fromWallet} → {suggestion.toWallet}
                                                </span>
                                                <Badge
                                                    count={getPriorityText(suggestion.priority)}
                                                    style={{
                                                        backgroundColor: getPriorityColor(
                                                            suggestion.priority
                                                        ),
                                                    }}
                                                />
                                            </div>
                                            <div className="text-sm text-gray-600 mb-2">
                                                {suggestion.reason}
                                            </div>
                                            <div className="text-lg font-bold text-blue-600">
                                                {formatCurrency(suggestion.amount)}
                                            </div>
                                        </div>
                                        <Button
                                            type="primary"
                                            className="bg-[#10B981] hover:bg-[#059669] border-[#10B981]"
                                        >
                                            Chuyển ngay
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </Card>
                </div>
            ),
        },
        {
            key: "alerts",
            label: (
                <span>
                    Cảnh báo thông minh
                    {unreadCount > 0 && (
                        <Badge
                            count={unreadCount}
                            style={{ backgroundColor: "#EF4444", marginLeft: 8 }}
                        />
                    )}
                </span>
            ),
            children: (
                <div className="space-y-6">
                    {/* Filter */}
                    <Card className="shadow-sm">
                        <div className="flex items-center gap-4">
                            <span className="text-gray-600">Lọc theo:</span>
                            <Select
                                value={alertFilter}
                                onChange={setAlertFilter}
                                style={{ width: 200 }}
                            >
                                <Option value="all">Tất cả</Option>
                                <Option value="unread">Chưa đọc</Option>
                                <Option value="read">Đã đọc</Option>
                            </Select>
                        </div>
                    </Card>

                    {/* Alerts List */}
                    <Card className="shadow-sm">
                        <List
                            itemLayout="horizontal"
                            dataSource={alerts}
                            renderItem={(alert) => (
                                <List.Item
                                    className={`p-4 rounded-lg mb-2 ${
                                        !alert.isRead ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                                    }`}
                                    actions={[
                                        !alert.isRead && (
                                            <Button
                                                type="link"
                                                onClick={() => handleMarkAsRead(alert._id)}
                                            >
                                                Đánh dấu đã đọc
                                            </Button>
                                        ),
                                    ]}
                                >
                                    <List.Item.Meta
                                        avatar={
                                            <Avatar
                                                icon={
                                                    alert.type === "warning" ? (
                                                        <ExclamationCircleOutlined />
                                                    ) : (
                                                        <BellOutlined />
                                                    )
                                                }
                                                style={{
                                                    backgroundColor:
                                                        alert.type === "warning" ? "#F59E0B" : "#10B981",
                                                }}
                                            />
                                        }
                                        title={
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">{alert.title}</span>
                                                <Badge
                                                    count={alert.type === "warning" ? "Cảnh báo" : "Thông báo"}
                                                    style={{
                                                        backgroundColor:
                                                            alert.type === "warning" ? "#F59E0B" : "#10B981",
                                                    }}
                                                />
                                                {alert.isRead && (
                                                    <CheckCircleOutlined className="text-green-500" />
                                                )}
                                            </div>
                                        }
                                        description={
                                            <div>
                                                <div className="mb-1">{alert.message}</div>
                                                <div className="text-xs text-gray-500">
                                                    {dayjs(alert.createdAt).format("DD/MM/YYYY HH:mm")}
                                                </div>
                                            </div>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    </Card>
                </div>
            ),
        },
    ];

    return (
        <div className="max-w-7xl mx-auto p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Khuyến nghị Hành động (Prescriptive Analytics)
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
                    <Card className="shadow-sm">
                        <Tabs
                            activeKey={activeTab}
                            onChange={setActiveTab}
                            items={tabItems}
                            size="large"
                        />
                    </Card>
                )}
        </div>
    );
};

export default AnalyticsPrescriptive;

