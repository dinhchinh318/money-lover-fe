import { useState, useEffect } from "react";
import { Card, Tabs, Spin, message, Badge, Alert } from "antd";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import {
    predictMonthEndExpense7DaysAPI,
    predictMonthEndExpense30DaysAPI,
    predictMonthEndExpenseTrendAPI,
    predictBudgetOverrunAPI,
    predictCategorySpendingAPI,
} from "../../../services/api.analytics";
import dayjs from "dayjs";

const AnalyticsPredictive = () => {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("month-end");

    // Tab 1: Dự đoán chi tiêu cuối tháng
    const [prediction7Days, setPrediction7Days] = useState(null);
    const [prediction30Days, setPrediction30Days] = useState(null);
    const [predictionTrend, setPredictionTrend] = useState([]);

    // Tab 2: Dự đoán vượt ngân sách
    const [budgetOverruns, setBudgetOverruns] = useState([]);

    // Tab 3: Dự đoán theo danh mục
    const [categoryPredictions, setCategoryPredictions] = useState([]);

    useEffect(() => {
        loadTabData(activeTab);
    }, [activeTab]);

    const loadTabData = async (tab) => {
        setLoading(true);
        try {
            switch (tab) {
                case "month-end":
                    await loadMonthEndData();
                    break;
                case "budget":
                    await loadBudgetData();
                    break;
                case "category":
                    await loadCategoryData();
                    break;
            }
        } catch (error) {
            console.error("Error loading predictive data:", error);
            message.error("Có lỗi xảy ra khi tải dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    const loadMonthEndData = async () => {
        const [res7, res30, resTrend] = await Promise.all([
            predictMonthEndExpense7DaysAPI(),
            predictMonthEndExpense30DaysAPI(),
            predictMonthEndExpenseTrendAPI(),
        ]);

        if (res7?.EC === 0) setPrediction7Days(res7.data);
        if (res30?.EC === 0) setPrediction30Days(res30.data);
        if (resTrend?.EC === 0) setPredictionTrend(resTrend.data || []);
    };

    const loadBudgetData = async () => {
        const res = await predictBudgetOverrunAPI();
        if (res?.EC === 0) setBudgetOverruns(res.data || []);
    };

    const loadCategoryData = async () => {
        const res = await predictCategorySpendingAPI();
        if (res?.EC === 0) setCategoryPredictions(res.data || []);
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(value || 0);
    };

    const tabItems = [
        {
            key: "month-end",
            label: "Dự đoán chi tiêu cuối tháng",
            children: (
                <div className="space-y-6">
                    {/* Prediction Methods Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="shadow-sm border-l-4 border-l-blue-500">
                            <div className="text-sm text-gray-600 mb-2">Phương pháp 7 ngày</div>
                            <div className="text-2xl font-bold text-blue-600">
                                {prediction7Days
                                    ? formatCurrency(prediction7Days.predictedAmount)
                                    : "Đang tính..."}
                            </div>
                            <div className="text-xs text-gray-500 mt-2">
                                Độ chính xác: {prediction7Days?.accuracy || 0}%
                            </div>
                        </Card>
                        <Card className="shadow-sm border-l-4 border-l-green-500">
                            <div className="text-sm text-gray-600 mb-2">Phương pháp 30 ngày</div>
                            <div className="text-2xl font-bold text-green-600">
                                {prediction30Days
                                    ? formatCurrency(prediction30Days.predictedAmount)
                                    : "Đang tính..."}
                            </div>
                            <div className="text-xs text-gray-500 mt-2">
                                Độ chính xác: {prediction30Days?.accuracy || 0}%
                            </div>
                        </Card>
                        <Card className="shadow-sm border-l-4 border-l-purple-500">
                            <div className="text-sm text-gray-600 mb-2">Phương pháp xu hướng</div>
                            <div className="text-2xl font-bold text-purple-600">
                                {predictionTrend.length > 0
                                    ? formatCurrency(
                                          predictionTrend[predictionTrend.length - 1]?.predicted || 0
                                      )
                                    : "Đang tính..."}
                            </div>
                            <div className="text-xs text-gray-500 mt-2">Dựa trên xu hướng</div>
                        </Card>
                    </div>

                    {/* Trend Chart */}
                    {predictionTrend.length > 0 && (
                        <Card title="Biểu đồ dự đoán xu hướng" className="shadow-sm">
                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart data={predictionTrend}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                    <XAxis dataKey="date" stroke="#6B7280" />
                                    <YAxis stroke="#6B7280" />
                                    <Tooltip formatter={(value) => formatCurrency(value)} />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="actual"
                                        name="Thực tế"
                                        stroke="#10B981"
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="predicted"
                                        name="Dự đoán"
                                        stroke="#3B82F6"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        dot={{ r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </Card>
                    )}
                </div>
            ),
        },
        {
            key: "budget",
            label: "Dự đoán vượt ngân sách",
            children: (
                <div className="space-y-6">
                    {/* Budget Overrun List */}
                    <div className="space-y-4">
                        {budgetOverruns.map((budget, index) => (
                            <Card
                                key={index}
                                className={`shadow-sm ${
                                    budget.riskLevel === "high"
                                        ? "border-l-4 border-l-red-500 bg-red-50"
                                        : budget.riskLevel === "medium"
                                        ? "border-l-4 border-l-yellow-500 bg-yellow-50"
                                        : "border-l-4 border-l-green-500 bg-green-50"
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-semibold text-lg">
                                                {budget.budgetName}
                                            </span>
                                            <Badge
                                                count={
                                                    budget.riskLevel === "high"
                                                        ? "Nguy hiểm"
                                                        : budget.riskLevel === "medium"
                                                        ? "Cảnh báo"
                                                        : "An toàn"
                                                }
                                                style={{
                                                    backgroundColor:
                                                        budget.riskLevel === "high"
                                                            ? "#EF4444"
                                                            : budget.riskLevel === "medium"
                                                            ? "#F59E0B"
                                                            : "#10B981",
                                                }}
                                            />
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Danh mục: {budget.categoryName}
                                        </div>
                                        <div className="mt-2">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>Hạn mức:</span>
                                                <span className="font-semibold">
                                                    {formatCurrency(budget.limitAmount)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>Đã chi:</span>
                                                <span className="font-semibold text-red-600">
                                                    {formatCurrency(budget.currentSpent)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>Dự đoán cuối kỳ:</span>
                                                <span className="font-semibold text-orange-600">
                                                    {formatCurrency(budget.predictedAmount)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Timeline Chart */}
                    {budgetOverruns.length > 0 && (
                        <Card title="Biểu đồ dự đoán vượt ngân sách" className="shadow-sm">
                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart data={budgetOverruns}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                    <XAxis dataKey="budgetName" stroke="#6B7280" />
                                    <YAxis stroke="#6B7280" />
                                    <Tooltip formatter={(value) => formatCurrency(value)} />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="limitAmount"
                                        name="Hạn mức"
                                        stroke="#3B82F6"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="currentSpent"
                                        name="Đã chi"
                                        stroke="#10B981"
                                        strokeWidth={2}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="predictedAmount"
                                        name="Dự đoán"
                                        stroke="#EF4444"
                                        strokeWidth={2}
                                        strokeDasharray="3 3"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </Card>
                    )}
                </div>
            ),
        },
        {
            key: "category",
            label: "Dự đoán theo danh mục",
            children: (
                <div className="space-y-6">
                    <Card title="Dự đoán chi tiêu theo danh mục" className="shadow-sm">
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={categoryPredictions}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                <XAxis dataKey="categoryName" stroke="#6B7280" />
                                <YAxis stroke="#6B7280" />
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                                <Legend />
                                <Bar dataKey="currentAmount" name="Hiện tại" fill="#10B981" />
                                <Bar dataKey="predictedAmount" name="Dự đoán" fill="#3B82F6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categoryPredictions.map((item, index) => (
                            <Card key={index} size="small" className="shadow-sm">
                                <div className="font-semibold mb-2">{item.categoryName}</div>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Hiện tại:</span>
                                        <span className="font-semibold text-green-600">
                                            {formatCurrency(item.currentAmount)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Dự đoán:</span>
                                        <span className="font-semibold text-blue-600">
                                            {formatCurrency(item.predictedAmount)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Thay đổi:</span>
                                        <span
                                            className={`font-semibold ${
                                                item.changePercentage > 0
                                                    ? "text-red-600"
                                                    : "text-green-600"
                                            }`}
                                        >
                                            {item.changePercentage > 0 ? "+" : ""}
                                            {item.changePercentage?.toFixed(1) || 0}%
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            ),
        },
    ];

    return (
        <div className="max-w-7xl mx-auto p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Dự đoán Tài chính (Predictive Analytics)
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Dự đoán chi tiêu và nguy cơ vượt ngân sách
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

export default AnalyticsPredictive;

