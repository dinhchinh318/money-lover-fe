import { useState, useEffect } from "react";
import { Card, Spin, message, Badge, Progress } from "antd";
import {
    PieChart,
    Pie,
    Cell,
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
import {
    getCategoryExpenseReportAPI,
    getTopExpenseCategoriesAPI,
} from "../../../services/api.report";
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
    "#6366F1",
    "#84CC16",
];

const ReportsCategory = () => {
    const [loading, setLoading] = useState(false);
    const [pieData, setPieData] = useState([]);
    const [barData, setBarData] = useState([]);
    const [topCategories, setTopCategories] = useState([]);
    const [filters, setFilters] = useState({
        // Mặc định lấy 6 tháng gần nhất
        startDate: dayjs().subtract(5, "month").startOf("month").format("YYYY-MM-DD"),
        endDate: dayjs().endOf("month").format("YYYY-MM-DD"),
        limit: "10",
    });

    useEffect(() => {
        loadData();
    }, [filters]);

    const loadData = async () => {
        setLoading(true);
        try {
            const params = {
                startDate: filters.startDate,
                endDate: filters.endDate,
                limit: filters.limit,
            };

            const [pieRes, topRes] = await Promise.all([
                getCategoryExpenseReportAPI(params),
                getTopExpenseCategoriesAPI(params),
            ]);

            // Backend trả về: { status: true, error: 0, data: [...] }
            if ((pieRes?.status === true || pieRes?.error === 0 || pieRes?.EC === 0) && pieRes?.data) {
                const data = Array.isArray(pieRes.data) ? pieRes.data : [];
                // Transform data để đảm bảo có đầy đủ field
                const transformedData = data.map((item) => ({
                    name: item.categoryName || item.name || "Chưa phân loại",
                    amount: Number(item.totalAmount || item.amount || 0),
                    count: item.count || 0,
                    categoryId: item.categoryId || item._id,
                    icon: item.categoryIcon || item.icon || "💰",
                }));
                setPieData(transformedData);
            } else {
                setPieData([]);
            }

            if ((topRes?.status === true || topRes?.error === 0 || topRes?.EC === 0) && topRes?.data) {
                const topData = Array.isArray(topRes.data) ? topRes.data : [];
                // Transform data để đảm bảo có đầy đủ field
                const transformedTopData = topData.map((item) => ({
                    name: item.categoryName || item.name || "Chưa phân loại",
                    amount: Number(item.totalAmount || item.amount || 0),
                    count: item.count || 0,
                    categoryId: item.categoryId || item._id,
                    icon: item.categoryIcon || item.icon || "💰",
                }));
                setBarData(transformedTopData);
                setTopCategories(transformedTopData);
            } else {
                setBarData([]);
                setTopCategories([]);
            }
        } catch (error) {
            message.error("Có lỗi xảy ra khi tải dữ liệu");
            setPieData([]);
            setBarData([]);
            setTopCategories([]);
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

    const calculateTotal = () => {
        return pieData.reduce((sum, item) => sum + (item.amount || 0), 0);
    };

    const totalAmount = calculateTotal();

    // Tính phần trăm cho mỗi danh mục
    const getPercentage = (amount) => {
        return totalAmount > 0 ? ((amount / totalAmount) * 100).toFixed(1) : 0;
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Báo cáo theo Danh mục
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Phân tích chi tiêu theo danh mục
                    </p>
                </div>

                {/* Filter Bar */}
                <FilterBar
                    onFilterChange={handleFilterChange}
                    showLimit={true}
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
                        {totalAmount > 0 && (
                            <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-0 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Tổng chi tiêu</p>
                                        <p className="text-3xl font-bold text-gray-900">
                                            {formatCurrency(totalAmount)}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {pieData.length} danh mục
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Charts Section */}
                        {pieData.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                {/* Pie Chart */}
                                <Card className="shadow-sm">
                                    <h3 className="text-lg font-semibold mb-4">
                                        Phân bổ chi tiêu theo danh mục
                                    </h3>
                                    <ResponsiveContainer width="100%" height={400}>
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({
                                                    name,
                                                    percent,
                                                }) =>
                                                    `${name}: ${(
                                                        percent * 100
                                                    ).toFixed(0)}%`
                                                }
                                                outerRadius={120}
                                                innerRadius={60}
                                                fill="#8884d8"
                                                dataKey="amount"
                                                paddingAngle={2}
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
                                                        stroke="#fff"
                                                        strokeWidth={2}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value) =>
                                                    formatCurrency(value)
                                                }
                                                contentStyle={{ 
                                                    backgroundColor: "#fff", 
                                                    border: "1px solid #E5E7EB", 
                                                    borderRadius: "8px",
                                                    padding: "12px"
                                                }}
                                            />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Card>

                                {/* Horizontal Bar Chart */}
                                <Card className="shadow-sm">
                                    <h3 className="text-lg font-semibold mb-4">
                                        Top danh mục chi tiêu
                                    </h3>
                                    <ResponsiveContainer width="100%" height={400}>
                                        <BarChart
                                            data={barData}
                                            layout="vertical"
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke="#E5E7EB"
                                            />
                                            <XAxis 
                                                type="number" 
                                                stroke="#6B7280"
                                                tickFormatter={(value) => formatCurrency(value)}
                                            />
                                            <YAxis
                                                dataKey="name"
                                                type="category"
                                                width={150}
                                                stroke="#6B7280"
                                            />
                                            <Tooltip
                                                formatter={(value) =>
                                                    formatCurrency(value)
                                                }
                                                contentStyle={{ 
                                                    backgroundColor: "#fff", 
                                                    border: "1px solid #E5E7EB", 
                                                    borderRadius: "8px",
                                                    padding: "12px"
                                                }}
                                            />
                                            <Bar
                                                dataKey="amount"
                                                fill="#10B981"
                                                radius={[0, 8, 8, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
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

                        {/* Top Categories List */}
                        {topCategories.length > 0 && (
                            <Card className="shadow-sm">
                                <h3 className="text-lg font-semibold mb-4">
                                    Top {topCategories.length} danh mục chi tiêu
                                </h3>
                                <div className="space-y-4">
                                    {topCategories.map((category, index) => {
                                        const percentage = getPercentage(category.amount);
                                        const isTop3 = index < 3;
                                        const color = COLORS[index % COLORS.length];

                                        return (
                                            <div
                                                key={category.categoryId || category._id || index}
                                                className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all"
                                            >
                                                <div className="flex items-center gap-3 flex-1">
                                                    {isTop3 && (
                                                        <Badge
                                                            count={index + 1}
                                                            className="bg-[#10B981]"
                                                            style={{
                                                                backgroundColor: "#10B981",
                                                            }}
                                                        />
                                                    )}
                                                    {!isTop3 && (
                                                        <div className="w-8 h-8 flex items-center justify-center text-gray-400 font-bold">
                                                            {index + 1}
                                                        </div>
                                                    )}
                                                    <div 
                                                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl"
                                                        style={{ backgroundColor: color }}
                                                    >
                                                        {category.icon || "💰"}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="font-semibold text-gray-900 text-base">
                                                                {category.name}
                                                            </span>
                                                            <span className="font-bold text-lg text-[#10B981]">
                                                                {formatCurrency(category.amount)}
                                                            </span>
                                                        </div>
                                                        <Progress
                                                            percent={parseFloat(percentage)}
                                                            strokeColor={color}
                                                            showInfo={false}
                                                            size={8}
                                                        />
                                                        <div className="flex justify-between mt-2">
                                                            <span className="text-sm text-gray-500">
                                                                {percentage}% tổng chi tiêu
                                                            </span>
                                                            <span className="text-sm text-gray-500">
                                                                {category.count || 0} giao dịch
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>
                        )}
                    </>
                )}
        </div>
    );
};

export default ReportsCategory;

