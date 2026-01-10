import { useState, useEffect } from "react";
import { Card, Table, Spin, message } from "antd";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import FilterBar from "../../../components/reports/FilterBar";
import {
  getWalletExpenseDistributionAPI,
  compareWalletExpenseOverTimeAPI,
} from "../../../services/api.report";
import { getWalletsAPI } from "../../../services/api.wallet";
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
];

const ReportsWallet = () => {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [pieData, setPieData] = useState([]);
  const [lineData, setLineData] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [filters, setFilters] = useState({
    startDate: dayjs().subtract(5, "month").startOf("month").format("YYYY-MM-DD"),
    endDate: dayjs().endOf("month").format("YYYY-MM-DD"),
    period: "month",
  });

  useEffect(() => {
    loadWallets();
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
      } else {
        setWallets([]);
      }
    } catch {
      setWallets([]);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        period: filters.period || "month",
      };

      const [pieRes, lineRes] = await Promise.all([
        getWalletExpenseDistributionAPI(params),
        compareWalletExpenseOverTimeAPI(params),
      ]);

      // ===== PIE: distribution theo ví =====
      if ((pieRes?.status === true || pieRes?.error === 0 || pieRes?.EC === 0) && pieRes?.data) {
        const data = pieRes.data;

        const distribution = data.distribution || data || [];
        const expenseTotal = data.totalExpense || 0;

        const transformedData = Array.isArray(distribution)
          ? distribution.map((item) => {
              const walletType = item.walletType || item.type || "cash";
              const getWalletIcon = (type) => {
                switch (type) {
                  case "bank":
                    return "🏦";
                  case "cash":
                  default:
                    return "💵";
                }
              };

              return {
                walletId: item.walletId || item._id,
                walletName: item.walletName || item.name || t("reportsWallet.unknownWallet"),
                walletType,
                icon: getWalletIcon(walletType),
                amount: Number(item.totalExpense || item.amount || 0),
                percentage: Number(
                  item.percentage ||
                    (expenseTotal > 0
                      ? ((item.totalExpense || item.amount || 0) / expenseTotal) * 100
                      : 0)
                ).toFixed(1),
                income: Number(item.totalIncome || item.income || 0),
                expense: Number(item.totalExpense || item.expense || 0),
                balance: Number(item.balance || (item.totalIncome || 0) - (item.totalExpense || 0)),
                transactionCount: Number(item.count || item.transactionCount || 0),
              };
            })
          : [];

        setPieData(transformedData);
        setTotalExpense(expenseTotal);
      } else {
        setPieData([]);
        setTotalExpense(0);
      }

      // ===== LINE: compare theo thời gian =====
      if ((lineRes?.status === true || lineRes?.error === 0 || lineRes?.EC === 0) && lineRes?.data) {
        const lineDataArray = Array.isArray(lineRes.data) ? lineRes.data : [];

        const transformedLineData = lineDataArray.map((item) => {
          let periodLabel = "";
          const period = item.period || {};

          if (period.date) {
            periodLabel = dayjs(period.date).format("DD/MM/YYYY");
          } else if (period.year && period.month) {
            periodLabel = t("reportsWallet.period.month", { month: period.month, year: period.year });
          } else if (period.year && period.week) {
            periodLabel = t("reportsWallet.period.week", { week: period.week, year: period.year });
          } else if (period.year) {
            periodLabel = t("reportsWallet.period.year", { year: period.year });
          } else {
            periodLabel = t("reportsWallet.na");
          }

          return {
            period: periodLabel,
            walletId: item.walletId,
            walletName: item.walletName || t("reportsWallet.unknownWallet"),
            amount: Number(item.totalExpense || item.amount || 0),
          };
        });

        setLineData(transformedLineData);
      } else {
        setLineData([]);
      }
    } catch (error) {
      message.error(t("reportsWallet.loadError"));
      setPieData([]);
      setLineData([]);
      setTotalExpense(0);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value || 0);

  const tableColumns = [
    {
      title: t("reportsWallet.table.wallet"),
      dataIndex: "walletName",
      key: "walletName",
      fixed: "left",
      width: 180,
      render: (text, record, index) => (
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white text-base sm:text-lg font-bold flex-shrink-0"
            style={{ backgroundColor: COLORS[index % COLORS.length] }}
          >
            {record.icon || "💰"}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-gray-900 text-sm sm:text-base truncate">
              {text || t("reportsWallet.unknownWallet")}
            </div>
            <div className="text-xs text-gray-500 truncate">{record.walletType || ""}</div>
          </div>
        </div>
      ),
    },
    {
      title: t("reportsWallet.table.totalIncome"),
      dataIndex: "income",
      key: "income",
      width: 140,
      render: (value) => (
        <span className="text-[#10B981] font-semibold text-xs sm:text-sm">
          {formatCurrency(value || 0)}
        </span>
      ),
      sorter: (a, b) => (a.income || 0) - (b.income || 0),
    },
    {
      title: t("reportsWallet.table.totalExpense"),
      dataIndex: "amount",
      key: "expense",
      width: 140,
      render: (value) => (
        <span className="text-[#EF4444] font-semibold text-xs sm:text-sm">
          {formatCurrency(value || 0)}
        </span>
      ),
      sorter: (a, b) => (a.amount || 0) - (b.amount || 0),
    },
    {
      title: t("reportsWallet.table.balance"),
      dataIndex: "balance",
      key: "balance",
      width: 140,
      render: (value) => (
        <span className="text-[#2563EB] font-semibold text-xs sm:text-sm">
          {formatCurrency(value || 0)}
        </span>
      ),
      sorter: (a, b) => (a.balance || 0) - (b.balance || 0),
    },
    {
      title: t("reportsWallet.table.rate"),
      dataIndex: "percentage",
      key: "percentage",
      width: 100,
      render: (value) => (
        <span className="text-gray-600 font-medium text-xs sm:text-sm">
          {Number(value || 0).toFixed(1)}%
        </span>
      ),
      sorter: (a, b) => (a.percentage || 0) - (b.percentage || 0),
    },
    {
      title: t("reportsWallet.table.transactions"),
      dataIndex: "transactionCount",
      key: "transactionCount",
      width: 120,
      render: (value) => <span className="text-gray-600 text-xs sm:text-sm">{value || 0}</span>,
      sorter: (a, b) => (a.transactionCount || 0) - (b.transactionCount || 0),
    },
  ];

  // Prepare line chart data - group by period and wallet
  const prepareLineData = () => {
    const periodMap = {};
    lineData.forEach((item) => {
      const period = item.period || t("reportsWallet.na");
      if (!periodMap[period]) periodMap[period] = {};

      const walletName = item.walletName || `Wallet ${item.walletId}`;
      periodMap[period][walletName] = (periodMap[period][walletName] || 0) + item.amount;
    });

    const walletNamesSet = new Set();
    lineData.forEach((item) => {
      if (item.walletName) walletNamesSet.add(item.walletName);
    });

    return Object.keys(periodMap)
      .sort()
      .map((period) => {
        const data = { period };
        walletNamesSet.forEach((walletName) => {
          data[walletName] = periodMap[period][walletName] || 0;
        });
        return data;
      });
  };

  const lineChartData = prepareLineData();

  // Lấy danh sách wallet names từ lineData, tối đa 5 ví
  const walletNamesSet = new Set();
  lineData.forEach((item) => {
    if (item.walletName) walletNamesSet.add(item.walletName);
  });
  const lineKeys = Array.from(walletNamesSet).slice(0, 5);

  const totalIncome = pieData.reduce((sum, item) => sum + (item.income || 0), 0);
  const totalBalance = pieData.reduce((sum, item) => sum + (item.balance || 0), 0);

  const filteredPie = pieData.filter((item) => item.amount > 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/70 via-white to-white">
      <div className="max-w-[98%] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t("reportsWallet.title")}</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">{t("reportsWallet.subtitle")}</p>
        </div>

        {/* Filter Bar */}
        <div className="mb-6 sm:mb-8">
          <FilterBar
            onFilterChange={handleFilterChange}
            showPeriod={true}
            wallets={wallets}
            defaultDateRange={[dayjs(filters.startDate), dayjs(filters.endDate)]}
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Spin size="large" />
          </div>
        ) : (
          <>
            {/* Summary Card */}
            {pieData.length > 0 && (
              <Card className="mb-4 sm:mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-0 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">{t("reportsWallet.summary.totalIncome")}</p>
                    <p className="text-xl sm:text-2xl font-bold text-[#10B981] break-words">
                      {formatCurrency(totalIncome)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">{t("reportsWallet.summary.totalExpense")}</p>
                    <p className="text-xl sm:text-2xl font-bold text-[#EF4444] break-words">
                      {formatCurrency(totalExpense)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">{t("reportsWallet.summary.balance")}</p>
                    <p className="text-xl sm:text-2xl font-bold text-[#2563EB] break-words">
                      {formatCurrency(totalBalance)}
                    </p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-gray-500 mt-3">
                  {t("reportsWallet.summary.totalWallets", { total: pieData.length })}
                </p>
              </Card>
            )}

            {/* Charts Section */}
            {pieData.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                {/* Pie Chart */}
                <Card className="shadow-sm">
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                    {t("reportsWallet.charts.pieTitle")}
                  </h3>

                  {filteredPie.some((item) => item.amount > 0) ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={filteredPie}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={false}
                          outerRadius="70%"
                          innerRadius="40%"
                          fill="#8884d8"
                          dataKey="amount"
                          nameKey="walletName"
                          paddingAngle={2}
                        >
                          {filteredPie.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                              stroke="#fff"
                              strokeWidth={2}
                            />
                          ))}
                        </Pie>

                        <Tooltip
                          formatter={(value, name) => [formatCurrency(value), name]}
                          labelFormatter={(label) => t("reportsWallet.tooltip.walletLabel", { label })}
                          contentStyle={{
                            backgroundColor: "#fff",
                            border: "1px solid #E5E7EB",
                            borderRadius: "8px",
                            padding: "12px",
                          }}
                        />

                        <Legend
                          formatter={(value, entry) => {
                            const idx = entry.payload?.index ?? entry.dataIndex ?? -1;
                            if (idx >= 0 && idx < filteredPie.length) {
                              return filteredPie[idx].walletName || value;
                            }
                            const item = filteredPie.find((p) => p.walletName === value || p.walletId === value);
                            return item ? item.walletName : value;
                          }}
                          iconType="circle"
                          wrapperStyle={{ paddingTop: "20px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[400px] text-gray-400">
                      <div className="text-center">
                        <p className="text-lg mb-2">{t("reportsWallet.empty.noExpenseTitle")}</p>
                        <p className="text-sm">{t("reportsWallet.empty.noExpenseDesc")}</p>
                      </div>
                    </div>
                  )}
                </Card>

                {/* Multi-line Chart */}
                <Card className="shadow-sm">
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                    {t("reportsWallet.charts.lineTitle")}
                  </h3>

                  {lineChartData.length > 0 && lineKeys.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: 0, bottom: 50 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis
                          dataKey="period"
                          stroke="#6B7280"
                          tick={{ fontSize: 10 }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis
                          stroke="#6B7280"
                          tick={{ fontSize: 10 }}
                          tickFormatter={(value) => formatCurrency(value)}
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
                        <Legend />
                        {lineKeys.map((key, index) => (
                          <Line
                            key={key}
                            type="monotone"
                            dataKey={key}
                            name={key}
                            stroke={COLORS[index % COLORS.length]}
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[400px] text-gray-400">
                      <div className="text-center">
                        <p className="text-lg mb-2">{t("reportsWallet.empty.noDataTitle")}</p>
                        <p className="text-sm">{t("reportsWallet.empty.noDataDesc")}</p>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            ) : (
              <Card className="shadow-sm mb-6">
                <div className="flex items-center justify-center h-[400px] text-gray-400">
                  <div className="text-center">
                    <p className="text-lg mb-2">{t("reportsWallet.empty.noExpenseDataTitle")}</p>
                    <p className="text-sm">{t("reportsWallet.empty.noExpenseDataDesc")}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Wallets Table */}
            {pieData.length > 0 && (
              <Card className="shadow-sm">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                  {t("reportsWallet.table.title")}
                </h3>

                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="min-w-[600px] sm:min-w-0 px-4 sm:px-0">
                    <Table
                      columns={tableColumns}
                      dataSource={pieData.map((item, index) => ({
                        ...item,
                        key: item.walletId || index,
                      }))}
                      pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => t("reportsWallet.table.totalWallets", { total }),
                        responsive: true,
                        size: "small",
                      }}
                      scroll={{ x: "max-content" }}
                      size="small"
                      className="custom-table"
                    />
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

export default ReportsWallet;
