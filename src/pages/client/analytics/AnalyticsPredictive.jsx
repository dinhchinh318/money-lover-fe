import { useState, useEffect } from "react";
import { Card, Spin, message, Badge, Progress, Alert } from "antd";
import {
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Calendar,
    BarChart3,
    Target,
    Wallet,
    Sparkles,
    Clock,
    TrendingDown as TrendDown
} from "lucide-react";
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

            // Xử lý response 7 ngày - chỉ dùng dữ liệu từ API
            if (res7?.status === true && res7?.data) {
                const data = res7.data;
                const predictedMonthEnd = data.prediction?.predictedMonthEnd || 0;
                const avgPerDay = data.last7Days?.avgPerDay || data.currentMonth?.avgPerDay || 0;

                // Chỉ set nếu có dữ liệu thực sự
                if (predictedMonthEnd > 0 || avgPerDay > 0) {
                    setPrediction7Days(data);
                    if (avgPerDay > 0) {
                        const sparkData = generateSparklineFromData(avgPerDay, 5);
                        setSparkline7Days(sparkData);
                    } else {
                        setSparkline7Days([]);
                    }
                } else {
                    setPrediction7Days(null);
                    setSparkline7Days([]);
                }
            } else if (res7?.EC === 0 && res7?.data) {
                const data = res7.data;
                const predictedMonthEnd = data.prediction?.predictedMonthEnd || 0;
                const avgPerDay = data.last7Days?.avgPerDay || data.currentMonth?.avgPerDay || 0;

                if (predictedMonthEnd > 0 || avgPerDay > 0) {
                    setPrediction7Days(data);
                    if (avgPerDay > 0) {
                        setSparkline7Days(generateSparklineFromData(avgPerDay, 5));
                    } else {
                        setSparkline7Days([]);
                    }
                } else {
                    setPrediction7Days(null);
                    setSparkline7Days([]);
                }
            } else {
                // Không có dữ liệu từ API
                setPrediction7Days(null);
                setSparkline7Days([]);
            }

            // Xử lý response 30 ngày - chỉ dùng dữ liệu từ API
            if (res30?.status === true && res30?.data) {
                const data = res30.data;
                const predictedMonthEnd = data.prediction?.predictedMonthEnd || 0;
                const avgPerDay = data.last30Days?.avgPerDay || data.currentMonth?.avgPerDay || 0;

                if (predictedMonthEnd > 0 || avgPerDay > 0) {
                    setPrediction30Days(data);
                    if (avgPerDay > 0) {
                        const sparkData = generateSparklineFromData(avgPerDay, 5);
                        setSparkline30Days(sparkData);
                    } else {
                        setSparkline30Days([]);
                    }
                } else {
                    setPrediction30Days(null);
                    setSparkline30Days([]);
                }
            } else if (res30?.EC === 0 && res30?.data) {
                const data = res30.data;
                const predictedMonthEnd = data.prediction?.predictedMonthEnd || 0;
                const avgPerDay = data.last30Days?.avgPerDay || data.currentMonth?.avgPerDay || 0;

                if (predictedMonthEnd > 0 || avgPerDay > 0) {
                    setPrediction30Days(data);
                    if (avgPerDay > 0) {
                        setSparkline30Days(generateSparklineFromData(avgPerDay, 5));
                    } else {
                        setSparkline30Days([]);
                    }
                } else {
                    setPrediction30Days(null);
                    setSparkline30Days([]);
                }
            } else {
                // Không có dữ liệu từ API
                setPrediction30Days(null);
                setSparkline30Days([]);
            }

            // Xử lý response xu hướng
            if (resTrend?.status === true && resTrend?.data) {
                const data = resTrend.data;
                const predictedMonthEnd = data.prediction?.predictedMonthEnd || 0;
                const currentTotal = data.currentMonth?.total || 0;
                const baseValue = data.currentMonth?.avgPerDay || 0;
                const trendValue = data.trend?.dailyTrend || 0;

                // Kiểm tra xem có dữ liệu thực sự không
                if (predictedMonthEnd > 0 || currentTotal > 0 || baseValue > 0) {
                    setPredictionTrend(data);

                    // Tạo sparkline data từ xu hướng
                    if (baseValue > 0) {
                        const sparkData = generateTrendSparkline(baseValue, trendValue, 5);
                        setSparklineTrend(sparkData);
                    } else {
                        setSparklineTrend([]);
                    }

                    // Tạo dữ liệu cho biểu đồ tháng
                    const now = new Date();
                    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                    const daysPassed = data.currentMonth?.daysPassed || now.getDate();
                    const finalPredictedMonthEnd = predictedMonthEnd > 0 ? predictedMonthEnd : currentTotal;

                    // Tạo dữ liệu cho từng ngày
                    const chartData = [];
                    const avgDaily = daysPassed > 0 ? currentTotal / daysPassed : 0;
                    const daysRemaining = Math.max(1, daysInMonth - daysPassed);
                    const predictedDaily = daysRemaining > 0 ? (finalPredictedMonthEnd - currentTotal) / daysRemaining : 0;

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
                    setMonthlyChartData(chartData);
                } else {
                    // Không có dữ liệu từ API
                    setPredictionTrend(null);
                    setSparklineTrend([]);
                    setMonthlyChartData([]);
                }
            } else if (resTrend?.EC === 0 && resTrend?.data) {
                const data = resTrend.data;
                const predictedMonthEnd = data.prediction?.predictedMonthEnd || 0;
                const currentTotal = data.currentMonth?.total || 0;
                const baseValue = data.currentMonth?.avgPerDay || 0;

                if (predictedMonthEnd > 0 || currentTotal > 0 || baseValue > 0) {
                    setPredictionTrend(data);
                    const trendValue = data.trend?.dailyTrend || 0;
                    if (baseValue > 0) {
                        setSparklineTrend(generateTrendSparkline(baseValue, trendValue, 5));
                    } else {
                        setSparklineTrend([]);
                    }

                    const now = new Date();
                    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                    const daysPassed = data.currentMonth?.daysPassed || now.getDate();
                    const finalPredictedMonthEnd = predictedMonthEnd > 0 ? predictedMonthEnd : currentTotal;
                    const chartData = [];
                    const avgDaily = daysPassed > 0 ? currentTotal / daysPassed : 0;
                    const daysRemaining = Math.max(1, daysInMonth - daysPassed);
                    const predictedDaily = daysRemaining > 0 ? (finalPredictedMonthEnd - currentTotal) / daysRemaining : 0;
                    for (let day = 1; day <= daysInMonth; day++) {
                        if (day <= daysPassed) {
                            chartData.push({
                                day,
                                actual: avgDaily * day,
                                predicted: null,
                            });
                        } else {
                            chartData.push({
                                day,
                                actual: day === daysPassed ? currentTotal : null,
                                predicted: currentTotal + (day - daysPassed) * predictedDaily,
                            });
                        }
                    }
                    setMonthlyChartData(chartData);
                } else {
                    // Không có dữ liệu từ API
                    setPredictionTrend(null);
                    setSparklineTrend([]);
                    setMonthlyChartData([]);
                }
            } else {
                // Không có dữ liệu từ API
                setPredictionTrend(null);
                setSparklineTrend([]);
                setMonthlyChartData([]);
            }
        } catch (error) {
            message.error("Lỗi khi tải dữ liệu dự đoán chi tiêu");
        }
    };

    const loadBudgetData = async () => {
        try {
            const res = await predictBudgetOverrunAPI();

            let predictions = [];

            // Xử lý response từ API - kiểm tra cả status và EC
            if (res?.status === true && res?.data) {
                // Backend trả về { data: { predictions: [...], atRisk: [...] } }
                predictions = res.data.predictions || [];
            } else if (res?.EC === 0 && res?.data) {
                predictions = res.data.predictions || res.data || [];
            } else if (res?.data && Array.isArray(res.data)) {
                // Trường hợp data là mảng trực tiếp
                predictions = res.data;
            }

            // Kiểm tra xem có dữ liệu hợp lệ không
            // Chấp nhận cả trường hợp spent = 0 (chưa có chi tiêu)
            const hasValidData = Array.isArray(predictions) && predictions.length > 0 &&
                predictions.some(b => {
                    const limit = b.limit || b.limit_amount || 0;
                    return limit > 0; // Chỉ cần có limit > 0 là đủ
                });

            if (hasValidData) {
                // Đảm bảo dữ liệu có đầy đủ các trường cần thiết
                predictions = predictions.map((b, index) => {
                    const spent = b.spent || 0;
                    const limit = b.limit || b.limit_amount || 0;
                    const usagePercent = b.usagePercent !== undefined
                        ? b.usagePercent
                        : (limit > 0 ? (spent / limit * 100) : 0);

                    return {
                        ...b,
                        spent: spent,
                        spentAmount: b.spentAmount || spent,
                        limit: limit,
                        usagePercent: usagePercent,
                        category: b.category || {
                            id: b.categoryId,
                            name: b.categoryName || b.budgetName || "Không xác định",
                            icon: b.categoryIcon
                        },
                        categoryName: b.categoryName || b.category?.name || b.budgetName || "Không xác định",
                        budgetName: b.budgetName || b.categoryName || b.category?.name || "Không xác định",
                        prediction: b.prediction || {
                            predictedOverrun: 0,
                            predictedTotal: spent, // Nếu không có prediction, dùng spent hiện tại
                            daysUntilOverrun: null
                        },
                        isAtRisk: b.isAtRisk !== undefined
                            ? b.isAtRisk
                            : (usagePercent >= 80 || (b.prediction?.predictedOverrun || 0) > 0)
                    };
                });
            }

            // Set budget overruns - chỉ khi có dữ liệu hợp lệ
            if (hasValidData) {
                setBudgetOverruns(predictions);
                // Tạo dữ liệu cho biểu đồ budget - Group theo ngày, không phải theo budget
                const chartData = createBudgetChartData(predictions);
                setBudgetChartData(chartData);
            } else {
                // Không có dữ liệu từ API
                setBudgetOverruns([]);
                setBudgetChartData([]);
            }

        } catch (error) {
            // Khi có lỗi, set về giá trị mặc định (rỗng)
            setBudgetOverruns([]);
            setBudgetChartData([]);
        }
    };

    // Helper function để tạo budget chart data
    const createBudgetChartData = (budgets) => {
        if (!Array.isArray(budgets) || budgets.length === 0) {
            return [];
        }

        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const daysPassed = Math.max(1, Math.floor((now - currentMonthStart) / (1000 * 60 * 60 * 24)) + 1);

        // Tạo data theo ngày, mỗi ngày có limit, actual, predicted
        // Lấy budget đầu tiên làm mẫu (hoặc có thể tổng hợp tất cả)
        const primaryBudget = budgets[0];
        const spent = primaryBudget.spent || primaryBudget.spentAmount || 0;
        const limit = primaryBudget.limit || primaryBudget.limit_amount || 0;

        // Nếu không có limit, không tạo chart
        if (limit <= 0) {
            return [];
        }

        // Tính chi tiêu trung bình mỗi ngày (tránh chia cho 0)
        const dailySpending = daysPassed > 0 ? spent / daysPassed : 0;

        // Dự đoán: dựa trên tốc độ chi tiêu hiện tại hoặc từ prediction
        const predictedTotal = primaryBudget.prediction?.predictedTotal;
        let predictedDaily;

        if (predictedTotal !== undefined && predictedTotal !== null && predictedTotal >= spent) {
            // Sử dụng predictedTotal từ API
            const daysRemaining = Math.max(1, daysInMonth - daysPassed);
            predictedDaily = (predictedTotal - spent) / daysRemaining;
        } else {
            // Tính toán dựa trên tốc độ hiện tại
            // Nếu chưa có chi tiêu, dự đoán dựa trên trung bình ngân sách
            if (dailySpending === 0) {
                // Chưa có chi tiêu: dự đoán sẽ chi hết ngân sách vào cuối tháng
                const daysRemaining = Math.max(1, daysInMonth - daysPassed);
                predictedDaily = limit / daysInMonth; // Tốc độ để chi hết ngân sách
            } else {
                predictedDaily = dailySpending;
            }
        }

        const chartData = [];
        for (let day = 1; day <= daysInMonth; day++) {
            // Actual: tính tích lũy từ đầu tháng đến ngày đó (chỉ cho ngày đã qua)
            // Luôn là số (0 hoặc giá trị thực) để Recharts có thể render line
            let actual = undefined;
            if (day <= daysPassed) {
                // Ngày đã qua: tính tích lũy (có thể = 0 nếu chưa chi tiêu)
                // Đảm bảo luôn có giá trị số để line hiển thị
                actual = dailySpending * day;
            }

            // Predicted: tính tích lũy từ đầu tháng đến ngày đó
            let predicted = undefined;
            if (day <= daysPassed) {
                // Ngày đã qua: predicted = actual (hoặc có thể dùng giá trị thực tế)
                predicted = actual !== undefined ? actual : 0;
            } else {
                // Ngày chưa đến: predicted = spent hiện tại + (tốc độ * số ngày từ đầu tháng đến ngày đó)
                const daysFromStart = day - daysPassed;
                predicted = spent + (predictedDaily * daysFromStart);
            }

            chartData.push({
                day,
                limit: limit,
                // Actual: số hoặc undefined (không dùng null) - đảm bảo có giá trị cho các ngày đã qua
                actual: actual !== undefined ? actual : undefined,
                // Predicted: luôn có giá trị cho tất cả các ngày
                predicted: predicted !== undefined ? predicted : undefined,
            });
        }

        return chartData;
    };

    const loadCategoryData = async () => {
        try {
            const res = await predictCategorySpendingAPI({ days: 30 });

            if (res?.status === true && res?.data) {
                const predictions = res.data.predictions || res.data || [];

                // Kiểm tra xem có dữ liệu thực sự không - chỉ dùng dữ liệu từ API
                if (Array.isArray(predictions) && predictions.length > 0) {
                    setCategoryPredictions(predictions);
                } else {
                    // Không có dữ liệu từ API
                    setCategoryPredictions([]);
                }
            } else if (res?.EC === 0 && res?.data) {
                const predictions = res.data.predictions || res.data || [];
                if (Array.isArray(predictions) && predictions.length > 0) {
                    setCategoryPredictions(predictions);
                } else {
                    // Không có dữ liệu từ API
                    setCategoryPredictions([]);
                }
            } else {
                // Không có dữ liệu từ API
                setCategoryPredictions([]);
            }
        } catch (error) {
            // Khi có lỗi, set về giá trị mặc định (rỗng)
            setCategoryPredictions([]);
        }
    };

    // Tạo sparkline data từ giá trị trung bình - chỉ dùng dữ liệu thực từ API
    const generateSparklineFromData = (avgValue, points) => {
        if (!avgValue || avgValue <= 0) return [];
        // Tạo dữ liệu đơn giản từ giá trị trung bình (không dùng random, chỉ dùng giá trị thực)
        return Array.from({ length: points }, (_, i) => ({
            week: i + 1,
            value: avgValue, // Dùng giá trị trung bình thực từ API
        }));
    };

    // Tạo sparkline data từ xu hướng - chỉ dùng dữ liệu thực từ API
    const generateTrendSparkline = (baseValue, trendValue, points) => {
        if (!baseValue || baseValue <= 0) return [];
        // Tạo dữ liệu từ xu hướng thực từ API (không dùng random)
        return Array.from({ length: points }, (_, i) => ({
            week: i + 1,
            value: baseValue + (trendValue * i), // Dùng giá trị và xu hướng thực từ API
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
            const now = new Date();
            const isToday = label === now.getDate();

            return (
                <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-xl min-w-[220px]">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                        <p className="font-semibold text-gray-800">Ngày {label}</p>
                        {isToday && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                Hôm nay
                            </span>
                        )}
                    </div>
                    {actualData && actualData.value !== null && (
                        <div className="mb-3">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                <p className="text-xs text-gray-600 font-medium">Chi tiêu thực tế</p>
                            </div>
                            <p className="text-lg font-bold text-blue-600 ml-5">
                                {formatCurrency(actualData.value)}
                            </p>
                        </div>
                    )}
                    {predictedData && predictedData.value !== null && (
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-3 h-3 rounded-full bg-orange-500 border-2 border-dashed border-orange-500"></div>
                                <p className="text-xs text-gray-600 font-medium">Chi tiêu dự đoán</p>
                            </div>
                            <p className="text-lg font-bold text-orange-600 ml-5">
                                {formatCurrency(predictedData.value)}
                            </p>
                            {label > now.getDate() && (
                                <p className="text-xs text-gray-500 mt-2 ml-5 italic">
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

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50/70 via-white to-white">
            <div className="max-w-7xl mx-auto p-4 sm:p-6">
                {/* Header Section */}
                <div className="mb-6 sm:mb-8">
                    <div className="flex items-center gap-2 sm:gap-3 mb-4">
                        <div className="p-2 sm:p-3 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl shadow-lg">
                            <BarChart3 className="text-white" size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-orange-800 to-gray-900 bg-clip-text text-transparent">
                                Dự đoán chi tiêu cuối tháng
                            </h1>
                            <p className="text-gray-600 mt-1 text-xs sm:text-sm">
                                Dự đoán chi tiêu và nguy cơ vượt ngân sách dựa trên dữ liệu thực tế
                            </p>
                        </div>
                    </div>

                    {/* Date Range Picker */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <Calendar className="text-orange-500" size={14} />
                            Khoảng thời gian phân tích
                        </label>
                        <DateRangePicker
                            value={dateRange}
                            onChange={setDateRange}
                            format="DD/MM/YYYY"
                            className="w-full max-w-md"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col justify-center items-center py-20">
                        <Spin size="large" />
                        <p className="mt-4 text-gray-500 text-sm sm:text-base">Đang tính toán dự đoán...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                        {/* Section A: Dự đoán chi tiêu cuối tháng */}
                        <div className="xl:col-span-5 space-y-4">
                            <Card
                                className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 rounded-2xl overflow-hidden bg-gradient-to-br from-white to-gray-50"
                                title={
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg">
                                            <Target className="text-white" size={20} />
                                        </div>
                                        <span className="font-bold text-gray-800">Dự đoán chi tiêu cuối tháng</span>
                                    </div>
                                }
                            >
                                {/* A1: Forecast Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                    {/* Card 7 ngày */}
                                    <Card className="mb-3 border-2 border-blue-200 hover:shadow-lg transition-all duration-200 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Clock className="text-blue-600" size={16} />
                                            <span className="text-xs font-semibold text-gray-700">
                                                Dựa trên 7 ngày gần nhất
                                            </span>
                                        </div>
                                        <div className="text-xl sm:text-2xl font-bold text-blue-600 mb-2 break-words">
                                            {prediction7Days?.prediction?.predictedMonthEnd !== undefined && prediction7Days.prediction.predictedMonthEnd !== null
                                                ? formatCurrency(prediction7Days.prediction.predictedMonthEnd)
                                                : prediction7Days === null
                                                    ? "Đang tính..."
                                                    : formatCurrency(0)}
                                        </div>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <Calendar className="text-gray-400" size={12} />
                                                <span>{getDaysRemaining()} ngày còn lại</span>
                                            </div>
                                        </div>
                                        {sparkline7Days.length > 0 ? (
                                            <ResponsiveContainer width="100%" height={50}>
                                                <LineChart data={sparkline7Days}>
                                                    <Line
                                                        type="monotone"
                                                        dataKey="value"
                                                        stroke="#3B82F6"
                                                        strokeWidth={2.5}
                                                        dot={{ r: 3, fill: "#3B82F6" }}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-[50px] flex items-center justify-center text-xs text-gray-400">
                                                Chưa có dữ liệu
                                            </div>
                                        )}
                                    </Card>

                                    {/* Card 30 ngày */}
                                    <Card className="mb-3 border-2 border-green-200 hover:shadow-lg transition-all duration-200 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Calendar className="text-green-600" size={16} />
                                            <span className="text-xs font-semibold text-gray-700">
                                                Dựa trên 30 ngày gần nhất
                                            </span>
                                        </div>
                                        <div className="text-xl sm:text-2xl font-bold text-green-600 mb-2 break-words">
                                            {prediction30Days?.prediction?.predictedMonthEnd !== undefined && prediction30Days.prediction.predictedMonthEnd !== null
                                                ? formatCurrency(prediction30Days.prediction.predictedMonthEnd)
                                                : prediction30Days === null
                                                    ? "Đang tính..."
                                                    : formatCurrency(0)}
                                        </div>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <Calendar className="text-gray-400" size={12} />
                                                <span>{getDaysRemaining()} ngày còn lại</span>
                                            </div>
                                        </div>
                                        {sparkline30Days.length > 0 ? (
                                            <ResponsiveContainer width="100%" height={50}>
                                                <LineChart data={sparkline30Days}>
                                                    <Line
                                                        type="monotone"
                                                        dataKey="value"
                                                        stroke="#10B981"
                                                        strokeWidth={2.5}
                                                        dot={{ r: 3, fill: "#10B981" }}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-[50px] flex items-center justify-center text-xs text-gray-400">
                                                Chưa có dữ liệu
                                            </div>
                                        )}
                                    </Card>

                                    {/* Card Xu hướng */}
                                    <Card className="mb-3 border-2 border-purple-200 hover:shadow-lg transition-all duration-200 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="text-purple-600" size={16} />
                                                <span className="text-xs font-semibold text-gray-700">
                                                    Dựa trên xu hướng
                                                </span>
                                            </div>
                                            {predictionTrend?.trend?.direction === "increasing" && (
                                                <Badge
                                                    count="Tăng"
                                                    style={{ backgroundColor: "#F59E0B", fontSize: '10px', fontWeight: 'bold' }}
                                                />
                                            )}
                                            {predictionTrend?.trend?.direction === "decreasing" && (
                                                <Badge
                                                    count="Giảm"
                                                    style={{ backgroundColor: "#10B981", fontSize: '10px', fontWeight: 'bold' }}
                                                />
                                            )}
                                        </div>
                                        <div className="text-xl sm:text-2xl font-bold text-purple-600 mb-2 break-words">
                                            {predictionTrend?.prediction?.predictedMonthEnd !== undefined && predictionTrend.prediction.predictedMonthEnd !== null
                                                ? formatCurrency(predictionTrend.prediction.predictedMonthEnd)
                                                : predictionTrend === null
                                                    ? "Đang tính..."
                                                    : formatCurrency(0)}
                                        </div>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <Calendar className="text-gray-400" size={12} />
                                                <span>{getDaysRemaining()} ngày còn lại</span>
                                            </div>
                                        </div>
                                        {sparklineTrend.length > 0 ? (
                                            <ResponsiveContainer width="100%" height={50}>
                                                <LineChart data={sparklineTrend}>
                                                    <Line
                                                        type="monotone"
                                                        dataKey="value"
                                                        stroke="#8B5CF6"
                                                        strokeWidth={2.5}
                                                        strokeDasharray="5 5"
                                                        dot={{ r: 3, fill: "#8B5CF6" }}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-[50px] flex items-center justify-center text-xs text-gray-400">
                                                Chưa có dữ liệu
                                            </div>
                                        )}
                                    </Card>
                                </div>

                                {/* A2: Biểu đồ Dự đoán Chi tiêu Cuối Tháng */}
                                <div className="mt-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <BarChart3 className="text-indigo-500" size={18} />
                                        <h3 className="text-sm font-bold text-gray-800">Biểu đồ Dự đoán Chi tiêu Cuối Tháng</h3>
                                    </div>
                                    {monthlyChartData.length > 0 ? (
                                        <div className="bg-gray-50 rounded-lg p-2 sm:p-4 border border-gray-200">
                                            <ResponsiveContainer width="100%" height={280}>
                                                <AreaChart data={monthlyChartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                                                    <defs>
                                                        <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05} />
                                                        </linearGradient>
                                                        <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.05} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                                                    <XAxis
                                                        dataKey="day"
                                                        stroke="#6B7280"
                                                        tick={{ fill: "#6B7280", fontSize: 11 }}
                                                        tickLine={{ stroke: "#D1D5DB" }}
                                                        axisLine={{ stroke: "#D1D5DB" }}
                                                        label={{ value: "Ngày trong tháng", position: "insideBottom", offset: -8, style: { fill: "#6B7280", fontSize: 12 } }}
                                                    />
                                                    <YAxis
                                                        stroke="#6B7280"
                                                        tick={{ fill: "#6B7280", fontSize: 11 }}
                                                        tickLine={{ stroke: "#D1D5DB" }}
                                                        axisLine={{ stroke: "#D1D5DB" }}
                                                        tickFormatter={(value) => {
                                                            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                                                            if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                                                            return value.toString();
                                                        }}
                                                        label={{ value: "Số tiền tích lũy (VND)", angle: -90, position: "insideLeft", style: { fill: "#6B7280", fontSize: 12 } }}
                                                    />
                                                    <Tooltip content={<CustomChartTooltip />} cursor={{ stroke: "#94A3B8", strokeWidth: 1, strokeDasharray: "5 5" }} />
                                                    <Legend
                                                        wrapperStyle={{ paddingTop: "20px" }}
                                                        iconType="line"
                                                        formatter={(value) => (
                                                            <span style={{ color: "#374151", fontSize: "12px" }}>{value}</span>
                                                        )}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="actual"
                                                        name="Chi tiêu thực tế"
                                                        stroke="#3B82F6"
                                                        fill="url(#colorActual)"
                                                        strokeWidth={2.5}
                                                        dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                                                        activeDot={{ r: 6, stroke: "#3B82F6", strokeWidth: 2 }}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="predicted"
                                                        name="Chi tiêu dự đoán"
                                                        stroke="#F59E0B"
                                                        fill="url(#colorPredicted)"
                                                        strokeWidth={2.5}
                                                        strokeDasharray="6 4"
                                                        dot={{ fill: "#F59E0B", strokeWidth: 2, r: 4 }}
                                                        activeDot={{ r: 6, stroke: "#F59E0B", strokeWidth: 2 }}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center h-[320px] border border-gray-200 rounded-lg bg-gray-50">
                                            <div className="text-center">
                                                <div className="text-sm text-gray-500 mb-1">Không có dữ liệu</div>
                                                <div className="text-xs text-gray-400">Vui lòng chọn khoảng thời gian khác</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>

                        {/* Section B: Dự đoán vượt ngân sách */}
                        <div className="xl:col-span-4 space-y-4">
                            <Card
                                className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 rounded-2xl overflow-hidden bg-gradient-to-br from-white to-gray-50"
                                title={
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gradient-to-br from-red-400 to-pink-500 rounded-lg">
                                            <AlertTriangle className="text-white" size={20} />
                                        </div>
                                        <span className="font-bold text-gray-800">Dự đoán vượt ngân sách</span>
                                    </div>
                                }
                            >
                                {/* Warning Banner */}
                                {budgetOverruns.filter(b => b.isAtRisk).length > 0 && (
                                    <div className="mb-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-yellow-500 rounded-lg">
                                                <AlertTriangle className="text-white" size={20} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-yellow-800 mb-1">
                                                    ▲ Dự đoán budget at risk
                                                </div>
                                                <div className="text-sm text-yellow-700">
                                                    {budgetOverruns.filter(b => b.isAtRisk).length} ngân sách có nguy cơ vượt
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Category Overrun Details */}
                                <div className="space-y-4 max-h-[520px] overflow-y-auto pr-2">
                                    {budgetOverruns && budgetOverruns.length > 0 ? (
                                        budgetOverruns.map((budget, index) => {
                                            const spent = budget.spent || budget.spentAmount || 0;
                                            const limit = budget.limit || budget.limit_amount || budget.amount || 0;
                                            const usagePercent = budget.usagePercent !== undefined
                                                ? budget.usagePercent
                                                : (limit > 0 ? (spent / limit * 100) : 0);
                                            const overrun = budget.prediction?.predictedOverrun || budget.predictedOverrun || 0;
                                            const isAtRisk = budget.isAtRisk !== undefined
                                                ? budget.isAtRisk
                                                : (usagePercent >= 70 || overrun > 0);
                                            const categoryName = budget.category?.name || budget.budgetName || budget.categoryName || "Không xác định";
                                            const budgetId = budget.budgetId || budget._id || `budget-${index}`;
                                            const daysUntilOverrun = budget.prediction?.daysUntilOverrun || null;

                                            return (
                                                <Card
                                                    key={budgetId}
                                                    className={`mb-3 border-2 rounded-xl transition-all duration-200 cursor-pointer hover:shadow-lg overflow-hidden ${isAtRisk
                                                        ? "bg-gradient-to-r from-red-50 to-pink-50 border-red-300"
                                                        : "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
                                                        }`}
                                                    onClick={() => handleBudgetAlertClick(budget)}
                                                    title="Click để xem chi tiết giao dịch"
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-10 h-10 rounded-xl bg-white border-2 border-gray-200 flex items-center justify-center">
                                                                <span className="text-xl">{getCategoryIcon(categoryName)}</span>
                                                            </div>
                                                            <span className="font-bold text-sm text-gray-900">
                                                                {categoryName}
                                                            </span>
                                                        </div>
                                                        <Badge
                                                            count={overrun > 0 ? `+${formatCurrency(overrun)}` : "An toàn"}
                                                            style={{
                                                                backgroundColor: overrun > 0 ? "#EF4444" : "#10B981",
                                                                fontSize: '10px',
                                                                fontWeight: 'bold'
                                                            }}
                                                        />
                                                    </div>
                                                    <Progress
                                                        percent={Math.min(Math.max(usagePercent, 0), 100)}
                                                        status={isAtRisk ? "exception" : "normal"}
                                                        strokeColor={isAtRisk ? "#EF4444" : usagePercent >= 50 ? "#F59E0B" : "#10B981"}
                                                        showInfo={false}
                                                        className="mb-3"
                                                        strokeWidth={8}
                                                    />
                                                    <div className="flex items-start justify-between text-xs gap-2">
                                                        <span className="text-gray-600 font-medium break-all leading-tight">
                                                            {formatCurrency(spent)}
                                                            <span className="mx-1">/</span>
                                                            {formatCurrency(limit)}
                                                        </span>
                                                        <span className={`font-semibold whitespace-nowrap ${daysUntilOverrun !== null && daysUntilOverrun > 0
                                                            ? "text-orange-600"
                                                            : "text-green-600"
                                                            }`}>
                                                            {daysUntilOverrun !== null && daysUntilOverrun > 0
                                                                ? `Còn ${daysUntilOverrun} ngày`
                                                                : "An toàn"}
                                                        </span>
                                                    </div>
                                                </Card>
                                            );
                                        })
                                    ) : (
                                        <div className="text-sm text-gray-500 text-center py-4">
                                            {budgetOverruns && budgetOverruns.length === 0
                                                ? "Không có ngân sách nào"
                                                : "Đang tải dữ liệu..."}
                                        </div>
                                    )}
                                </div>

                                {/* Budget Limit Chart */}
                                {budgetChartData.length > 0 && (
                                    <div className="mt-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <BarChart3 className="text-indigo-500" size={18} />
                                            <h3 className="text-sm font-bold text-gray-800">Biểu đồ Ngân sách</h3>
                                        </div>
                                        <ResponsiveContainer width="100%" height={200}>
                                            <LineChart data={budgetChartData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                                <XAxis
                                                    dataKey="day"
                                                    stroke="#6B7280"
                                                    tick={{ fontSize: 11 }}
                                                />
                                                <YAxis
                                                    stroke="#6B7280"
                                                    tick={{ fontSize: 11 }}
                                                    tickFormatter={(value) => {
                                                        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                                                        if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                                                        return value.toString();
                                                    }}
                                                />
                                                <Tooltip
                                                    formatter={(value, name) => {
                                                        if (value === null || value === undefined) return "N/A";
                                                        return formatCurrency(value);
                                                    }}
                                                    labelFormatter={(label) => `Ngày ${label}`}
                                                    contentStyle={{
                                                        backgroundColor: "#fff",
                                                        border: "1px solid #E5E7EB",
                                                        borderRadius: "8px",
                                                        padding: "12px"
                                                    }}
                                                />
                                                <Legend />
                                                <Line
                                                    type="monotone"
                                                    dataKey="limit"
                                                    name="Số ngắt limit"
                                                    stroke="#EF4444"
                                                    strokeWidth={2}
                                                    dot={{ r: 4 }}
                                                    connectNulls={true}
                                                    isAnimationActive={true}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="actual"
                                                    name="Thực tế"
                                                    stroke="#3B82F6"
                                                    strokeWidth={2}
                                                    dot={{ r: 4, fill: "#3B82F6" }}
                                                    connectNulls={false}
                                                    isAnimationActive={true}
                                                    hide={false}
                                                    // Đảm bảo line hiển thị ngay cả khi giá trị = 0
                                                    activeDot={{ r: 6 }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="predicted"
                                                    name="Dự đoán"
                                                    stroke="#F59E0B"
                                                    strokeWidth={2}
                                                    strokeDasharray="5 5"
                                                    dot={{ r: 4, fill: "#F59E0B" }}
                                                    connectNulls={true}
                                                    isAnimationActive={true}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </Card>
                        </div>

                        {/* Section C: Dự đoán theo danh mục */}
                        <div className="xl:col-span-3 space-y-4">
                            <Card
                                className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 rounded-2xl overflow-hidden bg-gradient-to-br from-white to-gray-50"
                                title={
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-lg">
                                            <Sparkles className="text-white" size={20} />
                                        </div>
                                        <span className="font-bold text-gray-800">Dự đoán theo danh mục</span>
                                    </div>
                                }
                            >
                                <div className="space-y-4">
                                    {categoryPredictions.length > 0 ? (
                                        categoryPredictions.map((category, index) => {
                                            const categoryName = category.category?.name || category.categoryName || "Danh mục";
                                            // Backend trả về prediction.nextWeek (dự đoán tuần tới)
                                            // Nếu muốn hiển thị dự đoán tháng, nhân với 4
                                            const predictedNextWeek = category.prediction?.nextWeek || category.predicted || 0;
                                            const predictedMonth = predictedNextWeek * 4; // Dự đoán tháng = tuần * 4
                                            const historical = category.historical || {};
                                            const weeklyAmounts = historical.weeklyAmounts || []; // Chi tiêu theo tuần từ backend
                                            const avgPerWeek = historical.avgPerWeek || 0; // Trung bình mỗi tuần
                                            const totalAmount = historical.totalAmount || 0; // Tổng chi tiêu
                                            const weeks = historical.weeks || 0; // Số tuần có dữ liệu
                                            const trend = category.prediction?.trendDirection || category.trend || "stable";

                                            // Tạo sparkline data từ dữ liệu thực tế
                                            // Hiển thị 3 tuần gần nhất + 1 tuần dự đoán
                                            const sparklineData = [];
                                            const timelineLabels = [];

                                            // Lấy 3 tuần gần nhất từ dữ liệu thực tế - chỉ dùng dữ liệu từ API
                                            let recentWeeks = weeklyAmounts.slice(-3);
                                            let hasData = recentWeeks.length > 0;

                                            if (hasData) {
                                                // Điền 3 tuần thực tế từ API
                                                for (let i = 0; i < 3; i++) {
                                                    if (i < recentWeeks.length) {
                                                        sparklineData.push({
                                                            period: i + 1,
                                                            actual: recentWeeks[i],
                                                            predicted: null,
                                                        });
                                                        // Label: "3 tuần trước", "2 tuần trước", "1 tuần trước"
                                                        timelineLabels.push(`${3 - i} tuần trước`);
                                                    }
                                                }

                                                // Điểm cuối cùng: Tuần tới (dự đoán từ API)
                                                if (recentWeeks.length > 0) {
                                                    sparklineData.push({
                                                        period: 4,
                                                        actual: recentWeeks[recentWeeks.length - 1],
                                                        predicted: predictedNextWeek > 0 ? predictedNextWeek : null,
                                                    });
                                                    timelineLabels.push("Tuần tới");
                                                }
                                            }

                                            return (
                                                <Card
                                                    key={index}
                                                    size="small"
                                                    className="border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-semibold text-sm text-gray-900">
                                                            {categoryName}
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
                                                        {trend === "stable" && (
                                                            <Badge
                                                                count="Ổn định"
                                                                style={{ backgroundColor: "#6B7280" }}
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="text-lg font-bold text-gray-900 mb-2 break-all leading-tight max-w-full">
                                                        {predictedMonth > 0 ? formatCurrency(predictedMonth) : formatCurrency(0)}
                                                    </div>
                                                    {hasData ? (
                                                        <>
                                                            <ResponsiveContainer width="100%" height={50}>
                                                                <LineChart data={sparklineData}>
                                                                    <Line
                                                                        type="monotone"
                                                                        dataKey="actual"
                                                                        stroke="#8B5CF6"
                                                                        strokeWidth={2.5}
                                                                        dot={{ r: 3, fill: "#8B5CF6" }}
                                                                        connectNulls={false}
                                                                    />
                                                                    {predictedNextWeek > 0 && (
                                                                        <Line
                                                                            type="monotone"
                                                                            dataKey="predicted"
                                                                            stroke="#F59E0B"
                                                                            strokeWidth={2.5}
                                                                            strokeDasharray="5 5"
                                                                            dot={{ r: 4, fill: "#F59E0B", strokeWidth: 2 }}
                                                                            connectNulls={false}
                                                                        />
                                                                    )}
                                                                </LineChart>
                                                            </ResponsiveContainer>
                                                            <div className="text-xs text-gray-500 mt-2 flex justify-between">
                                                                {timelineLabels.map((label, idx) => (
                                                                    <span key={idx}>{label}</span>
                                                                ))}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="h-[50px] flex items-center justify-center text-xs text-gray-400">
                                                            Chưa có dữ liệu để hiển thị
                                                        </div>
                                                    )}
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
        </div>
    );
};

export default AnalyticsPredictive;
