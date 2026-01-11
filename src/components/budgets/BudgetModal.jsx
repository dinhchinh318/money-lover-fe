import { useState, useEffect } from "react";
import { Modal, Form, Input, Select, InputNumber, DatePicker, Radio, message } from "antd";
import { useTranslation } from "react-i18next";
import { createBudgetAPI, updateBudgetAPI } from "../../services/api.budget";
import { getCategoriesAPI } from "../../services/api.category";
import { getWalletsAPI } from "../../services/api.wallet";
import dayjs from "dayjs";

const { Option } = Select;
const { TextArea } = Input;

const PERIOD_OPTIONS = [
  { value: "weekly", labelKey: "budget.period.weekly", fallback: "Hàng tuần" },
  { value: "monthly", labelKey: "budget.period.monthly", fallback: "Hàng tháng" },
  { value: "yearly", labelKey: "budget.period.yearly", fallback: "Hàng năm" },
  { value: "custom", labelKey: "budget.period.custom", fallback: "Tùy chỉnh" },
];

const BudgetModal = ({ open, onClose, budget, onSuccess }) => {
  const { t } = useTranslation();

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
      if (res?.EC === 0 && res.data) {
        const categoriesData = Array.isArray(res.data) ? res.data : [];
        // chỉ lấy expense
        setCategories(categoriesData.filter((cat) => cat.type === "expense"));
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      message.error(t("budget.toast.loadCategoriesFailed"));
    }
  };

  const loadWallets = async () => {
    try {
      const res = await getWalletsAPI();
      if (res?.EC === 0 && res.data) {
        const walletsData = Array.isArray(res.data) ? res.data : [];
        setWallets(walletsData.filter((w) => !w.is_archived));
      }
    } catch (error) {
      console.error("Error loading wallets:", error);
      message.error(t("budget.toast.loadWalletsFailed"));
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

      if (values.wallet) budgetData.wallet = values.wallet;

      if (values.period === "custom") {
        if (!values.start_date || !values.end_date) {
          message.error(t("budget.validation.customDateRequired"));
          setLoading(false);
          return;
        }
        budgetData.start_date = values.start_date.toISOString();
        budgetData.end_date = values.end_date.toISOString();
      } else {
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

      if (budget && budget._id) {
        const res = await updateBudgetAPI(budget._id, { data: budgetData });
        if (res?.status || res?.EC === 0) {
          message.success(t("budget.toast.updateSuccess"));
          onSuccess?.();
          onClose?.();
        } else {
          message.error(res?.message || t("budget.toast.updateFailed"));
        }
      } else {
        const res = await createBudgetAPI({ data: budgetData });
        if (res?.status || res?.EC === 0) {
          message.success(t("budget.toast.createSuccess"));
          onSuccess?.();
          onClose?.();
        } else {
          message.error(res?.message || t("budget.toast.createFailed"));
        }
      }
    } catch (error) {
      if (error?.errorFields) {
        message.error(t("common8.toast.fillRequired"));
      } else {
        message.error(t("common8.toast.genericError"));
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  return (
    <Modal
      title={budget ? t("budget.modal.editTitle") : t("budget.modal.createTitle")}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={600}
      okText={t("common7.button.save")}
      cancelText={t("common7.button.cancel")}
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
          label={t("budget.field.name.label")}
          name="name"
          tooltip={t("budget.field.name.tooltip")}
        >
          <Input placeholder={t("budget.field.name.placeholder")} />
        </Form.Item>

        <Form.Item
          label={t("budget.field.category.label")}
          name="category"
          rules={[{ required: true, message: t("budget.validation.categoryRequired") }]}
        >
          <Select placeholder={t("budget.field.category.placeholder")} showSearch>
            {categories.map((category) => (
              <Option key={category._id} value={category._id}>
                {category.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label={t("budget.field.wallet.label")} name="wallet">
          <Select placeholder={t("budget.field.wallet.placeholder")} allowClear>
            {wallets.map((wallet) => (
              <Option key={wallet._id} value={wallet._id}>
                {wallet.name} ({formatCurrency(wallet.balance || 0)})
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label={t("budget.field.limit.label")}
          name="limit_amount"
          rules={[
            { required: true, message: t("budget.validation.limitRequired") },
            { type: "number", min: 1, message: t("budget.validation.limitMin") },
          ]}
        >
          <InputNumber
            style={{ width: "100%" }}
            placeholder="0"
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
            min={1}
            addonAfter={t("common8.currency.vnd")}
          />
        </Form.Item>

        <Form.Item
          label={t("budget.field.period.label")}
          name="period"
          rules={[{ required: true, message: t("budget.validation.periodRequired") }]}
        >
          <Radio.Group
            onChange={(e) => {
              const next = e.target.value;
              setPeriod(next);
              if (next !== "custom") {
                form.setFieldsValue({ start_date: null, end_date: null });
              }
            }}
          >
            {PERIOD_OPTIONS.map((option) => (
              <Radio key={option.value} value={option.value}>
                {t(option.labelKey, option.fallback)}
              </Radio>
            ))}
          </Radio.Group>
        </Form.Item>

        {period === "custom" && (
          <>
            <Form.Item
              label={t("budget.field.startDate.label")}
              name="start_date"
              rules={[{ required: true, message: t("budget.validation.startDateRequired") }]}
            >
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>

            <Form.Item
              label={t("budget.field.endDate.label")}
              name="end_date"
              rules={[{ required: true, message: t("budget.validation.endDateRequired") }]}
            >
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>
          </>
        )}

        <Form.Item label={t("budget.field.description.label")} name="description">
          <TextArea rows={3} placeholder={t("budget.field.description.placeholder")} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default BudgetModal;
