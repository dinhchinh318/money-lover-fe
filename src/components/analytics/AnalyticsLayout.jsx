import { Link, useLocation, Outlet } from "react-router-dom";
import { Activity, LineChart, Sparkles } from "lucide-react";

const AnalyticsLayout = () => {
    const location = useLocation();

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
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar Navigation */}
            <aside className="w-64 bg-white border-r border-gray-200 shadow-sm flex-shrink-0">
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
            <div className="flex-1 overflow-auto">
                <Outlet />
            </div>
        </div>
    );
};

export default AnalyticsLayout;

