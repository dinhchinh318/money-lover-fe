import React, { useEffect, useMemo, useState } from "react";
import {
  Card, Form, Switch, Button, message, Space, Typography, Divider, 
  Spin, Tag, Row, Col, Popconfirm, Tooltip, Select, Segmented, ConfigProvider
} from "antd";
import {
  SettingOutlined, EditOutlined, SaveOutlined, CloseOutlined,
  ReloadOutlined, LockOutlined, BellOutlined, GlobalOutlined,
  AppstoreOutlined, InfoCircleOutlined, BgColorsOutlined
} from "@ant-design/icons";
import { getMySettingAPI, updateMySettingAPI, resetMySettingAPI } from "../../services/api.setting";

const { Title, Text } = Typography;

// 1. Danh sách các trường kỹ thuật tuyệt đối không hiển thị
const EXCLUDED_FIELDS = ["_id", "id", "user", "userId", "createdAt", "updatedAt", "deletedAt", "__v", "deleted", "isSystem", "role"];

// 2. Định nghĩa các Options cho các trường đặc thù (Thay vì nhập liệu)
const FIELD_OPTIONS = {
  language: [
    { label: 'Tiếng Việt', value: 'vi' },
    { label: 'English', value: 'en' },
    { label: 'Français', value: 'fr' }
  ],
  currency: [
    { label: 'VNĐ (₫)', value: 'VND' },
    { label: 'USD ($)', value: 'USD' },
    { label: 'EUR (€)', value: 'EUR' }
  ],
  theme: [
    { label: 'Sáng', value: 'light', icon: <BgColorsOutlined /> },
    { label: 'Tối', value: 'dark', icon: <BgColorsOutlined /> },
    { label: 'Hệ thống', value: 'system', icon: <SettingOutlined /> }
  ],
  notificationFrequency: [
    { label: 'Tức thì', value: 'instant' },
    { label: 'Hàng ngày', value: 'daily' },
    { label: 'Hàng tuần', value: 'weekly' }
  ]
};

const SettingPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [rawSetting, setRawSetting] = useState(null);

  const fetchSetting = async () => {
    setLoading(true);
    try {
      const res = await getMySettingAPI();
      const setting = res?.data?.data ?? res?.data ?? null;
      
      if (setting) {
        const cleanSetting = Object.keys(setting)
          .filter(key => !EXCLUDED_FIELDS.includes(key))
          .reduce((obj, key) => {
            obj[key] = setting[key];
            return obj;
          }, {});
        
        setRawSetting(cleanSetting);
        form.setFieldsValue(cleanSetting);
      }
      setIsEditing(false);
    } catch (err) {
      message.error("Không thể kết nối máy chủ thiết lập");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSetting(); }, []);

  const onSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await updateMySettingAPI(values);
      message.success("Thiết lập đã được cập nhật thành công");
      await fetchSetting();
    } catch (err) {
      message.error("Lỗi cập nhật");
    } finally {
      setSaving(false);
    }
  };

  // Phân loại nhóm logic
  const groupedFields = useMemo(() => {
    if (!rawSetting) return {};
    const groups = {
      security: { title: "Bảo mật tài khoản", icon: <LockOutlined />, keys: [] },
      notification: { title: "Thông báo & Nhắc nhở", icon: <BellOutlined />, keys: [] },
      display: { title: "Giao diện & Ngôn ngữ", icon: <GlobalOutlined />, keys: [] },
      other: { title: "Cấu hình khác", icon: <AppstoreOutlined />, keys: [] },
    };

    Object.keys(rawSetting).forEach(key => {
      const k = key.toLowerCase();
      if (k.match(/pass|2fa|security|lock|privacy/)) groups.security.keys.push(key);
      else if (k.match(/notif|alert|remind|email|push/)) groups.notification.keys.push(key);
      else if (k.match(/theme|lang|color|display|mode|currency/)) groups.display.keys.push(key);
      else groups.other.keys.push(key);
    });
    return groups;
  }, [rawSetting]);

  // Hàm render UI thông minh dựa trên Key và Type
  const renderSmartField = (key) => {
    const value = rawSetting[key];
    const type = typeof value;
    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());

    // 1. Dạng Boolean (Switch)
    if (type === "boolean") {
      return (
        <Col xs={24} key={key}>
          <div className={`setting-row-item ${!isEditing ? 'readonly' : ''}`}>
            <div className="setting-info">
              <Text strong className="setting-label">{label}</Text>
              <Text type="secondary" className="setting-desc">Kích hoạt hoặc vô hiệu hóa tính năng này</Text>
            </div>
            <Form.Item name={key} valuePropName="checked" noStyle>
              <Switch disabled={!isEditing} size="medium" />
            </Form.Item>
          </div>
        </Col>
      );
    }

    // 2. Dạng Lựa chọn (Select/Segmented) - Nếu có trong FIELD_OPTIONS
    const optionKey = Object.keys(FIELD_OPTIONS).find(optKey => key.toLowerCase().includes(optKey));
    
    return (
      <Col xs={24} md={12} key={key}>
        <div className="setting-input-card">
          <Form.Item name={key} label={<Text strong className="input-label">{label}</Text>}>
            {optionKey ? (
              key.toLowerCase().includes('theme') ? (
                <Segmented 
                  options={FIELD_OPTIONS[optionKey]} 
                  disabled={!isEditing} 
                  block 
                  className="modern-segmented"
                />
              ) : (
                <Select 
                  options={FIELD_OPTIONS[optionKey]} 
                  disabled={!isEditing} 
                  className="modern-select"
                  placeholder="Chọn giá trị..."
                />
              )
            ) : (
               /* Fallback cho các trường không xác định nhưng không phải boolean */
              <Select 
                disabled={!isEditing} 
                className="modern-select"
                options={[{label: value, value: value}]} 
              />
            )}
          </Form.Item>
        </div>
      </Col>
    );
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#10b981',
          borderRadius: 12,
        },
      }}
    >
      <div className="page-wrapper">
        <div className="content-container">
          <header className="page-header">
            <Space size={16}>
              <div className="icon-box"><SettingOutlined /></div>
              <div>
                <Title level={3} style={{ margin: 0 }}>Cấu hình ứng dụng</Title>
                <Text type="secondary">Tùy chỉnh trải nghiệm cá nhân và bảo mật của bạn</Text>
              </div>
            </Space>
            <div className="header-status">
              {isEditing ? <Tag color="warning" className="pulse-tag">Đang chỉnh sửa</Tag> : <Tag color="success">Chế độ xem</Tag>}
            </div>
          </header>

          {loading ? (
            <div className="loading-state"><Spin size="large" /></div>
          ) : (
            <Form form={form} layout="vertical" requiredMark={false}>
              {Object.values(groupedFields).map(group => (
                group.keys.length > 0 && (
                  <Card key={group.title} className="group-card" bordered={false}>
                    <div className="group-header">
                      <span className="group-icon">{group.icon}</span>
                      <Text strong className="group-title">{group.title}</Text>
                    </div>
                    <Row gutter={[24, 8]}>
                      {group.keys.map(k => renderSmartField(k))}
                    </Row>
                  </Card>
                )
              ))}

              <div className="footer-actions">
                <Popconfirm title="Xác nhận reset?" onConfirm={() => resetMySettingAPI().then(fetchSetting)}>
                  <Button type="link" danger icon={<ReloadOutlined />} disabled={isEditing}>
                    Khôi phục mặc định
                  </Button>
                </Popconfirm>

                <Space>
                  {!isEditing ? (
                    <Button type="primary" size="large" className="btn-main" onClick={() => setIsEditing(true)} icon={<EditOutlined />}>
                      Thay đổi thiết lập
                    </Button>
                  ) : (
                    <>
                      <Button size="large" onClick={() => { setIsEditing(false); form.setFieldsValue(rawSetting); }} icon={<CloseOutlined />}>Huỷ</Button>
                      <Button type="primary" size="large" className="btn-main" onClick={onSave} loading={saving} icon={<SaveOutlined />}>
                        Lưu cấu hình
                      </Button>
                    </>
                  )}
                </Space>
              </div>
            </Form>
          )}
        </div>

        <style jsx="true">{`
          .page-wrapper {
            min-height: 100vh;
            background: #f8fafc;
            padding: 40px 20px;
          }
          .content-container {
            max-width: 850px;
            margin: 0 auto;
          }
          .page-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 32px;
          }
          .icon-box {
            width: 50px; height: 50px;
            background: #10b981;
            color: white;
            display: flex; align-items: center; justify-content: center;
            font-size: 22px;
            border-radius: 14px;
            box-shadow: 0 8px 20px rgba(16, 185, 129, 0.2);
          }
          .group-card {
            margin-bottom: 24px;
            border-radius: 20px !important;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05) !important;
          }
          .group-header {
            display: flex; align-items: center; gap: 10px;
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 1px solid #f1f5f9;
          }
          .group-icon { color: #10b981; font-size: 18px; }
          .group-title { text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-size: 12px; }

          /* Item Style */
          .setting-row-item {
            display: flex; justify-content: space-between; align-items: center;
            padding: 16px;
            background: #f8fafc;
            border-radius: 12px;
            margin-bottom: 8px;
            transition: 0.3s;
          }
          .setting-row-item.readonly { background: #ffffff; border: 1px solid #f1f5f9; }
          .setting-info { display: flex; flex-direction: column; }
          .setting-label { font-size: 15px; color: #1e293b; }
          .setting-desc { font-size: 12px; }

          .modern-select { width: 100% !important; }
          .modern-segmented { background: #f1f5f9 !important; padding: 4px !important; }

          .footer-actions {
            margin-top: 40px;
            display: flex; justify-content: space-between; align-items: center;
            background: white;
            padding: 20px 30px;
            border-radius: 20px;
            box-shadow: 0 -10px 20px rgba(0,0,0,0.02);
          }
          .btn-main {
            height: 48px !important;
            padding: 0 32px !important;
            font-weight: 600 !important;
            border-radius: 12px !important;
            box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3) !important;
          }
          .pulse-tag { animation: pulse 2s infinite; }
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.6; }
            100% { opacity: 1; }
          }
          @media (max-width: 640px) {
            .page-header { flex-direction: column; align-items: flex-start; gap: 16px; }
            .footer-actions { flex-direction: column-reverse; gap: 16px; }
          }
        `}</style>
      </div>
    </ConfigProvider>
  );
};

export default SettingPage;