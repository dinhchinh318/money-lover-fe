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
        <div className="min-h-screen bg-[#F9FAFB]">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header Section */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="ds-heading-1" style={{ fontSize: "24px", fontWeight: 700 }}>
                        Quản lý Ví
                    </h1>
                    <button
                        onClick={handleAddWallet}
                        className="ds-button-primary"
                        style={{ display: "flex", alignItems: "center", gap: "8px" }}
                    >
                        <Plus size={18} />
                        Thêm ví
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div className="ds-card">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-[#3B82F6]/10 rounded-lg flex items-center justify-center">
                                <Wallet className="text-[#3B82F6] w-6 h-6" />
                            </div>
                        </div>
                        <p className="ds-text-secondary mb-1">Tổng số ví</p>
                        <p className="text-2xl font-bold text-[#3B82F6]">
                            {loading ? "..." : summary.totalWallets}
                        </p>
                    </div>

                    <div className="ds-card">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-[#10B981]/10 rounded-lg flex items-center justify-center">
                                <TrendingUp className="text-[#10B981] w-6 h-6" />
                            </div>
                        </div>
                        <p className="ds-text-secondary mb-1">Tổng số dư</p>
                        <p className="text-2xl font-bold text-[#10B981]">
                            {loading ? "..." : formatCurrency(summary.totalBalance)}
                        </p>
                    </div>

                    <div className="ds-card">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-[#F59E0B]/10 rounded-lg flex items-center justify-center">
                                <Wallet className="text-[#F59E0B] w-6 h-6" />
                            </div>
                        </div>
                        <p className="ds-text-secondary mb-1">Ví tiền mặt</p>
                        <p className="text-2xl font-bold text-[#F59E0B]">
                            {loading ? "..." : summary.cashWallets}
                        </p>
                    </div>

                    <div className="ds-card">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-[#8B5CF6]/10 rounded-lg flex items-center justify-center">
                                <Building2 className="text-[#8B5CF6] w-6 h-6" />
                            </div>
                        </div>
                        <p className="ds-text-secondary mb-1">Ví ngân hàng</p>
                        <p className="text-2xl font-bold text-[#8B5CF6]">
                            {loading ? "..." : summary.bankWallets}
                        </p>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6 bg-white p-1 rounded-lg border border-[#E5E7EB] inline-flex">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-2 rounded-md font-medium transition-all ${activeTab === tab.key
                                    ? "bg-[#10B981] text-white shadow-sm"
                                    : "text-[#6B7280] hover:bg-[#F9FAFB]"
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
                            return (
                                <div
                                    key={wallet._id}
                                    className="ds-card relative cursor-pointer hover:shadow-lg transition-shadow"
                                    onClick={() => navigate(`/wallets/${wallet._id}`)}
                                    style={{
                                        border: wallet.is_default ? "2px solid #10B981" : "1px solid #E5E7EB",
                                    }}
                                >
                                    {/* Actions Menu */}
                                    <div className="absolute top-4 right-4 z-10" onClick={(e) => e.stopPropagation()}>
                                        <Dropdown
                                            menu={{ items: getWalletMenuItems(wallet) }}
                                            trigger={["click"]}
                                            placement="bottomRight"
                                        >
                                            <button className="p-2 hover:bg-[#F9FAFB] rounded-lg transition-colors">
                                                <svg
                                                    className="w-5 h-5 text-[#6B7280]"
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

                                    {/* Wallet Icon */}
                                    <div
                                        className={`w-16 h-16 rounded-lg flex items-center justify-center mb-4 ${wallet.type === "bank"
                                                ? "bg-[#3B82F6]/10"
                                                : "bg-[#10B981]/10"
                                            }`}
                                    >
                                        {wallet.type === "bank" ? (
                                            <Building2 className="text-[#3B82F6] w-8 h-8" />
                                        ) : (
                                            <Wallet className="text-[#10B981] w-8 h-8" />
                                        )}
                                    </div>

                                    {/* Wallet Info */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <h3 className="ds-heading-3">{wallet.name}</h3>
                                            {wallet.is_default && (
                                                <Star className="text-[#10B981] w-5 h-5 fill-[#10B981]" />
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`ds-badge ${wallet.type === "bank"
                                                        ? "ds-badge-primary"
                                                        : "ds-badge-success"
                                                    }`}
                                            >
                                                {wallet.type === "bank" ? "Ngân hàng" : "Tiền mặt"}
                                            </span>
                                            {wallet.is_archived && (
                                                <span className="ds-badge ds-badge-warning">Đã lưu trữ</span>
                                            )}
                                        </div>

                                        <p className="text-2xl font-bold text-[#10B981] mt-4">
                                            {formatCurrency(wallet.balance || 0, wallet.currency)}
                                        </p>

                                        {wallet.type === "bank" && wallet.bankName && (
                                            <p className="ds-text-small text-[#6B7280]">
                                                {wallet.bankName}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="ds-empty-state">
                        <Wallet className="ds-empty-state-icon" size={64} />
                        <p className="ds-empty-state-text">
                            {activeTab === "archived"
                                ? "Chưa có ví nào được lưu trữ"
                                : activeTab === "active"
                                    ? "Chưa có ví đang hoạt động"
                                    : "Chưa có ví nào"}
                        </p>
                        <button onClick={handleAddWallet} className="ds-button-primary mt-4">
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

