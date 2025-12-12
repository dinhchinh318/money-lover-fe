import { Link, useLocation, Outlet } from "react-router-dom";

const AnalyticsLayout = () => {
    const location = useLocation();

    const isActive = (path) => {
        if (path === "/analytics") {
            return location.pathname === "/analytics";
        }
        return location.pathname.startsWith(path);
    };

    const navItems = [
        { path: "/analytics", label: "Dashboard" },
        { path: "/analytics/diagnostic", label: "Phân tích Nguyên nhân" },
        { path: "/analytics/predictive", label: "Dự đoán Tài chính" },
        { path: "/analytics/prescriptive", label: "Khuyến nghị Hành động" },
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
                            className={`block px-4 py-3 rounded-lg font-medium transition-all ${
                                isActive(item.path)
                                    ? "bg-[#10B981] text-white shadow-sm font-semibold"
                                    : "text-gray-600 hover:bg-gray-100"
                            }`}
                        >
                            {item.label}
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

