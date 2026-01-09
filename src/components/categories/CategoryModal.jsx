import { useEffect, useMemo, useState } from "react";
import { Modal, Form, Input, Select, Switch, message } from "antd";
import {
  Shapes,
  TrendingDown,
  TrendingUp,
  FolderTree,
  CheckCircle2,
  Search,
} from "lucide-react";
import {
  createCategoryAPI,
  updateCategoryAPI,
  getCategoriesAPI,
} from "../../services/api.category";

const { Option } = Select;

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
  const [iconSearch, setIconSearch] = useState("");

  const filteredIcons = useMemo(() => {
    const q = iconSearch.trim().toLowerCase();
    if (!q) return ICON_OPTIONS;
    return ICON_OPTIONS.filter(
      (x) =>
        x.name.toLowerCase().includes(q) ||
        x.value.toLowerCase().includes(q) ||
        x.label.includes(q)
    );
  }, [iconSearch]);

  const loadParentCategories = async (type, currentId) => {
    try {
      const res = await getCategoriesAPI();
      if (res?.EC === 0) {
        const categories = Array.isArray(res.data) ? res.data : [];
        const filtered = categories.filter(
          (cat) => cat.type === type && (!currentId || cat._id !== currentId)
        );
        setParentCategories(filtered);
      } else {
        setParentCategories([]);
      }
    } catch (e) {
      console.error(e);
      setParentCategories([]);
    }
  };

  useEffect(() => {
    if (!open) return;

    if (category) {
      const type = category.type || "expense";
      setCategoryType(type);
      setSelectedIcon(category.icon || "default");

      form.setFieldsValue({
        name: category.name,
        type,
        parent_id: category.parent_id || null,
        icon: category.icon || "default",
        is_default: category.is_default || false,
      });

      loadParentCategories(type, category._id);
    } else {
      form.resetFields();
      setCategoryType("expense");
      setSelectedIcon("default");
      setIconSearch("");

      form.setFieldsValue({
        type: "expense",
        icon: "default",
        is_default: false,
        parent_id: null,
      });

      loadParentCategories("expense", null);
    }
  }, [open, category, form]);

  const handleTypeChange = (type) => {
    setCategoryType(type);
    form.setFieldsValue({ type, parent_id: null });
    loadParentCategories(type, category?._id);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const payload = {
        name: (values.name || "").trim(),
        type: values.type,
        icon: values.icon || "default",
        is_default: !!values.is_default,
        ...(values.parent_id ? { parent_id: values.parent_id } : {}),
      };

      const res = category
        ? await updateCategoryAPI(category._id, { data: payload })
        : await createCategoryAPI({ data: payload });

      if (res?.EC === 0) {
        message.success(`${category ? "Cập nhật" : "Tạo"} danh mục thành công!`);
        onSuccess?.();
        onClose?.();
      } else {
        message.error(res?.message || "Thao tác thất bại!");
      }
    } catch (error) {
      if (error?.errorFields) message.error("Vui lòng điền đầy đủ thông tin!");
      else message.error("Có lỗi xảy ra!");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-xl font-extrabold text-slate-900">
          <Shapes className="text-emerald-600" size={24} />
          {category ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
        </div>
      }
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={680}
      centered
      okText="Lưu thông tin"
      cancelText="Hủy"
      okButtonProps={{
        className:
          "bg-emerald-600 hover:bg-emerald-700 border-emerald-600 hover:border-emerald-700 rounded-xl h-10 px-6 font-semibold shadow-sm",
      }}
      cancelButtonProps={{ className: "rounded-xl h-10 px-6" }}
    >
      <Form form={form} layout="vertical" className="mt-6">
        {/* 1) Type segmented */}
        <div className="mb-6 p-1 bg-emerald-50 rounded-2xl flex gap-1 border border-emerald-100">
          <button
            type="button"
            onClick={() => handleTypeChange("expense")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              categoryType === "expense"
                ? "bg-white shadow-sm text-emerald-700 ring-1 ring-emerald-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <TrendingDown size={18} /> Chi tiêu
          </button>

          <button
            type="button"
            onClick={() => handleTypeChange("income")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              categoryType === "income"
                ? "bg-white shadow-sm text-emerald-700 ring-1 ring-emerald-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <TrendingUp size={18} /> Thu nhập
          </button>

          {/* hidden fields */}
          <Form.Item name="type" hidden>
            <Input />
          </Form.Item>
        </div>

        {/* 2) Main fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <Form.Item
            label={<span className="font-medium text-slate-700">Tên danh mục</span>}
            name="name"
            rules={[
              { required: true, message: "Vui lòng nhập tên danh mục!" },
              { max: 40, message: "Tên danh mục tối đa 40 ký tự!" },
            ]}
            className="md:col-span-2"
          >
            <Input
              prefix={<Shapes size={18} className="text-slate-400 mr-1" />}
              placeholder="Ví dụ: Ăn uống, Lương, Hóa đơn..."
              className="h-11 rounded-xl border-slate-200 focus:border-emerald-400"
              maxLength={40}
              showCount
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="font-medium text-slate-700">Danh mục cha</span>
            }
            name="parent_id"
          >
            <Select
              allowClear
              showSearch
              placeholder="Chọn danh mục cha (tùy chọn)"
              className="h-11 w-full"
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children ?? "")
                  .toString()
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              suffixIcon={<FolderTree size={18} className="text-slate-400" />}
            >
              {parentCategories.map((p) => (
                <Option key={p._id} value={p._id}>
                  {p.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* Icon (hidden field to submit) */}
          <Form.Item name="icon" hidden>
            <Input />
          </Form.Item>

          <div className="md:col-span-2">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="font-medium text-slate-700">Icon</div>
              <div className="relative w-full max-w-xs">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                  placeholder="Tìm icon..."
                  className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300"
                />
              </div>
            </div>

            <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {filteredIcons.map((icon) => {
                  const active = selectedIcon === icon.value;
                  return (
                    <button
                      key={icon.value}
                      type="button"
                      onClick={() => {
                        setSelectedIcon(icon.value);
                        form.setFieldsValue({ icon: icon.value });
                      }}
                      className={`group p-3 rounded-xl border transition-all text-left ${
                        active
                          ? "border-emerald-300 bg-white ring-1 ring-emerald-200 shadow-sm"
                          : "border-slate-200 bg-white/70 hover:bg-white hover:border-emerald-200"
                      }`}
                      title={icon.name}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-2xl leading-none">{icon.label}</div>
                        <div
                          className={`h-2.5 w-2.5 rounded-full ${
                            active ? "bg-emerald-500" : "bg-slate-200"
                          }`}
                        />
                      </div>
                      <div className="mt-2 text-[11px] font-semibold text-slate-700 line-clamp-1">
                        {icon.name}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {icon.value}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 text-sm text-slate-600">
                Icon được chọn:{" "}
                <span className="font-semibold text-slate-800">
                  {ICON_OPTIONS.find((i) => i.value === selectedIcon)?.label}{" "}
                  {ICON_OPTIONS.find((i) => i.value === selectedIcon)?.name
                    ? `- ${
                        ICON_OPTIONS.find((i) => i.value === selectedIcon)?.name
                      }`
                    : ""}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3) Default switch – giống Wallet */}
        <div className="mt-6 flex items-center justify-between p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl shadow-sm ring-1 ring-emerald-100">
              <CheckCircle2 size={20} className="text-emerald-600" />
            </div>
            <div>
              <div className="font-semibold text-slate-800 text-sm">
                Đặt làm mặc định
              </div>
              <div className="text-xs text-slate-600">
                Tự động ưu tiên danh mục này khi tạo giao dịch mới
              </div>
            </div>
          </div>

          <Form.Item name="is_default" valuePropName="checked" noStyle>
            <Switch />
          </Form.Item>
        </div>
      </Form>

      {/* ép Switch ON màu emerald (đúng Money Lover) */}
      <style>{`
        .ant-switch.ant-switch-checked {
          background: #10B981 !important;
        }
      `}</style>
    </Modal>
  );
};

export default CategoryModal;