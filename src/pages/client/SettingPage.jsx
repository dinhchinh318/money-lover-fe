import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Form,
  Switch,
  Button,
  message,
  Space,
  Typography,
  Spin,
  Tag,
  Row,
  Col,
  Popconfirm,
  Select,
  Segmented,
  Input,
  InputNumber,
} from "antd";
import {
  SettingOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  ReloadOutlined,
  LockOutlined,
  BellOutlined,
  GlobalOutlined,
  AppstoreOutlined,
  BgColorsOutlined,
} from "@ant-design/icons";

import {
  getMySettingAPI,
  updateMySettingAPI,
  resetMySettingAPI,
} from "../../services/api.setting";
import { useCurrentApp } from "../../components/context/app.context";

// ✅ i18n
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;

const EXCLUDED_FIELDS = [
  "_id",
  "id",
  "user",
  "userId",
  "createdAt",
  "updatedAt",
  "deletedAt",
  "__v",
  "deleted",
  "isSystem",
  "role",
];

const toLabel = (s = "") =>
  String(s)
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();

const getFieldLabel = (t, pathArr) => {
  const last = pathArr[pathArr.length - 1];
  const fallback = toLabel(last);

  // ưu tiên path đầy đủ (nested), nếu thiếu thì fallback theo key cuối
  // settings.fieldLabels.transactions
  // settings.fieldLabels.notifications.push
  const byPath = `settings.fieldLabels.${pathArr.join(".")}`;
  const byKey = `settings.fieldLabels.${last}`;

  return t(byPath, {
    defaultValue: t(byKey, { defaultValue: fallback }),
  });
};


const isPlainObject = (v) =>
  v !== null && typeof v === "object" && !Array.isArray(v);

const getObjectKeys = (obj) => (obj ? Object.keys(obj) : []);

const isAllBooleanObject = (obj) => {
  if (!isPlainObject(obj)) return false;
  const keys = Object.keys(obj);
  if (keys.length === 0) return false;
  return keys.every((k) => typeof obj[k] === "boolean");
};

