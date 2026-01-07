import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Wallet, Building2, Star, Archive, TrendingUp, AlertTriangle } from "lucide-react";
import { message, Dropdown, Modal } from "antd";
import { getWalletsAPI, deleteWalletAPI, setDefaultWalletAPI, archiveWalletAPI, unarchiveWalletAPI } from "../../../services/api.wallet";
import WalletModal from "../../../components/wallets/WalletModal";

const WalletsIndex = () => {
    const navigate = useNavigate();
    const [wallets, setWallets] = useState([]);
    const [filteredWallets, setFilteredWallets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all"); // all, active, archived
    const [modalOpen, setModalOpen] = useState(false);
    const [editingWallet, setEditingWallet] = useState(null);
    const [summary, setSummary] = useState({
        totalWallets: 0,
        totalBalance: 0,
        cashWallets: 0,
        bankWallets: 0,
    });

    useEffect(() => {
        loadWallets();
    }, []);

    useEffect(() => {
        filterWallets();
        calculateSummary();
    }, [wallets, activeTab]);

    const loadWallets = async () => {
        try {
            setLoading(true);
            const res = await getWalletsAPI();
            if (res.status || res.EC === 0) {
                const walletsData = res.data?.wallets || res.data || [];
                setWallets(Array.isArray(walletsData) ? walletsData : []);
            } else {
                message.error("Không thể tải danh sách ví!");
            }
        } catch (error) {
            message.error("Có lỗi xảy ra khi tải danh sách ví!");
        } finally {
            setLoading(false);
        }
    };

    const filterWallets = () => {
        let filtered = [...wallets];

        if (activeTab === "active") {
            filtered = filtered.filter((wallet) => !wallet.is_archived);
        } else if (activeTab === "archived") {
            filtered = filtered.filter((wallet) => wallet.is_archived);
        }

        setFilteredWallets(filtered);
    };

    const calculateSummary = () => {
        const total = wallets.length;
        const totalBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);
        const cashWallets = wallets.filter((w) => w.type === "cash" && !w.is_archived).length;
        const bankWallets = wallets.filter((w) => w.type === "bank" && !w.is_archived).length;

        setSummary({
            totalWallets: total,
            totalBalance,
            cashWallets,
            bankWallets,
        });
    };

    const formatCurrency = (amount, currency = "VND") => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: currency,
        }).format(amount);
    };

    const handleAddWallet = () => {
        setEditingWallet(null);
        setModalOpen(true);
    };

    const handleEditWallet = (wallet) => {
        setEditingWallet(wallet);
        setModalOpen(true);
    };

    const handleDeleteWallet = (wallet) => {
        Modal.confirm({
            title: "Xác nhận xóa ví",
            content: `Bạn có chắc chắn muốn xóa ví "${wallet.name}"? Hành động này không thể hoàn tác.`,
            okText: "Xóa",
            okType: "danger",
            cancelText: "Hủy",
            onOk: async () => {
                try {
                    const res = await deleteWalletAPI(wallet._id);
                    if (res.status || res.EC === 0) {
                        message.success("Xóa ví thành công!");
                        loadWallets();
                    } else {
                        message.error(res.message || "Xóa ví thất bại!");
                    }
                } catch (error) {
                    message.error("Có lỗi xảy ra!");
                }
            },
        });
    };

    const handleSetDefault = async (wallet) => {
        try {
            const res = await setDefaultWalletAPI(wallet._id);
            if (res.status || res.EC === 0) {
                message.success("Đặt ví mặc định thành công!");
                loadWallets();
            } else {
                message.error(res.message || "Thao tác thất bại!");
            }
        } catch (error) {
            message.error("Có lỗi xảy ra!");
        }
    };

    const handleArchive = async (wallet) => {
        try {
            const res = await archiveWalletAPI(wallet._id);
            if (res.status || res.EC === 0) {
                message.success("Lưu trữ ví thành công!");
                loadWallets();
            } else {
                message.error(res.message || "Thao tác thất bại!");
            }
        } catch (error) {
            message.error("Có lỗi xảy ra!");
        }
    };

    const handleUnarchive = async (wallet) => {
        try {
            const res = await unarchiveWalletAPI(wallet._id);
            if (res.status || res.EC === 0) {
                message.success("Khôi phục ví thành công!");
                loadWallets();
            } else {
                message.error(res.message || "Thao tác thất bại!");
            }
        } catch (error) {
            message.error("Có lỗi xảy ra!");
        }
    };

    const getWalletMenuItems = (wallet) => {
        const items = [
            {
                key: "edit",
                label: "Chỉnh sửa",
                icon: <Edit size={16} />,
                onClick: () => handleEditWallet(wallet),
            },
        ];

        if (!wallet.is_default) {
            items.push({
                key: "setDefault",
                label: "Đặt làm mặc định",
                icon: <Star size={16} />,
                onClick: () => handleSetDefault(wallet),
            });
        }

        items.push({ type: "divider" });

        if (!wallet.is_archived) {
            items.push({
                key: "archive",
                label: "Lưu trữ",
                icon: <Archive size={16} />,
                onClick: () => handleArchive(wallet),
            });
        } else {
            items.push({
                key: "unarchive",
                label: "Khôi phục",
                icon: <Archive size={16} />,
                onClick: () => handleUnarchive(wallet),
            });
        }

        if (!wallet.is_default) {
            items.push({
                key: "delete",
                label: "Xóa",
                icon: <Trash2 size={16} />,
                danger: true,
                onClick: () => handleDeleteWallet(wallet),
            });
        }

        return items;
    };

    const tabs = [
        { key: "all", label: "Tất cả" },
        { key: "active", label: "Đang hoạt động" },
        { key: "archived", label: "Đã lưu trữ" },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50/70 via-white to-white">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header Section - Redesigned */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 bg-clip-text text-transparent">
                            Quản lý Ví
                        </h1>
                        <p className="text-gray-600 mt-1 text-sm">Theo dõi và quản lý tất cả ví của bạn</p>
                    </div>
                    <button
                        onClick={handleAddWallet}
                        className="px-5 py-3 bg-gradient-to-r from-[#10B981] to-emerald-600 text-white font-semibold rounded-xl hover:from-[#059669] hover:to-[#10B981] shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Thêm ví
                    </button>
                </div>

                {/* Summary Cards - Redesigned */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Wallets Card */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 rounded-2xl p-6 border border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300 group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                    <Wallet className="text-white w-7 h-7" />
                                </div>
                            </div>
                            <p className="text-sm font-medium text-gray-600 mb-2">Tổng số ví</p>
                            <p className="text-3xl font-bold text-[#3B82F6] mb-1">
                                {loading ? "..." : summary.totalWallets}
                            </p>
                        </div>
                    </div>

                    {/* Total Balance Card */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 rounded-2xl p-6 border border-green-100 shadow-lg hover:shadow-xl transition-all duration-300 group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                    <TrendingUp className="text-white w-7 h-7" />
                                </div>
                            </div>
                            <p className="text-sm font-medium text-gray-600 mb-2">Tổng số dư</p>
                            <p className="text-3xl font-bold text-[#10B981] mb-1">
                                {loading ? "..." : formatCurrency(summary.totalBalance)}
                            </p>
                        </div>
                    </div>

                    {/* Cash Wallets Card */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 rounded-2xl p-6 border border-orange-100 shadow-lg hover:shadow-xl transition-all duration-300 group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                    <Wallet className="text-white w-7 h-7" />
                                </div>
                            </div>
                            <p className="text-sm font-medium text-gray-600 mb-2">Ví tiền mặt</p>
                            <p className="text-3xl font-bold text-[#F59E0B] mb-1">
                                {loading ? "..." : summary.cashWallets}
                            </p>
                        </div>
                    </div>

                    {/* Bank Wallets Card */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-violet-50 to-purple-100 rounded-2xl p-6 border border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300 group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-violet-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                    <Building2 className="text-white w-7 h-7" />
                                </div>
                            </div>
                            <p className="text-sm font-medium text-gray-600 mb-2">Ví ngân hàng</p>
                            <p className="text-3xl font-bold text-[#8B5CF6] mb-1">
                                {loading ? "..." : summary.bankWallets}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs - Redesigned */}
                <div className="flex gap-2 mb-6 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm inline-flex">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${activeTab === tab.key
                                    ? "bg-gradient-to-r from-[#10B981] to-emerald-600 text-white shadow-md"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Wallets List */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="ds-card ds-skeleton" style={{ height: "200px" }}></div>
                        ))}
                    </div>
                ) : filteredWallets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredWallets.map((wallet) => {
                            const isBank = wallet.type === "bank";
                            const iconColor = isBank ? "#3B82F6" : "#10B981";
                            const gradientFrom = isBank ? "from-blue-400 to-indigo-500" : "from-green-400 to-emerald-500";
                            const bgGradient = isBank ? "from-blue-50 via-indigo-50 to-blue-100" : "from-green-50 via-emerald-50 to-green-100";

                            return (
                                <div
                                    key={wallet._id}
                                    className={`relative bg-white rounded-2xl p-6 cursor-pointer hover:shadow-xl border-2 transition-all duration-300 group ${wallet.is_default
                                            ? "border-[#10B981] shadow-lg"
                                            : "border-gray-200 hover:border-gray-300 shadow-md"
                                        }`}
                                    onClick={() => navigate(`/wallets/${wallet._id}`)}
                                >
                                    {/* Actions Menu */}
                                    <div className="absolute top-4 right-4 z-10" onClick={(e) => e.stopPropagation()}>
                                        <Dropdown
                                            menu={{ items: getWalletMenuItems(wallet) }}
                                            trigger={["click"]}
                                            placement="bottomRight"
                                        >
                                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-110 opacity-0 group-hover:opacity-100">
                                                <svg
                                                    className="w-5 h-5 text-gray-600"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                                                    />
                                                </svg>
                                            </button>
                                        </Dropdown>
                                    </div>

                                    {/* Default Badge */}
                                    {wallet.is_default && (
                                        <div className="absolute top-4 left-4">
                                            <div className="px-2 py-1 bg-gradient-to-r from-[#10B981] to-emerald-600 rounded-md shadow-md">
                                                <Star className="text-white w-4 h-4 fill-white" />
                                            </div>
                                        </div>
                                    )}

                                    {/* Wallet Icon */}
                                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${gradientFrom} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                        {isBank ? (
                                            <Building2 className="text-white w-10 h-10" />
                                        ) : (
                                            <Wallet className="text-white w-10 h-10" />
                                        )}
                                    </div>

                                    {/* Wallet Info */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-bold text-gray-900">{wallet.name}</h3>
                                        </div>

                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span
                                                className={`px-3 py-1 rounded-lg text-xs font-semibold ${isBank
                                                        ? "bg-blue-100 text-blue-700 border border-blue-200"
                                                        : "bg-green-100 text-green-700 border border-green-200"
                                                    }`}
                                            >
                                                {isBank ? "Ngân hàng" : "Tiền mặt"}
                                            </span>
                                            {wallet.is_archived && (
                                                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-semibold border border-orange-200">
                                                    Đã lưu trữ
                                                </span>
                                            )}
                                        </div>

                                        <div className="pt-2">
                                            <p className="text-3xl font-bold text-[#10B981] mb-1">
                                                {formatCurrency(wallet.balance || 0, wallet.currency)}
                                            </p>
                                            {wallet.type === "bank" && wallet.bankName && (
                                                <p className="text-sm text-gray-600 font-medium">
                                                    {wallet.bankName}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-200">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Wallet className="text-gray-400" size={40} />
                        </div>
                        <p className="text-lg font-semibold text-gray-700 mb-2">
                            {activeTab === "archived"
                                ? "Chưa có ví nào được lưu trữ"
                                : activeTab === "active"
                                    ? "Chưa có ví đang hoạt động"
                                    : "Chưa có ví nào"}
                        </p>
                        <p className="text-sm text-gray-500 mb-6">
                            {activeTab === "archived"
                                ? "Các ví đã lưu trữ sẽ hiển thị ở đây"
                                : "Hãy bắt đầu bằng cách thêm ví đầu tiên của bạn"}
                        </p>
                        <button
                            onClick={handleAddWallet}
                            className="px-6 py-3 bg-gradient-to-r from-[#10B981] to-emerald-600 text-white font-semibold rounded-lg hover:from-[#059669] hover:to-[#10B981] shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                        >
                            <Plus size={20} />
                            Thêm ví đầu tiên
                        </button>
                    </div>
                )}
            </div>

            {/* Wallet Modal */}
            <WalletModal
                open={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setEditingWallet(null);
                }}
                wallet={editingWallet}
                onSuccess={loadWallets}
            />
        </div>
    );
};

export default WalletsIndex;


