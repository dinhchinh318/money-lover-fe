import { useEffect, useState } from "react";
import { acceptInviteApi, declineInviteApi, myInvitesApi } from "../../../services/api.group";
import { useInvites } from "./context/InvitesContext";

export default function MyInvitesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const { refreshInvitesCount } = useInvites();

  async function load() {
    setLoading(true);
    const res = await myInvitesApi();
    setRows(res?.data || res || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function act(token, type) {
    const fn = type === "accept" ? acceptInviteApi : declineInviteApi;
    const res = await fn(token);
    if (res?.error) return alert(res.error || res.message || "Action failed");
    await load();
    await refreshInvitesCount();
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 py-3">
        <div className="text-sm font-semibold text-slate-900">Lời mời của tôi</div>
      </div>

      {loading ? (
        <div className="px-4 py-8 text-center text-sm text-slate-600">Loading...</div>
      ) : rows?.length ? (
        <ul className="divide-y divide-slate-100">
          {rows.map((x) => (
            <li key={x._id || x.id || x.token} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
              <div>
                <div className="font-semibold text-slate-900">{x.groupId?.name || "Group"}</div>
                <div className="text-xs text-slate-500">
                  Mời bởi: {x.inviterId?.name || "Người Dùng"}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => act(x.token, "decline")}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Từ chối
                </button>
                <button
                  onClick={() => act(x.token, "accept")}
                  className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Chấp nhận
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="px-4 py-10 text-center text-sm text-slate-600">Không có lời mời.</div>
      )}
    </div>
  );
}
