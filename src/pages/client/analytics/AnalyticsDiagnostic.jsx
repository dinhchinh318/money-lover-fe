import { useState, useEffect } from "react";
import { Card, Spin, message, Badge, Alert, Button, Drawer, Empty } from "antd";
import { AlertTriangle, Clock, TrendingUp, ExternalLink } from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    ReferenceLine,
} from "recharts";
import {
    getCategorySpendingSpikesAPI,
    getMonthlySpendingSpikesAPI,
    getWalletVariationsAPI,
    getMostSpendingDayOfWeekAPI,
    getMostFrequentCategoriesAPI,
    detectUnusualLargeExpensesAPI,
    detectUnusualTimeSpendingAPI,
    detect24hSpendingSpikeAPI,
    getTransactionFrequencyAPI,
} from "../../../services/api.analytics";
import dayjs from "dayjs";
import DateRangePicker from "../../../components/common/DateRangePicker";
import { useNavigate } from "react-router-dom";

const AnalyticsDiagnostic = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState([
        dayjs().subtract(3, "month").startOf("month"),
        dayjs().endOf("month"),
    ]);

    // Card 1: Biến động chi tiêu
    const [categorySpikes, setCategorySpikes] = useState([]);
    const [walletVariations, setWalletVariations] = useState([]);

    // Card 2: Phát hiện bất thường
    const [monthlySpikes, setMonthlySpikes] = useState([]);
    const [monthlyStats, setMonthlyStats] = useState({ mean: 0, threshold: 0 });
    const [unusualLarge, setUnusualLarge] = useState([]);
    const [unusualTime, setUnusualTime] = useState([]);
    const [spike24h, setSpike24h] = useState(null);
    const [hourlySpending, setHourlySpending] = useState([]);

    // Card 3: Thói quen chi tiêu
    const [spendingDays, setSpendingDays] = useState([]);
    const [frequentCategories, setFrequentCategories] = useState([]);
    const [transactionFreq, setTransactionFreq] = useState(null);

    // Drawer state
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [selectedTransactions, setSelectedTransactions] = useState([]);
    const [drawerTitle, setDrawerTitle] = useState("");

    useEffect(() => {
        loadAllData();
    }, [dateRange]);

    const loadAllData = async () => {
        setLoading(true);
        try {
            const startDate = dateRange[0]?.toDate();
            const endDate = dateRange[1]?.toDate();
            
            // Tính số tháng trong khoảng thời gian
            const months = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 30));
            const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
            const weeks = Math.ceil(days / 7);

            await Promise.all([
                loadVariationsData(months),
                loadAnomaliesData(months, days),
                loadHabitsData(weeks, days),
            ]);
        } catch (error) {
            console.error("Error loading diagnostic data:", error);
            message.error("Có lỗi xảy ra khi tải dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    const loadVariationsData = async (months) => {
        try {
            const [catRes, walletRes] = await Promise.all([
                getCategorySpendingSpikesAPI({ months }),
                getWalletVariationsAPI({ months }),
            ]);

            if (catRes?.status === true) {
                const spikes = catRes.data?.spikes || [];
                setCategorySpikes(Array.isArray(spikes) ? spikes : []);
            } else {
                setCategorySpikes([]);
            }

            if (walletRes?.status === true) {
                const variations = walletRes.data || [];
                setWalletVariations(Array.isArray(variations) ? variations : []);
            } else {
                setWalletVariations([]);
            }
        } catch (error) {
            console.error("Error loading variations data:", error);
            setCategorySpikes([]);
            setWalletVariations([]);
        }
    };

    const loadAnomaliesData = async (months, days) => {
        try {
            const [monthRes, largeRes, timeRes, spikeRes] = await Promise.all([
                getMonthlySpendingSpikesAPI({ months }),
                detectUnusualLargeExpensesAPI({ days }),
                detectUnusualTimeSpendingAPI({ days }),
                detect24hSpendingSpikeAPI(),
            ]);

            if (monthRes?.status === true && monthRes?.data) {
                const data = monthRes.data.allMonths || monthRes.data.spikes || [];
                setMonthlySpikes(Array.isArray(data) ? data : []);
                
                // Lưu thống kê để tính threshold
                if (monthRes.data.statistics) {
                    setMonthlyStats({
                        mean: monthRes.data.statistics.mean || 0,
                        threshold: monthRes.data.statistics.threshold || 0,
                    });
                }
            } else {
                setMonthlySpikes([]);
            }

            if (largeRes?.status === true && largeRes?.data) {
                const expenses = largeRes.data.unusualExpenses || [];
                setUnusualLarge(Array.isArray(expenses) ? expenses : []);
            } else {
                setUnusualLarge([]);
            }

            if (timeRes?.status === true && timeRes?.data) {
                const timeSpending = timeRes.data.unusualTimeSpending || [];
                setUnusualTime(Array.isArray(timeSpending) ? timeSpending : []);
                
                // Tạo dữ liệu biểu đồ theo giờ
                const hourDistribution = timeRes.data.hourDistribution || {};
                const hourlyData = Array.from({ length: 24 }, (_, i) => ({
                    hour: `${i}:00`,
                    amount: hourDistribution[i]?.totalAmount || 0,
                    count: hourDistribution[i]?.count || 0,
                }));
                setHourlySpending(hourlyData);
            } else {
                setUnusualTime([]);
                setHourlySpending([]);
            }

            if (spikeRes?.status === true && spikeRes?.data) {
                setSpike24h(spikeRes.data);
            } else {
                setSpike24h(null);
            }
        } catch (error) {
            console.error("Error loading anomalies data:", error);
            setMonthlySpikes([]);
            setUnusualLarge([]);
            setUnusualTime([]);
            setHourlySpending([]);
        }
    };

    const loadHabitsData = async (weeks, days) => {
        try {
            const [dayRes, catRes, freqRes] = await Promise.all([
                getMostSpendingDayOfWeekAPI({ weeks }),
                getMostFrequentCategoriesAPI({ days }),
                getTransactionFrequencyAPI({ days }),
            ]);

            if (dayRes?.status === true && dayRes?.data) {
                const daysData = dayRes.data.days || [];
                
                const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
                const dayMap = {
                    1: "Sun",
                    2: "Mon",
                    3: "Tue",
                    4: "Wed",
                    5: "Thu",
                    6: "Fri",
                    7: "Sat",
                };
                
                const chartData = dayNames.map((day) => {
                    const dayData = Array.isArray(daysData) 
                        ? daysData.find((d) => dayMap[d.dayOfWeek] === day)
                        : null;
                    return {
                        day,
                        amount: dayData?.totalAmount || 0,
                    };
                });
                setSpendingDays(chartData);
            } else {
                setSpendingDays([]);
            }
            
            if (catRes?.status === true) {
                const categories = catRes.data || [];
                setFrequentCategories(Array.isArray(categories) ? categories : []);
            } else {
                setFrequentCategories([]);
            }

            if (freqRes?.status === true && freqRes?.data) {
                setTransactionFreq(freqRes.data);
            } else {
                setTransactionFreq(null);
            }
        } catch (error) {
            console.error("Error loading habits data:", error);
            setSpendingDays([]);
            setFrequentCategories([]);
            setTransactionFreq(null);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(value || 0);
    };

    // Format dữ liệu cho biểu đồ tháng với đánh dấu đột biến
    const formatMonthlyData = () => {
        if (!monthlySpikes || monthlySpikes.length === 0) return [];
        
        return monthlySpikes.map((item) => {
            const amount = item.totalAmount || 0;
            const isSpike = monthlyStats.threshold > 0 && amount > monthlyStats.threshold;
            
            return {
                month: item.label || `Tháng ${item.month}/${item.year}`,
                amount,
                isSpike,
                deviation: item.deviation || 0,
                deviationPercent: item.deviationPercent || 0,
            };
        });
    };

    // Xử lý click vào cảnh báo
    const handleAlertClick = (type, data) => {
        if (type === "large") {
            // Hiển thị drawer với danh sách giao dịch chi quá lớn
            setDrawerTitle("Khoản chi quá lớn");
            setSelectedTransactions(
                unusualLarge.map((expense) => ({
                    id: expense.transactionId,
                    amount: expense.amount,
                    date: expense.date,
                    note: expense.note,
                    category: expense.category?.name || expense.categoryName,
                    wallet: expense.wallet?.name || expense.walletName,
                }))
            );
            setDrawerVisible(true);
        } else if (type === "time") {
            // Hiển thị drawer với danh sách giao dịch vào thời điểm lạ
            setDrawerTitle("Chi vào thời điểm bất thường");
            setSelectedTransactions(
                unusualTime.map((expense) => ({
                    id: expense.transactionId,
                    amount: expense.amount,
                    date: expense.date,
                    hour: expense.hour,
                    note: expense.note,
                    category: expense.category?.name || expense.categoryName,
                    reason: expense.reason,
                }))
            );
            setDrawerVisible(true);
        } else if (type === "month") {
            // Navigate đến trang transactions với filter theo tháng
            const monthData = data;
            const monthStart = new Date(monthData.year, monthData.month - 1, 1);
            const monthEnd = new Date(monthData.year, monthData.month, 0, 23, 59, 59);
            navigate(`/transactions?startDate=${dayjs(monthStart).format("YYYY-MM-DD")}&endDate=${dayjs(monthEnd).format("YYYY-MM-DD")}&type=expense`);
        }
    };

    const handleViewAllTransactions = () => {
        setDrawerVisible(false);
        navigate("/transactions");
    };

    // Custom tooltip cho biểu đồ
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                    <p className="font-semibold text-gray-800 mb-1">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            <span className="font-medium">{entry.name || "Số tiền"}:</span>{" "}
                            {formatCurrency(entry.value)}
                        </p>
                    ))}
                    {payload[0]?.payload?.isSpike && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                            <AlertTriangle size={12} />
                            Vượt trung bình {payload[0].payload.deviationPercent?.toFixed(1)}%
                        </p>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    Phân tích Nguyên nhân
                </h1>
                <p className="text-gray-600 mt-1">
                    Phân tích biến động, phát hiện bất thường và thói quen chi tiêu
                </p>
            </div>

            {/* Date Range Picker */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chọn khoảng thời gian:
                </label>
                <DateRangePicker
                    value={dateRange}
                    onChange={setDateRange}
                    format="DD/MM/YYYY"
                    className="w-full max-w-md"
                />
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Spin size="large" />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Card 1: Biến động chi tiêu */}
                    <Card 
                        title="Biến động chi tiêu" 
                        className="shadow-sm"
                    >
                        <div className="space-y-4">
                            {/* Danh mục tăng mạnh bất thường */}
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                                <div className="text-sm font-semibold text-yellow-800">
                                    Danh mục tăng mạnh bất thường
                                </div>
                            </div>
                            {categorySpikes.length > 0 ? (
                                <div className="space-y-2">
                                    {categorySpikes.slice(0, 5).map((item, index) => (
                                        <Alert
                                            key={index}
                                            message={item.categoryName}
                                            description={`Tăng ${item.growthPercent?.toFixed(1) || 0}% so với kỳ trước`}
                                            type={item.growthPercent > 50 ? "warning" : "info"}
                                            showIcon
                                            size="small"
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-sm text-gray-500 text-center py-4">
                                    Không có dữ liệu
                                </div>
                            )}

                            {/* Biến động theo từng Ví */}
                            <div className="mt-6">
                                <div className="text-sm font-semibold text-gray-700 mb-3">
                                    Biến động theo từng Ví
                                </div>
                                {walletVariations.length > 0 ? (
                                    <div className="space-y-2">
                                        {walletVariations.map((wallet, index) => (
                                            <div
                                                key={index}
                                                className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                                                title="Hover để xem chi tiết"
                                            >
                                                <div className="text-sm font-semibold mb-1">
                                                    {wallet.walletName}
                                                </div>
                                                <div className="text-xs text-gray-600">
                                                    Biến động: {wallet.changePercent?.toFixed(1) || wallet.variation || 0}%
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-sm text-gray-500 text-center py-4">
                                        Không có dữ liệu
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Card 2: Phát hiện bất thường */}
                    <Card 
                        title="Phát hiện bất thường" 
                        className="shadow-sm"
                    >
                        <div className="space-y-4">
                            {/* Cảnh báo khoản chi quá lớn */}
                            {unusualLarge.length > 0 && (
                                <div 
                                    className="bg-red-50 border-2 border-red-300 rounded-lg p-3 mb-4 cursor-pointer hover:bg-red-100 transition-colors"
                                    onClick={() => handleAlertClick("large")}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle className="text-red-600" size={20} />
                                        <div className="text-sm font-semibold text-red-800">
                                            Khoản chi quá lớn
                                        </div>
                                    </div>
                                    <div className="text-xs text-red-700">
                                        {unusualLarge.length} giao dịch bất thường - Click để xem chi tiết
                                    </div>
                                </div>
                            )}

                            {/* Cảnh báo chi vào thời điểm lạ */}
                            {unusualTime.length > 0 && (
                                <div 
                                    className="bg-orange-50 border-2 border-orange-300 rounded-lg p-3 mb-4 cursor-pointer hover:bg-orange-100 transition-colors"
                                    onClick={() => handleAlertClick("time")}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="text-orange-600" size={20} />
                                        <div className="text-sm font-semibold text-orange-800">
                                            Chi vào thời điểm lạ
                                        </div>
                                    </div>
                                    <div className="text-xs text-orange-700">
                                        {unusualTime.length} giao dịch - Click để xem chi tiết
                                    </div>
                                </div>
                            )}

                            {/* Tháng phát sinh Chi tiêu đột biến */}
                            <div className="text-sm font-semibold text-gray-700 mb-3">
                                Tháng phát sinh Chi tiêu đột biến
                            </div>
                            {monthlySpikes.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={formatMonthlyData()}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                        <XAxis 
                                            dataKey="month" 
                                            stroke="#6B7280"
                                            angle={-45}
                                            textAnchor="end"
                                            height={80}
                                            fontSize={10}
                                        />
                                        <YAxis stroke="#6B7280" />
                                        {monthlyStats.threshold > 0 && (
                                            <ReferenceLine 
                                                y={monthlyStats.threshold} 
                                                stroke="#EF4444" 
                                                strokeDasharray="5 5"
                                                label={{ value: "Ngưỡng", position: "right" }}
                                            />
                                        )}
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar 
                                            dataKey="amount" 
                                            onClick={(data) => {
                                                if (data.isSpike) {
                                                    const monthData = monthlySpikes.find(
                                                        m => (m.label || `Tháng ${m.month}/${m.year}`) === data.month
                                                    );
                                                    if (monthData) handleAlertClick("month", monthData);
                                                }
                                            }}
                                            style={{ cursor: "pointer" }}
                                        >
                                            {formatMonthlyData().map((entry, index) => (
                                                <Cell 
                                                    key={`cell-${index}`} 
                                                    fill={entry.isSpike ? "#EF4444" : "#F59E0B"} 
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-[250px] border border-gray-200 rounded-lg">
                                    <div className="text-sm text-gray-500">
                                        Không có dữ liệu
                                    </div>
                                </div>
                            )}

                            {/* Phân tích khung giờ chi tiêu */}
                            {hourlySpending.length > 0 && (
                                <div className="mt-4">
                                    <div className="text-sm font-semibold text-gray-700 mb-3">
                                        Phân tích khung giờ chi tiêu
                                    </div>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <BarChart data={hourlySpending}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                            <XAxis 
                                                dataKey="hour" 
                                                stroke="#6B7280"
                                                fontSize={9}
                                            />
                                            <YAxis stroke="#6B7280" />
                                            <Tooltip 
                                                formatter={(value) => formatCurrency(value)}
                                                labelStyle={{ color: "#374151" }}
                                            />
                                            <Bar dataKey="amount" fill="#8B5CF6" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            {/* Chi tăng đột biến 24h */}
                            {spike24h && spike24h.isSpike && (
                                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="text-yellow-600" size={16} />
                                        <div className="text-sm font-semibold text-yellow-800">
                                            Chi tăng đột biến 24h
                                        </div>
                                    </div>
                                    <div className="text-xs text-yellow-700">
                                        Tăng {spike24h.changePercent?.toFixed(1) || 0}% so với 24h trước
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Card 3: Thói quen Chi tiêu */}
                    <Card 
                        title="Thói quen Chi tiêu" 
                        className="shadow-sm"
                    >
                        <div className="space-y-4">
                            {/* Ngày trong Tuần chi nhiều nhất */}
                            <div className="text-sm font-semibold text-gray-700 mb-3">
                                Ngày trong Tuần chi nhiều nhất
                            </div>
                            {spendingDays.length > 0 ? (
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={spendingDays}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                        <XAxis dataKey="day" stroke="#6B7280" />
                                        <YAxis stroke="#6B7280" />
                                        <Tooltip 
                                            formatter={(value) => formatCurrency(value)}
                                            labelStyle={{ color: "#374151" }}
                                        />
                                        <Bar dataKey="amount" fill="#10B981" />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-[200px] border border-gray-200 rounded-lg mb-4">
                                    <div className="text-sm text-gray-500">
                                        Không có dữ liệu
                                    </div>
                                </div>
                            )}

                            {/* Tần suất giao dịch */}
                            {transactionFreq && (
                                <div className="mt-4">
                                    <div className="text-sm font-semibold text-gray-700 mb-3">
                                        Tần suất giao dịch
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="text-center p-2 bg-gray-50 rounded">
                                            <div className="text-lg font-bold text-[#10B981]">
                                                {transactionFreq.frequency?.perDay?.toFixed(1) || 0}
                                            </div>
                                            <div className="text-xs text-gray-600">Giao dịch/ngày</div>
                                        </div>
                                        <div className="text-center p-2 bg-gray-50 rounded">
                                            <div className="text-lg font-bold text-[#3B82F6]">
                                                {transactionFreq.frequency?.perWeek?.toFixed(1) || 0}
                                            </div>
                                            <div className="text-xs text-gray-600">Giao dịch/tuần</div>
                                        </div>
                                        <div className="text-center p-2 bg-gray-50 rounded">
                                            <div className="text-lg font-bold text-[#8B5CF6]">
                                                {transactionFreq.frequency?.perMonth?.toFixed(1) || 0}
                                            </div>
                                            <div className="text-xs text-gray-600">Giao dịch/tháng</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Danh mục phát sinh nhiều nhất */}
                            <div className="mt-4">
                                <div className="text-sm font-semibold text-gray-700 mb-3">
                                    Danh mục phát sinh nhiều nhất
                                </div>
                                {frequentCategories.length > 0 ? (
                                    <div className="space-y-2">
                                        {frequentCategories.slice(0, 5).map((item, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                                title={`Hover để xem chi tiết - ${item.count} giao dịch`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Badge 
                                                        count={index + 1} 
                                                        style={{ backgroundColor: "#10B981" }} 
                                                    />
                                                    <span className="text-sm font-medium">
                                                        {item.categoryName}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-gray-600">
                                                    {item.count} giao dịch
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-sm text-gray-500 text-center py-4">
                                        Không có dữ liệu
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Drawer hiển thị danh sách giao dịch */}
            <Drawer
                title={
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="text-red-600" size={20} />
                        <span>{drawerTitle}</span>
                    </div>
                }
                placement="right"
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
                width={600}
                extra={
                    <Button 
                        type="primary" 
                        icon={<ExternalLink size={16} />}
                        onClick={handleViewAllTransactions}
                    >
                        Xem tất cả giao dịch
                    </Button>
                }
            >
                {selectedTransactions.length > 0 ? (
                    <div className="space-y-3">
                        {selectedTransactions.map((transaction, index) => (
                            <Card
                                key={index}
                                size="small"
                                className="hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => navigate(`/transactions?id=${transaction.id}`)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="font-semibold text-gray-900 mb-1">
                                            {transaction.category || transaction.categoryName}
                                        </div>
                                        {transaction.note && (
                                            <div className="text-sm text-gray-600 mb-1">
                                                {transaction.note}
                                            </div>
                                        )}
                                        <div className="text-xs text-gray-500">
                                            {dayjs(transaction.date).format("DD/MM/YYYY HH:mm")}
                                            {transaction.hour !== undefined && ` - ${transaction.hour}:00`}
                                            {transaction.wallet && ` • ${transaction.wallet}`}
                                        </div>
                                        {transaction.reason && (
                                            <div className="text-xs text-orange-600 mt-1">
                                                {transaction.reason}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-lg font-bold text-red-600 ml-4">
                                        {formatCurrency(transaction.amount)}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Empty description="Không có giao dịch nào" />
                )}
            </Drawer>
        </div>
    );
};

export default AnalyticsDiagnostic;
