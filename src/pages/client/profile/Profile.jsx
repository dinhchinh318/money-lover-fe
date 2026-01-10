import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Space,
  Typography,
  Divider,
  Skeleton,
  Row,
  Col,
  Avatar,
  Tag,
  Tooltip,
  Progress,
  Upload,
  DatePicker,
  Popconfirm,
  Radio,
  Result,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  ReloadOutlined,
  CheckCircleFilled,
  CameraOutlined,
  EditOutlined,
  InfoCircleOutlined,
  WomanOutlined,
  ManOutlined,
  LockOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { getMyProfileAPI, updateMyProfileAPI } from "../../services/api.profile";
import { useCurrentApp } from "../../components/context/app.context";

// ✅ i18n
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;

const COLORS = {
  primary: "#10b981",
  cyan: "#22d3ee",
  ink: "#0f172a",
  muted: "#64748b",
  bgGradient: "linear-gradient(135deg, #ecfeff 0%, #f0fdf4 35%, #ffffff 100%)",
  cardShadow:
    "0 12px 30px -10px rgba(16, 185, 129, 0.18), 0 10px 18px -14px rgba(0,0,0,0.08)",
  softBorder: "1px solid rgba(16,185,129,0.14)",
};

const SYSTEM_FIELDS = [
  "_id",
  "userId",
  "createdAt",
  "updatedAt",
  "deletedAt",
  "__v",
  "occupation",
  "hasCompletedOnboarding",
  "favoriteCategories",
  "deleted",
  "url",
];

// giữ logic cũ: UI lưu "Nam"/"Nữ" để map sang BE "male"/"female"
const genderMap = {
  toUI: (val) => (val === "male" ? "Nam" : val === "female" ? "Nữ" : null),
  toBE: (val) => (val === "Nam" ? "male" : "female"),
};

