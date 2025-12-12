import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Wallet, TrendingUp, TrendingDown, BarChart3, Plus, ArrowRight } from "lucide-react";
import { useCurrentApp } from "../../components/context/app.context";
import { message } from "antd";
import LandingPage from "./landing";

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

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

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
    <div className="min-h-screen bg-[#F9FAFB]" style={{ minHeight: 'calc(100vh - 64px - 200px)' }}>
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8" style={{ padding: '24px 32px' }}>
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-[#111827] mb-2" style={{ fontSize: '24px' }}>
            {user?.name ? `Xin chào, ${user.name}` : "Xin chào"}
          </h1>
          <p className="text-[#6B7280] text-sm" style={{ fontSize: '14px' }}>
            Chào mừng bạn trở lại với MoneyLover
          </p>
        </div>

        {/* Quick Stats Cards - 4 cards ngang */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Card 1: Tổng số dư */}
          <div className="bg-white rounded-xl p-6 border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow" style={{ borderRadius: '12px', padding: '24px' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#16A34A]/10 rounded-lg flex items-center justify-center">
                <Wallet className="text-[#16A34A] w-6 h-6" />
              </div>
            </div>
            <p className="text-[#6B7280] text-sm mb-1">Tổng số dư</p>
            <p className="text-2xl font-bold text-[#16A34A]">
              {loading ? "..." : formatCurrency(stats.totalBalance)}
            </p>
          </div>

          {/* Card 2: Thu nhập tháng này */}
          <div className="bg-white rounded-xl p-6 border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow" style={{ borderRadius: '12px', padding: '24px' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#10B981]/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-[#10B981] w-6 h-6" />
              </div>
            </div>
            <p className="text-[#6B7280] text-sm mb-1">Thu nhập tháng này</p>
            <p className="text-2xl font-bold text-[#10B981]">
              {loading ? "..." : formatCurrency(stats.monthlyIncome)}
            </p>
          </div>

          {/* Card 3: Chi tiêu tháng này */}
          <div className="bg-white rounded-xl p-6 border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow" style={{ borderRadius: '12px', padding: '24px' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#EF4444]/10 rounded-lg flex items-center justify-center">
                <TrendingDown className="text-[#EF4444] w-6 h-6" />
              </div>
            </div>
            <p className="text-[#6B7280] text-sm mb-1">Chi tiêu tháng này</p>
            <p className="text-2xl font-bold text-[#EF4444]">
              {loading ? "..." : formatCurrency(stats.monthlyExpense)}
            </p>
          </div>

          {/* Card 4: Số giao dịch */}
          <div className="bg-white rounded-xl p-6 border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow" style={{ borderRadius: '12px', padding: '24px' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#6B7280]/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="text-[#6B7280] w-6 h-6" />
              </div>
            </div>
            <p className="text-[#6B7280] text-sm mb-1">Giao dịch</p>
            <p className="text-2xl font-bold text-[#6B7280]">
              {loading ? "..." : stats.transactionCount}
            </p>
          </div>
        </div>

        {/* Recent Transactions Section */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm mb-8" style={{ borderRadius: '12px' }}>
          <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between" style={{ padding: '24px' }}>
            <h2 className="text-xl font-semibold text-[#111827]">Giao dịch gần đây</h2>
            <Link
              to="/transactions"
              className="text-[#16A34A] hover:underline flex items-center gap-1 text-sm font-medium"
            >
              Xem tất cả
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="p-6" style={{ padding: '24px' }}>
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
                    className="flex items-center gap-4 p-4 rounded-lg hover:bg-[#F9FAFB] transition-colors"
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        transaction.type === "income"
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
                    <div className="flex-1">
                      <p className="font-semibold text-[#111827]">
                        {transaction.category}
                      </p>
                      <p className="text-sm text-[#6B7280]">
                        {formatDate(transaction.date)}
                      </p>
                    </div>
                    <p
                      className={`text-lg font-bold ${
                        transaction.type === "income"
                          ? "text-[#10B981]"
                          : "text-[#EF4444]"
                      }`}
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
                  className="inline-flex items-center gap-2 text-[#16A34A] hover:underline font-medium"
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
            className="bg-[#16A34A] text-white rounded-xl p-6 flex items-center justify-between hover:bg-[#15803d] transition-colors shadow-sm hover:shadow-md"
            style={{ borderRadius: '12px' }}
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
            className="bg-white border-2 border-[#16A34A] text-[#16A34A] rounded-xl p-6 flex items-center justify-between hover:bg-[#F9FAFB] transition-colors shadow-sm hover:shadow-md"
            style={{ borderRadius: '12px' }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#16A34A]/10 rounded-lg flex items-center justify-center">
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
            className="bg-white border-2 border-[#16A34A] text-[#16A34A] rounded-xl p-6 flex items-center justify-between hover:bg-[#F9FAFB] transition-colors shadow-sm hover:shadow-md"
            style={{ borderRadius: '12px' }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#16A34A]/10 rounded-lg flex items-center justify-center">
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
