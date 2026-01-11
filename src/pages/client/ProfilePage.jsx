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
  PhoneOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getMyProfileAPI,
  updateMyProfileAPI,
  uploadMyAvatarAPI,
} from "../../services/api.profile";
import { useCurrentApp } from "../../components/context/app.context";

// ✅ i18n
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;

// ✅ Field names đúng theo schema BE
const FIELD_ORDER = [
  "displayName",
  "gender",
  "dateOfBirth",
  "email",
  "phone",
  "address",
  "bio",
];

const ProfilePage = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const { setProfile } = useCurrentApp();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rawProfile, setRawProfile] = useState(null);

  // ✅ Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // ✅ store last loaded values to revert without refetch
  const [initialFormValues, setInitialFormValues] = useState(null);

  const [avatarLoading, setAvatarLoading] = useState(false);

  // ✅ label map theo i18n
  const labelMap = useMemo(
    () => ({
      displayName: t("profile.fields.displayName"),
      email: t("profile.fields.email"),
      phone: t("profile.fields.phone"),
      address: t("profile.fields.address"),
      dateOfBirth: t("profile.fields.dateOfBirth"),
      bio: t("profile.fields.bio"),
      gender: t("profile.fields.gender"),
    }),
    [t]
  );

  // ✅ Gender mapping (UI <-> BE) (UI string phụ thuộc i18n)
  const genderMap = useMemo(
    () => ({
      toUI: (val) =>
        val === "male"
          ? t("profile.gender.male")
          : val === "female"
          ? t("profile.gender.female")
          : null,
      toBE: (val) => (val === t("profile.gender.male") ? "male" : "female"),
    }),
    [t]
  );

  // ✅ Chỉ render các field hợp lệ (email chỉ xem)
  const editableKeys = useMemo(() => FIELD_ORDER.filter((k) => k !== "email"), []);

  const profileCompletion = useMemo(() => {
    if (!rawProfile) return 0;
    const importantFields = ["displayName", "phone", "address", "dateOfBirth", "gender"];
    const values = form.getFieldsValue();
    const filled = importantFields.filter((f) => !!values[f]).length;
    return Math.round((filled / importantFields.length) * 100);
  }, [rawProfile, isDirty, form]);

  const buildFormattedProfile = (profile) => {
    const email = profile?.email ?? profile?.user?.email ?? profile?.userId?.email ?? "";
    const displayName = profile?.displayName ?? t("profile.fallback.displayName");
    const avatarUrl = profile?.avatarUrl ?? profile?.avatar ?? "";
    const phone = profile?.phone ?? "";
    const address = profile?.address ?? "";
    const bio = profile?.bio ?? "";
    const gender = profile?.gender ? genderMap.toUI(profile.gender) : null;
    const dateOfBirth = profile?.dateOfBirth ? dayjs(profile.dateOfBirth) : null;

    return {
      displayName,
      email,
      avatarUrl,
      phone,
      address,
      bio,
      gender,
      dateOfBirth,
    };
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

        setProfile(profile);
        setIsDirty(false);
        setIsEditing(false);
      }
    } catch (err) {
      message.error(t("profile.toast.serverError"));
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
    setIsDirty(false);
    setIsEditing(false);
    message.info(t("profile.toast.cancelled"));
  };

  const handleUploadAvatar = async ({ file, onSuccess, onError }) => {
    const realFile = file?.originFileObj ?? file;

    if (realFile.size / 1024 / 1024 >= 2) {
      message.error(t("profile.avatar.tooLarge"));
      onError?.();
      return;
    }

    const previewUrl = URL.createObjectURL(realFile);
    form.setFieldsValue({ avatarUrl: previewUrl });
    setAvatarLoading(true);

    try {
      const res = await uploadMyAvatarAPI(realFile);

      const avatarUrl =
        res?.data?.data?.avatarUrl ||
        res?.data?.avatarUrl ||
        res?.data?.data?.secure_url ||
        res?.data?.secure_url ||
        null;

      if (avatarUrl) {
        form.setFieldsValue({ avatarUrl: `${avatarUrl}?t=${Date.now()}` });
        setProfile((prev) => ({ ...prev, avatarUrl }));
        message.success(t("profile.avatar.updated"));
        onSuccess?.("ok");
      } else {
        console.warn("Upload OK but avatarUrl missing:", res?.data);
        onSuccess?.("ok");
      }
    } catch (err) {
      console.error("Upload avatar error:", err);
      message.error(err?.response?.data?.message || t("profile.avatar.uploadError"));

      if (initialFormValues?.avatarUrl) {
        form.setFieldsValue({ avatarUrl: initialFormValues.avatarUrl });
      }
      onError?.();
    } finally {
      setAvatarLoading(false);
    }
  };

  const onSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const payload = {
        displayName: values.displayName ?? "",
        phone: values.phone ?? "",
        address: values.address ?? "",
        bio: values.bio ?? "",
        gender: values.gender ? genderMap.toBE(values.gender) : "unknown",
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format("YYYY-MM-DD") : null,
      };

      await updateMyProfileAPI(payload);

      message.success(t("profile.toast.updated"));
      setIsDirty(false);
      setIsEditing(false);
      await fetchProfile();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(t("profile.toast.updateFail"));
    } finally {
      setSaving(false);
    }
  };

  const renderField = (key) => {
    const label = labelMap[key] || key;

    const isEmail = key === "email";
    const disabled = !isEditing || isEmail;

    if (key === "gender") {
      return (
        <Form.Item name={key} label={label} key={key}>
          <Radio.Group
            disabled={!isEditing}
            optionType="button"
            buttonStyle="solid"
            style={{ width: "100%" }}
            className="fintech-radio"
          >
            <Radio.Button value={t("profile.gender.male")} style={{ width: "50%", textAlign: "center" }}>
              <ManOutlined /> {t("profile.gender.male")}
            </Radio.Button>
            <Radio.Button value={t("profile.gender.female")} style={{ width: "50%", textAlign: "center" }}>
              <WomanOutlined /> {t("profile.gender.female")}
            </Radio.Button>
          </Radio.Group>
        </Form.Item>
      );
    }

    if (key === "dateOfBirth") {
      return (
        <Form.Item name={key} label={label} key={key}>
          <DatePicker
            disabled={!isEditing}
            format="DD/MM/YYYY"
            style={{ width: "100%" }}
            placeholder={t("profile.placeholders.date")}
            className="fintech-input"
          />
        </Form.Item>
      );
    }

    if (key === "bio") {
      return (
        <Form.Item name={key} label={label} key={key}>
          <Input.TextArea
            disabled={!isEditing}
            rows={3}
            placeholder={t("profile.placeholders.bio")}
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
                  message: t("profile.validation.phoneInvalid"),
                },
              ]
            : []
        }
      >
        <Input
          disabled={disabled}
          prefix={
            key === "email" ? (
              <MailOutlined />
            ) : key === "phone" ? (
              <PhoneOutlined />
            ) : key === "address" ? (
              <HomeOutlined />
            ) : (
              <EditOutlined />
            )
          }
          suffix={
            isEmail ? (
              <Tooltip title={t("profile.hints.emailLocked")}>
                <LockOutlined className="text-slate-400" />
              </Tooltip>
            ) : null
          }
          placeholder={t("profile.placeholders.input", { field: String(label).toLowerCase() })}
          className="fintech-input"
        />
      </Form.Item>
    );
  };

  if (!loading && !rawProfile) {
    return (
      <Result
        status="404"
        title={t("profile.notFound.title")}
        subTitle={t("profile.notFound.subtitle")}
        extra={
          <Button type="primary" icon={<ReloadOutlined />} onClick={fetchProfile}>
            {t("profile.notFound.retry")}
          </Button>
        }
      />
    );
  }

  const uiValues = form.getFieldsValue();
  const displayName =
    uiValues.displayName || rawProfile?.displayName || t("profile.fallback.displayName");
  const email = uiValues.email || rawProfile?.email || rawProfile?.user?.email || "";
  const avatarSrc = uiValues.avatarUrl || rawProfile?.avatarUrl || rawProfile?.avatar || null;

  return (
    <div
      className="
        min-h-screen
        bg-gradient-to-b from-emerald-50/70 via-white to-white
        dark:bg-none dark:bg-[var(--color-background)]
        py-10 px-4
      "
    >
      <div className="max-w-5xl mx-auto">
        {loading ? (
          <Skeleton active avatar paragraph={{ rows: 12 }} />
        ) : (
          <>
            <div className="top-glow" />

            <Row gutter={[24, 24]}>
              {/* LEFT */}
              <Col xs={24} lg={8}>
                <Space direction="vertical" size={18} style={{ width: "100%" }}>
                  <Card
                    bordered={false}
                    className="
                      profile-card
                      !rounded-3xl overflow-hidden text-center
                      !bg-white border border-emerald-100 shadow-sm
                      dark:!bg-[var(--color-background-alt)]
                      dark:!border-[var(--color-border)]
                    "
                  >
                    <div className="card-ribbon" />

                    <div className="avatar-wrapper">
                      <Avatar
                        size={132}
                        src={avatarSrc || undefined}
                        icon={<UserOutlined />}
                        className="profile-avatar"
                      />
                      <Upload showUploadList={false} customRequest={handleUploadAvatar} accept="image/*">
                        <div className="avatar-overlay">
                          <CameraOutlined style={{ fontSize: 24, color: "#fff" }} />
                          <Text style={{ color: "#fff", display: "block", fontSize: 12 }}>
                            {t("profile.avatar.change")}
                          </Text>
                        </div>
                      </Upload>
                      {avatarLoading ? <div className="avatar-loading" /> : null}
                    </div>

                    <Title
                      level={3}
                      className="!mt-4 !mb-1 !font-extrabold !text-slate-900 dark:!text-[var(--color-text-primary)]"
                    >
                      {displayName}
                      <CheckCircleFilled className="ml-2 text-emerald-500" style={{ fontSize: 18 }} />
                    </Title>

                    <Text className="!text-slate-600 dark:!text-[var(--color-text-secondary)]">
                      <MailOutlined /> {email || "—"}
                    </Text>

                    <div className="mt-4">
                      <Tag className="trusted-tag">
                        {t("profile.badge.trusted")}
                      </Tag>
                    </div>

                    <div className="mt-5 rounded-2xl p-4 text-left completion-box">
                      <div className="flex items-center justify-between mb-2">
                        <Text strong className="completion-title">
                          {t("profile.completion.title")}
                        </Text>
                        <Text strong className="text-emerald-600 dark:text-emerald-400">
                          {profileCompletion}%
                        </Text>
                      </div>

                      <Progress
                        percent={profileCompletion}
                        showInfo={false}
                        strokeColor="linear-gradient(90deg, #10b981 0%, #22d3ee 100%)"
                        trailColor="#e2e8f0"
                      />

                      <Text className="block mt-2 text-xs text-slate-500 dark:text-[var(--color-text-secondary)]">
                        {t("profile.completion.hint")}
                      </Text>
                    </div>
                  </Card>
                </Space>
              </Col>

              {/* RIGHT */}
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
                    bordered={false}
                    className="
                      profile-form-card
                      !rounded-3xl
                      !bg-white border border-emerald-100 shadow-sm
                      dark:!bg-[var(--color-background-alt)]
                      dark:!border-[var(--color-border)]
                    "
                    title={
                      <Space>
                        <div className="dot-gradient" />
                        <span className="card-title">
                          {t("profile.title")}
                        </span>
                      </Space>
                    }
                    extra={
                      <Space>
                        {isEditing ? (
                          <Tag color="gold" icon={<InfoCircleOutlined />}>
                            {t("profile.mode.editing")}
                          </Tag>
                        ) : (
                          <Tag color="green">{t("profile.mode.view")}</Tag>
                        )}

                        <Button
                          icon={<EditOutlined />}
                          onClick={enterEditMode}
                          disabled={isEditing}
                          className="btn-edit"
                        >
                          {t("profile.actions.edit")}
                        </Button>
                      </Space>
                    }
                  >
                    <Title level={5} className="form-section-title">
                      {t("profile.sections.basic")}
                    </Title>

                    <Row gutter={16}>
                      {["displayName", "gender", "dateOfBirth"].map((key) => (
                        <Col xs={24} md={key === "displayName" ? 24 : 12} key={key}>
                          {renderField(key)}
                        </Col>
                      ))}
                    </Row>

                    <Divider className="profile-divider" />

                    <Title level={5} className="form-section-title">
                      {t("profile.sections.contact")}
                    </Title>

                    <Row gutter={16}>
                      {["email", "phone", "address"].map((key) => (
                        <Col xs={24} md={12} key={key}>
                          {renderField(key)}
                        </Col>
                      ))}
                    </Row>

                    <Divider className="profile-divider" />

                    <Title level={5} className="form-section-title">
                      {t("profile.sections.bio")}
                    </Title>
                    {renderField("bio")}

                    <div className="action-bar">
                      <Popconfirm
                        title={t("profile.confirm.cancelTitle")}
                        description={t("profile.confirm.cancelDesc")}
                        onConfirm={cancelEdit}
                        okText={t("profile.confirm.cancelOk")}
                        cancelText={t("profile.confirm.cancelNo")}
                        disabled={!isEditing || saving}
                      >
                        <Button danger type="text" icon={<ReloadOutlined />} disabled={!isEditing || saving}>
                          {t("profile.actions.cancel")}
                        </Button>
                      </Popconfirm>

                      <Space>
                        <Button
                          type="default"
                          onClick={fetchProfile}
                          icon={<ReloadOutlined />}
                          disabled={saving}
                          className="btn-soft"
                        >
                          {t("profile.actions.reload")}
                        </Button>

                        <Button
                          type="primary"
                          size="large"
                          onClick={onSave}
                          loading={saving}
                          disabled={!isEditing || !isDirty}
                          className="fintech-btn-primary"
                        >
                          {t("profile.actions.update")}
                        </Button>
                      </Space>
                    </div>
                  </Card>
                </Form>
              </Col>
            </Row>
          </>
        )}
      </div>

      {/* ✅ Dark overrides giống style bạn làm cho Noti */}
      <style jsx="true">{`
        .top-glow {
          width: 100%;
          height: 140px;
          margin: 0 auto 18px;
          border-radius: 28px;
          background: radial-gradient(
              circle at 20% 20%,
              rgba(34, 211, 238, 0.22) 0%,
              transparent 55%
            ),
            radial-gradient(circle at 70% 40%, rgba(16, 185, 129, 0.22) 0%, transparent 60%);
          filter: blur(2px);
        }
        .dark .top-glow {
          opacity: 0.7;
          filter: blur(6px);
        }

        .profile-card .ant-card-body {
          padding: 28px 20px;
          position: relative;
        }

        .card-ribbon {
          position: absolute;
          inset: 0;
          height: 120px;
          background: linear-gradient(90deg, rgba(16, 185, 129, 0.16), rgba(34, 211, 238, 0.12));
          pointer-events: none;
        }
        .dark .card-ribbon {
          background: linear-gradient(
            90deg,
            rgba(16, 185, 129, 0.14),
            rgba(34, 211, 238, 0.10)
          );
        }

        .avatar-wrapper {
          position: relative;
          display: inline-block;
          cursor: pointer;
          margin-top: 6px;
        }

        .profile-avatar {
          border: 4px solid #fff;
          box-shadow: 0 12px 26px rgba(0, 0, 0, 0.10);
        }
        .dark .profile-avatar {
          border-color: rgba(255, 255, 255, 0.10);
          box-shadow: 0 16px 34px rgba(0, 0, 0, 0.45);
        }

        .avatar-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.65), rgba(34, 211, 238, 0.55));
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: all 0.25s ease;
        }
        .avatar-wrapper:hover .avatar-overlay {
          opacity: 1;
        }

        .avatar-loading {
          position: absolute;
          inset: -8px;
          border-radius: 50%;
          border: 2px solid rgba(16, 185, 129, 0.25);
          border-top-color: rgba(34, 211, 238, 0.65);
          animation: spin 0.9s linear infinite;
          pointer-events: none;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .trusted-tag {
          border-radius: 999px !important;
          padding: 4px 12px !important;
          background: rgba(16, 185, 129, 0.12) !important;
          border: 1px solid rgba(16, 185, 129, 0.20) !important;
          color: #059669 !important;
          font-weight: 700 !important;
        }
        .dark .trusted-tag {
          background: rgba(16, 185, 129, 0.14) !important;
          border-color: rgba(16, 185, 129, 0.25) !important;
          color: rgba(110, 231, 183, 0.95) !important;
        }

        .completion-box {
          background: linear-gradient(180deg, rgba(16, 185, 129, 0.08), rgba(34, 211, 238, 0.06));
          border: 1px solid rgba(2, 132, 199, 0.10);
        }
        .dark .completion-box {
          background: rgba(255, 255, 255, 0.04);
          border-color: var(--color-border);
        }

        .completion-title {
          color: #0f766e !important;
        }
        .dark .completion-title {
          color: var(--color-text-primary) !important;
        }

        .dot-gradient {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: linear-gradient(135deg, #10b981 0%, #22d3ee 100%);
          box-shadow: 0 10px 18px rgba(16, 185, 129, 0.25);
        }

        .card-title {
          font-weight: 900;
          font-size: 18px;
          color: #0f172a;
        }
        .dark .card-title {
          color: var(--color-text-primary);
        }

        .profile-divider {
          margin: 22px 0 !important;
          border-color: rgba(2, 132, 199, 0.10) !important;
        }
        .dark .profile-divider {
          border-color: var(--color-border) !important;
        }

        .form-section-title {
          font-size: 12px !important;
          letter-spacing: 1px;
          color: #0f766e !important;
          margin-bottom: 14px !important;
          font-weight: 900 !important;
        }
        .dark .form-section-title {
          color: var(--color-text-secondary) !important;
        }

        /* Inputs / DatePicker */
        .fintech-input {
          border-radius: 12px !important;
          padding: 8px 12px;
        }

        .dark .fintech-input.ant-input,
        .dark .fintech-input .ant-input,
        .dark .fintech-input.ant-input-affix-wrapper,
        .dark .fintech-input.ant-picker,
        .dark .fintech-input.ant-input-textarea .ant-input {
          background: var(--color-background) !important;
          border-color: var(--color-border) !important;
          color: var(--color-text-primary) !important;
        }

        .dark .fintech-input.ant-input-affix-wrapper .ant-input-prefix,
        .dark .fintech-input.ant-input-affix-wrapper .ant-input-suffix,
        .dark .fintech-input.ant-picker .ant-picker-suffix {
          color: var(--color-text-secondary) !important;
        }

        .dark .fintech-input.ant-picker .ant-picker-input > input {
          color: var(--color-text-primary) !important;
        }

        /* Radio */
        .dark .fintech-radio .ant-radio-button-wrapper {
          background: var(--color-background) !important;
          border-color: var(--color-border) !important;
          color: var(--color-text-secondary) !important;
        }
        .dark .fintech-radio .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled) {
          background: rgba(16, 185, 129, 0.18) !important;
          border-color: rgba(16, 185, 129, 0.35) !important;
          color: var(--color-text-primary) !important;
        }

        /* Buttons */
        .btn-edit {
          border-radius: 12px !important;
          border: 1px solid rgba(16, 185, 129, 0.25) !important;
          color: #0f766e !important;
          background: rgba(16, 185, 129, 0.06) !important;
          font-weight: 800 !important;
        }
        .dark .btn-edit {
          background: rgba(255, 255, 255, 0.06) !important;
          border-color: var(--color-border) !important;
          color: var(--color-text-primary) !important;
        }

        .btn-soft {
          border-radius: 12px !important;
          border: 1px solid rgba(2, 132, 199, 0.18) !important;
          background: rgba(34, 211, 238, 0.06) !important;
          color: #075985 !important;
          font-weight: 800 !important;
        }
        .dark .btn-soft {
          background: rgba(255, 255, 255, 0.06) !important;
          border-color: var(--color-border) !important;
          color: var(--color-text-primary) !important;
        }

        .fintech-btn-primary {
          min-width: 190px;
          height: 48px !important;
          border-radius: 14px !important;
          background: linear-gradient(90deg, #10b981 0%, #22d3ee 100%) !important;
          border: none !important;
          font-weight: 900 !important;
          box-shadow: 0 10px 20px rgba(16, 185, 129, 0.22) !important;
        }
        .fintech-btn-primary:hover {
          opacity: 0.96;
          transform: translateY(-1px);
        }
        .fintech-btn-primary:disabled {
          background: rgba(255, 255, 255, 0.10) !important;
          color: rgba(255, 255, 255, 0.45) !important;
          box-shadow: none !important;
        }

        .action-bar {
          margin-top: 34px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid rgba(2, 132, 199, 0.10);
          padding-top: 18px;
          gap: 12px;
          flex-wrap: wrap;
        }
        .dark .action-bar {
          border-top-color: var(--color-border);
        }

        @media (max-width: 576px) {
          .fintech-btn-primary {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;
