import { useState, useEffect } from "react";
import { Modal, Form, Input, Select, InputNumber, DatePicker, Radio, message } from "antd";
import { createBudgetAPI, updateBudgetAPI } from "../../services/api.budget";
import { getCategoriesAPI } from "../../services/api.category";
import { getWalletsAPI } from "../../services/api.wallet";
import dayjs from "dayjs";

const { Option } = Select;
const { TextArea } = Input;

const PERIOD_OPTIONS = [
    { value: "weekly", label: "Hàng tuần" },
    { value: "monthly", label: "Hàng tháng" },
    { value: "yearly", label: "Hàng năm" },
    { value: "custom", label: "Tùy chỉnh" },
];

const BudgetModal = ({ open, onClose, budget, onSuccess }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [period, setPeriod] = useState("monthly");
    const [categories, setCategories] = useState([]);
    const [wallets, setWallets] = useState([]);

    useEffect(() => {
        if (open) {
            loadCategories();
            loadWallets();
            if (budget) {
                form.setFieldsValue({
                    name: budget.name || "",
                    category: budget.category?._id || budget.category,
                    wallet: budget.wallet?._id || budget.wallet || null,
                    limit_amount: budget.limit_amount || 0,
                    period: budget.period || "monthly",
                    start_date: budget.start_date ? dayjs(budget.start_date) : null,
                    end_date: budget.end_date ? dayjs(budget.end_date) : null,
                    description: budget.description || "",
                });
                setPeriod(budget.period || "monthly");
            } else {
                form.resetFields();
                form.setFieldsValue({
                    period: "monthly",
                    limit_amount: 0,
                });
                setPeriod("monthly");
            }
        }
    }, [open, budget, form]);

    const loadCategories = async () => {
        try {
            const res = await getCategoriesAPI();
            if (res.EC === 0 && res.data) {
                const categoriesData = Array.isArray(res.data) ? res.data : [];
                // Chỉ lấy danh mục expense
                setCategories(categoriesData.filter((cat) => cat.type === "expense"));
            }
        } catch (error) {
            console.error("Error loading categories:", error);
        }
    };

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

            const budgetData = {
                name: values.name?.trim() || "",
                category: values.category,
                limit_amount: values.limit_amount,
                period: values.period,
                description: values.description || "",
            };

            if (values.wallet) {
                budgetData.wallet = values.wallet;
            }

            if (values.period === "custom") {
                if (!values.start_date || !values.end_date) {
                    message.error("Vui lòng chọn ngày bắt đầu và kết thúc!");
                    setLoading(false);
                    return;
                }
                budgetData.start_date = values.start_date.toISOString();
                budgetData.end_date = values.end_date.toISOString();
            } else {
                // Set dates based on period
                const today = dayjs();
                if (values.period === "weekly") {
                    budgetData.start_date = today.startOf("week").toISOString();
                    budgetData.end_date = today.endOf("week").toISOString();
                } else if (values.period === "monthly") {
                    budgetData.start_date = today.startOf("month").toISOString();
                    budgetData.end_date = today.endOf("month").toISOString();
                } else if (values.period === "yearly") {
                    budgetData.start_date = today.startOf("year").toISOString();
                    budgetData.end_date = today.endOf("year").toISOString();
                }
            }

            if (budget) {
                // Update
                const res = await updateBudgetAPI(budget._id, { data: budgetData });
                if (res.status || res.EC === 0) {
                    message.success("Cập nhật ngân sách thành công!");
                    onSuccess();
                    onClose();
                } else {
                    message.error(res.message || "Cập nhật ngân sách thất bại!");
                }
            } else {
                // Create
                const res = await createBudgetAPI({ data: budgetData });
                if (res.status || res.EC === 0) {
                    message.success("Tạo ngân sách thành công!");
                    onSuccess();
                    onClose();
                } else {
                    message.error(res.message || "Tạo ngân sách thất bại!");
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
            title={budget ? "Chỉnh sửa ngân sách" : "Thêm ngân sách mới"}
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
                    period: "monthly",
                    limit_amount: 0,
                }}
            >
                <Form.Item
                    label="Tên ngân sách"
                    name="name"
                    tooltip="Để trống sẽ dùng tên danh mục"
                >
                    <Input placeholder="Ví dụ: Ngân sách ăn uống tháng 12" />
                </Form.Item>

                <Form.Item
                    label="Danh mục"
                    name="category"
                    rules={[{ required: true, message: "Vui lòng chọn danh mục!" }]}
                >
                    <Select placeholder="Chọn danh mục chi tiêu" showSearch>
                        {categories.map((category) => (
                            <Option key={category._id} value={category._id}>
                                {category.name}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item label="Ví" name="wallet">
                    <Select placeholder="Tất cả ví (tùy chọn)" allowClear>
                        <Option value={null}>Tất cả ví</Option>
                        {wallets.map((wallet) => (
                            <Option key={wallet._id} value={wallet._id}>
                                {wallet.name} ({formatCurrency(wallet.balance || 0)})
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    label="Hạn mức"
                    name="limit_amount"
                    rules={[
                        { required: true, message: "Vui lòng nhập hạn mức!" },
                        { type: "number", min: 1, message: "Hạn mức phải lớn hơn 0!" },
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
                    label="Kỳ ngân sách"
                    name="period"
                    rules={[{ required: true, message: "Vui lòng chọn kỳ ngân sách!" }]}
                >
                    <Radio.Group
                        onChange={(e) => {
                            setPeriod(e.target.value);
                            if (e.target.value !== "custom") {
                                form.setFieldsValue({ start_date: null, end_date: null });
                            }
                        }}
                    >
                        {PERIOD_OPTIONS.map((option) => (
                            <Radio key={option.value} value={option.value}>
                                {option.label}
                            </Radio>
                        ))}
                    </Radio.Group>
                </Form.Item>

                {period === "custom" && (
                    <>
                        <Form.Item
                            label="Ngày bắt đầu"
                            name="start_date"
                            rules={[{ required: true, message: "Vui lòng chọn ngày bắt đầu!" }]}
                        >
                            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                        </Form.Item>
                        <Form.Item
                            label="Ngày kết thúc"
                            name="end_date"
                            rules={[{ required: true, message: "Vui lòng chọn ngày kết thúc!" }]}
                        >
                            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                        </Form.Item>
                    </>
                )}

                <Form.Item label="Mô tả" name="description">
                    <TextArea rows={3} placeholder="Nhập mô tả (tùy chọn)" />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default BudgetModal;



