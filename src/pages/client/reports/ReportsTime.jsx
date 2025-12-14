import { useState, useEffect } from "react";
import { Card, Table, Spin, message } from "antd";
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
import FilterBar from "../../../components/reports/FilterBar";
import { getTimeBasedReportAPI } from "../../../services/api.report";
import { getWalletsAPI } from "../../../services/api.wallet";
import { getCategoriesAPI } from "../../../services/api.category";
import dayjs from "dayjs";

const ReportsTime = () => {
    const [loading, setLoading] = useState(false);
    const [timeData, setTimeData] = useState([]);
    const [wallets, setWallets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [filters, setFilters] = useState({
        // Mặc định lấy 6 tháng gần nhất để có nhiều dữ liệu hơn
        startDate: dayjs().subtract(5, "month").startOf("month").format("YYYY-MM-DD"),
        endDate: dayjs().endOf("month").format("YYYY-MM-DD"),
        period: "month",
        type: "all",
        walletId: "all",
        categoryId: "all",
    });

    useEffect(() => {
        loadWallets();
        loadCategories();
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

    const loadCategories = async () => {
        try {
            const res = await getCategoriesAPI();
            // Backend trả về: { status: true, error: 0, data: [...] }
            if ((res?.status === true || res?.error === 0 || res?.EC === 0) && res?.data) {
                const categoriesData = Array.isArray(res.data) ? res.data : [];
                setCategories(categoriesData);
            } else {
                setCategories([]);
            }
        } catch (error) {
            setCategories([]);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            // Đảm bảo có period trong filters
            const params = {
                ...filters,
                period: filters.period || "day",
            };
            
            const res = await getTimeBasedReportAPI(params);
            // Backend trả về: { status: true, error: 0, data: [...] }
            if ((res?.status === true || res?.error === 0 || res?.EC === 0) && res?.data) {
                const rawData = Array.isArray(res.data) ? res.data : [];
                
                // Transform data từ backend format sang frontend format
                // Backend: { date/label, totalIncome, totalExpense, balance }
                // Frontend: { period, income, expense, balance }
                const transformedData = rawData.map((item) => ({
                    period: item.label || item.date || item.period || "N/A",
                    income: Number(item.totalIncome || item.income || 0),
                    expense: Number(item.totalExpense || item.expense || 0),
                    balance: Number(item.balance || (item.totalIncome || 0) - (item.totalExpense || 0)),
                }));
                
                setTimeData(transformedData);
            } else {
                setTimeData([]);
                message.error(res?.message || res?.EM || "Không thể tải dữ liệu");
            }
        } catch (error) {
            setTimeData([]);
            message.error("Có lỗi xảy ra khi tải dữ liệu");
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
            title: "Thời gian",
            dataIndex: "period",
            key: "period",
            sorter: (a, b) => a.period.localeCompare(b.period),
        },
        {
            title: "Thu nhập",
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
            title: "Chi tiêu",
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
    ];

    return (
        <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Báo cáo theo Thời gian
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Phân tích thu chi theo thời gian
                    </p>
                </div>

                {/* Filter Bar */}
                <FilterBar
                    onFilterChange={handleFilterChange}
                    showPeriod={true}
                    showType={true}
                    showWallet={true}
                    showCategory={true}
                    wallets={wallets}
                    categories={categories}
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
                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            {/* Line Chart */}
                            <Card className="shadow-sm">
                                <h3 className="text-lg font-semibold mb-4">
                                    Biểu đồ đường - Thu chi theo thời gian
                                </h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={timeData}>
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
                                        <Line
                                            type="monotone"
                                            dataKey="income"
                                            name="Thu nhập"
                                            stroke="#10B981"
                                            strokeWidth={2}
                                            dot={{ r: 4 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="expense"
                                            name="Chi tiêu"
                                            stroke="#EF4444"
                                            strokeWidth={2}
                                            dot={{ r: 4 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </Card>

                            {/* Bar Chart */}
                            <Card className="shadow-sm">
                                <h3 className="text-lg font-semibold mb-4">
                                    Biểu đồ cột - So sánh thu chi
                                </h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={timeData}>
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
                                        <Bar
                                            dataKey="income"
                                            name="Thu nhập"
                                            fill="#10B981"
                                        />
                                        <Bar
                                            dataKey="expense"
                                            name="Chi tiêu"
                                            fill="#EF4444"
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Card>
                        </div>

                        {/* Data Table */}
                        <Card className="shadow-sm">
                            <h3 className="text-lg font-semibold mb-4">
                                Bảng chi tiết
                            </h3>
                            <Table
                                columns={tableColumns}
                                dataSource={timeData}
                                rowKey="period"
                                pagination={{
                                    pageSize: 10,
                                    showSizeChanger: true,
                                    showTotal: (total) =>
                                        `Tổng ${total} bản ghi`,
                                }}
                            />
                        </Card>
                    </>
                )}
        </div>
    );
};

export default ReportsTime;

