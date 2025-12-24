import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Wallet, Building2, Edit, Trash2, Archive, Star, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { message, Modal, Tabs } from "antd";
import { getWalletByIdAPI, deleteWalletAPI, setDefaultWalletAPI, archiveWalletAPI, unarchiveWalletAPI, updateWalletAPI } from "../../../services/api.wallet";
import WalletModal from "../../../components/wallets/WalletModal";
import DateRangePicker from "../../../components/common/DateRangePicker";

const WalletDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [wallet, setWallet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("info");
    const [modalOpen, setModalOpen] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [dateRange, setDateRange] = useState(null);

    useEffect(() => {
        if (id) {
            loadWallet();
        }
    }, [id]);

    useEffect(() => {
        if (activeTab === "transactions" && wallet) {
            loadTransactions();
        }
    }, [activeTab, wallet, dateRange]);

    const loadWallet = async () => {
        try {
            setLoading(true);
            const res = await getWalletByIdAPI(id);
            if (res.EC === 0 && res.data) {
                setWallet(res.data);
            } else {
                message.error("Không tìm thấy ví!");
                navigate("/wallets");
            }
        } catch (error) {
            message.error("Có lỗi xảy ra khi tải thông tin ví!");
            navigate("/wallets");
        } finally {
            setLoading(false);
        }
    };

    const loadTransactions = async () => {
        try {
            // TODO: Gọi API để lấy giao dịch theo wallet ID
            // Tạm thời dùng mock data
            setTransactions([
                {
                    id: 1,
                    category: "Ăn uống",
                    amount: -150000,
                    date: new Date(),
                    type: "expense",
                    description: "Ăn trưa",
                },
                {
                    id: 2,
                    category: "Lương",
                    amount: 5000000,
                    date: new Date(),
                    type: "income",
                    description: "Lương tháng 12",
                },
            ]);
        } catch (error) {
            message.error("Không thể tải giao dịch!");
        }
    };

    const formatCurrency = (amount, currency = "VND") => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: currency,
        }).format(amount);
    };

    const formatDate = (date) => {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const handleEdit = () => {
        setModalOpen(true);
    };

    const handleDelete = () => {
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
                        navigate("/wallets");
                    } else {
                        message.error(res.message || "Xóa ví thất bại!");
                    }
                } catch (error) {
                    message.error("Có lỗi xảy ra!");
                }
            },
        });
    };

    const handleSetDefault = async () => {
        try {
            const res = await setDefaultWalletAPI(wallet._id);
            if (res.EC === 0) {
                message.success("Đặt ví mặc định thành công!");
                loadWallet();
            } else {
                message.error(res.message || "Thao tác thất bại!");
            }
        } catch (error) {
            message.error("Có lỗi xảy ra!");
        }
    };

    const handleArchive = async () => {
        try {
            const res = await archiveWalletAPI(wallet._id);
            if (res.EC === 0) {
                message.success("Lưu trữ ví thành công!");
                navigate("/wallets");
            } else {
                message.error(res.message || "Thao tác thất bại!");
            }
        } catch (error) {
            message.error("Có lỗi xảy ra!");
        }
    };

    const handleUnarchive = async () => {
        try {
            const res = await unarchiveWalletAPI(wallet._id);
            if (res.EC === 0) {
                message.success("Khôi phục ví thành công!");
                loadWallet();
            } else {
                message.error(res.message || "Thao tác thất bại!");
            }
        } catch (error) {
            message.error("Có lỗi xảy ra!");
        }
    };

    const calculateTransactionStats = () => {
        const income = transactions
            .filter((t) => t.type === "income")
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const expense = transactions
            .filter((t) => t.type === "expense")
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        return { income, expense };
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
                <div className="text-center">
                    <div className="ds-skeleton w-64 h-64 rounded-lg mb-4"></div>
                    <p className="ds-text-secondary">Đang tải...</p>
                </div>
            </div>
        );
    }

    if (!wallet) {
        return null;
    }

    const stats = calculateTransactionStats();

    const tabItems = [
        {
            key: "info",
            label: "Thông tin",
            children: (
                <div className="space-y-6">
                    {/* Main Info Card */}
                    <div className="ds-card">
                        <div className="flex items-start gap-6">
                            <div
                                className={`w-20 h-20 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                    wallet.type === "bank"
                                        ? "bg-[#3B82F6]/10"
                                        : "bg-[#10B981]/10"
                                }`}
                            >
                                {wallet.type === "bank" ? (
                                    <Building2 className="text-[#3B82F6] w-10 h-10" />
                                ) : (
                                    <Wallet className="text-[#10B981] w-10 h-10" />
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="ds-heading-2">{wallet.name}</h2>
                                    {wallet.is_default && (
                                        <span className="ds-badge ds-badge-success">Mặc định</span>
                                    )}
                                    {wallet.is_archived && (
                                        <span className="ds-badge ds-badge-warning">Đã lưu trữ</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-4 mb-4">
                                    <span
                                        className={`ds-badge ${
                                            wallet.type === "bank"
                                                ? "ds-badge-primary"
                                                : "ds-badge-success"
                                        }`}
                                    >
                                        {wallet.type === "bank" ? "Ngân hàng" : "Tiền mặt"}
                                    </span>
                                    <span className="ds-text-secondary">
                                        Cập nhật: {formatDate(wallet.updatedAt || wallet.createdAt)}
                                    </span>
                                </div>
                                <p className="text-3xl font-bold text-[#10B981] mb-4">
                                    {formatCurrency(wallet.balance || 0, wallet.currency)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bank Info (if bank type) */}
                    {wallet.type === "bank" && (
                        <div className="ds-card">
                            <h3 className="ds-heading-3 mb-4">Thông tin ngân hàng</h3>
                            <div className="space-y-3">
                                {wallet.bankName && (
                                    <div>
                                        <p className="ds-text-secondary mb-1">Tên ngân hàng</p>
                                        <p className="ds-body font-semibold">{wallet.bankName}</p>
                                    </div>
                                )}
                                {wallet.bankAccount && (
                                    <div>
                                        <p className="ds-text-secondary mb-1">Số tài khoản</p>
                                        <p className="ds-body font-semibold">
                                            {wallet.bankAccount.replace(/(.{4})(.*)/, "****$2")}
                                        </p>
                                    </div>
                                )}
                                {wallet.bankCode && (
                                    <div>
                                        <p className="ds-text-secondary mb-1">Mã ngân hàng</p>
                                        <p className="ds-body font-semibold">{wallet.bankCode}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="ds-card">
                        <h3 className="ds-heading-3 mb-4">Thao tác</h3>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={handleEdit}
                                className="ds-button-primary"
                                style={{ display: "flex", alignItems: "center", gap: "8px" }}
                            >
                                <Edit size={18} />
                                Sửa ví
                            </button>
                            {!wallet.is_default && (
                                <button
                                    onClick={handleSetDefault}
                                    className="ds-button-secondary"
                                    style={{ display: "flex", alignItems: "center", gap: "8px" }}
                                >
                                    <Star size={18} />
                                    Đặt làm mặc định
                                </button>
                            )}
                            {!wallet.is_archived ? (
                                <button
                                    onClick={handleArchive}
                                    className="ds-button-secondary"
                                    style={{ display: "flex", alignItems: "center", gap: "8px" }}
                                >
                                    <Archive size={18} />
                                    Lưu trữ
                                </button>
                            ) : (
                                <button
                                    onClick={handleUnarchive}
                                    className="ds-button-secondary"
                                    style={{ display: "flex", alignItems: "center", gap: "8px" }}
                                >
                                    <Archive size={18} />
                                    Khôi phục
                                </button>
                            )}
                            {!wallet.is_default && (
                                <button
                                    onClick={handleDelete}
                                    className="ds-button-danger"
                                    style={{ display: "flex", alignItems: "center", gap: "8px" }}
                                >
                                    <Trash2 size={18} />
                                    Xóa ví
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            key: "transactions",
            label: "Giao dịch",
            children: (
                <div className="space-y-6">
                    {/* Filter Bar */}
                    <div className="ds-card">
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                            <h3 className="ds-heading-3">Lọc giao dịch</h3>
                            <DateRangePicker
                                value={dateRange}
                                onChange={setDateRange}
                            />
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="ds-card">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-[#10B981]/10 rounded-lg flex items-center justify-center">
                                    <TrendingUp className="text-[#10B981] w-5 h-5" />
                                </div>
                                <p className="ds-text-secondary">Tổng thu</p>
                            </div>
                            <p className="text-2xl font-bold text-[#10B981]">
                                {formatCurrency(stats.income, wallet.currency)}
                            </p>
                        </div>
                        <div className="ds-card">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-[#EF4444]/10 rounded-lg flex items-center justify-center">
                                    <TrendingDown className="text-[#EF4444] w-5 h-5" />
                                </div>
                                <p className="ds-text-secondary">Tổng chi</p>
                            </div>
                            <p className="text-2xl font-bold text-[#EF4444]">
                                {formatCurrency(stats.expense, wallet.currency)}
                            </p>
                        </div>
                        <div className="ds-card">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-[#3B82F6]/10 rounded-lg flex items-center justify-center">
                                    <Wallet className="text-[#3B82F6] w-5 h-5" />
                                </div>
                                <p className="ds-text-secondary">Số dư cuối kỳ</p>
                            </div>
                            <p className="text-2xl font-bold text-[#3B82F6]">
                                {formatCurrency(
                                    (wallet.balance || 0) - stats.expense + stats.income,
                                    wallet.currency
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Transactions List */}
                    <div className="ds-card">
                        <h3 className="ds-heading-3 mb-4">Danh sách giao dịch</h3>
                        {transactions.length > 0 ? (
                            <div className="space-y-4">
                                {transactions.map((transaction) => (
                                    <div
                                        key={transaction.id}
                                        className="flex items-center gap-4 p-4 rounded-lg hover:bg-[#F9FAFB] transition-colors border border-[#E5E7EB]"
                                    >
                                        <div
                                            className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                                transaction.type === "income"
                                                    ? "bg-[#10B981]/10"
                                                    : "bg-[#EF4444]/10"
                                            }`}
                                        >
                                            {transaction.type === "income" ? (
                                                <TrendingUp className="text-[#10B981]" size={20} />
                                            ) : (
                                                <TrendingDown className="text-[#EF4444]" size={20} />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-[#111827]">
                                                {transaction.category}
                                            </p>
                                            {transaction.description && (
                                                <p className="text-sm text-[#6B7280]">
                                                    {transaction.description}
                                                </p>
                                            )}
                                            <p className="text-sm text-[#6B7280]">
                                                {formatDate(transaction.date)}
                                            </p>
                                        </div>
                                        <p
                                            className={`text-lg font-bold ${
                                                transaction.type === "income"
                                                    ? "text-[#10B981]"
                                                    : "text-[#EF4444]"
                                            }`}
                                        >
                                            {transaction.type === "income" ? "+" : "-"}
                                            {formatCurrency(Math.abs(transaction.amount), wallet.currency)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="ds-empty-state">
                                <BarChart3 className="ds-empty-state-icon" size={64} />
                                <p className="ds-empty-state-text">Chưa có giao dịch nào</p>
                            </div>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: "statistics",
            label: "Thống kê",
            children: (
                <div className="space-y-6">
                    <div className="ds-card">
                        <h3 className="ds-heading-3 mb-4">Biểu đồ số dư theo thời gian</h3>
                        <div className="ds-empty-state" style={{ minHeight: "300px" }}>
                            <BarChart3 className="ds-empty-state-icon" size={64} />
                            <p className="ds-empty-state-text">Biểu đồ sẽ được hiển thị ở đây</p>
                            <p className="ds-text-small">Tính năng đang phát triển</p>
                        </div>
                    </div>
                    <div className="ds-card">
                        <h3 className="ds-heading-3 mb-4">Phân bổ chi tiêu theo danh mục</h3>
                        <div className="ds-empty-state" style={{ minHeight: "300px" }}>
                            <BarChart3 className="ds-empty-state-icon" size={64} />
                            <p className="ds-empty-state-text">Biểu đồ sẽ được hiển thị ở đây</p>
                            <p className="ds-text-small">Tính năng đang phát triển</p>
                        </div>
                    </div>
                </div>
            ),
        },
    ];

    return (
        <div className="min-h-screen bg-[#F9FAFB]">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Back Button */}
                <button
                    onClick={() => navigate("/wallets")}
                    className="flex items-center gap-2 text-[#6B7280] hover:text-[#111827] mb-6 transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span>Quay lại danh sách ví</span>
                </button>

                {/* Tabs */}
                <div className="bg-white rounded-lg border border-[#E5E7EB] p-6">
                    <Tabs
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        items={tabItems}
                        size="large"
                    />
                </div>
            </div>

            {/* Wallet Modal */}
            <WalletModal
                open={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                }}
                wallet={wallet}
                onSuccess={() => {
                    loadWallet();
                    setModalOpen(false);
                }}
            />
        </div>
    );
};

export default WalletDetail;



