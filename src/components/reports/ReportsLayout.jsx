import { Link, useLocation, Outlet } from "react-router-dom";
import { Home, Clock3, List, Wallet } from "lucide-react";

const ReportsLayout = () => {
    const location = useLocation();

    const isActive = (path) => {
        if (path === "/reports") {
            return location.pathname === "/reports";
        }
        return location.pathname.startsWith(path);
    };

    const navItems = [
        { path: "/reports", label: "Tổng quan", icon: Home },
        { path: "/reports/time", label: "Báo cáo theo thời gian", icon: Clock3 },
        { path: "/reports/category", label: "Báo cáo theo danh mục", icon: List },
        { path: "/reports/wallet", label: "Báo cáo theo ví", icon: Wallet },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar Navigation */}
            <aside className="w-64 bg-white border-r border-gray-200 shadow-sm flex-shrink-0">
                <div className="p-4 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-all text-sm ${
                                isActive(item.path)
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
            <div className="flex-1 overflow-auto">
                <Outlet />
            </div>
        </div>
    );
};

export default ReportsLayout;

