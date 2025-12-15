import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, Plus, MoreVertical, Edit, Trash2, Archive, Star, Building2 } from "lucide-react";
import { message, Dropdown, Modal } from "antd";
import { getWalletsAPI, deleteWalletAPI, setDefaultWalletAPI, archiveWalletAPI, unarchiveWalletAPI } from "../../../services/api.wallet";
import WalletModal from "../../../components/wallets/WalletModal";

const WalletsIndex = () => {
    const navigate = useNavigate();
    const [wallets, setWallets] = useState([]);
    const [filteredWallets, setFilteredWallets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState("all"); // all, active, archived
    const [modalOpen, setModalOpen] = useState(false);
    const [editingWallet, setEditingWallet] = useState(null);
    const [summary, setSummary] = useState({
        totalBalance: 0,
        activeCount: 0,
        archivedCount: 0,
        defaultWalletName: "",
    });

    useEffect(() => {
        loadWallets();
    }, []);

    useEffect(() => {
        filterWallets();
    }, [wallets, activeFilter]);

    const loadWallets = async () => {
        try {
            setLoading(true);
            const res = await getWalletsAPI();
            if (res.EC === 0 && res.data) {
                setWallets(res.data);
                calculateSummary(res.data);
            } else {
                message.error("Không thể tải danh sách ví!");
            }
        } catch (error) {
            message.error("Có lỗi xảy ra khi tải danh sách ví!");
        } finally {
            setLoading(false);
        }
    };

    const calculateSummary = (walletList) => {
        const total = walletList.reduce((sum, w) => sum + (w.balance || 0), 0);
        const active = walletList.filter((w) => !w.is_archived).length;
        const archived = walletList.filter((w) => w.is_archived).length;
        const defaultWallet = walletList.find((w) => w.is_default);
        
        setSummary({
            totalBalance: total,
            activeCount: active,
            archivedCount: archived,
            defaultWalletName: defaultWallet?.name || "Chưa có",
        });
    };

    const filterWallets = () => {
        let filtered = [...wallets];
        if (activeFilter === "active") {
            filtered = filtered.filter((w) => !w.is_archived);
        } else if (activeFilter === "archived") {
            filtered = filtered.filter((w) => w.is_archived);
        }
        setFilteredWallets(filtered);
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
                    if (res.EC === 0) {
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
            if (res.EC === 0) {
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
            if (res.EC === 0) {
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
            if (res.EC === 0) {
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

        if (!wallet.is_default && !wallet.is_archived) {
            items.push({
                type: "divider",
            });
            items.push({
                key: "delete",
                label: "Xóa ví",
                icon: <Trash2 size={16} />,
                danger: true,
                onClick: () => handleDeleteWallet(wallet),
            });
        }

        return items;
    };

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
                            <div className="w-12 h-12 bg-[#10B981]/10 rounded-lg flex items-center justify-center">
                                <Wallet className="text-[#10B981] w-6 h-6" />
                            </div>
                        </div>
                        <p className="ds-text-secondary mb-1">Tổng số dư</p>
                        <p className="text-2xl font-bold text-[#10B981]">
                            {loading ? "..." : formatCurrency(summary.totalBalance)}
                        </p>
                    </div>

                    <div className="ds-card">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-[#3B82F6]/10 rounded-lg flex items-center justify-center">
                                <Wallet className="text-[#3B82F6] w-6 h-6" />
                            </div>
                        </div>
                        <p className="ds-text-secondary mb-1">Số ví đang dùng</p>
                        <p className="text-2xl font-bold text-[#3B82F6]">
                            {loading ? "..." : summary.activeCount}
                        </p>
                    </div>

                    <div className="ds-card">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-[#6B7280]/10 rounded-lg flex items-center justify-center">
                                <Archive className="text-[#6B7280] w-6 h-6" />
                            </div>
                        </div>
                        <p className="ds-text-secondary mb-1">Số ví đã lưu trữ</p>
                        <p className="text-2xl font-bold text-[#6B7280]">
                            {loading ? "..." : summary.archivedCount}
                        </p>
                    </div>

                    <div className="ds-card">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-[#F59E0B]/10 rounded-lg flex items-center justify-center">
                                <Star className="text-[#F59E0B] w-6 h-6" />
                            </div>
                        </div>
                        <p className="ds-text-secondary mb-1">Ví mặc định</p>
                        <p className="text-lg font-semibold text-[#111827] truncate">
                            {loading ? "..." : summary.defaultWalletName}
                        </p>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6 bg-white p-1 rounded-lg border border-[#E5E7EB] inline-flex">
                    <button
                        onClick={() => setActiveFilter("all")}
                        className={`px-4 py-2 rounded-md font-medium transition-all ${
                            activeFilter === "all"
                                ? "bg-[#10B981] text-white shadow-sm"
                                : "text-[#6B7280] hover:bg-[#F9FAFB]"
                        }`}
                    >
                        Tất cả
                    </button>
                    <button
                        onClick={() => setActiveFilter("active")}
                        className={`px-4 py-2 rounded-md font-medium transition-all ${
                            activeFilter === "active"
                                ? "bg-[#10B981] text-white shadow-sm"
                                : "text-[#6B7280] hover:bg-[#F9FAFB]"
                        }`}
                    >
                        Đang dùng
                    </button>
                    <button
                        onClick={() => setActiveFilter("archived")}
                        className={`px-4 py-2 rounded-md font-medium transition-all ${
                            activeFilter === "archived"
                                ? "bg-[#10B981] text-white shadow-sm"
                                : "text-[#6B7280] hover:bg-[#F9FAFB]"
                        }`}
                    >
                        Đã lưu trữ
                    </button>
                </div>

                {/* Wallets Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="ds-card ds-skeleton" style={{ height: "200px" }}></div>
                        ))}
                    </div>
                ) : filteredWallets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredWallets.map((wallet) => (
                            <div
                                key={wallet._id}
                                className="ds-card relative cursor-pointer hover:scale-[1.02] transition-transform"
                                style={{
                                    border: wallet.is_default ? "2px solid #10B981" : "1px solid #E5E7EB",
                                }}
                                onClick={() => navigate(`/wallets/${wallet._id}`)}
                            >
                                {/* Badges */}
                                <div className="absolute top-4 right-4 flex gap-2">
                                    {wallet.is_default && (
                                        <span className="ds-badge ds-badge-success">Mặc định</span>
                                    )}
                                    {wallet.is_archived && (
                                        <span className="ds-badge ds-badge-warning">Đã lưu trữ</span>
                                    )}
                                </div>

                                {/* Actions Menu */}
                                <div
                                    className="absolute top-4 right-4 z-10"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Dropdown
                                        menu={{ items: getWalletMenuItems(wallet) }}
                                        trigger={["click"]}
                                        placement="bottomRight"
                                    >
                                        <button
                                            className="p-2 hover:bg-[#F9FAFB] rounded-lg transition-colors"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <MoreVertical size={18} className="text-[#6B7280]" />
                                        </button>
                                    </Dropdown>
                                </div>

                                {/* Wallet Icon */}
                                <div className="mb-4">
                                    <div
                                        className={`w-16 h-16 rounded-lg flex items-center justify-center ${
                                            wallet.type === "bank"
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
                                </div>

                                {/* Wallet Info */}
                                <div>
                                    <h3 className="ds-heading-3 mb-2">{wallet.name}</h3>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span
                                            className={`ds-badge ${
                                                wallet.type === "bank"
                                                    ? "ds-badge-primary"
                                                    : "ds-badge-success"
                                            }`}
                                        >
                                            {wallet.type === "bank" ? "Ngân hàng" : "Tiền mặt"}
                                        </span>
                                    </div>
                                    <p className="text-2xl font-bold text-[#10B981] mb-2">
                                        {formatCurrency(wallet.balance || 0, wallet.currency)}
                                    </p>
                                    {wallet.type === "bank" && wallet.bankName && (
                                        <div className="mt-3 pt-3 border-t border-[#E5E7EB]">
                                            <p className="ds-text-small mb-1">
                                                <span className="font-medium">Ngân hàng:</span> {wallet.bankName}
                                            </p>
                                            {wallet.bankAccount && (
                                                <p className="ds-text-small">
                                                    <span className="font-medium">Số TK:</span>{" "}
                                                    {wallet.bankAccount.replace(/(.{4})(.*)/, "****$2")}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="ds-empty-state">
                        <Wallet className="ds-empty-state-icon" size={64} />
                        <p className="ds-empty-state-text">
                            {activeFilter === "archived"
                                ? "Chưa có ví nào được lưu trữ"
                                : activeFilter === "active"
                                ? "Chưa có ví đang dùng"
                                : "Chưa có ví nào"}
                        </p>
                        {activeFilter !== "archived" && (
                            <button
                                onClick={handleAddWallet}
                                className="ds-button-primary mt-4"
                            >
                                Thêm ví đầu tiên
                            </button>
                        )}
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

