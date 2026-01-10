import { useState, useEffect } from "react";
import { Modal, Form, Input, Select, InputNumber, Switch, message } from "antd";
import { Wallet, Landmark, CheckCircle2, CreditCard } from "lucide-react";
import { createWalletAPI, updateWalletAPI } from "../../services/api.wallet";

// ✅ i18n
import { useTranslation } from "react-i18next";

const { Option } = Select;

const WalletModal = ({ open, onClose, wallet, onSuccess }) => {
  const { t } = useTranslation();

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

      if (res?.EC === 0) {
        message.success(
          wallet ? t("wallet.modal.toast.updateSuccess") : t("wallet.modal.toast.createSuccess")
        );
        onSuccess?.();
        onClose?.();
      } else {
        message.error(res?.message || t("wallet.modal.toast.actionFail"));
      }
    } catch (error) {
      console.error(error);
      // validateFields lỗi thì antd tự show rồi, nên không cần toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-xl font-extrabold text-slate-900">
          <Wallet className="text-emerald-600" size={24} />
          {wallet ? t("wallet.modal.title.edit") : t("wallet.modal.title.create")}
        </div>
      }
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={600}
      centered
      okText={t("wallet.modal.actions.save")}
      cancelText={t("wallet.modal.actions.cancel")}
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
            <Wallet size={18} /> {t("wallet.modal.type.cash")}
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
            <Landmark size={18} /> {t("wallet.modal.type.bank")}
          </button>

          <Form.Item name="type" hidden>
            <Input />
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          {/* Tên ví */}
          <Form.Item
            label={<span className="font-medium text-slate-700">{t("wallet.modal.fields.name.label")}</span>}
            name="name"
            rules={[{ required: true, message: t("wallet.modal.fields.name.required") }]}
            className="col-span-2"
          >
            <Input
              prefix={<CreditCard size={18} className="text-slate-400 mr-1" />}
              placeholder={t("wallet.modal.fields.name.placeholder")}
              className="h-11 rounded-xl border-slate-200 focus:border-emerald-400"
            />
          </Form.Item>

          {/* Tiền tệ */}
          <Form.Item
            label={<span className="font-medium text-slate-700">{t("wallet.modal.fields.currency.label")}</span>}
            name="currency"
            rules={[{ required: true, message: t("wallet.modal.fields.currency.required") }]}
          >
            <Select className="h-11 w-full" placeholder={t("wallet.modal.fields.currency.placeholder")}>
              <Option value="VND">{t("wallet.modal.fields.currency.vnd")}</Option>
            </Select>
          </Form.Item>

          {/* Số dư ban đầu */}
          <Form.Item
            label={<span className="font-medium text-slate-700">{t("wallet.modal.fields.balance.label")}</span>}
            name="balance"
            rules={[{ required: true, message: t("wallet.modal.fields.balance.required") }]}
          >
            <InputNumber
              className="w-full h-11 !rounded-xl flex items-center border-slate-200"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(value) => (value || "").replace(/\$\s?|(,*)/g, "")}
              placeholder={t("wallet.modal.fields.balance.placeholder")}
              min={0}
            />
          </Form.Item>
        </div>

        {/* Bank Fields */}
        {walletType === "bank" && (
          <div className="mt-2 p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 mb-2 text-emerald-800 font-semibold">
              <Landmark size={18} /> {t("wallet.modal.bankSection.title")}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                label={<span className="text-slate-700 font-medium">{t("wallet.modal.fields.bankName.label")}</span>}
                name="bankName"
                rules={[{ required: true, message: t("wallet.modal.fields.bankName.required") }]}
                className="mb-0"
              >
                <Input placeholder={t("wallet.modal.fields.bankName.placeholder")} className="rounded-xl" />
              </Form.Item>

              <Form.Item
                label={<span className="text-slate-700 font-medium">{t("wallet.modal.fields.bankCode.label")}</span>}
                name="bankCode"
                className="mb-0"
              >
                <Input placeholder={t("wallet.modal.fields.bankCode.placeholder")} className="rounded-xl" />
              </Form.Item>

              <Form.Item
                label={<span className="text-slate-700 font-medium">{t("wallet.modal.fields.bankAccount.label")}</span>}
                name="bankAccount"
                rules={[{ required: true, message: t("wallet.modal.fields.bankAccount.required") }]}
                className="col-span-2 mb-0"
              >
                <Input placeholder={t("wallet.modal.fields.bankAccount.placeholder")} className="rounded-xl" />
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
              <div className="font-semibold text-slate-800 text-sm">
                {t("wallet.modal.fields.isDefault.title")}
              </div>
              <div className="text-xs text-slate-600">
                {t("wallet.modal.fields.isDefault.desc")}
              </div>
            </div>
          </div>

          <Form.Item name="is_default" valuePropName="checked" noStyle>
            <Switch />
          </Form.Item>
        </div>
      </Form>

      {/* Optional: ép Switch ON màu emerald */}
      <style>{`
        .ant-switch.ant-switch-checked {
          background: #10B981 !important;
        }
      `}</style>
    </Modal>
  );
};

export default WalletModal;
