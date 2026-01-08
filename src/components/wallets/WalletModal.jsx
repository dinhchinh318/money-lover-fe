import { useState, useEffect } from "react";
import { Modal, Form, Input, Select, InputNumber, Switch, message } from "antd";
import { Wallet, Landmark, CheckCircle2, CreditCard } from "lucide-react";
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

  const handleTypeChange = (type) => {
    setWalletType(type);
    form.setFieldsValue({ type });
  };

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
        if (values.bankCode) walletData.bankCode = values.bankCode;
      }

      const res = wallet
        ? await updateWalletAPI(wallet._id, { data: walletData })
        : await createWalletAPI({ data: walletData });

      if (res.EC === 0) {
        message.success(`${wallet ? "Cập nhật" : "Tạo"} ví thành công!`);
        onSuccess();
        onClose();
      } else {
        message.error(res.message || "Thao tác thất bại!");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-xl font-extrabold text-slate-900">
          <Wallet className="text-emerald-600" size={24} />
          {wallet ? "Chỉnh sửa ví" : "Thêm ví mới"}
        </div>
      }
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={600}
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
        {/* 1. Wallet Type Selection */}
        <div className="mb-6 p-1 bg-emerald-50 rounded-2xl flex gap-1 border border-emerald-100">
          <button
            type="button"
            onClick={() => handleTypeChange("cash")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              walletType === "cash"
                ? "bg-white shadow-sm text-emerald-700 ring-1 ring-emerald-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <Wallet size={18} /> Tiền mặt
          </button>

          <button
            type="button"
            onClick={() => handleTypeChange("bank")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              walletType === "bank"
                ? "bg-white shadow-sm text-emerald-700 ring-1 ring-emerald-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <Landmark size={18} /> Ngân hàng
          </button>

          <Form.Item name="type" hidden>
            <Input />
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          {/* Tên ví */}
          <Form.Item
            label={<span className="font-medium text-slate-700">Tên ví</span>}
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập tên ví!" }]}
            className="col-span-2"
          >
            <Input
              prefix={<CreditCard size={18} className="text-slate-400 mr-1" />}
              placeholder="Ví dụ: Chi tiêu hàng ngày, Quỹ tiết kiệm..."
              className="h-11 rounded-xl border-slate-200 focus:border-emerald-400"
            />
          </Form.Item>

          {/* Tiền tệ */}
          <Form.Item
            label={<span className="font-medium text-slate-700">Tiền tệ</span>}
            name="currency"
            rules={[{ required: true, message: "Chọn đơn vị!" }]}
          >
            <Select className="h-11 w-full" placeholder="Chọn tiền tệ">
              <Option value="VND">VND - Việt Nam Đồng</Option>
              <Option value="USD">USD - Đô la Mỹ</Option>
              <Option value="EUR">EUR - Euro</Option>
            </Select>
          </Form.Item>

          {/* Số dư ban đầu */}
          <Form.Item
            label={<span className="font-medium text-slate-700">Số dư hiện tại</span>}
            name="balance"
            rules={[{ required: true, message: "Nhập số dư!" }]}
          >
            <InputNumber
              className="w-full h-11 !rounded-xl flex items-center border-slate-200"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
              placeholder="0"
              min={0}
            />
          </Form.Item>
        </div>

        {/* Bank Fields */}
        {walletType === "bank" && (
          <div className="mt-2 p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 mb-2 text-emerald-800 font-semibold">
              <Landmark size={18} /> Thông tin tài khoản
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                label={<span className="text-slate-700 font-medium">Tên ngân hàng</span>}
                name="bankName"
                rules={[{ required: true, message: "Nhập tên ngân hàng!" }]}
                className="mb-0"
              >
                <Input placeholder="VD: Vietcombank" className="rounded-xl" />
              </Form.Item>

              <Form.Item
                label={<span className="text-slate-700 font-medium">Mã ngân hàng (Swift)</span>}
                name="bankCode"
                className="mb-0"
              >
                <Input placeholder="VD: VCB" className="rounded-xl" />
              </Form.Item>

              <Form.Item
                label={<span className="text-slate-700 font-medium">Số tài khoản</span>}
                name="bankAccount"
                rules={[{ required: true, message: "Nhập số tài khoản!" }]}
                className="col-span-2 mb-0"
              >
                <Input placeholder="Nhập số tài khoản ngân hàng" className="rounded-xl" />
              </Form.Item>
            </div>
          </div>
        )}

        {/* Mặc định */}
        <div className="mt-6 flex items-center justify-between p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl shadow-sm ring-1 ring-emerald-100">
              <CheckCircle2 size={20} className="text-emerald-600" />
            </div>
            <div>
              <div className="font-semibold text-slate-800 text-sm">Đặt làm mặc định</div>
              <div className="text-xs text-slate-600">
                Tự động chọn ví này khi tạo giao dịch mới
              </div>
            </div>
          </div>

          {/* NOTE: Antd Switch màu nền tùy theme; Tailwind chỉ ăn phần wrapper.
              Nếu muốn switch luôn xanh emerald khi ON, thêm CSS nhỏ ở dưới. */}
          <Form.Item name="is_default" valuePropName="checked" noStyle>
            <Switch />
          </Form.Item>
        </div>
      </Form>

      {/* Optional: ép Switch ON màu emerald (đẹp đúng Money Lover) */}
      <style>{`
        .ant-switch.ant-switch-checked {
          background: #10B981 !important;
        }
      `}</style>
    </Modal>
  );
};

export default WalletModal;
