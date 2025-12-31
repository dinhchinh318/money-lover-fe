// import { useEffect, useState } from "react";
// import { Link, Navigate } from "react-router-dom";
// import { Wallet, TrendingUp, TrendingDown, BarChart3, Plus, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
// import { useCurrentApp } from "../../components/context/app.context";
// import { message } from "antd";
// import LandingPage from "./landing";
// import {
//   PieChart,
//   Pie,
//   Cell,
//   ResponsiveContainer,
//   Tooltip,
//   Legend,
// } from "recharts";
// import { getFinancialDashboardAPI, getCategoryExpenseReportAPI } from "../../services/api.report";
// import { getOverviewStatsAPI, getAllTransactionsAPI } from "../../services/api.transaction";
// import { getWalletsAPI } from "../../services/api.wallet";
// import dayjs from "dayjs";

// function HomePage() {
//   const { user, isAuthenticated } = useCurrentApp();
//   const [loading, setLoading] = useState(true);
//   const [stats, setStats] = useState({
//     totalBalance: 0,
//     monthlyIncome: 0,
//     monthlyExpense: 0,
//     transactionCount: 0,
//   });
//   const [recentTransactions, setRecentTransactions] = useState([]);
//   const [selectedMonth, setSelectedMonth] = useState(dayjs());
//   const [financialOverview, setFinancialOverview] = useState({
//     totalIncome: 0,
//     totalExpense: 0,
//   });
//   const [categoryExpenses, setCategoryExpenses] = useState([]);
//   const [loadingOverview, setLoadingOverview] = useState(false);
//   const [hiddenCategories, setHiddenCategories] = useState([]);
//   const [selectedCategory, setSelectedCategory] = useState(null);

//   useEffect(() => {
//     if (isAuthenticated) {
//       loadDashboardData();
//       loadFinancialOverview();
//     } else {
//       setLoading(false);
//     }
//   }, [isAuthenticated, selectedMonth]);

//   const loadDashboardData = async () => {
//     try {
//       setLoading(true);

//       // Lấy tháng hiện tại để tính stats
//       const currentMonthStart = dayjs().startOf("month");
//       const currentMonthEnd = dayjs().endOf("month");

//       // Gọi các API song song
//       const [walletsRes, statsRes, transactionsRes] = await Promise.all([
//         getWalletsAPI(), // Lấy tất cả ví để tính total balance
//         getOverviewStatsAPI({
//           startDate: currentMonthStart.format("YYYY-MM-DD"),
//           endDate: currentMonthEnd.format("YYYY-MM-DD"),
//         }), // Lấy stats tháng này
//         getAllTransactionsAPI({
//           limit: 10, // Lấy 10 giao dịch gần nhất
//           sortBy: "-date", // Sắp xếp theo ngày giảm dần
//         }), // Lấy recent transactions
//       ]);

//       // Xử lý wallets - tính total balance
//       let totalBalance = 0;
//       if (walletsRes?.status === true && Array.isArray(walletsRes?.data)) {
//         totalBalance = walletsRes.data.reduce((sum, wallet) => {
//           return sum + (Number(wallet.balance) || 0);
//         }, 0);
//       } else if (walletsRes?.EC === 0 && Array.isArray(walletsRes?.data)) {
//         totalBalance = walletsRes.data.reduce((sum, wallet) => {
//           return sum + (Number(wallet.balance) || 0);
//         }, 0);
//       }

//       // Xử lý stats
//       let monthlyIncome = 0;
//       let monthlyExpense = 0;
//       let transactionCount = 0;

//       if (statsRes?.status === true && statsRes?.data) {
//         const data = statsRes.data;
//         monthlyIncome = Number(data.totalIncome) || 0;
//         monthlyExpense = Number(data.totalExpense) || 0;
//         transactionCount = Number(data.transactionCount) || 0;
//       } else if (statsRes?.EC === 0 && statsRes?.data) {
//         const data = statsRes.data;
//         monthlyIncome = Number(data.totalIncome) || 0;
//         monthlyExpense = Number(data.totalExpense) || 0;
//         transactionCount = Number(data.transactionCount) || 0;
//       }

//       // Xử lý recent transactions
//       // API trả về { status: true, data: { transactions: [...], pagination: {...} } }
//       let transactions = [];
//       if (transactionsRes?.status === true && transactionsRes?.data?.transactions) {
//         transactions = Array.isArray(transactionsRes.data.transactions)
//           ? transactionsRes.data.transactions
//           : [];
//       } else if (transactionsRes?.EC === 0 && transactionsRes?.data?.transactions) {
//         transactions = Array.isArray(transactionsRes.data.transactions)
//           ? transactionsRes.data.transactions
//           : [];
//       } else if (transactionsRes?.status === true && Array.isArray(transactionsRes?.data)) {
//         // Fallback nếu data là array trực tiếp
//         transactions = transactionsRes.data;
//       } else if (transactionsRes?.EC === 0 && Array.isArray(transactionsRes?.data)) {
//         // Fallback nếu data là array trực tiếp
//         transactions = transactionsRes.data;
//       }

//       // Transform transactions để hiển thị
//       const transformedTransactions = transactions.slice(0, 10).map((transaction) => ({
//         id: transaction._id || transaction.id,
//         category: transaction.category?.name || transaction.categoryName || "Chưa phân loại",
//         amount: transaction.type === "income" ? Number(transaction.amount) : -Number(transaction.amount),
//         date: new Date(transaction.date),
//         type: transaction.type || "expense",
//       }));

//       setStats({
//         totalBalance,
//         monthlyIncome,
//         monthlyExpense,
//         transactionCount,
//       });

//       setRecentTransactions(transformedTransactions);
//     } catch (error) {
//       console.error("Error loading dashboard data:", error);
//       message.error("Không thể tải dữ liệu!");
//       // Không set mock data, chỉ set giá trị mặc định
//       setStats({
//         totalBalance: 0,
//         monthlyIncome: 0,
//         monthlyExpense: 0,
//         transactionCount: 0,
//       });
//       setRecentTransactions([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadFinancialOverview = async () => {
//     try {
//       setLoadingOverview(true);
//       const monthStart = selectedMonth.startOf("month");
//       const monthEnd = selectedMonth.endOf("month");

//       const [overviewRes, categoryRes] = await Promise.all([
//         getFinancialDashboardAPI({
//           startDate: monthStart.format("YYYY-MM-DD"),
//           endDate: monthEnd.format("YYYY-MM-DD"),
//         }),
//         getCategoryExpenseReportAPI({
//           startDate: monthStart.format("YYYY-MM-DD"),
//           endDate: monthEnd.format("YYYY-MM-DD"),
//         }),
//       ]);

//       // Xử lý Financial Overview - API trả về { status, error, message, data }
//       if (overviewRes?.status === true && overviewRes?.data) {
//         const data = overviewRes.data;
//         setFinancialOverview({
//           totalIncome: Number(data.totalIncome) || 0,
//           totalExpense: Number(data.totalExpense) || 0,
//         });
//       } else if (overviewRes?.EC === 0 && overviewRes?.data) {
//         // Format cũ: { EC, EM, data }
//         const data = overviewRes.data;
//         setFinancialOverview({
//           totalIncome: Number(data.totalIncome) || 0,
//           totalExpense: Number(data.totalExpense) || 0,
//         });
//       } else {
//         // Không có dữ liệu từ API, set về 0
//         setFinancialOverview({
//           totalIncome: 0,
//           totalExpense: 0,
//         });
//       }

