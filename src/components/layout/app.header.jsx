import { Link, useNavigate, useLocation } from "react-router-dom";
import { User, LogOut, Wallet, Menu as MenuIcon, X, Home, TrendingUp, BarChart3, FileText, Settings, UserCircle, Bell, Folder, PiggyBank, CalendarClock, PieChart } from "lucide-react";
import { useState } from "react";
import { Dropdown, message, Avatar, Badge } from "antd";
import { useCurrentApp } from "../context/app.context";
import { fetchAccountAPI, logoutAPI } from "../../services/api.user";

const AppHeader = () => {
  const { setIsAuthenticated, isAuthenticated, user, setUser } = useCurrentApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
    const res = await logoutAPI();
    if (res.error === 0) {
        message.success("Đăng xuất thành công!");
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("accessToken");
        navigate("/login");
      }
    } catch (error) {
      message.error("Đăng xuất thất bại!");
    }
  };

  const navLinks = [
    { key: "home", label: "Home", path: "/", icon: Home },
    { key: "transactions", label: "Transactions", path: "/transactions", icon: Wallet },
    { key: "wallets", label: "Wallets", path: "/wallets", icon: Wallet },
    { key: "categories", label: "Categories", path: "/categories", icon: Folder },
    { key: "budgets", label: "Budgets", path: "/budgets", icon: PieChart },
    { key: "recurring-bills", label: "Recurring Bills", path: "/recurring-bills", icon: CalendarClock },
    { key: "saving-goals", label: "Saving Goals", path: "/saving-goals", icon: PiggyBank },
    { key: "reports", label: "Reports", path: "/reports", icon: FileText },
    { key: "analytics", label: "Analytics", path: "/analytics", icon: TrendingUp },
  ];

  const accountMenuItems = [
    ...(!isAuthenticated
      ? [
          {
            key: "signin",
            label: (
              <Link to="/login" className="flex items-center gap-3 px-4 py-3 hover:bg-green-50 rounded-xl transition-all group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <User size={18} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Đăng nhập</p>
                  <p className="text-xs text-gray-500">Truy cập tài khoản của bạn</p>
                </div>
              </Link>
            ),
          },
          {
            key: "signup",
            label: (
              <Link to="/register" className="flex items-center gap-3 px-4 py-3 hover:bg-purple-50 rounded-xl transition-all group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserCircle size={18} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Đăng ký</p>
                  <p className="text-xs text-gray-500">Tạo tài khoản mới</p>
                </div>
              </Link>
            ),
          },
        ]
      : [
          {
            key: "profile-header",
            label: (
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <Avatar
                    size={48}
                    className="border-2 border-green-500 shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: "#fff",
                      fontWeight: "bold",
                    }}
                  >
                    {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {user?.name || "Người dùng"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                </div>
              </div>
            ),
          },
          {
            key: "profile",
            label: (
              <Link to="/profile" className="flex items-center gap-3 px-4 py-3 hover:bg-green-50 rounded-xl transition-all group">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-500 group-hover:scale-110 transition-all">
                  <UserCircle size={18} className="text-green-600 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Hồ sơ của tôi</p>
                  <p className="text-xs text-gray-500">Xem và chỉnh sửa thông tin</p>
                </div>
              </Link>
            ),
          },
          {
            key: "settings",
            label: (
              <Link to="/settings" className="flex items-center gap-3 px-4 py-3 hover:bg-purple-50 rounded-xl transition-all group">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-500 group-hover:scale-110 transition-all">
                  <Settings size={18} className="text-purple-600 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Cài đặt</p>
                  <p className="text-xs text-gray-500">Tùy chỉnh ứng dụng</p>
                </div>
              </Link>
            ),
          },
          {
            key: "divider",
            type: "divider",
          },
          {
            key: "logout",
            label: (
              <div 
                onClick={handleLogout} 
                className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 rounded-xl transition-all group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center group-hover:bg-red-500 group-hover:scale-110 transition-all">
                  <LogOut size={18} className="text-red-600 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="font-medium text-red-600 group-hover:text-red-700">Đăng xuất</p>
                  <p className="text-xs text-gray-500">Thoát khỏi tài khoản</p>
                </div>
              </div>
            ),
          },
        ]),
  ];

  return (
    <header className="sticky top-0 z-[1000] bg-white/95 backdrop-blur-md border-b border-gray-200/60 shadow-lg shadow-gray-100/50">
      <div className="mx-auto w-full max-w-[1360px] px-3 sm:px-6 lg:px-7">
        <div className="flex h-16 md:h-20 items-center gap-3 md:gap-4 w-full">
          {/* Logo với animation - luôn bám trái */}
          <div className="flex-shrink-0">
            <Link
              to="/"
              className="flex items-center gap-3 group transition-all duration-300 hover:scale-105"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl blur-md opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <div className="relative w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Wallet className="text-white w-5 h-5" />
                </div>
              </div>
              <div>
                <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent tracking-tight">
                  MoneyLover
                </span>
                <p className="text-xs text-gray-500 hidden sm:block">Quản lý tài chính thông minh</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation - bám giữa nhờ flex-1 */}
          <nav className="hidden lg:flex items-center gap-2 flex-1 justify-center">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                location.pathname === link.path ||
                (link.path === "/" && location.pathname === "/") ||
                (link.path === "/reports" && location.pathname.startsWith("/reports")) ||
                (link.path === "/analytics" && location.pathname.startsWith("/analytics"));
              return (
                <Link
                  key={link.key}
                  to={link.path}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 font-medium text-sm group ${
                    isActive
                      ? 'text-green-600 bg-gradient-to-r from-green-50 to-emerald-50 shadow-sm'
                      : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'
                  }`}
                >
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></span>
                  )}
                  <Icon size={18} className={isActive ? 'text-green-600' : 'text-gray-500 group-hover:text-green-600'} />
                  <span className={isActive ? 'font-semibold' : ''}>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Account Section - Góc trên bên phải */}
          <div className="flex items-center gap-3">
            {/* Notification Bell (nếu đã đăng nhập) */}
            {isAuthenticated && (
              <button className="relative p-2 rounded-xl text-gray-600 hover:text-green-600 hover:bg-gray-100 transition-all duration-300">
                <Badge count={3} size="small" offset={[-2, 2]}>
                  <Bell size={20} />
                </Badge>
              </button>
            )}

            {/* Account Dropdown */}
            <Dropdown
              menu={{ items: accountMenuItems }}
              placement="bottomRight"
              trigger={["click"]}
              overlayClassName="account-dropdown-modern"
              overlayStyle={{ 
                borderRadius: '16px', 
                padding: '12px',
                minWidth: '280px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
            >
              <div className="cursor-pointer">
                {isAuthenticated && user ? (
                  <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full blur-md opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                    <div className="relative flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-all duration-300 border border-green-200/50 shadow-sm hover:shadow-md">
                      <Avatar
                        size={36}
                        className="border-2 border-green-500 shadow-md"
                        style={{
                          background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                          color: "#fff",
                          fontWeight: "bold",
                        }}
                      >
                        {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                      </Avatar>
                      <div className="hidden md:block">
                        <p className="text-sm font-semibold text-gray-900 leading-tight">
                          {user.name || "Người dùng"}
                        </p>
                        <p className="text-xs text-gray-500 leading-tight">
                          {user.email?.split('@')[0] || "Tài khoản"}
                        </p>
                      </div>
                      <div className="hidden md:block">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-md hover:shadow-lg">
                    <User className="text-white" size={18} />
                    <span className="text-white font-medium text-sm hidden sm:inline">Đăng nhập</span>
                  </div>
                )}
              </div>
            </Dropdown>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-green-600 transition-all duration-300"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden pb-4 pt-4 border-t border-gray-200 animate-fade-in">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path || (link.path === "/" && location.pathname === "/");
                return (
                  <Link
                    key={link.key}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                      isActive
                        ? 'text-green-600 bg-gradient-to-r from-green-50 to-emerald-50 shadow-sm'
                        : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={20} className={isActive ? 'text-green-600' : 'text-gray-500'} />
                    <span className={isActive ? 'font-semibold' : ''}>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
