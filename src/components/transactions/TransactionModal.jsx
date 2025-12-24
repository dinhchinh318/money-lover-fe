import { useState, useEffect } from "react";
import { Modal, Form, Input, Select, InputNumber, DatePicker, Upload, Radio, Switch, message } from "antd";
import { Plus, X, Upload as UploadIcon } from "lucide-react";
import { createTransactionAPI, updateTransactionAPI } from "../../services/api.transaction";
import { getWalletsAPI } from "../../services/api.wallet";
import { getCategoriesAPI } from "../../services/api.category";
import dayjs from "dayjs";

const { Option } = Select;
const { TextArea } = Input;

const TRANSACTION_TYPES = [
    { value: "income", label: "Thu nhập", color: "#10B981" },
    { value: "expense", label: "Chi tiêu", color: "#EF4444" },
    { value: "transfer", label: "Chuyển tiền", color: "#3B82F6" },
    { value: "debt", label: "Nợ phải thu", color: "#F59E0B" },
    { value: "loan", label: "Nợ phải trả", color: "#F97316" },
    { value: "adjust", label: "Điều chỉnh", color: "#6B7280" },
];

const RECURRING_TYPES = [
    { value: "daily", label: "Hàng ngày" },
    { value: "weekly", label: "Hàng tuần" },
    { value: "monthly", label: "Hàng tháng" },
    { value: "yearly", label: "Hàng năm" },
];

