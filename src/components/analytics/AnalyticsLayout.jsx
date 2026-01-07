import { Link, useLocation, Outlet } from "react-router-dom";
import { Activity, LineChart, Sparkles, Menu as MenuIcon, X } from "lucide-react";
import { useState } from "react";

const AnalyticsLayout = () => {
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const closeMobileMenu = () => setMobileMenuOpen(false);

    const isActive = (path) => {
        if (path === "/analytics") {
            return location.pathname === "/analytics";
        }
        return location.pathname.startsWith(path);
    };

    const navItems = [
        { path: "/analytics", label: "Phân tích Nguyên nhân", icon: Activity },
        { path: "/analytics/predictive", label: "Dự đoán Tài chính", icon: LineChart },
        { path: "/analytics/prescriptive", label: "Khuyến nghị Hành động", icon: Sparkles },
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
                    <h2 className="text-lg font-bold text-gray-800">Phân tích</h2>
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
                        <h3 className="font-bold text-gray-900">Menu Phân tích</h3>
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
    );
};

export default AnalyticsLayout;

