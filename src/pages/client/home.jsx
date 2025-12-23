import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Wallet, TrendingUp, TrendingDown, BarChart3, Plus, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useCurrentApp } from "../../components/context/app.context";
import { message } from "antd";
import LandingPage from "./landing";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { getFinancialDashboardAPI, getCategoryExpenseReportAPI } from "../../services/api.report";
import dayjs from "dayjs";

function HomePage() {
  const { user, isAuthenticated } = useCurrentApp();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    transactionCount: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [financialOverview, setFinancialOverview] = useState({
    totalIncome: 0,
    totalExpense: 0,
  });
  const [categoryExpenses, setCategoryExpenses] = useState([]);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [hiddenCategories, setHiddenCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
      loadFinancialOverview();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, selectedMonth]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // TODO: Call API để lấy stats và recent transactions
      // const statsRes = await getStatsAPI();
      // const transactionsRes = await getRecentTransactionsAPI();

      setTimeout(() => {
        setStats({
          totalBalance: 50000000,
          monthlyIncome: 15000000,
          monthlyExpense: 8000000,
          transactionCount: 45,
        });
        const now = new Date();
        now.setHours(18, 43, 0, 0);
        now.setDate(12);
        now.setMonth(11); // December (0-indexed)
        now.setFullYear(2025);

        setRecentTransactions([
          {
            id: 1,
            category: "Ăn uống",
            amount: -150000,
            date: now,
            type: "expense",
          },
          {
            id: 2,
            category: "Lương",
            amount: 15000000,
            date: now,
            type: "income",
          },
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      message.error("Không thể tải dữ liệu!");
      setLoading(false);
    }
  };

  const loadFinancialOverview = async () => {
    try {
      setLoadingOverview(true);
      const monthStart = selectedMonth.startOf("month").toDate();
      const monthEnd = selectedMonth.endOf("month").toDate();

      const [overviewRes, categoryRes] = await Promise.all([
        getFinancialDashboardAPI({
          startDate: monthStart,
          endDate: monthEnd,
        }),
        getCategoryExpenseReportAPI({
          startDate: monthStart,
          endDate: monthEnd,
        }),
      ]);

      // Xử lý Financial Overview - API trả về { status, error, message, data }
      if (overviewRes?.status === true && overviewRes?.data) {
        const data = overviewRes.data;
        setFinancialOverview({
          totalIncome: Number(data.totalIncome) || 0,
          totalExpense: Number(data.totalExpense) || 0,
        });
      } else if (overviewRes?.EC === 0 && overviewRes?.data) {
        // Format cũ: { EC, EM, data }
        const data = overviewRes.data;
        setFinancialOverview({
          totalIncome: Number(data.totalIncome) || 0,
          totalExpense: Number(data.totalExpense) || 0,
        });
      } else {
        // Fallback mock data
        setFinancialOverview({
          totalIncome: 51506952,
          totalExpense: 33224909,
        });
      }

      // Xử lý Category Expenses - API trả về array trong data
      let categories = [];
      if (categoryRes?.status === true && Array.isArray(categoryRes?.data)) {
        categories = categoryRes.data;
      } else if (categoryRes?.EC === 0 && Array.isArray(categoryRes?.data)) {
        categories = categoryRes.data;
      } else if (categoryRes?.status === true && categoryRes?.data?.categories) {
        categories = categoryRes.data.categories;
      }

      // Transform và tính toán percentage
      if (Array.isArray(categories) && categories.length > 0) {
        // Tính tổng amount để tính percentage
        const totalAmount = categories.reduce((sum, cat) => {
          const amount = Number(cat.totalAmount || cat.amount || 0);
          return sum + amount;
        }, 0);

        // Transform data với percentage - thêm field name cho Pie chart legend
        const transformedCategories = categories.map((item) => {
          const amount = Number(item.totalAmount || item.amount || 0);
          const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
          const categoryName = item.categoryName || item.name || item.category?.name || "Chưa phân loại";
          return {
            name: categoryName, // Field name cho Pie chart legend
            categoryName: categoryName,
            amount: amount,
            percentage: Math.round(percentage * 100) / 100, // Làm tròn 2 chữ số thập phân
            categoryId: item.categoryId || item._id || item.category?._id,
            categoryIcon: item.categoryIcon || item.icon || item.category?.icon,
            count: item.count || 0,
            category: item.category || null,
          };
        });

        // Sắp xếp theo amount giảm dần
        transformedCategories.sort((a, b) => b.amount - a.amount);

        setCategoryExpenses(transformedCategories);
      } else {
        // Fallback mock data với percentage đã tính - thêm field name
        const mockData = [
          { name: "Hóa đơn", categoryName: "Hóa đơn", amount: 22035211, percentage: 66.3 },
          { name: "Mua sắm", categoryName: "Mua sắm", amount: 4753293, percentage: 14.3 },
          { name: "Giáo dục", categoryName: "Giáo dục", amount: 2000072, percentage: 6.0 },
          { name: "Khác", categoryName: "Khác", amount: 1286321, percentage: 3.9 },
          { name: "Giải trí", categoryName: "Giải trí", amount: 1147327, percentage: 3.5 },
          { name: "Di chuyển", categoryName: "Di chuyển", amount: 856342, percentage: 2.6 },
          { name: "Y tế", categoryName: "Y tế", amount: 718346, percentage: 2.2 },
          { name: "Ăn uống", categoryName: "Ăn uống", amount: 427997, percentage: 1.3 },
        ];
        setCategoryExpenses(mockData);
      }
    } catch (error) {
      console.error("Error loading financial overview:", error);
      // Fallback mock data khi có lỗi
      setFinancialOverview({
        totalIncome: 51506952,
        totalExpense: 33224909,
      });
      setCategoryExpenses([
        { name: "Hóa đơn", categoryName: "Hóa đơn", amount: 22035211, percentage: 66.3 },
        { name: "Mua sắm", categoryName: "Mua sắm", amount: 4753293, percentage: 14.3 },
        { name: "Giáo dục", categoryName: "Giáo dục", amount: 2000072, percentage: 6.0 },
        { name: "Khác", categoryName: "Khác", amount: 1286321, percentage: 3.9 },
        { name: "Giải trí", categoryName: "Giải trí", amount: 1147327, percentage: 3.5 },
        { name: "Di chuyển", categoryName: "Di chuyển", amount: 856342, percentage: 2.6 },
        { name: "Y tế", categoryName: "Y tế", amount: 718346, percentage: 2.2 },
        { categoryName: "Ăn uống", amount: 427997, percentage: 1.3 },
      ]);
    } finally {
      setLoadingOverview(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${hours}:${minutes} ${day}/${month}/${year}`;
  };

  // Nếu chưa đăng nhập, hiển thị landing page
  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-[#F3F5F8]" style={{ minHeight: 'calc(100vh - 64px - 200px)' }}>
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10" style={{ padding: '28px 32px' }}>
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-[#111827] mb-2">
            {user?.name ? `Xin chào, ${user.name}` : "Xin chào"}
          </h1>
          <p className="text-[#6B7280] text-sm">
            Chào mừng bạn trở lại với MoneyLover
          </p>
        </div>

        {/* Financial Overview Section - Tình hình thu chi */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm mb-8 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#111827]">Tình hình thu chi</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedMonth(selectedMonth.subtract(1, "month"))}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft size={20} className="text-gray-600" />
              </button>
              <span className="text-sm font-semibold text-gray-700 min-w-[80px] text-center">
                {selectedMonth.format("MM/YYYY")}
              </span>
              <button
                onClick={() => setSelectedMonth(selectedMonth.add(1, "month"))}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                disabled={selectedMonth.isAfter(dayjs(), "month")}
              >
                <ChevronRight
                  size={20}
                  className={`${selectedMonth.isAfter(dayjs(), "month") ? "text-gray-300" : "text-gray-600"}`}
                />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Expense Summary & Donut Chart */}
            <div className="space-y-6">
              {/* Expense Card */}
              <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-6 border border-red-100">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-700">Chi tiêu</span>
                  <TrendingUp className="text-red-500" size={18} />
                </div>
                <p className="text-3xl font-bold text-red-600 mb-2">
                  {loadingOverview ? "..." : formatCurrency(financialOverview.totalExpense)}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span>Tổng chi tiêu trong tháng</span>
                </div>
              </div>

              {/* Donut Chart */}
              {categoryExpenses.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={categoryExpenses.filter((_, index) => !hiddenCategories.includes(index))}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="amount"
                        nameKey="name"
                        label={false}
                        onClick={(data, index) => {
                          const originalIndex = categoryExpenses.findIndex(
                            cat => cat.categoryName === data.categoryName
                          );
                          setSelectedCategory(originalIndex === selectedCategory ? null : originalIndex);
                        }}
                      >
                        {categoryExpenses
                          .filter((_, index) => !hiddenCategories.includes(index))
                          .map((entry, index) => {
                            const originalIndex = categoryExpenses.findIndex(
                              cat => cat.categoryName === entry.categoryName
                            );
                            const colors = [
                              "#F97316", // Orange
                              "#EF4444", // Red
                              "#10B981", // Green
                              "#3B82F6", // Blue
                              "#8B5CF6", // Purple
                              "#EC4899", // Pink
                              "#14B8A6", // Teal
                              "#F59E0B", // Amber
                            ];
                            const isSelected = selectedCategory === originalIndex;
                            return (
                              <Cell
                                key={`cell-${index}`}
                                fill={colors[originalIndex % colors.length]}
                                opacity={isSelected ? 1 : 0.8}
                                stroke={isSelected ? "#111827" : "none"}
                                strokeWidth={isSelected ? 3 : 0}
                                style={{ cursor: "pointer" }}
                              />
                            );
                          })}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [
                          formatCurrency(value),
                          categoryExpenses.find(cat => cat.amount === value)?.categoryName || name
                        ]}
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #E5E7EB",
                          borderRadius: "8px",
                          padding: "8px 12px",
                        }}
                      />
                      <Legend
                        wrapperStyle={{ paddingTop: "20px" }}
                        iconType="circle"
                        formatter={(value, entry) => {
                          // value bây giờ là tên category từ nameKey="name"
                          // Tìm category trong categoryExpenses (không filter)
                          const category = categoryExpenses.find(cat =>
                            (cat.name || cat.categoryName || cat.category?.name) === value
                          );
                          const originalIndex = categoryExpenses.findIndex(cat =>
                            (cat.name || cat.categoryName || cat.category?.name) === value
                          );
                          const categoryName = value || category?.categoryName || category?.category?.name || "Chưa phân loại";
                          const isHidden = originalIndex >= 0 && hiddenCategories.includes(originalIndex);
                          const isSelected = selectedCategory === originalIndex;
                          const colors = [
                            "#F97316", // Orange
                            "#EF4444", // Red
                            "#10B981", // Green
                            "#3B82F6", // Blue
                            "#8B5CF6", // Purple
                            "#EC4899", // Pink
                            "#14B8A6", // Teal
                            "#F59E0B", // Amber
                          ];
                          // Sử dụng originalIndex để đảm bảo màu khớp với Pie chart
                          const categoryColor = originalIndex >= 0 ? colors[originalIndex % colors.length] : "#9CA3AF";

                          return (
                            <span
                              className="inline-flex items-center gap-2 px-2 py-1 rounded-md transition-all duration-200"
                              style={{
                                color: isHidden ? "#9CA3AF" : isSelected ? "#2563EB" : "#374151",
                                backgroundColor: isSelected ? "#DBEAFE" : isHidden ? "#F3F4F6" : "transparent",
                                textDecoration: isHidden ? "line-through" : "none",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: isSelected ? "600" : "400",
                                border: isSelected ? "1px solid #2563EB" : "1px solid transparent",
                                opacity: isHidden ? 0.5 : 1,
                              }}
                              onMouseEnter={(e) => {
                                if (!isHidden) {
                                  e.currentTarget.style.backgroundColor = "#F3F4F6";
                                  e.currentTarget.style.transform = "scale(1.05)";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.backgroundColor = isHidden ? "#F3F4F6" : "transparent";
                                }
                                e.currentTarget.style.transform = "scale(1)";
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (originalIndex >= 0) {
                                  if (isHidden) {
                                    setHiddenCategories(hiddenCategories.filter(i => i !== originalIndex));
                                  } else {
                                    setHiddenCategories([...hiddenCategories, originalIndex]);
                                  }
                                  if (selectedCategory === originalIndex) {
                                    setSelectedCategory(null);
                                  } else {
                                    setSelectedCategory(originalIndex);
                                  }
                                }
                              }}
                            >
                              <span
                                className="inline-block w-3 h-3 rounded-full"
                                style={{
                                  backgroundColor: categoryColor,
                                  opacity: isHidden ? 0.3 : 1,
                                  border: isSelected ? "2px solid #2563EB" : "none",
                                }}
                              />
                              {categoryName}
                            </span>
                          );
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Right: Income Summary & Category Breakdown */}
            <div className="space-y-6">
              {/* Income Card */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-700">Thu nhập</span>
                  <TrendingDown className="text-gray-400" size={18} />
                </div>
                <p className="text-3xl font-bold text-green-600 mb-2">
                  {loadingOverview ? "..." : formatCurrency(financialOverview.totalIncome)}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span>Tổng thu nhập trong tháng</span>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Chi tiết từng danh mục ({categoryExpenses.length})</h3>
                {loadingOverview ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="animate-pulse flex items-center gap-3">
                        <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                        <div className="w-20 h-4 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : categoryExpenses.length > 0 ? (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {categoryExpenses.map((category, index) => {
                      const colors = [
                        "#F97316", // Orange
                        "#EF4444", // Red
                        "#10B981", // Green
                        "#3B82F6", // Blue
                        "#8B5CF6", // Purple
                        "#EC4899", // Pink
                        "#14B8A6", // Teal
                        "#F59E0B", // Amber
                      ];
                      const isHidden = hiddenCategories.includes(index);
                      const isSelected = selectedCategory === index;
                      const categoryName = category.categoryName || category.category?.name || "Khác";

                      return (
                        <div
                          key={index}
                          onClick={() => {
                            if (isHidden) {
                              setHiddenCategories(hiddenCategories.filter(i => i !== index));
                            }
                            setSelectedCategory(isSelected ? null : index);
                          }}
                          className={`flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer ${isSelected
                            ? "bg-blue-50 border-2 border-blue-300 shadow-sm"
                            : isHidden
                              ? "opacity-40"
                              : "hover:bg-gray-50 border border-transparent hover:border-gray-200"
                            }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full flex-shrink-0 transition-all ${isSelected ? "ring-2 ring-blue-500 ring-offset-1" : ""
                              }`}
                            style={{ backgroundColor: colors[index % colors.length] }}
                          ></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-sm font-medium ${isSelected ? "text-blue-700 font-semibold" : "text-gray-900"
                                }`}>
                                {categoryName}
                              </span>
                              <span className={`text-sm font-semibold ml-2 ${isSelected ? "text-blue-700" : "text-gray-700"
                                }`}>
                                {category.percentage?.toFixed(0) || 0}%
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden mr-3">
                                <div
                                  className="h-full rounded-full transition-all duration-300"
                                  style={{
                                    width: `${category.percentage || 0}%`,
                                    backgroundColor: colors[index % colors.length],
                                    opacity: isHidden ? 0.3 : 1,
                                  }}
                                ></div>
                              </div>
                              <span className={`text-sm font-bold min-w-[100px] text-right ${isSelected ? "text-blue-700" : "text-gray-900"
                                }`}>
                                {formatCurrency(category.amount || 0)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    Không có dữ liệu chi tiêu
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Cards - 4 cards ngang */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Card 1: Tổng số dư */}
          <div className="bg-white rounded-xl p-6 border border-[#E5E7EB] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-[#2563EB]/10 flex items-center justify-center">
                <Wallet className="text-[#2563EB] w-6 h-6" />
              </div>
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-[#2563EB]/10 text-[#2563EB]">Hiện tại</span>
            </div>
            <p className="text-[#6B7280] text-sm mb-1">Tổng số dư</p>
            <p className="text-2xl font-bold text-[#2563EB]">
              {loading ? "..." : formatCurrency(stats.totalBalance)}
            </p>
          </div>

          {/* Card 2: Thu nhập tháng này */}
          <div className="bg-white rounded-xl p-6 border border-[#E5E7EB] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-[#10B981]/10 flex items-center justify-center">
                <TrendingUp className="text-[#10B981] w-6 h-6" />
              </div>
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-[#10B981]/10 text-[#0F9F74]">Tháng này</span>
            </div>
            <p className="text-[#6B7280] text-sm mb-1">Thu nhập</p>
            <p className="text-2xl font-bold text-[#10B981]">
              {loading ? "..." : formatCurrency(stats.monthlyIncome)}
            </p>
          </div>

          {/* Card 3: Chi tiêu tháng này */}
          <div className="bg-white rounded-xl p-6 border border-[#E5E7EB] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-[#EF4444]/10 flex items-center justify-center">
                <TrendingDown className="text-[#EF4444] w-6 h-6" />
              </div>
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-[#FEE2E2] text-[#B91C1C]">Tháng này</span>
            </div>
            <p className="text-[#6B7280] text-sm mb-1">Chi tiêu</p>
            <p className="text-2xl font-bold text-[#EF4444]">
              {loading ? "..." : formatCurrency(stats.monthlyExpense)}
            </p>
          </div>

          {/* Card 4: Số giao dịch */}
          <div className="bg-white rounded-xl p-6 border border-[#E5E7EB] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-[#3B82F6]/10 flex items-center justify-center">
                <BarChart3 className="text-[#3B82F6] w-6 h-6" />
              </div>
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-[#E5EDFF] text-[#2563EB]">Tháng này</span>
            </div>
            <p className="text-[#6B7280] text-sm mb-1">Giao dịch</p>
            <p className="text-2xl font-bold text-[#1F2937]">
              {loading ? "..." : stats.transactionCount}
            </p>
          </div>
        </div>

        {/* Recent Transactions Section */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm mb-8">
          <div className="p-6 border-b border-[#E5E7EB] flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold text-[#111827]">Giao dịch gần đây</h2>
            <div className="flex flex-wrap gap-2">
              <button className="px-3 py-2 text-sm rounded-lg border border-[#E5E7EB] text-[#374151] hover:border-[#2563EB] hover:text-[#2563EB] transition-colors">
                7 ngày
              </button>
              <button className="px-3 py-2 text-sm rounded-lg border border-[#E5E7EB] text-[#374151] hover:border-[#2563EB] hover:text-[#2563EB] transition-colors">
                30 ngày
              </button>
              <button className="px-3 py-2 text-sm rounded-lg border border-[#E5E7EB] text-[#374151] hover:border-[#2563EB] hover:text-[#2563EB] transition-colors">
                Tất cả ví
              </button>
              <Link
                to="/transactions"
                className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-[#2563EB] hover:underline"
              >
                Xem tất cả
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#E5E7EB] rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-[#E5E7EB] rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-[#E5E7EB] rounded w-1/4"></div>
                    </div>
                    <div className="h-4 bg-[#E5E7EB] rounded w-24"></div>
                  </div>
                ))}
              </div>
            ) : recentTransactions.length > 0 ? (
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center gap-4 p-4 rounded-lg hover:bg-[#F9FAFB] transition-colors border border-transparent hover:border-[#E5E7EB]"
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${transaction.type === "income"
                        ? "bg-[#10B981]/10"
                        : "bg-[#EF4444]/10"
                        }`}
                    >
                      {transaction.type === "income" ? (
                        <TrendingUp className="text-[#10B981]" size={20} />
                      ) : (
                        <TrendingDown className="text-[#EF4444]" size={20} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#111827] truncate">
                        {transaction.category}
                      </p>
                      <p className="text-sm text-[#6B7280]">
                        {formatDate(transaction.date)}
                      </p>
                    </div>
                    <p
                      className={`text-lg font-bold ${transaction.type === "income"
                        ? "text-[#10B981]"
                        : "text-[#EF4444]"
                        } text-right`}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-[#6B7280] opacity-50 mx-auto mb-4" />
                <p className="text-[#6B7280] mb-4">Chưa có giao dịch nào</p>
                <Link
                  to="/transactions"
                  className="inline-flex items-center gap-2 text-[#2563EB] hover:underline font-medium"
                >
                  Thêm giao dịch đầu tiên
                  <ArrowRight size={16} />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Section - 3 nút ngang */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Link
            to="/transactions?action=add"
            className="bg-[#2563EB] text-white rounded-xl p-6 flex items-center justify-between hover:bg-[#1D4ED8] transition-colors shadow-sm hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-lg">Thêm giao dịch</p>
                <p className="text-sm opacity-90">Ghi nhận thu chi mới</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            to="/wallets?action=add"
            className="bg-white border-2 border-[#2563EB] text-[#2563EB] rounded-xl p-6 flex items-center justify-between hover:bg-[#F8FAFF] transition-colors shadow-sm hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#2563EB]/10 rounded-lg flex items-center justify-center">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-lg">Thêm ví</p>
                <p className="text-sm opacity-80">Quản lý nhiều ví</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            to="/reports"
            className="bg-white border-2 border-[#2563EB] text-[#2563EB] rounded-xl p-6 flex items-center justify-between hover:bg-[#F8FAFF] transition-colors shadow-sm hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#2563EB]/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-lg">Xem báo cáo</p>
                <p className="text-sm opacity-80">Phân tích tài chính</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
