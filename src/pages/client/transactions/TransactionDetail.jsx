import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Trash2, TrendingUp, TrendingDown, Image as ImageIcon } from "lucide-react";
import { message, Modal } from "antd";
import { getTransactionByIdAPI, deleteTransactionAPI, settleDebtLoanAPI } from "../../../services/api.transaction";
import TransactionModal from "../../../components/transactions/TransactionModal";
import dayjs from "dayjs";

const TransactionDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [transaction, setTransaction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [relatedTransactions, setRelatedTransactions] = useState([]);

    useEffect(() => {
        if (id) {
            loadTransaction();
        }
    }, [id]);

    const loadTransaction = async () => {
        try {
            setLoading(true);
            const res = await getTransactionByIdAPI(id);
            if (res.status || res.EC === 0) {
                setTransaction(res.data);
                // TODO: Load related transactions
            } else {
                message.error("Không tìm thấy giao dịch!");
                navigate("/transactions");
            }
        } catch (error) {
            message.error("Có lỗi xảy ra khi tải thông tin giao dịch!");
            navigate("/transactions");
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount);
    };

    const formatDateTime = (date) => {
        return dayjs(date).format("DD/MM/YYYY HH:mm");
    };

    const getTransactionTypeColor = (type) => {
        const colors = {
            income: "#10B981",
            expense: "#EF4444",
            transfer: "#3B82F6",
            debt: "#F59E0B",
            loan: "#F97316",
            adjust: "#6B7280",
        };
        return colors[type] || "#6B7280";
    };

    const getTransactionTypeLabel = (type) => {
        const labels = {
            income: "Thu nhập",
            expense: "Chi tiêu",
            transfer: "Chuyển tiền",
            debt: "Nợ phải thu",
            loan: "Nợ phải trả",
            adjust: "Điều chỉnh",
        };
        return labels[type] || type;
    };

    const handleEdit = () => {
        setModalOpen(true);
    };

    const handleDelete = () => {
        Modal.confirm({
            title: "Xác nhận xóa giao dịch",
            content: `Bạn có chắc chắn muốn xóa giao dịch này?`,
            okText: "Xóa",
            okType: "danger",
            cancelText: "Hủy",
            onOk: async () => {
                try {
                    const res = await deleteTransactionAPI(transaction._id);
                    if (res.status || res.EC === 0) {
                        message.success("Xóa giao dịch thành công!");
                        navigate("/transactions");
                    } else {
                        message.error(res.message || "Xóa giao dịch thất bại!");
                    }
                } catch (error) {
                    message.error("Có lỗi xảy ra!");
                }
            },
        });
    };

    const handleSettle = async () => {
        try {
            const res = await settleDebtLoanAPI(transaction._id);
            if (res.status || res.EC === 0) {
                message.success("Đánh dấu đã thanh toán thành công!");
                loadTransaction();
            } else {
                message.error(res.message || "Thao tác thất bại!");
            }
        } catch (error) {
            message.error("Có lỗi xảy ra!");
        }
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

    if (!transaction) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[#F9FAFB]">
            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Back Button */}
                <button
                    onClick={() => navigate("/transactions")}
                    className="flex items-center gap-2 text-[#6B7280] hover:text-[#111827] mb-6 transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span>Quay lại danh sách giao dịch</span>
                </button>

                {/* Transaction Info Card */}
                <div className="ds-card mb-6">
                    <div className="flex items-start gap-6 mb-6">
                        <div
                            className="w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{
                                backgroundColor: `${getTransactionTypeColor(transaction.type)}20`,
                            }}
                        >
                            {transaction.type === "income" ? (
                                <TrendingUp
                                    size={40}
                                    style={{ color: getTransactionTypeColor(transaction.type) }}
                                />
                            ) : (
                                <TrendingDown
                                    size={40}
                                    style={{ color: getTransactionTypeColor(transaction.type) }}
                                />
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <span
                                    className="ds-badge"
                                    style={{
                                        backgroundColor: `${getTransactionTypeColor(transaction.type)}20`,
                                        color: getTransactionTypeColor(transaction.type),
                                    }}
                                >
                                    {getTransactionTypeLabel(transaction.type)}
                                </span>
                                {transaction.isRecurring && (
                                    <span className="ds-badge" style={{ backgroundColor: "#A855F720", color: "#A855F7" }}>
                                        Định kỳ
                                    </span>
                                )}
                                {transaction.isSettled && (
                                    <span className="ds-badge ds-badge-success">Đã thanh toán</span>
                                )}
                            </div>
                            <p
                                className="text-4xl font-bold mb-2"
                                style={{ color: getTransactionTypeColor(transaction.type) }}
                            >
                                {transaction.type === "income" ? "+" : transaction.type === "transfer" ? "→" : "-"}
                                {formatCurrency(Math.abs(transaction.amount))}
                            </p>
                            <p className="ds-text-secondary">{formatDateTime(transaction.date)}</p>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-4 border-t border-[#E5E7EB] pt-6">
                        {transaction.walletId && (
                            <div className="flex">
                                <span className="w-32 font-medium text-[#6B7280]">Ví:</span>
                                <span className="flex-1">{transaction.walletId.name || transaction.walletId}</span>
                            </div>
                        )}

                        {transaction.categoryId && (
                            <div className="flex">
                                <span className="w-32 font-medium text-[#6B7280]">Danh mục:</span>
                                <span className="flex-1">{transaction.categoryId.name || transaction.categoryId}</span>
                            </div>
                        )}

                        {transaction.toWalletId && (
                            <div className="flex">
                                <span className="w-32 font-medium text-[#6B7280]">Đến ví:</span>
                                <span className="flex-1">
                                    {transaction.toWalletId.name || transaction.toWalletId}
                                </span>
                            </div>
                        )}

                        {transaction.counterpartyName && (
                            <div className="flex">
                                <span className="w-32 font-medium text-[#6B7280]">Đối tác:</span>
                                <span className="flex-1">{transaction.counterpartyName}</span>
                            </div>
                        )}

                        {transaction.counterpartyContact && (
                            <div className="flex">
                                <span className="w-32 font-medium text-[#6B7280]">Liên hệ:</span>
                                <span className="flex-1">{transaction.counterpartyContact}</span>
                            </div>
                        )}

                        {transaction.dueDate && (
                            <div className="flex">
                                <span className="w-32 font-medium text-[#6B7280]">Ngày đáo hạn:</span>
                                <span className="flex-1">{formatDateTime(transaction.dueDate)}</span>
                            </div>
                        )}

                        {transaction.note && (
                            <div className="flex">
                                <span className="w-32 font-medium text-[#6B7280]">Ghi chú:</span>
                                <span className="flex-1">{transaction.note}</span>
                            </div>
                        )}

                        {transaction.adjustReason && (
                            <div className="flex">
                                <span className="w-32 font-medium text-[#6B7280]">Lý do điều chỉnh:</span>
                                <span className="flex-1">{transaction.adjustReason}</span>
                            </div>
                        )}

                        {transaction.imageUrl && (
                            <div className="flex">
                                <span className="w-32 font-medium text-[#6B7280]">Hình ảnh:</span>
                                <div className="flex-1">
                                    <img
                                        src={transaction.imageUrl}
                                        alt="Receipt"
                                        className="w-32 h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => window.open(transaction.imageUrl, "_blank")}
                                    />
                                </div>
                            </div>
                        )}

                        {transaction.isRecurring && (
                            <div className="mt-4 p-4 bg-[#A855F710] rounded-lg">
                                <p className="font-medium mb-2">Giao dịch định kỳ</p>
                                <p className="text-sm text-[#6B7280]">
                                    Lập lại:{" "}
                                    {transaction.recurringType === "daily"
                                        ? "Hàng ngày"
                                        : transaction.recurringType === "weekly"
                                        ? "Hàng tuần"
                                        : transaction.recurringType === "monthly"
                                        ? "Hàng tháng"
                                        : "Hàng năm"}
                                </p>
                                {transaction.endDate && (
                                    <p className="text-sm text-[#6B7280]">
                                        Ngày kết thúc: {formatDateTime(transaction.endDate)}
                                    </p>
                                )}
                                <a
                                    href="/transactions?recurring=true"
                                    className="text-sm text-[#3B82F6] hover:underline mt-2 inline-block"
                                >
                                    Xem tất cả giao dịch định kỳ
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-6 pt-6 border-t border-[#E5E7EB]">
                        <button
                            onClick={handleEdit}
                            className="ds-button-primary"
                            style={{ display: "flex", alignItems: "center", gap: "8px" }}
                        >
                            <Edit size={18} />
                            Sửa
                        </button>
                        {(transaction.type === "debt" || transaction.type === "loan") && !transaction.isSettled && (
                            <button
                                onClick={handleSettle}
                                className="ds-button-secondary"
                                style={{ display: "flex", alignItems: "center", gap: "8px" }}
                            >
                                Đánh dấu đã thanh toán
                            </button>
                        )}
                        <button
                            onClick={handleDelete}
                            className="ds-button-danger"
                            style={{ display: "flex", alignItems: "center", gap: "8px" }}
                        >
                            <Trash2 size={18} />
                            Xóa
                        </button>
                    </div>
                </div>

                {/* Related Transactions */}
                {relatedTransactions.length > 0 && (
                    <div className="ds-card">
                        <h3 className="ds-heading-3 mb-4">Giao dịch liên quan</h3>
                        <div className="space-y-2">
                            {relatedTransactions.map((related) => (
                                <div
                                    key={related._id}
                                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-[#F9FAFB] transition-colors cursor-pointer"
                                    onClick={() => navigate(`/transactions/${related._id}`)}
                                >
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center"
                                        style={{
                                            backgroundColor: `${getTransactionTypeColor(related.type)}20`,
                                        }}
                                    >
                                        {related.type === "income" ? (
                                            <TrendingUp
                                                size={20}
                                                style={{ color: getTransactionTypeColor(related.type) }}
                                            />
                                        ) : (
                                            <TrendingDown
                                                size={20}
                                                style={{ color: getTransactionTypeColor(related.type) }}
                                            />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-[#111827]">
                                            {related.categoryId?.name || getTransactionTypeLabel(related.type)}
                                        </p>
                                        <p className="text-sm text-[#6B7280]">{formatDateTime(related.date)}</p>
                                    </div>
                                    <p
                                        className="font-bold"
                                        style={{ color: getTransactionTypeColor(related.type) }}
                                    >
                                        {related.type === "income" ? "+" : "-"}
                                        {formatCurrency(Math.abs(related.amount))}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Transaction Modal */}
            <TransactionModal
                open={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                }}
                transaction={transaction}
                onSuccess={() => {
                    loadTransaction();
                    setModalOpen(false);
                }}
            />
        </div>
    );
};

export default TransactionDetail;

