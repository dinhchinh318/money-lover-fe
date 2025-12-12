import { useState, useEffect } from "react";
import { Card, Spin, Alert, Badge } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import {
    BarChart,
    Bar,
    Cell,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import {
    getCategorySpendingSpikesAPI,
    getWalletVariationsAPI,
    detectUnusualLargeExpensesAPI,
    detectUnusualTimeSpendingAPI,
    detect24hSpendingSpikeAPI,
    getMostSpendingDayOfWeekAPI,
    getMostFrequentCategoriesAPI,
    getTransactionFrequencyAPI,
} from "../../../services/api.analytics";
import DateRangePicker from "../../../components/common/DateRangePicker";
import dayjs from "dayjs";

const AnalyticsDashboard = () => {
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState([
        dayjs().subtract(3, "month").startOf("month"),
        dayjs().endOf("month"),
    ]);

    // Column A: Spending Fluctuations
    const [categorySpikes, setCategorySpikes] = useState([]);
    const [walletVariations, setWalletVariations] = useState([]);

    // Column B: Anomaly Detection
    const [unusualLarge, setUnusualLarge] = useState([]);
    const [unusualTime, setUnusualTime] = useState([]);
    const [spike24h, setSpike24h] = useState(null);
    const [monthlySpikes, setMonthlySpikes] = useState([]);

    // Column C: Spending Habits
    const [spendingDays, setSpendingDays] = useState([]);
    const [frequentCategories, setFrequentCategories] = useState([]);
    const [transactionFreq, setTransactionFreq] = useState(null);

    useEffect(() => {
        loadAllData();
    }, [dateRange]);

    const loadAllData = async () => {
        setLoading(true);
        try {
            const params = {
                startDate: dateRange[0].format("YYYY-MM-DD"),
                endDate: dateRange[1].format("YYYY-MM-DD"),
            };

            const [
                catSpikesRes,
                walletVarRes,
                largeRes,
                timeRes,
                spikeRes,
                monthRes,
                dayRes,
                freqCatRes,
                transFreqRes,
            ] = await Promise.all([
                getCategorySpendingSpikesAPI(params),
                getWalletVariationsAPI(params),
                detectUnusualLargeExpensesAPI(params),
                detectUnusualTimeSpendingAPI(params),
                detect24hSpendingSpikeAPI(params),
                getMostSpendingDayOfWeekAPI(params),
                getMostFrequentCategoriesAPI(params),
                getTransactionFrequencyAPI(params),
            ]);

            if (catSpikesRes?.EC === 0) {
                setCategorySpikes(catSpikesRes.data?.spikes || []);
            }
            if (walletVarRes?.EC === 0) {
                setWalletVariations(walletVarRes.data?.variations || []);
            }
            if (largeRes?.EC === 0) {
                setUnusualLarge(largeRes.data?.expenses || []);
            }
            if (timeRes?.EC === 0) {
                setUnusualTime(timeRes.data?.timeSlots || []);
            }
            if (spikeRes?.EC === 0) {
                setSpike24h(spikeRes.data);
            }
            if (monthRes?.EC === 0) {
                setMonthlySpikes(monthRes.data?.allMonths || []);
            }
            if (dayRes?.EC === 0) {
                setSpendingDays(dayRes.data?.days || []);
            }
            if (freqCatRes?.EC === 0) {
                setFrequentCategories(freqCatRes.data?.categories || []);
            }
            if (transFreqRes?.EC === 0) {
                setTransactionFreq(transFreqRes.data);
            }
        } catch (error) {
            console.error("Error loading analytics data:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(value || 0);
    };

    // Prepare monthly spikes data for chart
    const averageAmount =
        monthlySpikes.length > 0
            ? monthlySpikes.reduce((sum, item) => sum + (item.totalAmount || 0), 0) /
              monthlySpikes.length
            : 0;

    const monthlySpikesData = monthlySpikes.map((item, index) => ({
        month: `T${index + 1}`,
        amount: item.totalAmount || 0,
        isSpike: (item.totalAmount || 0) > averageAmount * 1.5,
    }));

    // Prepare spending days data
    const daysData = [
        { day: "Mon", amount: 0 },
        { day: "Tue", amount: 0 },
        { day: "Wed", amount: 0 },
        { day: "Thu", amount: 0 },
        { day: "Fri", amount: 0 },
        { day: "Sat", amount: 0 },
        { day: "Sun", amount: 0 },
    ];

    spendingDays.forEach((item) => {
        const dayMap = {
            "Monday": "Mon",
            "Tuesday": "Tue",
            "Wednesday": "Wed",
            "Thursday": "Thu",
            "Friday": "Fri",
            "Saturday": "Sat",
            "Sunday": "Sun",
        };
        const dayKey = dayMap[item.day] || item.day;
        const dayIndex = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(dayKey);
        if (dayIndex !== -1) {
            daysData[dayIndex].amount = item.totalAmount || item.amount || 0;
        }
    });

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Phân tích Nguyên nhân
                </h1>
                <p className="text-gray-600">
                    Phân tích biến động, phát hiện bất thường và thói quen chi tiêu
                </p>
            </div>

            {/* Date Range Selector */}
            <div className="mb-6 flex items-center gap-4">
                <span className="text-sm text-gray-600">Chọn khoảng thời gian:</span>
                <DateRangePicker
                    value={dateRange}
                    onChange={setDateRange}
                    format="DD/MM/YYYY"
                />
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Spin size="large" />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Column A: Biến động chi tiêu */}
                    <div className="space-y-6">
                        <Card className="shadow-sm">
                            <h3 className="text-lg font-semibold mb-4">
                                Biến động chi tiêu
                            </h3>

                            {/* A1: Danh mục tăng mạnh bất thường */}
                            <div className="mb-6">
                                <Alert
                                    message="Danh mục tăng mạnh bất thường"
                                    type="warning"
                                    icon={<ExclamationCircleOutlined />}
                                    className="mb-4"
                                />
                                <div className="space-y-3">
                                    {categorySpikes.slice(0, 3).map((item, index) => (
                                        <div
                                            key={index}
                                            className="p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl">
                                                        {item.categoryIcon || "📊"}
                                                    </span>
                                                    <span className="font-semibold">
                                                        {item.categoryName}
                                                    </span>
                                                </div>
                                                <Badge
                                                    count={`Tăng ${item.growthPercent?.toFixed(0) || 0}%`}
                                                    style={{ backgroundColor: "#F59E0B" }}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">
                                                    {formatCurrency(item.totalAmount)} vs{" "}
                                                    {formatCurrency(item.previousAmount || 0)}
                                                </span>
                                            </div>
                                            {/* Mini line chart placeholder */}
                                            <div className="mt-2 h-8 bg-gray-100 rounded flex items-end gap-1">
                                                {[1, 2, 3].map((i) => (
                                                    <div
                                                        key={i}
                                                        className="flex-1 bg-[#10B981] rounded-t"
                                                        style={{
                                                            height: `${60 + i * 10}%`,
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* A3: Biến động theo từng Ví */}
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-3">
                                    Biến động theo từng Ví
                                </h4>
                                <div className="space-y-3">
                                    {walletVariations.slice(0, 3).map((wallet, index) => (
                                        <Card key={index} size="small" className="bg-gray-50">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl">
                                                        {wallet.icon || "💰"}
                                                    </span>
                                                    <span className="font-semibold">
                                                        {wallet.walletName}
                                                    </span>
                                                </div>
                                                <span className="text-lg font-bold">
                                                    {formatCurrency(wallet.balance)}
                                                </span>
                                            </div>
                                            {/* Mini line chart */}
                                            <div className="mt-2 h-8 bg-gray-100 rounded flex items-end gap-1">
                                                {[1, 2, 3].map((i) => (
                                                    <div
                                                        key={i}
                                                        className={`flex-1 rounded-t ${
                                                            wallet.variation > 0
                                                                ? "bg-[#10B981]"
                                                                : wallet.variation < 0
                                                                ? "bg-[#EF4444]"
                                                                : "bg-gray-400"
                                                        }`}
                                                        style={{
                                                            height: `${50 + i * 5}%`,
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                            <div className="mt-2 flex items-center justify-between text-xs">
                                                <span className="text-gray-500">3 tháng</span>
                                                <span
                                                    className={`font-semibold ${
                                                        wallet.variation > 0
                                                            ? "text-[#10B981]"
                                                            : wallet.variation < 0
                                                            ? "text-[#EF4444]"
                                                            : "text-gray-600"
                                                    }`}
                                                >
                                                    {wallet.variation > 0 ? "↑" : wallet.variation < 0 ? "↓" : "→"}
                                                    {Math.abs(wallet.variation || 0)}%
                                                    {wallet.variation > 0
                                                        ? " Tăng"
                                                        : wallet.variation < 0
                                                        ? " Giảm"
                                                        : " Ổn định"}
                                                </span>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Column B: Phát hiện bất thường */}
                    <div className="space-y-6">
                        <Card className="shadow-sm">
                            <h3 className="text-lg font-semibold mb-4">
                                Phát hiện bất thường
                            </h3>

                            {/* Alert Banner */}
                            {unusualLarge.length > 0 && (
                                <Alert
                                    message="Khoản chi quá lớn"
                                    description="Khoản chi quá lớn, Chờ trong Chi vào Thời điểm bất thường"
                                    type="error"
                                    className="mb-4"
                                />
                            )}

                            {/* A2: Tháng phát sinh chi tiêu đột biến */}
                            <div className="mb-6">
                                <h4 className="font-semibold text-gray-700 mb-3">
                                    Tháng phát sinh Chi tiêu đột biến
                                </h4>
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={monthlySpikesData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                        <XAxis dataKey="month" stroke="#6B7280" />
                                        <YAxis stroke="#6B7280" />
                                        <Tooltip formatter={(value) => formatCurrency(value)} />
                                        <Bar dataKey="amount">
                                            {monthlySpikesData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.isSpike ? "#F59E0B" : "#3B82F6"}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                                {averageAmount > 0 && (
                                    <div className="mt-2 text-xs text-gray-600 text-center">
                                        TB average: {formatCurrency(averageAmount)}
                                    </div>
                                )}
                            </div>

                            {/* Chi vào Thời điểm bất thường */}
                            {unusualTime.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="font-semibold text-gray-700 mb-2 text-sm">
                                        Chi vào Thời điểm bất thường
                                    </h4>
                                    <div className="relative h-8 bg-gray-100 rounded">
                                        {unusualTime.map((item, index) => (
                                            <div
                                                key={index}
                                                className="absolute h-full bg-[#F59E0B] rounded"
                                                style={{
                                                    left: `${(item.hour / 24) * 100}%`,
                                                    width: `${(item.duration / 24) * 100}%`,
                                                }}
                                                title={`${item.hour}h - ${item.hour + item.duration}h`}
                                            />
                                        ))}
                                        <div className="absolute inset-0 flex items-center justify-between px-2 text-xs text-gray-600">
                                            <span>0h</span>
                                            <span>12h</span>
                                            <span>24h</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Chi tăng đột biến 24h */}
                            {spike24h && (
                                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-red-600 mb-1">
                                            24h
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Chi tăng đột biến
                                        </div>
                                        <div className="text-lg font-semibold text-red-600 mt-2">
                                            {formatCurrency(spike24h.amount)}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Column C: Thói quen Chi tiêu */}
                    <div className="space-y-6">
                        <Card className="shadow-sm">
                            <h3 className="text-lg font-semibold mb-4">
                                Thói quen Chi tiêu
                            </h3>

                            {/* Ngày trong Tuần chi nhiều nhất */}
                            <div className="mb-6">
                                <h4 className="font-semibold text-gray-700 mb-3">
                                    Ngày trong Tuần chi nhiều nhất
                                </h4>
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={daysData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                        <XAxis dataKey="day" stroke="#6B7280" />
                                        <YAxis stroke="#6B7280" />
                                        <Tooltip formatter={(value) => formatCurrency(value)} />
                                        <Bar dataKey="amount" fill="#10B981" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Danh mục phát sinh nhiều nhất */}
                            <div className="mb-6">
                                <h4 className="font-semibold text-gray-700 mb-3">
                                    Danh mục phát sinh nhiều nhất
                                </h4>
                                <div className="space-y-3">
                                    {frequentCategories.slice(0, 3).map((item, index) => (
                                        <div
                                            key={index}
                                            className="p-3 bg-gray-50 rounded-lg"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl">
                                                        {item.categoryIcon || item.icon || "📊"}
                                                    </span>
                                                    <span className="font-semibold">
                                                        {item.categoryName}
                                                    </span>
                                                </div>
                                                <span className="font-bold text-[#10B981]">
                                                    {formatCurrency(item.totalAmount || item.amount || 0)}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-600 mb-2">
                                                {item.count || 0} giao dịch
                                            </div>
                                            {/* Mini line chart */}
                                            <div className="h-6 bg-gray-100 rounded flex items-end gap-1">
                                                {[1, 2, 3].map((i) => (
                                                    <div
                                                        key={i}
                                                        className="flex-1 bg-[#10B981] rounded-t"
                                                        style={{
                                                            height: `${40 + i * 10}%`,
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Tần suất Giao dịch */}
                            {transactionFreq && (
                                <div>
                                    <h4 className="font-semibold text-gray-700 mb-3">
                                        Tần suất Giao dịch
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-blue-50 rounded-lg">
                                            <div className="text-xs text-gray-600 mb-1">
                                                Tần suất
                                            </div>
                                            <div className="text-xl font-bold text-blue-600">
                                                {formatCurrency(transactionFreq.frequency || 0)}
                                            </div>
                                        </div>
                                        <div className="p-3 bg-green-50 rounded-lg">
                                            <div className="text-xs text-gray-600 mb-1">
                                                Lượng Giao dịch
                                            </div>
                                            <div className="text-lg font-bold text-green-600">
                                                {transactionFreq.daily || 0} từ ngày
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalyticsDashboard;