const ProfilePage = () => {
  const { t } = useTranslation();

  const [form] = Form.useForm();
  const { setProfile } = useCurrentApp();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [rawProfile, setRawProfile] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [initialFormValues, setInitialFormValues] = useState(null);

  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const editableKeys = useMemo(() => {
    if (!rawProfile) return [];
    return Object.keys(rawProfile).filter((k) => !SYSTEM_FIELDS.includes(k));
  }, [rawProfile]);

  const profileCompletion = useMemo(() => {
    if (!rawProfile) return 0;
    const important = ["displayName", "email", "phone", "address", "dateOfBirth", "gender"];
    const values = form.getFieldsValue();
    const filled = important.filter((f) => !!values?.[f]).length;
    return Math.round((filled / important.length) * 100);
  }, [rawProfile, isDirty, form]);

  const buildFormattedProfile = (profile) => {
    const formatted = { ...profile };

    if (profile.gender) formatted.gender = genderMap.toUI(profile.gender);
    if (profile.dateOfBirth) formatted.dateOfBirth = dayjs(profile.dateOfBirth);

    return formatted;
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await getMyProfileAPI();
      const profile = res?.data?.data ?? res?.data ?? null;

      if (profile) {
        const formatted = buildFormattedProfile(profile);

        setRawProfile(profile);
        form.setFieldsValue(formatted);
        setInitialFormValues(formatted);

        setProfile?.(profile);

        setIsEditing(false);
        setIsDirty(false);
        setAvatarPreview(null);
      } else {
        setRawProfile(null);
      }
    } catch (e) {
      message.error(t("profile1.toast.loadFail"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enterEditMode = () => {
    setIsEditing(true);
    setIsDirty(false);
  };

  const cancelEdit = () => {
    if (initialFormValues) form.setFieldsValue(initialFormValues);
    setIsEditing(false);
    setIsDirty(false);
    setAvatarPreview(null);
    message.info(t("profile1.toast.cancelEdit"));
  };

  // ✅ FIX: không bao giờ trả về "" cho src
  const avatarSrc = useMemo(() => {
    if (avatarPreview) return avatarPreview;
    const url = rawProfile?.avatarUrl;
    return url && url.trim() ? url : null;
  }, [avatarPreview, rawProfile]);

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleUploadAvatar = async ({ file, onSuccess, onError }) => {
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error(t("profile1.avatar.tooLarge"));
      onError?.(new Error("File too large"));
      return;
    }

    setAvatarLoading(true);
    try {
      const preview = await fileToBase64(file);
      setAvatarPreview(preview);

      const formData = new FormData();
      formData.append("avatar", file);

      await updateMyProfileAPI(formData);

      message.success(t("profile1.avatar.success"));
      onSuccess?.("ok");

      await fetchProfile();
    } catch (e) {
      message.error(t("profile1.avatar.fail"));
      onError?.(e);
    } finally {
      setAvatarLoading(false);
    }
  };

  const onSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const payload = {};
      editableKeys.forEach((key) => {
        let val = values[key];
        if (val === undefined) return;

        if (key === "dateOfBirth") {
          payload.dateOfBirth = val ? val.format("YYYY-MM-DD") : null;
          return;
        }

        if (key === "gender") {
          payload.gender = val ? genderMap.toBE(val) : "unknown";
          return;
        }

        payload[key] = val;
      });

      await updateMyProfileAPI(payload);

      message.success(t("profile1.toast.updateSuccess"));
      setIsDirty(false);
      setIsEditing(false);
      setAvatarPreview(null);

      await fetchProfile();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(t("profile1.toast.updateFail"));
    } finally {
      setSaving(false);
    }
  };

  const getLabel = (key) => t(`profile1.fields.${key}.label`, { defaultValue: key });
  const getPlaceholder = (key) =>
    t(`profile1.fields.${key}.placeholder`, { defaultValue: t("profile1.placeholders.default") });

  const renderField = (key) => {
    const label = getLabel(key);
    const isEmail = key === "email";
    const isBio = key === "bio";
    const isDate = key === "dateOfBirth";
    const disabled = !isEditing || isEmail;

    if (key === "gender") {
      return (
        <Form.Item name={key} label={label} key={key}>
          <Radio.Group
            disabled={!isEditing}
            optionType="button"
            buttonStyle="solid"
            style={{ width: "100%" }}
          >
            <Radio.Button value="Nam" style={{ width: "50%", textAlign: "center" }}>
              <ManOutlined /> {t("profile1.gender.male")}
            </Radio.Button>
            <Radio.Button value="Nữ" style={{ width: "50%", textAlign: "center" }}>
              <WomanOutlined /> {t("profile1.gender.female")}
            </Radio.Button>
          </Radio.Group>
        </Form.Item>
      );
    }

    if (isDate) {
      return (
        <Form.Item name={key} label={label} key={key}>
          <DatePicker
            disabled={!isEditing}
            format="DD/MM/YYYY"
            style={{ width: "100%" }}
            placeholder={getPlaceholder(key)}
            className="fintech-input"
          />
        </Form.Item>
      );
    }

    if (isBio) {
      return (
        <Form.Item name={key} label={label} key={key}>
          <Input.TextArea
            disabled={!isEditing}
            rows={3}
            placeholder={getPlaceholder(key)}
            className="fintech-input"
          />
        </Form.Item>
      );
    }

    return (
      <Form.Item
        name={key}
        label={label}
        key={key}
        rules={
          key === "phone"
            ? [
                {
                  pattern: /^(0[3|5|7|8|9])([0-9]{8})$/,
                  message: t("profile1.validation.phoneInvalid"),
                },
              ]
            : []
        }
      >
        <Input
          disabled={disabled}
          prefix={isEmail ? <MailOutlined /> : <EditOutlined />}
          suffix={
            isEmail ? (
              <Tooltip title={t("profile1.email.lockedTooltip")}>
                <LockOutlined style={{ color: "#94a3b8" }} />
              </Tooltip>
            ) : null
          }
          placeholder={getPlaceholder(key)}
          className="fintech-input"
        />
      </Form.Item>
    );
  };

  if (!loading && !rawProfile) {
    return (
      <Result
        status="404"
        title={t("profile1.result404.title")}
        subTitle={t("profile1.result404.subtitle")}
        extra={
          <Button type="primary" icon={<ReloadOutlined />} onClick={fetchProfile}>
            {t("common2.retry")}
          </Button>
        }
      />
    );
  }

  return (
    <div style={{ background: COLORS.bgGradient, minHeight: "100vh", padding: "44px 20px" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        {loading ? (
          <Skeleton active avatar paragraph={{ rows: 12 }} />
        ) : (
          <Row gutter={[32, 32]}>
            <Col xs={24} lg={8}>
              <Card
                variant="outlined"
                style={{
                  borderRadius: 26,
                  textAlign: "center",
                  boxShadow: COLORS.cardShadow,
                  border: COLORS.softBorder,
                }}
              >
                <div style={{ position: "relative", display: "inline-block", marginBottom: 14 }}>
                  <Avatar
                    size={132}
                    src={avatarSrc}
                    icon={<UserOutlined />}
                    style={{ border: "4px solid #fff", boxShadow: "0 12px 26px rgba(0,0,0,0.10)" }}
                  />
                  <Upload showUploadList={false} customRequest={handleUploadAvatar} accept="image/*">
                    <Button
                      shape="circle"
                      icon={<CameraOutlined />}
                      loading={avatarLoading}
                      style={{
                        position: "absolute",
                        right: 6,
                        bottom: 6,
                        background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.cyan})`,
                        border: "none",
                        color: "#fff",
                      }}
                      aria-label={t("profile1.avatar.change")}
                    />
                  </Upload>
                </div>

                <Title level={3} style={{ marginBottom: 2, fontWeight: 900, color: COLORS.ink }}>
                  {rawProfile?.displayName || t("profile1.fallbackUser")}
                  <CheckCircleFilled style={{ color: COLORS.primary, marginLeft: 8, fontSize: 18 }} />
                </Title>

                <Text type="secondary">
                  <MailOutlined /> {rawProfile?.email || "—"}
                </Text>

                <div style={{ marginTop: 16 }}>
                  <Tag color="success" style={{ borderRadius: 999, padding: "4px 12px", fontWeight: 700 }}>
                    {t("profile1.tags.trusted")}
                  </Tag>
                </div>

                <div style={{ marginTop: 18, textAlign: "left" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <Text strong style={{ color: "#0f766e" }}>
                      {t("profile1.completion.title")}
                    </Text>
                    <Text strong style={{ color: COLORS.primary }}>
                      {profileCompletion}%
                    </Text>
                  </div>

                  <Progress
                    percent={profileCompletion}
                    showInfo={false}
                    strokeColor={`linear-gradient(90deg, ${COLORS.primary} 0%, ${COLORS.cyan} 100%)`}
                    trailColor="#e2e8f0"
                  />

                  <Text style={{ fontSize: 12, color: COLORS.muted, marginTop: 8, display: "block" }}>
                    {t("profile1.completion.hint")}
                  </Text>
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={16}>
              <Form
                form={form}
                layout="vertical"
                requiredMark={false}
                onValuesChange={() => {
                  if (!isEditing) return;
                  setIsDirty(true);
                }}
              >
                <Card
                  variant="outlined"
                  style={{
                    borderRadius: 26,
                    boxShadow: COLORS.cardShadow,
                    border: COLORS.softBorder,
                    padding: "8px",
                  }}
                  title={
                    <Space>
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 999,
                          background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.cyan} 100%)`,
                        }}
                      />
                      <span style={{ fontWeight: 900, fontSize: 18, color: COLORS.ink }}>
                        {t("profile1.section.personalInfo")}
                      </span>
                    </Space>
                  }
                  extra={
                    <Space>
                      {isEditing ? (
                        <Tag color="gold" icon={<InfoCircleOutlined />}>
                          {t("profile1.mode.editing")}
                        </Tag>
                      ) : (
                        <Tag color="green">{t("profile1.mode.view")}</Tag>
                      )}

                      <Button icon={<EditOutlined />} onClick={enterEditMode} disabled={isEditing}>
                        {t("common2.edit")}
                      </Button>
                    </Space>
                  }
                >
                  <Row gutter={20}>
                    {["displayName", "gender", "dateOfBirth"].map((key) => (
                      <Col xs={24} md={key === "displayName" ? 24 : 12} key={key}>
                        {renderField(key)}
                      </Col>
                    ))}
                  </Row>

                  <Divider style={{ margin: "24px 0" }} />

                  <Row gutter={20}>
                    {["email", "phone", "address"].map((key) => (
                      <Col xs={24} md={12} key={key}>
                        {renderField(key)}
                      </Col>
                    ))}
                  </Row>

                  <Divider style={{ margin: "24px 0" }} />

                  {renderField("bio")}

                  <div
                    style={{
                      marginTop: 28,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderTop: "1px solid rgba(2,132,199,0.10)",
                      paddingTop: 18,
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <Popconfirm
                      title={t("profile1.confirm.cancelTitle")}
                      description={t("profile1.confirm.cancelDesc")}
                      onConfirm={cancelEdit}
                      okText={t("profile1.confirm.okCancelEdit")}
                      cancelText={t("profile1.confirm.keepEditing")}
                      disabled={!isEditing || saving}
                    >
                      <Button danger type="text" icon={<ReloadOutlined />} disabled={!isEditing || saving}>
                        {t("common2.cancel")}
                      </Button>
                    </Popconfirm>

                    <Space>
                      <Button onClick={fetchProfile} icon={<ReloadOutlined />} disabled={saving}>
                        {t("common2.reload")}
                      </Button>

                      <Button
                        type="primary"
                        size="large"
                        onClick={onSave}
                        loading={saving}
                        disabled={!isEditing || !isDirty}
                        style={{
                          borderRadius: 14,
                          fontWeight: 900,
                          border: "none",
                          background: `linear-gradient(90deg, ${COLORS.primary} 0%, ${COLORS.cyan} 100%)`,
                          boxShadow: "0 10px 20px rgba(16, 185, 129, 0.22)",
                        }}
                      >
                        {t("profile1.actions.update")}
                      </Button>
                    </Space>
                  </div>
                </Card>
              </Form>
            </Col>
          </Row>
        )}
      </div>

      <style jsx="true">{`
        .fintech-input {
          border-radius: 12px !important;
          padding: 8px 12px;
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;
