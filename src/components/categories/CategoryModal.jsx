import { useState, useEffect } from "react";
import { Modal, Form, Input, Radio, Select, message } from "antd";
import { createCategoryAPI, updateCategoryAPI, getCategoriesAPI } from "../../services/api.category";

const { Option } = Select;

// Icon options - có thể mở rộng thêm
const ICON_OPTIONS = [
    { value: "default", label: "📁", name: "Mặc định" },
    { value: "food", label: "🍔", name: "Ăn uống" },
    { value: "shopping", label: "🛒", name: "Mua sắm" },
    { value: "transport", label: "🚗", name: "Giao thông" },
    { value: "bills", label: "💳", name: "Hóa đơn" },
    { value: "entertainment", label: "🎬", name: "Giải trí" },
    { value: "health", label: "🏥", name: "Sức khỏe" },
    { value: "education", label: "📚", name: "Giáo dục" },
    { value: "salary", label: "💰", name: "Lương" },
    { value: "investment", label: "📈", name: "Đầu tư" },
    { value: "gift", label: "🎁", name: "Quà tặng" },
    { value: "other", label: "📦", name: "Khác" },
];

const CategoryModal = ({ open, onClose, category, onSuccess }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [categoryType, setCategoryType] = useState("expense");
    const [parentCategories, setParentCategories] = useState([]);
    const [selectedIcon, setSelectedIcon] = useState("default");

    useEffect(() => {
        if (open) {
            loadParentCategories();
            if (category) {
                form.setFieldsValue({
                    name: category.name,
                    type: category.type,
                    parent_id: category.parent_id || null,
                    icon: category.icon || "default",
                    is_default: category.is_default || false,
                });
                setCategoryType(category.type);
                setSelectedIcon(category.icon || "default");
            } else {
                form.resetFields();
                form.setFieldsValue({
                    type: "expense",
                    icon: "default",
                    is_default: false,
                });
                setCategoryType("expense");
                setSelectedIcon("default");
            }
        }
    }, [open, category, form]);

    const loadParentCategories = async () => {
        try {
            const res = await getCategoriesAPI();
            if (res.EC === 0 && res.data) {
                const categories = Array.isArray(res.data) ? res.data : [];
                // Filter theo type và loại bỏ chính nó nếu đang edit
                const filtered = categories.filter(
                    (cat) =>
                        cat.type === categoryType &&
                        (!category || cat._id !== category._id)
                );
                setParentCategories(filtered);
            }
        } catch (error) {
            console.error("Error loading parent categories:", error);
        }
    };

    useEffect(() => {
        if (open) {
            loadParentCategories();
        }
    }, [categoryType, open]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            const categoryData = {
                name: values.name.trim(),
                type: values.type,
                icon: values.icon || "default",
                is_default: values.is_default || false,
            };

            if (values.parent_id) {
                categoryData.parent_id = values.parent_id;
            }

            if (category) {
                // Update
                const res = await updateCategoryAPI(category._id, { data: categoryData });
                if (res.EC === 0) {
                    message.success("Cập nhật danh mục thành công!");
                    onSuccess();
                    onClose();
                } else {
                    message.error(res.message || "Cập nhật danh mục thất bại!");
                }
            } else {
                // Create
                const res = await createCategoryAPI({ data: categoryData });
                if (res.EC === 0) {
                    message.success("Tạo danh mục thành công!");
                    onSuccess();
                    onClose();
                } else {
                    message.error(res.message || "Tạo danh mục thất bại!");
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
            title={category ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
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
                    type: "expense",
                    icon: "default",
                    is_default: false,
                }}
            >
                <Form.Item
                    label="Tên danh mục"
                    name="name"
                    rules={[{ required: true, message: "Vui lòng nhập tên danh mục!" }]}
                >
                    <Input placeholder="Ví dụ: Ăn uống" />
                </Form.Item>

                <Form.Item
                    label="Loại danh mục"
                    name="type"
                    rules={[{ required: true, message: "Vui lòng chọn loại danh mục!" }]}
                >
                    <Radio.Group
                        onChange={(e) => {
                            setCategoryType(e.target.value);
                            form.setFieldsValue({ parent_id: null });
                        }}
                    >
                        <Radio value="expense" style={{ color: "#EF4444" }}>
                            Chi tiêu
                        </Radio>
                        <Radio value="income" style={{ color: "#10B981" }}>
                            Thu nhập
                        </Radio>
                    </Radio.Group>
                </Form.Item>

                <Form.Item label="Danh mục cha" name="parent_id">
                    <Select
                        placeholder="Chọn danh mục cha (tùy chọn)"
                        allowClear
                        onChange={() => {
                            // Reload parent categories khi thay đổi
                        }}
                    >
                        {parentCategories.map((parent) => (
                            <Option key={parent._id} value={parent._id}>
                                {parent.name}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    label="Icon"
                    name="icon"
                    rules={[{ required: true, message: "Vui lòng chọn icon!" }]}
                >
                    <div>
                        <div className="grid grid-cols-6 gap-3 mb-4">
                            {ICON_OPTIONS.map((icon) => (
                                <button
                                    key={icon.value}
                                    type="button"
                                    onClick={() => {
                                        setSelectedIcon(icon.value);
                                        form.setFieldsValue({ icon: icon.value });
                                    }}
                                    className={`p-3 rounded-lg border-2 transition-all hover:scale-110 ${
                                        selectedIcon === icon.value
                                            ? "border-[#10B981] bg-[#10B981]/10"
                                            : "border-[#E5E7EB] hover:border-[#10B981]"
                                    }`}
                                >
                                    <div className="text-2xl">{icon.label}</div>
                                    <div className="text-xs text-[#6B7280] mt-1">{icon.name}</div>
                                </button>
                            ))}
                        </div>
                        <div className="text-sm text-[#6B7280]">
                            Icon được chọn: {ICON_OPTIONS.find((i) => i.value === selectedIcon)?.label}
                        </div>
                    </div>
                </Form.Item>

                {!category && (
                    <Form.Item name="is_default" valuePropName="checked">
                        <label style={{ cursor: "pointer" }}>
                            <input
                                type="checkbox"
                                checked={form.getFieldValue("is_default")}
                                onChange={(e) => form.setFieldsValue({ is_default: e.target.checked })}
                                style={{ marginRight: 8 }}
                            />
                            Đặt làm danh mục mặc định
                        </label>
                    </Form.Item>
                )}
            </Form>
        </Modal>
    );
};

export default CategoryModal;




