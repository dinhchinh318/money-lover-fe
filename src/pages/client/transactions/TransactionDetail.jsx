import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { message, Modal } from "antd";
import {
  getTransactionByIdAPI,
  deleteTransactionAPI,
  settleDebtLoanAPI,
} from "../../../services/api.transaction";
import TransactionModal from "../../../components/transactions/TransactionModal";
import dayjs from "dayjs";

// ✅ i18n
import { useTranslation } from "react-i18next";

const TransactionDetail = () => {
  const { t, i18n } = useTranslation();

  const { id } = useParams();
  const navigate = useNavigate();

  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [relatedTransactions, setRelatedTransactions] = useState([]);

  useEffect(() => {
    if (id) loadTransaction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadTransaction = async () => {
    try {
      setLoading(true);
      const res = await getTransactionByIdAPI(id);
      if (res?.status || res?.EC === 0) {
        setTransaction(res.data);
        // TODO: Load related transactions
      } else {
        message.error(t("transactionDetail.toast.notFound"));
        navigate("/transactions");
      }
    } catch (error) {
      message.error(t("transactionDetail.toast.loadError"));
      navigate("/transactions");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    const locale = i18n.language === "en" ? "en-US" : "vi-VN";
    return new Intl.NumberFormat(locale, { style: "currency", currency: "VND" }).format(amount);
  };

  const formatDateTime = (date) => dayjs(date).format("DD/MM/YYYY HH:mm");

  const getTransactionTypeColor = (type) => {
    const colors = {
      income: "#10B981",
      expense: "#EF4444",
      transfer: "#3B82F6",
      debt: "#F59E0B",
      loan: "#F97316",
      adjust: "#6B7280",
    };
    return colors[type] || "#6B7280";
  };

  const getTransactionTypeLabel = (type) => {
    const labels = {
      income: t("transactions.type.income"),
      expense: t("transactions.type.expense"),
      transfer: t("transactions.type.transfer"),
      debt: t("transactions.type.debt"),
      loan: t("transactions.type.loan"),
      adjust: t("transactions.type.adjust"),
    };
    return labels[type] || type;
  };

  const getRecurringLabel = (recurringType) => {
    switch (recurringType) {
      case "daily":
        return t("transactionDetail.recurring.daily");
      case "weekly":
        return t("transactionDetail.recurring.weekly");
      case "monthly":
        return t("transactionDetail.recurring.monthly");
      case "yearly":
      default:
        return t("transactionDetail.recurring.yearly");
    }
  };

  const handleEdit = () => setModalOpen(true);

  const handleDelete = () => {
    Modal.confirm({
      title: t("transactionDetail.confirm.delete.title"),
      content: t("transactionDetail.confirm.delete.content"),
      okText: t("transactionDetail.confirm.delete.ok"),
      okType: "danger",
      cancelText: t("transactionDetail.confirm.delete.cancel"),
      onOk: async () => {
        try {
          const res = await deleteTransactionAPI(transaction._id);
          if (res?.status || res?.EC === 0) {
            message.success(t("transactionDetail.toast.deleteSuccess"));
            navigate("/transactions");
          } else {
            message.error(res?.message || t("transactionDetail.toast.deleteFail"));
          }
        } catch (error) {
          message.error(t("transactionDetail.toast.genericError"));
        }
      },
    });
  };

  const handleSettle = async () => {
    try {
      const res = await settleDebtLoanAPI(transaction._id);
      if (res?.status || res?.EC === 0) {
        message.success(t("transactionDetail.toast.settleSuccess"));
        loadTransaction();
      } else {
        message.error(res?.message || t("transactionDetail.toast.actionFail"));
      }
    } catch (error) {
      message.error(t("transactionDetail.toast.genericError"));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="text-center">
          <div className="ds-skeleton w-64 h-64 rounded-lg mb-4"></div>
          <p className="ds-text-secondary">{t("transactionDetail.loading")}</p>
        </div>
      </div>
    );
  }

  if (!transaction) return null;

  const typeColor = getTransactionTypeColor(transaction.type);

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate("/transactions")}
          className="flex items-center gap-2 text-[#6B7280] hover:text-[#111827] mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>{t("transactionDetail.back")}</span>
        </button>

        {/* Transaction Info Card */}
        <div className="ds-card mb-6">
          <div className="flex items-start gap-6 mb-6">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${typeColor}20` }}
            >
              {transaction.type === "income" ? (
                <TrendingUp size={40} style={{ color: typeColor }} />
              ) : (
                <TrendingDown size={40} style={{ color: typeColor }} />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span
                  className="ds-badge"
                  style={{ backgroundColor: `${typeColor}20`, color: typeColor }}
                >
                  {getTransactionTypeLabel(transaction.type)}
                </span>

                {transaction.isRecurring && (
                  <span className="ds-badge" style={{ backgroundColor: "#A855F720", color: "#A855F7" }}>
                    {t("transactionDetail.badges.recurring")}
                  </span>
                )}

                {transaction.isSettled && (
                  <span className="ds-badge ds-badge-success">
                    {t("transactionDetail.badges.settled")}
                  </span>
                )}
              </div>

              <p className="text-4xl font-bold mb-2" style={{ color: typeColor }}>
                {transaction.type === "income" ? "+" : transaction.type === "transfer" ? "→" : "-"}
                {formatCurrency(Math.abs(transaction.amount))}
              </p>

              <p className="ds-text-secondary">{formatDateTime(transaction.date)}</p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4 border-t border-[#E5E7EB] pt-6">
            {transaction.walletId && (
              <div className="flex">
                <span className="w-32 font-medium text-[#6B7280]">
                  {t("transactionDetail.fields.wallet")}
                </span>
                <span className="flex-1">{transaction.walletId?.name || transaction.walletId}</span>
              </div>
            )}

            {transaction.categoryId && (
              <div className="flex">
                <span className="w-32 font-medium text-[#6B7280]">
                  {t("transactionDetail.fields.category")}
                </span>
                <span className="flex-1">{transaction.categoryId?.name || transaction.categoryId}</span>
              </div>
            )}

            {transaction.toWalletId && (
              <div className="flex">
                <span className="w-32 font-medium text-[#6B7280]">
                  {t("transactionDetail.fields.toWallet")}
                </span>
                <span className="flex-1">{transaction.toWalletId?.name || transaction.toWalletId}</span>
              </div>
            )}

            {transaction.counterpartyName && (
              <div className="flex">
                <span className="w-32 font-medium text-[#6B7280]">
                  {t("transactionDetail.fields.counterparty")}
                </span>
                <span className="flex-1">{transaction.counterpartyName}</span>
              </div>
            )}

            {transaction.counterpartyContact && (
              <div className="flex">
                <span className="w-32 font-medium text-[#6B7280]">
                  {t("transactionDetail.fields.contact")}
                </span>
                <span className="flex-1">{transaction.counterpartyContact}</span>
              </div>
            )}

            {transaction.dueDate && (
              <div className="flex">
                <span className="w-32 font-medium text-[#6B7280]">
                  {t("transactionDetail.fields.dueDate")}
                </span>
                <span className="flex-1">{formatDateTime(transaction.dueDate)}</span>
              </div>
            )}

            {transaction.note && (
              <div className="flex">
                <span className="w-32 font-medium text-[#6B7280]">
                  {t("transactionDetail.fields.note")}
                </span>
                <span className="flex-1">{transaction.note}</span>
              </div>
            )}

            {transaction.adjustReason && (
              <div className="flex">
                <span className="w-32 font-medium text-[#6B7280]">
                  {t("transactionDetail.fields.adjustReason")}
                </span>
                <span className="flex-1">{transaction.adjustReason}</span>
              </div>
            )}

            {transaction.imageUrl && (
              <div className="flex">
                <span className="w-32 font-medium text-[#6B7280]">
                  {t("transactionDetail.fields.image")}
                </span>
                <div className="flex-1">
                  <img
                    src={transaction.imageUrl}
                    alt={t("transactionDetail.imageAlt")}
                    className="w-32 h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => window.open(transaction.imageUrl, "_blank")}
                  />
                </div>
              </div>
            )}

            {transaction.isRecurring && (
              <div className="mt-4 p-4 bg-[#A855F710] rounded-lg">
                <p className="font-medium mb-2">{t("transactionDetail.recurring.title")}</p>
                <p className="text-sm text-[#6B7280]">
                  {t("transactionDetail.recurring.repeat")}: {getRecurringLabel(transaction.recurringType)}
                </p>

                {transaction.endDate && (
                  <p className="text-sm text-[#6B7280]">
                    {t("transactionDetail.recurring.endDate")}: {formatDateTime(transaction.endDate)}
                  </p>
                )}

                <a
                  href="/transactions?recurring=true"
                  className="text-sm text-[#3B82F6] hover:underline mt-2 inline-block"
                >
                  {t("transactionDetail.recurring.viewAll")}
                </a>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-[#E5E7EB]">
            <button
              onClick={handleEdit}
              className="ds-button-primary"
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Edit size={18} />
              {t("transactionDetail.actions.edit")}
            </button>

            {(transaction.type === "debt" || transaction.type === "loan") && !transaction.isSettled && (
              <button
                onClick={handleSettle}
                className="ds-button-secondary"
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                {t("transactionDetail.actions.settle")}
              </button>
            )}

            <button
              onClick={handleDelete}
              className="ds-button-danger"
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Trash2 size={18} />
              {t("transactionDetail.actions.delete")}
            </button>
          </div>
        </div>

        {/* Related Transactions */}
        {relatedTransactions.length > 0 && (
          <div className="ds-card">
            <h3 className="ds-heading-3 mb-4">{t("transactionDetail.related.title")}</h3>
            <div className="space-y-2">
              {relatedTransactions.map((related) => {
                const c = getTransactionTypeColor(related.type);
                return (
                  <div
                    key={related._id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-[#F9FAFB] transition-colors cursor-pointer"
                    onClick={() => navigate(`/transactions/${related._id}`)}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${c}20` }}
                    >
                      {related.type === "income" ? (
                        <TrendingUp size={20} style={{ color: c }} />
                      ) : (
                        <TrendingDown size={20} style={{ color: c }} />
                      )}
                    </div>

                    <div className="flex-1">
                      <p className="font-medium text-[#111827]">
                        {related.categoryId?.name || getTransactionTypeLabel(related.type)}
                      </p>
                      <p className="text-sm text-[#6B7280]">{formatDateTime(related.date)}</p>
                    </div>

                    <p className="font-bold" style={{ color: c }}>
                      {related.type === "income" ? "+" : "-"}
                      {formatCurrency(Math.abs(related.amount))}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        transaction={transaction}
        onSuccess={() => {
          loadTransaction();
          setModalOpen(false);
        }}
      />
    </div>
  );
};

export default TransactionDetail;
