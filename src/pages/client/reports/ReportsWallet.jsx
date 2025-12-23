import { useState, useEffect } from "react";
import { Card, Table, Spin, message } from "antd";
import {
    PieChart,
    Pie,
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
import FilterBar from "../../../components/reports/FilterBar";
import {
    getWalletExpenseDistributionAPI,
    compareWalletExpenseOverTimeAPI,
} from "../../../services/api.report";
import { getWalletsAPI } from "../../../services/api.wallet";
import dayjs from "dayjs";

const COLORS = [
    "#10B981",
    "#3B82F6",
    "#8B5CF6",
    "#F59E0B",
    "#EF4444",
    "#EC4899",
    "#14B8A6",
    "#F97316",
];

const ReportsWallet = () => {
    const [loading, setLoading] = useState(false);
    const [pieData, setPieData] = useState([]);
    const [lineData, setLineData] = useState([]);
    const [wallets, setWallets] = useState([]);
    const [totalExpense, setTotalExpense] = useState(0);
    const [filters, setFilters] = useState({
        // Mặc định lấy 6 tháng gần nhất
        startDate: dayjs().subtract(5, "month").startOf("month").format("YYYY-MM-DD"),
        endDate: dayjs().endOf("month").format("YYYY-MM-DD"),
        period: "month",
    });

    useEffect(() => {
        loadWallets();
    }, []);

    useEffect(() => {
        loadData();
    }, [filters]);

    const loadWallets = async () => {
        try {
            const res = await getWalletsAPI();
            // Backend trả về: { status: true, error: 0, data: [...] }
            if ((res?.status === true || res?.error === 0 || res?.EC === 0) && res?.data) {
                const walletsData = Array.isArray(res.data) ? res.data : [];
                setWallets(walletsData);
            } else {
                setWallets([]);
            }
        } catch (error) {
            setWallets([]);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const params = {
                startDate: filters.startDate,
                endDate: filters.endDate,
                period: filters.period || "month",
            };

            const [pieRes, lineRes] = await Promise.all([
                getWalletExpenseDistributionAPI(params),
                compareWalletExpenseOverTimeAPI(params),
            ]);

            // Backend trả về: { status: true, error: 0, data: { distribution: [...], totalExpense: ... } }
            if ((pieRes?.status === true || pieRes?.error === 0 || pieRes?.EC === 0) && pieRes?.data) {
                const data = pieRes.data;
                // getWalletExpenseDistribution trả về { distribution: [...], totalExpense: ... }
                const distribution = data.distribution || data || [];
                const expenseTotal = data.totalExpense || 0;

                // Transform data để đảm bảo có đầy đủ field
                const transformedData = Array.isArray(distribution) ? distribution.map((item) => {
                    const walletType = item.walletType || item.type || "cash";
                    // Helper function để lấy icon dựa trên walletType
                    const getWalletIcon = (type) => {
                        switch (type) {
                            case "bank":
                                return "🏦";
                            case "cash":
                            default:
                                return "💵";
                        }
                    };

                    return {
                        walletId: item.walletId || item._id,
                        walletName: item.walletName || item.name || "Chưa xác định",
                        walletType: walletType,
                        icon: getWalletIcon(walletType),
                        amount: Number(item.totalExpense || item.amount || 0),
                        percentage: Number(item.percentage || (expenseTotal > 0 ? ((item.totalExpense || item.amount || 0) / expenseTotal * 100) : 0)).toFixed(1),
                        income: Number(item.totalIncome || item.income || 0),
                        expense: Number(item.totalExpense || item.expense || 0),
                        balance: Number(item.balance || ((item.totalIncome || 0) - (item.totalExpense || 0))),
                        transactionCount: Number(item.count || item.transactionCount || 0),
                    };
                }) : [];

                setPieData(transformedData);
                setTotalExpense(expenseTotal);
            } else {
                setPieData([]);
                setTotalExpense(0);
            }

            // Backend trả về: { status: true, error: 0, data: [...] }
            if ((lineRes?.status === true || lineRes?.error === 0 || lineRes?.EC === 0) && lineRes?.data) {
                const lineDataArray = Array.isArray(lineRes.data) ? lineRes.data : [];
                // Transform data để format period label
                const transformedLineData = lineDataArray.map((item) => {
                    let periodLabel = "";
                    const period = item.period || {};

                    if (period.date) {
                        periodLabel = dayjs(period.date).format("DD/MM/YYYY");
                    } else if (period.year && period.month) {
                        periodLabel = `Tháng ${period.month}/${period.year}`;
                    } else if (period.year && period.week) {
                        periodLabel = `Tuần ${period.week}/${period.year}`;
                    } else if (period.year) {
                        periodLabel = `Năm ${period.year}`;
                    } else {
                        periodLabel = "N/A";
                    }

                    return {
                        period: periodLabel,
                        walletId: item.walletId,
                        walletName: item.walletName || "Chưa xác định",
                        amount: Number(item.totalExpense || item.amount || 0),
                    };
                });

                setLineData(transformedLineData);
            } else {
                setLineData([]);
            }
        } catch (error) {
            message.error("Có lỗi xảy ra khi tải dữ liệu");
            setPieData([]);
            setLineData([]);
            setTotalExpense(0);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (newFilters) => {
        // Merge filters với newFilters
        const updatedFilters = {
            ...filters,
            ...newFilters,
        };
        setFilters(updatedFilters);
        // useEffect sẽ tự động gọi loadData() khi filters thay đổi
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(value || 0);
    };

    const tableColumns = [
        {
            title: "Ví",
            dataIndex: "walletName",
            key: "walletName",
            render: (text, record, index) => (
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    >
                        {record.icon || "💰"}
                    </div>
                    <div>
                        <div className="font-semibold text-gray-900">{text || "Chưa xác định"}</div>
                        <div className="text-xs text-gray-500">{record.walletType || ""}</div>
                    </div>
                </div>
            ),
        },
        {
            title: "Tổng thu",
            dataIndex: "income",
            key: "income",
            render: (value) => (
                <span className="text-[#10B981] font-semibold">
                    {formatCurrency(value || 0)}
                </span>
            ),
            sorter: (a, b) => (a.income || 0) - (b.income || 0),
        },
        {
            title: "Tổng chi",
            dataIndex: "amount",
            key: "expense",
            render: (value) => (
                <span className="text-[#EF4444] font-semibold">
                    {formatCurrency(value || 0)}
                </span>
            ),
            sorter: (a, b) => (a.amount || 0) - (b.amount || 0),
        },
        {
            title: "Số dư",
            dataIndex: "balance",
            key: "balance",
            render: (value) => (
                <span className="text-[#2563EB] font-semibold">
                    {formatCurrency(value || 0)}
                </span>
            ),
            sorter: (a, b) => (a.balance || 0) - (b.balance || 0),
        },
        {
            title: "Tỷ lệ",
            dataIndex: "percentage",
            key: "percentage",
            render: (value) => (
                <span className="text-gray-600 font-medium">
                    {Number(value || 0).toFixed(1)}%
                </span>
            ),
            sorter: (a, b) => (a.percentage || 0) - (b.percentage || 0),
        },
        {
            title: "Số giao dịch",
            dataIndex: "transactionCount",
            key: "transactionCount",
            render: (value) => (
                <span className="text-gray-600">{value || 0}</span>
            ),
            sorter: (a, b) =>
                (a.transactionCount || 0) - (b.transactionCount || 0),
        },
    ];

    // Prepare line chart data - group by period and wallet
    const prepareLineData = () => {
        const periodMap = {};
        lineData.forEach((item) => {
            const period = item.period || "N/A";
            if (!periodMap[period]) {
                periodMap[period] = {};
            }
            // Sử dụng walletName làm key thay vì walletId
            const walletName = item.walletName || `Wallet ${item.walletId}`;
            periodMap[period][walletName] = (periodMap[period][walletName] || 0) + item.amount;
        });

        // Lấy danh sách tất cả wallet names từ lineData
        const walletNamesSet = new Set();
        lineData.forEach((item) => {
            if (item.walletName) {
                walletNamesSet.add(item.walletName);
            }
        });

        return Object.keys(periodMap)
            .sort()
            .map((period) => {
                const data = { period };
                walletNamesSet.forEach((walletName) => {
                    data[walletName] = periodMap[period][walletName] || 0;
                });
                return data;
            });
    };

    const lineChartData = prepareLineData();
    // Lấy danh sách wallet names từ lineData, tối đa 5 ví
    const walletNamesSet = new Set();
    lineData.forEach((item) => {
        if (item.walletName) {
            walletNamesSet.add(item.walletName);
        }
    });
    const lineKeys = Array.from(walletNamesSet).slice(0, 5);

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    Báo cáo theo Ví
                </h1>
                <p className="text-gray-600 mt-1">
                    Phân tích chi tiêu theo ví
                </p>
            </div>

            {/* Filter Bar */}
            <FilterBar
                onFilterChange={handleFilterChange}
                showPeriod={true}
                defaultDateRange={[
                    dayjs(filters.startDate),
                    dayjs(filters.endDate)
                ]}
            />

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Spin size="large" />
                </div>
            ) : (
                <>
                    {/* Summary Card */}
                    {pieData.length > 0 && (
                        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-0 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Tổng thu nhập</p>
                                    <p className="text-2xl font-bold text-[#10B981]">
                                        {formatCurrency(pieData.reduce((sum, item) => sum + (item.income || 0), 0))}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Tổng chi tiêu</p>
                                    <p className="text-2xl font-bold text-[#EF4444]">
                                        {formatCurrency(totalExpense)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Số dư</p>
                                    <p className="text-2xl font-bold text-[#2563EB]">
                                        {formatCurrency(pieData.reduce((sum, item) => sum + (item.balance || 0), 0))}
                                    </p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 mt-3">
                                Tổng {pieData.length} ví
                            </p>
                        </Card>
                    )}

                    {/* Charts Section */}
                    {pieData.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            {/* Pie Chart */}
                            <Card className="shadow-sm">
                                <h3 className="text-lg font-semibold mb-4">
                                    Phân bổ chi tiêu theo ví
                                </h3>
                                {pieData.some(item => item.amount > 0) ? (
                                    <ResponsiveContainer width="100%" height={400}>
                                        <PieChart>
                                            <Pie
                                                data={pieData.filter(item => item.amount > 0)}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={false}
                                                outerRadius={120}
                                                innerRadius={60}
                                                fill="#8884d8"
                                                dataKey="amount"
                                                nameKey="walletName"
                                                paddingAngle={2}
                                            >
                                                {pieData.filter(item => item.amount > 0).map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={COLORS[index % COLORS.length]}
                                                        stroke="#fff"
                                                        strokeWidth={2}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value, name) => [
                                                    formatCurrency(value),
                                                    name
                                                ]}
                                                labelFormatter={(label) => `Ví: ${label}`}
                                                contentStyle={{
                                                    backgroundColor: "#fff",
                                                    border: "1px solid #E5E7EB",
                                                    borderRadius: "8px",
                                                    padding: "12px"
                                                }}
                                            />
                                            <Legend
                                                formatter={(value, entry) => {
                                                    // Tìm item trong pieData dựa trên walletName hoặc index
                                                    const filteredData = pieData.filter(item => item.amount > 0);
                                                    const index = entry.payload?.index ?? entry.dataIndex ?? -1;
                                                    if (index >= 0 && index < filteredData.length) {
                                                        return filteredData[index].walletName || value;
                                                    }
                                                    // Fallback: tìm theo value
                                                    const item = filteredData.find(p => p.walletName === value || p.walletId === value);
                                                    return item ? item.walletName : value;
                                                }}
                                                iconType="circle"
                                                wrapperStyle={{ paddingTop: "20px" }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-[400px] text-gray-400">
                                        <div className="text-center">
                                            <p className="text-lg mb-2">Chưa có chi tiêu</p>
                                            <p className="text-sm">Tất cả ví đều chưa có giao dịch chi tiêu trong khoảng thời gian này</p>
                                        </div>
                                    </div>
                                )}
                            </Card>

                            {/* Multi-line Chart */}
                            <Card className="shadow-sm">
                                <h3 className="text-lg font-semibold mb-4">
                                    So sánh chi tiêu các ví theo thời gian
                                </h3>
                                {lineChartData.length > 0 && lineKeys.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={400}>
                                        <LineChart data={lineChartData}>
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke="#E5E7EB"
                                            />
                                            <XAxis
                                                dataKey="period"
                                                stroke="#6B7280"
                                            />
                                            <YAxis
                                                stroke="#6B7280"
                                                tickFormatter={(value) => formatCurrency(value)}
                                            />
                                            <Tooltip
                                                formatter={(value) => formatCurrency(value)}
                                                contentStyle={{
                                                    backgroundColor: "#fff",
                                                    border: "1px solid #E5E7EB",
                                                    borderRadius: "8px",
                                                    padding: "12px"
                                                }}
                                            />
                                            <Legend />
                                            {lineKeys.map((key, index) => (
                                                <Line
                                                    key={key}
                                                    type="monotone"
                                                    dataKey={key}
                                                    name={key}
                                                    stroke={COLORS[index % COLORS.length]}
                                                    strokeWidth={2}
                                                    dot={{ r: 4 }}
                                                />
                                            ))}
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-[400px] text-gray-400">
                                        <div className="text-center">
                                            <p className="text-lg mb-2">Chưa có dữ liệu</p>
                                            <p className="text-sm">Không có chi tiêu trong khoảng thời gian này</p>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </div>
                    ) : (
                        <Card className="shadow-sm mb-6">
                            <div className="flex items-center justify-center h-[400px] text-gray-400">
                                <div className="text-center">
                                    <p className="text-lg mb-2">Chưa có dữ liệu chi tiêu</p>
                                    <p className="text-sm">Vui lòng thêm giao dịch chi tiêu trong khoảng thời gian này</p>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Wallets Table */}
                    {pieData.length > 0 && (
                        <Card className="shadow-sm">
                            <h3 className="text-lg font-semibold mb-4">
                                Bảng thống kê ví
                            </h3>
                            <Table
                                columns={tableColumns}
                                dataSource={pieData.map((item, index) => ({
                                    ...item,
                                    key: item.walletId || index,
                                }))}
                                pagination={{
                                    pageSize: 10,
                                    showSizeChanger: true,
                                    showTotal: (total) => `Tổng ${total} ví`,
                                }}
                            />
                        </Card>
                    )}
                </>
            )}
        </div>
    );
};

export default ReportsWallet;

