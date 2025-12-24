import { useState, useEffect } from "react";
import { Modal, Form, Input, Select, InputNumber, DatePicker, message } from "antd";
import { createSavingGoalAPI, updateSavingGoalAPI } from "../../services/api.savingGoal";
import { getWalletsAPI } from "../../services/api.wallet";
import dayjs from "dayjs";

const { Option } = Select;
const { TextArea } = Input;

const SavingGoalModal = ({ open, onClose, goal, onSuccess }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [wallets, setWallets] = useState([]);

    useEffect(() => {
        if (open) {
            loadWallets();
            if (goal) {
                form.setFieldsValue({
                    name: goal.name,
                    wallet: goal.wallet?._id || goal.wallet,
                    target_amount: goal.target_amount || 0,
                    current_amount: goal.current_amount || 0,
                    target_date: goal.target_date ? dayjs(goal.target_date) : null,
                    description: goal.description || "",
                });
            } else {
                form.resetFields();
                form.setFieldsValue({
                    target_amount: 0,
                    current_amount: 0,
                });
            }
        }
    }, [open, goal, form]);

    const loadWallets = async () => {
        try {
            const res = await getWalletsAPI();
            if (res.EC === 0 && res.data) {
                const walletsData = Array.isArray(res.data) ? res.data : [];
                setWallets(walletsData.filter((w) => !w.is_archived));
            }
        } catch (error) {
            console.error("Error loading wallets:", error);
        }
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            if (values.current_amount > values.target_amount) {
                message.error("Số tiền hiện tại không được vượt quá số tiền mục tiêu!");
                setLoading(false);
                return;
            }

            const goalData = {
                name: values.name.trim(),
                wallet: values.wallet,
                target_amount: values.target_amount,
                current_amount: values.current_amount || 0,
                description: values.description || "",
            };

            if (values.target_date) {
                goalData.target_date = values.target_date.toISOString();
            }

            if (goal) {
                const res = await updateSavingGoalAPI(goal._id, { data: goalData });
                if (res.status || res.EC === 0) {
                    message.success("Cập nhật mục tiêu thành công!");
                    onSuccess();
                    onClose();
                } else {
                    message.error(res.message || "Cập nhật thất bại!");
                }
            } else {
                const res = await createSavingGoalAPI({ data: goalData });
                if (res.status || res.EC === 0) {
                    message.success("Tạo mục tiêu thành công!");
                    onSuccess();
                    onClose();
                } else {
                    message.error(res.message || "Tạo thất bại!");
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

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount);
    };

    return (
        <Modal
            title={goal ? "Chỉnh sửa mục tiêu tiết kiệm" : "Thêm mục tiêu tiết kiệm"}
            open={open}
            onCancel={onClose}
            onOk={handleSubmit}
            confirmLoading={loading}
            width={600}
            okText="Lưu"
            cancelText="Hủy"
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    label="Tên mục tiêu"
                    name="name"
                    rules={[{ required: true, message: "Vui lòng nhập tên mục tiêu!" }]}
                >
                    <Input placeholder="Ví dụ: Mua xe máy" />
                </Form.Item>

                <Form.Item
                    label="Ví"
                    name="wallet"
                    rules={[{ required: true, message: "Vui lòng chọn ví!" }]}
                >
                    <Select placeholder="Chọn ví">
                        {wallets.map((wallet) => (
                            <Option key={wallet._id} value={wallet._id}>
                                {wallet.name} ({formatCurrency(wallet.balance || 0)})
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    label="Số tiền mục tiêu"
                    name="target_amount"
                    rules={[
                        { required: true, message: "Vui lòng nhập số tiền mục tiêu!" },
                        { type: "number", min: 1, message: "Số tiền phải lớn hơn 0!" },
                    ]}
                >
                    <InputNumber
                        style={{ width: "100%" }}
                        placeholder="0"
                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                        parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                        min={1}
                        addonAfter="VND"
                    />
                </Form.Item>

                <Form.Item
                    label="Số tiền hiện tại"
                    name="current_amount"
                    rules={[
                        { required: true, message: "Vui lòng nhập số tiền hiện tại!" },
                        { type: "number", min: 0, message: "Số tiền không được âm!" },
                    ]}
                >
                    <InputNumber
                        style={{ width: "100%" }}
                        placeholder="0"
                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                        parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                        min={0}
                        addonAfter="VND"
                    />
                </Form.Item>

                <Form.Item
                    label="Ngày đạt mục tiêu"
                    name="target_date"
                    tooltip="Để trống nếu không có hạn"
                >
                    <DatePicker
                        style={{ width: "100%" }}
                        format="DD/MM/YYYY"
                        disabledDate={(current) => current && current < dayjs().startOf("day")}
                    />
                </Form.Item>

                <Form.Item label="Mô tả" name="description">
                    <TextArea rows={3} placeholder="Nhập mô tả (tùy chọn)" />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default SavingGoalModal;