//       // Xử lý Category Expenses - API trả về array trong data
//       let categories = [];
//       if (categoryRes?.status === true && Array.isArray(categoryRes?.data)) {
//         categories = categoryRes.data;
//       } else if (categoryRes?.EC === 0 && Array.isArray(categoryRes?.data)) {
//         categories = categoryRes.data;
//       } else if (categoryRes?.status === true && categoryRes?.data?.categories) {
//         categories = categoryRes.data.categories;
//       }

//       // Transform và tính toán percentage
//       if (Array.isArray(categories) && categories.length > 0) {
//         // Tính tổng amount để tính percentage
//         const totalAmount = categories.reduce((sum, cat) => {
//           const amount = Number(cat.totalAmount || cat.amount || 0);
//           return sum + amount;
//         }, 0);

//         // Transform data với percentage - thêm field name cho Pie chart legend
//         const transformedCategories = categories.map((item) => {
//           const amount = Number(item.totalAmount || item.amount || 0);
//           const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
//           const categoryName = item.categoryName || item.name || item.category?.name || "Chưa phân loại";
//           return {
//             name: categoryName, // Field name cho Pie chart legend
//             categoryName: categoryName,
//             amount: amount,
//             percentage: Math.round(percentage * 100) / 100, // Làm tròn 2 chữ số thập phân
//             categoryId: item.categoryId || item._id || item.category?._id,
//             categoryIcon: item.categoryIcon || item.icon || item.category?.icon,
//             count: item.count || 0,
//             category: item.category || null,
//           };
//         });

//         // Sắp xếp theo amount giảm dần
//         transformedCategories.sort((a, b) => b.amount - a.amount);

//         setCategoryExpenses(transformedCategories);
//       } else {
//         // Không có dữ liệu từ API, set mảng rỗng
//         setCategoryExpenses([]);
//       }
//     } catch (error) {
//       console.error("Error loading financial overview:", error);
//       // Khi có lỗi, set về giá trị mặc định (0 hoặc mảng rỗng)
//       setFinancialOverview({
//         totalIncome: 0,
//         totalExpense: 0,
//       });
//       setCategoryExpenses([]);
//     } finally {
//       setLoadingOverview(false);
//     }
//   };

//   const formatCurrency = (amount) => {
//     return new Intl.NumberFormat("vi-VN", {
//       style: "currency",
//       currency: "VND",
//     }).format(amount);
//   };

//   const formatDate = (date) => {
//     const d = new Date(date);
//     const hours = String(d.getHours()).padStart(2, '0');
//     const minutes = String(d.getMinutes()).padStart(2, '0');
//     const day = String(d.getDate()).padStart(2, '0');
//     const month = String(d.getMonth() + 1).padStart(2, '0');
//     const year = d.getFullYear();
//     return `${hours}:${minutes} ${day}/${month}/${year}`;
//   };

//   // Nếu chưa đăng nhập, hiển thị landing page
//   if (!isAuthenticated) {
//     return <LandingPage />;
//   }

//   return (
//     <div className="min-h-screen bg-[#F3F5F8]" style={{ minHeight: 'calc(100vh - 64px - 200px)' }}>
//       {/* Main Content */}
//       <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10" style={{ padding: '28px 32px' }}>
//         {/* Welcome Section */}
//         <div className="mb-8">
//           <h1 className="text-2xl md:text-3xl font-bold text-[#111827] mb-2">
//             {user?.name ? `Xin chào, ${user.name}` : "Xin chào"}
//           </h1>
//           <p className="text-[#6B7280] text-sm">
//             Chào mừng bạn trở lại với MoneyLover
//           </p>
//         </div>

