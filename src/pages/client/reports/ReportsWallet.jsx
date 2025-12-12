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
    const [filters, setFilters] = useState({
        startDate: dayjs().startOf("month").format("YYYY-MM-DD"),
        endDate: dayjs().endOf("month").format("YYYY-MM-DD"),
    });

    useEffect(() => {
        loadWallets();
        loadData();
    }, []);

    const loadWallets = async () => {
        try {
            const res = await getWalletsAPI();
            if (res?.EC === 0 && res?.data) {
                setWallets(res.data);
            }
        } catch (error) {
            console.error("Error loading wallets:", error);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const [pieRes, lineRes] = await Promise.all([
                getWalletExpenseDistributionAPI(filters),
                compareWalletExpenseOverTimeAPI(filters),
            ]);

            if (pieRes?.EC === 0 && pieRes?.data) {
                setPieData(pieRes.data || []);
            }

            if (lineRes?.EC === 0 && lineRes?.data) {
                setLineData(lineRes.data || []);
            }
        } catch (error) {
            console.error("Error loading wallet report:", error);
            message.error("Có lỗi xảy ra khi tải dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        loadData();
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
            render: (text, record) => (
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#10B981] flex items-center justify-center text-white text-sm">
                        {record.icon || "💰"}
                    </div>
                    <span className="font-medium">{text}</span>
                </div>
            ),
        },
        {
            title: "Tổng thu",
            dataIndex: "income",
            key: "income",
            render: (value) => (
                <span className="text-[#10B981] font-semibold">
                    {formatCurrency(value)}
                </span>
            ),
            sorter: (a, b) => (a.income || 0) - (b.income || 0),
        },
        {
            title: "Tổng chi",
            dataIndex: "expense",
            key: "expense",
            render: (value) => (
                <span className="text-[#EF4444] font-semibold">
                    {formatCurrency(value)}
                </span>
            ),
            sorter: (a, b) => (a.expense || 0) - (b.expense || 0),
        },
        {
            title: "Số dư",
            dataIndex: "balance",
            key: "balance",
            render: (value) => (
                <span className="text-[#2563EB] font-semibold">
                    {formatCurrency(value)}
                </span>
            ),
            sorter: (a, b) => (a.balance || 0) - (b.balance || 0),
        },
        {
            title: "Số giao dịch",
            dataIndex: "transactionCount",
            key: "transactionCount",
            sorter: (a, b) =>
                (a.transactionCount || 0) - (b.transactionCount || 0),
        },
    ];

    // Prepare line chart data - group by period and wallet
    const prepareLineData = () => {
        const periodMap = {};
        lineData.forEach((item) => {
            if (!periodMap[item.period]) {
                periodMap[item.period] = {};
            }
            periodMap[item.period][item.walletId] = item.amount;
        });

        const walletsMap = {};
        wallets.forEach((wallet) => {
            walletsMap[wallet._id] = wallet.name;
        });

        return Object.keys(periodMap).map((period) => {
            const data = { period };
            Object.keys(periodMap[period]).forEach((walletId) => {
                data[walletsMap[walletId] || walletId] =
                    periodMap[period][walletId];
            });
            return data;
        });
    };

    const lineChartData = prepareLineData();
    const lineKeys = wallets.slice(0, 5).map((w) => w.name);

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
                <FilterBar onFilterChange={handleFilterChange} />

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Spin size="large" />
                    </div>
                ) : (
                    <>
                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            {/* Pie Chart */}
                            <Card className="shadow-sm">
                                <h3 className="text-lg font-semibold mb-4">
                                    Phân bổ chi tiêu theo ví
                                </h3>
                                <ResponsiveContainer width="100%" height={400}>
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) =>
                                                `${name}: ${(
                                                    percent * 100
                                                ).toFixed(0)}%`
                                            }
                                            outerRadius={120}
                                            fill="#8884d8"
                                            dataKey="amount"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={
                                                        COLORS[
                                                            index %
                                                                COLORS.length
                                                        ]
                                                    }
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value) =>
                                                formatCurrency(value)
                                            }
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Card>

                            {/* Multi-line Chart */}
                            <Card className="shadow-sm">
                                <h3 className="text-lg font-semibold mb-4">
                                    So sánh chi tiêu các ví theo thời gian
                                </h3>
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
                                        <YAxis stroke="#6B7280" />
                                        <Tooltip
                                            formatter={(value) =>
                                                formatCurrency(value)
                                            }
                                        />
                                        <Legend />
                                        {lineKeys.map((key, index) => (
                                            <Line
                                                key={key}
                                                type="monotone"
                                                dataKey={key}
                                                name={key}
                                                stroke={
                                                    COLORS[
                                                        index % COLORS.length
                                                    ]
                                                }
                                                strokeWidth={2}
                                                dot={{ r: 4 }}
                                            />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            </Card>
                        </div>

                        {/* Wallets Table */}
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
                                    showTotal: (total) =>
                                        `Tổng ${total} ví`,
                                }}
                            />
                        </Card>
                    </>
                )}
        </div>
    );
};

export default ReportsWallet;

