import { useMemo, useState, useEffect } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { Home, Clock3, List, Wallet, Menu, X, BarChart3 } from "lucide-react";

export default function ReportsLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => {
    if (path === "/reports") return location.pathname === "/reports";
    return location.pathname.startsWith(path);
  };

  const navItems = useMemo(
    () => [
      { path: "/reports", label: "Tổng quan", icon: Home },
      { path: "/reports/time", label: "Báo cáo theo thời gian", icon: Clock3 },
      { path: "/reports/category", label: "Báo cáo theo danh mục", icon: List },
      { path: "/reports/wallet", label: "Báo cáo theo ví", icon: Wallet },
    ],
    []
  );

  // Khi route đổi trên mobile, tự đóng sidebar
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // ESC để đóng drawer
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    if (mobileOpen) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  const SidebarContent = ({ onNavigate }) => (
    <div className="p-4 space-y-2">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          onClick={onNavigate}
          className={[
            "flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-all text-sm",
            isActive(item.path)
              ? "bg-[#E8F8EF] text-[#0EA25E] border border-[#C4F1DC] shadow-sm"
              : "text-gray-600 hover:bg-gray-100",
          ].join(" ")}
        >
          <item.icon
            size={18}
            className={isActive(item.path) ? "text-[#0EA25E]" : "text-gray-500"}
          />
          <span>{item.label}</span>
        </Link>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ===== Desktop Sidebar ===== */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 shadow-sm flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* ===== Mobile: Hamburger Button (LEFT + MIDDLE) ===== */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className={[
          "md:hidden fixed z-50 mt-2",
          "left-4 top-1/5",
          "inline-flex items-center justify-center w-11 h-11 rounded-xl",
          "bg-white border border-gray-200 shadow-sm",
          "hover:bg-gray-50 active:bg-gray-100",
        ].join(" ")}
        aria-label="Mở menu báo cáo"
      >
        <Menu size={20} className="text-gray-700" />
      </button>

      {/* ===== Mobile Off-canvas Sidebar + Overlay ===== */}
      {/* Overlay */}
      <div
        className={[
          "md:hidden fixed inset-0 z-40 bg-black/40 transition-opacity",
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        ].join(" ")}
        onClick={() => setMobileOpen(false)}
      />

      {/* Drawer */}
      <aside
        className={[
          "md:hidden fixed top-0 left-0 z-50 h-full w-72 bg-white",
          "border-r border-gray-200 shadow-xl transform transition-transform",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-label="Menu báo cáo"
      >
        <div className="h-14 px-3 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-2 font-semibold text-gray-800">
            <BarChart3 size={18} className="text-gray-700" />
            <span>Báo cáo</span>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 active:bg-gray-200"
            aria-label="Đóng menu"
          >
            <X size={20} className="text-gray-700" />
          </button>
        </div>

        <SidebarContent onNavigate={() => setMobileOpen(false)} />
      </aside>

      {/* ===== Main Content ===== */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
