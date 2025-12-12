import { useState, useEffect } from "react";
import { Card, Tabs, Spin, message, Badge, Alert } from "antd";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import {
    getCategorySpendingSpikesAPI,
    getMonthlySpendingSpikesAPI,
    getWalletVariationsAPI,
    detectUnusualLargeExpensesAPI,
    detectUnusualTimeSpendingAPI,
    detect24hSpendingSpikeAPI,
    getMostSpendingDayOfWeekAPI,
    getMostFrequentCategoriesAPI,
    getTransactionFrequencyAPI,
} from "../../../services/api.analytics";
import dayjs from "dayjs";

const COLORS = ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444"];

const AnalyticsDiagnostic = () => {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("variations");

    // Tab 1: Biến động chi tiêu
    const [categorySpikes, setCategorySpikes] = useState([]);
    const [monthlySpikes, setMonthlySpikes] = useState([]);
    const [walletVariations, setWalletVariations] = useState([]);

    // Tab 2: Phát hiện bất thường
    const [unusualLarge, setUnusualLarge] = useState([]);
    const [unusualTime, setUnusualTime] = useState([]);
    const [spike24h, setSpike24h] = useState(null);

    // Tab 3: Thói quen chi tiêu
    const [spendingDays, setSpendingDays] = useState([]);
    const [frequentCategories, setFrequentCategories] = useState([]);
    const [transactionFreq, setTransactionFreq] = useState(null);

    useEffect(() => {
        loadTabData(activeTab);
    }, [activeTab]);

    const loadTabData = async (tab) => {
        setLoading(true);
        try {
            switch (tab) {
                case "variations":
                    await loadVariationsData();
                    break;
                case "anomalies":
                    await loadAnomaliesData();
                    break;
                case "habits":
                    await loadHabitsData();
                    break;
            }
        } catch (error) {
            console.error("Error loading diagnostic data:", error);
            message.error("Có lỗi xảy ra khi tải dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    const loadVariationsData = async () => {
        const [catRes, monthRes, walletRes] = await Promise.all([
            getCategorySpendingSpikesAPI(),
            getMonthlySpendingSpikesAPI(),
            getWalletVariationsAPI(),
        ]);

        if (catRes?.EC === 0) setCategorySpikes(catRes.data || []);
        if (monthRes?.EC === 0) setMonthlySpikes(monthRes.data || []);
        if (walletRes?.EC === 0) setWalletVariations(walletRes.data || []);
    };

    const loadAnomaliesData = async () => {
        const [largeRes, timeRes, spikeRes] = await Promise.all([
            detectUnusualLargeExpensesAPI(),
            detectUnusualTimeSpendingAPI(),
            detect24hSpendingSpikeAPI(),
        ]);

        if (largeRes?.EC === 0) setUnusualLarge(largeRes.data || []);
        if (timeRes?.EC === 0) setUnusualTime(timeRes.data || []);
        if (spikeRes?.EC === 0) setSpike24h(spikeRes.data);
    };

    const loadHabitsData = async () => {
        const [dayRes, catRes, freqRes] = await Promise.all([
            getMostSpendingDayOfWeekAPI(),
            getMostFrequentCategoriesAPI(),
            getTransactionFrequencyAPI(),
        ]);

        if (dayRes?.EC === 0) setSpendingDays(dayRes.data || []);
        if (catRes?.EC === 0) setFrequentCategories(catRes.data || []);
        if (freqRes?.EC === 0) setTransactionFreq(freqRes.data);
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(value || 0);
    };

    const tabItems = [
        {
            key: "variations",
            label: "Biến động chi tiêu",
            children: (
                <div className="space-y-6">
                    {/* Category Spikes */}
                    <Card title="Danh mục tăng mạnh bất thường" className="shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {categorySpikes.map((item, index) => (
                                <Alert
                                    key={index}
                                    message={item.categoryName}
                                    description={`Tăng ${item.percentage || 0}% so với kỳ trước`}
                                    type={item.percentage > 50 ? "warning" : "info"}
                                    showIcon
                                    className="mb-2"
                                />
                            ))}
                        </div>
                    </Card>

                    {/* Monthly Spikes */}
                    <Card title="Tháng phát sinh chi tiêu đột biến" className="shadow-sm">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={monthlySpikes}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                <XAxis dataKey="month" stroke="#6B7280" />
                                <YAxis stroke="#6B7280" />
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                                <Legend />
                                <Bar dataKey="amount" fill="#F59E0B" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* Wallet Variations */}
                    <Card title="Biến động theo từng ví" className="shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {walletVariations.map((wallet, index) => (
                                <Card key={index} size="small" className="bg-gray-50">
                                    <div className="text-sm font-semibold mb-2">{wallet.walletName}</div>
                                    <div className="text-xs text-gray-600">
                                        Biến động: {wallet.variation || 0}%
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </Card>
                </div>
            ),
        },
        {
            key: "anomalies",
            label: "Phát hiện bất thường",
            children: (
                <div className="space-y-6">
                    {/* Unusual Large Expenses */}
                    <Card title="Khoản chi quá lớn" className="shadow-sm">
                        <div className="space-y-3">
                            {unusualLarge.map((item, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200"
                                >
                                    <div>
                                        <div className="font-semibold">{item.categoryName}</div>
                                        <div className="text-sm text-gray-600">{item.note}</div>
                                        <div className="text-xs text-gray-500">
                                            {dayjs(item.date).format("DD/MM/YYYY HH:mm")}
                                        </div>
                                    </div>
                                    <Badge
                                        count="Bất thường"
                                        style={{ backgroundColor: "#EF4444" }}
                                    />
                                    <div className="text-lg font-bold text-red-600">
                                        {formatCurrency(item.amount)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Unusual Time Spending */}
                    <Card title="Chi vào thời điểm bất thường" className="shadow-sm">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={unusualTime}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                <XAxis dataKey="hour" stroke="#6B7280" />
                                <YAxis stroke="#6B7280" />
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                                <Bar dataKey="amount" fill="#EF4444" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* 24h Spike */}
                    {spike24h && (
                        <Card title="Chi tăng đột biến 24h" className="shadow-sm">
                            <div className="flex items-center justify-between p-6 bg-yellow-50 rounded-lg">
                                <div>
                                    <div className="text-lg font-semibold mb-2">
                                        Tăng {spike24h.percentage || 0}% so với ngày trước
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Ngày: {dayjs(spike24h.date).format("DD/MM/YYYY")}
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-yellow-600">
                                    {formatCurrency(spike24h.amount)}
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            ),
        },
        {
            key: "habits",
            label: "Thói quen chi tiêu",
            children: (
                <div className="space-y-6">
                    {/* Spending by Day of Week */}
                    <Card title="Ngày trong tuần chi nhiều nhất" className="shadow-sm">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={spendingDays}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                <XAxis dataKey="day" stroke="#6B7280" />
                                <YAxis stroke="#6B7280" />
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                                <Bar dataKey="amount" fill="#10B981" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* Frequent Categories */}
                    <Card title="Danh mục phát sinh nhiều nhất" className="shadow-sm">
                        <div className="space-y-3">
                            {frequentCategories.slice(0, 10).map((item, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <Badge count={index + 1} style={{ backgroundColor: "#10B981" }} />
                                        <span className="font-medium">{item.categoryName}</span>
                                    </div>
                                    <span className="text-sm text-gray-600">
                                        {item.count} giao dịch
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Transaction Frequency */}
                    {transactionFreq && (
                        <Card title="Tần suất giao dịch" className="shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <Card size="small" className="text-center">
                                    <div className="text-2xl font-bold text-[#10B981]">
                                        {transactionFreq.daily || 0}
                                    </div>
                                    <div className="text-sm text-gray-600">Giao dịch/ngày</div>
                                </Card>
                                <Card size="small" className="text-center">
                                    <div className="text-2xl font-bold text-[#3B82F6]">
                                        {transactionFreq.weekly || 0}
                                    </div>
                                    <div className="text-sm text-gray-600">Giao dịch/tuần</div>
                                </Card>
                                <Card size="small" className="text-center">
                                    <div className="text-2xl font-bold text-[#8B5CF6]">
                                        {transactionFreq.monthly || 0}
                                    </div>
                                    <div className="text-sm text-gray-600">Giao dịch/tháng</div>
                                </Card>
                            </div>
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: "Hàng ngày", value: transactionFreq.daily || 0 },
                                            { name: "Hàng tuần", value: transactionFreq.weekly || 0 },
                                            { name: "Hàng tháng", value: transactionFreq.monthly || 0 },
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {[0, 1, 2].map((index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </Card>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="max-w-7xl mx-auto p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Phân tích Nguyên nhân (Diagnostic Analytics)
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Phân tích biến động, phát hiện bất thường và thói quen chi tiêu
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

export default AnalyticsDiagnostic;