//         {/* Financial Overview Section - Tình hình thu chi */}
//         <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm mb-8 p-6">
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-xl font-bold text-[#111827]">Tình hình thu chi</h2>
//             <div className="flex items-center gap-3">
//               <button
//                 onClick={() => setSelectedMonth(selectedMonth.subtract(1, "month"))}
//                 className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
//               >
//                 <ChevronLeft size={20} className="text-gray-600" />
//               </button>
//               <span className="text-sm font-semibold text-gray-700 min-w-[80px] text-center">
//                 {selectedMonth.format("MM/YYYY")}
//               </span>
//               <button
//                 onClick={() => setSelectedMonth(selectedMonth.add(1, "month"))}
//                 className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
//                 disabled={selectedMonth.isAfter(dayjs(), "month")}
//               >
//                 <ChevronRight
//                   size={20}
//                   className={`${selectedMonth.isAfter(dayjs(), "month") ? "text-gray-300" : "text-gray-600"}`}
//                 />
//               </button>
//             </div>
//           </div>

//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//             {/* Left: Expense Summary & Donut Chart */}
//             <div className="space-y-6">
//               {/* Expense Card */}
//               <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-6 border border-red-100">
//                 <div className="flex items-center justify-between mb-4">
//                   <span className="text-sm font-medium text-gray-700">Chi tiêu</span>
//                   <TrendingUp className="text-red-500" size={18} />
//                 </div>
//                 <p className="text-3xl font-bold text-red-600 mb-2">
//                   {loadingOverview ? "..." : formatCurrency(financialOverview.totalExpense)}
//                 </p>
//                 <div className="flex items-center gap-2 text-xs text-gray-600">
//                   <span>Tổng chi tiêu trong tháng</span>
//                 </div>
//               </div>

//               {/* Donut Chart */}
//               {categoryExpenses.length > 0 && (
//                 <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
//                   <ResponsiveContainer width="100%" height={280}>
//                     <PieChart>
//                       <Pie
//                         data={categoryExpenses.filter((_, index) => !hiddenCategories.includes(index))}
//                         cx="50%"
//                         cy="50%"
//                         innerRadius={60}
//                         outerRadius={100}
//                         paddingAngle={2}
//                         dataKey="amount"
//                         nameKey="name"
//                         label={false}
//                         onClick={(data, index) => {
//                           const originalIndex = categoryExpenses.findIndex(
//                             cat => cat.categoryName === data.categoryName
//                           );
//                           setSelectedCategory(originalIndex === selectedCategory ? null : originalIndex);
//                         }}
//                       >
//                         {categoryExpenses
//                           .filter((_, index) => !hiddenCategories.includes(index))
//                           .map((entry, index) => {
//                             const originalIndex = categoryExpenses.findIndex(
//                               cat => cat.categoryName === entry.categoryName
//                             );
//                             const colors = [
//                               "#F97316", // Orange
//                               "#EF4444", // Red
//                               "#10B981", // Green
//                               "#3B82F6", // Blue
//                               "#8B5CF6", // Purple
//                               "#EC4899", // Pink
//                               "#14B8A6", // Teal
//                               "#F59E0B", // Amber
//                             ];
//                             const isSelected = selectedCategory === originalIndex;
//                             return (
//                               <Cell
//                                 key={`cell-${index}`}
//                                 fill={colors[originalIndex % colors.length]}
//                                 opacity={isSelected ? 1 : 0.8}
//                                 stroke={isSelected ? "#111827" : "none"}
//                                 strokeWidth={isSelected ? 3 : 0}
//                                 style={{ cursor: "pointer" }}
//                               />
//                             );
//                           })}
//                       </Pie>
//                       <Tooltip
//                         formatter={(value, name) => [
//                           formatCurrency(value),
//                           categoryExpenses.find(cat => cat.amount === value)?.categoryName || name
//                         ]}
//                         contentStyle={{
//                           backgroundColor: "white",
//                           border: "1px solid #E5E7EB",
//                           borderRadius: "8px",
//                           padding: "8px 12px",
//                         }}
//                       />
//                       <Legend
//                         wrapperStyle={{ paddingTop: "20px" }}
//                         iconType="circle"
//                         formatter={(value, entry) => {
//                           // value bây giờ là tên category từ nameKey="name"
//                           // Tìm category trong categoryExpenses (không filter)
//                           const category = categoryExpenses.find(cat =>
//                             (cat.name || cat.categoryName || cat.category?.name) === value
//                           );
//                           const originalIndex = categoryExpenses.findIndex(cat =>
//                             (cat.name || cat.categoryName || cat.category?.name) === value
//                           );
//                           const categoryName = value || category?.categoryName || category?.category?.name || "Chưa phân loại";
//                           const isHidden = originalIndex >= 0 && hiddenCategories.includes(originalIndex);
//                           const isSelected = selectedCategory === originalIndex;
//                           const colors = [
//                             "#F97316", // Orange
//                             "#EF4444", // Red
//                             "#10B981", // Green
//                             "#3B82F6", // Blue
//                             "#8B5CF6", // Purple
//                             "#EC4899", // Pink
//                             "#14B8A6", // Teal
//                             "#F59E0B", // Amber
//                           ];
//                           // Sử dụng originalIndex để đảm bảo màu khớp với Pie chart
//                           const categoryColor = originalIndex >= 0 ? colors[originalIndex % colors.length] : "#9CA3AF";

//                           return (
//                             <span
//                               className="inline-flex items-center gap-2 px-2 py-1 rounded-md transition-all duration-200"
//                               style={{
//                                 color: isHidden ? "#9CA3AF" : isSelected ? "#2563EB" : "#374151",
//                                 backgroundColor: isSelected ? "#DBEAFE" : isHidden ? "#F3F4F6" : "transparent",
//                                 textDecoration: isHidden ? "line-through" : "none",
//                                 cursor: "pointer",
//                                 fontSize: "12px",
//                                 fontWeight: isSelected ? "600" : "400",
//                                 border: isSelected ? "1px solid #2563EB" : "1px solid transparent",
//                                 opacity: isHidden ? 0.5 : 1,
//                               }}
//                               onMouseEnter={(e) => {
//                                 if (!isHidden) {
//                                   e.currentTarget.style.backgroundColor = "#F3F4F6";
//                                   e.currentTarget.style.transform = "scale(1.05)";
//                                 }
//                               }}
//                               onMouseLeave={(e) => {
//                                 if (!isSelected) {
//                                   e.currentTarget.style.backgroundColor = isHidden ? "#F3F4F6" : "transparent";
//                                 }
//                                 e.currentTarget.style.transform = "scale(1)";
//                               }}
//                               onClick={(e) => {
//                                 e.stopPropagation();
//                                 if (originalIndex >= 0) {
//                                   if (isHidden) {
//                                     setHiddenCategories(hiddenCategories.filter(i => i !== originalIndex));
//                                   } else {
//                                     setHiddenCategories([...hiddenCategories, originalIndex]);
//                                   }
//                                   if (selectedCategory === originalIndex) {
//                                     setSelectedCategory(null);
//                                   } else {
//                                     setSelectedCategory(originalIndex);
//                                   }
//                                 }
//                               }}
//                             >
//                               <span
//                                 className="inline-block w-3 h-3 rounded-full"
//                                 style={{
//                                   backgroundColor: categoryColor,
//                                   opacity: isHidden ? 0.3 : 1,
//                                   border: isSelected ? "2px solid #2563EB" : "none",
//                                 }}
//                               />
//                               {categoryName}
//                             </span>
//                           );
//                         }}
//                       />
//                     </PieChart>
//                   </ResponsiveContainer>
//                 </div>
//               )}
//             </div>

//             {/* Right: Income Summary & Category Breakdown */}
//             <div className="space-y-6">
//               {/* Income Card */}
//               <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
//                 <div className="flex items-center justify-between mb-4">
//                   <span className="text-sm font-medium text-gray-700">Thu nhập</span>
//                   <TrendingDown className="text-gray-400" size={18} />
//                 </div>
//                 <p className="text-3xl font-bold text-green-600 mb-2">
//                   {loadingOverview ? "..." : formatCurrency(financialOverview.totalIncome)}
//                 </p>
//                 <div className="flex items-center gap-2 text-xs text-gray-600">
//                   <span>Tổng thu nhập trong tháng</span>
//                 </div>
//               </div>

//               {/* Category Breakdown */}
//               <div className="space-y-3">
//                 <h3 className="text-sm font-semibold text-gray-700 mb-4">Chi tiết từng danh mục ({categoryExpenses.length})</h3>
//                 {loadingOverview ? (
//                   <div className="space-y-3">
//                     {[1, 2, 3, 4].map((i) => (
//                       <div key={i} className="animate-pulse flex items-center gap-3">
//                         <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
//                         <div className="flex-1 h-4 bg-gray-200 rounded"></div>
//                         <div className="w-20 h-4 bg-gray-200 rounded"></div>
//                       </div>
//                     ))}
//                   </div>
//                 ) : categoryExpenses.length > 0 ? (
//                   <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
//                     {categoryExpenses.map((category, index) => {
//                       const colors = [
//                         "#F97316", // Orange
//                         "#EF4444", // Red
//                         "#10B981", // Green
//                         "#3B82F6", // Blue
//                         "#8B5CF6", // Purple
//                         "#EC4899", // Pink
//                         "#14B8A6", // Teal
//                         "#F59E0B", // Amber
//                       ];
//                       const isHidden = hiddenCategories.includes(index);
//                       const isSelected = selectedCategory === index;
//                       const categoryName = category.categoryName || category.category?.name || "Khác";

//                       return (
//                         <div
//                           key={index}
//                           onClick={() => {
//                             if (isHidden) {
//                               setHiddenCategories(hiddenCategories.filter(i => i !== index));
//                             }
//                             setSelectedCategory(isSelected ? null : index);
//                           }}
//                           className={`flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer ${isSelected
//                             ? "bg-blue-50 border-2 border-blue-300 shadow-sm"
//                             : isHidden
//                               ? "opacity-40"
//                               : "hover:bg-gray-50 border border-transparent hover:border-gray-200"
//                             }`}
//                         >
//                           <div
//                             className={`w-4 h-4 rounded-full flex-shrink-0 transition-all ${isSelected ? "ring-2 ring-blue-500 ring-offset-1" : ""
//                               }`}
//                             style={{ backgroundColor: colors[index % colors.length] }}
//                           ></div>
//                           <div className="flex-1 min-w-0">
//                             <div className="flex items-center justify-between mb-1">
//                               <span className={`text-sm font-medium ${isSelected ? "text-blue-700 font-semibold" : "text-gray-900"
//                                 }`}>
//                                 {categoryName}
//                               </span>
//                               <span className={`text-sm font-semibold ml-2 ${isSelected ? "text-blue-700" : "text-gray-700"
//                                 }`}>
//                                 {category.percentage?.toFixed(0) || 0}%
//                               </span>
//                             </div>
//                             <div className="flex items-center justify-between">
//                               <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden mr-3">
//                                 <div
//                                   className="h-full rounded-full transition-all duration-300"
//                                   style={{
//                                     width: `${category.percentage || 0}%`,
//                                     backgroundColor: colors[index % colors.length],
//                                     opacity: isHidden ? 0.3 : 1,
//                                   }}
//                                 ></div>
//                               </div>
//                               <span className={`text-sm font-bold min-w-[100px] text-right ${isSelected ? "text-blue-700" : "text-gray-900"
//                                 }`}>
//                                 {formatCurrency(category.amount || 0)}
//                               </span>
//                             </div>
//                           </div>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 ) : (
//                   <div className="text-center py-8 text-gray-500 text-sm">
//                     Không có dữ liệu chi tiêu
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Quick Stats Cards - 4 cards ngang */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//           {/* Card 1: Tổng số dư */}
//           <div className="bg-white rounded-xl p-6 border border-[#E5E7EB] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
//             <div className="flex items-center justify-between mb-4">
//               <div className="w-12 h-12 rounded-full bg-[#2563EB]/10 flex items-center justify-center">
//                 <Wallet className="text-[#2563EB] w-6 h-6" />
//               </div>
//               <span className="px-2 py-1 text-xs font-semibold rounded-full bg-[#2563EB]/10 text-[#2563EB]">Hiện tại</span>
//             </div>
//             <p className="text-[#6B7280] text-sm mb-1">Tổng số dư</p>
//             <p className="text-2xl font-bold text-[#2563EB]">
//               {loading ? "..." : formatCurrency(stats.totalBalance)}
//             </p>
//           </div>

//           {/* Card 2: Thu nhập tháng này */}
//           <div className="bg-white rounded-xl p-6 border border-[#E5E7EB] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
//             <div className="flex items-center justify-between mb-4">
//               <div className="w-12 h-12 rounded-full bg-[#10B981]/10 flex items-center justify-center">
//                 <TrendingUp className="text-[#10B981] w-6 h-6" />
//               </div>
//               <span className="px-2 py-1 text-xs font-semibold rounded-full bg-[#10B981]/10 text-[#0F9F74]">Tháng này</span>
//             </div>
//             <p className="text-[#6B7280] text-sm mb-1">Thu nhập</p>
//             <p className="text-2xl font-bold text-[#10B981]">
//               {loading ? "..." : formatCurrency(stats.monthlyIncome)}
//             </p>
//           </div>

//           {/* Card 3: Chi tiêu tháng này */}
//           <div className="bg-white rounded-xl p-6 border border-[#E5E7EB] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
//             <div className="flex items-center justify-between mb-4">
//               <div className="w-12 h-12 rounded-full bg-[#EF4444]/10 flex items-center justify-center">
//                 <TrendingDown className="text-[#EF4444] w-6 h-6" />
//               </div>
//               <span className="px-2 py-1 text-xs font-semibold rounded-full bg-[#FEE2E2] text-[#B91C1C]">Tháng này</span>
//             </div>
//             <p className="text-[#6B7280] text-sm mb-1">Chi tiêu</p>
//             <p className="text-2xl font-bold text-[#EF4444]">
//               {loading ? "..." : formatCurrency(stats.monthlyExpense)}
//             </p>
//           </div>

//           {/* Card 4: Số giao dịch */}
//           <div className="bg-white rounded-xl p-6 border border-[#E5E7EB] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
//             <div className="flex items-center justify-between mb-4">
//               <div className="w-12 h-12 rounded-full bg-[#3B82F6]/10 flex items-center justify-center">
//                 <BarChart3 className="text-[#3B82F6] w-6 h-6" />
//               </div>
//               <span className="px-2 py-1 text-xs font-semibold rounded-full bg-[#E5EDFF] text-[#2563EB]">Tháng này</span>
//             </div>
//             <p className="text-[#6B7280] text-sm mb-1">Giao dịch</p>
//             <p className="text-2xl font-bold text-[#1F2937]">
//               {loading ? "..." : stats.transactionCount}
//             </p>
//           </div>
//         </div>

//         {/* Recent Transactions Section */}
//         <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm mb-8">
//           <div className="p-6 border-b border-[#E5E7EB] flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
//             <h2 className="text-xl font-semibold text-[#111827]">Giao dịch gần đây</h2>
//             <div className="flex flex-wrap gap-2">
//               <button className="px-3 py-2 text-sm rounded-lg border border-[#E5E7EB] text-[#374151] hover:border-[#2563EB] hover:text-[#2563EB] transition-colors">
//                 7 ngày
//               </button>
//               <button className="px-3 py-2 text-sm rounded-lg border border-[#E5E7EB] text-[#374151] hover:border-[#2563EB] hover:text-[#2563EB] transition-colors">
//                 30 ngày
//               </button>
//               <button className="px-3 py-2 text-sm rounded-lg border border-[#E5E7EB] text-[#374151] hover:border-[#2563EB] hover:text-[#2563EB] transition-colors">
//                 Tất cả ví
//               </button>
//               <Link
//                 to="/transactions"
//                 className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-[#2563EB] hover:underline"
//               >
//                 Xem tất cả
//                 <ArrowRight size={16} />
//               </Link>
//             </div>
//           </div>
//           <div className="p-6">
//             {loading ? (
//               <div className="space-y-4">
//                 {[1, 2, 3, 4, 5].map((i) => (
//                   <div key={i} className="animate-pulse flex items-center gap-4">
//                     <div className="w-12 h-12 bg-[#E5E7EB] rounded-full"></div>
//                     <div className="flex-1">
//                       <div className="h-4 bg-[#E5E7EB] rounded w-1/3 mb-2"></div>
//                       <div className="h-3 bg-[#E5E7EB] rounded w-1/4"></div>
//                     </div>
//                     <div className="h-4 bg-[#E5E7EB] rounded w-24"></div>
//                   </div>
//                 ))}
//               </div>
//             ) : recentTransactions.length > 0 ? (
//               <div className="space-y-4">
//                 {recentTransactions.map((transaction) => (
//                   <div
//                     key={transaction.id}
//                     className="flex items-center gap-4 p-4 rounded-lg hover:bg-[#F9FAFB] transition-colors border border-transparent hover:border-[#E5E7EB]"
//                   >
//                     <div
//                       className={`w-12 h-12 rounded-full flex items-center justify-center ${transaction.type === "income"
//                         ? "bg-[#10B981]/10"
//                         : "bg-[#EF4444]/10"
//                         }`}
//                     >
//                       {transaction.type === "income" ? (
//                         <TrendingUp className="text-[#10B981]" size={20} />
//                       ) : (
//                         <TrendingDown className="text-[#EF4444]" size={20} />
//                       )}
//                     </div>
//                     <div className="flex-1 min-w-0">
//                       <p className="font-semibold text-[#111827] truncate">
//                         {transaction.category}
//                       </p>
//                       <p className="text-sm text-[#6B7280]">
//                         {formatDate(transaction.date)}
//                       </p>
//                     </div>
//                     <p
//                       className={`text-lg font-bold ${transaction.type === "income"
//                         ? "text-[#10B981]"
//                         : "text-[#EF4444]"
//                         } text-right`}
//                     >
//                       {transaction.type === "income" ? "+" : "-"}
//                       {formatCurrency(Math.abs(transaction.amount))}
//                     </p>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <div className="text-center py-12">
//                 <BarChart3 className="w-16 h-16 text-[#6B7280] opacity-50 mx-auto mb-4" />
//                 <p className="text-[#6B7280] mb-4">Chưa có giao dịch nào</p>
//                 <Link
//                   to="/transactions"
//                   className="inline-flex items-center gap-2 text-[#2563EB] hover:underline font-medium"
//                 >
//                   Thêm giao dịch đầu tiên
//                   <ArrowRight size={16} />
//                 </Link>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Quick Actions Section - 3 nút ngang */}
//         <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
//           <Link
//             to="/transactions?action=add"
//             className="bg-[#2563EB] text-white rounded-xl p-6 flex items-center justify-between hover:bg-[#1D4ED8] transition-colors shadow-sm hover:shadow-md"
//           >
//             <div className="flex items-center gap-4">
//               <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
//                 <Plus className="w-6 h-6" />
//               </div>
//               <div>
//                 <p className="font-semibold text-lg">Thêm giao dịch</p>
//                 <p className="text-sm opacity-90">Ghi nhận thu chi mới</p>
//               </div>
//             </div>
//             <ArrowRight className="w-5 h-5" />
//           </Link>

//           <Link
//             to="/wallets?action=add"
//             className="bg-white border-2 border-[#2563EB] text-[#2563EB] rounded-xl p-6 flex items-center justify-between hover:bg-[#F8FAFF] transition-colors shadow-sm hover:shadow-md"
//           >
//             <div className="flex items-center gap-4">
//               <div className="w-12 h-12 bg-[#2563EB]/10 rounded-lg flex items-center justify-center">
//                 <Wallet className="w-6 h-6" />
//               </div>
//               <div>
//                 <p className="font-semibold text-lg">Thêm ví</p>
//                 <p className="text-sm opacity-80">Quản lý nhiều ví</p>
//               </div>
//             </div>
//             <ArrowRight className="w-5 h-5" />
//           </Link>

//           <Link
//             to="/reports"
//             className="bg-white border-2 border-[#2563EB] text-[#2563EB] rounded-xl p-6 flex items-center justify-between hover:bg-[#F8FAFF] transition-colors shadow-sm hover:shadow-md"
//           >
//             <div className="flex items-center gap-4">
//               <div className="w-12 h-12 bg-[#2563EB]/10 rounded-lg flex items-center justify-center">
//                 <BarChart3 className="w-6 h-6" />
//               </div>
//               <div>
//                 <p className="font-semibold text-lg">Xem báo cáo</p>
//                 <p className="text-sm opacity-80">Phân tích tài chính</p>
//               </div>
//             </div>
//             <ArrowRight className="w-5 h-5" />
//           </Link>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default HomePage;















import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Plus,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useCurrentApp } from "../../components/context/app.context";
import { message } from "antd";
import LandingPage from "./landing";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { getFinancialDashboardAPI, getCategoryExpenseReportAPI } from "../../services/api.report";
import { getOverviewStatsAPI, getAllTransactionsAPI } from "../../services/api.transaction";
import { getWalletsAPI } from "../../services/api.wallet";
import dayjs from "dayjs";

