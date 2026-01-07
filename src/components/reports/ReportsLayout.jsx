import { useMemo, useState, useEffect } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { Home, Clock3, List, Wallet, Menu as MenuIcon, X } from "lucide-react";
import { useForm } from "react-hook-form";


const ReportsLayout = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

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

  // Khi route đổi trên mobile -> đóng drawer
  useEffect(() => {
    if (mobileMenuOpen) setMobileMenuOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // ESC để đóng drawer
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };

    if (mobileMenuOpen) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileMenuOpen]);

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
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* ===== Desktop Sidebar ===== */}
      <aside className="hidden lg:flex lg:w-64 bg-white border-r border-gray-200 shadow-sm flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* ===== Main Content ===== */}
      <div className="flex-1 overflow-auto w-full flex flex-col">
        {/* Mobile top bar */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
          <h2 className="text-lg font-bold text-gray-800">Báo cáo</h2>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 active:scale-95 transition-transform"
            aria-label="Mở menu"
          >
            <MenuIcon size={24} />
          </button>
        </div>

        <Outlet />
      </div>

      {/* ===== Mobile Drawer ===== */}
      <div
        className={[
          "fixed inset-0 z-[1100] transition-all duration-300 lg:hidden",
          mobileMenuOpen ? "visible" : "invisible",
        ].join(" ")}
      >
        {/* Overlay */}
        <div
          className={[
            "absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
            mobileMenuOpen ? "opacity-100" : "opacity-0",
          ].join(" ")}
          onClick={closeMobileMenu}
        />

        {/* Drawer panel */}
        <aside
          className={[
            "absolute right-0 top-0 h-full w-full max-w-[18rem] bg-white shadow-2xl",
            "transition-transform duration-500 ease-out flex flex-col",
            mobileMenuOpen ? "translate-x-0" : "translate-x-full",
          ].join(" ")}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-bold text-gray-900">Menu Báo cáo</h3>
            <button
              type="button"
              onClick={closeMobileMenu}
              className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              aria-label="Đóng menu"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <SidebarContent onNavigate={closeMobileMenu} />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ReportsLayout;
