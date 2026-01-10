import { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Radio,
  Switch,
  message,
  Button,
} from "antd";
import {
  createRecurringBillAPI,
  updateRecurringBillAPI,
  payRecurringBillAPI,
} from "../../services/api.recurringBill";
import { getWalletsAPI } from "../../services/api.wallet";
import { getCategoriesAPI } from "../../services/api.category";
import dayjs from "dayjs";

// ✅ i18n
import { useTranslation } from "react-i18next";

const { Option } = Select;
const { TextArea } = Input;

const FREQUENCY_OPTIONS = [
  { value: "daily", labelKey: "recurringBill.frequency.daily" },
  { value: "weekly", labelKey: "recurringBill.frequency.weekly" },
  { value: "biweekly", labelKey: "recurringBill.frequency.biweekly" },
  { value: "monthly", labelKey: "recurringBill.frequency.monthly" },
  { value: "yearly", labelKey: "recurringBill.frequency.yearly" },
  { value: "custom", labelKey: "recurringBill.frequency.custom" },
];

const RecurringBillModal = ({ open, onClose, bill, onSuccess }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [billType, setBillType] = useState("expense");
  const [frequency, setFrequency] = useState("monthly");
  const [wallets, setWallets] = useState([]);
  const [categories, setCategories] = useState([]);

  const isOk = (res) => {
    // Normalize success check cho mọi API
    return Boolean(res?.status) || res?.EC === 0 || res?.data?.status === true;
  };

  useEffect(() => {
    if (!open) return;

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
        auto_create_transaction:
          bill.auto_create_transaction !== undefined ? bill.auto_create_transaction : true,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, bill]);

  const loadWallets = async () => {
    try {
      const res = await getWalletsAPI();
      if (res?.EC === 0 && res?.data) {
        const walletsData = Array.isArray(res.data) ? res.data : [];
        setWallets(walletsData.filter((w) => !w.is_archived));
      }
    } catch (error) {
      console.error("Error loading wallets:", error);
      message.error(t("recurringBill.toast.loadWalletsFailed"));
    }
  };

  const loadCategories = async () => {
    try {
      const res = await getCategoriesAPI();
      if (res?.EC === 0 && res?.data) {
        const categoriesData = Array.isArray(res.data) ? res.data : [];
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      message.error(t("recurringBill.toast.loadCategoriesFailed"));
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  const handlePayNow = async () => {
    if (!bill?._id) return;

    Modal.confirm({
      title: t("recurringBill.pay.confirmTitle"),
      content: (
        <>
          <p>
            <b>{bill.name}</b>
          </p>
          <p>
            {t("recurringBill.pay.amount")} {formatCurrency(bill.amount)}
          </p>
        </>
      ),
      okText: t("recurringBill.pay.ok"),
      cancelText: t("common6.cancel"),
      onOk: async () => {
        try {
          setLoading(true);
          const res = await payRecurringBillAPI(bill._id);

          if (isOk(res)) {
            message.success(t("recurringBill.toast.paySuccess"));
            onSuccess?.();
            onClose?.();
          } else {
            message.error(res?.message || res?.data?.message || t("recurringBill.toast.payFailed"));
          }
        } catch (err) {
          message.error(t("common6.errorOccurred"));
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const billData = {
        name: values.name?.trim(),
        type: values.type,
        walletId: values.wallet,
        categoryId: values.category,
        amount: values.amount,
        frequency: values.frequency,
        next_run: values.next_run?.toISOString(),
        active: values.active,
        auto_create_transaction: values.auto_create_transaction,
        description: values.description || "",
      };

      if (values.ends_at) billData.ends_at = values.ends_at.toISOString();

      if (values.frequency === "custom" && values.cron_rule) {
        billData.cron_rule = values.cron_rule;
      } else {
        // không custom thì clear
        delete billData.cron_rule;
      }

      const res = bill
        ? await updateRecurringBillAPI(bill._id, { data: billData })
        : await createRecurringBillAPI({ data: billData });

      if (isOk(res)) {
        message.success(
          bill ? t("recurringBill.toast.updateSuccess") : t("recurringBill.toast.createSuccess")
        );
        onSuccess?.();
        onClose?.();
      } else {
        message.error(res?.message || t("common6.actionFailed"));
      }
    } catch (error) {
      if (error?.errorFields) {
        message.error(t("common6.pleaseFillAll"));
      } else {
        message.error(t("common6.errorOccurred"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={bill ? t("recurringBill.title.edit") : t("recurringBill.title.create")}
      open={open}
      onCancel={onClose}
      width={700}
      centered
      footer={[
        bill ? (
          <Button
            key="pay"
            danger
            type="primary"
            onClick={handlePayNow}
            disabled={loading}
            loading={loading}
          >
            {t("recurringBill.actions.payNow")}
          </Button>
        ) : null,

        <Button key="cancel" onClick={onClose} disabled={loading}>
          {t("common6.cancel")}
        </Button>,

        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          loading={loading}
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {t("common6.save")}
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label={t("recurringBill.fields.name")}
          name="name"
          rules={[{ required: true, message: t("recurringBill.validate.name") }]}
        >
          <Input placeholder={t("recurringBill.placeholder.name")} />
        </Form.Item>

        <Form.Item
          label={t("recurringBill.fields.type")}
          name="type"
          rules={[{ required: true, message: t("recurringBill.validate.type") }]}
        >
          <Radio.Group
            onChange={(e) => {
              const next = e.target.value;
              setBillType(next);
              // ✅ đổi loại -> reset danh mục
              form.setFieldsValue({ category: null });
            }}
          >
            <Radio value="expense" style={{ color: "#EF4444" }}>
              {t("recurringBill.type.expense")}
            </Radio>
            <Radio value="income" style={{ color: "#10B981" }}>
              {t("recurringBill.type.income")}
            </Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          label={t("recurringBill.fields.amount")}
          name="amount"
          rules={[
            { required: true, message: t("recurringBill.validate.amountRequired") },
            { type: "number", min: 1, message: t("recurringBill.validate.amountMin") },
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
          label={t("recurringBill.fields.wallet")}
          name="wallet"
          rules={[{ required: true, message: t("recurringBill.validate.wallet") }]}
        >
          <Select placeholder={t("recurringBill.placeholder.wallet")}>
            {wallets.map((wallet) => (
              <Option key={wallet._id} value={wallet._id}>
                {wallet.name} ({formatCurrency(wallet.balance || 0)})
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label={t("recurringBill.fields.category")}
          name="category"
          rules={[{ required: true, message: t("recurringBill.validate.category") }]}
        >
          <Select placeholder={t("recurringBill.placeholder.category")}>
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
          label={t("recurringBill.fields.frequency")}
          name="frequency"
          rules={[{ required: true, message: t("recurringBill.validate.frequency") }]}
        >
          <Radio.Group
            onChange={(e) => {
              const next = e.target.value;
              setFrequency(next);
              if (next !== "custom") form.setFieldsValue({ cron_rule: "" });
            }}
          >
            {FREQUENCY_OPTIONS.map((option) => (
              <Radio key={option.value} value={option.value}>
                {t(option.labelKey)}
              </Radio>
            ))}
          </Radio.Group>
        </Form.Item>

        {frequency === "custom" && (
          <Form.Item
            label={t("recurringBill.fields.cronRule")}
            name="cron_rule"
            rules={[{ required: true, message: t("recurringBill.validate.cronRule") }]}
            tooltip={t("recurringBill.tooltip.cronRule")}
          >
            <Input placeholder="0 0 1 * *" />
          </Form.Item>
        )}

        <Form.Item
          label={t("recurringBill.fields.nextRun")}
          name="next_run"
          rules={[{ required: true, message: t("recurringBill.validate.nextRun") }]}
        >
          <DatePicker
            style={{ width: "100%" }}
            format="DD/MM/YYYY HH:mm"
            showTime
            disabledDate={(current) => current && current < dayjs().startOf("day")}
          />
        </Form.Item>

        <Form.Item label={t("recurringBill.fields.endsAt")} name="ends_at">
          <DatePicker
            style={{ width: "100%" }}
            format="DD/MM/YYYY"
            disabledDate={(current) => {
              const nextRun = form.getFieldValue("next_run");
              return current && nextRun && current < dayjs(nextRun).startOf("day");
            }}
            placeholder={t("common6.optional")}
          />
        </Form.Item>

        <Form.Item label={t("recurringBill.fields.description")} name="description">
          <TextArea rows={3} placeholder={t("recurringBill.placeholder.description")} />
        </Form.Item>

        <Form.Item name="active" valuePropName="checked" initialValue={true}>
          <Switch />
          <span className="ml-2">{t("recurringBill.fields.active")}</span>
        </Form.Item>

        <Form.Item name="auto_create_transaction" valuePropName="checked" initialValue={true}>
          <Switch />
          <span className="ml-2">{t("recurringBill.fields.autoCreateTransaction")}</span>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RecurringBillModal;
