import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Pause,
  Play,
  CreditCard,
  Wallet,
  CheckCircle,
  Receipt,
  Clock,
} from "lucide-react";
import { message, Modal, Dropdown, Alert } from "antd";
import {
  getAllRecurringBillsAPI,
  deleteRecurringBillAPI,
  payRecurringBillAPI,
  pauseRecurringBillAPI,
  resumeRecurringBillAPI,
} from "../../../services/api.recurringBill";
import RecurringBillModal from "../../../components/recurringBills/RecurringBillModal";
import dayjs from "dayjs";

// ✅ i18n
import { useTranslation } from "react-i18next";

const RecurringBillsIndex = () => {
  const { t } = useTranslation();

  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [summary, setSummary] = useState({
    totalBills: 0,
    totalAmount: 0,
    upcomingCount: 0,
    paidThisMonth: 0,
  });

  useEffect(() => {
    loadBills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterBills();
    calculateSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bills, activeTab]);

  const loadBills = async () => {
    try {
      setLoading(true);
      const res = await getAllRecurringBillsAPI();
      if (res?.status || res?.EC === 0) {
        const billsData = res?.data?.bills || res?.data || [];
        setBills(Array.isArray(billsData) ? billsData : []);
      } else {
        message.error(t("recurringBills.errors.loadList"));
      }
    } catch {
      message.error(t("recurringBills.errors.loadList"));
    } finally {
      setLoading(false);
    }
  };

  const filterBills = () => {
    let filtered = [...bills];
    if (activeTab === "active") filtered = filtered.filter((b) => b.active);
    if (activeTab === "paused") filtered = filtered.filter((b) => !b.active);
    setFilteredBills(filtered);
  };

  const calculateSummary = () => {
    const totalBills = bills.length;

    const totalAmount = bills.reduce((sum, b) => sum + (b.amount || 0), 0);

    const now = dayjs();

    const upcomingCount = bills.filter((b) => {
      if (!b.active) return false;
      const nextRun = dayjs(b.next_run);
      return nextRun.isAfter(now) && nextRun.isBefore(now.add(7, "days"));
    }).length;

    const paidThisMonth = bills.filter((b) => {
      if (!b.last_paid_at) return false;
      return dayjs(b.last_paid_at).isSame(now, "month");
    }).length;

    setSummary({ totalBills, totalAmount, upcomingCount, paidThisMonth });
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);

  const handleAddBill = () => {
    setEditingBill(null);
    setModalOpen(true);
  };

  const handleEditBill = (bill) => {
    setEditingBill(bill);
    setModalOpen(true);
  };

  const handleDeleteBill = (bill) => {
    Modal.confirm({
      title: t("recurringBills.confirm.deleteTitle"),
      content: t("recurringBills.confirm.deleteContent", { name: bill?.name || "" }),
      okText: t("common1.delete"),
      okType: "danger",
      cancelText: t("common1.cancel"),
      onOk: async () => {
        try {
          const res = await deleteRecurringBillAPI(bill._id);
          if (res?.status || res?.EC === 0) {
            message.success(t("recurringBills.toast.deleteSuccess"));
            loadBills();
          } else {
            message.error(res?.message || t("recurringBills.toast.deleteFail"));
          }
        } catch {
          message.error(t("common1.errorOccurred"));
        }
      },
    });
  };

  const handlePayNow = async (bill) => {
    try {
      const res = await payRecurringBillAPI(bill._id);
      if (res?.status || res?.EC === 0) {
        message.success(t("recurringBills.toast.paySuccess"));
        loadBills();
      } else {
        message.error(res?.message || t("recurringBills.toast.payFail"));
      }
    } catch {
      message.error(t("common1.errorOccurred"));
    }
  };

  const handleToggleActive = async (bill) => {
    Modal.confirm({
      title: bill.active ? t("recurringBills.confirm.pauseTitle") : t("recurringBills.confirm.resumeTitle"),
      content: bill.active
        ? t("recurringBills.confirm.pauseContent", { name: bill?.name || "" })
        : t("recurringBills.confirm.resumeContent", { name: bill?.name || "" }),
      okText: bill.active ? t("recurringBills.actions.pause") : t("recurringBills.actions.activate"),
      cancelText: t("common1.cancel"),
      okType: bill.active ? "danger" : "primary",
      onOk: async () => {
        try {
          const res = bill.active
            ? await pauseRecurringBillAPI(bill._id)
            : await resumeRecurringBillAPI(bill._id);

          if (res?.data?.status || res?.status || res?.EC === 0) {
            message.success(
              bill.active ? t("recurringBills.toast.pauseSuccess") : t("recurringBills.toast.resumeSuccess")
            );
            loadBills();
          } else {
            message.error(res?.data?.message || t("recurringBills.toast.actionFail"));
          }
        } catch {
          message.error(t("common1.errorOccurred"));
        }
      },
    });
  };

  const tabs = [
    { key: "all", label: t("recurringBills.tabs.all") },
    { key: "active", label: t("recurringBills.tabs.active") },
    { key: "paused", label: t("recurringBills.tabs.paused") },
  ];

  const emptyTitle =
    activeTab === "paused"
      ? t("recurringBills.empty.pausedTitle")
      : activeTab === "active"
      ? t("recurringBills.empty.activeTitle")
      : t("recurringBills.empty.allTitle");

  return (
    <div
      className="
        min-h-screen
        bg-gradient-to-b from-emerald-50/70 via-white to-white
        dark:bg-none dark:bg-[var(--color-background)]
      "
    >
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 truncate">
              {t("recurringBills.title")}
            </h1>
            <p className="text-gray-600 mt-1 text-sm">{t("recurringBills.subtitle")}</p>
          </div>

          <button
            onClick={handleAddBill}
            className="shrink-0 px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-700 shadow-md hover:shadow-lg transition flex items-center gap-2"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">{t("recurringBills.actions.add")}</span>
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">{t("recurringBills.summary.totalBills")}</span>
              <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <Receipt className="text-blue-600" size={18} />
              </div>
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-extrabold text-gray-900">{summary.totalBills}</div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">{t("recurringBills.summary.totalAmountPerMonth")}</span>
              <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Wallet className="text-emerald-600" size={18} />
              </div>
            </div>
            <div className="mt-2 text-base sm:text-lg font-extrabold text-emerald-700 truncate">
              {formatCurrency(summary.totalAmount)}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">{t("recurringBills.summary.upcoming")}</span>
              <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center">
                <Clock className="text-amber-600" size={18} />
              </div>
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-extrabold text-gray-900">{summary.upcomingCount}</div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">{t("recurringBills.summary.paidThisMonth")}</span>
              <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="text-emerald-600" size={18} />
              </div>
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-extrabold text-gray-900">{summary.paidThisMonth}</div>
          </div>
        </div>

        {/* Upcoming alert */}
        {summary.upcomingCount > 0 && (
          <Alert
            message={t("recurringBills.alert.upcoming7days", { count: summary.upcomingCount })}
            type="info"
            showIcon
            className="mb-6 rounded-xl"
            closable
          />
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white p-1.5 rounded-xl border-2 border-gray-200 shadow-sm inline-flex">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === tab.key
                  ? "bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="ds-card ds-skeleton" style={{ height: "180px" }} />
            ))}
          </div>
        ) : filteredBills.length > 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="max-h-[65vh] overflow-y-auto">
              <div className="space-y-2 p-3 sm:p-4 pb-20">
                {filteredBills.map((bill) => (
                  <RecurringBillRow
                    key={bill._id}
                    bill={bill}
                    onEdit={handleEditBill}
                    onDelete={handleDeleteBill}
                    onPay={handlePayNow}
                    onToggle={handleToggleActive}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-300">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mb-4">
              <Receipt className="text-blue-600" size={40} />
            </div>

            <p className="text-xl font-semibold text-gray-700 mb-2">{emptyTitle}</p>
            <p className="text-gray-500 mb-6">{t("recurringBills.empty.desc")}</p>

            <button
              onClick={handleAddBill}
              className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
            >
              <Plus size={20} />
              {t("recurringBills.actions.addFirst")}
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      <RecurringBillModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingBill(null);
        }}
        bill={editingBill}
        onSuccess={loadBills}
      />
    </div>
  );
};

