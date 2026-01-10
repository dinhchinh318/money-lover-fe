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
import { getMyProfileAPI, updateMyProfileAPI,uploadMyAvatarAPI } from "../../services/api.profile";
import { useCurrentApp } from "../../components/context/app.context";

const { Title, Text } = Typography;

// --- CONFIGURATION & STYLES ---
const COLORS = {
  primary: "#10b981",
  primaryHover: "#059669",
  accent: "#34d399",
  cyan: "#22d3ee",
  ink: "#0f172a",
  muted: "#64748b",
  bgGradient: "linear-gradient(135deg, #ecfeff 0%, #f0fdf4 35%, #ffffff 100%)",
  cardShadow:
    "0 12px 30px -10px rgba(16, 185, 129, 0.18), 0 10px 18px -14px rgba(0,0,0,0.08)",
  softBorder: "1px solid rgba(16,185,129,0.14)",
};

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

const labelMap = {
  displayName: "Tên hiển thị",
  email: "Địa chỉ Email",
  phone: "Số điện thoại",
  address: "Địa chỉ cư trú",
  dateOfBirth: "Ngày sinh",
  bio: "Giới thiệu bản thân",
  gender: "Giới tính",
};

// Gender mapping
const genderMap = {
  toUI: (val) => (val === "male" ? "Nam" : val === "female" ? "Nữ" : null),
  toBE: (val) => (val === "Nam" ? "male" : "female"),
};

