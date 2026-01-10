import { NavLink, Outlet } from "react-router-dom";
import { useInvites } from "./context/InvitesContext";

function cn(...xs) { return xs.filter(Boolean).join(" "); }

function InviteBadge({ count }) {
  if (!count || count <= 0) return null;

  const text = count > 99 ? "99+" : String(count);

  return (
    <span className="absolute -top-1 -right-1 inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold leading-none text-white shadow ring-2 ring-white">
      {text}
    </span>
  );
}

export default function GroupsLayout() {
  const invitesCount = useInvites();

  const linkBase =
    "inline-flex items-center rounded-xl px-3 py-2 text-sm font-medium transition border";
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Nhóm</h1>
            <p className="text-sm text-slate-600">Quản lý nhóm chi tiêu & cộng tác</p>
          </div>

          <div className="flex gap-2">
            <NavLink
              to="/groups"
              end
              className={({ isActive }) =>
                cn(
                  linkBase,
                  isActive
                    ? "bg-white border-slate-200 text-slate-900 shadow-sm"
                    : "bg-transparent border-transparent text-slate-600 hover:bg-white hover:border-slate-200"
                )
              }
            >
              Nhóm của tôi
            </NavLink>
            <NavLink
              to="/groups/invites"
              className={({ isActive }) =>
                cn(
                  linkBase,
                  isActive
                    ? "relative bg-white border-slate-200 text-slate-900 shadow-sm"
                    : "relative bg-transparent border-transparent text-slate-600 hover:bg-white hover:border-slate-200"
                )
              }
            >
              Lời mời
              <InviteBadge count={invitesCount?.invitesCount} />
            </NavLink>
          </div>
        </div>

        <div className="mt-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
