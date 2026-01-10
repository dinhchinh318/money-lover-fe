import { useState, useEffect, useMemo } from "react";
import { Card, Table, Spin, message } from "antd";
import { Calendar, BarChart3, TrendingUp, FileText, Filter } from "lucide-react";
import {
  LineChart,
  Line,
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
import { getTimeBasedReportAPI } from "../../../services/api.report";
import { getWalletsAPI } from "../../../services/api.wallet";
import { getCategoriesAPI } from "../../../services/api.category";
import dayjs from "dayjs";

// ✅ i18n
import { useTranslation } from "react-i18next";

const ReportsTime = () => {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [timeData, setTimeData] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    startDate: dayjs().subtract(5, "month").startOf("month").format("YYYY-MM-DD"),
    endDate: dayjs().endOf("month").format("YYYY-MM-DD"),
    period: "month",
    type: "all",
    walletId: "all",
    categoryId: "all",
  });

  // ===== Chart theme: tự lấy từ CSS variables để dark/light đều đúng =====
  const [chartTheme, setChartTheme] = useState({
    grid: "#E5E7EB",
    axis: "#6B7280",
    tooltipBg: "#fff",
    tooltipBorder: "#E5E7EB",
    tooltipText: "#111827",
    legendText: "#374151",
  });

  useEffect(() => {
    const apply = () => {
      const s = getComputedStyle(document.documentElement);
      const border = s.getPropertyValue("--color-border").trim() || "#E5E7EB";
      const textPrimary = s.getPropertyValue("--color-text-primary").trim() || "#111827";
      const textSecondary = s.getPropertyValue("--color-text-secondary").trim() || "#6B7280";
      const bgAlt = s.getPropertyValue("--color-background-alt").trim() || "#fff";

      setChartTheme({
        grid: border,
        axis: textSecondary,
        tooltipBg: bgAlt,
        tooltipBorder: border,
        tooltipText: textPrimary,
        legendText: textPrimary,
      });
    };

    apply();
    const obs = new MutationObserver(apply);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    loadWallets();
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const loadWallets = async () => {
    try {
      const res = await getWalletsAPI();
      if ((res?.status === true || res?.error === 0 || res?.EC === 0) && res?.data) {
        const walletsData = Array.isArray(res.data) ? res.data : [];
        setWallets(walletsData);
      } else setWallets([]);
    } catch {
      setWallets([]);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await getCategoriesAPI();
      if ((res?.status === true || res?.error === 0 || res?.EC === 0) && res?.data) {
        const categoriesData = Array.isArray(res.data) ? res.data : [];
        setCategories(categoriesData);
      } else setCategories([]);
    } catch {
      setCategories([]);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const params = { ...filters, period: filters.period || "day" };
      const res = await getTimeBasedReportAPI(params);

      if ((res?.status === true || res?.error === 0 || res?.EC === 0) && res?.data) {
        const rawData = Array.isArray(res.data) ? res.data : [];
        const transformedData = rawData.map((item) => ({
          period: item.label || item.date || item.period || t("reportsTime.na"),
          income: Number(item.totalIncome || item.income || 0),
          expense: Number(item.totalExpense || item.expense || 0),
          balance: Number(item.balance || (item.totalIncome || 0) - (item.totalExpense || 0)),
        }));
        setTimeData(transformedData);
      } else {
        setTimeData([]);
        message.error(res?.message || res?.EM || t("reportsTime.cannotLoad"));
      }
    } catch {
      setTimeData([]);
      message.error(t("reportsTime.loadError"));
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value || 0);

  const tableColumns = useMemo(
    () => [
      {
        title: t("reportsTime.table.time"),
        dataIndex: "period",
        key: "period",
        fixed: "left",
        width: 140,
        sorter: (a, b) => String(a.period).localeCompare(String(b.period)),
        render: (text) => (
          <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-[var(--color-text-primary)]">
            {text}
          </span>
        ),
      },
      {
        title: t("reportsTime.table.income"),
        dataIndex: "income",
        key: "income",
        width: 170,
        render: (value) => (
          <span className="text-[#10B981] font-semibold text-xs sm:text-sm">
            {formatCurrency(value)}
          </span>
        ),
        sorter: (a, b) => (a.income || 0) - (b.income || 0),
      },
      {
        title: t("reportsTime.table.expense"),
        dataIndex: "expense",
        key: "expense",
        width: 170,
        render: (value) => (
          <span className="text-[#EF4444] font-semibold text-xs sm:text-sm">
            {formatCurrency(value)}
          </span>
        ),
        sorter: (a, b) => (a.expense || 0) - (b.expense || 0),
      },
      {
        title: t("reportsTime.table.balance"),
        dataIndex: "balance",
        key: "balance",
        width: 170,
        render: (value) => (
          <span className="text-[#2563EB] font-semibold text-xs sm:text-sm">
            {formatCurrency(value)}
          </span>
        ),
        sorter: (a, b) => (a.balance || 0) - (b.balance || 0),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t]
  );

  return (
    <div
      className="
        min-h-screen
        bg-gradient-to-b from-emerald-50/70 via-white to-white
        dark:bg-none dark:bg-[var(--color-background)]
        dark:text-[var(--color-text-primary)]
      "
    >
      <div className="max-w-[98%] mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-4">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
              <Calendar className="text-white w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            <div className="min-w-0 flex-1">
              <h1
                className="
                  text-2xl sm:text-3xl font-bold
                  bg-gradient-to-r from-gray-900 via-indigo-800 to-gray-900 bg-clip-text text-transparent
                  dark:bg-none dark:text-[var(--color-text-primary)]
                  dark:[-webkit-text-fill-color:var(--color-text-primary)]
                "
              >
                {t("reportsTime.title")}
              </h1>

              <p className="text-gray-600 dark:text-[var(--color-text-secondary)] mt-1 text-xs sm:text-sm">
                {t("reportsTime.subtitle")}
              </p>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <Card
          className="
            mb-4 sm:mb-6 shadow-lg border-0 rounded-2xl
            bg-gradient-to-br from-white to-gray-50
            dark:!bg-[var(--color-background-alt)] dark:!text-[var(--color-text-primary)]
            dark:border dark:border-[var(--color-border)]
          "
        >
          <div className="flex items-center gap-2 mb-4">
            <Filter className="text-indigo-500" size={18} />
            <h3 className="text-sm font-bold text-gray-800 dark:bg-none dark:!bg-[var(--color-background-alt)] dark:!text-[var(--color-text-primary)]
            dark:border dark:border-[var(--color-border)]">
              {t("reportsTime.filter.title")}
            </h3>
          </div>

          <FilterBar
            onFilterChange={handleFilterChange}
            showPeriod={true}
            showType={true}
            showWallet={true}
            showCategory={true}
            wallets={wallets}
            categories={categories}
            defaultDateRange={[dayjs(filters.startDate), dayjs(filters.endDate)]}
          />
        </Card>

        {loading ? (
          <div className="flex flex-col justify-center items-center py-20">
            <Spin size="large" />
            <p className="mt-4 text-gray-500 dark:text-[var(--color-text-secondary)]">
              {t("reportsTime.loading")}
            </p>
          </div>
        ) : (
          <>
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
              {/* Line */}
              <Card
                className="
                  shadow-lg hover:shadow-xl transition-all duration-300 border-0 rounded-2xl overflow-hidden
                  bg-gradient-to-br from-white to-gray-50
                  dark:!bg-[var(--color-background-alt)] dark:!text-[var(--color-text-primary)]
                  dark:border dark:border-[var(--color-border)]
                "
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg">
                    <TrendingUp className="text-white" size={18} />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-[var(--color-text-primary)]">
                    {t("reportsTime.charts.lineTitle")}
                  </h3>
                </div>

                {timeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={timeData} margin={{ top: 10, right: 10, left: 0, bottom: 50 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                      <XAxis
                        dataKey="period"
                        stroke={chartTheme.axis}
                        tick={{ fill: chartTheme.axis, fontSize: 10 }}
                        tickLine={{ stroke: chartTheme.grid }}
                        axisLine={{ stroke: chartTheme.grid }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis
                        stroke={chartTheme.axis}
                        tick={{ fill: chartTheme.axis, fontSize: 10 }}
                        tickLine={{ stroke: chartTheme.grid }}
                        axisLine={{ stroke: chartTheme.grid }}
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
                          padding: "12px",
                          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
                          color: chartTheme.tooltipText,
                        }}
                        labelStyle={{ color: chartTheme.tooltipText, fontWeight: 700 }}
                      />
                      <Legend
                        wrapperStyle={{ paddingTop: "20px" }}
                        iconType="line"
                        formatter={(value) => (
                          <span style={{ color: chartTheme.legendText, fontSize: "12px" }}>{value}</span>
                        )}
                      />
                      <Line
                        type="monotone"
                        dataKey="income"
                        name={t("reportsTime.series.income")}
                        stroke="#10B981"
                        strokeWidth={3}
                        dot={{ r: 5, fill: "#10B981", strokeWidth: 2 }}
                        activeDot={{ r: 7, stroke: "#10B981", strokeWidth: 2 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="expense"
                        name={t("reportsTime.series.expense")}
                        stroke="#EF4444"
                        strokeWidth={3}
                        dot={{ r: 5, fill: "#EF4444", strokeWidth: 2 }}
                        activeDot={{ r: 7, stroke: "#EF4444", strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div
                    className="
                      flex flex-col items-center justify-center h-[250px] sm:h-[350px]
                      bg-gray-50 rounded-xl border-2 border-dashed border-gray-200
                      dark:bg-[rgba(255,255,255,0.03)] dark:border-[var(--color-border)]
                    "
                  >
                    <BarChart3 className="text-gray-400 dark:text-[var(--color-text-secondary)] mb-2" size={32} />
                    <p className="text-sm text-gray-500 dark:text-[var(--color-text-secondary)]">
                      {t("reportsTime.empty")}
                    </p>
                  </div>
                )}
              </Card>

              {/* Bar */}
              <Card
                className="
                  shadow-lg hover:shadow-xl transition-all duration-300 border-0 rounded-2xl overflow-hidden
                  bg-gradient-to-br from-white to-gray-50
                  dark:!bg-[var(--color-background-alt)] dark:!text-[var(--color-text-primary)]
                  dark:border dark:border-[var(--color-border)]
                "
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg">
                    <BarChart3 className="text-white" size={18} />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-[var(--color-text-primary)]">
                    {t("reportsTime.charts.barTitle")}
                  </h3>
                </div>

                {timeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={timeData} margin={{ top: 10, right: 10, left: 0, bottom: 50 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                      <XAxis
                        dataKey="period"
                        stroke={chartTheme.axis}
                        tick={{ fill: chartTheme.axis, fontSize: 10 }}
                        tickLine={{ stroke: chartTheme.grid }}
                        axisLine={{ stroke: chartTheme.grid }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis
                        stroke={chartTheme.axis}
                        tick={{ fill: chartTheme.axis, fontSize: 10 }}
                        tickLine={{ stroke: chartTheme.grid }}
                        axisLine={{ stroke: chartTheme.grid }}
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
                          padding: "12px",
                          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
                          color: chartTheme.tooltipText,
                        }}
                        labelStyle={{ color: chartTheme.tooltipText, fontWeight: 700 }}
                      />
                      <Legend
                        wrapperStyle={{ paddingTop: "20px" }}
                        iconType="square"
                        formatter={(value) => (
                          <span style={{ color: chartTheme.legendText, fontSize: "12px" }}>{value}</span>
                        )}
                      />
                      <Bar dataKey="income" name={t("reportsTime.series.income")} fill="#10B981" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="expense" name={t("reportsTime.series.expense")} fill="#EF4444" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div
                    className="
                      flex flex-col items-center justify-center h-[250px] sm:h-[350px]
                      bg-gray-50 rounded-xl border-2 border-dashed border-gray-200
                      dark:bg-[rgba(255,255,255,0.03)] dark:border-[var(--color-border)]
                    "
                  >
                    <BarChart3 className="text-gray-400 dark:text-[var(--color-text-secondary)] mb-2" size={32} />
                    <p className="text-sm text-gray-500 dark:text-[var(--color-text-secondary)]">
                      {t("reportsTime.empty")}
                    </p>
                  </div>
                )}
              </Card>
            </div>

            {/* Table */}
            <Card
              className="
                shadow-lg hover:shadow-xl transition-all duration-300 border-0 rounded-2xl overflow-hidden
                bg-gradient-to-br from-white to-gray-50
                dark:!bg-[var(--color-background-alt)] dark:!text-[var(--color-text-primary)]
                dark:border dark:border-[var(--color-border)]
              "
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg">
                  <FileText className="text-white" size={18} />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-[var(--color-text-primary)]">
                  {t("reportsTime.table.title")}
                </h3>
              </div>

              {timeData.length > 0 ? (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="min-w-[520px] sm:min-w-0 px-4 sm:px-0">
                    <Table
                      columns={tableColumns}
                      dataSource={timeData}
                      rowKey="period"
                      pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => t("reportsTime.table.totalRecords", { total }),
                        pageSizeOptions: ["10", "20", "50", "100"],
                        responsive: true,
                        size: "small",
                      }}
                      scroll={{ x: "max-content" }}
                      size="small"
                      className="custom-table"
                      rowClassName={(record, index) =>
                        index % 2 === 0
                          ? "bg-transparent"
                          : "bg-gray-50/60 dark:bg-[rgba(255,255,255,0.03)]"
                      }
                    />
                  </div>
                </div>
              ) : (
                <div
                  className="
                    flex flex-col items-center justify-center py-12
                    bg-gray-50 rounded-xl border-2 border-dashed border-gray-200
                    dark:bg-[rgba(255,255,255,0.03)] dark:border-[var(--color-border)]
                  "
                >
                  <FileText className="text-gray-400 dark:text-[var(--color-text-secondary)] mb-2" size={32} />
                  <p className="text-sm text-gray-500 dark:text-[var(--color-text-secondary)]">
                    {t("reportsTime.empty")}
                  </p>
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportsTime;