const ProfilePage = () => {
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

  // ✅ Chỉ render các field hợp lệ (đỡ lệch key giữa BE/FE)
  const editableKeys = useMemo(() => {
    return FIELD_ORDER.filter((k) => k !== "email"); // email chỉ xem, không sửa
  }, []);

  const profileCompletion = useMemo(() => {
    if (!rawProfile) return 0;
    const importantFields = ["displayName", "phone", "address", "dateOfBirth", "gender"];
    const values = form.getFieldsValue();
    const filled = importantFields.filter((f) => !!values[f]).length;
    return Math.round((filled / importantFields.length) * 100);
  }, [rawProfile, isDirty, form]);

  const buildFormattedProfile = (profile) => {
    // profile có thể kèm user/email tuỳ API
    const email = profile?.email ?? profile?.user?.email ?? profile?.userId?.email ?? "";
    const displayName = profile?.displayName ?? "Người Dùng";
    const avatarUrl = profile?.avatarUrl ?? profile?.avatar ?? "";
    const phone = profile?.phone ?? "";
    const address = profile?.address ?? "";
    const bio = profile?.bio ?? "";
    const gender = profile?.gender ? genderMap.toUI(profile.gender) : null;

    const dateOfBirth = profile?.dateOfBirth ? dayjs(profile.dateOfBirth) : null;

    return {
      displayName,
      email,
      avatarUrl, // để hiển thị avatar lấy đúng key
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
      message.error("Không thể kết nối máy chủ tài chính");
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
    message.info("Đã hủy chỉnh sửa");
  };

  const handleUploadAvatar = async ({ file, onSuccess, onError }) => {
    const realFile = file?.originFileObj ?? file;

    // validate size
    if (realFile.size / 1024 / 1024 >= 2) {
      message.error("Ảnh phải nhỏ hơn 2MB");
      onError?.();
      return;
    }

    // preview ngay
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
        form.setFieldsValue({
          avatarUrl: `${avatarUrl}?t=${Date.now()}`,
        });

        setProfile((prev) => ({ ...prev, avatarUrl }));
        message.success("Cập nhật ảnh đại diện thành công");
        onSuccess?.("ok");
      } else {
        console.warn("Upload OK but avatarUrl missing:", res?.data);
        onSuccess?.("ok"); // vẫn coi là thành công
      }

    } catch (err) {
      console.error("Upload avatar error:", err);

      message.error(
        err?.response?.data?.message || "Không thể tải ảnh lên"
      );

      // revert preview
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

      // ✅ payload đúng schema BE
      const payload = {
        displayName: values.displayName ?? "",
        phone: values.phone ?? "",
        address: values.address ?? "",
        bio: values.bio ?? "",
        gender: values.gender ? genderMap.toBE(values.gender) : "unknown",
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format("YYYY-MM-DD") : null,
      };

      await updateMyProfileAPI(payload);

      message.success("Hồ sơ đã được cập nhật");
      setIsDirty(false);
      setIsEditing(false);
      await fetchProfile();
    } catch (err) {
      if (err?.errorFields) return;
      message.error("Cập nhật thất bại, vui lòng kiểm tra đường truyền");
    } finally {
      setSaving(false);
    }
  };

  const renderField = (key) => {
    const label = labelMap[key] || key;

    // ✅ email luôn khóa, các field khác khóa khi không edit
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
            <Radio.Button value="Nam" style={{ width: "50%", textAlign: "center" }}>
              <ManOutlined /> Nam
            </Radio.Button>
            <Radio.Button value="Nữ" style={{ width: "50%", textAlign: "center" }}>
              <WomanOutlined /> Nữ
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
            placeholder="Chọn ngày sinh"
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
            placeholder="Ví dụ: Tôi ưu tiên tiết kiệm 20% thu nhập hàng tháng..."
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
                  message: "Số điện thoại không hợp lệ",
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
              <Tooltip title="Email định danh không thể thay đổi">
                <LockOutlined style={{ color: "#94a3b8" }} />
              </Tooltip>
            ) : null
          }
          placeholder={`Nhập ${label.toLowerCase()}...`}
          className="fintech-input"
        />
      </Form.Item>
    );
  };

  if (!loading && !rawProfile) {
    return (
      <Result
        status="404"
        title="Không tìm thấy hồ sơ"
        subTitle="Có lỗi khi tải dữ liệu người dùng."
        extra={
          <Button type="primary" icon={<ReloadOutlined />} onClick={fetchProfile}>
            Thử lại
          </Button>
        }
      />
    );
  }

  // ✅ display data đúng schema
  const uiValues = form.getFieldsValue();
  const displayName = uiValues.displayName || rawProfile?.displayName || "Người Dùng";
  const email = uiValues.email || rawProfile?.email || rawProfile?.user?.email || "";
  const avatarSrc = uiValues.avatarUrl || rawProfile?.avatarUrl || rawProfile?.avatar || null;

  return (
    <div style={{ background: COLORS.bgGradient, minHeight: "100vh", padding: "44px 20px" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        {loading ? (
          <Skeleton active avatar paragraph={{ rows: 12 }} />
        ) : (
          <>
            <div className="top-glow" />

            <Row gutter={[32, 32]}>
              {/* LEFT */}
              <Col xs={24} lg={8}>
                <Space direction="vertical" size={24} style={{ width: "100%" }}>
                  <Card
                    bordered={false}
                    className="profile-card"
                    style={{
                      borderRadius: 26,
                      textAlign: "center",
                      boxShadow: COLORS.cardShadow,
                      border: COLORS.softBorder,
                      overflow: "hidden",
                    }}
                  >
                    <div className="card-ribbon" />

                    <div className="avatar-wrapper">
                      <Avatar
                        size={132}
                        src={avatarSrc || undefined}
                        icon={<UserOutlined />}
                        style={{
                          border: "4px solid #fff",
                          boxShadow: "0 12px 26px rgba(0,0,0,0.10)",
                        }}
                      />
                      <Upload showUploadList={false} customRequest={handleUploadAvatar} accept="image/*">
                        <div className="avatar-overlay">
                          <CameraOutlined style={{ fontSize: 24, color: "#fff" }} />
                          <Text style={{ color: "#fff", display: "block", fontSize: 12 }}>
                            Ảnh đại diện
                          </Text>
                        </div>
                      </Upload>
                      {avatarLoading ? <div className="avatar-loading" /> : null}
                    </div>

                    <Title level={3} style={{ marginTop: 16, marginBottom: 4, fontWeight: 800, color: COLORS.ink }}>
                      {displayName}
                      <CheckCircleFilled style={{ color: COLORS.primary, marginLeft: 8, fontSize: 18 }} />
                    </Title>

                    <Text type="secondary">
                      <MailOutlined /> {email || "—"}
                    </Text>

                    <div style={{ marginTop: 18 }}>
                      <Tag
                        color="success"
                        style={{
                          borderRadius: 999,
                          padding: "4px 12px",
                          background: "rgba(16,185,129,0.12)",
                          border: "1px solid rgba(16,185,129,0.20)",
                          color: COLORS.primaryHover,
                          fontWeight: 600,
                        }}
                      >
                        Hồ sơ tin cậy
                      </Tag>
                    </div>

                    <div
                      style={{
                        marginTop: 22,
                        padding: "16px",
                        background: "linear-gradient(180deg, rgba(16,185,129,0.08), rgba(34,211,238,0.06))",
                        borderRadius: 18,
                        textAlign: "left",
                        border: "1px solid rgba(2,132,199,0.10)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <Text strong style={{ color: "#0f766e" }}>
                          Mức độ hoàn thiện
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
                        Hoàn thiện hồ sơ để trải nghiệm tính năng cá nhân hóa tốt hơn.
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
                            boxShadow: "0 10px 18px rgba(16,185,129,0.25)",
                          }}
                        />
                        <span style={{ fontWeight: 900, fontSize: 18, color: COLORS.ink }}>
                          Thông tin cá nhân
                        </span>
                      </Space>
                    }
                    extra={
                      <Space>
                        {isEditing ? (
                          <Tag color="gold" icon={<InfoCircleOutlined />}>
                            Đang chỉnh sửa
                          </Tag>
                        ) : (
                          <Tag color="green">Chế độ xem</Tag>
                        )}

                        <Button
                          icon={<EditOutlined />}
                          onClick={enterEditMode}
                          disabled={isEditing}
                          className="btn-edit"
                        >
                          Chỉnh sửa
                        </Button>
                      </Space>
                    }
                  >
                    <Title level={5} className="form-section-title">
                      THÔNG TIN CƠ BẢN
                    </Title>
                    <Row gutter={20}>
                      {["displayName", "gender", "dateOfBirth"].map((key) => (
                        <Col xs={24} md={key === "displayName" ? 24 : 12} key={key}>
                          {renderField(key)}
                        </Col>
                      ))}
                    </Row>

                    <Divider style={{ margin: "24px 0" }} />

                    <Title level={5} className="form-section-title">
                      LIÊN HỆ & CƯ TRÚ
                    </Title>
                    <Row gutter={20}>
                      {["email", "phone", "address"].map((key) => (
                        <Col xs={24} md={12} key={key}>
                          {renderField(key)}
                        </Col>
                      ))}
                    </Row>

                    <Divider style={{ margin: "24px 0" }} />

                    <Title level={5} className="form-section-title">
                      GIỚI THIỆU
                    </Title>
                    {renderField("bio")}

                    <div
                      style={{
                        marginTop: 40,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderTop: "1px solid rgba(2,132,199,0.10)",
                        paddingTop: 22,
                        gap: 12,
                        flexWrap: "wrap",
                      }}
                    >
                      <Popconfirm
                        title="Hủy chỉnh sửa?"
                        description="Mọi thay đổi sẽ bị bỏ và quay lại dữ liệu trước đó."
                        onConfirm={cancelEdit}
                        okText="Hủy chỉnh sửa"
                        cancelText="Tiếp tục sửa"
                        disabled={!isEditing || saving}
                      >
                        <Button danger type="text" icon={<ReloadOutlined />} disabled={!isEditing || saving}>
                          Hủy
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
                          Tải lại
                        </Button>

                        <Button
                          type="primary"
                          size="large"
                          onClick={onSave}
                          loading={saving}
                          disabled={!isEditing || !isDirty}
                          className="fintech-btn-primary"
                        >
                          Cập nhật hồ sơ
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

        .profile-card .ant-card-body {
          padding: 32px 24px;
          position: relative;
        }
        .card-ribbon {
          position: absolute;
          inset: 0;
          height: 120px;
          background: linear-gradient(90deg, rgba(16, 185, 129, 0.16), rgba(34, 211, 238, 0.12));
          pointer-events: none;
        }

        .avatar-wrapper {
          position: relative;
          display: inline-block;
          cursor: pointer;
          margin-top: 6px;
        }

        .avatar-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
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

        .form-section-title {
          font-size: 12px !important;
          letter-spacing: 1px;
          color: #0f766e !important;
          margin-bottom: 18px !important;
          font-weight: 800 !important;
        }

        .fintech-input {
          border-radius: 12px !important;
          padding: 8px 12px;
        }

        .fintech-btn-primary {
          min-width: 190px;
          height: 48px !important;
          border-radius: 14px !important;
          background: linear-gradient(90deg, ${COLORS.primary} 0%, ${COLORS.cyan} 100%) !important;
          border: none !important;
          font-weight: 800 !important;
          box-shadow: 0 10px 20px rgba(16, 185, 129, 0.22) !important;
        }
        .fintech-btn-primary:hover {
          opacity: 0.95;
          transform: translateY(-1px);
        }
        .fintech-btn-primary:disabled {
          background: #e2e8f0 !important;
          color: #94a3b8 !important;
          box-shadow: none !important;
        }

        .btn-edit {
          border-radius: 12px !important;
          border: 1px solid rgba(16, 185, 129, 0.25) !important;
          color: #0f766e !important;
          background: rgba(16, 185, 129, 0.06) !important;
          font-weight: 700 !important;
        }

        .btn-soft {
          border-radius: 12px !important;
          border: 1px solid rgba(2, 132, 199, 0.18) !important;
          background: rgba(34, 211, 238, 0.06) !important;
          color: #075985 !important;
          font-weight: 700 !important;
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
