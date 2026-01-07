import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  groupDetailApi,
  createInviteApi,
  removeMemberApi,
  setMemberRoleApi,
  leaveGroupApi,
} from "../../../services/api.group";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/35" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="text-base font-semibold text-slate-900">{title}</div>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-50"
          >
            ✕
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

function ConfirmModal({ open, title = "Confirm", desc, confirmText = "Confirm", danger, onClose, onConfirm }) {
  if (!open) return null;
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <div className="text-sm text-slate-700">{desc}</div>
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Đóng
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={cn(
            "rounded-xl px-4 py-2.5 text-sm font-semibold text-white",
            danger ? "bg-red-600 hover:bg-red-500" : "bg-slate-900 hover:bg-slate-800"
          )}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}

function RoleBadge({ role }) {
  const map = {
    owner: "bg-amber-50 text-amber-700 border-amber-200",
    admin: "bg-indigo-50 text-indigo-700 border-indigo-200",
    member: "bg-slate-50 text-slate-700 border-slate-200",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold", map[role] || map.member)}>
      {role}
    </span>
  );
}

export default function GroupOverviewPage() {
  const { groupId } = useParams();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);

  // Invite modal
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  // Confirm modal (generic)
  const [confirm, setConfirm] = useState({
    open: false,
    title: "",
    desc: "",
    danger: false,
    confirmText: "Confirm",
    action: null,
  });

  const [inviteLoading, setInviteLoading] = useState(false);

  const myRole = group?.myRole || "member";
  const canManage = myRole === "owner" || myRole === "admin";
  const isOwner = myRole === "owner";

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const res = await groupDetailApi(groupId);
      const payload = res?.data ?? res;

      // payload expected: { group, members }
      setGroup(payload?.group || null);
      setMembers(payload?.members || []);
    } catch (e) {
      setErr(e?.message || "Load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [groupId]);

  const memberCount = useMemo(() => members?.length || 0, [members]);

  function openConfirm(cfg) {
    setConfirm({
      open: true,
      title: cfg.title || "Confirm",
      desc: cfg.desc || "",
      danger: !!cfg.danger,
      confirmText: cfg.confirmText || "Confirm",
      action: cfg.action || null,
    });
  }

  async function runConfirm() {
    const act = confirm.action;
    setConfirm((s) => ({ ...s, open: false }));
    if (!act) return;
    try {
      await act();
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Action failed");
    }
  }

  async function onInviteSubmit(e) {
    e.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;

    setErr("");
    setInviteLoading(true);
    try {
      await createInviteApi(groupId, { email, inviteeEmail: email });
      setInviteOpen(false);
      setInviteEmail("");

      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Invite failed");
    } finally {
      setInviteLoading(false);
    }
  }

  function onKick(member) {
    const userId = member?.userId?._id || member?.userId;
    const name = member?.userId?.name || member?.userId?.email || "this member";

    openConfirm({
      title: "Mời thành viên ra khỏi nhóm",
      desc: `Mời ${name} ra khỏi nhóm?`,
      danger: true,
      confirmText: "Mời ra",
      action: async () => {
        await removeMemberApi(groupId, userId);
      },
    });
  }

  function onSetRole(member, nextRole) {
    const userId = member?.userId?._id || member?.userId;
    const name = member?.userId?.name || member?.userId?.email || "this member";

    const isPromote = nextRole === "admin";
    openConfirm({
      title: isPromote ? "Chọn làm quản trị" : "Xóa quản trị",
      desc: isPromote
        ? `Đặt ${name} làm quản trị?`
        : `Gỡ quyền quản trị của ${name}?`,
      confirmText: isPromote ? "Chọn làm quản trị" : "Xóa quản trị",
      action: async () => {
        await setMemberRoleApi(groupId, userId, nextRole);
      },
    });
  }

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {err ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {/* ABOUT */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-slate-900">Thông tin nhóm</div>
            <RoleBadge role={myRole} />
          </div>

          <div className="mt-2 text-sm text-slate-700">
            <div>
              <span className="text-slate-500">Tên nhóm:</span> {group?.name || "—"}
            </div>
            <div className="mt-1">
              <span className="text-slate-500">Ghi chú:</span> {group?.note || group?.description || "—"}
            </div>
            <div className="mt-1">
              <span className="text-slate-500">Số thành viên:</span> {memberCount}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-slate-900">Thành viên nhóm</div>
            <button
              onClick={() => {
                setInviteEmail("");
                setInviteOpen(true);
              }}
              className="rounded-xl bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              + Mời thành viên
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {members?.length ? (
              members.map((m) => {
                const role = m.role || "member";
                const userId = m?.userId?._id || m?.userId;
                const displayName = m?.userId?.name || m?.userId?.email || String(userId || "").slice(-6);
                const email = m?.userId?.email;

                const canKick =
                  canManage && role === "member";
                const canToggleAdmin =
                  isOwner && role !== "owner";

                return (
                  <div key={String(userId)} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3">
                    <div className="min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-slate-900">{displayName}</div>
                        <RoleBadge role={role} />
                      </div>
                      {email ? <div className="text-xs text-slate-500">{email}</div> : null}
                    </div>

                    <div className="flex items-center gap-2">
                      {canToggleAdmin && role === "member" ? (
                        <button
                          onClick={() => onSetRole(m, "admin")}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Chọn làm quản trị
                        </button>
                      ) : null}

                      {canToggleAdmin && role === "admin" ? (
                        <button
                          onClick={() => onSetRole(m, "member")}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Xóa quản trị
                        </button>
                      ) : null}

                      {canKick ? (
                        <button
                          onClick={() => onKick(m)}
                          className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                        >
                          Mời ra
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                Chưa có thành viên.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* INVITE MODAL */}
      <Modal open={inviteOpen} title="Mời bằng email" onClose={() => setInviteOpen(false)}>
        <form onSubmit={onInviteSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              type="email"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
              placeholder="user@email.com"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setInviteOpen(false)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={inviteLoading}
              className={cn(
                "rounded-xl px-4 py-2.5 text-sm font-semibold text-white",
                inviteLoading ? "bg-slate-400 cursor-not-allowed" : "bg-slate-900 hover:bg-slate-800"
              )}
            >
              {inviteLoading ? "Đang gửi..." : "Mời"}
            </button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM MODAL */}
      <ConfirmModal
        open={confirm.open}
        title={confirm.title}
        desc={confirm.desc}
        danger={confirm.danger}
        confirmText={confirm.confirmText}
        onClose={() => setConfirm((s) => ({ ...s, open: false }))}
        onConfirm={runConfirm}
      />
    </div>
  );
}
