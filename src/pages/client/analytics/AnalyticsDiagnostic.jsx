import { useState, useEffect, useMemo } from "react";
import { Card, Spin, message, Badge, Button, Drawer, Empty } from "antd";
import {
  AlertTriangle,
  Clock,
  TrendingUp,
  ExternalLink,
  TrendingDown,
  Wallet,
  Calendar,
  BarChart3,
  Activity,
  Zap,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import {
  getCategorySpendingSpikesAPI,
  getMonthlySpendingSpikesAPI,
  getWalletVariationsAPI,
  getMostSpendingDayOfWeekAPI,
  getMostFrequentCategoriesAPI,
  detectUnusualLargeExpensesAPI,
  detectUnusualTimeSpendingAPI,
  detect24hSpendingSpikeAPI,
  getTransactionFrequencyAPI,
} from "../../../services/api.analytics";
import dayjs from "dayjs";
import DateRangePicker from "../../../components/common/DateRangePicker";
import { useNavigate } from "react-router-dom";

// ✅ i18n
import { useTranslation } from "react-i18next";

const AnalyticsDiagnostic = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(3, "month").startOf("month"),
    dayjs().endOf("month"),
  ]);

  // Card 1: Biến động chi tiêu
  const [categorySpikes, setCategorySpikes] = useState([]);
  const [walletVariations, setWalletVariations] = useState([]);

  // Card 2: Phát hiện bất thường
  const [monthlySpikes, setMonthlySpikes] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState({ mean: 0, threshold: 0 });
  const [unusualLarge, setUnusualLarge] = useState([]);
  const [unusualTime, setUnusualTime] = useState([]);
  const [spike24h, setSpike24h] = useState(null);
  const [hourlySpending, setHourlySpending] = useState([]);

  // Card 3: Thói quen chi tiêu
  const [spendingDays, setSpendingDays] = useState([]);
  const [frequentCategories, setFrequentCategories] = useState([]);
  const [transactionFreq, setTransactionFreq] = useState(null);

  // Drawer state
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [drawerTitle, setDrawerTitle] = useState("");

  // ✅ map thứ trong tuần (chart)
  const dayKeyToI18n = useMemo(
    () => ({
      Mon: t("analyticsDiagnostic.days.mon"),
      Tue: t("analyticsDiagnostic.days.tue"),
      Wed: t("analyticsDiagnostic.days.wed"),
      Thu: t("analyticsDiagnostic.days.thu"),
      Fri: t("analyticsDiagnostic.days.fri"),
      Sat: t("analyticsDiagnostic.days.sat"),
      Sun: t("analyticsDiagnostic.days.sun"),
    }),
    [t]
  );

  useEffect(() => {
    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const startDate = dateRange[0]?.toDate();
      const endDate = dateRange[1]?.toDate();

      // Tính số tháng trong khoảng thời gian
      const months = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 30));
      const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const weeks = Math.ceil(days / 7);

      await Promise.all([
        loadVariationsData(months),
        loadAnomaliesData(months, days),
        loadHabitsData(weeks, days),
      ]);
    } catch (error) {
      message.error(t("analyticsDiagnostic.toast.loadError"));
    } finally {
      setLoading(false);
    }
  };

  const loadVariationsData = async (months) => {
    try {
      const [catRes, walletRes] = await Promise.all([
        getCategorySpendingSpikesAPI({ months }),
        getWalletVariationsAPI({ months }),
      ]);

      // Category Spikes
      if (catRes?.status === true && catRes?.data) {
        const spikes = catRes.data?.spikes || [];
        setCategorySpikes(Array.isArray(spikes) ? spikes : []);
      } else if (catRes?.EC === 0 && catRes?.data) {
        const spikes = catRes.data?.spikes || catRes.data || [];
        setCategorySpikes(Array.isArray(spikes) ? spikes : []);
      } else {
        setCategorySpikes([]);
      }

      // Wallet Variations
      if (walletRes?.status === true && walletRes?.data) {
        const variations = Array.isArray(walletRes.data) ? walletRes.data : [];
        setWalletVariations(variations);
      } else if (walletRes?.EC === 0 && walletRes?.data) {
        const variations = Array.isArray(walletRes.data) ? walletRes.data : [];
        setWalletVariations(variations);
      } else {
        setWalletVariations([]);
      }
    } catch (error) {
      setCategorySpikes([]);
      setWalletVariations([]);
    }
  };

  const loadAnomaliesData = async (months, days) => {
    try {
      const [monthRes, largeRes, timeRes, spikeRes] = await Promise.all([
        getMonthlySpendingSpikesAPI({ months }),
        detectUnusualLargeExpensesAPI({ days }),
        detectUnusualTimeSpendingAPI({ days }),
        detect24hSpendingSpikeAPI(),
      ]);

      // Monthly Spikes
      const handleMonthRes = (res) => {
        const data = res?.data?.allMonths || res?.data?.spikes || [];
        setMonthlySpikes(Array.isArray(data) ? data : []);

        if (res?.data?.statistics) {
          setMonthlyStats({
            mean: res.data.statistics.mean || 0,
            threshold: res.data.statistics.threshold || 0,
          });
        } else {
          const amounts = (Array.isArray(data) ? data : [])
            .map((d) => d.totalAmount || 0)
            .filter((a) => a > 0);
          const mean = amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;
          setMonthlyStats({
            mean,
            threshold: mean * 1.4,
          });
        }
      };

      if (monthRes?.status === true && monthRes?.data) handleMonthRes(monthRes);
      else if (monthRes?.EC === 0 && monthRes?.data) handleMonthRes(monthRes);
      else {
        setMonthlySpikes([]);
        setMonthlyStats({ mean: 0, threshold: 0 });
      }

      // Unusual Large Expenses
      if (largeRes?.status === true && largeRes?.data) {
        const expenses = largeRes.data.unusualExpenses || [];
        setUnusualLarge(Array.isArray(expenses) ? expenses : []);
      } else if (largeRes?.EC === 0 && largeRes?.data) {
        const expenses = largeRes.data.unusualExpenses || [];
        setUnusualLarge(Array.isArray(expenses) ? expenses : []);
      } else {
        setUnusualLarge([]);
      }

      // Unusual Time Spending + hourDistribution -> hourly chart
      let timeSpendingData = [];
      let hourlyData = [];

      const handleTimeRes = (res) => {
        const timeSpending = res.data.unusualTimeSpending || [];
        const hourDistribution = res.data.hourDistribution || {};

        timeSpendingData = Array.isArray(timeSpending) ? timeSpending : [];

        if (Object.keys(hourDistribution).length > 0) {
          hourlyData = Array.from({ length: 24 }, (_, i) => {
            const hourKey = i.toString();
            const hourData = hourDistribution[i] || hourDistribution[hourKey] || {};
            return {
              hour: `${String(i).padStart(2, "0")}:00`,
              amount: Number(hourData.totalAmount) || 0,
              count: Number(hourData.count) || 0,
            };
          });

          const totalHourlyAmount = hourlyData.reduce((sum, item) => sum + item.amount, 0);
          if (totalHourlyAmount === 0) hourlyData = [];
        }
      };

      if (timeRes?.status === true && timeRes?.data) handleTimeRes(timeRes);
      else if (timeRes?.EC === 0 && timeRes?.data) handleTimeRes(timeRes);

      setUnusualTime(timeSpendingData);
      setHourlySpending(hourlyData);

      // 24h Spike
      if (spikeRes?.status === true && spikeRes?.data) setSpike24h(spikeRes.data);
      else if (spikeRes?.EC === 0 && spikeRes?.data) setSpike24h(spikeRes.data);
      else setSpike24h(null);
    } catch (error) {
      setMonthlySpikes([]);
      setMonthlyStats({ mean: 0, threshold: 0 });
      setUnusualLarge([]);
      setUnusualTime([]);
      setHourlySpending([]);
    }
  };

  const loadHabitsData = async (weeks, days) => {
    try {
      const startDate = dateRange[0]?.format("YYYY-MM-DD");
      const endDate = dateRange[1]?.format("YYYY-MM-DD");

      const [dayRes, catRes, freqRes] = await Promise.all([
        getMostSpendingDayOfWeekAPI({ weeks }),
        getMostFrequentCategoriesAPI({ days, startDate, endDate }),
        getTransactionFrequencyAPI({ days, startDate, endDate }),
      ]);

      // Spending Days
      const handleDayRes = (res) => {
        const daysData = res.data.days || [];

        const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const dayMap = { 1: "Sun", 2: "Mon", 3: "Tue", 4: "Wed", 5: "Thu", 6: "Fri", 7: "Sat" };

        const chartData = dayNames.map((day) => {
          const dayData = Array.isArray(daysData) ? daysData.find((d) => dayMap[d.dayOfWeek] === day) : null;
          return { day, amount: dayData?.totalAmount || 0 };
        });

        setSpendingDays(chartData);
      };

      if (dayRes?.status === true && dayRes?.data) handleDayRes(dayRes);
      else if (dayRes?.EC === 0 && dayRes?.data) handleDayRes(dayRes);
      else setSpendingDays([]);

      // Frequent Categories
      const handleCat = (res) => {
        const categories = Array.isArray(res.data) ? res.data : [];
        setFrequentCategories(categories);
      };
      if (catRes?.status === true && catRes?.data) handleCat(catRes);
      else if (catRes?.EC === 0 && catRes?.data) handleCat(catRes);
      else setFrequentCategories([]);

      // Transaction Frequency
      if (freqRes?.status === true && freqRes?.data) setTransactionFreq(freqRes.data);
      else if (freqRes?.EC === 0 && freqRes?.data) setTransactionFreq(freqRes.data);
      else setTransactionFreq(null);
    } catch (error) {
      setSpendingDays([]);
      setFrequentCategories([]);
      setTransactionFreq(null);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value || 0);
  };

  const getCategoryIcon = (item) => {
    const icon = item.categoryIcon || item.icon || item.category?.icon;

    if (icon) {
      if (/[\u{1F300}-\u{1F9FF}]/u.test(icon)) return icon;
      const iconStringMap = {
        food: "🍔",
        shopping: "🛒",
        "shopping-bag": "🛍️",
        transport: "🚗",
        car: "🚗",
        entertainment: "🎬",
        game: "🎮",
        health: "🏥",
        medical: "🏥",
        bills: "💳",
        invoice: "📄",
        education: "📚",
        travel: "✈️",
        flight: "✈️",
        gift: "🎁",
        present: "🎁",
        salary: "💰",
        income: "💰",
        investment: "📈",
        savings: "💵",
        other: "📦",
        default: "📁",
      };
      return iconStringMap[String(icon).toLowerCase()] || icon;
    }

    const categoryName = (item.categoryName || item.category?.name || "").toLowerCase();
    const iconMap = {
      "ăn uống": "🍔",
      food: "🍔",
      "mua sắm": "🛒",
      shopping: "🛒",
      "di chuyển": "🚗",
      transport: "🚗",
      "giải trí": "🎬",
      entertainment: "🎬",
      "y tế": "🏥",
      health: "🏥",
      "hóa đơn": "💳",
      bills: "💳",
      "giáo dục": "📚",
      education: "📚",
      "du lịch": "✈️",
      travel: "✈️",
      "quà tặng": "🎁",
      gift: "🎁",
      "đầu tư": "📈",
      investment: "📈",
      khác: "📦",
      other: "📦",
    };
    return iconMap[categoryName] || "📦";
  };

  const formatMonthlyData = () => {
    if (!monthlySpikes || monthlySpikes.length === 0) return [];

    return monthlySpikes.map((item) => {
      const amount = item.totalAmount || 0;
      const isSpike = monthlyStats.threshold > 0 && amount > monthlyStats.threshold;

      const label =
        item.label ||
        t("analyticsDiagnostic.monthLabel", { month: item.month, year: item.year });

      return {
        month: label,
        amount,
        isSpike,
        deviation: item.deviation || 0,
        deviationPercent: item.deviationPercent || 0,
      };
    });
  };

  const handleAlertClick = (type, data) => {
    if (type === "large") {
      setDrawerTitle(t("analyticsDiagnostic.drawer.largeTitle"));
      setSelectedTransactions(
        unusualLarge.map((expense) => ({
          id: expense.transactionId,
          amount: expense.amount,
          date: expense.date,
          note: expense.note,
          category: expense.category?.name || expense.categoryName,
          wallet: expense.wallet?.name || expense.walletName,
        }))
      );
      setDrawerVisible(true);
    } else if (type === "time") {
      setDrawerTitle(t("analyticsDiagnostic.drawer.timeTitle"));
      setSelectedTransactions(
        unusualTime.map((expense) => ({
          id: expense.transactionId,
          amount: expense.amount,
          date: expense.date,
          hour: expense.hour,
          note: expense.note,
          category: expense.category?.name || expense.categoryName,
          reason: expense.reason,
        }))
      );
      setDrawerVisible(true);
    } else if (type === "month") {
      const monthData = data;
      const monthStart = new Date(monthData.year, monthData.month - 1, 1);
      const monthEnd = new Date(monthData.year, monthData.month, 0, 23, 59, 59);

      navigate(
        `/transactions?startDate=${dayjs(monthStart).format("YYYY-MM-DD")}&endDate=${dayjs(
          monthEnd
        ).format("YYYY-MM-DD")}&type=expense`
      );
    }
  };

  const handleViewAllTransactions = () => {
    setDrawerVisible(false);
    navigate("/transactions");
  };

  const handleCategoryClick = (category) => {
    const categoryId = category.categoryId || category._id || category.id;
    if (categoryId) {
      const startDate = dateRange[0]?.format("YYYY-MM-DD");
      const endDate = dateRange[1]?.format("YYYY-MM-DD");
      const categoryIdStr = String(categoryId);

      navigate(
        `/transactions?categoryId=${categoryIdStr}&startDate=${startDate}&endDate=${endDate}&type=expense`
      );
    } else {
      message.warning(t("analyticsDiagnostic.toast.categoryIdMissing"));
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              <span className="font-medium">
                {entry.name || t("analyticsDiagnostic.tooltip.amount")}:
              </span>{" "}
              {formatCurrency(entry.value)}
            </p>
          ))}
          {payload[0]?.payload?.isSpike && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <AlertTriangle size={12} />
              {t("analyticsDiagnostic.tooltip.aboveAvg", {
                percent: payload[0].payload.deviationPercent?.toFixed(1) || "0.0",
              })}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/70 via-white to-white">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                {t("analyticsDiagnostic.header.title")}
              </h1>
              <p className="text-gray-600 mt-2 text-xs sm:text-sm">
                {t("analyticsDiagnostic.header.subtitle")}
              </p>
            </div>
          </div>

          {/* Date Range */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Calendar className="text-blue-500" size={14} />
              {t("analyticsDiagnostic.filters.rangeLabel")}
            </label>
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              format="DD/MM/YYYY"
              className="w-full max-w-md"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col justify-center items-center py-20">
            <Spin size="large" />
            <p className="mt-4 text-gray-500 text-sm sm:text-base">
              {t("analyticsDiagnostic.loading")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Card 1 */}
            <Card
              className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 rounded-2xl overflow-hidden bg-gradient-to-br from-white to-gray-50"
              title={
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg">
                    <TrendingUp className="text-white" size={20} />
                  </div>
                  <span className="font-bold text-gray-800">
                    {t("analyticsDiagnostic.cards.variations.title")}
                  </span>
                </div>
              }
            >
              <div className="space-y-6">
                {/* Category spikes */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="text-amber-500" size={18} />
                    <h3 className="text-sm font-bold text-gray-800">
                      {t("analyticsDiagnostic.cards.variations.categorySpikesTitle")}
                    </h3>
                  </div>

                  {categorySpikes.length > 0 ? (
                    <div className="space-y-3">
                      {categorySpikes.slice(0, 5).map((item, index) => (
                        <div
                          key={index}
                          className="group p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl hover:shadow-md transition-all duration-200 cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  item.growthPercent > 50 ? "bg-red-500" : "bg-amber-500"
                                } animate-pulse`}
                              ></div>
                              <span className="font-semibold text-gray-900">
                                {item.categoryName}
                              </span>
                            </div>

                            <Badge
                              count={t("analyticsDiagnostic.badges.growthPercent", {
                                percent: item.growthPercent?.toFixed(1) || 0,
                              })}
                              style={{
                                backgroundColor: item.growthPercent > 50 ? "#EF4444" : "#F59E0B",
                                fontSize: "11px",
                                fontWeight: "bold",
                              }}
                            />
                          </div>

                          <p className="text-xs text-gray-600 mt-2">
                            {t("analyticsDiagnostic.cards.variations.comparePrev")}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                      <Activity className="mx-auto text-gray-400 mb-2" size={32} />
                      <p className="text-sm text-gray-500">
                        {t("analyticsDiagnostic.empty.noVariationData")}
                      </p>
                    </div>
                  )}
                </div>

                {/* Wallet variations */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Wallet className="text-blue-500" size={18} />
                    <h3 className="text-sm font-bold text-gray-800">
                      {t("analyticsDiagnostic.cards.variations.walletTitle")}
                    </h3>
                  </div>

                  {walletVariations.length > 0 ? (
                    <div className="space-y-3">
                      {walletVariations.map((wallet, index) => {
                        const changePercent = wallet.changePercent || wallet.variation || 0;
                        const isIncrease = changePercent > 0;
                        const isDecrease = changePercent < 0;

                        const tooltipText = t("analyticsDiagnostic.wallet.tooltip", {
                          month: wallet.latestMonth?.month,
                          year: wallet.latestMonth?.year,
                          latest: formatCurrency(wallet.latestMonth?.totalAmount || 0),
                          prev: formatCurrency(wallet.previousMonth?.totalAmount || 0),
                        });

                        return (
                          <div
                            key={index}
                            className="group p-4 bg-white border border-gray-200 rounded-xl hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer"
                            title={tooltipText}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                                  <Wallet className="text-blue-600" size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="font-semibold text-gray-900 block truncate">
                                    {wallet.walletName}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {isIncrease
                                      ? t("analyticsDiagnostic.wallet.increase")
                                      : isDecrease
                                      ? t("analyticsDiagnostic.wallet.decrease")
                                      : t("analyticsDiagnostic.wallet.noChange")}
                                  </span>
                                </div>
                              </div>

                              <div
                                className={`flex items-center gap-1 font-bold ${
                                  isIncrease
                                    ? "text-red-500"
                                    : isDecrease
                                    ? "text-green-500"
                                    : "text-gray-500"
                                }`}
                              >
                                {isIncrease ? (
                                  <>
                                    <TrendingUp size={16} />
                                    <span>
                                      {t("analyticsDiagnostic.wallet.percentPlus", {
                                        percent: Math.abs(changePercent).toFixed(1),
                                      })}
                                    </span>
                                  </>
                                ) : isDecrease ? (
                                  <>
                                    <TrendingDown size={16} />
                                    <span>{changePercent.toFixed(1)}%</span>
                                  </>
                                ) : (
                                  <span>0%</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                      <Wallet className="mx-auto text-gray-400 mb-2" size={32} />
                      <p className="text-sm text-gray-500">
                        {t("analyticsDiagnostic.empty.noWalletData")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Card 2 */}
            <Card
              className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 rounded-2xl overflow-hidden bg-gradient-to-br from-white to-gray-50"
              title={
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-red-400 to-pink-500 rounded-lg">
                    <AlertTriangle className="text-white" size={20} />
                  </div>
                  <span className="font-bold text-gray-800">
                    {t("analyticsDiagnostic.cards.anomalies.title")}
                  </span>
                </div>
              }
            >
              <div className="space-y-4">
                {/* Large */}
                {unusualLarge.length > 0 && (
                  <div
                    className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 rounded-xl p-4 mb-4 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 group"
                    onClick={() => handleAlertClick("large")}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-red-500 rounded-lg group-hover:bg-red-600 transition-colors">
                        <AlertTriangle className="text-white" size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-red-800">
                          {t("analyticsDiagnostic.cards.anomalies.largeTitle")}
                        </div>
                        <div className="text-xs text-red-600 mt-1">
                          {t("analyticsDiagnostic.cards.anomalies.largeCount", {
                            count: unusualLarge.length,
                          })}
                        </div>
                      </div>
                      <ExternalLink
                        className="text-red-400 group-hover:text-red-600 transition-colors"
                        size={18}
                      />
                    </div>
                  </div>
                )}

                {/* Time */}
                {unusualTime.length > 0 && (
                  <div
                    className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-300 rounded-xl p-4 mb-4 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 group"
                    onClick={() => handleAlertClick("time")}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-orange-500 rounded-lg group-hover:bg-orange-600 transition-colors">
                        <Clock className="text-white" size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-orange-800">
                          {t("analyticsDiagnostic.cards.anomalies.timeTitle")}
                        </div>
                        <div className="text-xs text-orange-600 mt-1">
                          {t("analyticsDiagnostic.cards.anomalies.timeCount", {
                            count: unusualTime.length,
                          })}
                        </div>
                      </div>
                      <ExternalLink
                        className="text-orange-400 group-hover:text-orange-600 transition-colors"
                        size={18}
                      />
                    </div>
                  </div>
                )}

                {/* Monthly spikes */}
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="text-purple-500" size={18} />
                  <h3 className="text-sm font-bold text-gray-800">
                    {t("analyticsDiagnostic.cards.anomalies.monthlyTitle")}
                  </h3>
                </div>

                {monthlySpikes.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={formatMonthlyData()} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis
                        dataKey="month"
                        stroke="#6B7280"
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        fontSize={9}
                      />
                      <YAxis stroke="#6B7280" />
                      {monthlyStats.threshold > 0 && (
                        <ReferenceLine
                          y={monthlyStats.threshold}
                          stroke="#EF4444"
                          strokeDasharray="5 5"
                          label={{ value: t("analyticsDiagnostic.cards.anomalies.thresholdLabel"), position: "right" }}
                        />
                      )}
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="amount"
                        onClick={(data) => {
                          if (data.isSpike) {
                            const monthData = monthlySpikes.find((m) => {
                              const label = m.label || t("analyticsDiagnostic.monthLabel", { month: m.month, year: m.year });
                              return label === data.month;
                            });
                            if (monthData) handleAlertClick("month", monthData);
                          }
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        {formatMonthlyData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.isSpike ? "#EF4444" : "#F59E0B"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[250px] bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <BarChart3 className="text-gray-400 mb-2" size={32} />
                    <p className="text-sm text-gray-500">{t("analyticsDiagnostic.empty.noMonthlyData")}</p>
                  </div>
                )}

                {/* Hourly analysis */}
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="text-indigo-500" size={18} />
                    <h3 className="text-sm font-bold text-gray-800">
                      {t("analyticsDiagnostic.cards.anomalies.hourlyTitle")}
                    </h3>
                  </div>

                  {hourlySpending.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={hourlySpending} margin={{ top: 5, right: 5, left: 0, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                        <XAxis
                          dataKey="hour"
                          stroke="#6B7280"
                          fontSize={8}
                          tick={{ fill: "#6B7280" }}
                          interval={2}
                          tickMargin={8}
                          angle={-45}
                          textAnchor="end"
                        />
                        <YAxis
                          stroke="#6B7280"
                          tick={{ fill: "#6B7280", fontSize: 10 }}
                          tickFormatter={(value) => {
                            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                            if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                            return value.toString();
                          }}
                        />
                        <Tooltip
                          formatter={(value) => formatCurrency(value)}
                          labelStyle={{ color: "#374151" }}
                          contentStyle={{
                            backgroundColor: "#fff",
                            border: "1px solid #E5E7EB",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar dataKey="amount" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[200px] bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                      <Clock className="text-gray-400 mb-2" size={32} />
                      <p className="text-sm text-gray-500">{t("analyticsDiagnostic.empty.noData")}</p>
                    </div>
                  )}
                </div>

                {/* 24h spike */}
                {spike24h && spike24h.isSpike && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-500 rounded-lg">
                        <TrendingUp className="text-white" size={18} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-yellow-800">
                          {t("analyticsDiagnostic.cards.anomalies.spike24hTitle")}
                        </div>
                        <div className="text-xs text-yellow-700 mt-1">
                          {t("analyticsDiagnostic.cards.anomalies.spike24hDesc", {
                            percent: spike24h.changePercent?.toFixed(1) || 0,
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Card 3 */}
            <Card
              className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 rounded-2xl overflow-hidden bg-gradient-to-br from-white to-gray-50"
              title={
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg">
                    <Activity className="text-white" size={20} />
                  </div>
                  <span className="font-bold text-gray-800">
                    {t("analyticsDiagnostic.cards.habits.title")}
                  </span>
                </div>
              }
            >
              <div className="space-y-4">
                {/* Most spending day */}
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="text-green-500" size={18} />
                  <h3 className="text-sm font-bold text-gray-800">
                    {t("analyticsDiagnostic.cards.habits.mostSpendingDayTitle")}
                  </h3>
                </div>

                {spendingDays.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={spendingDays}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis
                        dataKey="day"
                        stroke="#6B7280"
                        tickFormatter={(dayKey) => dayKeyToI18n[dayKey] || dayKey}
                      />
                      <YAxis stroke="#6B7280" />
                      <Tooltip
                        formatter={(value) => formatCurrency(value)}
                        labelFormatter={(label) => dayKeyToI18n[label] || label}
                        labelStyle={{ color: "#374151" }}
                      />
                      <Bar dataKey="amount" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 mb-4">
                    <Calendar className="text-gray-400 mb-2" size={32} />
                    <p className="text-sm text-gray-500">{t("analyticsDiagnostic.empty.noData")}</p>
                  </div>
                )}

                {/* Transaction frequency */}
                {transactionFreq && (
                  <div className="mt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Activity className="text-blue-500" size={18} />
                      <h3 className="text-sm font-bold text-gray-800">
                        {t("analyticsDiagnostic.cards.habits.frequencyTitle")}
                      </h3>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl hover:shadow-md transition-all duration-200">
                        <div className="text-2xl font-bold text-[#10B981] mb-1">
                          {transactionFreq.frequency?.perDay?.toFixed(1) || 0}
                        </div>
                        <div className="text-xs font-medium text-gray-600">
                          {t("analyticsDiagnostic.cards.habits.perDay")}
                        </div>
                      </div>

                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl hover:shadow-md transition-all duration-200">
                        <div className="text-2xl font-bold text-[#3B82F6] mb-1">
                          {transactionFreq.frequency?.perWeek?.toFixed(1) || 0}
                        </div>
                        <div className="text-xs font-medium text-gray-600">
                          {t("analyticsDiagnostic.cards.habits.perWeek")}
                        </div>
                      </div>

                      <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-xl hover:shadow-md transition-all duration-200">
                        <div className="text-2xl font-bold text-[#8B5CF6] mb-1">
                          {transactionFreq.frequency?.perMonth?.toFixed(1) || 0}
                        </div>
                        <div className="text-xs font-medium text-gray-600">
                          {t("analyticsDiagnostic.cards.habits.perMonth")}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Frequent categories */}
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="text-indigo-500" size={18} />
                    <h3 className="text-sm font-bold text-gray-800">
                      {t("analyticsDiagnostic.cards.habits.frequentCategoriesTitle")}
                    </h3>
                  </div>

                  {frequentCategories.length > 0 ? (
                    <div className="space-y-3">
                      {frequentCategories.slice(0, 5).map((item, index) => (
                        <div
                          key={index}
                          onClick={() => handleCategoryClick(item)}
                          className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:shadow-lg hover:border-indigo-300 transition-all duration-200 group cursor-pointer"
                          title={t("analyticsDiagnostic.cards.habits.categoryHint", {
                            count: item.count,
                            name: item.categoryName,
                          })}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 border-2 border-indigo-300 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 group-hover:border-indigo-400 transition-all duration-300">
                              <span className="text-3xl leading-none">{getCategoryIcon(item)}</span>
                            </div>

                            <div className="flex items-center gap-3 flex-1">
                              <span className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                {item.categoryName}
                              </span>
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                                {index + 1}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge
                              count={item.count}
                              style={{
                                backgroundColor: "#6366F1",
                                fontSize: "11px",
                                fontWeight: "bold",
                              }}
                            />
                            <span className="text-xs text-gray-500">
                              {t("analyticsDiagnostic.cards.habits.transactions")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                      <BarChart3 className="mx-auto text-gray-400 mb-2" size={32} />
                      <p className="text-sm text-gray-500">
                        {t("analyticsDiagnostic.empty.noCategoryData")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Drawer */}
        <Drawer
          title={
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-red-600" size={20} />
              <span>{drawerTitle}</span>
            </div>
          }
          placement="right"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          width={600}
          extra={
            <Button
              type="primary"
              icon={<ExternalLink size={16} />}
              onClick={handleViewAllTransactions}
            >
              {t("analyticsDiagnostic.drawer.viewAll")}
            </Button>
          }
        >
          {selectedTransactions.length > 0 ? (
            <div className="space-y-3">
              {selectedTransactions.map((transaction, index) => (
                <Card
                  key={index}
                  size="small"
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/transactions?id=${transaction.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 mb-1">
                        {transaction.category || transaction.categoryName}
                      </div>

                      {transaction.note && (
                        <div className="text-sm text-gray-600 mb-1">{transaction.note}</div>
                      )}

                      <div className="text-xs text-gray-500">
                        {dayjs(transaction.date).format("DD/MM/YYYY HH:mm")}
                        {transaction.hour !== undefined && ` - ${transaction.hour}:00`}
                        {transaction.wallet && ` • ${transaction.wallet}`}
                      </div>

                      {transaction.reason && (
                        <div className="text-xs text-orange-600 mt-1">{transaction.reason}</div>
                      )}
                    </div>

                    <div className="text-lg font-bold text-red-600 ml-4">
                      {formatCurrency(transaction.amount)}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Empty description={t("analyticsDiagnostic.drawer.empty")} />
          )}
        </Drawer>
      </div>
    </div>
  );
};

export default AnalyticsDiagnostic;
