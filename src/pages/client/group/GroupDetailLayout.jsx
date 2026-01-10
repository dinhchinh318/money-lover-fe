import { useEffect, useState } from "react";
import { NavLink, Outlet, useParams } from "react-router-dom";
import { groupDetailApi, leaveGroupApi } from "../../../services/api.group";

function cn(...xs) { return xs.filter(Boolean).join(" "); }

export default function GroupDetailLayout() {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [err, setErr] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);

  const myRole = group?.myRole || "member";
  const canLeave = myRole !== "owner";

  useEffect(() => {
    (async () => {
      setErr("");
      const res = await groupDetailApi(groupId);
      if (res?.error) setErr(res.error || res.message || "Load failed");
      else {
        const payload = res?.data ?? res;
        setGroup(payload?.group || res);
      }
    })();
  }, [groupId]);

  async function onConfirmLeave() {
    try {
      const res = await leaveGroupApi(groupId);
      if (res?.error) {
        alert(res.error || res.message || "Leave failed");
        return;
      }
      window.location.href = "/groups";
    } catch (e) {
      alert(e?.message || "Leave failed");
    }
  }

  const tabBase =
    "inline-flex items-center rounded-xl px-3 py-2 text-sm font-medium transition border";
  const tabs = [
    { to: `/groups/${groupId}`, end: true, label: "Tổng quan" },
    { to: `/groups/${groupId}/wallets`, label: "Ví" },
    { to: `/groups/${groupId}/categories`, label: "Danh mục" },
    { to: `/groups/${groupId}/transactions`, label: "Giao dịch" },
    { to: `/groups/${groupId}/budgets`, label: "Ngân sách" },
    { to: `/groups/${groupId}/reports`, label: "Báo cáo" },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Nhóm
            </div>
            <div className="mt-1 text-xl font-semibold text-slate-900">
              {group?.name || "—"}
            </div>
          </div>

          {canLeave && (
            <button
              onClick={() => setConfirmOpen(true)}
              className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              Rời nhóm
            </button>
          )}
        </div>

        {err ? (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                cn(
                  tabBase,
                  isActive
                    ? "bg-slate-900 border-slate-900 text-white"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                )
              }
            >
              {t.label}
            </NavLink>
          ))}
        </div>
      </div>

      <Outlet />
      <ConfirmModal
        open={confirmOpen}
        title="Leave group"
        desc="Bạn chắc chắn muốn rời khỏi nhóm này?"
        confirmText="Leave"
        danger
        onClose={() => setConfirmOpen(false)}
        onConfirm={onConfirmLeave}
      />

    </div>
  );
}

function ConfirmModal({
  open,
  title = "Confirm",
  desc,
  confirmText = "Confirm",
  danger,
  onClose,
  onConfirm,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/35" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="text-base font-semibold text-slate-900">{title}</div>
        </div>
        <div className="px-5 py-4">
          <div className="text-sm text-slate-700">{desc}</div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={cn(
                "rounded-xl px-4 py-2.5 text-sm font-semibold text-white",
                danger
                  ? "bg-red-600 hover:bg-red-500"
                  : "bg-slate-900 hover:bg-slate-800"
              )}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