function HomePage() {
  const { user, profile, isAuthenticated } = useCurrentApp();

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

  // ===== UI constants (MoneyLover green vibe) =====
  const COLORS = useMemo(
    () => [
      "#10B981", // emerald
      "#34D399",
      "#059669",
      "#22C55E",
      "#16A34A",
      "#0EA5E9", // a bit of freshness
      "#A3E635",
      "#14B8A6",
    ],
    []
  );

  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };


  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
      loadFinancialOverview();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, selectedMonth]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const currentMonthStart = dayjs().startOf("month");
      const currentMonthEnd = dayjs().endOf("month");

      const [walletsRes, statsRes, transactionsRes] = await Promise.all([
        getWalletsAPI(),
        getOverviewStatsAPI({
          startDate: currentMonthStart.format("YYYY-MM-DD"),
          endDate: currentMonthEnd.format("YYYY-MM-DD"),
        }),
        getAllTransactionsAPI({
          limit: 10,
          sortBy: "-date",
        }),
      ]);

      // wallets
      let totalBalance = 0;
      if (walletsRes?.status === true && Array.isArray(walletsRes?.data)) {
        totalBalance = walletsRes.data.reduce((sum, wallet) => sum + (Number(wallet.balance) || 0), 0);
      } else if (walletsRes?.EC === 0 && Array.isArray(walletsRes?.data)) {
        totalBalance = walletsRes.data.reduce((sum, wallet) => sum + (Number(wallet.balance) || 0), 0);
      }

      // stats
      let monthlyIncome = 0;
      let monthlyExpense = 0;
      let transactionCount = 0;

      if (statsRes?.status === true && statsRes?.data) {
        const data = statsRes.data;
        monthlyIncome = Number(data.totalIncome) || 0;
        monthlyExpense = Number(data.totalExpense) || 0;
        transactionCount = Number(data.transactionCount) || 0;
      } else if (statsRes?.EC === 0 && statsRes?.data) {
        const data = statsRes.data;
        monthlyIncome = Number(data.totalIncome) || 0;
        monthlyExpense = Number(data.totalExpense) || 0;
        transactionCount = Number(data.transactionCount) || 0;
      }

      // recent transactions
      let transactions = [];
      if (transactionsRes?.status === true && transactionsRes?.data?.transactions) {
        transactions = Array.isArray(transactionsRes.data.transactions) ? transactionsRes.data.transactions : [];
      } else if (transactionsRes?.EC === 0 && transactionsRes?.data?.transactions) {
        transactions = Array.isArray(transactionsRes.data.transactions) ? transactionsRes.data.transactions : [];
      } else if (transactionsRes?.status === true && Array.isArray(transactionsRes?.data)) {
        transactions = transactionsRes.data;
      } else if (transactionsRes?.EC === 0 && Array.isArray(transactionsRes?.data)) {
        transactions = transactionsRes.data;
      }

      const transformedTransactions = transactions.slice(0, 10).map((transaction) => ({
        id: transaction._id || transaction.id,
        category: transaction.category?.name || transaction.categoryName || "Chưa phân loại",
        amount: transaction.type === "income" ? Number(transaction.amount) : -Number(transaction.amount),
        date: new Date(transaction.date),
        type: transaction.type || "expense",
      }));

      setStats({ totalBalance, monthlyIncome, monthlyExpense, transactionCount });
      setRecentTransactions(transformedTransactions);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      message.error("Không thể tải dữ liệu!");
      setStats({ totalBalance: 0, monthlyIncome: 0, monthlyExpense: 0, transactionCount: 0 });
      setRecentTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFinancialOverview = async () => {
    try {
      setLoadingOverview(true);
      const monthStart = selectedMonth.startOf("month");
      const monthEnd = selectedMonth.endOf("month");

      const [overviewRes, categoryRes] = await Promise.all([
        getFinancialDashboardAPI({
          startDate: monthStart.format("YYYY-MM-DD"),
          endDate: monthEnd.format("YYYY-MM-DD"),
        }),
        getCategoryExpenseReportAPI({
          startDate: monthStart.format("YYYY-MM-DD"),
          endDate: monthEnd.format("YYYY-MM-DD"),
        }),
      ]);

      if (overviewRes?.status === true && overviewRes?.data) {
        const data = overviewRes.data;
        setFinancialOverview({
          totalIncome: Number(data.totalIncome) || 0,
          totalExpense: Number(data.totalExpense) || 0,
        });
      } else if (overviewRes?.EC === 0 && overviewRes?.data) {
        const data = overviewRes.data;
        setFinancialOverview({
          totalIncome: Number(data.totalIncome) || 0,
          totalExpense: Number(data.totalExpense) || 0,
        });
      } else {
        setFinancialOverview({ totalIncome: 0, totalExpense: 0 });
      }

      let categories = [];
      if (categoryRes?.status === true && Array.isArray(categoryRes?.data)) {
        categories = categoryRes.data;
      } else if (categoryRes?.EC === 0 && Array.isArray(categoryRes?.data)) {
        categories = categoryRes.data;
      } else if (categoryRes?.status === true && categoryRes?.data?.categories) {
        categories = categoryRes.data.categories;
      }

      if (Array.isArray(categories) && categories.length > 0) {
        const totalAmount = categories.reduce((sum, cat) => sum + Number(cat.totalAmount || cat.amount || 0), 0);

        const transformedCategories = categories
          .map((item) => {
            const amount = Number(item.totalAmount || item.amount || 0);
            const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
            const categoryName = item.categoryName || item.name || item.category?.name || "Chưa phân loại";
            return {
              name: categoryName,
              categoryName,
              amount,
              percentage: Math.round(percentage * 100) / 100,
              categoryId: item.categoryId || item._id || item.category?._id,
              categoryIcon: item.categoryIcon || item.icon || item.category?.icon,
              count: item.count || 0,
              category: item.category || null,
            };
          })
          .sort((a, b) => b.amount - a.amount);

        setCategoryExpenses(transformedCategories);
      } else {
        setCategoryExpenses([]);
      }
    } catch (error) {
      console.error("Error loading financial overview:", error);
      setFinancialOverview({ totalIncome: 0, totalExpense: 0 });
      setCategoryExpenses([]);
    } finally {
      setLoadingOverview(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  const formatDate = (date) => {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${hours}:${minutes} ${day}/${month}/${year}`;
  };

  if (!isAuthenticated) return <LandingPage />;

  const isFutureMonth = selectedMonth.isAfter(dayjs(), "month");

  const visiblePieData = categoryExpenses
    .map((c, idx) => ({ ...c, __idx: idx }))
    .filter((item) => !hiddenCategories.includes(item.__idx));

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/70 via-white to-white">
      {/* Container */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
                {profile?.displayName ? `Xin chào, ${profile?.displayName}` : "Xin chào"}
              </h1>
              <p className="mt-1 text-sm sm:text-base text-slate-600">
                Chào mừng bạn trở lại với <span className="font-semibold text-emerald-700">MoneyLover</span>
              </p>
            </div>

            {/* Small status pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-3 py-1.5 text-xs sm:text-sm text-slate-700 shadow-sm">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              Đồng bộ dữ liệu: <span className="font-semibold text-emerald-700">{loading ? "Đang tải" : "Sẵn sàng"}</span>
            </div>
          </div>
        </div>

        {/* Financial Overview */}
        <section className="mb-6 sm:mb-8">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">Tình hình thu chi</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Theo dõi thu nhập, chi tiêu và danh mục nổi bật theo tháng
                  </p>
                </div>

                {/* Month switcher */}
                <div className="flex items-center justify-between sm:justify-end gap-2">
                  <button
                    onClick={() => setSelectedMonth(selectedMonth.subtract(1, "month"))}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
                    aria-label="Tháng trước"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <div className="min-w-[7.5rem] text-center">
                    <div className="text-xs text-slate-500">Tháng</div>
                    <div className="text-sm font-semibold text-slate-800">{selectedMonth.format("MM/YYYY")}</div>
                  </div>

                  <button
                    onClick={() => setSelectedMonth(selectedMonth.add(1, "month"))}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isFutureMonth}
                    aria-label="Tháng sau"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left: Cards + Donut */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Expense */}
                    <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 sm:p-5">
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-700">
                            <TrendingDown size={18} />
                          </span>
                          Chi tiêu
                        </div>
                        <span className="rounded-full bg-emerald-600/10 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          Trong tháng
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                          {loadingOverview ? "..." : formatCurrency(financialOverview.totalExpense)}
                        </div>
                        <div className="mt-1 text-xs text-slate-600">Tổng chi tiêu trong tháng đã chọn</div>
                      </div>
                    </div>

                    {/* Income */}
                    <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 sm:p-5">
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-700">
                            <TrendingUp size={18} />
                          </span>
                          Thu nhập
                        </div>
                        <span className="rounded-full bg-emerald-600/10 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          Trong tháng
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                          {loadingOverview ? "..." : formatCurrency(financialOverview.totalIncome)}
                        </div>
                        <div className="mt-1 text-xs text-slate-600">Tổng thu nhập trong tháng đã chọn</div>
                      </div>
                    </div>
                  </div>

                  {/* Donut */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800">Phân bổ chi tiêu theo danh mục</h3>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Chạm vào lát cắt hoặc legend để ẩn/hiện & highlight
                        </p>
                      </div>
                      <div className="text-xs text-slate-500">
                        {categoryExpenses.length > 0 ? `${categoryExpenses.length} danh mục` : "Chưa có dữ liệu"}
                      </div>
                    </div>

                    {categoryExpenses.length > 0 ? (
                      <div className="mt-4">
                        <div className="h-[18rem] sm:h-[20rem]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={visiblePieData}
                                cx="50%"
                                cy="50%"
                                innerRadius="55%"
                                outerRadius="78%"
                                paddingAngle={2}
                                dataKey="amount"
                                nameKey="name"
                                label={false}
                                onClick={(data) => {
                                  const originalIndex = categoryExpenses.findIndex(
                                    (cat) => cat.categoryName === data.categoryName
                                  );
                                  setSelectedCategory(originalIndex === selectedCategory ? null : originalIndex);
                                }}
                              >
                                {visiblePieData.map((entry) => {
                                  const originalIndex = entry.__idx;
                                  const isSelected = selectedCategory === originalIndex;
                                  return (
                                    <Cell
                                      key={`cell-${originalIndex}`}
                                      fill={COLORS[originalIndex % COLORS.length]}
                                      opacity={isSelected ? 1 : 0.85}
                                      stroke={isSelected ? "#064E3B" : "none"}
                                      strokeWidth={isSelected ? 3 : 0}
                                      style={{ cursor: "pointer" }}
                                    />
                                  );
                                })}
                              </Pie>

                              <Tooltip
                                formatter={(value, name) => [
                                  formatCurrency(value),
                                  categoryExpenses.find((cat) => cat.name === name)?.categoryName || name,
                                ]}
                                contentStyle={{
                                  backgroundColor: "white",
                                  border: "1px solid #E2E8F0",
                                  borderRadius: "0.75rem",
                                  padding: "0.6rem 0.75rem",
                                }}
                              />

                              <Legend
                                wrapperStyle={{ paddingTop: "0.75rem" }}
                                iconType="circle"
                                formatter={(value) => {
                                  const originalIndex = categoryExpenses.findIndex(
                                    (cat) => (cat.name || cat.categoryName) === value
                                  );
                                  const isHidden = originalIndex >= 0 && hiddenCategories.includes(originalIndex);
                                  const isSelected = selectedCategory === originalIndex;
                                  const color =
                                    originalIndex >= 0 ? COLORS[originalIndex % COLORS.length] : "#94A3B8";

                                  return (
                                    <span
                                      className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-xs sm:text-sm transition"
                                      style={{
                                        color: isHidden ? "#94A3B8" : isSelected ? "#047857" : "#334155",
                                        backgroundColor: isSelected ? "rgba(16,185,129,0.12)" : "transparent",
                                        textDecoration: isHidden ? "line-through" : "none",
                                        cursor: "pointer",
                                        fontWeight: isSelected ? 700 : 500,
                                        border: isSelected ? "1px solid rgba(16,185,129,0.35)" : "1px solid transparent",
                                        opacity: isHidden ? 0.55 : 1,
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (originalIndex >= 0) {
                                          if (isHidden) {
                                            setHiddenCategories(hiddenCategories.filter((i) => i !== originalIndex));
                                          } else {
                                            setHiddenCategories([...hiddenCategories, originalIndex]);
                                          }
                                          setSelectedCategory((prev) => (prev === originalIndex ? null : originalIndex));
                                        }
                                      }}
                                    >
                                      <span
                                        className="inline-block h-3 w-3 rounded-full"
                                        style={{
                                          backgroundColor: color,
                                          opacity: isHidden ? 0.3 : 1,
                                          border: isSelected ? "2px solid rgba(4,120,87,0.55)" : "none",
                                        }}
                                      />
                                      {value}
                                    </span>
                                  );
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                        <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600/10 text-emerald-700">
                          <BarChart3 />
                        </div>
                        <div className="mt-3 text-sm font-semibold text-slate-800">Chưa có dữ liệu chi tiêu</div>
                        <div className="mt-1 text-xs text-slate-500">Thử thêm giao dịch để xem báo cáo theo danh mục</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Category breakdown */}
                <div className="lg:col-span-6">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 h-full">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800">
                          Chi tiết từng danh mục{" "}
                          <span className="text-slate-400 font-medium">({categoryExpenses.length})</span>
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Chạm vào 1 danh mục để highlight & xem tỉ trọng
                        </p>
                      </div>

                      {selectedCategory !== null && categoryExpenses[selectedCategory] && (
                        <div className="hidden sm:block rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                          <div className="font-semibold">{categoryExpenses[selectedCategory].categoryName}</div>
                          <div className="mt-0.5">
                            {formatCurrency(categoryExpenses[selectedCategory].amount || 0)} •{" "}
                            {(categoryExpenses[selectedCategory].percentage || 0).toFixed(0)}%
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4">
                      {loadingOverview ? (
                        <div className="space-y-3">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="animate-pulse rounded-xl border border-slate-100 p-3">
                              <div className="flex items-center gap-3">
                                <div className="h-4 w-4 rounded-full bg-slate-200" />
                                <div className="flex-1">
                                  <div className="h-3 w-1/2 rounded bg-slate-200" />
                                  <div className="mt-2 h-2 w-2/3 rounded bg-slate-200" />
                                </div>
                                <div className="h-3 w-20 rounded bg-slate-200" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : categoryExpenses.length > 0 ? (
                        <div className="space-y-3 max-h-[22rem] sm:max-h-[26rem] overflow-y-auto pr-1">
                          {categoryExpenses.map((category, index) => {
                            const isHidden = hiddenCategories.includes(index);
                            const isSelected = selectedCategory === index;
                            const categoryName = category.categoryName || category.category?.name || "Khác";
                            const color = COLORS[index % COLORS.length];

                            return (
                              <div
                                key={index}
                                onClick={() => {
                                  if (isHidden) setHiddenCategories(hiddenCategories.filter((i) => i !== index));
                                  setSelectedCategory(isSelected ? null : index);
                                }}
                                className={[
                                  "group rounded-2xl border p-3 sm:p-4 transition cursor-pointer",
                                  isSelected
                                    ? "border-emerald-300 bg-emerald-50 shadow-sm"
                                    : "border-slate-100 hover:border-slate-200 hover:bg-slate-50",
                                  isHidden ? "opacity-50" : "",
                                ].join(" ")}
                              >
                                <div className="flex items-start gap-3">
                                  <div
                                    className="mt-0.5 h-4 w-4 rounded-full flex-shrink-0"
                                    style={{
                                      backgroundColor: color,
                                      boxShadow: isSelected ? "0 0 0 4px rgba(16,185,129,0.14)" : "none",
                                      opacity: isHidden ? 0.35 : 1,
                                    }}
                                  />

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="min-w-0">
                                        <div
                                          className={[
                                            "truncate text-sm sm:text-base font-semibold",
                                            isSelected ? "text-emerald-900" : "text-slate-900",
                                          ].join(" ")}
                                        >
                                          {categoryName}
                                        </div>
                                        <div className="mt-0.5 text-xs text-slate-500">
                                          {category.count ? `${category.count} giao dịch` : " "}
                                        </div>
                                      </div>

                                      <div className="text-right">
                                        <div
                                          className={[
                                            "text-sm sm:text-base font-extrabold",
                                            isSelected ? "text-emerald-900" : "text-slate-900",
                                          ].join(" ")}
                                        >
                                          {formatCurrency(category.amount || 0)}
                                        </div>
                                        <div className="text-xs font-semibold text-slate-600">
                                          {(category.percentage || 0).toFixed(0)}%
                                        </div>
                                      </div>
                                    </div>

                                    <div className="mt-3 h-2.5 w-full rounded-full bg-slate-200/70 overflow-hidden">
                                      <div
                                        className="h-full rounded-full transition-all duration-300"
                                        style={{
                                          width: `${category.percentage || 0}%`,
                                          backgroundColor: color,
                                          opacity: isHidden ? 0.3 : 1,
                                        }}
                                      />
                                    </div>

                                    <div className="mt-3 flex items-center gap-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (isHidden) {
                                            setHiddenCategories(hiddenCategories.filter((i) => i !== index));
                                          } else {
                                            setHiddenCategories([...hiddenCategories, index]);
                                          }
                                          if (selectedCategory === index) setSelectedCategory(null);
                                        }}
                                        className={[
                                          "rounded-full px-3 py-1 text-xs font-semibold border transition",
                                          isHidden
                                            ? "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                                            : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                                        ].join(" ")}
                                      >
                                        {isHidden ? "Hiện" : "Ẩn"} trên biểu đồ
                                      </button>

                                      <span className="text-xs text-slate-400 group-hover:text-slate-500 transition">
                                        Chạm để highlight
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                          <div className="text-sm font-semibold text-slate-800">Không có dữ liệu chi tiêu</div>
                          <div className="mt-1 text-xs text-slate-500">Chọn tháng khác hoặc thêm giao dịch mới</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="mb-6 sm:mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <StatCard
              title="Tổng số dư"
              badge="Hiện tại"
              value={loading ? "..." : formatCurrency(stats.totalBalance)}
              icon={<Wallet className="h-5 w-5" />}
              tone="emerald"
            />
            <StatCard
              title="Thu nhập"
              badge="Tháng này"
              value={loading ? "..." : formatCurrency(stats.monthlyIncome)}
              icon={<TrendingUp className="h-5 w-5" />}
              tone="emerald"
            />
            <StatCard
              title="Chi tiêu"
              badge="Tháng này"
              value={loading ? "..." : formatCurrency(stats.monthlyExpense)}
              icon={<TrendingDown className="h-5 w-5" />}
              tone="emerald"
            />
            <StatCard
              title="Giao dịch"
              badge="Tháng này"
              value={loading ? "..." : stats.transactionCount}
              icon={<BarChart3 className="h-5 w-5" />}
              tone="emerald"
            />
          </div>
        </section>

        {/* Recent Transactions */}
        <section className="mb-6 sm:mb-8">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-200">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">Giao dịch gần đây</h2>
                  <p className="mt-1 text-sm text-slate-600">10 giao dịch mới nhất của bạn</p>
                </div>

                {/* Filters (UI only giữ nguyên như bạn có) */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                  <PillButton>7 ngày</PillButton>
                  <PillButton>30 ngày</PillButton>
                  <PillButton>Tất cả ví</PillButton>

                  <Link
                    to="/transactions"
                    className="ml-1 inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition whitespace-nowrap"
                  >
                    Xem tất cả <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="animate-pulse rounded-2xl border border-slate-100 p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-slate-200" />
                        <div className="flex-1">
                          <div className="h-4 w-1/3 rounded bg-slate-200" />
                          <div className="mt-2 h-3 w-1/4 rounded bg-slate-200" />
                        </div>
                        <div className="h-4 w-24 rounded bg-slate-200" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentTransactions.length > 0 ? (
                <div className="space-y-3">
                  {recentTransactions.map((transaction) => {
                    const isIncome = transaction.type === "income";
                    return (
                      <div
                        key={transaction.id}
                        className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 transition hover:bg-slate-50 hover:border-slate-200"
                      >
                        <div
                          className={[
                            "h-12 w-12 rounded-2xl flex items-center justify-center",
                            isIncome ? "bg-emerald-600/10 text-emerald-700" : "bg-rose-500/10 text-rose-600",
                          ].join(" ")}
                        >
                          {isIncome ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold text-slate-900 truncate">{transaction.category}</p>
                            <p
                              className={[
                                "text-base sm:text-lg font-extrabold whitespace-nowrap",
                                isIncome ? "text-emerald-700" : "text-rose-600",
                              ].join(" ")}
                            >
                              {isIncome ? "+" : "-"}
                              {formatCurrency(Math.abs(transaction.amount))}
                            </p>
                          </div>
                          <p className="mt-1 text-sm text-slate-600">{formatDate(transaction.date)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                  <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600/10 text-emerald-700">
                    <BarChart3 className="h-7 w-7" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-800">Chưa có giao dịch nào</p>
                  <p className="mt-1 text-xs text-slate-500">Bắt đầu ghi nhận thu chi để theo dõi tài chính</p>
                  <Link
                    to="/transactions"
                    onClick={scrollToTop}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99]"
                  >
                    Thêm giao dịch đầu tiên <ArrowRight size={16} />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            <ActionCard
              to="/transactions?action=add"
              title="Thêm giao dịch"
              desc="Ghi nhận thu chi mới"
              icon={<Plus className="h-6 w-6" />}
              variant="primary"
            />
            <ActionCard
              to="/wallets?action=add"
              title="Thêm ví"
              desc="Quản lý nhiều ví"
              icon={<Wallet className="h-6 w-6" />}
              variant="outline"
            />
            <ActionCard
              to="/reports"
              title="Xem báo cáo"
              desc="Phân tích tài chính"
              icon={<BarChart3 className="h-6 w-6" />}
              variant="outline"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function PillButton({ children }) {
  return (
    <button className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98] whitespace-nowrap">
      {children}
    </button>
  );
}

function StatCard({ title, badge, value, icon, tone = "emerald" }) {
  const toneMap = {
    emerald: {
      ring: "hover:ring-emerald-200",
      iconBg: "bg-emerald-600/10 text-emerald-700",
      badge: "bg-emerald-600/10 text-emerald-700",
    },
  };

  const t = toneMap[tone] || toneMap.emerald;

  return (
    <div
      className={[
        "rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm transition",
        "hover:shadow-md hover:-translate-y-0.5 hover:ring-4",
        t.ring,
      ].join(" ")}
    >
      <div className="flex items-center justify-between">
        <div className={["h-12 w-12 rounded-2xl flex items-center justify-center", t.iconBg].join(" ")}>
          {icon}
        </div>
        <span className={["rounded-full px-2.5 py-1 text-xs font-bold", t.badge].join(" ")}>{badge}</span>
      </div>

      <div className="mt-3">
        <div className="text-sm text-slate-600">{title}</div>
        <div className="mt-1 text-xl sm:text-2xl font-extrabold text-slate-900">{value}</div>
      </div>
    </div>
  );
}

function ActionCard({ to, title, desc, icon, variant = "outline" }) {
  const isPrimary = variant === "primary";
  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };
  return (
    <Link
      to={to}
      onClick={scrollToTop}
      className={[
        "group rounded-2xl p-5 sm:p-6 transition shadow-sm hover:shadow-md active:scale-[0.99]",
        "flex items-center justify-between gap-4",
        isPrimary
          ? "bg-emerald-600 text-white hover:bg-emerald-700"
          : "bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-50",
      ].join(" ")}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div
          className={[
            "h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0",
            isPrimary ? "bg-white/15" : "bg-emerald-600/10 text-emerald-700",
          ].join(" ")}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-lg font-extrabold truncate">{title}</div>
          <div className={["text-sm truncate", isPrimary ? "text-white/85" : "text-emerald-800/80"].join(" ")}>
            {desc}
          </div>
        </div>
      </div>

      <ArrowRight className={["h-5 w-5 transition", "group-hover:translate-x-0.5"].join(" ")} />
    </Link>
  );
}

export default HomePage;
