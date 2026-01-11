import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  createGroupApi,
  deleteGroupApi,
  myGroupsApi,
  updateGroupApi,
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

export default function GroupsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [err, setErr] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteErr, setDeleteErr] = useState("");
  const [confirmText, setConfirmText] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    const res = await myGroupsApi();
    if (res?.error) setErr(res.error || res.message || "Load failed");
    else setRows(res?.data || res || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const total = useMemo(() => rows?.length || 0, [rows]);

  function openCreate() {
    setName("");
    setDescription("");
    setCreateOpen(true);
  }

  function openEdit(g) {
    setEdit(g);
    setName(g?.name || "");
    setDescription(g?.description || "");
  }

  function openDelete(g) {
    setDeleteErr("");
    setConfirmText("");
    setDeleteTarget(g);
  }

  function closeDelete() {
    if (deleteLoading) return;
    setDeleteTarget(null);
    setDeleteErr("");
    setConfirmText("");
  }

  async function onCreate(e) {
    e.preventDefault();
    setErr("");
    const res = await createGroupApi({ name, description });
    if (res?.error) return setErr(res.error || res.message || "Create failed");
    setCreateOpen(false);
    await load();
  }

  async function onUpdate(e) {
    e.preventDefault();
    if (!edit?._id && !edit?.id) return;
    const id = edit._id || edit.id;
    setErr("");
    const res = await updateGroupApi(id, { name, description });
    if (res?.error) return setErr(res.error || res.message || "Update failed");
    setEdit(null);
    await load();
  }

  async function onDeleteSubmit(e) {
    e.preventDefault();
    const g = deleteTarget;
    const id = g?._id || g?.id;
    if (!id) return;

    const mustType = (g?.name || "").trim();
    if (mustType && confirmText.trim() !== mustType) {
      return setDeleteErr(`Hãy nhập đúng tên nhóm: "${mustType}" để xác nhận xoá.`);
    }

    setDeleteLoading(true);
    setDeleteErr("");

    const res = await deleteGroupApi(id);
    if (res?.error) {
      setDeleteErr(res.error || res.message || "Delete failed");
      setDeleteLoading(false);
      return;
    }

    setDeleteLoading(false);
    closeDelete();
    await load();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-600">
          Total: <span className="font-semibold text-slate-900">{total}</span>
        </div>
        <button
          onClick={openCreate}
          className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          + Tạo nhóm
        </button>
      </div>

      {err ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="text-sm font-semibold text-slate-900">Nhóm của tôi</div>
        </div>

        {loading ? (
          <div className="px-4 py-8 text-center text-sm text-slate-600">Loading...</div>
        ) : rows?.length ? (
          <ul className="divide-y divide-slate-100">
            {rows.map((g) => {
              const id = g._id || g.id;
              return (
                <li key={id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
                  <div className="min-w-[240px]">
                    <div className="font-semibold text-slate-900">{g.name}</div>
                    <div className="text-xs text-slate-500">{g.description}</div>
                    <div className="text-xs text-slate-500">
                      Số thành viên: {g.memberCount ?? g.membersCount ?? "—"}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/groups/${id}`}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Chi tiết
                    </Link>
                    <button
                      onClick={() => openEdit(g)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Chỉnh sửa
                    </button>
                    <button
                      onClick={() => openDelete(g)}
                      className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      Xóa
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="px-4 py-10 text-center">
            <div className="text-sm font-semibold text-slate-900">Chưa có nhóm nào</div>
            <div className="mt-1 text-sm text-slate-600">Tạo nhóm để bắt đầu ghi chép chi tiêu chung.</div>
            <button
              onClick={openCreate}
              className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              + Tạo nhóm
            </button>
          </div>
        )}
      </div>

      <Modal open={createOpen} title="Create group" onClose={() => setCreateOpen(false)}>
        <form onSubmit={onCreate} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Tên nhóm</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
              placeholder="Ví dụ: Gia đình / Team dự án"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[96px] w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
              placeholder="Tuỳ chọn"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setCreateOpen(false)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Đóng
            </button>
            <button type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
              Tạo
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT */}
      <Modal open={!!edit} title="Edit group" onClose={() => setEdit(null)}>
        <form onSubmit={onUpdate} className="space-y-3">
          {/* ... giữ nguyên ... */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Tên nhóm</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[96px] w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setEdit(null)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Đóng
            </button>
            <button type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
              Lưu
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteTarget} title="Delete group" onClose={closeDelete}>
        <form onSubmit={onDeleteSubmit} className="space-y-3">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Bạn sắp xoá nhóm "<b>{deleteTarget?.name}</b>". Hành động này không thể hoàn tác.
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Nhập đúng tên nhóm để xác nhận
            </label>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
              placeholder={deleteTarget?.name || ""}
              disabled={deleteLoading}
            />
            {deleteErr ? (
              <div className="mt-2 text-sm text-red-600">{deleteErr}</div>
            ) : null}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeDelete}
              disabled={deleteLoading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={deleteLoading}
              className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
