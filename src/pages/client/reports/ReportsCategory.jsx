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
        startDate: dayjs().startOf("month").format("YYYY-MM-DD"),
        endDate: dayjs().endOf("month").format("YYYY-MM-DD"),
        limit: "10",
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [pieRes, topRes] = await Promise.all([
                getCategoryExpenseReportAPI(filters),
                getTopExpenseCategoriesAPI(filters),
            ]);

            if (pieRes?.EC === 0 && pieRes?.data) {
                setPieData(pieRes.data || []);
            }

            if (topRes?.EC === 0 && topRes?.data) {
                const topData = topRes.data || [];
                setBarData(topData);
                setTopCategories(topData);
            }
        } catch (error) {
            console.error("Error loading category report:", error);
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

    const calculateTotal = () => {
        return pieData.reduce((sum, item) => sum + (item.amount || 0), 0);
    };

    const totalAmount = calculateTotal();

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
                />

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
                                        <XAxis type="number" stroke="#6B7280" />
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

                        {/* Top Categories List */}
                        <Card className="shadow-sm">
                            <h3 className="text-lg font-semibold mb-4">
                                Top {topCategories.length} danh mục
                            </h3>
                            <div className="space-y-4">
                                {topCategories.map((category, index) => {
                                    const percentage =
                                        totalAmount > 0
                                            ? (
                                                  (category.amount /
                                                      totalAmount) *
                                                  100
                                              ).toFixed(1)
                                            : 0;
                                    const isTop3 = index < 3;

                                    return (
                                        <div
                                            key={category._id || index}
                                            className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-3 flex-1">
                                                {isTop3 && (
                                                    <Badge
                                                        count={index + 1}
                                                        className="bg-[#10B981]"
                                                        style={{
                                                            backgroundColor:
                                                                "#10B981",
                                                        }}
                                                    />
                                                )}
                                                <div className="w-12 h-12 rounded-full bg-[#10B981] flex items-center justify-center text-white font-bold">
                                                    {category.icon || "💰"}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-semibold text-gray-900">
                                                            {category.name}
                                                        </span>
                                                        <span className="font-bold text-lg text-[#10B981]">
                                                            {formatCurrency(
                                                                category.amount
                                                            )}
                                                        </span>
                                                    </div>
                                                    <Progress
                                                        percent={parseFloat(
                                                            percentage
                                                        )}
                                                        strokeColor="#10B981"
                                                        showInfo={false}
                                                    />
                                                    <div className="flex justify-between mt-1">
                                                        <span className="text-sm text-gray-500">
                                                            {percentage}%
                                                        </span>
                                                        <span className="text-sm text-gray-500">
                                                            {category.count ||
                                                                0}{" "}
                                                            giao dịch
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    </>
                )}
        </div>
    );
};

export default ReportsCategory;

