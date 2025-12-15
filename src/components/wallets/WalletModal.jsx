import { useState, useEffect } from "react";
import { Modal, Form, Input, Radio, Select, InputNumber, message } from "antd";
import { createWalletAPI, updateWalletAPI } from "../../services/api.wallet";

const { Option } = Select;

const WalletModal = ({ open, onClose, wallet, onSuccess }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [walletType, setWalletType] = useState("cash");

    useEffect(() => {
        if (open) {
            if (wallet) {
                form.setFieldsValue({
                    name: wallet.name,
                    type: wallet.type,
                    currency: wallet.currency || "VND",
                    balance: wallet.balance || 0,
                    is_default: wallet.is_default || false,
                    bankName: wallet.bankName || "",
                    bankAccount: wallet.bankAccount || "",
                    bankCode: wallet.bankCode || "",
                });
                setWalletType(wallet.type || "cash");
            } else {
                form.resetFields();
                setWalletType("cash");
            }
        }
    }, [open, wallet, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            const walletData = {
                name: values.name,
                type: values.type,
                currency: values.currency || "VND",
                balance: values.balance || 0,
                is_default: values.is_default || false,
            };

            if (values.type === "bank") {
                walletData.bankName = values.bankName;
                walletData.bankAccount = values.bankAccount;
                if (values.bankCode) {
                    walletData.bankCode = values.bankCode;
                }
            }

            if (wallet) {
                // Update
                const res = await updateWalletAPI(wallet._id, { data: walletData });
                if (res.EC === 0) {
                    message.success("Cập nhật ví thành công!");
                    onSuccess();
                    onClose();
                } else {
                    message.error(res.message || "Cập nhật ví thất bại!");
                }
            } else {
                // Create
                const res = await createWalletAPI({ data: walletData });
                if (res.EC === 0) {
                    message.success("Tạo ví thành công!");
                    onSuccess();
                    onClose();
                } else {
                    message.error(res.message || "Tạo ví thất bại!");
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

    return (
        <Modal
            title={wallet ? "Chỉnh sửa ví" : "Thêm ví mới"}
            open={open}
            onCancel={onClose}
            onOk={handleSubmit}
            confirmLoading={loading}
            width={600}
            okText="Lưu"
            cancelText="Hủy"
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={{
                    type: "cash",
                    currency: "VND",
                    balance: 0,
                    is_default: false,
                }}
            >
                <Form.Item
                    label="Tên ví"
                    name="name"
                    rules={[{ required: true, message: "Vui lòng nhập tên ví!" }]}
                >
                    <Input placeholder="Ví dụ: Ví tiết kiệm" />
                </Form.Item>

                <Form.Item
                    label="Loại ví"
                    name="type"
                    rules={[{ required: true, message: "Vui lòng chọn loại ví!" }]}
                >
                    <Radio.Group onChange={(e) => setWalletType(e.target.value)}>
                        <Radio value="cash">Tiền mặt</Radio>
                        <Radio value="bank">Ngân hàng</Radio>
                    </Radio.Group>
                </Form.Item>

                <Form.Item
                    label="Tiền tệ"
                    name="currency"
                    rules={[{ required: true, message: "Vui lòng chọn tiền tệ!" }]}
                >
                    <Select>
                        <Option value="VND">VND - Đồng Việt Nam</Option>
                        <Option value="USD">USD - Đô la Mỹ</Option>
                        <Option value="EUR">EUR - Euro</Option>
                        <Option value="GBP">GBP - Bảng Anh</Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    label="Số dư ban đầu"
                    name="balance"
                    rules={[{ required: true, message: "Vui lòng nhập số dư!" }]}
                >
                    <InputNumber
                        style={{ width: "100%" }}
                        placeholder="0"
                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                        parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                        min={0}
                    />
                </Form.Item>

                <Form.Item name="is_default" valuePropName="checked">
                    <label style={{ cursor: "pointer" }}>
                        <input
                            type="checkbox"
                            checked={form.getFieldValue("is_default")}
                            onChange={(e) => form.setFieldsValue({ is_default: e.target.checked })}
                            style={{ marginRight: 8 }}
                        />
                        Đặt làm ví mặc định
                    </label>
                </Form.Item>

                {walletType === "bank" && (
                    <>
                        <Form.Item
                            label="Tên ngân hàng"
                            name="bankName"
                            rules={[
                                { required: true, message: "Vui lòng nhập tên ngân hàng!" },
                            ]}
                        >
                            <Input placeholder="Ví dụ: Vietcombank" />
                        </Form.Item>

                        <Form.Item
                            label="Số tài khoản"
                            name="bankAccount"
                            rules={[
                                { required: true, message: "Vui lòng nhập số tài khoản!" },
                            ]}
                        >
                            <Input placeholder="Ví dụ: 1234567890" />
                        </Form.Item>

                        <Form.Item label="Mã ngân hàng" name="bankCode">
                            <Input placeholder="Ví dụ: VCB" />
                        </Form.Item>
                    </>
                )}
            </Form>
        </Modal>
    );
};

export default WalletModal;

