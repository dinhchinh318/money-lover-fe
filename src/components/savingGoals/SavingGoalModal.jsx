import { useState, useEffect } from "react";
import { Modal, Form, Input, Select, InputNumber, DatePicker, message } from "antd";
import { createSavingGoalAPI, updateSavingGoalAPI } from "../../services/api.savingGoal";
import { getWalletsAPI } from "../../services/api.wallet";
import dayjs from "dayjs";

// ✅ i18n
import { useTranslation } from "react-i18next";

const { Option } = Select;
const { TextArea } = Input;

const SavingGoalModal = ({ open, onClose, goal, onSuccess }) => {
  const { t } = useTranslation();

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
          target_date: goal.target_date ? dayjs(goal.target_date) : null,
          description: goal.description || "",
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, goal, form]);

  const loadWallets = async () => {
    try {
      const res = await getWalletsAPI();
      if (res?.EC === 0 && res?.data) {
        const walletsData = Array.isArray(res.data) ? res.data : [];
        setWallets(walletsData.filter((w) => !w.is_archived));
      }
    } catch (error) {
      console.error("Error loading wallets:", error);
      message.error(t("savingGoal.modal.toast.loadWalletFail"));
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const goalData = {
        name: values.name.trim(),
        walletId: values.wallet,
        target_amount: values.target_amount,
        description: values.description || "",
      };

      if (values.target_date) {
        goalData.target_date = values.target_date.toISOString();
      }

      if (goal) {
        const res = await updateSavingGoalAPI(goal._id, { data: goalData });
        if (res?.status || res?.EC === 0) {
          message.success(t("savingGoal.modal.toast.updateSuccess"));
          onSuccess?.();
          onClose?.();
        } else {
          message.error(res?.message || t("savingGoal.modal.toast.updateFail"));
        }
      } else {
        const res = await createSavingGoalAPI({ data: goalData });
        if (res?.status || res?.EC === 0) {
          message.success(t("savingGoal.modal.toast.createSuccess"));
          onSuccess?.();
          onClose?.();
        } else {
          message.error(res?.message || t("savingGoal.modal.toast.createFail"));
        }
      }
    } catch (error) {
      if (error?.errorFields) {
        message.error(t("savingGoal.modal.toast.fillAll"));
      } else {
        message.error(t("savingGoal.modal.toast.generalError"));
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  return (
    <Modal
      title={goal ? t("savingGoal.modal.title.edit") : t("savingGoal.modal.title.create")}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={600}
      okText={t("savingGoal.modal.actions.save")}
      cancelText={t("savingGoal.modal.actions.cancel")}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label={t("savingGoal.modal.fields.name.label")}
          name="name"
          rules={[{ required: true, message: t("savingGoal.modal.fields.name.required") }]}
        >
          <Input placeholder={t("savingGoal.modal.fields.name.placeholder")} />
        </Form.Item>

        <Form.Item
          label={t("savingGoal.modal.fields.wallet.label")}
          name="wallet"
          rules={[{ required: true, message: t("savingGoal.modal.fields.wallet.required") }]}
        >
          <Select placeholder={t("savingGoal.modal.fields.wallet.placeholder")}>
            {wallets.map((wallet) => (
              <Option key={wallet._id} value={wallet._id}>
                {wallet.name} ({formatCurrency(wallet.balance || 0)})
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label={t("savingGoal.modal.fields.targetAmount.label")}
          name="target_amount"
          rules={[
            { required: true, message: t("savingGoal.modal.fields.targetAmount.required") },
            { type: "number", min: 1, message: t("savingGoal.modal.fields.targetAmount.min") },
          ]}
        >
          <InputNumber
            style={{ width: "100%" }}
            placeholder={t("savingGoal.modal.fields.targetAmount.placeholder")}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            parser={(value) => (value || "").replace(/\$\s?|(,*)/g, "")}
            min={1}
            addonAfter={t("savingGoal.modal.fields.currencyUnit.vnd")}
          />
        </Form.Item>

        <Form.Item
          label={t("savingGoal.modal.fields.targetDate.label")}
          name="target_date"
          tooltip={t("savingGoal.modal.fields.targetDate.tooltip")}
        >
          <DatePicker
            style={{ width: "100%" }}
            format="DD/MM/YYYY"
            disabledDate={(current) => current && current < dayjs().startOf("day")}
          />
        </Form.Item>

        <Form.Item label={t("savingGoal.modal.fields.description.label")} name="description">
          <TextArea rows={3} placeholder={t("savingGoal.modal.fields.description.placeholder")} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SavingGoalModal;
