import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  createGroupTxApi,
  listGroupCategoriesApi,
  listGroupTxApi,
  listGroupWalletsApi,
  removeGroupTxApi,
  updateGroupTxApi,
} from "../../../services/api.group";
import { formatDate, formatMoney } from "../../../utils/format";
import { useForm } from "react-hook-form";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/35" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="text-base font-semibold text-slate-900">{title}</div>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

function todayYmd() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toIsoFromYmd(ymd) {
  return new Date(ymd).toISOString();
}

export default function GroupTransactionsPage() {
  const { groupId } = useParams();

  const [rows, setRows] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const [openForm, setOpenForm] = useState(false);
  const [mode, setMode] = useState("create");
  const [editingTx, setEditingTx] = useState(null);
  const [saving, setSaving] = useState(false);

  const [openDelete, setOpenDelete] = useState(false);
  const [deletingTx, setDeletingTx] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = useForm({
    mode: "onChange",
    defaultValues: {
      type: "expense",
      occurredAt: todayYmd(),
      amount: "",
      walletId: "",
      categoryId: "",
      note: "",
      fromWalletId: "",
      toWalletId: "",
    },
  });

  const watchType = watch("type");
  const canSubmit = isValid && !saving && !isSubmitting;

  const catOptions = useMemo(() => {
    if (watchType === "transfer") return [];
    return cats.filter((c) => c.type === watchType);
  }, [cats, watchType]);

  async function load(opts = {}) {
    if (!groupId) return;
    setLoading(true);
    try {
      const finalFrom = opts.from ?? from;
      const finalTo = opts.to ?? to;
      const finalTypeFilter = opts.typeFilter ?? typeFilter;

      const query = {
        from: finalFrom || undefined,
        to: finalTo || undefined,
        type: finalTypeFilter !== "all" ? finalTypeFilter : undefined,
      };

      const [txRes, wRes, cRes] = await Promise.all([
        listGroupTxApi(groupId, query),
        listGroupWalletsApi(groupId),
        listGroupCategoriesApi(groupId),
      ]);

      setRows(txRes?.data || txRes || []);
      setWallets(wRes?.data || wRes || []);
      setCats(cRes?.data || cRes || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [groupId]);

  async function onApplyFilter() {
    await load({ from, to, typeFilter });
  }

  function openCreateModal() {
    setMode("create");
    setEditingTx(null);
    reset({
      type: "expense",
      occurredAt: todayYmd(),
      amount: "",
      walletId: "",
      categoryId: "",
      note: "",
      fromWalletId: "",
      toWalletId: "",
    });
    setOpenForm(true);
  }

  function openEditModal(tx) {
    const id = tx._id || tx.id;
    if (!id) return;

    setMode("edit");
    setEditingTx(tx);

    const isTransfer = tx.type === "transfer";
    const rawDate = tx.occurredAt || tx.date || tx.createdAt;

    reset({
      type: tx.type || "expense",
      occurredAt: rawDate ? String(rawDate).slice(0, 10) : todayYmd(),
      amount: tx.amount ?? "",
      walletId: isTransfer ? "" : tx.walletId?._id || tx.walletId || tx.wallet?._id || "",
      categoryId: isTransfer ? "" : tx.categoryId?._id || tx.categoryId || tx.category?._id || "",
      note: tx.note || "",
      fromWalletId: isTransfer ? tx.fromWalletId?._id || tx.fromWalletId || "" : "",
      toWalletId: isTransfer ? tx.toWalletId?._id || tx.toWalletId || "" : "",
    });

    setOpenForm(true);
  }

  function closeModal() {
    if (saving || isSubmitting) return;
    setOpenForm(false);
    setEditingTx(null);
  }

  function openDeleteModal(tx) {
    setDeletingTx(tx);
    setOpenDelete(true);
  }

  function closeDeleteModal() {
    if (deleting) return;
    setOpenDelete(false);
    setDeletingTx(null);
  }

  async function confirmDelete() {
    if (!groupId || !deletingTx) return;

    setDeleting(true);
    try {
      const id = deletingTx._id || deletingTx.id;
      await removeGroupTxApi(groupId, id);

      setOpenDelete(false);
      setDeletingTx(null);
      await load();
    } finally {
      setDeleting(false);
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    if (!groupId) return;

    setSaving(true);
    try {
      const type = values.type;
      const amount = Number(values.amount);

      const payloadBase = {
        type,
        amount,
        note: values.note?.trim() || undefined,
        occurredAt: toIsoFromYmd(values.occurredAt),
      };

      let payload;

      if (type === "transfer") {
        payload = {
          ...payloadBase,
          fromWalletId: values.fromWalletId,
          toWalletId: values.toWalletId,
          walletId: undefined,
          categoryId: undefined,
        };
      } else {
        payload = {
          ...payloadBase,
          walletId: values.walletId,
          categoryId: values.categoryId,
          fromWalletId: undefined,
          toWalletId: undefined,
        };
      }

      if (mode === "create") {
        await createGroupTxApi(groupId, payload);
      } else {
        const id = editingTx?._id || editingTx?.id;
        await updateGroupTxApi(groupId, id, payload);
      }

      setOpenForm(false);
      setEditingTx(null);
      await load();
    } finally {
      setSaving(false);
    }
  });

  useEffect(() => {
    if (watchType === "transfer") {
      setValue("walletId", "");
      setValue("categoryId", "");
    } else {
      setValue("fromWalletId", "");
      setValue("toWalletId", "");
    }
  }, [watchType, setValue]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">Từ ngày</div>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
            />
          </div>

          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">Đến ngày</div>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
            />
          </div>

          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">Loại</div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
            >
              <option value="all">Tất cả</option>
              <option value="expense">Chi tiêu</option>
              <option value="income">Thu nhập</option>
            </select>
          </div>

          <button
            onClick={onApplyFilter}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Áp dụng
          </button>
        </div>
      </div>

      {/* List */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Giao dịch</h3>
          <button
            onClick={openCreateModal}
            className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            + Thêm giao dịch
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-slate-600">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-slate-600">Không có giao dịch nào.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {rows.map((tx) => (
              <div key={tx._id || tx.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <div className="font-semibold text-slate-900">
                    {tx.type == "expense" ? "Chi tiêu" : tx.type == "income" ? "Thu nhập" : "Chuyển khoản"}
                    {" "}
                    {tx.type == "income" ? "+" : "-"}
                    {formatMoney(tx.amount) } {tx.currency || "VND"}
                  </div>
                  <div className="text-sm text-slate-600">
                    <p>{"Ngày: "}{formatDate(tx.occurredAt || tx.date || tx.createdAt)}</p>
                    Ví:{" "}{tx.wallet?.name || tx.walletName || tx.walletId?.name || "—"} • Danh mục:{" "}
                    {tx.category?.name ||
                      tx.categoryName ||
                      tx.categoryId?.name ||
                      (tx.type === "transfer" ? "—" : "—")}
                  </div>
                  {tx.note ? <div className="text-sm text-slate-600">Ghi chú: {tx.note}</div> : null}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(tx)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={() => openDeleteModal(tx)}
                    className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal (Create/Edit) */}
      <Modal open={openForm} title={mode === "edit" ? "Chỉnh sửa giao dịch" : "Thêm giao dịch"} onClose={closeModal}>
        <form onSubmit={onSubmit} className="space-y-3">
          {/* Type */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Loại</label>
            <select
              {...register("type", { required: true })}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none"
              disabled={saving}
            >
              <option value="expense">Chi tiêu</option>
              <option value="income">Thu nhập</option>
              <option value="transfer">Chuyển khoản</option>
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Ngày</label>
            <input
              type="date"
              {...register("occurredAt", { required: "Date is required" })}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none"
              disabled={saving}
            />
            {errors.occurredAt ? (
              <div className="mt-1 text-xs text-rose-600">{String(errors.occurredAt.message)}</div>
            ) : null}
          </div>

          {/* Amount */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Số tiền</label>
            <input
              type="number"
              {...register("amount", {
                required: "Vui lòng nhập số tiền",
                validate: (v) => (Number(v) > 0 ? true : "Số tiền phải lớn hơn 0"),
              })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
              min={1}
              disabled={saving}
            />
            {errors.amount ? <div className="mt-1 text-xs text-rose-600">{String(errors.amount.message)}</div> : null}
          </div>

          {/* Wallet / Category OR Transfer wallets */}
          {watchType === "transfer" ? (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Từ ví</label>
                <select
                  {...register("fromWalletId", { required: "Vui lòng chọn ví" })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none"
                  disabled={saving}
                >
                  <option value="">-- Chọn ví --</option>
                  {wallets.map((w) => (
                    <option key={w._id || w.id} value={w._id || w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
                {errors.fromWalletId ? (
                  <div className="mt-1 text-xs text-rose-600">{String(errors.fromWalletId.message)}</div>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Đến ví</label>
                <select
                  {...register("toWalletId", {
                    required: "Vui lòng chọn ví",
                    validate: (v) => (v && v !== watch("fromWalletId") ? true : "Ví chuyển đến phải khác ví hiện tại"),
                  })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none"
                  disabled={saving}
                >
                  <option value="">-- Chọn ví --</option>
                  {wallets.map((w) => (
                    <option key={w._id || w.id} value={w._id || w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
                {errors.toWalletId ? (
                  <div className="mt-1 text-xs text-rose-600">{String(errors.toWalletId.message)}</div>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Ví</label>
                <select
                  {...register("walletId", { required: "Vui lòng chọn ví" })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none"
                  disabled={saving}
                >
                  <option value="">-- Chọn ví --</option>
                  {wallets.map((w) => (
                    <option key={w._id || w.id} value={w._id || w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
                {errors.walletId ? (
                  <div className="mt-1 text-xs text-rose-600">{String(errors.walletId.message)}</div>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Danh mục</label>
                <select
                  {...register("categoryId", { required: "Vui lòng chọn danh mục" })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none"
                  disabled={saving}
                >
                  <option value="">-- Chọn danh mục --</option>
                  {catOptions.map((c) => (
                    <option key={c._id || c.id} value={c._id || c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId ? (
                  <div className="mt-1 text-xs text-rose-600">{String(errors.categoryId.message)}</div>
                ) : null}
              </div>
            </>
          )}

          {/* Note */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Ghi chú</label>
            <input
              {...register("note")}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
              placeholder="Optional"
              disabled={saving}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              disabled={saving}
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={cn(
                "rounded-xl px-4 py-2.5 text-sm font-semibold transition",
                canSubmit ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-slate-200 text-slate-500"
              )}
            >
              {saving ? (mode === "edit" ? "Đang lưu..." : "Đang tạo...") : mode === "edit" ? "Lưu" : "Tạo"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={openDelete} title="Xóa giao dịch" onClose={closeDeleteModal}>
        <div className="space-y-4">
          <div className="text-sm text-slate-700">Bạn có chắc chắn xóa giao dịch này?</div>

          {deletingTx ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <div className="font-semibold text-slate-900">
                {deletingTx.type == "expense" ? "Chi tiêu" : deletingTx.type == "income" ? "Thu nhập" : "Chuyển khoản"}
                {deletingTx.type == "income" ? " +" : " -"}
                {formatMoney(deletingTx.amount)}{" "}
                {deletingTx.currency || "VND"}
              </div>
              <div className="text-sm text-slate-600">
                    <p>{"Ngày: "}{formatDate(deletingTx.occurredAt || deletingTx.date || deletingTx.createdAt)}</p>
                    Ví:{" "}{deletingTx.wallet?.name || deletingTx.walletName || deletingTx.walletId?.name || "—"} • Danh mục:{" "}
                    {deletingTx.category?.name ||
                      deletingTx.categoryName ||
                      deletingTx.categoryId?.name ||
                      (deletingTx.type === "transfer" ? "—" : "—")}
                  </div>
              {deletingTx.note ? <div className="mt-1 text-slate-600">Note: {deletingTx.note}</div> : null}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeDeleteModal}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              disabled={deleting}
            >
              Đóng
            </button>

            <button
              type="button"
              onClick={confirmDelete}
              disabled={deleting}
              className={cn(
                "rounded-xl px-4 py-2.5 text-sm font-semibold transition",
                deleting ? "bg-rose-200 text-rose-500" : "bg-rose-600 text-white hover:bg-rose-700"
              )}
            >
              {deleting ? "Đang xóa..." : "Xác nhận"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
