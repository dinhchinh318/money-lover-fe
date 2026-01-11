import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Wallet,
  Building2,
  Edit,
  Trash2,
  Archive,
  Star,
  TrendingUp,
  TrendingDown,
  BarChart3,
  MoreVertical,
  Calendar,
} from "lucide-react";
import { message, Modal, Tabs, Dropdown } from "antd";
import {
  getWalletByIdAPI,
  deleteWalletAPI,
  setDefaultWalletAPI,
  archiveWalletAPI,
  unarchiveWalletAPI,
} from "../../../services/api.wallet";
import WalletModal from "../../../components/wallets/WalletModal";
import DateRangePicker from "../../../components/common/DateRangePicker";
import dayjs from "dayjs";
import { getAllTransactionsAPI } from "../../../services/api.transaction";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ✅ i18n
import { useTranslation } from "react-i18next";

/* =========================
   Small UI helpers (Tailwind)
========================= */
const cn = (...xs) => xs.filter(Boolean).join(" ");

const Card = ({ className = "", children }) => (
  <div
    className={cn(
      "rounded-2xl bg-white border border-slate-200/70 shadow-sm",
      "p-4 sm:p-5",
      className
    )}
  >
    {children}
  </div>
);

const SoftBadge = ({ tone = "emerald", children }) => {
  const toneMap = {
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200/60",
    blue: "bg-sky-50 text-sky-700 ring-sky-200/60",
    amber: "bg-amber-50 text-amber-700 ring-amber-200/60",
    slate: "bg-slate-50 text-slate-700 ring-slate-200/60",
    red: "bg-rose-50 text-rose-700 ring-rose-200/60",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
        toneMap[tone] || toneMap.slate
      )}
    >
      {children}
    </span>
  );
};

const IconPill = ({ tone = "emerald", children, className = "" }) => {
  const toneMap = {
    emerald: "bg-emerald-50 text-emerald-600",
    red: "bg-rose-50 text-rose-600",
    blue: "bg-sky-50 text-sky-600",
    slate: "bg-slate-100 text-slate-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <div
      className={cn(
        "h-10 w-10 rounded-2xl flex items-center justify-center",
        toneMap[tone] || toneMap.slate,
        className
      )}
    >
      {children}
    </div>
  );
};

const PrimaryButton = ({ className = "", ...props }) => (
  <button
    className={cn(
      "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5",
      "bg-emerald-600 text-white font-semibold shadow-sm",
      "hover:bg-emerald-700 active:bg-emerald-800",
      "focus:outline-none focus:ring-2 focus:ring-emerald-500/30",
      "transition",
      className
    )}
    {...props}
  />
);

const SecondaryButton = ({ className = "", ...props }) => (
  <button
    className={cn(
      "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5",
      "bg-white text-slate-700 font-semibold border border-slate-200",
      "hover:bg-slate-50 active:bg-slate-100",
      "focus:outline-none focus:ring-2 focus:ring-emerald-500/20",
      "transition",
      className
    )}
    {...props}
  />
);

const DangerButton = ({ className = "", ...props }) => (
  <button
    className={cn(
      "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5",
      "bg-rose-600 text-white font-semibold shadow-sm",
      "hover:bg-rose-700 active:bg-rose-800",
      "focus:outline-none focus:ring-2 focus:ring-rose-500/30",
      "transition",
      className
    )}
    {...props}
  />
);

const EmptyState = ({ title, hint }) => (
  <div className="flex flex-col items-center justify-center text-center py-10 sm:py-12">
    <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
      <BarChart3 className="text-slate-600" size={28} />
    </div>
    <p className="text-slate-900 font-semibold">{title}</p>
    {hint ? <p className="text-sm text-slate-500 mt-1 max-w-md">{hint}</p> : null}
  </div>
);

