import { useState, useEffect } from "react";
import { Card, Tabs, Spin, Button, Collapse } from "antd";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Scale,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  PieChart as PieChartIcon,
  Calendar,
  BarChart3,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  getFinancialDashboardAPI,
  getWalletChangesAPI,
  compareCurrentMonthWithPreviousAPI,
  compareCurrentYearWithPreviousAPI,
  getTimeBasedReportAPI,
  getCategoryExpenseReportAPI,
} from "../../../services/api.report";
import dayjs from "dayjs";

// ✅ i18n
import { useTranslation } from "react-i18next";

const ReportsDashboard = () => {
  const { t, i18n } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  const [comparisonTab, setComparisonTab] = useState("month");
  const [chartTab, setChartTab] = useState("month");
  const [chartData, setChartData] = useState([]);
  const [isUsingTestData, setIsUsingTestData] = useState(false);
  const [categoryExpenseData, setCategoryExpenseData] = useState([]);
  const [categoryExpenseLoading, setCategoryExpenseLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(dayjs());
  const [expandedCategories, setExpandedCategories] = useState([]);

  const [chartTheme, setChartTheme] = useState({
    grid: "#E5E7EB",
    axis: "#6B7280",
    tooltipBg: "#fff",
    tooltipBorder: "#E5E7EB",
    tooltipText: "#111827",
  });

  useEffect(() => {
    const apply = () => {
      const s = getComputedStyle(document.documentElement);
      setChartTheme({
        grid: s.getPropertyValue("--color-border").trim() || "#E5E7EB",
        axis: s.getPropertyValue("--color-text-secondary").trim() || "#6B7280",
        tooltipBg: s.getPropertyValue("--color-background-alt").trim() || "#fff",
        tooltipBorder: s.getPropertyValue("--color-border").trim() || "#E5E7EB",
        tooltipText: s.getPropertyValue("--color-text-primary").trim() || "#111827",
      });
    };

    apply();
    const obs = new MutationObserver(apply);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const formatCurrency = (value) => {
    const locale = i18n.language === "en" ? "en-US" : "vi-VN";
    return new Intl.NumberFormat(locale, { style: "currency", currency: "VND" }).format(value || 0);
  };

  // ====== Test data ======
  const generateTestData = (period) => {
    const testData = [];
    let count = 0;

    if (period === "week") {
      count = 7;
      for (let i = 0; i < count; i++) {
        const weekStart = dayjs().subtract(count - 1 - i, "week").startOf("week");
        testData.push({
          label: t("reportsDashboard.labels.weekLabelShort", { date: weekStart.format("DD/MM") }),
          expense: Math.floor(Math.random() * 5000000) + 1000000,
          income: Math.floor(Math.random() * 8000000) + 2000000,
        });
      }
    } else if (period === "month") {
      count = 6;
      for (let i = 0; i < count; i++) {
        const monthDate = dayjs().subtract(count - 1 - i, "month");
        testData.push({
          label: monthDate.format("MM/YYYY"),
          expense: Math.floor(Math.random() * 15000000) + 5000000,
          income: Math.floor(Math.random() * 25000000) + 10000000,
        });
      }
    } else {
      count = 6;
      for (let i = 0; i < count; i++) {
        const year = dayjs().subtract(count - 1 - i, "year").year();
        testData.push({
          label: String(year),
          expense: Math.floor(Math.random() * 100000000) + 50000000,
          income: Math.floor(Math.random() * 200000000) + 100000000,
        });
      }
    }

    return testData;
  };

  // ====== Overview ======
  const [overview, setOverview] = useState({
    totalIncome: 5990000,
    incomeChange: 5,
    totalExpense: 1200000,
    expenseChange: 10,
    totalBalance: 3600000,
    difference: -3000000,
  });

  // ====== Comparison ======
  const [comparison, setComparison] = useState({
    current: {
      income: 12000000,
      incomeChange: 5,
      expense: 11200000,
      expenseChange: -10,
      balance: 5600000,
      balanceChange: 20,
    },
    previous: {
      income: 12000000,
      incomeChange: 20,
      expense: 11200000,
      expenseChange: -10,
      balance: 5000000,
      balanceChange: -5,
    },
  });

  // ====== Wallet fluctuations ======
  const [walletFluctuations, setWalletFluctuations] = useState([]);

  useEffect(() => {
    loadDashboardData();
    loadComparisonData();
    loadWalletChanges();
    loadChartData();
    loadCategoryExpenseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comparisonTab, chartTab, selectedPeriod, i18n.language]);

  const loadDashboardData = async () => {
    try {
      const monthStart = selectedPeriod.startOf("month");
      const monthEnd = selectedPeriod.endOf("month");
      const params = { startDate: monthStart.format("YYYY-MM-DD"), endDate: monthEnd.format("YYYY-MM-DD") };

      const res = await getFinancialDashboardAPI(params);
      if ((res?.status === true || res?.error === 0) && res?.data) {
        const data = res.data;
        setOverview({
          totalIncome: data.totalIncome || 0,
          incomeChange: data.incomeChange || 0,
          totalExpense: data.totalExpense || 0,
          expenseChange: data.expenseChange || 0,
          totalBalance: data.totalWalletBalance || 0,
          difference: (data.totalIncome || 0) - (data.totalExpense || 0),
        });
      }
    } catch (error) {
      // ignore
    }
  };

  const loadComparisonData = async () => {
    setLoading(true);
    try {
      let res;
      switch (comparisonTab) {
        case "year":
          res = await compareCurrentYearWithPreviousAPI();
          break;
        case "month":
        default:
          res = await compareCurrentMonthWithPreviousAPI();
      }

      if ((res?.status === true || res?.error === 0) && res?.data) {
        const data = res.data;
        setComparison({
          current: {
            income: data.current?.totalIncome || 0,
            incomeChange: data.comparison?.incomeChangePercent || 0,
            expense: data.current?.totalExpense || 0,
            expenseChange: data.comparison?.expenseChangePercent || 0,
            balance: data.current?.balance || 0,
            balanceChange: data.comparison?.balanceChangePercent || 0,
          },
          previous: {
            income: data.previous?.totalIncome || 0,
            incomeChange: 0,
            expense: data.previous?.totalExpense || 0,
            expenseChange: 0,
            balance: data.previous?.balance || 0,
            balanceChange: 0,
          },
        });
      }
    } catch (error) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const loadWalletChanges = async () => {
    try {
      const monthStart = selectedPeriod.startOf("month");
      const monthEnd = selectedPeriod.endOf("month");
      const params = { startDate: monthStart.format("YYYY-MM-DD"), endDate: monthEnd.format("YYYY-MM-DD") };

      const res = await getWalletChangesAPI(params);
      if ((res?.status === true || res?.error === 0) && res?.data) {
        setWalletFluctuations(res.data.wallets || []);
      } else {
        setWalletFluctuations([]);
      }
    } catch (error) {
      console.error("Error loading wallet changes:", error);
      setWalletFluctuations([]);
    }
  };

  const loadChartData = async () => {
    setChartLoading(true);
    try {
      let params = {};
      let period = "week";

      const now = dayjs();

      switch (chartTab) {
        case "week": {
          period = "week";
          const currentWeekStart = now.startOf("week");
          const weekStart = currentWeekStart.subtract(6, "week");
          const weekEnd = now;

          params = {
            startDate: weekStart.format("YYYY-MM-DD"),
            endDate: weekEnd.format("YYYY-MM-DD"),
            period: "week",
          };
          break;
        }
        case "month": {
          period = "month";
          const currentMonthStart = now.startOf("month");
          const monthStart = currentMonthStart.subtract(5, "month");
          const monthEnd = now;

          params = {
            startDate: monthStart.format("YYYY-MM-DD"),
            endDate: monthEnd.format("YYYY-MM-DD"),
            period: "month",
          };
          break;
        }
        case "year":
        default: {
          period = "year";
          const currentYearStart = now.startOf("year");
          const yearStart = currentYearStart.subtract(5, "year");
          const yearEnd = now;

          params = {
            startDate: yearStart.format("YYYY-MM-DD"),
            endDate: yearEnd.format("YYYY-MM-DD"),
            period: "year",
          };
          break;
        }
      }

      if (!params.startDate || !params.endDate) {
        setChartData([]);
        setIsUsingTestData(false);
        return;
      }

      if (dayjs(params.startDate).isAfter(dayjs(params.endDate))) {
        setChartData([]);
        setIsUsingTestData(false);
        return;
      }

      let res;
      let apiSuccess = false;

      try {
        res = await getTimeBasedReportAPI(params);

        const isValidResponse =
          res &&
          (res.status === true || res.error === 0 || res.EC === 0) &&
          res.data !== undefined &&
          res.data !== null;

        if (isValidResponse) {
          const data = res.data;

          if (Array.isArray(data)) {
            if (data.length > 0) apiSuccess = true;
            else {
              setChartData([]);
              setIsUsingTestData(false);
              return;
            }
          }

          if (apiSuccess) {
            let formattedData = data.map((item, index) => {
              let label = "";

              if (period === "week") {
                if (item.label) label = item.label;
                else if (item.year && item.week) {
                  const jan1 = dayjs(`${item.year}-01-01`);
                  const weekStart = jan1.add((item.week - 1) * 7, "day").startOf("week");
                  label = t("reportsDashboard.labels.weekLabelShort", { date: weekStart.format("DD/MM") });
                } else label = t("reportsDashboard.labels.weekFallback", { index: index + 1 });
              } else if (period === "month") {
                if (item.label) label = item.label;
                else if (item.year && item.month) {
                  label = dayjs(`${item.year}-${String(item.month).padStart(2, "0")}-01`).format("MM/YYYY");
                } else label = t("reportsDashboard.labels.monthFallback", { index: index + 1 });
              } else {
                if (item.label) label = item.label;
                else if (item.year) label = String(item.year);
                else label = t("reportsDashboard.labels.yearFallback", { index: index + 1 });
              }

              return {
                label: label || t("reportsDashboard.labels.itemFallback", { index: index + 1 }),
                expense: Number(item.totalExpense || item.expense || 0),
                income: Number(item.totalIncome || item.income || 0),
                year: item.year || null,
              };
            });

            if (period === "year") {
              const currentYear = now.year();
              const yearDataMap = new Map();

              formattedData.forEach((item) => {
                let y = null;
                if (item.year) y = Number(item.year);
                else if (item.label) {
                  const m = item.label.match(/\d{4}/);
                  if (m) y = Number(m[0]);
                }
                if (y) yearDataMap.set(y, item);
              });

              const sixYearsData = [];
              for (let i = 5; i >= 0; i--) {
                const y = currentYear - i;
                const yearData = yearDataMap.get(y);
                if (yearData) {
                  sixYearsData.push({
                    label: String(y),
                    expense: yearData.expense || 0,
                    income: yearData.income || 0,
                    year: y,
                  });
                }
              }
              if (sixYearsData.length > 0) formattedData = sixYearsData;
            }

            setChartData(formattedData);
            setIsUsingTestData(false);
            return;
          }
        }
      } catch (apiError) {
        // ignore
      }

      const testData = generateTestData(period);
      setChartData(testData);
      setIsUsingTestData(true);
    } catch (error) {
      setChartData([]);
      setIsUsingTestData(false);
    } finally {
      setChartLoading(false);
    }
  };

  const loadCategoryExpenseData = async () => {
    setCategoryExpenseLoading(true);
    try {
      const monthStart = selectedPeriod.startOf("month");
      const monthEnd = selectedPeriod.endOf("month");
      const params = { startDate: monthStart.format("YYYY-MM-DD"), endDate: monthEnd.format("YYYY-MM-DD") };

      const res = await getCategoryExpenseReportAPI(params);
      if ((res?.status === true || res?.error === 0) && res?.data) {
        setCategoryExpenseData(res.data || []);
      } else {
        setCategoryExpenseData([]);
      }
    } catch (error) {
      setCategoryExpenseData([]);
    } finally {
      setCategoryExpenseLoading(false);
    }
  };

  const COLORS = [
    "#F59E0B",
    "#EF4444",
    "#10B981",
    "#3B82F6",
    "#8B5CF6",
    "#EC4899",
    "#14B8A6",
    "#F97316",
    "#6366F1",
    "#84CC16",
  ];

  const getPieChartData = () => {
    if (!categoryExpenseData || categoryExpenseData.length === 0) return [];

    const total = categoryExpenseData.reduce(
      (sum, item) => sum + (item.totalAmount || item.amount || 0),
      0
    );

    return categoryExpenseData.map((item, index) => ({
      name: item.categoryName || item.name || t("reportsDashboard.pie.uncategorized"),
      value: item.totalAmount || item.amount || 0,
      percentage: total > 0 ? (((item.totalAmount || item.amount || 0) / total) * 100).toFixed(0) : 0,
      color: COLORS[index % COLORS.length],
      previousAmount: item.previousAmount || 0,
    }));
  };

  const getCategoryExpenseSummary = () => {
    const pieData = getPieChartData();
    const totalExpense = pieData.reduce((sum, item) => sum + item.value, 0);
    const previousTotal = pieData.reduce((sum, item) => sum + (item.previousAmount || 0), 0);
    const difference = totalExpense - previousTotal;
    const changePercent = previousTotal > 0 ? ((difference / previousTotal) * 100).toFixed(1) : 0;

    return { totalExpense, previousTotal, difference, changePercent };
  };

  const handlePreviousPeriod = () => setSelectedPeriod(selectedPeriod.subtract(1, "month"));

  const handleNextPeriod = () => {
    const nextPeriod = selectedPeriod.add(1, "month");
    if (nextPeriod.isBefore(dayjs(), "month") || nextPeriod.isSame(dayjs(), "month")) {
      setSelectedPeriod(nextPeriod);
    }
  };

  const handleCurrentPeriod = () => setSelectedPeriod(dayjs());

  const getChangeColor = (value) => {
    if (value > 0) return "text-[#10B981]";
    if (value < 0) return "text-[#EF4444]";
    return "text-gray-600";
  };

  const getPeriodLabels = () => {
    switch (comparisonTab) {
      case "year":
        return { current: t("reportsDashboard.period.yearThis"), previous: t("reportsDashboard.period.yearPrev") };
      case "month":
      default:
        return { current: t("reportsDashboard.period.monthThis"), previous: t("reportsDashboard.period.monthPrev") };
    }
  };

  const comparisonTabItems = [
    { key: "month", label: t("reportsDashboard.tabs.month") },
    { key: "year", label: t("reportsDashboard.tabs.year") },
  ];

  // NOTE: bạn đang dùng month/year, nếu muốn mở week thì thêm 1 item {key:"week",label:t(...)}
  const chartTabItems = [
    { key: "month", label: t("reportsDashboard.tabs.month") },
    { key: "year", label: t("reportsDashboard.tabs.year") },
  ];

  return (
    <div
      className="
        min-h-screen
        bg-gradient-to-b from-emerald-50/70 via-white to-white
        dark:bg-none dark:bg-[var(--color-background)]
        dark:text-[var(--color-text-primary)]
      "
    >
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-4">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <DollarSign className="text-white w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            <div className="flex-1 min-w-0">
              <h1
                className="
                  text-2xl sm:text-3xl font-bold
                  bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 bg-clip-text text-transparent
                  dark:bg-none dark:text-[var(--color-text-primary)] dark:[-webkit-text-fill-color:var(--color-text-primary)]
                "
              >
                {t("reportsDashboard.title")}
              </h1>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mt-2">
                <Card className="p-0 border-2 border-gray-200 shadow-md rounded-xl overflow-hidden">
                  <div
                    className="
                      flex items-center gap-2 px-4 py-2
                      bg-gradient-to-r from-white to-gray-50
                      dark:bg-none dark:bg-[rgba(255,255,255,0.03)]
                      dark:border dark:border-[var(--color-border)]
                    "
                  >
                    <Button
                      type="text"
                      size="small"
                      icon={<ChevronLeft size={18} />}
                      onClick={handlePreviousPeriod}
                      className="p-1 hover:bg-blue-50 rounded-lg transition-colors"
                    />

                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200">
                      <Calendar className="text-blue-500" size={16} />
                      <p className="text-sm font-bold text-gray-800">
                        {t("reportsDashboard.period.monthDisplay", { value: selectedPeriod.format("MM/YYYY") })}
                      </p>
                    </div>

                    <Button
                      type="text"
                      size="small"
                      icon={<ChevronRight size={18} />}
                      onClick={handleNextPeriod}
                      disabled={selectedPeriod.isSame(dayjs(), "month") || selectedPeriod.isAfter(dayjs(), "month")}
                      className="p-1 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-30"
                    />
                  </div>
                </Card>

                {!selectedPeriod.isSame(dayjs(), "month") && (
                  <Button
                    type="link"
                    size="small"
                    onClick={handleCurrentPeriod}
                    className="text-[#10B981] hover:text-[#059669] font-semibold px-4 py-2 bg-green-50 hover:bg-green-100 rounded-lg transition-all"
                  >
                    {t("reportsDashboard.period.backToThisMonth")}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Overview cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card
            className="
              shadow-lg hover:shadow-xl transition-all duration-300 border-0 rounded-2xl overflow-hidden
              bg-gradient-to-br from-green-50 to-emerald-50
              dark:bg-gradient-to-br dark:from-emerald-900/20 dark:to-slate-950/20
              dark:!text-[var(--color-text-primary)]
            "
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-700">{t("reportsDashboard.overview.totalIncome")}</span>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md">
                <TrendingUp size={24} className="text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[#10B981] mb-3">{formatCurrency(overview.totalIncome)}</div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-green-200">
              {overview.incomeChange >= 0 ? (
                <ArrowUpRight className="text-[#10B981]" size={16} />
              ) : (
                <ArrowDownRight className="text-[#EF4444]" size={16} />
              )}
              <span className={`text-sm font-semibold ${getChangeColor(overview.incomeChange)}`}>
                {overview.incomeChange > 0 ? "+" : ""}
                {typeof overview.incomeChange === "number" ? overview.incomeChange.toFixed(2) : overview.incomeChange}%
              </span>
            </div>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 rounded-2xl overflow-hidden bg-gradient-to-br from-red-50 to-pink-50">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-700">{t("reportsDashboard.overview.totalExpense")}</span>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center shadow-md">
                <TrendingDown size={24} className="text-white" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#EF4444] mb-3 break-words">
              {formatCurrency(overview.totalExpense)}
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-red-200">
              {overview.expenseChange >= 0 ? (
                <ArrowUpRight className="text-[#EF4444]" size={16} />
              ) : (
                <ArrowDownRight className="text-[#10B981]" size={16} />
              )}
              <span className={`text-sm font-semibold ${getChangeColor(overview.expenseChange)}`}>
                {overview.expenseChange > 0 ? "+" : ""}
                {typeof overview.expenseChange === "number" ? overview.expenseChange.toFixed(2) : overview.expenseChange}%
              </span>
            </div>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-50">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-700">{t("reportsDashboard.overview.totalBalance")}</span>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-md">
                <Wallet size={24} className="text-white" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#3B82F6] mb-3 break-words">
              {formatCurrency(overview.totalBalance)}
            </div>
            <div className="px-3 py-1.5 bg-white rounded-lg border border-blue-200">
              <span className="text-xs text-gray-500">{t("reportsDashboard.overview.totalAllWallets")}</span>
            </div>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-slate-50">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-700">{t("reportsDashboard.overview.difference")}</span>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-400 to-slate-500 flex items-center justify-center shadow-md">
                <Scale size={24} className="text-white" />
              </div>
            </div>
            <div className={`text-2xl sm:text-3xl font-bold mb-3 break-words ${overview.difference >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}>
              {formatCurrency(overview.difference)}
            </div>
            <div className="px-3 py-1.5 bg-white rounded-lg border border-gray-200">
              <span className="text-xs text-gray-500">{t("reportsDashboard.overview.incomeMinusExpense")}</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Comparison + Wallet fluctuations */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Comparison */}
          <Card className="shadow-sm border-0 rounded-xl overflow-hidden dark:!bg-[var(--color-background-alt)] dark:!text-[var(--color-text-primary)]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg">
                  <BarChart3 className="text-white" size={16} />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  {t("reportsDashboard.comparison.title")}
                </h3>
              </div>

              <Tabs activeKey={comparisonTab} onChange={setComparisonTab} items={comparisonTabItems} size="small" />
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Spin />
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
                {/* Current */}
                <div className="w-full sm:max-w-[280px]">
                  <div className="mb-4 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <h4 className="font-bold text-gray-900 text-xs sm:text-sm text-center">
                      {getPeriodLabels().current}
                    </h4>
                  </div>

                  <div className="space-y-2">
                    <div className="p-2 sm:p-3 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                      <span className="text-xs font-semibold text-gray-600 mb-1 block">
                        {t("reportsDashboard.comparison.totalIncome")}
                      </span>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[#10B981] text-sm sm:text-base truncate">
                          {formatCurrency(comparison.current.income)}
                        </span>
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white rounded border border-green-200 flex-shrink-0">
                          {comparison.current.incomeChange >= 0 ? (
                            <TrendingUp size={12} className="text-[#10B981]" />
                          ) : (
                            <TrendingDown size={12} className="text-[#EF4444]" />
                          )}
                          <span className={`text-xs font-semibold ${comparison.current.incomeChange >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}>
                            {comparison.current.incomeChange > 0 ? "+" : ""}
                            {comparison.current.incomeChange.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-2 sm:p-3 bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-lg">
                      <span className="text-xs font-semibold text-gray-600 mb-1 block">
                        {t("reportsDashboard.comparison.totalExpense")}
                      </span>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[#EF4444] text-sm sm:text-base truncate">
                          {formatCurrency(comparison.current.expense)}
                        </span>
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white rounded border border-red-200 flex-shrink-0">
                          {comparison.current.expenseChange >= 0 ? (
                            <TrendingUp size={12} className="text-[#EF4444]" />
                          ) : (
                            <TrendingDown size={12} className="text-[#10B981]" />
                          )}
                          <span className={`text-xs font-semibold ${comparison.current.expenseChange >= 0 ? "text-[#EF4444]" : "text-[#10B981]"}`}>
                            {comparison.current.expenseChange > 0 ? "+" : ""}
                            {comparison.current.expenseChange.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg">
                      <span className="text-xs font-semibold text-gray-600 mb-1 block">
                        {t("reportsDashboard.comparison.balance")}
                      </span>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[#3B82F6] text-sm sm:text-base truncate">
                          {formatCurrency(comparison.current.balance)}
                        </span>
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white rounded border border-blue-200 flex-shrink-0">
                          {comparison.current.balanceChange >= 0 ? (
                            <TrendingUp size={12} className="text-[#10B981]" />
                          ) : (
                            <TrendingDown size={12} className="text-[#EF4444]" />
                          )}
                          <span className={`text-xs font-semibold ${comparison.current.balanceChange >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}>
                            {comparison.current.balanceChange > 0 ? "+" : ""}
                            {comparison.current.balanceChange.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Previous */}
                <div className="w-full sm:max-w-[280px]">
                  <div className="mb-4 p-2 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200">
                    <h4 className="font-bold text-gray-900 text-xs sm:text-sm text-center">
                      {getPeriodLabels().previous}
                    </h4>
                  </div>

                  <div className="space-y-2">
                    <div className="p-2 sm:p-3 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg opacity-75">
                      <span className="text-xs font-semibold text-gray-600 mb-1 block">
                        {t("reportsDashboard.comparison.totalIncome")}
                      </span>
                      <span className="font-bold text-[#10B981] text-sm sm:text-base">
                        {formatCurrency(comparison.previous.income)}
                      </span>
                    </div>

                    <div className="p-2 sm:p-3 bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-lg opacity-75">
                      <span className="text-xs font-semibold text-gray-600 mb-1 block">
                        {t("reportsDashboard.comparison.totalExpense")}
                      </span>
                      <span className="font-bold text-[#EF4444] text-sm sm:text-base">
                        {formatCurrency(comparison.previous.expense)}
                      </span>
                    </div>

                    <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg opacity-75">
                      <span className="text-xs font-semibold text-gray-600 mb-1 block">
                        {t("reportsDashboard.comparison.balance")}
                      </span>
                      <span className="font-bold text-[#3B82F6] text-sm sm:text-base">
                        {formatCurrency(comparison.previous.balance)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Wallet fluctuations */}
          <Card className="shadow-sm border-0 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg">
                <Wallet className="text-white" size={16} />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                {t("reportsDashboard.walletFluct.title")}
              </h3>
            </div>

            {walletFluctuations.length > 0 &&
              (() => {
                const totalStartBalance = walletFluctuations.reduce((sum, w) => sum + (w.estimatedStartBalance || 0), 0);
                const totalChange = walletFluctuations.reduce((sum, w) => sum + (w.change || 0), 0);
                const overallChangePercent =
                  totalStartBalance !== 0 ? (totalChange / Math.abs(totalStartBalance)) * 100 : 0;

                return (
                  <div className="mb-4 p-4 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-600">
                        {t("reportsDashboard.walletFluct.overallRate")}
                      </span>
                      <span className={`font-bold text-sm ${overallChangePercent >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}>
                        {overallChangePercent >= 0 ? "+" : ""}
                        {overallChangePercent.toFixed(2)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          overallChangePercent >= 0
                            ? "bg-gradient-to-r from-green-400 to-emerald-500"
                            : overallChangePercent < -10
                            ? "bg-gradient-to-r from-red-400 to-pink-500"
                            : "bg-gray-400"
                        }`}
                        style={{ width: `${Math.min(Math.abs(overallChangePercent), 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })()}

            <div
              className="space-y-4 overflow-y-auto"
              style={{
                maxHeight: walletFluctuations.length > 2 ? "400px" : "none",
                paddingRight: walletFluctuations.length > 2 ? "8px" : "0",
              }}
            >
              {walletFluctuations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {t("reportsDashboard.walletFluct.noData")}
                </div>
              ) : (
                walletFluctuations.map((wallet, index) => {
                  const getWalletIcon = (type) => {
                    switch (type) {
                      case "cash":
                        return "💵";
                      case "bank":
                        return "🏦";
                      case "credit":
                        return "💳";
                      case "saving":
                        return "💰";
                      default:
                        return "💼";
                    }
                  };

                  return (
                    <Card
                      key={wallet.walletId || index}
                      className="mb-4 border-2 hover:shadow-lg transition-all duration-200 rounded-xl bg-gradient-to-br from-white to-gray-50"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 flex items-center justify-center flex-shrink-0">
                            <span className="text-xl sm:text-2xl">{wallet.icon || getWalletIcon(wallet.walletType)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-gray-900 text-sm sm:text-base truncate">
                              {wallet.walletName || wallet.name || t("reportsDashboard.walletFluct.unnamed")}
                            </div>
                            <div className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                              {formatCurrency(wallet.currentBalance || wallet.balance || 0)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <span className="text-sm font-semibold text-gray-600">
                            {t("reportsDashboard.walletFluct.change")}
                          </span>
                          <div className="flex items-center gap-2">
                            {wallet.change >= 0 ? (
                              <ArrowUpRight className="text-[#10B981]" size={16} />
                            ) : (
                              <ArrowDownRight className="text-[#EF4444]" size={16} />
                            )}
                            <span className={`font-bold text-sm ${wallet.change >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}>
                              {wallet.change >= 0 ? "+" : ""}
                              {formatCurrency(wallet.change)}
                            </span>
                          </div>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              wallet.changePercent >= 0
                                ? "bg-gradient-to-r from-green-400 to-emerald-500"
                                : wallet.changePercent < -10
                                ? "bg-gradient-to-r from-red-400 to-pink-500"
                                : "bg-gray-400"
                            }`}
                            style={{ width: `${Math.min(Math.abs(wallet.changePercent), 100)}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                          <span className="text-xs font-semibold text-gray-500">
                            {t("reportsDashboard.walletFluct.changeRate")}
                          </span>
                          <span className={`font-bold text-sm ${wallet.changePercent >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}>
                            {wallet.changePercent >= 0 ? "+" : ""}
                            {wallet.changePercent}%
                          </span>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Chart section */}
        <div className="mb-6">
          <Card className="shadow-sm border-0 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg">
                  <BarChart3 className="text-white" size={16} />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{t("reportsDashboard.chart.title")}</h2>
                {isUsingTestData && (
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full border border-yellow-300">
                    {t("reportsDashboard.chart.testDataBadge")}
                  </span>
                )}
              </div>
              <Tabs activeKey={chartTab} onChange={setChartTab} items={chartTabItems} size="small" />
            </div>

            {chartLoading ? (
              <div className="flex items-center justify-center h-[250px] sm:h-[300px]">
                <Spin size="large" />
              </div>
            ) : chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                  <XAxis
                    dataKey="label"
                    stroke={chartTheme.axis}
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    stroke={chartTheme.axis}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => {
                      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                      if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                      return value.toString();
                    }}
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: chartTheme.tooltipBg,
                      border: `1px solid ${chartTheme.tooltipBorder}`,
                      borderRadius: "8px",
                      color: chartTheme.tooltipText,
                    }}
                  />
                  <Legend />
                  <Bar dataKey="expense" fill="#EF4444" name={t("reportsDashboard.chart.expense")} radius={[8, 8, 0, 0]} />
                  <Bar dataKey="income" fill="#10B981" name={t("reportsDashboard.chart.income")} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                <div className="text-center">
                  <p className="text-lg mb-2">{t("reportsDashboard.empty.title")}</p>
                  <p className="text-sm">{t("reportsDashboard.empty.subtitle")}</p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Category expense / income situation */}
        <div className="mb-6">
          <Card
            className="
              shadow-lg border-0 overflow-hidden
              dark:bg-none dark:bg-[var(--color-background)]
              dark:text-[var(--color-text-primary)]
            "
          >
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                  <PieChartIcon className="text-blue-600" size={20} />
                  {t("reportsDashboard.pie.title")}
                </h3>

                <div className="flex items-center gap-2 sm:gap-3 bg-white px-3 sm:px-4 py-2 rounded-lg shadow-sm border border-gray-200 w-full sm:w-auto">
                  <Button
                    type="text"
                    size="small"
                    icon={<ChevronLeft size={16} />}
                    onClick={handlePreviousPeriod}
                    className="hover:bg-blue-50 transition-colors p-1"
                  />
                  <span className="text-sm sm:text-base font-bold text-gray-900 min-w-[80px] sm:min-w-[100px] text-center">
                    {selectedPeriod.format("MM/YYYY")}
                  </span>
                  <Button
                    type="text"
                    size="small"
                    icon={<ChevronRight size={16} />}
                    onClick={handleNextPeriod}
                    disabled={selectedPeriod.isSame(dayjs(), "month") || selectedPeriod.isAfter(dayjs(), "month")}
                    className="hover:bg-blue-50 transition-colors disabled:opacity-30 p-1"
                  />
                </div>
              </div>
            </div>

            {categoryExpenseLoading ? (
              <div className="flex justify-center py-8">
                <Spin />
              </div>
            ) : (
              <>
                {(() => {
                  const summary = getCategoryExpenseSummary();
                  const pieData = getPieChartData();
                  const totalIncome = overview.totalIncome || 0;

                  return (
                    <div className="p-4 sm:p-6 dark:bg-none dark:bg-[var(--color-background)] dark:text-[var(--color-text-primary)]">
                      {/* Summary cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                        <div className="relative overflow-hidden bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-4 sm:p-6 border-2 border-red-100 shadow-md hover:shadow-lg transition-all duration-300 group">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-red-200 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs sm:text-sm font-semibold text-red-700 uppercase tracking-wide">
                                {t("reportsDashboard.pie.summary.expense")}
                              </span>
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <TrendingUp size={20} className="text-red-600" />
                              </div>
                            </div>
                            <div className="text-2xl sm:text-3xl font-bold text-red-600 mb-2">
                              {formatCurrency(summary.totalExpense)}
                            </div>

                            {summary.previousTotal > 0 && (
                              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                                <span
                                  className={`font-semibold ${
                                    summary.difference >= 0 ? "text-red-600" : "text-green-600"
                                  }`}
                                >
                                  {summary.difference >= 0 ? "↑" : "↓"} {Math.abs(parseFloat(summary.changePercent))}%
                                </span>
                                <span className="text-gray-500">{t("reportsDashboard.pie.summary.vsPrev")}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 sm:p-6 border-2 border-green-100 shadow-md hover:shadow-lg transition-all duration-300 group">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs sm:text-sm font-semibold text-green-700 uppercase tracking-wide">
                                {t("reportsDashboard.pie.summary.income")}
                              </span>
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <TrendingDown size={20} className="text-green-600 rotate-180" />
                              </div>
                            </div>
                            <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">
                              {formatCurrency(totalIncome)}
                            </div>
                            <div className="flex items-center gap-2 text-xs sm:text-sm">
                              <span className="text-gray-500">{t("reportsDashboard.pie.summary.incomeHint")}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Donut + list */}
                      {pieData.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 mb-6">
                          <div className="flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-4 sm:p-8 border border-gray-100">
                            <ResponsiveContainer width="100%" height={300}>
                              <PieChart>
                                <Pie
                                  data={pieData}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={false}
                                  outerRadius="70%"
                                  innerRadius="40%"
                                  dataKey="value"
                                  paddingAngle={3}
                                  stroke="#fff"
                                  strokeWidth={3}
                                >
                                  {pieData.map((entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={entry.color}
                                      stroke="#fff"
                                      strokeWidth={3}
                                      style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}
                                    />
                                  ))}
                                </Pie>
                                <Tooltip
                                  formatter={(value, name, props) => [
                                    formatCurrency(value),
                                    `${props.payload.percentage}%`,
                                  ]}
                                  contentStyle={{
                                    backgroundColor: "#fff",
                                    border: "2px solid #E5E7EB",
                                    borderRadius: "12px",
                                    padding: "16px",
                                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                                  }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>

                          <div className="space-y-2 sm:space-y-3 flex flex-col justify-center">
                            {pieData.map((item, index) => (
                              <div
                                key={index}
                                className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-5 bg-white border-2 border-gray-100 rounded-xl hover:border-blue-300 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 to-blue-50/0 group-hover:from-blue-50/50 group-hover:to-transparent transition-all duration-300"></div>

                                <div className="relative z-10 flex items-center gap-3 sm:gap-4 flex-1 w-full sm:w-auto">
                                  <div
                                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex-shrink-0 shadow-md group-hover:scale-110 transition-transform"
                                    style={{ backgroundColor: item.color }}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-bold text-gray-900 text-base sm:text-lg mb-1 group-hover:text-blue-600 transition-colors truncate">
                                      {item.name}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                      <span className="text-xs sm:text-sm font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                                        {item.percentage}%
                                      </span>
                                      {item.previousAmount > 0 && (
                                        <span className="text-xs text-gray-500 hidden sm:inline">
                                          {t("reportsDashboard.pie.prevPrefix")} {formatCurrency(item.previousAmount)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="relative z-10 text-left sm:text-right ml-0 sm:ml-4 mt-2 sm:mt-0 w-full sm:w-auto">
                                  <div className="font-bold text-gray-900 text-lg sm:text-xl group-hover:text-blue-600 transition-colors">
                                    {formatCurrency(item.value)}
                                  </div>
                                </div>
                              </div>
                            ))}

                            <div
                              onClick={() => setExpandedCategories(expandedCategories.includes("categories") ? [] : ["categories"])}
                              className="mt-6 pt-4 border-t-2 border-gray-200 cursor-pointer group"
                            >
                              <div className="flex items-center justify-between text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">
                                <span>{t("reportsDashboard.pie.detailsInline", { count: pieData.length })}</span>
                                <ChevronDown
                                  size={18}
                                  className={`transform transition-transform duration-300 ${
                                    expandedCategories.includes("categories") ? "rotate-180" : ""
                                  }`}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-[300px] text-gray-400">
                          <div className="text-center">
                            <p className="text-lg mb-2">{t("reportsDashboard.pie.emptyTitle")}</p>
                            <p className="text-sm">{t("reportsDashboard.pie.emptySubtitle")}</p>
                          </div>
                        </div>
                      )}

                      {pieData.length > 0 && (
                        <div className="mt-6">
                          <Collapse
                            activeKey={expandedCategories}
                            onChange={setExpandedCategories}
                            items={[
                              {
                                key: "categories",
                                label: (
                                  <span className="font-bold text-lg text-gray-900 flex items-center gap-2">
                                    <Eye size={20} />
                                    {t("reportsDashboard.pie.detailsTitle", { count: pieData.length })}
                                  </span>
                                ),
                                children: (
                                  <div className="space-y-3 pt-2">
                                    {pieData.map((item, index) => (
                                      <div
                                        key={index}
                                        className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-white border-2 border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-md transition-all duration-300 group"
                                      >
                                        <div className="flex items-center gap-4">
                                          <div
                                            className="w-8 h-8 rounded-lg shadow-md flex items-center justify-center group-hover:scale-110 transition-transform"
                                            style={{ backgroundColor: item.color }}
                                          >
                                            <span className="text-white font-bold text-sm">{index + 1}</span>
                                          </div>
                                          <div>
                                            <div className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">
                                              {item.name}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                              <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                                                {t("reportsDashboard.pie.percentOfTotal", { percent: item.percentage })}
                                              </span>
                                              {item.previousAmount > 0 && (
                                                <span className="text-xs text-gray-500">
                                                  {t("reportsDashboard.pie.prevPrefix")} {formatCurrency(item.previousAmount)}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <div className="font-bold text-xl text-gray-900 group-hover:text-blue-600 transition-colors">
                                            {formatCurrency(item.value)}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ),
                              },
                            ]}
                          />
                        </div>
                      )}
                    </div>
                  );
                })()}
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReportsDashboard;
