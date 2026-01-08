import { useState, useEffect } from "react";
import { Modal, Form, Input, Select, InputNumber, DatePicker, Radio, Switch, message } from "antd";
import { createRecurringBillAPI, updateRecurringBillAPI } from "../../services/api.recurringBill";
import { getWalletsAPI } from "../../services/api.wallet";
import { getCategoriesAPI } from "../../services/api.category";
import dayjs from "dayjs";

const { Option } = Select;
const { TextArea } = Input;

const FREQUENCY_OPTIONS = [
    { value: "daily", label: "Hàng ngày" },
    { value: "weekly", label: "Hàng tuần" },
    { value: "biweekly", label: "2 tuần một lần" },
    { value: "monthly", label: "Hàng tháng" },
    { value: "yearly", label: "Hàng năm" },
    { value: "custom", label: "Tùy chỉnh" },
];

const RecurringBillModal = ({ open, onClose, bill, onSuccess }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [billType, setBillType] = useState("expense");
    const [frequency, setFrequency] = useState("monthly");
    const [wallets, setWallets] = useState([]);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        if (open) {
            loadWallets();
            loadCategories();
            if (bill) {
                form.setFieldsValue({
                    name: bill.name,
                    type: bill.type,
                    wallet: bill.wallet?._id || bill.wallet,
                    category: bill.category?._id || bill.category || null,
                    amount: bill.amount,
                    frequency: bill.frequency || "monthly",
                    cron_rule: bill.cron_rule || "",
                    next_run: bill.next_run ? dayjs(bill.next_run) : dayjs().add(1, "day"),
                    ends_at: bill.ends_at ? dayjs(bill.ends_at) : null,
                    active: bill.active !== undefined ? bill.active : true,
                    auto_create_transaction: bill.auto_create_transaction !== undefined ? bill.auto_create_transaction : true,
                    description: bill.description || "",
                });
                setBillType(bill.type);
                setFrequency(bill.frequency || "monthly");
            } else {
                form.resetFields();
                form.setFieldsValue({
                    type: "expense",
                    frequency: "monthly",
                    next_run: dayjs().add(1, "day"),
                    active: true,
                    auto_create_transaction: true,
                });
                setBillType("expense");
                setFrequency("monthly");
            }
        }
    }, [open, bill, form]);

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

    const loadCategories = async () => {
        try {
            const res = await getCategoriesAPI();
            if (res.EC === 0 && res.data) {
                const categoriesData = Array.isArray(res.data) ? res.data : [];
                setCategories(categoriesData);
            }
        } catch (error) {
            console.error("Error loading categories:", error);
        }
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            const billData = {
                name: values.name.trim(),
                type: values.type,
                walletId: values.wallet,
                categoryId: values.category,
                amount: values.amount,
                frequency: values.frequency,
                next_run: values.next_run.toISOString(),
                active: values.active,
                auto_create_transaction: values.auto_create_transaction,
                description: values.description || "",
            };

            if (values.category) {
                billData.category = values.category;
            }

            if (values.ends_at) {
                billData.ends_at = values.ends_at.toISOString();
            }

            if (values.frequency === "custom" && values.cron_rule) {
                billData.cron_rule = values.cron_rule;
            }

            if (bill) {
                const res = await updateRecurringBillAPI(bill._id, { data: billData });
                if (res.status || res.EC === 0) {
                    message.success("Cập nhật hóa đơn định kỳ thành công!");
                    onSuccess();
                    onClose();
                } else {
                    message.error(res.message || "Cập nhật thất bại!");
                }
            } else {
                const res = await createRecurringBillAPI({ data: billData });
                if (res.status || res.EC === 0) {
                    message.success("Tạo hóa đơn định kỳ thành công!");
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
            title={bill ? "Chỉnh sửa hóa đơn định kỳ" : "Thêm hóa đơn định kỳ"}
            open={open}
            onCancel={onClose}
            onOk={handleSubmit}
            confirmLoading={loading}
            width={700}
            okText="Lưu"
            cancelText="Hủy"
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    label="Tên hóa đơn"
                    name="name"
                    rules={[{ required: true, message: "Vui lòng nhập tên hóa đơn!" }]}
                >
                    <Input placeholder="Ví dụ: Tiền điện hàng tháng" />
                </Form.Item>

                <Form.Item
                    label="Loại"
                    name="type"
                    rules={[{ required: true, message: "Vui lòng chọn loại!" }]}
                >
                    <Radio.Group onChange={(e) => setBillType(e.target.value)}>
                        <Radio value="expense" style={{ color: "#EF4444" }}>
                            Chi tiêu
                        </Radio>
                        <Radio value="income" style={{ color: "#10B981" }}>
                            Thu nhập
                        </Radio>
                    </Radio.Group>
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
                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                        parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                        min={1}
                        addonAfter="VND"
                    />
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

                <Form.Item label="Danh mục" name="category"
                rules={[{ required: true, message: "Vui lòng chọn danh mục!" }]}
                >
                    <Select placeholder="Chọn danh mục">
                        {categories
                            .filter((cat) => cat.type === billType)
                            .map((category) => (
                                <Option key={category._id} value={category._id}>
                                    {category.name}
                                </Option>
                            ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    label="Tần suất"
                    name="frequency"
                    rules={[{ required: true, message: "Vui lòng chọn tần suất!" }]}
                >
                    <Radio.Group onChange={(e) => setFrequency(e.target.value)}>
                        {FREQUENCY_OPTIONS.map((option) => (
                            <Radio key={option.value} value={option.value}>
                                {option.label}
                            </Radio>
                        ))}
                    </Radio.Group>
                </Form.Item>

                {frequency === "custom" && (
                    <Form.Item
                        label="Cron Rule"
                        name="cron_rule"
                        rules={[{ required: true, message: "Vui lòng nhập cron rule!" }]}
                        tooltip="Ví dụ: 0 0 1 * * (chạy vào 00:00 ngày 1 mỗi tháng)"
                    >
                        <Input placeholder="0 0 1 * *" />
                    </Form.Item>
                )}

                <Form.Item
                    label="Lần thanh toán tiếp theo"
                    name="next_run"
                    rules={[{ required: true, message: "Vui lòng chọn ngày!" }]}
                >
                    <DatePicker
                        style={{ width: "100%" }}
                        format="DD/MM/YYYY"
                        showTime
                        disabledDate={(current) => current && current < dayjs().startOf("day")}
                    />
                </Form.Item>

                <Form.Item label="Ngày kết thúc" name="ends_at">
                    <DatePicker
                        style={{ width: "100%" }}
                        format="DD/MM/YYYY"
                        disabledDate={(current) => {
                            const nextRun = form.getFieldValue("next_run");
                            return current && nextRun && current < dayjs(nextRun).startOf("day");
                        }}
                    />
                </Form.Item>

                <Form.Item label="Mô tả" name="description">
                    <TextArea rows={3} placeholder="Nhập mô tả (tùy chọn)" />
                </Form.Item>

                <Form.Item name="active" valuePropName="checked" initialValue={true}>
                        <Switch/>
                            <span style={{marginLeft: 8}}> Đang hoạt động </span>
                </Form.Item>

                <Form.Item name="auto_create_transaction" valuePropName="checked" initialValue={true}>
                        <Switch/>
                            <span style={{marginLeft: 8}}> Tự động tạo giao dịch </span>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default RecurringBillModal;




