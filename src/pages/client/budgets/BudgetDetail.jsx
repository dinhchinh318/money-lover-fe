import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Wallet, Edit, Trash2 } from "lucide-react";
import { message, Modal, Tabs } from "antd";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  getBudgetByIdAPI,
  deleteBudgetAPI,
  getBudgetStatsAPI,
  getBudgetTransactionsAPI,
} from "../../../services/api.budget";
import BudgetModal from "../../../components/budgets/BudgetModal";
import dayjs from "dayjs";

// ✅ i18n
import { useTranslation } from "react-i18next";

const BudgetDetail = () => {
  const { t } = useTranslation();

  const { id } = useParams();
  const navigate = useNavigate();

  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("info");
  const [modalOpen, setModalOpen] = useState(false);

  const [stats, setStats] = useState(null);

  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);

  useEffect(() => {
    if (id) loadBudget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (activeTab === "transactions" && budget) loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, budget]);

  useEffect(() => {
    if (activeTab === "statistics" && budget) loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, budget]);

  const loadBudget = async () => {
    try {
      setLoading(true);
      const res = await getBudgetByIdAPI(id);

      if (res?.status || res?.EC === 0) {
        setBudget(res.data);
      } else {
        message.error(t("budgetDetail.toast.notFound"));
        navigate("/budgets");
      }
    } catch (error) {
      message.error(t("budgetDetail.toast.loadFail"));
      navigate("/budgets");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await getBudgetStatsAPI(id);
      if (res?.status || res?.EC === 0) setStats(res.data);
    } catch (error) {}
  };

  const loadTransactions = async () => {
    try {
      setLoadingTx(true);
      const res = await getBudgetTransactionsAPI(budget._id);
      if (res?.status || res?.EC === 0) {
        const raw = res.data || [];
        const mapped = raw.map((tx) => ({
          id: tx._id,
          amount: Number(tx.amount),
          date: tx.date || tx.createdAt,
          category: tx.categoryId?.name || t("budgetDetail.tx.defaultCategory"),
          note: tx.note || "",
        }));
        setTransactions(mapped);
      }
    } catch (e) {
      message.error(t("budgetDetail.toast.txLoadFail"));
    } finally {
      setLoadingTx(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return t("common5.na");
    return dayjs(date).format("DD/MM/YYYY");
  };

  const calculateBudgetStatus = () => {
    if (!budget) return { percentage: 0, statusColor: "#10B981" };

    const spent = budget.spent_amount || 0;
    const limit = budget.limit_amount || 1;
    const percentage = Math.min((spent / limit) * 100, 100);

    let statusColor = "#10B981";
    if (percentage >= 100) statusColor = "#EF4444";
    else if (percentage >= 80) statusColor = "#F59E0B";
    else if (percentage >= 50) statusColor = "#3B82F6";

    return { percentage, statusColor };
  };

  const handleEdit = () => setModalOpen(true);

  const handleDelete = () => {
    Modal.confirm({
      title: t("budgetDetail.confirm.deleteTitle"),
      content: t("budgetDetail.confirm.deleteContent"),
      okText: t("common5.delete"),
      okType: "danger",
      cancelText: t("common5.cancel"),
      onOk: async () => {
        try {
          const res = await deleteBudgetAPI(budget._id);
          if (res?.status || res?.EC === 0) {
            message.success(t("budgetDetail.toast.deleteSuccess"));
            navigate("/budgets");
          } else {
            message.error(res?.message || t("budgetDetail.toast.deleteFail"));
          }
        } catch (error) {
          message.error(t("common5.error"));
        }
      },
    });
  };

  // ✅ FIX: hook useMemo phải nằm TRƯỚC mọi return có điều kiện
  const groupedTransactions = useMemo(() => {
    return transactions.reduce((acc, tx) => {
      const dateKey = dayjs(tx.date).format("DD/MM/YYYY");
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(tx);
      return acc;
    }, {});
  }, [transactions]);

  // ====== sau khi đã khai báo xong hooks mới được return có điều kiện ======
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="text-center">
          <div className="ds-skeleton w-64 h-64 rounded-lg mb-4"></div>
          <p className="ds-text-secondary">{t("common5.loading")}</p>
        </div>
      </div>
    );
  }

  if (!budget) return null;

  const safeStats = stats || {
    limit: budget.limit_amount || 0,
    spent: budget.spent_amount || 0,
    remaining: (budget.limit_amount || 0) - (budget.spent_amount || 0),
    percent: 0,
    byDate: [],
  };

  const budgetStatus = calculateBudgetStatus();

  const spent = safeStats.spent;
  const limit = safeStats.limit || 1;
  const remaining = safeStats.remaining;
  const percent = safeStats.percent;

  const progressColor =
    percent >= 100 ? "#EF4444" : percent >= 80 ? "#F59E0B" : "#10B981";

  const pieData = [
    { name: t("budgetDetail.pie.spent"), value: safeStats.spent, color: "#EF4444" },
    {
      name: t("budgetDetail.pie.remaining"),
      value: Math.max(safeStats.limit - safeStats.spent, 0),
      color: "#10B981",
    },
  ];

  const periodLabel =
    budget.period === "weekly"
      ? t("budgetDetail.period.weekly")
      : budget.period === "monthly"
      ? t("budgetDetail.period.monthly")
      : budget.period === "yearly"
      ? t("budgetDetail.period.yearly")
      : t("budgetDetail.period.custom");

  const tabItems = [
    {
      key: "info",
      label: t("budgetDetail.tabs.info"),
      children: (
        <div className="space-y-6">
          <div className="ds-card">
            <div className="flex items-start gap-4 mb-6 flex-wrap sm:flex-nowrap">
              <div className="w-20 h-20 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center flex-shrink-0">
                <Wallet className="text-[#3B82F6] w-10 h-10" />
              </div>

              <div className="flex-1">
                <h2 className="ds-heading-2 mb-2">
                  {budget.name || budget.category?.name || t("budgetDetail.defaultName")}
                </h2>

                <div className="flex items-center gap-4 mb-4">
                  <span className="ds-badge ds-badge-primary">{periodLabel}</span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <span className="ds-text-secondary">{t("budgetDetail.info.progress")}</span>
                <span className="text-2xl font-bold" style={{ color: budgetStatus.statusColor }}>
                  {budgetStatus.percentage.toFixed(1)}%
                </span>
              </div>

              <div className="ds-progress-bar" style={{ height: "20px" }}>
                <div
                  className="ds-progress-bar-fill"
                  style={{
                    width: `${budgetStatus.percentage}%`,
                    backgroundColor: budgetStatus.statusColor,
                    borderRadius: "10px",
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#E5E7EB] pt-6">
              <div>
                <p className="ds-text-secondary mb-1">{t("budgetDetail.info.category")}</p>
                <p className="font-semibold">{budget.category?.name || t("common5.na")}</p>
              </div>

              <div>
                <p className="ds-text-secondary mb-1">{t("budgetDetail.info.wallet")}</p>
                <p className="font-semibold">{budget.wallet?.name || t("budgetDetail.info.allWallets")}</p>
              </div>

              <div>
                <p className="ds-text-secondary mb-1">{t("budgetDetail.info.limit")}</p>
                <p className="font-bold text-[#3B82F6] text-lg break-words">{formatCurrency(limit)}</p>
              </div>

              <div>
                <p className="ds-text-secondary mb-1">{t("budgetDetail.info.spent")}</p>
                <p className={`font-bold text-lg ${spent > limit ? "text-[#EF4444]" : ""}`}>
                  {formatCurrency(spent)}
                </p>
              </div>

              <div>
                <p className="ds-text-secondary mb-1">{t("budgetDetail.info.remaining")}</p>
                <p className={`font-bold text-lg ${remaining < 0 ? "text-[#EF4444]" : "text-[#10B981]"}`}>
                  {formatCurrency(remaining)}
                </p>
              </div>

              <div>
                <p className="ds-text-secondary mb-1">{t("budgetDetail.info.timeRange")}</p>
                <p className="font-semibold">
                  {budget.start_date
                    ? `${formatDate(budget.start_date)} - ${formatDate(budget.end_date)}`
                    : formatDate(budget.end_date)}
                </p>
              </div>
            </div>

            {budget.description && (
              <div className="mt-6 pt-6 border-t border-[#E5E7EB]">
                <p className="ds-text-secondary mb-1">{t("budgetDetail.info.description")}</p>
                <p className="ds-body">{budget.description}</p>
              </div>
            )}

            <div className="flex gap-3 mt-6 pt-6 border-t border-[#E5E7EB]">
              <button
                onClick={handleEdit}
                className="ds-button-primary"
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Edit size={18} />
                {t("common5.edit")}
              </button>

              <button
                onClick={handleDelete}
                className="ds-button-danger"
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Trash2 size={18} />
                {t("common5.delete")}
              </button>
            </div>
          </div>
        </div>
      ),
    },

    {
      key: "transactions",
      label: t("budgetDetail.tabs.transactions"),
      children: (
        <div className="space-y-6">
          <div className="ds-card flex flex-col max-h-[calc(100vh-260px)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">{t("budgetDetail.tx.title")}</h3>
              <span className="ds-text-secondary">
                {t("budgetDetail.tx.count", { count: transactions.length })}
              </span>
            </div>

            {loadingTx ? (
              <p className="ds-text-secondary">{t("common5.loading")}</p>
            ) : transactions.length > 0 ? (
              <div className="flex-1 overflow-y-auto pr-1 -mr-1 space-y-6 pb-4">
                {Object.entries(groupedTransactions).map(([date, items]) => (
                  <div key={date}>
                    <p className="text-xs font-semibold text-gray-500 mb-2 sticky top-0 bg-white py-1 z-10">
                      {date}
                    </p>

                    <div className="space-y-2">
                      {items.map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition"
                        >
                          <div className="w-10 h-10 flex-shrink-0 rounded-full bg-rose-100 flex items-center justify-center">
                            <span className="text-rose-600 font-bold text-sm">₫</span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                              {tx.note || tx.category}
                            </p>
                            <p className="text-xs text-gray-500">{dayjs(tx.date).format("HH:mm")}</p>
                          </div>

                          <p className="flex-shrink-0 font-bold text-rose-600 text-sm">
                            -{formatCurrency(tx.amount)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ds-empty-state">
                <p className="ds-empty-state-text">{t("budgetDetail.tx.empty")}</p>
              </div>
            )}
          </div>
        </div>
      ),
    },

    {
      key: "statistics",
      label: t("budgetDetail.tabs.statistics"),
      children: (
        <div className="space-y-4">
          {/* Summary cards */}
          {stats ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="ds-card">
                <p className="ds-text-secondary">{t("budgetDetail.stats.limit")}</p>
                <p className="text-emerald-700 font-extrabold text-xl">
                  {formatCurrency(safeStats.limit)}
                </p>
              </div>

              <div className="ds-card">
                <p className="ds-text-secondary">{t("budgetDetail.stats.spent")}</p>
                <p className="text-rose-600 font-extrabold text-xl">
                  {formatCurrency(safeStats.spent)}
                </p>
              </div>

              <div className="ds-card">
                <p className="ds-text-secondary">{t("budgetDetail.stats.remaining")}</p>
                <p className="text-sky-600 font-extrabold text-xl">
                  {formatCurrency(safeStats.remaining)}
                </p>
              </div>
            </div>
          ) : (
            <div className="ds-card">{t("common5.loading")}</div>
          )}

          {/* Progress */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-2">{t("budgetDetail.stats.usageProgress")}</p>

            <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${percent}%`, backgroundColor: progressColor }}
              />
            </div>

            <div className="flex justify-end mt-2">
              <span className="font-semibold text-sm" style={{ color: progressColor }}>
                {percent}%
              </span>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{t("budgetDetail.stats.breakdownTitle")}</h3>
              <span className="text-sm text-gray-500">
                {t("budgetDetail.stats.total")}: {formatCurrency(safeStats.limit)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={70} outerRadius={100} paddingAngle={4} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => `${new Intl.NumberFormat("vi-VN").format(v)} đ`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-4">
                {pieData.map((item) => {
                  const p = safeStats.limit > 0 ? Math.round((item.value / safeStats.limit) * 100) : 0;

                  return (
                    <div key={item.name}>
                      <div className="flex justify-between text-sm font-medium">
                        <span>{item.name}</span>
                        <span>{p}%</span>
                      </div>

                      <div className="w-full h-2 bg-gray-200 rounded-full mt-1">
                        <div className="h-full rounded-full" style={{ width: `${p}%`, backgroundColor: item.color }} />
                      </div>

                      <p className="text-xs text-gray-500 mt-1">{formatCurrency(item.value)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Line Chart */}
          {stats?.byDate && safeStats.byDate.length > 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {t("budgetDetail.stats.byTimeTitle")}
              </h3>

              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={safeStats.byDate}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v) => new Intl.NumberFormat("vi-VN").format(v)}
                    />
                    <Tooltip
                      formatter={(value) => `${new Intl.NumberFormat("vi-VN").format(value)} đ`}
                      labelFormatter={(label) => t("budgetDetail.stats.dayLabel", { day: label })}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center">
              <p className="text-gray-500 font-medium">{t("budgetDetail.stats.noTimeData")}</p>
            </div>
          )}
        </div>
      ),
    }
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate("/budgets")}
          className="flex items-center gap-2 text-[#6B7280] hover:text-[#111827] mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>{t("budgetDetail.back")}</span>
        </button>

        <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} size="large" />
        </div>
      </div>

      <BudgetModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        budget={budget}
        onSuccess={() => {
          loadBudget();
          setModalOpen(false);
        }}
      />
    </div>
  );
};

export default BudgetDetail;
