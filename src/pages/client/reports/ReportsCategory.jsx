import { useState, useEffect } from "react";
import { Card, Spin, message } from "antd";
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

// ✅ i18n
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [pieData, setPieData] = useState([]);
  const [barData, setBarData] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [filters, setFilters] = useState({
    startDate: dayjs()
      .subtract(5, "month")
      .startOf("month")
      .format("YYYY-MM-DD"),
    endDate: dayjs().endOf("month").format("YYYY-MM-DD"),
    limit: "10",
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      if (
        (pieRes?.status === true || pieRes?.error === 0 || pieRes?.EC === 0) &&
        pieRes?.data
      ) {
        const data = Array.isArray(pieRes.data) ? pieRes.data : [];
        const transformedData = data.map((item) => ({
          name: item.categoryName || item.name || t("reportsCategory.uncategorized"),
          amount: Number(item.totalAmount || item.amount || 0),
          count: item.count || 0,
          categoryId: item.categoryId || item._id,
          icon: item.categoryIcon || item.icon || "💰",
        }));
        setPieData(transformedData);
      } else {
        setPieData([]);
      }

      if (
        (topRes?.status === true || topRes?.error === 0 || topRes?.EC === 0) &&
        topRes?.data
      ) {
        const topData = Array.isArray(topRes.data) ? topRes.data : [];
        const transformedTopData = topData.map((item) => ({
          name: item.categoryName || item.name || t("reportsCategory.uncategorized"),
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
      message.error(t("reportsCategory.loadError"));
      setPieData([]);
      setBarData([]);
      setTopCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
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

  const getPercentage = (amount) => {
    return totalAmount > 0 ? ((amount / totalAmount) * 100).toFixed(1) : 0;
  };

  const getIconEmoji = (iconValue) => {
    if (!iconValue) return "💰";
    const iconStr = String(iconValue).toLowerCase().trim();

    const iconMap = {
      food: "🍽️",
      "🍔": "🍽️",
      shopping: "🛒",
      transport: "🚗",
      bills: "💳",
      entertainment: "🎬",
      health: "🏥",
      education: "📚",
      salary: "💰",
      investment: "📈",
      gift: "🎁",
      other: "📦",
    };

    if (iconStr === "🍔" || iconValue === "🍔") return "🍽️";
    if (iconMap[iconStr]) return iconMap[iconStr];
    return iconValue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/70 via-white to-white">
      <div className="max-w-[98%] mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {t("reportsCategory.title")}
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            {t("reportsCategory.subtitle")}
          </p>
        </div>

        {/* Filter Bar */}
        <FilterBar
          onFilterChange={handleFilterChange}
          showLimit={true}
          defaultDateRange={[dayjs(filters.startDate), dayjs(filters.endDate)]}
        />

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Spin size="large" />
          </div>
        ) : (
          <>
            {/* Summary Card */}
            {totalAmount > 0 && (
              <Card className="mb-4 sm:mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-0 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">
                      {t("reportsCategory.summary.totalExpense")}
                    </p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">
                      {formatCurrency(totalAmount)}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      {t("reportsCategory.summary.categoryCount", {
                        count: pieData.length,
                      })}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Charts Section */}
            {pieData.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                {/* Pie Chart */}
                <Card className="shadow-sm">
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                    {t("reportsCategory.charts.pieTitle")}
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius="70%"
                        innerRadius="40%"
                        fill="#8884d8"
                        dataKey="amount"
                        paddingAngle={2}
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                            stroke="#fff"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #E5E7EB",
                          borderRadius: "8px",
                          padding: "12px",
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>

                {/* Horizontal Bar Chart */}
                <Card className="shadow-sm">
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                    {t("reportsCategory.charts.barTitle")}
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={barData}
                      layout="vertical"
                      margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis
                        type="number"
                        stroke="#6B7280"
                        tick={{ fontSize: 10 }}
                        tickFormatter={(value) => formatCurrency(value)}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={120}
                        stroke="#6B7280"
                        tick={{ fontSize: 10 }}
                      />
                      <Tooltip
                        formatter={(value) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #E5E7EB",
                          borderRadius: "8px",
                          padding: "12px",
                        }}
                      />
                      <Bar dataKey="amount" fill="#10B981" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>
            ) : (
              <Card className="shadow-sm mb-6">
                <div className="flex items-center justify-center h-[400px] text-gray-400">
                  <div className="text-center">
                    <p className="text-lg mb-2">
                      {t("reportsCategory.empty.title")}
                    </p>
                    <p className="text-sm">{t("reportsCategory.empty.subtitle")}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Top Categories List */}
            {topCategories.length > 0 && (
              <Card className="shadow-sm border-0">
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                    {t("reportsCategory.top.title", { count: topCategories.length })}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {t("reportsCategory.top.subtitle")}
                  </p>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  {topCategories.map((category, index) => {
                    const percentage = getPercentage(category.amount);
                    const color = COLORS[index % COLORS.length];

                    const rankColors = {
                      0: {
                        bg: "bg-gradient-to-br from-yellow-400 to-yellow-600",
                        text: "text-white",
                        shadow: "shadow-lg shadow-yellow-500/30",
                      },
                      1: {
                        bg: "bg-gradient-to-br from-gray-300 to-gray-500",
                        text: "text-white",
                        shadow: "shadow-lg shadow-gray-400/30",
                      },
                      2: {
                        bg: "bg-gradient-to-br from-orange-400 to-orange-600",
                        text: "text-white",
                        shadow: "shadow-lg shadow-orange-500/30",
                      },
                    };

                    const rankColor = rankColors[index] || {
                      bg: "bg-gray-100",
                      text: "text-gray-600",
                      shadow: "",
                    };

                    return (
                      <div
                        key={category.categoryId || category._id || index}
                        className="group relative flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-5 bg-white border border-gray-200 rounded-xl hover:border-[#2563EB] hover:shadow-lg transition-all duration-300 cursor-pointer"
                      >
                        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 w-full sm:w-auto">
                          {/* Rank Badge */}
                          <div
                            className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm ${rankColor.bg} ${rankColor.text} ${rankColor.shadow} transition-transform group-hover:scale-110`}
                          >
                            {index + 1}
                          </div>

                          {/* Icon */}
                          <div
                            className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-xl sm:text-2xl shadow-md transition-transform group-hover:scale-110 group-hover:shadow-lg"
                            style={{
                              backgroundColor: `${color}15`,
                              border: `2px solid ${color}40`,
                            }}
                          >
                            <span style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}>
                              {getIconEmoji(category.icon)}
                            </span>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-2 sm:mb-3">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-900 text-base sm:text-lg mb-1 truncate">
                                  {category.name}
                                </h4>

                                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                                  <span className="text-gray-500 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                    {t("reportsCategory.top.percentOfTotal", { percent: percentage })}
                                  </span>

                                  <span className="text-gray-500 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                    {t("reportsCategory.top.transactionCount", {
                                      count: category.count || 0,
                                    })}
                                  </span>
                                </div>
                              </div>

                              <div className="text-left sm:text-right sm:ml-4">
                                <p className="font-bold text-lg sm:text-xl text-[#10B981] mb-1">
                                  {formatCurrency(category.amount)}
                                </p>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="relative mt-2">
                              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                                  style={{
                                    width: `${percentage}%`,
                                    backgroundColor: color,
                                    boxShadow: `0 2px 8px ${color}40`,
                                  }}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Hover Effect Border */}
                        <div className="absolute inset-0 rounded-xl border-2 border-[#2563EB] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReportsCategory;