const SettingPage = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const { applySettings } = useCurrentApp();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [rawSetting, setRawSetting] = useState(null);

  const pickAppSettings = (obj) => ({
    theme: obj?.theme,
    language: obj?.language,
    currency: obj?.currency,
  });

  // ✅ options theo i18n (phải useMemo để label cập nhật khi đổi ngôn ngữ)
  const FIELD_OPTIONS = useMemo(
    () => ({
      language: [
        { label: t("settings.options.language.vi"), value: "vi" },
        { label: t("settings.options.language.en"), value: "en" },
      ],
      currency: [{ label: t("settings.options.currency.vnd"), value: "VND" }],
      theme: [
        {
          label: (
            <span className="flex items-center gap-2">
              <BgColorsOutlined /> {t("settings.options.theme.light")}
            </span>
          ),
          value: "light",
        },
        {
          label: (
            <span className="flex items-center gap-2">
              <BgColorsOutlined /> {t("settings.options.theme.dark")}
            </span>
          ),
          value: "dark",
        },
        {
          label: (
            <span className="flex items-center gap-2">
              <SettingOutlined /> {t("settings.options.theme.system")}
            </span>
          ),
          value: "system",
        },
      ],
      notificationFrequency: [
        { label: t("settings.options.notif.instant"), value: "instant" },
        { label: t("settings.options.notif.daily"), value: "daily" },
        { label: t("settings.options.notif.weekly"), value: "weekly" },
      ],
    }),
    [t]
  );

  const fetchSetting = async () => {
    setLoading(true);
    try {
      const res = await getMySettingAPI();
      const setting = res?.data?.data ?? res?.data ?? null;

      if (setting) {
        const cleanSetting = Object.keys(setting)
          .filter((key) => !EXCLUDED_FIELDS.includes(key))
          .reduce((obj, key) => {
            obj[key] = setting[key];
            return obj;
          }, {});

        setRawSetting(cleanSetting);
        form.setFieldsValue(cleanSetting);

        // ✅ Apply ngay vào toàn app
        applySettings(pickAppSettings(cleanSetting));
      }

      setIsEditing(false);
    } catch (err) {
      message.error(t("settings.toast.serverError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSetting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      // ✅ Apply ngay (optimistic)
      applySettings(pickAppSettings(values));

      await updateMySettingAPI(values);
      message.success(t("settings.toast.updated"));

      await fetchSetting();
    } catch (err) {
      message.error(t("settings.toast.updateError"));
    } finally {
      setSaving(false);
    }
  };

  const onCancelEdit = () => {
    setIsEditing(false);
    form.setFieldsValue(rawSetting);
    applySettings(pickAppSettings(rawSetting));
  };

  const groupedFields = useMemo(() => {
    if (!rawSetting) return {};
    const groups = {
      security: { title: t("settings.groups.security"), icon: <LockOutlined />, keys: [] },
      notification: {
        title: t("settings.groups.notification"),
        icon: <BellOutlined />,
        keys: [],
      },
      display: {
        title: t("settings.groups.display"),
        icon: <GlobalOutlined />,
        keys: [],
      },
      other: { title: t("settings.groups.other"), icon: <AppstoreOutlined />, keys: [] },
    };

    Object.keys(rawSetting).forEach((key) => {
      const k = key.toLowerCase();
      if (k.match(/pass|2fa|security|lock|privacy/)) groups.security.keys.push(key);
      else if (k.match(/notif|alert|remind|email|push/)) groups.notification.keys.push(key);
      else if (k.match(/theme|lang|color|display|mode|currency/)) groups.display.keys.push(key);
      else groups.other.keys.push(key);
    });

    return groups;
  }, [rawSetting, t]);

  const findOptionKey = (pathStrLower) =>
    Object.keys(FIELD_OPTIONS).find((optKey) =>
      pathStrLower.includes(optKey.toLowerCase())
    );

  const renderBooleanTile = (namePath, label) => (
    <Col xs={24} sm={12} md={8} key={namePath.join(".")}>
      <div
        className={[
          "flex items-center justify-between gap-4 rounded-2xl p-4 border",
          "bg-slate-50 border-slate-200",
          "dark:bg-slate-900/40 dark:border-slate-800",
        ].join(" ")}
      >
        <div className="min-w-0">
          <Text className="!text-slate-900 dark:!text-slate-100 !font-semibold block truncate">
            {label}
          </Text>
          <Text type="secondary" className="!text-xs">
            {t("settings.booleanHint")}
          </Text>
        </div>

        <Form.Item name={namePath} valuePropName="checked" noStyle>
          <Switch disabled={!isEditing} />
        </Form.Item>
      </div>
    </Col>
  );

  const renderPrimitiveField = (namePath, value, label, pathStrLower) => {
    const type = typeof value;

    if (type === "boolean") {
      return renderBooleanTile(namePath, label);
    }

    const optionKey = findOptionKey(pathStrLower);
    const isNumber = type === "number";

    return (
      <Col xs={24} md={12} key={namePath.join(".")}>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:bg-slate-950 dark:border-slate-800">
          <Form.Item
            name={namePath}
            label={
              <Text className="!text-slate-900 dark:!text-slate-100 !font-semibold">
                {label}
              </Text>
            }
            className="mb-0"
          >
            {optionKey ? (
              pathStrLower.includes("theme") ? (
                <Segmented
                  options={FIELD_OPTIONS[optionKey]}
                  disabled={!isEditing}
                  block
                  className="w-full"
                />
              ) : (
                <Select
                  options={FIELD_OPTIONS[optionKey]}
                  disabled={!isEditing}
                  className="w-full"
                  placeholder={t("settings.placeholders.select")}
                />
              )
            ) : isNumber ? (
              <InputNumber
                disabled={!isEditing}
                className="w-full"
                style={{ width: "100%" }}
                placeholder={t("settings.placeholders.number")}
              />
            ) : (
              <Input
                disabled={!isEditing}
                className="w-full"
                placeholder={t("settings.placeholders.input")}
              />
            )}
          </Form.Item>
        </div>
      </Col>
    );
  };

  const renderObjectGroup = (basePath, objValue, titleLabel, depth = 0) => {
    const keys = getObjectKeys(objValue);

    if (isAllBooleanObject(objValue)) {
      return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:bg-slate-950 dark:border-slate-800">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Text className="!text-slate-900 dark:!text-slate-100 !font-semibold">
                {titleLabel}
              </Text>
              <Tag className="m-0">
                {t("settings.count.options", { count: keys.length })}
              </Tag>
            </div>
            {!isEditing && <Tag color="green">{t("settings.mode.view")}</Tag>}
          </div>

          <Row gutter={[16, 12]}>
            {keys.map((k) => {
              const p = [...basePath, k];
              return renderBooleanTile(p, getFieldLabel(t, p));
            })}
          </Row>
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:bg-slate-950 dark:border-slate-800">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Text className="!text-slate-900 dark:!text-slate-100 !font-semibold">
              {titleLabel}
            </Text>
            <Tag className="m-0">
              {t("settings.count.items", { count: keys.length })}
            </Tag>
          </div>
          {!isEditing && <Tag color="green">{t("settings.mode.view")}</Tag>}
        </div>

        <Row gutter={[16, 12]}>
          {keys.map((subKey) => {
            const subVal = objValue[subKey];
            const path = [...basePath, subKey];
            const pathStrLower = path.join(".").toLowerCase();
            const subLabel = getFieldLabel(t, path);

            if (isPlainObject(subVal)) {
              if (depth >= 1) {
                if (isAllBooleanObject(subVal)) {
                  return (
                    <Col xs={24} key={path.join(".")}>
                      {renderObjectGroup(path, subVal, subLabel, depth + 1)}
                    </Col>
                  );
                }
                return (
                  <Col xs={24} md={12} key={path.join(".")}>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:bg-slate-900/40 dark:border-slate-800">
                      <Text className="!text-slate-900 dark:!text-slate-100 !font-semibold">
                        {subLabel}
                      </Text>
                      <div className="mt-2">
                        <Tag className="m-0">{t("settings.advancedConfig")}</Tag>
                      </div>
                    </div>
                  </Col>
                );
              }

              return (
                <Col xs={24} key={path.join(".")}>
                  {renderObjectGroup(path, subVal, subLabel, depth + 1)}
                </Col>
              );
            }

            return renderPrimitiveField(path, subVal, subLabel, pathStrLower);
          })}
        </Row>
      </div>
    );
  };

  const renderSmartField = (key) => {
    const value = rawSetting?.[key];
    const label = getFieldLabel(t, [key]);

    if (isPlainObject(value)) {
      return (
        <Col xs={24} key={key}>
          {renderObjectGroup([key], value, label, 0)}
        </Col>
      );
    }

    return renderPrimitiveField([key], value, label, key.toLowerCase());
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div className="mx-auto w-full max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
              <SettingOutlined className="text-xl" />
            </div>
            <div>
              <Title
                level={3}
                className="!m-0 !text-slate-900 dark:!text-slate-100"
              >
                {t("settings.title")}
              </Title>
              <Text type="secondary">{t("settings.subtitle")}</Text>
            </div>
          </div>

          <div>
            {isEditing ? (
              <Tag color="gold" className="px-3 py-1">
                {t("settings.mode.editing")}
              </Tag>
            ) : (
              <Tag color="green" className="px-3 py-1">
                {t("settings.mode.view")}
              </Tag>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 dark:bg-slate-950 dark:border-slate-800">
            <Spin size="large" />
          </div>
        ) : (
          <Form
            form={form}
            layout="vertical"
            requiredMark={false}
            className="space-y-6"
            onValuesChange={(changed) => {
              if (!isEditing) return;

              const all = form.getFieldsValue(true);
              if (changed?.theme || changed?.language || changed?.currency) {
                applySettings(pickAppSettings(all));
              }
            }}
          >
            {Object.values(groupedFields).map((group) =>
              group.keys.length > 0 ? (
                <Card
                  key={group.title}
                  bordered={false}
                  className="!rounded-3xl !border !border-slate-200 !bg-white !shadow-sm dark:!bg-slate-950 dark:!border-slate-800"
                  bodyStyle={{ padding: 20 }}
                >
                  <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                    <span className="text-emerald-500">{group.icon}</span>
                    <Text className="!text-xs !font-semibold !tracking-wide !text-slate-500 dark:!text-slate-300">
                      {group.title.toUpperCase()}
                    </Text>
                  </div>

                  <Row gutter={[16, 12]}>
                    {group.keys.map((k) => renderSmartField(k))}
                  </Row>
                </Card>
              ) : null
            )}

            {/* Footer actions */}
            <div className="sticky bottom-4 z-10 rounded-3xl border border-slate-200 bg-white p-4 shadow-lg shadow-black/5 dark:bg-slate-950 dark:border-slate-800">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Popconfirm
                  title={t("settings.resetConfirm")}
                  onConfirm={async () => {
                    await resetMySettingAPI();
                    await fetchSetting();
                  }}
                  disabled={isEditing}
                >
                  <Button
                    type="link"
                    danger
                    icon={<ReloadOutlined />}
                    disabled={isEditing}
                    className="!p-0"
                  >
                    {t("settings.reset")}
                  </Button>
                </Popconfirm>

                <Space>
                  {!isEditing ? (
                    <Button
                      type="primary"
                      size="large"
                      onClick={() => setIsEditing(true)}
                      icon={<EditOutlined />}
                      className="!h-12 !rounded-2xl !bg-emerald-500 !shadow-md !shadow-emerald-500/20 hover:!bg-emerald-600"
                    >
                      {t("settings.editBtn")}
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="large"
                        onClick={onCancelEdit}
                        icon={<CloseOutlined />}
                        className="!h-12 !rounded-2xl"
                      >
                        {t("settings.cancelBtn")}
                      </Button>
                      <Button
                        type="primary"
                        size="large"
                        onClick={onSave}
                        loading={saving}
                        icon={<SaveOutlined />}
                        className="!h-12 !rounded-2xl !bg-emerald-500 !shadow-md !shadow-emerald-500/20 hover:!bg-emerald-600"
                      >
                        {t("settings.saveBtn")}
                      </Button>
                    </>
                  )}
                </Space>
              </div>
            </div>
          </Form>
        )}
      </div>
    </div>
  );
};

export default SettingPage;
