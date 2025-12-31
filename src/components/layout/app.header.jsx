import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  LogOut,
  Wallet,
  Menu as MenuIcon,
  X,
  Home,
  TrendingUp,
  FileText,
  Settings,
  UserCircle,
  Bell,
  Folder,
  PiggyBank,
  CalendarClock,
  PieChart,
  ChevronDown,
  MoreHorizontal,
  LayoutGrid,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { Dropdown, message, Avatar, Badge } from "antd";
import { useCurrentApp } from "../context/app.context";
import { logoutAPI } from "../../services/api.user";

const AppHeader = () => {
  const { setIsAuthenticated, isAuthenticated, user, setUser, profile, setProfile } = useCurrentApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // ===== Helpers =====
  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const closeMenuAndScrollTop = () => {
    closeMobileMenu();
    scrollToTop();
  };

  const goAndScroll = (path) => {
    navigate(path);
    scrollToTop();
  };

  // ===== Logout =====
  const handleLogout = async () => {
    try {
      const res = await logoutAPI();
      if (res?.error === 0) {
        message.success("Đăng xuất thành công");
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem("accessToken");
        navigate("/login");
        scrollToTop();
      }
    } catch (error) {
      message.error("Lỗi hệ thống");
    }
  };

  // ===== Nav Data =====
  const mainNav = [
    { key: "home", label: "Tổng quan", path: "/", icon: Home },
    { key: "transactions", label: "Giao dịch", path: "/transactions", icon: Wallet },
    { key: "wallets", label: "Ví của tôi", path: "/wallets", icon: Folder },
    { key: "budgets", label: "Ngân sách", path: "/budgets", icon: PieChart },
    { key: "reports", label: "Báo cáo", path: "/reports", icon: FileText },
  ];

  const toolNav = [
    { key: "categories", label: "Danh mục", path: "/categories", icon: LayoutGrid },
    { key: "recurring-bills", label: "Hóa đơn định kỳ", path: "/recurring-bills", icon: CalendarClock },
    { key: "saving-goals", label: "Tiết kiệm", path: "/saving-goals", icon: PiggyBank },
    { key: "analytics", label: "Phân tích", path: "/analytics", icon: TrendingUp },
  ];

  // ===== Dropdown Menus =====
  const moreMenu = {
    items: toolNav.map((item) => ({
      key: item.key,
      label: (
        <Link
          to={item.path}
          onClick={scrollToTop}
          className="flex items-center gap-3 px-1 py-1 font-semibold text-slate-600 hover:text-emerald-600 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
            <item.icon size={16} strokeWidth={2.5} />
          </div>
          <span className="text-sm">{item.label}</span>
        </Link>
      ),
    })),
  };

  const userDropdownItems = [
    {
      key: "header",
      label: (
        <div className="px-2 py-3 min-w-[200px]">
          <div className="flex items-center gap-3">
            <Avatar
              size={44}
              src={profile?.avatar}
              className="border-2 border-emerald-500 bg-emerald-50 text-emerald-600 font-bold"
            >
              {profile?.displayName?.[0]?.toUpperCase()}
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <p className="text-sm font-black text-slate-900 truncate leading-tight">
                {profile?.displayName || "Người dùng"}
              </p>
              <p className="text-[10px] text-slate-400 truncate mt-0.5 uppercase tracking-wider font-bold">
                {user?.email}
              </p>
            </div>
          </div>
        </div>
      ),
    },
    { type: "divider" },
    {
      key: "profile",
      label: (
        <Link
          to="/profile"
          onClick={scrollToTop}
          className="flex items-center gap-3 px-1 py-1.5 font-bold text-slate-600"
        >
          <UserCircle size={18} className="text-slate-400" /> Hồ sơ
        </Link>
      ),
    },
    {
      key: "settings",
      label: (
        <Link
          to="/setting"
          onClick={scrollToTop}
          className="flex items-center gap-3 px-1 py-1.5 font-bold text-slate-600"
        >
          <Settings size={18} className="text-slate-400" /> Cài đặt
        </Link>
      ),
    },
    { type: "divider" },
    {
      key: "logout",
      label: (
        <div
          onClick={handleLogout}
          className="flex items-center gap-3 px-1 py-1.5 font-bold text-red-500 transition-colors cursor-pointer"
        >
          <LogOut size={18} /> Đăng xuất
        </div>
      ),
    },
  ];

  // ===== UI =====
  return (
    <>
      <header className="sticky top-0 z-[1000] w-full border-b border-slate-200/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 md:h-20 lg:px-8">
          {/* LEFT: LOGO */}
          <Link
            to="/"
            onClick={scrollToTop}
            className="flex items-center gap-2.5 transition-transform active:scale-95"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-200">
              <Wallet className="text-white" size={24} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black leading-none tracking-tighter text-slate-900 uppercase">
                Money<span className="text-emerald-600">Lover</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-600/70 tracking-[0.2em] uppercase leading-none mt-1">
                Smart Finance
              </span>
            </div>
          </Link>

          {/* CENTER: DESKTOP NAV */}
          <nav className="hidden lg:flex items-center gap-1 rounded-2xl bg-slate-100/60 p-1.5 border border-slate-200/40">
            {mainNav.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <Link
                  key={item.key}
                  to={item.path}
                  onClick={scrollToTop}
                  className={[
                    "flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-black transition-all duration-200",
                    isActive
                      ? "bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200/50"
                      : "text-slate-500 hover:text-emerald-600 hover:bg-white/40",
                  ].join(" ")}
                >
                  <Icon size={16} strokeWidth={isActive ? 3 : 2} />
                  {item.label}
                </Link>
              );
            })}

            <div className="mx-1 h-5 w-px bg-slate-300/50" />

            <Dropdown
              menu={moreMenu}
              trigger={["hover"]}
              placement="bottomRight"
              overlayClassName="custom-nav-dropdown"
            >
              <button className="flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-black text-slate-500 hover:text-emerald-600 transition-colors outline-none">
                <MoreHorizontal size={18} />
                Thêm
              </button>
            </Dropdown>
          </nav>

          {/* RIGHT: ACTIONS */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Quick Add Button */}
            {isAuthenticated && (
              <button
                onClick={() => goAndScroll("/transactions")}
                className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all active:scale-90 border border-emerald-100 group"
                title="Thêm giao dịch"
              >
                <Plus size={20} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
              </button>
            )}

            {/* Notification */}
            {isAuthenticated && (
              <button
                // onClick={scrollToTop}
                onClick={() => goAndScroll("/notification")}
                className="relative p-2 text-slate-400 hover:text-emerald-600 transition-colors"
                title="Thông báo"
              >
                <Badge dot color="#10b981" offset={[-2, 2]}>
                  <Bell size={22} />
                </Badge>
              </button>
            )}

            {/* User Dropdown */}
            {isAuthenticated ? (
              <Dropdown
                menu={{ items: userDropdownItems }}
                trigger={["click"]}
                placement="bottomRight"
                overlayClassName="custom-user-dropdown"
              >
                <button className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 pr-3 transition-all hover:border-emerald-200 hover:shadow-md outline-none">
                  <Avatar src={profile?.avatar} className="bg-emerald-500 shadow-sm border border-white" size={32}>
                    {profile?.displayName?.[0]}
                  </Avatar>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>
              </Dropdown>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  onClick={scrollToTop}
                  className="hidden sm:block text-sm font-bold text-slate-600 px-4 py-2"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  onClick={scrollToTop}
                  className="text-sm font-bold bg-emerald-600 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all"
                >
                  Bắt đầu
                </Link>
              </div>
            )}

            {/* Mobile Toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-50 text-slate-600 active:scale-95 transition-transform"
              aria-label="Open menu"
            >
              <MenuIcon size={26} />
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER */}
      <div className={`fixed inset-0 z-[1100] transition-all duration-300 ${mobileMenuOpen ? "visible" : "invisible"}`}>
        <div
          className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${
            mobileMenuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={closeMobileMenu}
        />

        <div
          className={[
            "absolute right-0 top-0 h-full w-full max-w-[20rem] bg-white shadow-2xl",
            "transition-transform duration-500 ease-out flex flex-col",
            mobileMenuOpen ? "translate-x-0" : "translate-x-full",
          ].join(" ")}
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                <Wallet size={16} className="text-white" strokeWidth={3} />
              </div>
              <span className="font-black text-slate-900 uppercase tracking-tighter">MoneyLover</span>
            </div>

            <button onClick={closeMobileMenu} className="p-2 rounded-full bg-slate-100 text-slate-400" aria-label="Close menu">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div>
              <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Menu chính</p>
              <div className="grid gap-1">
                {mainNav.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.key}
                      to={item.path}
                      onClick={closeMenuAndScrollTop}   // ✅ đóng menu + scroll top
                      className={[
                        "flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all",
                        isActive ? "bg-emerald-50 text-emerald-600" : "text-slate-600 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                      <span className="text-[15px]">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Công cụ bổ sung</p>
              <div className="grid gap-1">
                {toolNav.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.key}
                      to={item.path}
                      onClick={closeMenuAndScrollTop} // ✅ đóng menu + scroll top
                      className={[
                        "flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all",
                        isActive ? "bg-emerald-50 text-emerald-600" : "text-slate-600 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <Icon size={20} />
                      <span className="text-[15px]">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50">
            {isAuthenticated ? (
              <button
                onClick={() => {
                  closeMobileMenu();
                  handleLogout();
                }}
                className="flex w-full items-center justify-center gap-2 py-4 rounded-2xl bg-white border border-red-100 text-red-500 font-bold shadow-sm active:scale-[0.98] transition-all"
              >
                <LogOut size={18} /> Thoát ứng dụng
              </button>
            ) : (
              <Link
                to="/login"
                onClick={closeMenuAndScrollTop}
                className="flex w-full items-center justify-center py-4 rounded-2xl bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-100"
              >
                Đăng nhập ngay
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Antd dropdown style */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .custom-nav-dropdown .ant-dropdown-menu,
            .custom-user-dropdown .ant-dropdown-menu {
              padding: 8px !important;
              border-radius: 20px !important;
              border: 1px solid rgba(241, 245, 249, 0.8) !important;
              box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1) !important;
              background: rgba(255, 255, 255, 0.98) !important;
              backdrop-filter: blur(8px);
            }
            .ant-dropdown-menu-item {
              border-radius: 12px !important;
              padding: 8px 12px !important;
            }
            .ant-dropdown-menu-item:hover {
              background-color: #f0fdf4 !important;
            }
          `,
        }}
      />
    </>
  );
};

export default AppHeader;
