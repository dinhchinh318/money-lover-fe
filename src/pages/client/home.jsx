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

// ✅ i18n
import { useTranslation } from "react-i18next";

function HomePage() {
  const { t } = useTranslation();
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
      "#10B981",
      "#34D399",
      "#059669",
      "#22C55E",
      "#16A34A",
      "#0EA5E9",
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
      if (walletsRes?.EC === 0 && Array.isArray(walletsRes?.data)) {
        totalBalance = walletsRes.data.reduce((sum, wallet) => sum + (Number(wallet.balance) || 0), 0);
      } else if (walletsRes?.status === true && Array.isArray(walletsRes?.data)) {
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
      } else if (transactionsRes?.status === true && Array.isArray(transactionsRes?.data)) {
        transactions = transactionsRes.data;
      } else if (transactionsRes?.EC === 0 && transactionsRes?.data?.transactions) {
        transactions = Array.isArray(transactionsRes.data.transactions) ? transactionsRes.data.transactions : [];
      } else if (transactionsRes?.EC === 0 && Array.isArray(transactionsRes?.data)) {
        transactions = transactionsRes.data;
      }

      const transformedTransactions = transactions.slice(0, 10).map((transaction) => ({
        id: transaction._id || transaction.id,
        category: transaction.category?.name || transaction.categoryName || t("home.uncategorized"),
        amount: transaction.type === "income" ? Number(transaction.amount) : -Number(transaction.amount),
        date: new Date(transaction.date),
        type: transaction.type || "expense",
      }));

      setStats({ totalBalance, monthlyIncome, monthlyExpense, transactionCount });
      setRecentTransactions(transformedTransactions);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      message.error(t("home.toast.loadFail"));
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
            const categoryName = item.categoryName || item.name || item.category?.name || t("home.uncategorized");
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
    <div
      className="
        min-h-screen
        bg-gradient-to-b from-emerald-50/70 via-white to-white
        dark:bg-none dark:bg-[var(--color-background)]
      "
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
                {profile?.displayName
                  ? t("home.greetingWithName", { name: profile.displayName })
                  : t("home.greeting")}
              </h1>
              <p className="mt-1 text-sm sm:text-base text-slate-600">
                {t("home.welcomeBack")}{" "}
                <span className="font-semibold text-emerald-700">{t("home.appName")}</span>
              </p>
            </div>

            {/* Status pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-3 py-1.5 text-xs sm:text-sm text-slate-700 shadow-sm">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              {t("home.sync.label")}:{" "}
              <span className="font-semibold text-emerald-700">
                {loading ? t("home.sync.loading") : t("home.sync.ready")}
              </span>
            </div>
          </div>
        </div>

        {/* Financial Overview */}
        <section className="mb-6 sm:mb-8">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">{t("home.overview.title")}</h2>
                  <p className="mt-1 text-sm text-slate-600">{t("home.overview.subtitle")}</p>
                </div>

                {/* Month switcher */}
                <div className="flex items-center justify-between sm:justify-end gap-2">
                  <button
                    onClick={() => setSelectedMonth(selectedMonth.subtract(1, "month"))}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
                    aria-label={t("home.month.prev")}
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <div className="min-w-[7.5rem] text-center">
                    <div className="text-xs text-slate-500">{t("home.month.label")}</div>
                    <div className="text-sm font-semibold text-slate-800">{selectedMonth.format("MM/YYYY")}</div>
                  </div>

                  <button
                    onClick={() => setSelectedMonth(selectedMonth.add(1, "month"))}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isFutureMonth}
                    aria-label={t("home.month.next")}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Expense */}
                    <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 sm:p-5">
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-700">
                            <TrendingDown size={18} />
                          </span>
                          {t("home.overview.expense")}
                        </div>
                        <span className="rounded-full bg-emerald-600/10 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          {t("home.overview.inMonth")}
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                          {loadingOverview ? "..." : formatCurrency(financialOverview.totalExpense)}
                        </div>
                        <div className="mt-1 text-xs text-slate-600">{t("home.overview.expenseHint")}</div>
                      </div>
                    </div>

                    {/* Income */}
                    <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 sm:p-5">
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-700">
                            <TrendingUp size={18} />
                          </span>
                          {t("home.overview.income")}
                        </div>
                        <span className="rounded-full bg-emerald-600/10 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          {t("home.overview.inMonth")}
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                          {loadingOverview ? "..." : formatCurrency(financialOverview.totalIncome)}
                        </div>
                        <div className="mt-1 text-xs text-slate-600">{t("home.overview.incomeHint")}</div>
                      </div>
                    </div>
                  </div>

                  {/* Donut */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800">{t("home.pie.title")}</h3>
                        <p className="mt-0.5 text-xs text-slate-500">{t("home.pie.subtitle")}</p>
                      </div>
                      <div className="text-xs text-slate-500">
                        {categoryExpenses.length > 0
                          ? t("home.pie.count", { count: categoryExpenses.length })
                          : t("home.pie.noData")}
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
                                  const color = originalIndex >= 0 ? COLORS[originalIndex % COLORS.length] : "#94A3B8";

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
                        <div className="mt-3 text-sm font-semibold text-slate-800">{t("home.pie.emptyTitle")}</div>
                        <div className="mt-1 text-xs text-slate-500">{t("home.pie.emptyDesc")}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right */}
                <div className="lg:col-span-6">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 h-full">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800">
                          {t("home.breakdown.title")}{" "}
                          <span className="text-slate-400 font-medium">({categoryExpenses.length})</span>
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-500">{t("home.breakdown.subtitle")}</p>
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
                            const categoryName =
                              category.categoryName || category.category?.name || t("home.other");
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
                                          {category.count ? t("home.breakdown.txCount", { count: category.count }) : " "}
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
                                          if (isHidden) setHiddenCategories(hiddenCategories.filter((i) => i !== index));
                                          else setHiddenCategories([...hiddenCategories, index]);
                                          if (selectedCategory === index) setSelectedCategory(null);
                                        }}
                                        className={[
                                          "rounded-full px-3 py-1 text-xs font-semibold border transition",
                                          isHidden
                                            ? "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                                            : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                                        ].join(" ")}
                                      >
                                        {isHidden ? t("home.breakdown.show") : t("home.breakdown.hide")} {t("home.breakdown.onChart")}
                                      </button>

                                      <span className="text-xs text-slate-400 group-hover:text-slate-500 transition">
                                        {t("home.breakdown.tapToHighlight")}
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
                          <div className="text-sm font-semibold text-slate-800">{t("home.breakdown.emptyTitle")}</div>
                          <div className="mt-1 text-xs text-slate-500">{t("home.breakdown.emptyDesc")}</div>
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
              title={t("home.stats.totalBalance")}
              badge={t("home.stats.badgeNow")}
              value={loading ? "..." : formatCurrency(stats.totalBalance)}
              icon={<Wallet className="h-5 w-5" />}
              tone="emerald"
            />
            <StatCard
              title={t("home.stats.income")}
              badge={t("home.stats.badgeThisMonth")}
              value={loading ? "..." : formatCurrency(stats.monthlyIncome)}
              icon={<TrendingUp className="h-5 w-5" />}
              tone="emerald"
            />
            <StatCard
              title={t("home.stats.expense")}
              badge={t("home.stats.badgeThisMonth")}
              value={loading ? "..." : formatCurrency(stats.monthlyExpense)}
              icon={<TrendingDown className="h-5 w-5" />}
              tone="emerald"
            />
            <StatCard
              title={t("home.stats.transactions")}
              badge={t("home.stats.badgeThisMonth")}
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
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">{t("home.recent.title")}</h2>
                  <p className="mt-1 text-sm text-slate-600">{t("home.recent.subtitle")}</p>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                  <PillButton labelKey="home.recent.filters.days7" />
                  <PillButton labelKey="home.recent.filters.days30" />
                  <PillButton labelKey="home.recent.filters.allWallets" />

                  <Link
                    to="/transactions"
                    className="ml-1 inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition whitespace-nowrap"
                  >
                    {t("home.recent.viewAll")} <ArrowRight size={16} />
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
                  <p className="mt-3 text-sm font-semibold text-slate-800">{t("home.recent.emptyTitle")}</p>
                  <p className="mt-1 text-xs text-slate-500">{t("home.recent.emptyDesc")}</p>
                  <Link
                    to="/transactions"
                    onClick={scrollToTop}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99]"
                  >
                    {t("home.recent.addFirst")} <ArrowRight size={16} />
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
              titleKey="home.actions.addTransaction.title"
              descKey="home.actions.addTransaction.desc"
              icon={<Plus className="h-6 w-6" />}
              variant="primary"
            />
            <ActionCard
              to="/wallets?action=add"
              titleKey="home.actions.addWallet.title"
              descKey="home.actions.addWallet.desc"
              icon={<Wallet className="h-6 w-6" />}
              variant="outline"
            />
            <ActionCard
              to="/reports"
              titleKey="home.actions.viewReports.title"
              descKey="home.actions.viewReports.desc"
              icon={<BarChart3 className="h-6 w-6" />}
              variant="outline"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function PillButton({ labelKey }) {
  const { t } = useTranslation();
  return (
    <button className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98] whitespace-nowrap">
      {t(labelKey)}
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

  const x = toneMap[tone] || toneMap.emerald;

  return (
    <div
      className={[
        "rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm transition",
        "hover:shadow-md hover:-translate-y-0.5 hover:ring-4",
        x.ring,
      ].join(" ")}
    >
      <div className="flex items-center justify-between">
        <div className={["h-12 w-12 rounded-2xl flex items-center justify-center", x.iconBg].join(" ")}>
          {icon}
        </div>
        <span className={["rounded-full px-2.5 py-1 text-xs font-bold", x.badge].join(" ")}>
          {badge}
        </span>
      </div>

      <div className="mt-3">
        <div className="text-sm text-slate-600">{title}</div>
        <div className="mt-1 text-xl sm:text-2xl font-extrabold text-slate-900">{value}</div>
      </div>
    </div>
  );
}

function ActionCard({ to, titleKey, descKey, icon, variant = "outline" }) {
  const { t } = useTranslation();
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
          <div className="text-lg font-extrabold truncate">{t(titleKey)}</div>
          <div className={["text-sm truncate", isPrimary ? "text-white/85" : "text-emerald-800/80"].join(" ")}>
            {t(descKey)}
          </div>
        </div>
      </div>

      <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
    </Link>
  );
}

export default HomePage;
