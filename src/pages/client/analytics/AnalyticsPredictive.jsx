import { useState, useEffect } from "react";
import { Card, Spin, message, Badge, Progress, Alert } from "antd";
import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Area,
    AreaChart,
} from "recharts";
import {
    predictMonthEndExpense7DaysAPI,
    predictMonthEndExpense30DaysAPI,
    predictMonthEndExpenseTrendAPI,
    predictBudgetOverrunAPI,
    predictCategorySpendingAPI,
} from "../../../services/api.analytics";
import dayjs from "dayjs";
import DateRangePicker from "../../../components/common/DateRangePicker";
import { useNavigate } from "react-router-dom";

const AnalyticsPredictive = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState([
        dayjs().startOf("month"),
        dayjs().endOf("month"),
    ]);

    // Section A: Dự đoán chi tiêu cuối tháng
    const [prediction7Days, setPrediction7Days] = useState(null);
    const [prediction30Days, setPrediction30Days] = useState(null);
    const [predictionTrend, setPredictionTrend] = useState(null);
    const [monthlyChartData, setMonthlyChartData] = useState([]);
    const [sparkline7Days, setSparkline7Days] = useState([]);
    const [sparkline30Days, setSparkline30Days] = useState([]);
    const [sparklineTrend, setSparklineTrend] = useState([]);

    // Section B: Dự đoán vượt ngân sách
    const [budgetOverruns, setBudgetOverruns] = useState([]);
    const [budgetChartData, setBudgetChartData] = useState([]);

    // Section C: Dự đoán theo danh mục
    const [categoryPredictions, setCategoryPredictions] = useState([]);

    useEffect(() => {
        loadAllData();
    }, [dateRange]);

    const loadAllData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadMonthEndData(),
                loadBudgetData(),
                loadCategoryData(),
            ]);
        } catch (error) {
            console.error("Error loading predictive data:", error);
            message.error("Có lỗi xảy ra khi tải dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    const loadMonthEndData = async () => {
        try {
            const [res7, res30, resTrend] = await Promise.all([
                predictMonthEndExpense7DaysAPI(),
                predictMonthEndExpense30DaysAPI(),
                predictMonthEndExpenseTrendAPI(),
            ]);

            console.log("=== MONTH END PREDICTIONS DEBUG ===");
            console.log("Response 7 Days:", JSON.stringify(res7, null, 2));
            console.log("Response 30 Days:", JSON.stringify(res30, null, 2));
            console.log("Response Trend:", JSON.stringify(resTrend, null, 2));

            // Xử lý response 7 ngày
            if (res7?.status === true) {
                const data = res7.data || res7;
                console.log("7 Days Data:", data);
                setPrediction7Days(data);
                
                // Tạo sparkline data từ dữ liệu 7 ngày
                const avgPerDay = data.last7Days?.avgPerDay || data.currentMonth?.avgPerDay || 0;
                console.log("7 Days avgPerDay:", avgPerDay);
                if (avgPerDay > 0) {
                    const sparkData = generateSparklineFromData(avgPerDay, 5);
                    setSparkline7Days(sparkData);
                } else {
                    // Nếu không có dữ liệu, tạo sparkline mặc định
                    setSparkline7Days(generateSparklineFromData(100000, 5));
                }
            } else {
                console.warn("7 days prediction failed:", res7);
                setPrediction7Days(null);
            }
            
            // Xử lý response 30 ngày
            if (res30?.status === true) {
                const data = res30.data || res30;
                console.log("30 Days Data:", data);
                setPrediction30Days(data);
                
                // Tạo sparkline data từ dữ liệu 30 ngày
                const avgPerDay = data.last30Days?.avgPerDay || data.currentMonth?.avgPerDay || 0;
                console.log("30 Days avgPerDay:", avgPerDay);
                if (avgPerDay > 0) {
                    const sparkData = generateSparklineFromData(avgPerDay, 5);
                    setSparkline30Days(sparkData);
                } else {
                    setSparkline30Days(generateSparklineFromData(100000, 5));
                }
            } else {
                console.warn("30 days prediction failed:", res30);
                setPrediction30Days(null);
            }
            
            // Xử lý response xu hướng
            if (resTrend?.status === true) {
                const data = resTrend.data || resTrend;
                console.log("Trend Data:", data);
                setPredictionTrend(data);
                
                // Tạo sparkline data từ xu hướng
                const trendValue = data.trend?.dailyTrend || 0;
                const baseValue = data.currentMonth?.avgPerDay || 0;
                console.log("Trend baseValue:", baseValue, "trendValue:", trendValue);
                
                if (baseValue > 0) {
                    const sparkData = generateTrendSparkline(baseValue, trendValue, 5);
                    setSparklineTrend(sparkData);
                } else {
                    setSparklineTrend(generateSparklineFromData(100000, 5));
                }
                
                // Tạo dữ liệu cho biểu đồ tháng
                const now = new Date();
                const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                const daysPassed = data.currentMonth?.daysPassed || now.getDate();
                const currentTotal = data.currentMonth?.total || 0;
                const predictedMonthEnd = data.prediction?.predictedMonthEnd || currentTotal;
                
                console.log("Chart data:", { daysPassed, currentTotal, predictedMonthEnd, daysInMonth });
                
                // Tạo dữ liệu cho từng ngày
                const chartData = [];
                const avgDaily = daysPassed > 0 ? currentTotal / daysPassed : 0;
                const daysRemaining = Math.max(1, daysInMonth - daysPassed);
                const predictedDaily = daysRemaining > 0 ? (predictedMonthEnd - currentTotal) / daysRemaining : 0;
                
                for (let day = 1; day <= daysInMonth; day++) {
                    if (day <= daysPassed) {
                        // Chi tiêu thực tế (tính tích lũy)
                        const actualAmount = daysPassed > 0 ? (day / daysPassed) * currentTotal : 0;
                        chartData.push({
                            day,
                            actual: actualAmount,
                            predicted: null,
                        });
                    } else {
                        // Dự đoán (tính tích lũy)
                        const predictedAmount = currentTotal + (day - daysPassed) * predictedDaily;
                        chartData.push({
                            day,
                            actual: day === daysPassed ? currentTotal : null,
                            predicted: predictedAmount,
                        });
                    }
                }
                console.log("Generated chart data length:", chartData.length);
                setMonthlyChartData(chartData);
            } else {
                console.warn("Trend prediction failed:", resTrend);
                setPredictionTrend(null);
            }
        } catch (error) {
            console.error("Error loading month end data:", error);
            console.error("Error details:", error.response || error.message);
            message.error("Lỗi khi tải dữ liệu dự đoán chi tiêu");
        }
    };

    const loadBudgetData = async () => {
        try {
            const res = await predictBudgetOverrunAPI();
            console.log("Budget Overrun Response:", res);
            
            if (res?.status === true && res?.data) {
                const predictions = res.data.predictions || res.data || [];
                console.log("Budget predictions:", predictions);
                setBudgetOverruns(Array.isArray(predictions) ? predictions : []);

                // Tạo dữ liệu cho biểu đồ budget
                if (predictions.length > 0) {
                    const chartData = [];
                    const now = new Date();
                    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                    
                    predictions.forEach((budget) => {
                        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                        const daysPassed = Math.floor((now - currentMonthStart) / (1000 * 60 * 60 * 24)) + 1;
                        const dailySpending = daysPassed > 0 ? budget.spent / daysPassed : 0;
                        
                        for (let day = 1; day <= daysInMonth; day++) {
                            chartData.push({
                                day,
                                category: budget.category?.name || budget.budgetName,
                                limit: budget.limit,
                                actual: day <= daysPassed ? dailySpending * day : null,
                                predicted: dailySpending * day,
                            });
                        }
                    });
                    setBudgetChartData(chartData);
                }
            } else {
                console.warn("Budget overrun error:", res);
                setBudgetOverruns([]);
            }
        } catch (error) {
            console.error("Error loading budget data:", error);
            setBudgetOverruns([]);
        }
    };

    const loadCategoryData = async () => {
        try {
            const res = await predictCategorySpendingAPI({ days: 30 });
            console.log("Category Spending Response:", res);
            
            if (res?.status === true && res?.data) {
                const predictions = res.data.predictions || res.data || [];
                console.log("Category predictions:", predictions);
                setCategoryPredictions(Array.isArray(predictions) ? predictions : []);
            } else {
                console.warn("Category spending error:", res);
                setCategoryPredictions([]);
            }
        } catch (error) {
            console.error("Error loading category data:", error);
            setCategoryPredictions([]);
        }
    };

    // Tạo sparkline data từ giá trị trung bình
    const generateSparklineFromData = (avgValue, points) => {
        return Array.from({ length: points }, (_, i) => ({
            week: i + 1,
            value: avgValue * (0.8 + Math.random() * 0.4), // Biến thiên ±20%
        }));
    };

    // Tạo sparkline data từ xu hướng
    const generateTrendSparkline = (baseValue, trendValue, points) => {
        return Array.from({ length: points }, (_, i) => ({
            week: i + 1,
            value: baseValue + (trendValue * i) + (Math.random() * baseValue * 0.1),
        }));
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(value || 0);
    };

    // Custom tooltip cho biểu đồ A2 với thông tin chi tiết
    const CustomChartTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const actualData = payload.find(p => p.dataKey === "actual");
            const predictedData = payload.find(p => p.dataKey === "predicted");
            
            return (
                <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg min-w-[200px]">
                    <p className="font-semibold text-gray-800 mb-2">Ngày {label}</p>
                    {actualData && actualData.value !== null && (
                        <div className="mb-2">
                            <p className="text-sm text-gray-600 mb-1">Chi tiêu thực tế (VND):</p>
                            <p className="text-lg font-bold text-blue-600">
                                {formatCurrency(actualData.value)}
                            </p>
                        </div>
                    )}
                    {predictedData && predictedData.value !== null && (
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Chi tiêu tích lũy (Dự đoán):</p>
                            <p className="text-lg font-bold text-orange-600">
                                {formatCurrency(predictedData.value)}
                            </p>
                            {label > new Date().getDate() && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Dự kiến đạt mốc này vào ngày {label}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    // Xử lý click vào cảnh báo ngân sách
    const handleBudgetAlertClick = (budget) => {
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        
        // Navigate đến trang transactions với filter theo category và tháng
        const categoryId = budget.category?.id || budget.categoryId;
        navigate(`/transactions?startDate=${dayjs(currentMonthStart).format("YYYY-MM-DD")}&endDate=${dayjs(currentMonthEnd).format("YYYY-MM-DD")}&categoryId=${categoryId}&type=expense`);
    };

    const getDaysRemaining = () => {
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const daysPassed = now.getDate();
        return daysInMonth - daysPassed;
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    Dự đoán chi tiêu cuối tháng
                </h1>
                <p className="text-gray-600 mt-1">
                    Dự đoán chi tiêu và nguy cơ vượt ngân sách
                </p>
            </div>

            {/* Date Range Picker */}
            <div className="mb-6 flex gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Từ ngày:
                    </label>
                    <DateRangePicker
                        value={dateRange}
                        onChange={setDateRange}
                        format="DD/MM/YYYY"
                        className="w-[280px]"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Spin size="large" />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Section A: Dự đoán chi tiêu cuối tháng */}
                    <div className="lg:col-span-1 space-y-4">
                        <Card title="Dự đoán chi tiêu cuối tháng" className="shadow-sm">
                            {/* A1: Forecast Cards */}
                            <div className="space-y-4 mb-6">
                                {/* Card 7 ngày */}
                                <Card size="small" className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                                    <div className="text-xs text-gray-600 mb-1">
                                        Dựa trên 7 ngày gần nhất
                                    </div>
                                    <div className="text-xl font-bold text-blue-600 mb-2">
                                        {prediction7Days?.prediction?.predictedMonthEnd !== undefined && prediction7Days.prediction.predictedMonthEnd !== null
                                            ? formatCurrency(prediction7Days.prediction.predictedMonthEnd)
                                            : prediction7Days === null
                                            ? "Đang tính..."
                                            : formatCurrency(0)}
                                    </div>
                                    <div className="text-xs text-gray-500 mb-2">
                                        {getDaysRemaining()} ngày còn lại
                                    </div>
                                    <ResponsiveContainer width="100%" height={40}>
                                        <LineChart data={sparkline7Days.length > 0 ? sparkline7Days : generateSparklineFromData(500000, 5)}>
                                            <Line
                                                type="monotone"
                                                dataKey="value"
                                                stroke="#3B82F6"
                                                strokeWidth={2}
                                                dot={false}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </Card>

                                {/* Card 30 ngày */}
                                <Card size="small" className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
                                    <div className="text-xs text-gray-600 mb-1">
                                        Dựa trên 30 ngày gần nhất
                                    </div>
                                    <div className="text-xl font-bold text-green-600 mb-2">
                                        {prediction30Days?.prediction?.predictedMonthEnd !== undefined && prediction30Days.prediction.predictedMonthEnd !== null
                                            ? formatCurrency(prediction30Days.prediction.predictedMonthEnd)
                                            : prediction30Days === null
                                            ? "Đang tính..."
                                            : formatCurrency(0)}
                                    </div>
                                    <div className="text-xs text-gray-500 mb-2">
                                        {getDaysRemaining()} ngày còn lại
                                    </div>
                                    <ResponsiveContainer width="100%" height={40}>
                                        <LineChart data={sparkline30Days.length > 0 ? sparkline30Days : generateSparklineFromData(500000, 5)}>
                                            <Line
                                                type="monotone"
                                                dataKey="value"
                                                stroke="#10B981"
                                                strokeWidth={2}
                                                dot={false}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </Card>

                                {/* Card Xu hướng */}
                                <Card size="small" className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="text-xs text-gray-600">
                                            Dựa trên xu hướng
                                        </div>
                                        {predictionTrend?.trend?.direction === "increasing" && (
                                            <Badge
                                                count="Tăng"
                                                style={{ backgroundColor: "#F59E0B" }}
                                            />
                                        )}
                                        {predictionTrend?.trend?.direction === "decreasing" && (
                                            <Badge
                                                count="Giảm"
                                                style={{ backgroundColor: "#10B981" }}
                                            />
                                        )}
                                    </div>
                                    <div className="text-xl font-bold text-purple-600 mb-2">
                                        {predictionTrend?.prediction?.predictedMonthEnd !== undefined && predictionTrend.prediction.predictedMonthEnd !== null
                                            ? formatCurrency(predictionTrend.prediction.predictedMonthEnd)
                                            : predictionTrend === null
                                            ? "Đang tính..."
                                            : formatCurrency(0)}
                                    </div>
                                    <div className="text-xs text-gray-500 mb-2">
                                        {getDaysRemaining()} ngày còn lại
                                    </div>
                                    <ResponsiveContainer width="100%" height={40}>
                                        <LineChart data={sparklineTrend.length > 0 ? sparklineTrend : generateSparklineFromData(500000, 5)}>
                                            <Line
                                                type="monotone"
                                                dataKey="value"
                                                stroke="#8B5CF6"
                                                strokeWidth={2}
                                                strokeDasharray="5 5"
                                                dot={false}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </Card>
                            </div>

                            {/* A2: Biểu đồ Dự đoán Chi tiêu Cuối Tháng */}
                            <div>
                                <div className="text-sm font-semibold text-gray-700 mb-3">
                                    Biểu đồ Dự đoán Chi tiêu Cuối Tháng
                                </div>
                                {monthlyChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <AreaChart data={monthlyChartData}>
                                            <defs>
                                                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                                </linearGradient>
                                                <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2}/>
                                                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                            <XAxis 
                                                dataKey="day" 
                                                stroke="#6B7280"
                                                label={{ value: "Ngày of Month", position: "insideBottom", offset: -5 }}
                                            />
                                            <YAxis 
                                                stroke="#6B7280"
                                                label={{ value: "Số tiền tích lũy (VND)", angle: -90, position: "insideLeft" }}
                                            />
                                            <Tooltip content={<CustomChartTooltip />} />
                                            <Legend />
                                            <Area
                                                type="monotone"
                                                dataKey="actual"
                                                name="Chi tiêu sư thực (VND)"
                                                stroke="#3B82F6"
                                                fill="url(#colorActual)"
                                                strokeWidth={2}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="predicted"
                                                name="Chi tiền tích lũy"
                                                stroke="#F59E0B"
                                                fill="url(#colorPredicted)"
                                                strokeWidth={2}
                                                strokeDasharray="5 5"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-[300px] border border-gray-200 rounded-lg">
                                        <div className="text-sm text-gray-500">
                                            Không có dữ liệu
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Section B: Dự đoán vượt ngân sách */}
                    <div className="lg:col-span-1 space-y-4">
                        <Card title="Dự đoán vượt ngân sách" className="shadow-sm">
                            {/* Warning Banner */}
                            {budgetOverruns.filter(b => b.isAtRisk).length > 0 && (
                                <Alert
                                    message={
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="text-red-600" size={20} />
                                            <span className="font-semibold">
                                                Dự đoán budget at risk
                                            </span>
                                        </div>
                                    }
                                    description={`${budgetOverruns.filter(b => b.isAtRisk).length} ngân sách có nguy cơ vượt`}
                                    type="warning"
                                    showIcon={false}
                                    className="mb-4"
                                />
                            )}

                            {/* Category Overrun Details */}
                            <div className="space-y-3 mb-4">
                                {budgetOverruns.length > 0 ? (
                                    budgetOverruns.map((budget, index) => {
                                        const usagePercent = budget.usagePercent || 0;
                                        const overrun = budget.prediction?.predictedOverrun || 0;
                                        const isAtRisk = budget.isAtRisk || usagePercent >= 70;
                                        
                                        return (
                                            <div
                                                key={index}
                                                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                                                    isAtRisk 
                                                        ? "bg-red-50 border-red-200 hover:bg-red-100" 
                                                        : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                                                }`}
                                                onClick={() => handleBudgetAlertClick(budget)}
                                                title="Click để xem chi tiết giao dịch"
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-semibold text-sm">
                                                        {budget.category?.name || budget.budgetName}
                                                    </span>
                                                    <span className={`text-xs font-bold ${
                                                        overrun > 0 ? "text-red-600" : "text-gray-600"
                                                    }`}>
                                                        {overrun > 0 ? "-" : ""}{formatCurrency(Math.abs(overrun))}
                                                    </span>
                                                </div>
                                                <Progress
                                                    percent={Math.min(usagePercent, 100)}
                                                    status={isAtRisk ? "exception" : "normal"}
                                                    strokeColor={isAtRisk ? "#EF4444" : usagePercent >= 50 ? "#F59E0B" : "#10B981"}
                                                    showInfo={false}
                                                    className="mb-1"
                                                />
                                                <div className="text-xs text-gray-500">
                                                    {budget.prediction?.daysUntilOverrun 
                                                        ? `Hỏi ${budget.prediction.daysUntilOverrun} ngày`
                                                        : "An toàn"}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-sm text-gray-500 text-center py-4">
                                        Không có ngân sách nào
                                    </div>
                                )}
                            </div>

                            {/* Budget Limit Chart */}
                            {budgetChartData.length > 0 && (
                                <div>
                                    <div className="text-sm font-semibold text-gray-700 mb-3">
                                        Biểu đồ Ngân sách
                                    </div>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <LineChart data={budgetChartData.slice(0, 30)}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                            <XAxis dataKey="day" stroke="#6B7280" />
                                            <YAxis stroke="#6B7280" />
                                            <Tooltip formatter={(value) => formatCurrency(value)} />
                                            <Legend />
                                            <Line
                                                type="monotone"
                                                dataKey="limit"
                                                name="Số ngắt limit"
                                                stroke="#EF4444"
                                                strokeWidth={2}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="actual"
                                                name="Thực tế"
                                                stroke="#3B82F6"
                                                strokeWidth={2}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="predicted"
                                                name="Dự đoán"
                                                stroke="#F59E0B"
                                                strokeWidth={2}
                                                strokeDasharray="5 5"
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Section C: Dự đoán theo danh mục */}
                    <div className="lg:col-span-1 space-y-4">
                        <Card title="Dự đoán theo danh mục" className="shadow-sm">
                            <div className="space-y-4">
                                {categoryPredictions.length > 0 ? (
                                    categoryPredictions.map((category, index) => {
                                        const trend = category.prediction?.trendDirection || "stable";
                                        const nextWeek = category.prediction?.nextWeek || 0;
                                        const historical = category.historical?.avgPerWeek || 0;
                                        
                                        // Tạo sparkline data với cả phần thực tế và dự đoán
                                        const baseValue = historical || nextWeek * 0.8;
                                        const sparklineData = Array.from({ length: 4 }, (_, i) => {
                                            const actualValue = baseValue * (0.9 + (i * 0.1) + Math.random() * 0.1);
                                            const predictedValue = i === 3 ? nextWeek : null; // Chỉ điểm cuối có dự đoán
                                            return {
                                                period: i + 1,
                                                actual: actualValue,
                                                predicted: predictedValue,
                                            };
                                        });
                                        
                                        return (
                                            <Card
                                                key={index}
                                                size="small"
                                                className="border border-gray-200 hover:shadow-md transition-shadow"
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-semibold text-sm">
                                                        {category.categoryName}
                                                    </span>
                                                    {trend === "increasing" && (
                                                        <Badge
                                                            count="Tăng"
                                                            style={{ backgroundColor: "#F59E0B" }}
                                                        />
                                                    )}
                                                    {trend === "decreasing" && (
                                                        <Badge
                                                            count="Giảm"
                                                            style={{ backgroundColor: "#10B981" }}
                                                        />
                                                    )}
                                                </div>
                                                <div className="text-lg font-bold text-gray-900 mb-2">
                                                    {formatCurrency(nextWeek)}
                                                </div>
                                                <ResponsiveContainer width="100%" height={50}>
                                                    <LineChart data={sparklineData}>
                                                        <Line
                                                            type="monotone"
                                                            dataKey="actual"
                                                            stroke="#3B82F6"
                                                            strokeWidth={2}
                                                            dot={false}
                                                        />
                                                        <Line
                                                            type="monotone"
                                                            dataKey="predicted"
                                                            stroke="#F59E0B"
                                                            strokeWidth={2}
                                                            strokeDasharray="5 5"
                                                            dot={{ r: 3, fill: "#F59E0B" }}
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                                <div className="text-xs text-gray-500 mt-1 flex justify-between">
                                                    <span>4 tháng</span>
                                                    <span>2 tháng</span>
                                                    <span>3 tuần</span>
                                                    <span>4 tuần</span>
                                                </div>
                                            </Card>
                                        );
                                    })
                                ) : (
                                    <div className="text-sm text-gray-500 text-center py-4">
                                        Không có dữ liệu
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalyticsPredictive;
