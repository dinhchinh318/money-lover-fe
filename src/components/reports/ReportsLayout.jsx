import { useMemo, useState, useEffect } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { Home, Clock3, List, Wallet, Menu as MenuIcon, X } from "lucide-react";
import { useState } from "react";

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

    const navItems = [
        { path: "/reports", label: "Tổng quan", icon: Home },
        { path: "/reports/time", label: "Báo cáo theo thời gian", icon: Clock3 },
        { path: "/reports/category", label: "Báo cáo theo danh mục", icon: List },
        { path: "/reports/wallet", label: "Báo cáo theo ví", icon: Wallet },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
            {/* Sidebar Navigation - Hidden on mobile, shown on desktop */}
            <aside className="hidden lg:block lg:w-64 bg-white border-r border-gray-200 shadow-sm flex-shrink-0">
                <div className="p-4 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-all text-sm ${isActive(item.path)
                                    ? "bg-[#E8F8EF] text-[#0EA25E] border border-[#C4F1DC] shadow-sm"
                                    : "text-gray-600 hover:bg-gray-100"
                                }`}
                        >
                            {item.icon && (
                                <item.icon
                                    size={18}
                                    className={isActive(item.path) ? "text-[#0EA25E]" : "text-gray-500"}
                                />
                            )}
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 overflow-auto w-full flex flex-col">
                {/* Mobile Menu Button */}
                <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
                    <h2 className="text-lg font-bold text-gray-800">Báo cáo</h2>
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 active:scale-95 transition-transform"
                        aria-label="Mở menu"
                    >
                        <MenuIcon size={24} />
                    </button>
                </div>

                <Outlet />
            </div>

            {/* Mobile Drawer Menu */}
            <div className={`fixed inset-0 z-[1100] transition-all duration-300 ${mobileMenuOpen ? "visible" : "invisible"} lg:hidden`}>
                <div
                    className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
                        mobileMenuOpen ? "opacity-100" : "opacity-0"
                    }`}
                    onClick={closeMobileMenu}
                />

                <div
                    className={[
                        "absolute right-0 top-0 h-full w-full max-w-[18rem] bg-white shadow-2xl",
                        "transition-transform duration-500 ease-out flex flex-col",
                        mobileMenuOpen ? "translate-x-0" : "translate-x-full",
                    ].join(" ")}
                >
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <h3 className="font-bold text-gray-900">Menu Báo cáo</h3>
                        <button
                            onClick={closeMobileMenu}
                            className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                            aria-label="Đóng menu"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={closeMobileMenu}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                                    isActive(item.path)
                                        ? "bg-[#E8F8EF] text-[#0EA25E] border border-[#C4F1DC]"
                                        : "text-gray-600 hover:bg-gray-100"
                                }`}
                            >
                                {item.icon && (
                                    <item.icon
                                        size={20}
                                        className={isActive(item.path) ? "text-[#0EA25E]" : "text-gray-500"}
                                    />
                                )}
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
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
