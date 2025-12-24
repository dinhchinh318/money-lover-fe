import { useState, useEffect } from "react";
import { Card, Table, Spin, message } from "antd";
import {
    Calendar,
    BarChart3,
    TrendingUp,
    TrendingDown,
    FileText,
    Filter,
} from "lucide-react";
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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                            <Calendar className="text-white" size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-indigo-800 to-gray-900 bg-clip-text text-transparent">
                                Báo cáo theo Thời gian
                            </h1>
                            <p className="text-gray-600 mt-1 text-sm">
                                Phân tích thu chi theo thời gian với biểu đồ và bảng chi tiết
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filter Bar */}
                <Card className="mb-6 shadow-lg border-0 rounded-2xl bg-gradient-to-br from-white to-gray-50">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="text-indigo-500" size={18} />
                        <h3 className="text-sm font-bold text-gray-800">Bộ lọc</h3>
                    </div>
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
                </Card>

                {loading ? (
                    <div className="flex flex-col justify-center items-center py-20">
                        <Spin size="large" />
                        <p className="mt-4 text-gray-500">Đang tải dữ liệu báo cáo...</p>
                    </div>
                ) : (
                    <>
                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            {/* Line Chart */}
                            <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 rounded-2xl overflow-hidden bg-gradient-to-br from-white to-gray-50">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg">
                                        <TrendingUp className="text-white" size={18} />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">
                                        Biểu đồ đường - Thu chi theo thời gian
                                    </h3>
                                </div>
                                {timeData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={350}>
                                        <LineChart data={timeData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke="#E5E7EB"
                                                vertical={false}
                                            />
                                            <XAxis
                                                dataKey="period"
                                                stroke="#6B7280"
                                                tick={{ fill: "#6B7280", fontSize: 12 }}
                                                tickLine={{ stroke: "#D1D5DB" }}
                                                axisLine={{ stroke: "#D1D5DB" }}
                                            />
                                            <YAxis
                                                stroke="#6B7280"
                                                tick={{ fill: "#6B7280", fontSize: 12 }}
                                                tickLine={{ stroke: "#D1D5DB" }}
                                                axisLine={{ stroke: "#D1D5DB" }}
                                                tickFormatter={(value) => {
                                                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                                                    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                                                    return value.toString();
                                                }}
                                            />
                                            <Tooltip
                                                formatter={(value) => formatCurrency(value)}
                                                contentStyle={{
                                                    backgroundColor: "#fff",
                                                    border: "1px solid #E5E7EB",
                                                    borderRadius: "8px",
                                                    padding: "12px",
                                                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
                                                }}
                                                labelStyle={{ color: "#374151", fontWeight: "bold" }}
                                            />
                                            <Legend
                                                wrapperStyle={{ paddingTop: "20px" }}
                                                iconType="line"
                                                formatter={(value) => (
                                                    <span style={{ color: "#374151", fontSize: "12px" }}>{value}</span>
                                                )}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="income"
                                                name="Thu nhập"
                                                stroke="#10B981"
                                                strokeWidth={3}
                                                dot={{ r: 5, fill: "#10B981", strokeWidth: 2 }}
                                                activeDot={{ r: 7, stroke: "#10B981", strokeWidth: 2 }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="expense"
                                                name="Chi tiêu"
                                                stroke="#EF4444"
                                                strokeWidth={3}
                                                dot={{ r: 5, fill: "#EF4444", strokeWidth: 2 }}
                                                activeDot={{ r: 7, stroke: "#EF4444", strokeWidth: 2 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-[350px] bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                        <BarChart3 className="text-gray-400 mb-2" size={32} />
                                        <p className="text-sm text-gray-500">Chưa có dữ liệu để hiển thị</p>
                                    </div>
                                )}
                            </Card>

                            {/* Bar Chart */}
                            <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 rounded-2xl overflow-hidden bg-gradient-to-br from-white to-gray-50">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg">
                                        <BarChart3 className="text-white" size={18} />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">
                                        Biểu đồ cột - So sánh thu chi
                                    </h3>
                                </div>
                                {timeData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={350}>
                                        <BarChart data={timeData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke="#E5E7EB"
                                                vertical={false}
                                            />
                                            <XAxis
                                                dataKey="period"
                                                stroke="#6B7280"
                                                tick={{ fill: "#6B7280", fontSize: 12 }}
                                                tickLine={{ stroke: "#D1D5DB" }}
                                                axisLine={{ stroke: "#D1D5DB" }}
                                            />
                                            <YAxis
                                                stroke="#6B7280"
                                                tick={{ fill: "#6B7280", fontSize: 12 }}
                                                tickLine={{ stroke: "#D1D5DB" }}
                                                axisLine={{ stroke: "#D1D5DB" }}
                                                tickFormatter={(value) => {
                                                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                                                    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                                                    return value.toString();
                                                }}
                                            />
                                            <Tooltip
                                                formatter={(value) => formatCurrency(value)}
                                                contentStyle={{
                                                    backgroundColor: "#fff",
                                                    border: "1px solid #E5E7EB",
                                                    borderRadius: "8px",
                                                    padding: "12px",
                                                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
                                                }}
                                                labelStyle={{ color: "#374151", fontWeight: "bold" }}
                                            />
                                            <Legend
                                                wrapperStyle={{ paddingTop: "20px" }}
                                                iconType="square"
                                                formatter={(value) => (
                                                    <span style={{ color: "#374151", fontSize: "12px" }}>{value}</span>
                                                )}
                                            />
                                            <Bar
                                                dataKey="income"
                                                name="Thu nhập"
                                                fill="#10B981"
                                                radius={[8, 8, 0, 0]}
                                            />
                                            <Bar
                                                dataKey="expense"
                                                name="Chi tiêu"
                                                fill="#EF4444"
                                                radius={[8, 8, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-[350px] bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                        <BarChart3 className="text-gray-400 mb-2" size={32} />
                                        <p className="text-sm text-gray-500">Chưa có dữ liệu để hiển thị</p>
                                    </div>
                                )}
                            </Card>
                        </div>

                        {/* Data Table */}
                        <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 rounded-2xl overflow-hidden bg-gradient-to-br from-white to-gray-50">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg">
                                    <FileText className="text-white" size={18} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    Bảng chi tiết
                                </h3>
                            </div>
                            {timeData.length > 0 ? (
                                <Table
                                    columns={tableColumns}
                                    dataSource={timeData}
                                    rowKey="period"
                                    pagination={{
                                        pageSize: 10,
                                        showSizeChanger: true,
                                        showTotal: (total) =>
                                            `Tổng ${total} bản ghi`,
                                        pageSizeOptions: ['10', '20', '50', '100'],
                                    }}
                                    className="custom-table"
                                    rowClassName={(record, index) =>
                                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                                    }
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                    <FileText className="text-gray-400 mb-2" size={32} />
                                    <p className="text-sm text-gray-500">Chưa có dữ liệu để hiển thị</p>
                                </div>
                            )}
                        </Card>
                    </>
                )}
            </div>
        </div>
    );
};

export default ReportsTime;

