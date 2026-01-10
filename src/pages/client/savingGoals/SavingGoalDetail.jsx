import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Target, Edit, Trash2, CheckCircle } from "lucide-react";
import { message, Modal, Tabs, InputNumber } from "antd";
import {
  getSavingGoalByIdAPI,
  deleteSavingGoalAPI,
  depositSavingGoalAPI,
  withdrawSavingGoalAPI,
  completeSavingGoalAPI, // ✅ FIX: thiếu import trong code bạn gửi
} from "../../../services/api.savingGoal";
import SavingGoalModal from "../../../components/savingGoals/SavingGoalModal";
import dayjs from "dayjs";

// ✅ i18n
import { useTranslation } from "react-i18next";

const SavingGoalDetail = () => {
  const { t, i18n } = useTranslation();

  const { id } = useParams();
  const navigate = useNavigate();

  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("info");
  const [modalOpen, setModalOpen] = useState(false);

  const [amount, setAmount] = useState(0);

  useEffect(() => {
    if (id) loadGoal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadGoal = async () => {
    try {
      setLoading(true);
      const res = await getSavingGoalByIdAPI(id);
      if (res?.status || res?.EC === 0) {
        setGoal(res.data);
      } else {
        message.error(t("savingGoalDetail.toast.notFound"));
        navigate("/saving-goals");
      }
    } catch (error) {
      message.error(t("savingGoalDetail.toast.loadError"));
      navigate("/saving-goals");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amountValue) => {
    const locale = i18n.language === "en" ? "en-US" : "vi-VN";
    return new Intl.NumberFormat(locale, { style: "currency", currency: "VND" }).format(amountValue);
  };

  const formatDate = (date) => {
    if (!date) return t("savingGoalDetail.date.noDeadline");
    return dayjs(date).format("DD/MM/YYYY");
  };

  const getTimeRemaining = () => {
    if (!goal || !goal.target_date) return null;

    const now = dayjs();
    const target = dayjs(goal.target_date);
    const diff = target.diff(now, "day");

    if (diff < 0) return { key: "overdue", text: t("savingGoalDetail.time.overdue"), color: "#EF4444" };
    if (diff < 30)
      return {
        key: "soon",
        text: t("savingGoalDetail.time.daysLeft", { days: diff }),
        color: "#F59E0B",
      };
    return {
      key: "normal",
      text: t("savingGoalDetail.time.daysLeft", { days: diff }),
      color: "#6B7280",
    };
  };

  const handleEdit = () => setModalOpen(true);

  const handleCompleteGoal = () => {
    Modal.confirm({
      title: t("savingGoalDetail.confirm.complete.title"),
      content: t("savingGoalDetail.confirm.complete.content"),
      okText: t("savingGoalDetail.confirm.complete.ok"),
      cancelText: t("savingGoalDetail.confirm.complete.cancel"),
      onOk: async () => {
        try {
          const res = await completeSavingGoalAPI(goal._id);

          // tuỳ BE của bạn: res.status / res.EC / res.data.status
          const ok = res?.status || res?.EC === 0 || res?.data?.status;
          if (ok) {
            message.success(t("savingGoalDetail.toast.completeSuccess"));
            loadGoal();
          } else {
            message.error(t("savingGoalDetail.toast.actionFail"));
          }
        } catch (err) {
          message.error(t("savingGoalDetail.toast.genericError"));
        }
      },
    });
  };

  const handleDeposit = async () => {
    if (amount <= 0) {
      message.error(t("savingGoalDetail.money.invalidAmount"));
      return;
    }

    try {
      await depositSavingGoalAPI(goal._id, amount);
      message.success(t("savingGoalDetail.toast.depositSuccess"));
      setAmount(0);
      loadGoal();
    } catch (err) {
      message.error(err?.response?.data?.message || t("savingGoalDetail.toast.depositFail"));
    }
  };

  const handleWithdraw = async () => {
    if (amount <= 0) {
      message.error(t("savingGoalDetail.money.invalidAmount"));
      return;
    }

    try {
      await withdrawSavingGoalAPI(goal._id, amount);
      message.success(t("savingGoalDetail.toast.withdrawSuccess"));
      setAmount(0);
      loadGoal();
    } catch (err) {
      message.error(err?.response?.data?.message || t("savingGoalDetail.toast.withdrawFail"));
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: t("savingGoalDetail.confirm.delete.title"),
      content: t("savingGoalDetail.confirm.delete.content", { name: goal?.name || "" }),
      okText: t("savingGoalDetail.confirm.delete.ok"),
      okType: "danger",
      cancelText: t("savingGoalDetail.confirm.delete.cancel"),
      onOk: async () => {
        try {
          const res = await deleteSavingGoalAPI(goal._id);
          if (res?.status || res?.EC === 0) {
            message.success(t("savingGoalDetail.toast.deleteSuccess"));
            navigate("/saving-goals");
          } else {
            message.error(res?.message || t("savingGoalDetail.toast.deleteFail"));
          }
        } catch (error) {
          message.error(t("savingGoalDetail.toast.genericError"));
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="text-center">
          <div className="ds-skeleton w-64 h-64 rounded-lg mb-4"></div>
          <p className="ds-text-secondary">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (!goal) return null;

  const isCompleted = goal.is_completed;

  const progress = isCompleted ? 100 : goal.progress || 0;
  const current = isCompleted ? goal.target_amount : goal.current_amount || 0;
  const target = goal.target_amount || 1;
  const remaining = target - current;

  const timeRemaining = getTimeRemaining();
  const isSoon = !isCompleted && timeRemaining?.key === "soon";

  const tabItems = [
    {
      key: "info",
      label: t("savingGoalDetail.tabs.info"),
      children: (
        <div className="space-y-6">
          <div className="ds-card">
            <div className="flex items-start gap-4 mb-6 flex-wrap sm:flex-nowrap">
              <div className="w-20 h-20 rounded-full bg-[#10B981]/10 flex items-center justify-center flex-shrink-0">
                <Target className="text-[#10B981] w-10 h-10" />
              </div>

              <div className="flex-1">
                <h2 className="ds-heading-2 mb-2">{goal.name}</h2>

                <div className="flex items-center gap-3 mb-4">
                  {isCompleted && <span className="ds-badge ds-badge-success">{t("savingGoalDetail.badges.completed")}</span>}

                  {!goal.is_active && <span className="ds-badge ds-badge-warning">{t("savingGoalDetail.badges.paused")}</span>}

                  {isSoon && (
                    <span
                      className="ds-badge"
                      style={{ backgroundColor: "#F59E0B20", color: "#F59E0B" }}
                    >
                      {t("savingGoalDetail.badges.dueSoon")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="ds-text-secondary">{t("savingGoalDetail.labels.progress")}</span>
                <span className="text-3xl font-bold text-[#10B981]">{progress.toFixed(1)}%</span>
              </div>
              <div className="ds-progress-bar" style={{ height: "20px" }}>
                <div
                  className="ds-progress-bar-fill ds-progress-bar-fill-success"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
            </div>

            {/* Deposit / Withdraw */}
            {goal.is_active && (
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <InputNumber
                  min={1}
                  value={amount}
                  onChange={setAmount}
                  style={{ width: 200 }}
                  placeholder={t("savingGoalDetail.money.placeholder")}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(value) => (value ? value.replace(/,/g, "") : "")}
                  addonAfter="VND"
                />

                <button onClick={handleDeposit} className="ds-button-primary">
                  {t("savingGoalDetail.actions.deposit")}
                </button>

                <button onClick={handleWithdraw} className="ds-button-secondary" disabled={current <= 0}>
                  {t("savingGoalDetail.actions.withdraw")}
                </button>
              </div>
            )}

            {/* Details */}
            <div className="min-w-0">
              <p className="ds-text-secondary mb-1">{t("savingGoalDetail.labels.wallet")}</p>
              <p className="font-semibold break-words">{goal.wallet?.name || t("common.na")}</p>
            </div>

            <div className="min-w-0 mt-4">
              <p className="ds-text-secondary mb-1">{t("savingGoalDetail.labels.target")}</p>
              <p className="font-bold text-[#3B82F6] text-base sm:text-lg break-words leading-tight">
                {formatCurrency(target)}
              </p>
            </div>

            <div className="min-w-0 mt-4">
              <p className="ds-text-secondary mb-1">{t("savingGoalDetail.labels.remaining")}</p>
              <p
                className={`font-bold text-base sm:text-lg break-words leading-tight ${
                  remaining < 0 ? "text-[#EF4444]" : "text-[#10B981]"
                }`}
              >
                {formatCurrency(remaining)}
              </p>
            </div>

            <div className="min-w-0 mt-4">
              <p className="ds-text-secondary mb-1">{t("savingGoalDetail.labels.deadline")}</p>
              <p className="font-semibold break-words">{formatDate(goal.target_date)}</p>

              {timeRemaining && (
                <p className="text-sm mt-1" style={{ color: timeRemaining.color }}>
                  {t("savingGoalDetail.labels.timeRemaining")}: <span className="font-semibold">{timeRemaining.text}</span>
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-[#E5E7EB]">
              {!goal.is_completed && (
                <button
                  onClick={handleCompleteGoal}
                  className="ds-button-primary"
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <CheckCircle size={18} />
                  {t("savingGoalDetail.actions.markCompleted")}
                </button>
              )}

              <button
                onClick={handleEdit}
                className="ds-button-secondary"
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Edit size={18} />
                {t("savingGoalDetail.actions.edit")}
              </button>

              <button
                onClick={handleDelete}
                className="ds-button-danger"
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Trash2 size={18} />
                {t("savingGoalDetail.actions.delete")}
              </button>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate("/saving-goals")}
          className="flex items-center gap-2 text-[#6B7280] hover:text-[#111827] mb-6 transition-colors"
          type="button"
        >
          <ArrowLeft size={20} />
          <span>{t("savingGoalDetail.actions.backToList")}</span>
        </button>

        <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} size="large" />
        </div>
      </div>

      <SavingGoalModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        goal={goal}
        onSuccess={() => {
          loadGoal();
          setModalOpen(false);
        }}
      />
    </div>
  );
};

export default SavingGoalDetail;
