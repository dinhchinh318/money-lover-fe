import { useState, useEffect } from "react";
import { Card, Tabs, Spin } from "antd";
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    Scale,
} from "lucide-react";
import {
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
    getFinancialDashboardAPI,
    getWalletChangesAPI,
    compareCurrentMonthWithPreviousAPI,
    compareCurrentWeekWithPreviousAPI,
    compareCurrentYearWithPreviousAPI,
    getTimeBasedReportAPI,
} from "../../../services/api.report";
import DateRangePicker from "../../../components/common/DateRangePicker";
import dayjs from "dayjs";

const ReportsDashboard = () => {
    const [loading, setLoading] = useState(false);
    const [chartLoading, setChartLoading] = useState(false);
    const [comparisonTab, setComparisonTab] = useState("week");
    const [chartTab, setChartTab] = useState("week");
    const [dateRange, setDateRange] = useState([
        dayjs().startOf("month"),
        dayjs().endOf("month"),
    ]);
    const [chartData, setChartData] = useState([]);

    // Financial Overview Data
    const [overview, setOverview] = useState({
        totalIncome: 5990000,
        incomeChange: 5,
        totalExpense: 1200000,
        expenseChange: 10,
        totalBalance: 3600000,
        difference: -3000000,
    });

    // Comparison Data
    const [comparison, setComparison] = useState({
        current: {
            income: 12000000,
            incomeChange: 5,
            expense: 11200000,
            expenseChange: -10,
            balance: 5600000,
            balanceChange: 20,
        },
        previous: {
            income: 12000000,
            incomeChange: 20,
            expense: 11200000,
            expenseChange: -10,
            balance: 5000000,
            balanceChange: -5,
        },
    });

    // Wallet Fluctuations
    const [walletFluctuations, setWalletFluctuations] = useState([
        {
            name: "Tran động Ví",
            balance: 3600000,
            change: -35000000,
            changePercent: 20,
            icon: "💰",
        },
        {
            name: "Tran salat",
            balance: 2500000,
            change: 10000000,
            changePercent: -5,
            icon: "🏦",
        },
        {
            name: "Bemo card",
            balance: 3000000,
            change: -1000000,
            changePercent: -5,
            icon: "💳",
        },
    ]);

    useEffect(() => {
        loadDashboardData();
        loadComparisonData();
        loadWalletChanges();
        loadChartData();
    }, [comparisonTab, chartTab, dateRange]);

    const loadDashboardData = async () => {
        try {
            const params = {
                startDate: dateRange[0].format("YYYY-MM-DD"),
                endDate: dateRange[1].format("YYYY-MM-DD"),
            };
            const res = await getFinancialDashboardAPI(params);
            if (res?.EC === 0 && res?.data) {
                const data = res.data;
                setOverview({
                    totalIncome: data.totalIncome || 0,
                    incomeChange: data.incomeChange || 0,
                    totalExpense: data.totalExpense || 0,
                    expenseChange: data.expenseChange || 0,
                    totalBalance: data.totalWalletBalance || 0,
                    difference: (data.totalIncome || 0) - (data.totalExpense || 0),
                });
            }
        } catch (error) {
            console.error("Error loading dashboard data:", error);
        }
    };

    const loadComparisonData = async () => {
        setLoading(true);
        try {
            let res;
            switch (comparisonTab) {
                case "week":
                    res = await compareCurrentWeekWithPreviousAPI();
                    break;
                case "year":
                    res = await compareCurrentYearWithPreviousAPI();
                    break;
                default:
                    res = await compareCurrentMonthWithPreviousAPI();
            }

            if (res?.EC === 0 && res?.data) {
                const data = res.data;
                setComparison({
                    current: {
                        income: data.current?.totalIncome || 0,
                        incomeChange: data.current?.incomeChange || 0,
                        expense: data.current?.totalExpense || 0,
                        expenseChange: data.current?.expenseChange || 0,
                        balance: data.current?.balance || 0,
                        balanceChange: data.current?.balanceChange || 0,
                    },
                    previous: {
                        income: data.previous?.totalIncome || 0,
                        incomeChange: data.previous?.incomeChange || 0,
                        expense: data.previous?.totalExpense || 0,
                        expenseChange: data.previous?.expenseChange || 0,
                        balance: data.previous?.balance || 0,
                        balanceChange: data.previous?.balanceChange || 0,
                    },
                });
            }
        } catch (error) {
            console.error("Error loading comparison data:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadWalletChanges = async () => {
        try {
            const params = {
                startDate: dateRange[0].format("YYYY-MM-DD"),
                endDate: dateRange[1].format("YYYY-MM-DD"),
            };
            const res = await getWalletChangesAPI(params);
            if (res?.EC === 0 && res?.data) {
                setWalletFluctuations(res.data || []);
            }
        } catch (error) {
            console.error("Error loading wallet changes:", error);
        }
    };

    const loadChartData = async () => {
        setChartLoading(true);
        try {
            let params = {};
            let period = "week";
            
            switch (chartTab) {
                case "week":
                    period = "week";
                    params = {
                        startDate: dayjs().subtract(7, "week").startOf("week").format("YYYY-MM-DD"),
                        endDate: dayjs().endOf("week").format("YYYY-MM-DD"),
                        period: "week",
                    };
                    break;
                case "month":
                    period = "month";
                    params = {
                        startDate: dayjs().subtract(6, "month").startOf("month").format("YYYY-MM-DD"),
                        endDate: dayjs().endOf("month").format("YYYY-MM-DD"),
                        period: "month",
                    };
                    break;
                case "year":
                    period = "year";
                    params = {
                        startDate: dayjs().subtract(5, "year").startOf("year").format("YYYY-MM-DD"),
                        endDate: dayjs().endOf("year").format("YYYY-MM-DD"),
                        period: "year",
                    };
                    break;
            }

            console.log("Loading chart data with params:", params);
            const res = await getTimeBasedReportAPI(params);
            console.log("Chart API Response:", res);
            
            if (res?.EC === 0 && res?.data) {
                const data = res.data || [];
                console.log("Chart Data:", data);
                
                if (data.length === 0) {
                    console.warn("Empty data array received");
                    setChartData([]);
                    return;
                }
                
                // Transform data for chart
                const formattedData = data.map((item, index) => {
                    let label = "";
                    const dateValue = item.date || item.period || item._id;
                    
                    if (!dateValue) {
                        console.warn("Item missing date field:", item);
                    }
                    
                    if (period === "week") {
                        // Format: "Tuần DD/MM" using week start date
                        const weekStart = dayjs(dateValue).startOf("week");
                        label = `Tuần ${weekStart.format("DD/MM")}`;
                    } else if (period === "month") {
                        label = dayjs(dateValue).format("MM/YYYY");
                    } else {
                        label = dayjs(dateValue).format("YYYY");
                    }
                    return {
                        label: label || `Item ${index + 1}`,
                        expense: item.totalExpense || item.expense || 0,
                        income: item.totalIncome || item.income || 0,
                    };
                });
                
                console.log("Formatted Chart Data:", formattedData);
                setChartData(formattedData);
            } else {
                console.warn("No chart data received. Response:", res);
                setChartData([]);
            }
        } catch (error) {
            console.error("Error loading chart data:", error);
            setChartData([]);
        } finally {
            setChartLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(value || 0);
    };


    const getChangeColor = (value) => {
        if (value > 0) return "text-[#10B981]";
        if (value < 0) return "text-[#EF4444]";
        return "text-gray-600";
    };

    const getChangeIcon = (value) => {
        if (value > 0) return <TrendingUp size={16} />;
        if (value < 0) return <TrendingDown size={16} />;
        return null;
    };

    const getPeriodLabels = () => {
        switch (comparisonTab) {
            case "month":
                return { current: "Tháng này", previous: "Tháng trước" };
            case "year":
                return { current: "Năm này", previous: "Năm trước" };
            default:
                return { current: "Tuần này", previous: "Tuần trước" };
        }
    };

    const comparisonTabItems = [
        {
            key: "week",
            label: "Tuần",
        },
        {
            key: "month",
            label: "Tháng",
        },
        {
            key: "year",
            label: "Năm",
        },
    ];

    const chartTabItems = [
        {
            key: "week",
            label: "Tuần",
        },
        {
            key: "month",
            label: "Tháng",
        },
        {
            key: "year",
            label: "Năm",
        },
    ];


    return (
        <div className="max-w-7xl mx-auto p-6">
                    {/* Financial Overview Section */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-gray-900">
                                Tổng quan Tài chính
                            </h2>
                            <DateRangePicker
                                value={dateRange}
                                onChange={setDateRange}
                                format="DD/MM/YYYY"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Total Income */}
                        <Card className="shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600">
                                    Tổng Thu nhập
                                </span>
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: "#D1FAE5" }}
                                >
                                    <TrendingUp size={20} className="text-[#10B981]" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-[#10B981] mb-1">
                                {formatCurrency(overview.totalIncome)}
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                                <span className={getChangeColor(overview.incomeChange)}>
                                    {getChangeIcon(overview.incomeChange)}
                                </span>
                                <span className={getChangeColor(overview.incomeChange)}>
                                    {overview.incomeChange > 0 ? "+" : ""}
                                    {overview.incomeChange}%
                                </span>
                            </div>
                        </Card>

                        {/* Total Expense */}
                        <Card className="shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600">
                                    Tổng Chi tiêu
                                </span>
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: "#FEE2E2" }}
                                >
                                    <TrendingDown size={20} className="text-[#EF4444]" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-[#EF4444] mb-1">
                                {formatCurrency(overview.totalExpense)}
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                                <span className={getChangeColor(overview.expenseChange)}>
                                    {getChangeIcon(overview.expenseChange)}
                                </span>
                                <span className={getChangeColor(overview.expenseChange)}>
                                    {overview.expenseChange > 0 ? "+" : ""}
                                    {overview.expenseChange}%
                                </span>
                            </div>
                        </Card>

                        {/* Total Wallet Balance */}
                        <Card className="shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600">
                                    Tổng số dư Ví
                                </span>
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: "#DBEAFE" }}
                                >
                                    <Wallet size={20} className="text-[#3B82F6]" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-[#3B82F6] mb-1">
                                {formatCurrency(overview.totalBalance)}
                            </div>
                        </Card>

                        {/* Difference */}
                        <Card className="shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600">
                                    Chênh lệch
                                </span>
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: "#F3F4F6" }}
                                >
                                    <Scale size={20} className="text-gray-600" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-gray-900 mb-1">
                                {formatCurrency(overview.difference)}
                            </div>
                        </Card>
                        </div>
                    </div>

                    {/* Comparison and Wallet Fluctuations - Side by Side */}
                    <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Comparison Section - Left */}
                        <Card className="shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    So sánh với Kỳ trước
                                </h3>
                                <Tabs
                                    activeKey={comparisonTab}
                                    onChange={setComparisonTab}
                                    items={comparisonTabItems}
                                    size="small"
                                />
                            </div>
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <Spin />
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Current Period - Left Column */}
                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-3 text-sm">
                                            {getPeriodLabels().current}
                                        </h4>
                                        <div className="space-y-3">
                                            <div className="flex flex-col gap-1 p-3 bg-gray-50 rounded-lg">
                                                <span className="text-xs text-gray-600">
                                                    Tổng thu
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-[#10B981] text-sm">
                                                        {formatCurrency(comparison.current.income)}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-xs text-[#10B981]">
                                                        <TrendingUp size={12} />
                                                        +{comparison.current.incomeChange}%
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1 p-3 bg-gray-50 rounded-lg">
                                                <span className="text-xs text-gray-600">
                                                    Tổng chi
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-[#EF4444] text-sm">
                                                        {formatCurrency(comparison.current.expense)}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-xs text-[#EF4444]">
                                                        <TrendingDown size={12} />
                                                        {comparison.current.expenseChange}%
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1 p-3 bg-gray-50 rounded-lg">
                                                <span className="text-xs text-gray-600">
                                                    Số dư
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-[#3B82F6] text-sm">
                                                        {formatCurrency(comparison.current.balance)}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-xs text-[#10B981]">
                                                        <TrendingUp size={12} />
                                                        +{comparison.current.balanceChange}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Previous Period - Right Column */}
                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-3 text-sm">
                                            {getPeriodLabels().previous}
                                        </h4>
                                        <div className="space-y-3">
                                            <div className="flex flex-col gap-1 p-3 bg-gray-50 rounded-lg">
                                                <span className="text-xs text-gray-600">
                                                    Tổng thu
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-[#10B981] text-sm">
                                                        {formatCurrency(comparison.previous.income)}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-xs text-[#10B981]">
                                                        <TrendingUp size={12} />
                                                        +{comparison.previous.incomeChange}%
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1 p-3 bg-gray-50 rounded-lg">
                                                <span className="text-xs text-gray-600">
                                                    Tổng chi
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-[#EF4444] text-sm">
                                                        {formatCurrency(comparison.previous.expense)}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-xs text-[#EF4444]">
                                                        <TrendingDown size={12} />
                                                        {comparison.previous.expenseChange}%
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1 p-3 bg-gray-50 rounded-lg">
                                                <span className="text-xs text-gray-600">
                                                    Số dư
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-[#3B82F6] text-sm">
                                                        {formatCurrency(comparison.previous.balance)}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-xs text-[#EF4444]">
                                                        <TrendingDown size={12} />
                                                        {comparison.previous.balanceChange}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Card>

                        {/* Wallet Fluctuations - Right */}
                        <Card className="shadow-sm">
                            <h3 className="text-lg font-semibold mb-4">
                                Biến động Ví
                            </h3>
                            <div className="space-y-4">
                                {walletFluctuations.map((wallet, index) => (
                                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="text-2xl">{wallet.icon}</div>
                                                <div>
                                                    <div className="font-semibold text-gray-900">
                                                        {wallet.name}
                                                    </div>
                                                    <div className="text-lg font-bold text-gray-900">
                                                        {formatCurrency(wallet.balance)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">
                                                    Thay đổi
                                                </span>
                                                <span
                                                    className={`font-semibold ${
                                                        wallet.change >= 0
                                                            ? "text-[#10B981]"
                                                            : "text-[#EF4444]"
                                                    }`}
                                                >
                                                    {wallet.change >= 0 ? "+" : ""}
                                                    {formatCurrency(wallet.change)}
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full ${
                                                        wallet.changePercent >= 0
                                                            ? "bg-[#10B981]"
                                                            : wallet.changePercent < -10
                                                            ? "bg-[#EF4444]"
                                                            : "bg-gray-400"
                                                    }`}
                                                    style={{
                                                        width: `${Math.min(
                                                            Math.abs(wallet.changePercent),
                                                            100
                                                        )}%`,
                                                    }}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-gray-500">
                                                    Tỷ lệ thay đổi
                                                </span>
                                                <span
                                                    className={`font-semibold ${
                                                        wallet.changePercent >= 0
                                                            ? "text-[#10B981]"
                                                            : "text-[#EF4444]"
                                                    }`}
                                                >
                                                    {wallet.changePercent >= 0 ? "+" : ""}
                                                    {wallet.changePercent}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Chart Section - Bottom */}
                    <div className="mb-6">
                        <Card className="shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Biểu đồ Chi tiêu
                                </h2>
                                <Tabs
                                    activeKey={chartTab}
                                    onChange={setChartTab}
                                    items={chartTabItems}
                                />
                            </div>
                            {chartLoading ? (
                                <div className="flex items-center justify-center h-[300px]">
                                    <Spin size="large" />
                                </div>
                            ) : chartData && chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                        <XAxis 
                                            dataKey="label" 
                                            stroke="#6B7280"
                                            tick={{ fontSize: 12 }}
                                        />
                                        <YAxis 
                                            stroke="#6B7280"
                                            tick={{ fontSize: 12 }}
                                            tickFormatter={(value) => {
                                                if (value >= 1000000) {
                                                    return `${(value / 1000000).toFixed(1)}M`;
                                                }
                                                if (value >= 1000) {
                                                    return `${(value / 1000).toFixed(0)}K`;
                                                }
                                                return value.toString();
                                            }}
                                        />
                                        <Tooltip 
                                            formatter={(value) => formatCurrency(value)}
                                            contentStyle={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", borderRadius: "8px" }}
                                        />
                                        <Legend />
                                        <Bar dataKey="expense" fill="#EF4444" name="Chi tiêu" radius={[8, 8, 0, 0]} />
                                        <Bar dataKey="income" fill="#10B981" name="Thu nhập" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-[300px] text-gray-400">
                                    <div className="text-center">
                                        <p className="text-lg mb-2">Chưa có dữ liệu</p>
                                        <p className="text-sm">Vui lòng chọn khoảng thời gian khác hoặc thêm giao dịch</p>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
        </div>
    );
};

export default ReportsDashboard;

