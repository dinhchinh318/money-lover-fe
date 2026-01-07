import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  createGroupWalletApi,
  disableGroupWalletApi,
  listGroupWalletsApi,
  updateGroupWalletApi,
} from "../../../services/api.group";

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

export default function GroupWalletsPage() {
  const { groupId } = useParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [balance, setBalance] = useState(0);
  const [displayBalance, setDisplayBalance] = useState("");

  const [disableOpen, setDisableOpen] = useState(false);
  const [disabling, setDisabling] = useState(null);
  const [disableLoading, setDisableLoading] = useState(false);

  function formatVND(value) {
    if (value === null || value === undefined) return "";
    return new Intl.NumberFormat("en-US").format(value);
  }

  async function load() {
    setLoading(true);
    const res = await listGroupWalletsApi(groupId);
    setRows(res?.data || res || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [groupId]);

  function openCreate() {
    setEditing(null);
    setName("");
    setBalance(0);
    setDisplayBalance(formatVND(0));
    setOpen(true);
  }

  function openEdit(w) {
    const b = Number(w?.balance || 0);
    setEditing(w);
    setName(w?.name || "");
    setBalance(b);
    setDisplayBalance(formatVND(b));
    setOpen(true);
  }

  async function submit(e) {
    e.preventDefault();
    const payload = { name, balance: Number(balance || 0) };

    let res;
    if (editing) res = await updateGroupWalletApi(groupId, editing._id || editing.id, payload);
    else res = await createGroupWalletApi(groupId, payload);

    if (res?.error) return alert(res.error || res.message || "Save failed");
    setOpen(false);
    await load();
  }

  function openDisable(w) {
    setDisabling(w);
    setDisableOpen(true);
  }

  async function submitDisable(e) {
    e.preventDefault();
    if (!disabling) return;

    setDisableLoading(true);
    const res = await disableGroupWalletApi(groupId, disabling._id || disabling.id);
    setDisableLoading(false);

    if (res?.error) return alert(res.error || res.message || "Disable failed");

    setDisableOpen(false);
    setDisabling(null);
    await load();
  }

  function closeDisable() {
    if (disableLoading) return;
    setDisableOpen(false);
    setDisabling(null);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="text-sm font-semibold text-slate-900">Ví</div>
        <button
          onClick={openCreate}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          + Thêm ví
        </button>
      </div>

      {loading ? (
        <div className="px-4 py-8 text-center text-sm text-slate-600">Loading...</div>
      ) : rows?.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Tên ví</th>
                <th className="px-4 py-3 font-semibold">Tiền tệ</th>
                <th className="px-4 py-3 font-semibold">Số tiền</th>
                <th className="px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((w) => (
                <tr key={w._id || w.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{w.name}</td>
                  <td className="px-4 py-3 text-slate-700">{w.currency || "VND"}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {typeof w.balance === "number" ? w.balance.toLocaleString() : w.balance ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => openEdit(w)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Chỉnh sửa
                      </button>

                      <button
                        onClick={() => openDisable(w)}
                        className="rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-4 py-10 text-center text-sm text-slate-600">
          Chưa có ví. Hãy tạo ví đầu tiên.
        </div>
      )}

      {/* Create/Edit modal */}
      <Modal open={open} title={editing ? "Chỉnh sửa ví" : "Tạo ví"} onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Tên ví</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Số tiền</label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={displayBalance}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^\d]/g, "");
                  const num = raw ? Number(raw) : 0;
                  setBalance(num);
                  setDisplayBalance(formatVND(num));
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 pr-14 text-sm outline-none focus:border-slate-400"
                placeholder="0"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
                VND
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Đóng
            </button>
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Lưu
            </button>
          </div>
        </form>
      </Modal>

      {/* Disable confirm modal (submit form) */}
      <Modal open={disableOpen} title="Disable wallet" onClose={closeDisable}>
        <form onSubmit={submitDisable} className="space-y-4">
          <div className="text-sm text-slate-700">
            Bạn chắc chắn muốn xóa ví{" "}
            <span className="font-semibold text-slate-900">"{disabling?.name}"</span>?
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={closeDisable}
              disabled={disableLoading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={disableLoading}
              className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {disableLoading ? "Disabling..." : "Disable"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
