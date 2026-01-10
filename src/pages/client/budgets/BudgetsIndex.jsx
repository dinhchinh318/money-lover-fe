import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  TrendingUp,
  AlertTriangle,
  Target,
  DollarSign,
  BarChart3,
} from "lucide-react";
import { message, Modal, Alert } from "antd";
import { getAllBudgetsAPI, deleteBudgetAPI } from "../../../services/api.budget";
import BudgetModal from "../../../components/budgets/BudgetModal";
import dayjs from "dayjs";

// ✅ i18n
import { useTranslation } from "react-i18next";

const BudgetsIndex = () => {
  const { t } = useTranslation();

  const navigate = useNavigate();
  const [budgets, setBudgets] = useState([]);
  const [filteredBudgets, setFilteredBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // all, active, expired
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [summary, setSummary] = useState({
    totalBudgets: 0,
    totalLimit: 0,
    totalSpent: 0,
    warningCount: 0,
  });

  useEffect(() => {
    loadBudgets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterBudgets();
    calculateSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budgets, activeTab]);

  const loadBudgets = async () => {
    try {
      setLoading(true);
      const res = await getAllBudgetsAPI();
      if (res?.status || res?.EC === 0) {
        const budgetsData = res?.data?.budgets || res?.data || [];
        setBudgets(Array.isArray(budgetsData) ? budgetsData : []);
      } else {
        message.error(t("budgets.toast.loadFail"));
      }
    } catch (error) {
      message.error(t("budgets.toast.loadFail"));
    } finally {
      setLoading(false);
    }
  };

  const filterBudgets = () => {
    let filtered = [...budgets];
    const now = dayjs();

    if (activeTab === "active") {
      filtered = filtered.filter((budget) => {
        if (!budget?.end_date) return true;
        return dayjs(budget.end_date).isAfter(now);
      });
    } else if (activeTab === "expired") {
      filtered = filtered.filter((budget) => {
        if (!budget?.end_date) return false;
        return dayjs(budget.end_date).isBefore(now);
      });
    }

    setFilteredBudgets(filtered);
  };

  const calculateSummary = () => {
    const total = budgets.length;
    const totalLimit = budgets.reduce((sum, b) => sum + (b?.limit_amount || 0), 0);
    const totalSpent = budgets.reduce((sum, b) => sum + (b?.spent_amount || 0), 0);

    const warning = budgets.filter((b) => {
      const percentage = ((b?.spent_amount || 0) / (b?.limit_amount || 1)) * 100;
      return percentage >= 80;
    }).length;

    setSummary({
      totalBudgets: total,
      totalLimit,
      totalSpent,
      warningCount: warning,
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);
  };

  const handleAddBudget = () => {
    setEditingBudget(null);
    setModalOpen(true);
  };

  const handleEditBudget = (budget) => {
    setEditingBudget(budget);
    setModalOpen(true);
  };

  const handleDeleteBudget = (budget) => {
    Modal.confirm({
      title: t("budgets.confirm.deleteTitle"),
      content: t("budgets.confirm.deleteContent", {
        name: budget?.name || budget?.category?.name || t("budgets.defaultName"),
      }),
      okText: t("common4.delete"),
      okType: "danger",
      cancelText: t("common4.cancel"),
      onOk: async () => {
        try {
          const res = await deleteBudgetAPI(budget._id);
          if (res?.status || res?.EC === 0) {
            message.success(t("budgets.toast.deleteSuccess"));
            loadBudgets();
          } else {
            message.error(res?.message || t("budgets.toast.deleteFail"));
          }
        } catch (error) {
          message.error(t("common4.error"));
        }
      },
    });
  };

  const handleCopyBudget = (budget) => {
    setEditingBudget({
      ...budget,
      _id: undefined,
      name: t("budgets.copyName", {
        name: budget?.name || budget?.category?.name || t("budgets.defaultName"),
      }),
    });
    setModalOpen(true);
  };

  const getBudgetMenuItems = (budget) => [
    {
      key: "edit",
      label: t("common4.edit"),
      icon: <Edit size={16} />,
      onClick: () => handleEditBudget(budget),
    },
    {
      key: "copy",
      label: t("common4.copy"),
      icon: <Copy size={16} />,
      onClick: () => handleCopyBudget(budget),
    },
    { type: "divider" },
    {
      key: "delete",
      label: t("common4.delete"),
      icon: <Trash2 size={16} />,
      danger: true,
      onClick: () => handleDeleteBudget(budget),
    },
  ];

  const tabs = [
    { key: "all", label: t("budgets.tabs.all") },
    { key: "active", label: t("budgets.tabs.active") },
    { key: "expired", label: t("budgets.tabs.expired") },
  ];

  const emptyText =
    activeTab === "expired"
      ? t("budgets.empty.expired")
      : activeTab === "active"
      ? t("budgets.empty.active")
      : t("budgets.empty.all");

  return (
    <div
      className="
        min-h-screen
        bg-gradient-to-b from-emerald-50/70 via-white to-white
        dark:bg-none dark:bg-[var(--color-background)]
      "
    >
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="flex items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 truncate">
              {t("budgets.title")}
            </h1>
            <p className="text-gray-600 mt-1 text-sm">{t("budgets.subtitle")}</p>
          </div>

          <button
            onClick={handleAddBudget}
            className="shrink-0 px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition flex items-center gap-2"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">{t("budgets.actions.add")}</span>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {/* Total budgets */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">{t("budgets.summary.totalBudgets")}</span>
              <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Target className="text-indigo-600" size={18} />
              </div>
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-extrabold text-gray-900">
              {loading ? t("common4.loadingDots") : summary.totalBudgets}
            </div>
          </div>

          {/* Total limit */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">{t("budgets.summary.totalLimit")}</span>
              <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                <DollarSign className="text-emerald-600" size={18} />
              </div>
            </div>
            <div className="mt-2 text-base sm:text-lg font-extrabold text-emerald-700 truncate">
              {loading ? t("common4.loadingDots") : formatCurrency(summary.totalLimit)}
            </div>
          </div>

          {/* Total spent */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">{t("budgets.summary.totalSpent")}</span>
              <div className="h-9 w-9 rounded-xl bg-rose-50 flex items-center justify-center">
                <TrendingUp className="text-rose-600" size={18} />
              </div>
            </div>
            <div className="mt-2 text-base sm:text-lg font-extrabold text-rose-700 truncate">
              {loading ? t("common4.loadingDots") : formatCurrency(summary.totalSpent)}
            </div>
          </div>

          {/* Warning budgets */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">{t("budgets.summary.warningBudgets")}</span>
              <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center">
                <AlertTriangle className="text-amber-600" size={18} />
              </div>
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-extrabold text-gray-900">
              {loading ? t("common4.loadingDots") : summary.warningCount}
            </div>
          </div>
        </div>

        {/* Warning Alert */}
        {summary.warningCount > 0 && (
          <Alert
            message={t("budgets.alert.warning", { count: summary.warningCount })}
            type="warning"
            showIcon
            className="mb-6 rounded-xl"
            closable
          />
        )}

        {/* Filter Tabs */}
        <div className="flex gap-1 mb-5 bg-white p-1 rounded-lg border border-gray-200 shadow-sm inline-flex">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 sm:px-5 sm:py-2 text-sm rounded-lg font-semibold transition-all duration-300 ${
                activeTab === tab.key
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Budgets List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="ds-card ds-skeleton" style={{ height: "200px" }} />
            ))}
          </div>
        ) : filteredBudgets.length > 0 ? (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="h-[70vh] overflow-y-auto">
                <div className="space-y-2 p-3 sm:p-4">
                  {filteredBudgets.map((budget) => (
                    <BudgetRow
                      key={budget._id}
                      budget={budget}
                      onClick={() => navigate(`/budgets/${budget._id}`)}
                      onEdit={() => handleEditBudget(budget)}
                      onDelete={() => handleDeleteBudget(budget)}
                      t={t}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-300">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
              <Target className="text-indigo-600" size={40} />
            </div>
            <p className="text-xl font-semibold text-gray-700 mb-2">{emptyText}</p>
            <p className="text-gray-500 mb-6">{t("budgets.empty.hint")}</p>
            <button
              onClick={handleAddBudget}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
            >
              <Plus size={20} />
              {t("budgets.actions.addFirst")}
            </button>
          </div>
        )}
      </div>

      {/* Budget Modal */}
      <BudgetModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingBudget(null);
        }}
        budget={editingBudget}
        onSuccess={loadBudgets}
      />
    </div>
  );
};

const BudgetRow = ({ budget, onClick, onEdit, onDelete, t }) => {
  const spent = budget?.spent_amount || 0;
  const limit = budget?.limit_amount || 1;
  const percent = Math.min((spent / limit) * 100, 100);

  const getColor = () => {
    if (percent >= 100) return "#EF4444";
    if (percent >= 80) return "#F59E0B";
    if (percent >= 50) return "#3B82F6";
    return "#10B981";
  };

  const color = getColor();

  const title = budget?.name || budget?.category?.name || t("budgets.defaultName");

  const dateText = budget?.start_date
    ? `${dayjs(budget.start_date).format("DD/MM")} – ${dayjs(budget.end_date).format("DD/MM")}`
    : budget?.end_date
    ? dayjs(budget.end_date).format("DD/MM")
    : t("budgets.noEndDateShort");

  return (
    <div
      onClick={onClick}
      className="group flex items-center gap-3 sm:gap-4
        bg-white rounded-xl p-3 sm:p-4
        border border-gray-200
        hover:border-gray-300 hover:shadow-sm
        transition cursor-pointer"
    >
      {/* Icon */}
      <div
        className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}22` }}
      >
        <BarChart3 size={20} style={{ color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 text-sm sm:text-base truncate">{title}</p>

        <p className="text-xs sm:text-sm text-gray-500 truncate mt-0.5">{dateText}</p>

        <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: color }} />
        </div>
      </div>

      {/* Right */}
      <div className="flex flex-col items-end gap-1">
        <span className="text-xs sm:text-lg font-extrabold tabular-nums" style={{ color }}>
          {percent.toFixed(0)}%
        </span>

        <span className="text-xs sm:text-sm font-semibold text-gray-700">
          {new Intl.NumberFormat("vi-VN").format(limit)}đ
        </span>
      </div>

      {/* Actions desktop */}
      <div className="hidden sm:flex gap-1 opacity-0 group-hover:opacity-100 transition">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-2 rounded-lg hover:bg-blue-50"
          title={t("common4.edit")}
          aria-label={t("common4.edit")}
        >
          <Edit size={16} className="text-blue-600" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-2 rounded-lg hover:bg-red-50"
          title={t("common4.delete")}
          aria-label={t("common4.delete")}
        >
          <Trash2 size={16} className="text-red-600" />
        </button>
      </div>
    </div>
  );
};

export default BudgetsIndex;