const RecurringBillRow = ({ bill, onEdit, onDelete, onPay, onToggle }) => {
  const { t } = useTranslation();

  const isPaidThisMonth = bill.last_paid_at && dayjs(bill.last_paid_at).isSame(dayjs(), "month");
  const isUpcoming = bill.active && dayjs(bill.next_run).diff(dayjs(), "day") <= 7;

  const color = bill.type === "income" ? "#10B981" : "#EF4444";

  const getFrequencyLabel = (frequency) => {
    const keyMap = {
      daily: "daily",
      weekly: "weekly",
      biweekly: "biweekly",
      monthly: "monthly",
      yearly: "yearly",
      custom: "custom",
    };
    const key = keyMap[frequency] || "custom";
    return t(`recurringBills.frequency.${key}`);
  };

  return (
    <div
      className="group flex items-start gap-3 sm:gap-4
        bg-white rounded-xl p-3 sm:p-4
        border border-gray-200
        hover:border-gray-300 hover:shadow-sm
        transition min-h-[5.5rem]"
    >
      {/* Icon */}
      <div
        className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}22` }}
      >
        <CreditCard size={26} style={{ color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm sm:text-base break-words leading-snug">
          {bill.name}
        </p>

        <div className="flex flex-wrap gap-1 mt-1">
          {bill.active ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
              {t("recurringBills.badges.active")}
            </span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              {t("recurringBills.badges.paused")}
            </span>
          )}

          {isUpcoming && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
              {t("recurringBills.badges.upcoming")}
            </span>
          )}
        </div>

        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          {dayjs(bill.next_run).format("DD/MM/YYYY")} • {getFrequencyLabel(bill.frequency)}
        </p>
      </div>

      {/* Amount */}
      <div className="flex flex-col items-end max-w-[40%] sm:max-w-none pl-3">
        <span
          className="text-base sm:text-lg font-extrabold tabular-nums break-words leading-tight"
          style={{ color }}
        >
          {bill.type === "income" ? "+" : "-"}
          {new Intl.NumberFormat("vi-VN").format(bill.amount)}đ
        </span>

        {isPaidThisMonth && (
          <span className="text-xs text-emerald-600 font-medium">
            {t("recurringBills.badges.paid")}
          </span>
        )}
      </div>

      {/* Mobile actions */}
      <div className="sm:hidden self-start">
        <Dropdown
          trigger={["click"]}
          menu={{
            items: [
              {
                key: "pay",
                label: isPaidThisMonth ? t("recurringBills.actions.paid") : t("recurringBills.actions.payNow"),
                icon: <CreditCard size={14} />,
                disabled: isPaidThisMonth,
                onClick: () => onPay(bill),
              },
              {
                key: "edit",
                label: t("common1.edit"),
                icon: <Edit size={14} />,
                onClick: () => onEdit(bill),
              },
              {
                key: "toggle",
                label: bill.active ? t("recurringBills.actions.pause") : t("recurringBills.actions.activate"),
                icon: bill.active ? <Pause size={14} /> : <Play size={14} />,
                onClick: () => onToggle(bill),
              },
              { type: "divider" },
              {
                key: "delete",
                label: t("common1.delete"),
                danger: true,
                icon: <Trash2 size={14} />,
                onClick: () => onDelete(bill),
              },
            ],
          }}
        >
          <button className="p-2 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
            </svg>
          </button>
        </Dropdown>
      </div>

      {/* Actions desktop */}
      <div className="hidden sm:flex gap-1 opacity-0 group-hover:opacity-100 transition">
        <button
          onClick={() => onPay(bill)}
          disabled={isPaidThisMonth}
          className="p-2 rounded-lg hover:bg-emerald-50 disabled:opacity-40"
          title={t("recurringBills.actions.payNow")}
        >
          <CreditCard size={16} className="text-emerald-600" />
        </button>

        <button
          onClick={() => onEdit(bill)}
          className="p-2 rounded-lg hover:bg-blue-50"
          title={t("common1.edit")}
        >
          <Edit size={16} className="text-blue-600" />
        </button>

        <button
          onClick={() => onToggle(bill)}
          className="p-2 rounded-lg hover:bg-amber-50"
          title={bill.active ? t("recurringBills.actions.pause") : t("recurringBills.actions.activate")}
        >
          {bill.active ? <Pause size={16} className="text-amber-600" /> : <Play size={16} className="text-emerald-600" />}
        </button>

        <button
          onClick={() => onDelete(bill)}
          className="p-2 rounded-lg hover:bg-red-50"
          title={t("common1.delete")}
        >
          <Trash2 size={16} className="text-red-600" />
        </button>
      </div>
    </div>
  );
};

export default RecurringBillsIndex;
