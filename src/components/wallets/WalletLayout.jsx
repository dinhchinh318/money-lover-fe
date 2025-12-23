import { Link, useLocation, Outlet } from "react-router-dom";

const WalletLayout = () => {
    const location = useLocation();

    const isActive = (path) => {
        if (path === "/wallets") {
            return location.pathname === "/wallets";
        }
        return location.pathname.startsWith(path);
    };

    return (
        <div className="min-h-screen bg-[#F9FAFB]" style={{ minHeight: 'calc(100vh - 64px - 200px)' }}>
            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <Outlet />
            </div>
        </div>
    );
};

export default WalletLayout;



