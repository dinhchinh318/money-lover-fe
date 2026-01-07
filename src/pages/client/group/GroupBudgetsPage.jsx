import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  budgetProgressApi,
  createGroupBudgetApi,
  disableGroupBudgetApi,
  listGroupBudgetsApi,
  listGroupCategoriesApi,
} from "../../../services/api.group";
import { formatMoney } from "../../../utils/format";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/35" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="text-base font-semibold text-slate-900">{title}</div>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Đóng
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

function ProgressBar({ percent }) {
  const p = Math.max(0, Math.min(100, Number(percent) || 0));
  return (
    <div className="mt-3">
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-slate-900" style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}

export default function GroupBudgetsPage() {
  const { groupId } = useParams();
  const [rows, setRows] = useState([]);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openAdd, setOpenAdd] = useState(false);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [progressById, setProgressById] = useState({});

  const [openDisable, setOpenDisable] = useState(false);
  const [disablingBudget, setDisablingBudget] = useState(null);
  const [disabling, setDisabling] = useState(false);

  async function load() {
    setLoading(true);
    const [bRes, cRes] = await Promise.all([listGroupBudgetsApi(groupId), listGroupCategoriesApi(groupId)]);
    const budgets = bRes?.data || bRes || [];
    setRows(budgets);

    const allCats = cRes?.data || cRes || [];
    setCats(allCats.filter((c) => c.type === "expense"));

    const next = {};
    for (const b of budgets) {
      const id = b._id || b.id;
      if (!id) continue;
      next[id] = { loading: true, data: null, error: null };
    }
    setProgressById(next);

    setLoading(false);

    await Promise.all(
      budgets.map(async (b) => {
        const id = b._id || b.id;
        if (!id) return;
        try {
          const res = await budgetProgressApi(groupId, id);
          const data = res?.data || res;
          setProgressById((prev) => ({
            ...prev,
            [id]: { loading: false, data, error: null },
          }));
        } catch (e) {
          setProgressById((prev) => ({
            ...prev,
            [id]: { loading: false, data: null, error: e },
          }));
        }
      })
    );
  }

  useEffect(() => {
    load();
    setOpenAdd(false);
    setOpenDisable(false);
    setDisablingBudget(null);
  }, [groupId]);

  const canCreate = useMemo(() => {
    const a = Number(amount);
    if (!name.trim()) return false;
    if (!Number.isFinite(a) || a <= 0) return false;
    if (!categoryId) return false;
    if (!startDate || !endDate) return false;
    return new Date(startDate) <= new Date(endDate);
  }, [name, amount, categoryId, startDate, endDate]);

  function resetForm() {
    setName("");
    setAmount("");
    setCategoryId("");
    setStartDate("");
    setEndDate("");
  }

  function openAddModal() {
    resetForm();
    setOpenAdd(true);
  }

  async function onCreate(e) {
    e.preventDefault();
    if (!canCreate) return;

    await createGroupBudgetApi(groupId, {
      name: name.trim(),
      limitAmount: Number(amount),
      categoryId,
      startDate,
      endDate,
    });

    setOpenAdd(false);
    resetForm();
    load();
  }

  function openDisableModal(budget) {
    setDisablingBudget(budget);
    setOpenDisable(true);
  }

  function closeDisableModal() {
    if (disabling) return;
    setOpenDisable(false);
    setDisablingBudget(null);
  }

  async function confirmDisable() {
    if (!groupId || !disablingBudget) return;

    setDisabling(true);
    try {
      const id = disablingBudget._id || disablingBudget.id;
      await disableGroupBudgetApi(groupId, id);

      setOpenDisable(false);
      setDisablingBudget(null);
      await load();
    } finally {
      setDisabling(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Ngân sách</h3>

          <button
            onClick={openAddModal}
            className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            + Thêm ngân sách
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-slate-600">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-slate-600">Không có ngân sách nào.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {rows.map((b) => {
              const id = b._id || b.id;
              const prog = id ? progressById[id] : null;

              const limit = Number(b.limitAmount ?? b.amount ?? prog?.data?.budget?.limitAmount ?? 0) || 0;
              const spent = Number(prog?.data?.spent ?? 0) || 0;
              const percent =
                typeof prog?.data?.percent === "number"
                  ? prog.data.percent
                  : limit > 0
                  ? (spent / limit) * 100
                  : 0;

              return (
                <div key={id} className="py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900">{b.name}</div>
                      <div className="mt-0.5 text-sm text-slate-600">
                        <p>Số tiền giới hạn: {formatMoney(limit)} VND</p>
                        Danh mục: {b.categoryName || "—"}
                      </div>
                      <div className="mt-0.5 text-sm text-slate-600">
                        Từ ngày: {b.startDate} → Đến ngày: {b.endDate}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => openDisableModal(b)}
                        className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>

                  {/* Progress section */}
                  <div className="mt-2">
                    {prog?.loading ? (
                      <div className="text-xs text-slate-500">Loading progress...</div>
                    ) : prog?.error ? (
                      <div className="text-xs text-rose-600">Không thể tải tiến độ.</div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between text-xs text-slate-600">
                          <div>
                            Đã tiêu: <b className="text-slate-900">{formatMoney(spent)}</b>{" "}
                            <span className="text-slate-400">/</span> <b className="text-slate-900">{formatMoney(limit)}</b>
                          </div>
                          <div className="font-semibold text-slate-900">{Math.round(percent)}%</div>
                        </div>
                        <ProgressBar percent={percent} />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL ADD */}
      <Modal
        open={openAdd}
        title="Thêm ngân sách"
        onClose={() => {
          setOpenAdd(false);
        }}
      >
        <form onSubmit={onCreate} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Tên ngân sách</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none"
              placeholder="VD: Ngân sách ăn uống tháng này"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Số tiền giới hạn</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none"
              min={1}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Danh mục</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none"
            >
              <option value="">-- Chọn danh mục --</option>
              {cats.map((c) => (
                <option key={c._id || c.id} value={c._id || c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Ngày bắt đầu</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Ngày kết thúc</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!canCreate}
            className={cn(
              "w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition",
              canCreate ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-slate-200 text-slate-500"
            )}
          >
            Tạo
          </button>
        </form>
      </Modal>

      <Modal open={openDisable} title="Xóa ngân sách" onClose={closeDisableModal}>
        <div className="space-y-4">
          <div className="text-sm text-slate-700">Bạn có chắc chắn xóa ngân sách này?</div>

          {disablingBudget ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <div className="font-semibold text-slate-900">{disablingBudget.name}</div>
              <div className="mt-0.5 text-slate-600">
                <p>
                  Số tiền giới hạn:{" "}
                  {formatMoney(
                    Number(disablingBudget.limitAmount ?? disablingBudget.amount ?? 0) || 0
                  )} VND {" "}
                </p>
                Danh mục: {disablingBudget.categoryName || "—"}
              </div>
              <div className="mt-0.5 text-slate-600">
                Từ ngày: {disablingBudget.startDate} → Đến ngày: {disablingBudget.endDate}
              </div>
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={confirmDisable}
              disabled={disabling}
              className={cn(
                "rounded-xl px-4 py-2.5 text-sm font-semibold transition",
                disabling ? "bg-rose-200 text-rose-500" : "bg-rose-600 text-white hover:bg-rose-700"
              )}
            >
              {disabling ? "Đang xóa..." : "Xác nhận xóa"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