const TransactionModal = ({ open, onClose, transaction, onSuccess, initialType = "expense" }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [transactionType, setTransactionType] = useState("expense");
    const [wallets, setWallets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isRecurring, setIsRecurring] = useState(false);
    const [imageUrl, setImageUrl] = useState("");

    useEffect(() => {
        if (open) {
            loadWallets();
            loadCategories();
            if (transaction) {
                form.setFieldsValue({
                    type: transaction.type,
                    walletId: transaction.walletId?._id || transaction.walletId,
                    amount: transaction.amount,
                    date: transaction.date ? dayjs(transaction.date) : dayjs(),
                    note: transaction.note || "",
                    categoryId: transaction.categoryId?._id || transaction.categoryId,
                    toWalletId: transaction.toWalletId?._id || transaction.toWalletId,
                    transferFee: transaction.transferFee || 0,
                    counterpartyName: transaction.counterpartyName || "",
                    counterpartyContact: transaction.counterpartyContact || "",
                    dueDate: transaction.dueDate ? dayjs(transaction.dueDate) : null,
                    isSettled: transaction.isSettled || false,
                    adjustReason: transaction.adjustReason || "",
                    isRecurring: transaction.isRecurring || false,
                    recurringType: transaction.recurringType || "monthly",
                    endDate: transaction.endDate ? dayjs(transaction.endDate) : null,
                });
                setTransactionType(transaction.type);
                setIsRecurring(transaction.isRecurring || false);
                setImageUrl(transaction.imageUrl || "");
            } else {
                form.resetFields();
                form.setFieldsValue({
                    type: initialType,
                    date: dayjs(),
                    isRecurring: false,
                });
                setTransactionType(initialType);
                setIsRecurring(false);
                setImageUrl("");
            }
        }
    }, [open, transaction, form, initialType]);

    const loadWallets = async () => {
        try {
            const res = await getWalletsAPI();
            if (res.EC === 0 && res.data) {
                // Đảm bảo res.data là mảng
                const walletsData = Array.isArray(res.data) ? res.data : [];
                setWallets(walletsData.filter((w) => !w.is_archived));
            } else {
                setWallets([]);
            }
        } catch (error) {
            console.error("Error loading wallets:", error);
            setWallets([]);
        }
    };

    const loadCategories = async () => {
        try {
            const res = await getCategoriesAPI();
            if (res.EC === 0 && res.data) {
                // Đảm bảo res.data là mảng
                setCategories(Array.isArray(res.data) ? res.data : []);
            } else {
                setCategories([]);
            }
        } catch (error) {
            console.error("Error loading categories:", error);
            setCategories([]);
        }
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            const transactionData = {
                type: values.type,
                walletId: values.walletId,
                amount: values.amount,
                date: values.date ? values.date.toISOString() : new Date().toISOString(),
                note: values.note || "",
                isRecurring: values.isRecurring || false,
            };

            if (values.isRecurring) {
                transactionData.recurringType = values.recurringType;
                if (values.endDate) {
                    transactionData.endDate = values.endDate.toISOString();
                }
            }

            if (imageUrl) {
                transactionData.imageUrl = imageUrl;
            }

            // Fields theo loại
            if (values.type === "income" || values.type === "expense") {
                transactionData.categoryId = values.categoryId;
            } else if (values.type === "transfer") {
                transactionData.toWalletId = values.toWalletId;
                if (values.transferFee) {
                    transactionData.transferFee = values.transferFee;
                }
            } else if (values.type === "debt" || values.type === "loan") {
                transactionData.counterpartyName = values.counterpartyName;
                if (values.counterpartyContact) {
                    transactionData.counterpartyContact = values.counterpartyContact;
                }
                if (values.dueDate) {
                    transactionData.dueDate = values.dueDate.toISOString();
                }
                transactionData.isSettled = values.isSettled || false;
            } else if (values.type === "adjust") {
                transactionData.adjustReason = values.adjustReason;
            }

            if (transaction) {
                // Update
                const res = await updateTransactionAPI(transaction._id, transactionData);
                if (res.status || res.EC === 0) {
                    message.success("Cập nhật giao dịch thành công!");
                    onSuccess();
                    onClose();
                } else {
                    message.error(res.message || "Cập nhật giao dịch thất bại!");
                }
            } else {
                // Create
                const res = await createTransactionAPI(transactionData);
                if (res.status || res.EC === 0) {
                    message.success("Tạo giao dịch thành công!");
                    onSuccess();
                    onClose();
                } else {
                    message.error(res.message || "Tạo giao dịch thất bại!");
                }
            }
        } catch (error) {
            if (error.errorFields) {
                message.error("Vui lòng điền đầy đủ thông tin!");
            } else {
                message.error("Có lỗi xảy ra!");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = (file) => {
        // TODO: Implement image upload to server
        // For now, just set a placeholder
        setImageUrl(URL.createObjectURL(file));
        return false; // Prevent auto upload
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount);
    };

    return (
        <Modal
            title={transaction ? "Sửa giao dịch" : "Thêm giao dịch"}
            open={open}
            onCancel={onClose}
            onOk={handleSubmit}
            confirmLoading={loading}
            width={700}
            okText="Lưu"
            cancelText="Hủy"
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={{
                    type: "expense",
                    date: dayjs(),
                    isRecurring: false,
                }}
            >
                {/* Transaction Type Tabs */}
                <div className="mb-6">
                    <div className="flex gap-2 flex-wrap">
                        {TRANSACTION_TYPES.map((type) => (
                            <button
                                key={type.value}
                                type="button"
                                onClick={() => {
                                    setTransactionType(type.value);
                                    form.setFieldsValue({ type: type.value });
                                }}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${transactionType === type.value
                                    ? "text-white shadow-sm"
                                    : "bg-[#F9FAFB] text-[#6B7280] hover:bg-[#E5E7EB]"
                                    }`}
                                style={{
                                    backgroundColor:
                                        transactionType === type.value ? type.color : undefined,
                                }}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>
                    <Form.Item name="type" hidden>
                        <Input />
                    </Form.Item>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Left Column */}
                    <div className="space-y-4">
                        <Form.Item
                            label="Ví"
                            name="walletId"
                            rules={[{ required: true, message: "Vui lòng chọn ví!" }]}
                        >
                            <Select placeholder="Chọn ví">
                                {Array.isArray(wallets) && wallets.map((wallet) => (
                                    <Option key={wallet._id} value={wallet._id}>
                                        {wallet.name} ({formatCurrency(wallet.balance || 0)})
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            label="Số tiền"
                            name="amount"
                            rules={[
                                { required: true, message: "Vui lòng nhập số tiền!" },
                                { type: "number", min: 1, message: "Số tiền phải lớn hơn 0!" },
                            ]}
                        >
                            <InputNumber
                                style={{ width: "100%" }}
                                placeholder="0"
                                formatter={(value) =>
                                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                                }
                                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                                min={1}
                                addonAfter="VND"
                            />
                        </Form.Item>

                        <Form.Item label="Ghi chú" name="note">
                            <TextArea rows={3} placeholder="Nhập ghi chú..." />
                        </Form.Item>

                        {/* Fields theo loại */}
                        {(transactionType === "income" || transactionType === "expense") && (
                            <Form.Item
                                label="Danh mục"
                                name="categoryId"
                                rules={[{ required: true, message: "Vui lòng chọn danh mục!" }]}
                            >
                                <Select
                                    placeholder="Chọn danh mục"
                                    showSearch
                                    filterOption={(input, option) =>
                                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                    }
                                >
                                    {Array.isArray(categories) && categories
                                        .filter((cat) => cat.type === transactionType)
                                        .map((category) => (
                                            <Option key={category._id} value={category._id}>
                                                {category.name}
                                            </Option>
                                        ))}
                                </Select>
                            </Form.Item>
                        )}

                        {transactionType === "transfer" && (
                            <>
                                <Form.Item
                                    label="Đến ví"
                                    name="toWalletId"
                                    rules={[{ required: true, message: "Vui lòng chọn ví đích!" }]}
                                >
                                    <Select placeholder="Chọn ví đích">
                                        {Array.isArray(wallets) && wallets.map((wallet) => (
                                            <Option key={wallet._id} value={wallet._id}>
                                                {wallet.name}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                                <Form.Item label="Phí chuyển" name="transferFee">
                                    <InputNumber
                                        style={{ width: "100%" }}
                                        placeholder="0"
                                        min={0}
                                        addonAfter="VND"
                                    />
                                </Form.Item>
                            </>
                        )}

                        {(transactionType === "debt" || transactionType === "loan") && (
                            <>
                                <Form.Item
                                    label="Tên đối tác"
                                    name="counterpartyName"
                                    rules={[{ required: true, message: "Vui lòng nhập tên đối tác!" }]}
                                >
                                    <Input placeholder="Nhập tên đối tác" />
                                </Form.Item>
                                <Form.Item label="Liên hệ" name="counterpartyContact">
                                    <Input placeholder="Số điện thoại, email..." />
                                </Form.Item>
                                <Form.Item label="Ngày đáo hạn" name="dueDate">
                                    <DatePicker style={{ width: "100%" }} />
                                </Form.Item>
                                <Form.Item name="isSettled" valuePropName="checked">
                                    <label style={{ cursor: "pointer" }}>
                                        <input
                                            type="checkbox"
                                            checked={form.getFieldValue("isSettled")}
                                            onChange={(e) =>
                                                form.setFieldsValue({ isSettled: e.target.checked })
                                            }
                                            style={{ marginRight: 8 }}
                                        />
                                        Đã thanh toán
                                    </label>
                                </Form.Item>
                            </>
                        )}

                        {transactionType === "adjust" && (
                            <Form.Item
                                label="Lý do điều chỉnh"
                                name="adjustReason"
                                rules={[{ required: true, message: "Vui lòng nhập lý do!" }]}
                            >
                                <TextArea rows={3} placeholder="Nhập lý do điều chỉnh..." />
                            </Form.Item>
                        )}
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                        <Form.Item
                            label="Ngày"
                            name="date"
                            rules={[{ required: true, message: "Vui lòng chọn ngày!" }]}
                        >
                            <DatePicker
                                style={{ width: "100%" }}
                                format="DD/MM/YYYY"
                                showToday
                            />
                        </Form.Item>

                        <Form.Item label="Hình ảnh">
                            <Upload
                                beforeUpload={handleImageUpload}
                                showUploadList={false}
                                accept="image/*"
                            >
                                <button
                                    type="button"
                                    className="w-full border-2 border-dashed border-[#E5E7EB] rounded-lg p-4 hover:border-[#10B981] transition-colors"
                                >
                                    <UploadIcon className="mx-auto mb-2 text-[#6B7280]" size={24} />
                                    <p className="text-sm text-[#6B7280]">Tải lên hóa đơn</p>
                                </button>
                            </Upload>
                            {imageUrl && (
                                <div className="mt-2 relative inline-block">
                                    <img
                                        src={imageUrl}
                                        alt="Receipt"
                                        className="w-24 h-24 object-cover rounded-lg"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setImageUrl("")}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                        </Form.Item>

                        {/* Recurring Transaction */}
                        <Form.Item label="Giao dịch định kỳ">
                            <div className="space-y-3">
                                <Form.Item name="isRecurring" valuePropName="checked" noStyle>
                                    <Switch
                                        checked={isRecurring}
                                        onChange={(checked) => {
                                            setIsRecurring(checked);
                                            form.setFieldsValue({ isRecurring: checked });
                                        }}
                                    />
                                </Form.Item>
                                {isRecurring && (
                                    <>
                                        <Form.Item
                                            name="recurringType"
                                            rules={[
                                                { required: isRecurring, message: "Vui lòng chọn tần suất!" },
                                            ]}
                                        >
                                            <Radio.Group>
                                                {RECURRING_TYPES.map((type) => (
                                                    <Radio key={type.value} value={type.value}>
                                                        {type.label}
                                                    </Radio>
                                                ))}
                                            </Radio.Group>
                                        </Form.Item>
                                        <Form.Item label="Ngày kết thúc" name="endDate">
                                            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                                        </Form.Item>
                                    </>
                                )}
                            </div>
                        </Form.Item>
                    </div>
                </div>
            </Form>
        </Modal>
    );
};

export default TransactionModal;