const SkeletonScreen = ({ text }) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center">
    <div className="w-full max-w-md px-6">
      <div className="rounded-2xl bg-white border border-slate-200/70 p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-slate-100 animate-pulse" />
          <div className="flex-1">
            <div className="h-4 w-2/3 bg-slate-100 rounded animate-pulse" />
            <div className="h-3 w-1/3 bg-slate-100 rounded mt-2 animate-pulse" />
          </div>
        </div>
        <div className="h-10 w-1/2 bg-slate-100 rounded mt-5 animate-pulse" />
      </div>
      <p className="text-center text-slate-500 mt-4">{text}</p>
    </div>
  </div>
);

/* =========================
   Main
========================= */
const WalletDetail = () => {
  const { t, i18n } = useTranslation();

  const { id } = useParams();
  const navigate = useNavigate();

  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("info");
  const [modalOpen, setModalOpen] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [dateRange, setDateRange] = useState(null);

  // paging state
  const LIMIT = 50;
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // UI: mobile action sheet
  const [actionsOpen, setActionsOpen] = useState(false);

  useEffect(() => {
    if (id) loadWallet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // khi vào tab giao dịch/thống kê hoặc đổi filter -> reset trang + tải trang 1
  useEffect(() => {
    if ((activeTab === "transactions" || activeTab === "statistics") && wallet) {
      resetAndLoadTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, wallet, dateRange]);

  const loadWallet = async () => {
    try {
      setLoading(true);
      const res = await getWalletByIdAPI(id);
      if (res?.EC === 0 && res?.data) {
        setWallet(res.data);
      } else {
        message.error(t("walletDetail.toast.notFound"));
        navigate("/wallets");
      }
    } catch (error) {
      message.error(t("walletDetail.toast.loadWalletError"));
      navigate("/wallets");
    } finally {
      setLoading(false);
    }
  };

  const resetAndLoadTransactions = async () => {
    setPage(1);
    setHasMore(true);
    await loadTransactions({ nextPage: 1, append: false });
  };

  // loadTransactions hỗ trợ append
  const loadTransactions = async ({ nextPage = 1, append = false } = {}) => {
    try {
      if (!wallet?._id) return;

      const startDate = dateRange?.[0]
        ? dayjs(dateRange[0]).startOf("day").toISOString()
        : undefined;

      const endDate = dateRange?.[1]
        ? dayjs(dateRange[1]).endOf("day").toISOString()
        : undefined;

      const params = {
        walletId: wallet._id,
        startDate,
        endDate,
        page: nextPage,
        limit: LIMIT,
        sortBy: "-date",
      };

      if (append) setLoadingMore(true);
      else setLoading(true);

      const res = await getAllTransactionsAPI(params);

      // BE: { status, error, data: { transactions, pagination } }
      if (!res?.status || res?.error !== 0) {
        message.error(res?.message || t("walletDetail.toast.loadTxFail"));
        if (!append) setTransactions([]);
        setHasMore(false);
        return;
      }

      const raw = res?.data?.transactions || [];
      const pagination = res?.data?.pagination;

      const mapped = raw.map((tx) => {
        const type = tx.type;
        const amount = Number(tx.amount || 0);

        const categoryName =
          tx?.categoryId?.name ||
          (type === "transfer"
            ? t("walletDetail.tx.type.transfer")
            : type === "adjust"
            ? t("walletDetail.tx.type.adjust")
            : t("walletDetail.tx.type.other"));

        const description =
          tx.note ||
          (type === "transfer"
            ? t("walletDetail.tx.desc.transferTo", { name: tx?.toWalletId?.name || "" })
            : type === "adjust"
            ? t("walletDetail.tx.desc.adjust", {
                from: tx.adjustFrom ?? "",
                to: tx.adjustTo ?? "",
              })
            : "");

        const signedAmount =
          type === "expense" ? -Math.abs(amount) : type === "income" ? Math.abs(amount) : amount;

        return {
          id: tx._id,
          category: categoryName,
          amount: signedAmount,
          date: tx.date || tx.createdAt,
          type,
          description,
          raw: tx,
        };
      });

      setTransactions((prev) => (append ? [...prev, ...mapped] : mapped));
      setPage(nextPage);

      if (pagination?.totalPages != null) {
        setHasMore(nextPage < pagination.totalPages);
      } else {
        setHasMore(raw.length === LIMIT);
      }
    } catch (error) {
      message.error(t("walletDetail.toast.loadTxError"));
      if (!append) setTransactions([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const formatCurrency = (amount, currency = "VND") => {
    const locale = i18n.language === "en" ? "en-US" : "vi-VN";
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
  };

  const formatDate = (date) => dayjs(date).format("DD/MM/YYYY");

  const maskAccount = (acc) => (acc ? acc.replace(/(.{4})(.*)/, "****$2") : "");

  const handleEdit = () => setModalOpen(true);

  const handleDelete = () => {
    Modal.confirm({
      title: t("walletDetail.confirm.delete.title"),
      content: t("walletDetail.confirm.delete.content", { name: wallet.name }),
      okText: t("walletDetail.confirm.delete.ok"),
      okType: "danger",
      cancelText: t("walletDetail.confirm.delete.cancel"),
      onOk: async () => {
        try {
          const res = await deleteWalletAPI(wallet._id);
          if (res?.EC === 0) {
            message.success(t("walletDetail.toast.deleteSuccess"));
            navigate("/wallets");
          } else {
            message.error(res?.message || t("walletDetail.toast.deleteFail"));
          }
        } catch (error) {
          message.error(t("walletDetail.toast.genericError"));
        }
      },
    });
  };

  const handleSetDefault = async () => {
    try {
      const res = await setDefaultWalletAPI(wallet._id);
      if (res?.EC === 0) {
        message.success(t("walletDetail.toast.setDefaultSuccess"));
        loadWallet();
      } else {
        message.error(res?.message || t("walletDetail.toast.actionFail"));
      }
    } catch (error) {
      message.error(t("walletDetail.toast.genericError"));
    }
  };

  const handleArchive = async () => {
    try {
      const res = await archiveWalletAPI(wallet._id);
      if (res?.EC === 0) {
        message.success(t("walletDetail.toast.archiveSuccess"));
        navigate("/wallets");
      } else {
        message.error(res?.message || t("walletDetail.toast.actionFail"));
      }
    } catch (error) {
      message.error(t("walletDetail.toast.genericError"));
    }
  };

  const handleUnarchive = async () => {
    try {
      const res = await unarchiveWalletAPI(wallet._id);
      if (res?.EC === 0) {
        message.success(t("walletDetail.toast.unarchiveSuccess"));
        loadWallet();
      } else {
        message.error(res?.message || t("walletDetail.toast.actionFail"));
      }
    } catch (error) {
      message.error(t("walletDetail.toast.genericError"));
    }
  };

  const calculateTransactionStats = () => {
    const income = transactions
      .filter((tx) => tx.type === "income")
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    const expense = transactions
      .filter((tx) => tx.type === "expense")
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    return { income, expense };
  };

  const stats = useMemo(() => calculateTransactionStats(), [transactions]);
  const netChange = stats.income - stats.expense;

  const getDeltaForWallet = (tRaw) => {
    const type = tRaw?.type;
    const amount = Number(tRaw?.amount || 0);

    if (type === "income") return Math.abs(amount);
    if (type === "expense") return -Math.abs(amount);
    if (type === "transfer") return -Math.abs(amount);

    if (type === "adjust") {
      const from = Number(tRaw?.adjustFrom);
      const to = Number(tRaw?.adjustTo);
      if (!Number.isNaN(from) && !Number.isNaN(to)) return to - from;
      return Number.isFinite(amount) ? amount : 0;
    }

    return 0;
  };

  const formatShortDay = (iso) => dayjs(iso).format("DD/MM");

  const statsData = useMemo(() => {
    const raws = (transactions || []).map((tx) => tx.raw).filter(Boolean);

    const byDay = new Map();
    for (const r of raws) {
      const dayKey = dayjs(r.date || r.createdAt).format("YYYY-MM-DD");
      const delta = getDeltaForWallet(r);

      const cur = byDay.get(dayKey) || { dayKey, income: 0, expense: 0, net: 0 };
      if (delta >= 0) cur.income += delta;
      else cur.expense += Math.abs(delta);
      cur.net += delta;

      byDay.set(dayKey, cur);
    }

    const days = Array.from(byDay.values()).sort((a, b) => (a.dayKey > b.dayKey ? 1 : -1));

    let running = 0;
    const line = days.map((d) => {
      running += d.net;
      return {
        dayKey: d.dayKey,
        day: formatShortDay(d.dayKey),
        income: d.income,
        expense: d.expense,
        net: d.net,
        cumulative: running,
      };
    });

    const byCat = new Map();
    for (const r of raws) {
      const delta = getDeltaForWallet(r);
      if (delta >= 0) continue;

      const name =
        r?.categoryId?.name ||
        (r?.type === "transfer"
          ? t("walletDetail.tx.type.transfer")
          : r?.type === "adjust"
          ? t("walletDetail.tx.type.adjust")
          : t("walletDetail.tx.type.other"));

      byCat.set(name, (byCat.get(name) || 0) + Math.abs(delta));
    }

    const pie = Array.from(byCat.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return { line, pie };
  }, [transactions, t]);

  const txGroups = useMemo(() => {
    const map = new Map();
    for (const tx of transactions) {
      const key = dayjs(tx.date).format("YYYY-MM-DD");
      const arr = map.get(key) || [];
      arr.push(tx);
      map.set(key, arr);
    }
    const keys = Array.from(map.keys()).sort((a, b) => (a > b ? -1 : 1));
    return keys.map((k) => ({
      dayKey: k,
      label: dayjs(k).format("DD/MM/YYYY"),
      items: map.get(k),
    }));
  }, [transactions]);

  const dateRangeLabel = useMemo(() => {
    if (!dateRange?.[0] || !dateRange?.[1]) return t("walletDetail.filters.allTime");
    return `${dayjs(dateRange[0]).format("DD/MM")} – ${dayjs(dateRange[1]).format("DD/MM")}`;
  }, [dateRange, t]);

  if (loading) return <SkeletonScreen text={t("walletDetail.loading")} />;
  if (!wallet) return null;

  const currency = wallet?.currency || "VND";
  const isBank = wallet.type === "bank";

  const actionItems = [
    {
      key: "edit",
      label: (
        <span className="inline-flex items-center gap-2">
          <Edit size={16} /> {t("walletDetail.actions.edit")}
        </span>
      ),
      onClick: () => handleEdit(),
    },
    !wallet.is_default
      ? {
          key: "default",
          label: (
            <span className="inline-flex items-center gap-2">
              <Star size={16} /> {t("walletDetail.actions.setDefault")}
            </span>
          ),
          onClick: () => handleSetDefault(),
        }
      : null,
    !wallet.is_archived
      ? {
          key: "archive",
          label: (
            <span className="inline-flex items-center gap-2">
              <Archive size={16} /> {t("walletDetail.actions.archive")}
            </span>
          ),
          onClick: () => handleArchive(),
        }
      : {
          key: "unarchive",
          label: (
            <span className="inline-flex items-center gap-2">
              <Archive size={16} /> {t("walletDetail.actions.unarchive")}
            </span>
          ),
          onClick: () => handleUnarchive(),
        },
    !wallet.is_default
      ? {
          key: "delete",
          label: (
            <span className="inline-flex items-center gap-2 text-rose-600">
              <Trash2 size={16} /> {t("walletDetail.actions.delete")}
            </span>
          ),
          onClick: () => handleDelete(),
        }
      : null,
  ].filter(Boolean);

  const SummaryCard = ({ title, value, tone, icon }) => (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500">{title}</p>
          <p className={cn("mt-1 text-lg sm:text-xl font-extrabold", tone)}>{value}</p>
        </div>
        <IconPill tone={tone === "text-rose-600" ? "red" : tone === "text-sky-600" ? "blue" : "emerald"}>
          {icon}
        </IconPill>
      </div>
    </Card>
  );

  const TxRow = ({ tx }) => {
    const isIncomeTx = tx.type === "income";
    const isExpenseTx = tx.type === "expense";
    const tone = isIncomeTx ? "emerald" : isExpenseTx ? "red" : "slate";

    return (
      <button
        className={cn(
          "w-full text-left",
          "flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white",
          "px-3.5 py-3.5 sm:px-4 sm:py-4",
          "hover:bg-slate-50 active:bg-slate-100 transition",
          "focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        )}
        type="button"
      >
        <IconPill tone={tone} className="h-11 w-11 rounded-2xl">
          {isIncomeTx ? <TrendingUp size={18} /> : isExpenseTx ? <TrendingDown size={18} /> : <Wallet size={18} />}
        </IconPill>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="font-bold text-slate-900 truncate">{tx.category}</p>
            <p
              className={cn(
                "shrink-0 font-extrabold",
                "text-base sm:text-lg",
                isIncomeTx ? "text-emerald-600" : isExpenseTx ? "text-rose-600" : "text-slate-700"
              )}
            >
              {isIncomeTx ? "+" : isExpenseTx ? "-" : ""}
              {formatCurrency(Math.abs(tx.amount), currency)}
            </p>
          </div>

          <div className="mt-1 flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500 truncate">
              {tx.description ? tx.description : dayjs(tx.date).format("HH:mm")}
            </p>
            <p className="text-xs font-semibold text-slate-400 shrink-0">{dayjs(tx.date).format("DD/MM")}</p>
          </div>
        </div>
      </button>
    );
  };

  const FilterBar = ({ title }) => (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <IconPill tone="slate" className="h-10 w-10 rounded-2xl">
            <Calendar size={18} />
          </IconPill>
          <div>
            <p className="font-extrabold text-slate-900">{title}</p>
            <p className="text-sm text-slate-500">{dateRangeLabel}</p>
          </div>
        </div>

        <div className="w-full sm:w-auto">
          <div className="w-full sm:w-auto">
            <DateRangePicker value={dateRange} onChange={setDateRange} />
          </div>
        </div>
      </div>
    </Card>
  );

  const tabItems = [
    {
      key: "info",
      label: t("walletDetail.tabs.info"),
      children: (
        <div className="space-y-4 sm:space-y-6">
          <Card className="p-4 sm:p-6">
            <div className="flex items-start gap-4 sm:gap-5">
              <div
                className={cn(
                  "h-14 w-14 sm:h-16 sm:w-16 rounded-2xl flex items-center justify-center shrink-0",
                  isBank ? "bg-sky-50 text-sky-600" : "bg-emerald-50 text-emerald-600"
                )}
              >
                {isBank ? <Building2 size={26} /> : <Wallet size={26} />}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 truncate">{wallet.name}</h2>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <SoftBadge tone={isBank ? "blue" : "emerald"}>
                        {isBank ? t("walletDetail.labels.bank") : t("walletDetail.labels.cash")}
                      </SoftBadge>
                      {wallet.is_default ? <SoftBadge tone="emerald">{t("walletDetail.badges.default")}</SoftBadge> : null}
                      {wallet.is_archived ? <SoftBadge tone="amber">{t("walletDetail.badges.archived")}</SoftBadge> : null}
                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                      {t("walletDetail.labels.updatedAt")}:{" "}
                      <span className="font-semibold">{formatDate(wallet.updatedAt || wallet.createdAt)}</span>
                    </p>
                  </div>

                  <div className="hidden sm:flex items-center gap-2">
                    <PrimaryButton onClick={handleEdit} className="px-3 py-2 rounded-xl">
                      <Edit size={16} /> {t("walletDetail.actions.editShort")}
                    </PrimaryButton>

                    <Dropdown
                      menu={{
                        items: actionItems.map((it) => ({
                          key: it.key,
                          label: it.label,
                          onClick: it.onClick,
                        })),
                      }}
                      trigger={["click"]}
                      placement="bottomRight"
                    >
                      <SecondaryButton className="px-3 py-2 rounded-xl" type="button">
                        <MoreVertical size={16} />
                      </SecondaryButton>
                    </Dropdown>
                  </div>
                </div>

                <div className="mt-4 sm:mt-5">
                  <p className="text-xs font-semibold text-slate-500">{t("walletDetail.labels.balance")}</p>
                  <p className="mt-1 text-3xl sm:text-4xl font-black text-emerald-600 tracking-tight">
                    {formatCurrency(wallet.balance || 0, wallet.currency)}
                  </p>
                </div>

                {isBank ? (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-3">
                      <p className="text-xs font-semibold text-slate-500">{t("walletDetail.bank.bankName")}</p>
                      <p className="mt-1 font-bold text-slate-900 truncate">{wallet.bankName || "—"}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-3">
                      <p className="text-xs font-semibold text-slate-500">{t("walletDetail.bank.bankAccount")}</p>
                      <p className="mt-1 font-bold text-slate-900">{maskAccount(wallet.bankAccount) || "—"}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-3">
                      <p className="text-xs font-semibold text-slate-500">{t("walletDetail.bank.bankCode")}</p>
                      <p className="mt-1 font-bold text-slate-900 truncate">{wallet.bankCode || "—"}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="sm:hidden mt-5 grid grid-cols-2 gap-3">
              <PrimaryButton onClick={handleEdit} className="w-full">
                <Edit size={18} /> {t("walletDetail.actions.edit")}
              </PrimaryButton>
              <SecondaryButton onClick={() => setActionsOpen(true)} className="w-full" type="button">
                <MoreVertical size={18} /> {t("walletDetail.actions.more")}
              </SecondaryButton>
            </div>
          </Card>
        </div>
      ),
    },

    {
      key: "transactions",
      label: t("walletDetail.tabs.transactions"),
      children: (
        <div className="space-y-4 sm:space-y-6">
          <FilterBar title={t("walletDetail.filters.txTitle")} />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <SummaryCard
              title={t("walletDetail.summary.income")}
              value={formatCurrency(stats.income, currency)}
              tone="text-emerald-600"
              icon={<TrendingUp size={18} />}
            />
            <SummaryCard
              title={t("walletDetail.summary.expense")}
              value={formatCurrency(stats.expense, currency)}
              tone="text-rose-600"
              icon={<TrendingDown size={18} />}
            />
            <SummaryCard
              title={t("walletDetail.summary.net")}
              value={`${netChange >= 0 ? "+" : "-"}${formatCurrency(Math.abs(netChange), currency)}`}
              tone={netChange >= 0 ? "text-emerald-600" : "text-rose-600"}
              icon={netChange >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            />
            <SummaryCard
              title={t("walletDetail.summary.balance")}
              value={formatCurrency(wallet.balance || 0, currency)}
              tone="text-sky-600"
              icon={<Wallet size={18} />}
            />
          </div>

          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <p className="text-base font-extrabold text-slate-900">{t("walletDetail.txList.title")}</p>
                <p className="text-sm text-slate-500">{t("walletDetail.txList.subtitle")}</p>
              </div>
              <SoftBadge tone="slate">{t("walletDetail.txList.count", { n: transactions.length })}</SoftBadge>
            </div>

            {transactions.length > 0 ? (
              <div className="space-y-5">
                {txGroups.map((g) => (
                  <div key={g.dayKey}>
                    <div className="sticky top-0 z-[1] -mx-4 sm:-mx-5 px-4 sm:px-5 py-2 bg-white/90 backdrop-blur border-b border-slate-200/50">
                      <p className="text-xs font-extrabold text-slate-600">{g.label}</p>
                    </div>

                    <div className="mt-3 space-y-2.5">
                      {g.items.map((tx) => (
                        <TxRow key={tx.id} tx={tx} />
                      ))}
                    </div>
                  </div>
                ))}

                <div className="pt-4">
                  {hasMore ? (
                    <SecondaryButton
                      className="w-full"
                      disabled={loadingMore}
                      onClick={() => loadTransactions({ nextPage: page + 1, append: true })}
                      type="button"
                    >
                      {loadingMore ? t("walletDetail.actions.loadingMore") : t("walletDetail.actions.loadMore")}
                    </SecondaryButton>
                  ) : (
                    <p className="text-center text-xs text-slate-500">{t("walletDetail.endOfList")}</p>
                  )}
                </div>
              </div>
            ) : (
              <EmptyState title={t("walletDetail.empty.tx.title")} hint={t("walletDetail.empty.tx.hint")} />
            )}
          </Card>
        </div>
      ),
    },

    {
      key: "statistics",
      label: t("walletDetail.tabs.statistics"),
      children: (
        <div className="space-y-4 sm:space-y-6">
          <FilterBar title={t("walletDetail.filters.statsTitle")} />

          {statsData.line.length === 0 ? (
            <Card>
              <EmptyState title={t("walletDetail.empty.stats.title")} hint={t("walletDetail.empty.stats.hint")} />
            </Card>
          ) : (
            <>
              <Card className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                  <div>
                    <p className="text-base font-extrabold text-slate-900">{t("walletDetail.charts.cumulative.title")}</p>
                    <p className="text-sm text-slate-500">{t("walletDetail.charts.cumulative.subtitle")}</p>
                  </div>

                  <div className="text-sm text-slate-500">
                    {t("walletDetail.charts.cumulative.total")}:{" "}
                    <span
                      className={cn(
                        "font-extrabold",
                        statsData.line.at(-1).cumulative >= 0 ? "text-emerald-600" : "text-rose-600"
                      )}
                    >
                      {statsData.line.at(-1).cumulative >= 0 ? "+" : "-"}
                      {formatCurrency(Math.abs(statsData.line.at(-1).cumulative), currency)}
                    </span>
                  </div>
                </div>

                <div className="h-64 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={statsData.line}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                      <Tooltip
                        formatter={(value, name) => {
                          if (name === "cumulative") return [formatCurrency(value, currency), t("walletDetail.legend.cumulative")];
                          return [formatCurrency(value, currency), name];
                        }}
                        labelFormatter={(label, payload) => {
                          const key = payload?.[0]?.payload?.dayKey;
                          return key ? dayjs(key).format("DD/MM/YYYY") : label;
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="cumulative"
                        name={t("walletDetail.legend.cumulative")}
                        stroke="#10B981"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-4 sm:p-5">
                <div className="mb-4">
                  <p className="text-base font-extrabold text-slate-900">{t("walletDetail.charts.inout.title")}</p>
                  <p className="text-sm text-slate-500">{t("walletDetail.charts.inout.subtitle")}</p>
                </div>

                <div className="h-64 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statsData.line}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                      <Tooltip
                        formatter={(value, name) => [formatCurrency(value, currency), name]}
                        labelFormatter={(label, payload) => {
                          const key = payload?.[0]?.payload?.dayKey;
                          return key ? dayjs(key).format("DD/MM/YYYY") : label;
                        }}
                      />
                      <Legend />
                      <Bar dataKey="income" name={t("walletDetail.legend.income")} fill="#10B981" radius={[10, 10, 0, 0]} />
                      <Bar dataKey="expense" name={t("walletDetail.legend.expense")} fill="#F43F5E" radius={[10, 10, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                  <div>
                    <p className="text-base font-extrabold text-slate-900">{t("walletDetail.charts.pie.title")}</p>
                    <p className="text-sm text-slate-500">{t("walletDetail.charts.pie.subtitle")}</p>
                  </div>
                  <div className="text-sm text-slate-500">
                    {t("walletDetail.charts.pie.totalExpense")}:{" "}
                    <span className="font-extrabold text-rose-600">{formatCurrency(stats.expense, currency)}</span>
                  </div>
                </div>

                {statsData.pie.length === 0 ? (
                  <EmptyState title={t("walletDetail.empty.pie.title")} hint={t("walletDetail.empty.pie.hint")} />
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-center">
                    <div className="h-72 sm:h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Tooltip formatter={(value, name) => [formatCurrency(value, currency), name]} />
                          <Legend />
                          <Pie
                            data={statsData.pie}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={70}
                            outerRadius={115}
                            paddingAngle={2}
                          >
                            {statsData.pie.map((_, idx) => (
                              <Cell
                                key={idx}
                                fill={[
                                  "#10B981",
                                  "#34D399",
                                  "#6EE7B7",
                                  "#A7F3D0",
                                  "#F43F5E",
                                  "#FB7185",
                                  "#60A5FA",
                                  "#A78BFA",
                                  "#F59E0B"
                                ][idx % 9]}
                              />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-3">
                      {statsData.pie.slice(0, 8).map((c) => {
                        const pct = stats.expense > 0 ? (c.value / stats.expense) * 100 : 0;
                        return (
                          <div key={c.name} className="rounded-2xl border border-slate-200/70 bg-slate-50 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-extrabold text-slate-900 truncate">{c.name}</p>
                                <p className="text-sm text-slate-500">{formatCurrency(c.value, currency)}</p>
                              </div>
                              <SoftBadge tone="red">{Math.round(pct)}%</SoftBadge>
                            </div>

                            <div className="mt-2 h-2 rounded-full bg-white border border-slate-200/70 overflow-hidden">
                              <div className="h-full bg-rose-500" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => navigate("/wallets")}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-3 py-2",
                "text-slate-600 hover:text-slate-900 hover:bg-white",
                "border border-transparent hover:border-slate-200/70 transition"
              )}
              type="button"
            >
              <ArrowLeft size={18} />
              <span className="text-sm font-semibold">{t("walletDetail.actions.back")}</span>
            </button>

            <div className="min-w-0 text-center">
              <p className="text-sm font-extrabold text-slate-900 truncate">{wallet.name}</p>
              <p className="text-xs text-slate-500 truncate">
                {isBank ? t("walletDetail.labels.bankWallet") : t("walletDetail.labels.cashWallet")}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:block">
                <Dropdown
                  menu={{
                    items: actionItems.map((it) => ({
                      key: it.key,
                      label: it.label,
                      onClick: it.onClick,
                    })),
                  }}
                  trigger={["click"]}
                  placement="bottomRight"
                >
                  <button
                    className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                    type="button"
                    aria-label="Actions"
                  >
                    <MoreVertical size={18} />
                  </button>
                </Dropdown>
              </div>

              <button
                className="sm:hidden inline-flex items-center justify-center h-10 w-10 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                type="button"
                onClick={() => setActionsOpen(true)}
                aria-label="Actions"
              >
                <MoreVertical size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <Card className="p-0 overflow-hidden">
          <div className="px-3 sm:px-4 pt-3 sm:pt-4">
            <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} size="large" />
          </div>
        </Card>
      </div>

      <WalletModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        wallet={wallet}
        onSuccess={() => {
          loadWallet();
          setModalOpen(false);
        }}
      />

      <Modal
        open={actionsOpen}
        onCancel={() => setActionsOpen(false)}
        footer={null}
        title={t("walletDetail.mobileActions.title")}
        centered
      >
        <div className="space-y-2">
          <PrimaryButton
            className="w-full"
            onClick={() => {
              setActionsOpen(false);
              setModalOpen(true);
            }}
          >
            <Edit size={18} /> {t("walletDetail.actions.edit")}
          </PrimaryButton>

          {!wallet.is_default ? (
            <SecondaryButton
              className="w-full"
              onClick={async () => {
                setActionsOpen(false);
                await handleSetDefault();
              }}
            >
              <Star size={18} /> {t("walletDetail.actions.setDefault")}
            </SecondaryButton>
          ) : null}

          {!wallet.is_archived ? (
            <SecondaryButton
              className="w-full"
              onClick={async () => {
                setActionsOpen(false);
                await handleArchive();
              }}
            >
              <Archive size={18} /> {t("walletDetail.actions.archive")}
            </SecondaryButton>
          ) : (
            <SecondaryButton
              className="w-full"
              onClick={async () => {
                setActionsOpen(false);
                await handleUnarchive();
              }}
            >
              <Archive size={18} /> {t("walletDetail.actions.unarchive")}
            </SecondaryButton>
          )}

          {!wallet.is_default ? (
            <DangerButton
              className="w-full"
              onClick={() => {
                setActionsOpen(false);
                handleDelete();
              }}
            >
              <Trash2 size={18} /> {t("walletDetail.actions.delete")}
            </DangerButton>
          ) : (
            <div className="text-xs text-slate-500 pt-1">{t("walletDetail.mobileActions.cannotDeleteDefault")}</div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default WalletDetail;
