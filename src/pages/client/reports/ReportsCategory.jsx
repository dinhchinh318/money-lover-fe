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
    startDate: dayjs()
      .subtract(5, "month")
      .startOf("month")
      .format("YYYY-MM-DD"),
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
      if (
        (pieRes?.status === true || pieRes?.error === 0 || pieRes?.EC === 0) &&
        pieRes?.data
      ) {
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

      if (
        (topRes?.status === true || topRes?.error === 0 || topRes?.EC === 0) &&
        topRes?.data
      ) {
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

  // Map icon string hoặc emoji cũ thành emoji mới
  const getIconEmoji = (iconValue) => {
    if (!iconValue) return "💰";

    const iconStr = String(iconValue).toLowerCase().trim();

    // Map các icon string thành emoji
    const iconMap = {
      // ăn uống
      coffee: "☕",
      food: "🍽️",
      restaurant: "🍽️",

      // di chuyển
      car: "🚗",
      transport: "🚗",
      taxi: "🚕",
      bus: "🚌",
      bike: "🚲",

      // sinh hoạt
      smartphone: "📱",
      phone: "📱",
      internet: "🌐",
      wifi: "🌐",
      electricity: "💡",
      water: "🚿",

      // khác
      shopping: "🛒",
      bills: "💳",
      entertainment: "🎬",
      health: "🏥",
      education: "📚",
      gift: "🎁",
      other: "📦",
      zap: "⚡",
      more_horiz: "📦",
    };

    // Nếu là emoji cũ "🍔", map thành "🍽️"
    if (iconStr === "🍔" || iconValue === "🍔") {
      return "🍽️";
    }

    // Nếu là string key trong map, trả về emoji tương ứng
    if (iconMap[iconStr]) {
      return iconMap[iconStr];
    }

    // Nếu đã là emoji hợp lệ, giữ nguyên
    return iconValue;
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-[1280px] mx-auto px-4 py-4 sm:py-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Báo cáo theo Danh mục
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Phân tích chi tiêu theo danh mục</p>
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
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Tổng chi tiêu</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">
                      {formatCurrency(totalAmount)}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      {pieData.length} danh mục
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
                    Phân bổ chi tiêu theo danh mục
                  </h3>
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
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
                  </div>
                </Card>

                {/* Horizontal Bar Chart */}
                <Card className="shadow-sm">
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                    Top danh mục chi tiêu
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
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
                    <p className="text-sm">
                      Vui lòng thêm giao dịch chi tiêu trong khoảng thời gian
                      này
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Top Categories List */}
            {topCategories.length > 0 && (
              <Card className="shadow-sm border-0">
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                    Top {topCategories.length} danh mục chi tiêu
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Danh sách các danh mục chi tiêu nhiều nhất
                  </p>
                </div>
                <div className="max-h-[360px] overflow-y-auto pr-2">
                  <div className="space-y-2 sm:space-y-3">
                    {topCategories.map((category, index) => {
                      const percentage = getPercentage(category.amount);
                      const isTop3 = index < 3;
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
                      const renderSafeIcon = (iconValue) => {
                        const emoji = getIconEmoji(iconValue);

                        // Nếu không phải emoji (string dài) → dùng fallback
                        if (typeof emoji !== "string" || emoji.length > 2) {
                          return "📦";
                        }

                        return emoji;
                      };

                      return (
                        <div
                          key={category.categoryId || index}
                          className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white"
                        >
                          {/* Rank */}
                          <div className="w-7 h-7 flex-shrink-0 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>

                          {/* Icon */}
                          <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-gray-100 flex items-center justify-center text-lg">
                            {renderSafeIcon(category.icon)}
                          </div>

                          {/* Text */}
                          <div className="flex-1 min-w-[120px]">
                            <p className="font-semibold text-sm text-gray-900 truncate">
                              {category.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {percentage}% • {category.count || 0} giao dịch
                            </p>
                          </div>

                          {/* Amount */}
                          <div className="flex-shrink-0 text-right">
                            <p className="font-bold text-sm text-[#10B981] whitespace-nowrap">
                              {formatCurrency(category.amount)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
