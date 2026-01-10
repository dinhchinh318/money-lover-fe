import { useState, useEffect, useMemo } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Upload,
  Radio,
  Switch,
  message,
  Spin,
} from "antd";
import { Upload as UploadIcon, RefreshCw, Trash2 } from "lucide-react";
import { createTransactionAPI, updateTransactionAPI } from "../../services/api.transaction";
import { getWalletsAPI } from "../../services/api.wallet";
import { getCategoriesAPI } from "../../services/api.category";
import { uploadImageAPI, deleteImageAPI } from "../../services/api.upload";
import dayjs from "dayjs";

// ✅ i18n
import { useTranslation } from "react-i18next";

const { Option } = Select;
const { TextArea } = Input;

const TransactionModal = ({ open, onClose, transaction, onSuccess, initialType = "expense" }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  const TRANSACTION_TYPES = useMemo(
    () => [
      { value: "expense", label: t("transaction.modal.types.expense"), color: "#EF4444" },
      { value: "income", label: t("transaction.modal.types.income"), color: "#10B981" },
      { value: "transfer", label: t("transaction.modal.types.transfer"), color: "#3B82F6" },
      { value: "debt", label: t("transaction.modal.types.debt"), color: "#F59E0B" },
      { value: "loan", label: t("transaction.modal.types.loan"), color: "#F97316" },
      { value: "adjust", label: t("transaction.modal.types.adjust"), color: "#6B7280" },
    ],
    [t]
  );

  const RECURRING_TYPES = useMemo(
    () => [
      { value: "daily", label: t("transaction.modal.recurring.daily") },
      { value: "weekly", label: t("transaction.modal.recurring.weekly") },
      { value: "monthly", label: t("transaction.modal.recurring.monthly") },
      { value: "yearly", label: t("transaction.modal.recurring.yearly") },
    ],
    [t]
  );

  const [loading, setLoading] = useState(false);
  const [transactionType, setTransactionType] = useState("expense");
  const [wallets, setWallets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isRecurring, setIsRecurring] = useState(false);

  // Image states
  const [imageUrl, setImageUrl] = useState("");
  const [imagePublicId, setImagePublicId] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const isAdjust = transactionType === "adjust";
  const isTransfer = transactionType === "transfer";
  const isIncomeExpense = transactionType === "income" || transactionType === "expense";
  const isDebtLoan = transactionType === "debt" || transactionType === "loan";

  const activeWallets = useMemo(() => wallets.filter((w) => !w.is_archived), [wallets]);

  useEffect(() => {
    if (!open) return;

    loadWallets();
    loadCategories();

    if (transaction) {
      form.setFieldsValue({
        ...transaction,
        walletId: transaction.walletId?._id || transaction.walletId,
        categoryId: transaction.categoryId?._id || transaction.categoryId,
        toWalletId: transaction.toWalletId?._id || transaction.toWalletId,
        date: transaction.date ? dayjs(transaction.date) : dayjs(),
        dueDate: transaction.dueDate ? dayjs(transaction.dueDate) : null,
        endDate: transaction.endDate ? dayjs(transaction.endDate) : null,

        // adjust fields (nếu có)
        adjustTo: transaction.adjustTo ?? undefined,
        adjustReason: transaction.adjustReason ?? "",
      });

      setTransactionType(transaction.type);
      setIsRecurring(transaction.isRecurring || false);
      setImageUrl(transaction.imageUrl || "");
      setImagePublicId(transaction.imagePublicId || "");
    } else {
      form.resetFields();
      const defaultVals = {
        type: initialType,
        date: dayjs(),
        isRecurring: false,
        recurringType: "monthly",
        note: "",
      };
      form.setFieldsValue(defaultVals);

      setTransactionType(initialType);
      setIsRecurring(false);
      setImageUrl("");
      setImagePublicId("");
    }
  }, [open, transaction, form, initialType]);

  const loadWallets = async () => {
    try {
      const res = await getWalletsAPI();
      if (res?.EC === 0) setWallets(res.data || []);
    } catch (e) {
      message.error(t("transaction.modal.toast.loadWalletFail"));
    }
  };

  const loadCategories = async () => {
    try {
      const res = await getCategoriesAPI();
      if (res?.EC === 0) setCategories(res.data || []);
    } catch (e) {
      message.error(t("transaction.modal.toast.loadCategoryFail"));
    }
  };

  // ✅ Upload ảnh + xóa ảnh cũ Cloudinary
  const handleImageUpload = async (file) => {
    const isImg = file.type?.startsWith("image/");
    if (!isImg) {
      message.error(t("transaction.modal.toast.imageOnly"));
      return Upload.LIST_IGNORE;
    }

    setUploadingImage(true);
    try {
      const oldPublicId = imagePublicId;
      const res = await uploadImageAPI(file);
      const payload = res?.data?.data || res?.data || res?.data?.result;

      if (payload?.url) {
        setImageUrl(payload.url);
        setImagePublicId(payload.publicId || payload.public_id || "");

        if (oldPublicId) {
          deleteImageAPI(oldPublicId).catch(console.error);
        }
        message.success(t("transaction.modal.toast.uploadSuccess"));
      } else {
        message.error(t("transaction.modal.toast.uploadFail"));
      }
    } catch (err) {
      message.error(t("transaction.modal.toast.uploadFail"));
    } finally {
      setUploadingImage(false);
    }

    return Upload.LIST_IGNORE;
  };

  const handleRemoveImage = async () => {
    try {
      if (imagePublicId) {
        setUploadingImage(true);
        await deleteImageAPI(imagePublicId).catch(() =>
          message.error(t("transaction.modal.toast.deleteImageFail"))
        );
      }
    } finally {
      setUploadingImage(false);
      setImageUrl("");
      setImagePublicId("");
    }

    if (transaction?._id) {
      await updateTransactionAPI(transaction._id, { imageUrl: "", imagePublicId: "" });
      onSuccess?.();
    }
  };

  const handleTypeChange = (nextType) => {
    setTransactionType(nextType);
    form.setFieldsValue({ type: nextType });

    // Reset các field không liên quan để tránh dính data
    if (nextType !== "transfer") form.setFieldsValue({ toWalletId: undefined, transferFee: undefined });
    if (!(nextType === "income" || nextType === "expense")) form.setFieldsValue({ categoryId: undefined });
    if (!(nextType === "debt" || nextType === "loan"))
      form.setFieldsValue({ counterpartyName: "", counterpartyContact: "", dueDate: null, isSettled: false });

    if (nextType !== "adjust") {
      form.setFieldsValue({ adjustTo: undefined, adjustReason: "" });
    } else {
      // adjust: amount không dùng, để an toàn set 0
      form.setFieldsValue({ amount: 0 });
    }
  };

  const onFinish = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Base payload
      const data = {
        ...values,
        imageUrl,
        imagePublicId,
        date: values.date?.toISOString(),
        dueDate: values.dueDate?.toISOString(),
        endDate: values.endDate?.toISOString(),
      };

      // ✅ Payload theo type
      if (data.type === "adjust") {
        data.amount = 0;
        delete data.categoryId;
        delete data.toWalletId;
        delete data.transferFee;
      } else {
        delete data.adjustTo;
        delete data.adjustReason;
        delete data.transferFee;
      }

      const res = transaction
        ? await updateTransactionAPI(transaction._id, data)
        : await createTransactionAPI(data);

      if (res?.EC === 0 || res?.status) {
        message.success(transaction ? t("transaction.modal.toast.updateSuccess") : t("transaction.modal.toast.createSuccess"));
        onSuccess?.();
        onClose?.();
      } else {
        message.error(res?.message || t("transaction.modal.toast.actionFail"));
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
        <span className="text-xl font-bold text-slate-800">
          {transaction ? t("transaction.modal.title.edit") : t("transaction.modal.title.create")}
        </span>
      }
      open={open}
      onCancel={onClose}
      onOk={onFinish}
      confirmLoading={loading}
      okButtonProps={{
        disabled: uploadingImage,
        className: "bg-emerald-600 hover:bg-emerald-700 rounded-lg h-10 px-6",
      }}
      cancelButtonProps={{ className: "rounded-lg h-10" }}
      width={720}
      centered
      okText={uploadingImage ? t("transaction.modal.actions.processing") : t("transaction.modal.actions.save")}
      cancelText={t("transaction.modal.actions.cancel")}
    >
      <Form form={form} layout="vertical" className="mt-4">
        {/* 1. Type tabs */}
        <div className="mb-6 -mx-1 overflow-x-auto no-scrollbar">
          <div className="flex p-1 bg-slate-100 rounded-xl min-w-max">
            {TRANSACTION_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => handleTypeChange(type.value)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex-1 whitespace-nowrap ${
                  transactionType === type.value
                    ? "bg-white shadow-md scale-105"
                    : "text-slate-500 hover:text-slate-700"
                }`}
                style={{ color: transactionType === type.value ? type.color : undefined }}
              >
                {type.label}
              </button>
            ))}
          </div>
          <Form.Item name="type" hidden>
            <Input />
          </Form.Item>
        </div>

        {/* 2. Main grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
          {/* Left */}
          <div className="space-y-1">
            {/* ✅ Amount OR AdjustTo */}
            {!isAdjust ? (
              <Form.Item
                label={t("transaction.modal.fields.amount.label")}
                name="amount"
                rules={[{ required: true, message: t("transaction.modal.fields.amount.required") }]}
              >
                <InputNumber
                  className="w-full !rounded-lg h-11 flex items-center border-emerald-100 focus:border-emerald-500"
                  min={1}
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(v) => (v || "").replace(/\$\s?|(,*)/g, "")}
                  addonAfter={<span className="font-bold text-emerald-600">{t("transaction.modal.fields.currencyUnit.vnd")}</span>}
                />
              </Form.Item>
            ) : (
              <Form.Item
                label={t("transaction.modal.fields.adjustTo.label")}
                name="adjustTo"
                rules={[
                  { required: true, message: t("transaction.modal.fields.adjustTo.required") },
                  {
                    validator: (_, v) => {
                      if (v === undefined || v === null) return Promise.resolve();
                      if (Number.isFinite(v) && v >= 0) return Promise.resolve();
                      return Promise.reject(new Error(t("transaction.modal.fields.adjustTo.validatorMin0")));
                    },
                  },
                ]}
              >
                <InputNumber
                  className="w-full !rounded-lg h-11 flex items-center border-slate-200 focus:border-slate-500"
                  min={0}
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(v) => (v || "").replace(/\$\s?|(,*)/g, "")}
                  addonAfter={<span className="font-bold text-slate-600">{t("transaction.modal.fields.currencyUnit.vnd")}</span>}
                />
              </Form.Item>
            )}

            <Form.Item
              label={isTransfer ? t("transaction.modal.fields.walletSend.label") : t("transaction.modal.fields.walletPay.label")}
              name="walletId"
              rules={[{ required: true, message: t("transaction.modal.fields.walletId.required") }]}
            >
              <Select className="h-10" placeholder={t("transaction.modal.fields.walletId.placeholder")}>
                {activeWallets.map((w) => (
                  <Option key={w._id} value={w._id}>
                    <div className="flex justify-between w-full">
                      <span>{w.name}</span>
                      <span className="text-slate-400 text-xs">
                        {Number(w.balance || 0).toLocaleString()}đ
                      </span>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {isIncomeExpense && (
              <Form.Item
                label={t("transaction.modal.fields.categoryId.label")}
                name="categoryId"
                rules={[{ required: true, message: t("transaction.modal.fields.categoryId.required") }]}
              >
                <Select className="h-10" showSearch placeholder={t("transaction.modal.fields.categoryId.placeholder")}>
                  {categories
                    .filter((c) => c.type === transactionType)
                    .map((c) => (
                      <Option key={c._id} value={c._id}>
                        {c.name}
                      </Option>
                    ))}
                </Select>
              </Form.Item>
            )}

            {isTransfer && (
              <>
                <Form.Item
                  label={t("transaction.modal.fields.toWalletId.label")}
                  name="toWalletId"
                  rules={[{ required: true, message: t("transaction.modal.fields.toWalletId.required") }]}
                >
                  <Select
                    className="h-10"
                    placeholder={t("transaction.modal.fields.toWalletId.placeholder")}
                    options={activeWallets.map((w) => ({ label: w.name, value: w._id }))}
                  />
                </Form.Item>

                {/* UI giữ lại, nhưng submit không gửi vì BE chưa xử lý */}
                <Form.Item label={t("transaction.modal.fields.transferFee.label")} name="transferFee">
                  <InputNumber
                    className="w-full h-10"
                    placeholder={t("transaction.modal.fields.transferFee.placeholder")}
                    addonAfter={t("transaction.modal.fields.currencyUnit.vnd")}
                    min={0}
                  />
                </Form.Item>
              </>
            )}

            {isDebtLoan && (
              <div className="p-3 bg-orange-50/50 rounded-xl border border-orange-100 space-y-3">
                <Form.Item
                  label={t("transaction.modal.fields.counterpartyName.label")}
                  name="counterpartyName"
                  rules={[{ required: true, message: t("transaction.modal.fields.counterpartyName.required") }]}
                  className="mb-2"
                >
                  <Input placeholder={t("transaction.modal.fields.counterpartyName.placeholder")} />
                </Form.Item>

                <Form.Item name="isSettled" valuePropName="checked" className="mb-0">
                  <Switch size="small" />{" "}
                  <span className="ml-2 text-sm text-slate-600">{t("transaction.modal.fields.isSettled.label")}</span>
                </Form.Item>
              </div>
            )}

            {/* ✅ Adjust reason */}
            {isAdjust && (
              <Form.Item
                label={t("transaction.modal.fields.adjustReason.label")}
                name="adjustReason"
                rules={[{ required: true, message: t("transaction.modal.fields.adjustReason.required") }]}
              >
                <Input placeholder={t("transaction.modal.fields.adjustReason.placeholder")} />
              </Form.Item>
            )}
          </div>

          {/* Right */}
          <div className="space-y-1">
            <Form.Item
              label={t("transaction.modal.fields.date.label")}
              name="date"
              rules={[{ required: true, message: t("transaction.modal.fields.date.required") }]}
            >
              <DatePicker className="w-full h-10" format="DD/MM/YYYY" showToday />
            </Form.Item>

            {/* Upload */}
            <Form.Item label={t("transaction.modal.fields.receipt.label")}>
              <div className="relative group">
                {!imageUrl ? (
                  <Upload
                    beforeUpload={handleImageUpload}
                    showUploadList={false}
                    accept="image/*"
                    disabled={uploadingImage}
                  >
                    <div className="w-full h-40 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-all group">
                      {uploadingImage ? (
                        <div className="text-center">
                          <Spin
                            indicator={<RefreshCw className="animate-spin text-emerald-500 mb-2" size={24} />}
                          />
                          <p className="text-emerald-600 font-medium">{t("transaction.modal.upload.uploading")}</p>
                        </div>
                      ) : (
                        <>
                          <div className="p-3 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
                            <UploadIcon className="text-emerald-500" size={24} />
                          </div>
                          <p className="mt-2 text-slate-500 text-sm">{t("transaction.modal.upload.clickToUpload")}</p>
                        </>
                      )}
                    </div>
                  </Upload>
                ) : (
                  <div className="relative h-40 w-full overflow-hidden rounded-xl border border-slate-200 shadow-inner group">
                    <img src={imageUrl} alt="Receipt" className="w-full h-full object-cover" />

                    <div
                      className={`absolute inset-0 bg-black/40 flex items-center justify-center gap-3 transition-opacity ${
                        uploadingImage ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      {uploadingImage ? (
                        <div className="text-white text-center">
                          <RefreshCw className="animate-spin mx-auto mb-1" size={20} />
                          <span className="text-xs">{t("transaction.modal.upload.updating")}</span>
                        </div>
                      ) : (
                        <>
                          <Upload beforeUpload={handleImageUpload} showUploadList={false}>
                            <button
                              type="button"
                              className="p-2 bg-white rounded-lg hover:bg-emerald-50 text-emerald-600 flex items-center gap-1 text-xs font-bold transition-transform hover:scale-105"
                            >
                              <RefreshCw size={14} /> {t("transaction.modal.upload.change")}
                            </button>
                          </Upload>
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="p-2 bg-white rounded-lg hover:bg-red-50 text-red-600 flex items-center gap-1 text-xs font-bold transition-transform hover:scale-105"
                          >
                            <Trash2 size={14} /> {t("transaction.modal.upload.delete")}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Form.Item>

            <Form.Item label={t("transaction.modal.fields.note.label")} name="note">
              <TextArea
                rows={2}
                placeholder={
                  isAdjust
                    ? t("transaction.modal.fields.note.placeholderAdjust")
                    : t("transaction.modal.fields.note.placeholderNormal")
                }
                className="!rounded-lg"
              />
            </Form.Item>
          </div>
        </div>

        {/* Recurring */}
        <div className="mt-4 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <RefreshCw size={18} className="text-emerald-600" />
              <span className="font-semibold text-emerald-900">{t("transaction.modal.recurring.title")}</span>
            </div>
            <Form.Item name="isRecurring" valuePropName="checked" noStyle>
              <Switch onChange={setIsRecurring} className={isRecurring ? "bg-emerald-500" : ""} />
            </Form.Item>
          </div>

          {isRecurring && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
              <Form.Item label={t("transaction.modal.recurring.repeatBy")} name="recurringType" className="mb-0">
                <Radio.Group className="flex flex-wrap gap-2">
                  {RECURRING_TYPES.map((r) => (
                    <Radio.Button
                      key={r.value}
                      value={r.value}
                      className="rounded-md border-none bg-white shadow-sm h-9 flex items-center"
                    >
                      {r.label}
                    </Radio.Button>
                  ))}
                </Radio.Group>
              </Form.Item>

              <Form.Item label={t("transaction.modal.recurring.endDate")} name="endDate" className="mb-0">
                <DatePicker className="w-full h-9" placeholder={t("transaction.modal.recurring.noEnd")} />
              </Form.Item>
            </div>
          )}
        </div>
      </Form>
    </Modal>
  );
};

export default TransactionModal;
