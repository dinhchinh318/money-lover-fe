import React, { useEffect, useMemo, useState } from "react";
import {
  Card, List, Typography, Space, Button, Tag, message, 
  Popconfirm, Empty, Tabs, Badge, Modal, Tooltip, Row, Col
} from "antd";
import {
  BellOutlined, CheckCircleOutlined, DeleteOutlined, 
  ReloadOutlined, RestOutlined, EyeOutlined, MailOutlined
} from "@ant-design/icons";
import {
  getNotificationsAPI,
  markNotificationReadAPI,
  markAllNotificationsReadAPI,
  deleteNotificationAPI,
  restoreNotificationAPI,
} from "../../services/api.notification";

const { Title, Text, Paragraph } = Typography;

const NotificationPage = () => {
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [detailModal, setDetailModal] = useState({ open: false, data: null });

  // --- LOGIC HELPER ---
  const getId = (n) => n?._id || n?.id;
  const isRead = (n) => Boolean(n?.isRead ?? n?.read);
  const isDeleted = (n) => Boolean(n?.deletedAt ?? n?.isDeleted);

  // --- API HANDLERS ---
  const fetchNoti = async () => {
    setLoading(true);
    try {
      const res = await getNotificationsAPI();
      const data = res?.data?.data ?? res?.data ?? [];
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      message.error("Không thể tải danh sách thông báo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNoti(); }, []);

  const handleAction = async (id, apiFunc, successMsg) => {
    setBusyId(id);
    try {
      await apiFunc(id);
      if (successMsg) message.success(successMsg);
      await fetchNoti();
    } catch (err) {
      message.error(err?.response?.data?.message || "Thao tác thất bại");
    } finally {
      setBusyId(null);
    }
  };

  const markAllRead = async () => {
    setBusyId("__all__");
    try {
      await markAllNotificationsReadAPI();
      message.success("Tất cả đã được đánh dấu là đã đọc");
      await fetchNoti();
    } finally {
      setBusyId(null);
    }
  };

  // --- FILTERED DATA ---
  const filteredItems = useMemo(() => {
    switch (activeTab) {
      case "unread": return items.filter(n => !isRead(n) && !isDeleted(n));
      case "read": return items.filter(n => isRead(n) && !isDeleted(n));
      case "deleted": return items.filter(n => isDeleted(n));
      default: return items.filter(n => !isDeleted(n));
    }
  }, [items, activeTab]);

  const unreadCount = useMemo(() => items.filter(n => !isRead(n) && !isDeleted(n)).length, [items]);

  // --- RENDER HELPERS ---
  const showDetail = (n) => setDetailModal({ open: true, data: n });

  return (
    <div className="noti-page-wrapper">
      <div className="noti-container">
        {/* HEADER SECTION */}
        <header className="noti-header">
          <Row gutter={[16, 16]} align="middle" justify="space-between">
            <Col xs={24} sm={14}>
              <Space align="start" size={16}>
                <div className="noti-icon-main"><BellOutlined /></div>
                <div>
                  <Title level={2} style={{ margin: 0, color: "#064e3b" }}>Thông báo</Title>
                  <Text type="secondary">
                    Bạn có <Badge count={unreadCount} offset={[10, -2]} size="small"><Text strong>{unreadCount}</Text></Badge> thông báo mới chưa đọc
                  </Text>
                </div>
              </Space>
            </Col>
            <Col xs={24} sm={10} className="noti-header-actions">
              <Space>
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={fetchNoti} 
                  loading={loading}
                >Tải lại</Button>
                <Button 
                  type="primary" 
                  className="btn-mark-all"
                  icon={<CheckCircleOutlined />} 
                  onClick={markAllRead}
                  loading={busyId === "__all__"}
                  disabled={unreadCount === 0}
                >Đọc tất cả</Button>
              </Space>
            </Col>
          </Row>
        </header>

        {/* TABS FILTER */}
        <Tabs 
          className="noti-tabs"
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={[
            { key: "all", label: `Tất cả (${items.filter(n => !isDeleted(n)).length})` },
            { key: "unread", label: "Chưa đọc" },
            { key: "read", label: "Đã đọc" },
            { key: "deleted", label: "Đã xóa" },
          ]}
        />

        {/* LIST SECTION */}
        <Card bordered={false} className="noti-list-card">
          <List
            loading={loading}
            dataSource={filteredItems}
            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không tìm thấy thông báo nào" /> }}
            renderItem={(n) => {
              const id = getId(n);
              const readStatus = isRead(n);
              const deletedStatus = isDeleted(n);

              return (
                <List.Item 
                  className={`noti-item ${!readStatus ? 'is-unread' : ''}`}
                  actions={[
                    <Tooltip title="Xem chi tiết">
                      <Button type="text" icon={<EyeOutlined />} onClick={() => showDetail(n)} />
                    </Tooltip>,
                    !deletedStatus && !readStatus && (
                      <Tooltip title="Đánh dấu đã đọc">
                        <Button 
                          type="text" 
                          icon={<MailOutlined />} 
                          loading={busyId === id} 
                          onClick={() => handleAction(id, markNotificationReadAPI)} 
                        />
                      </Tooltip>
                    ),
                    deletedStatus ? (
                      <Tooltip title="Khôi phục">
                        <Button 
                          type="text" 
                          icon={<RestOutlined />} 
                          loading={busyId === id} 
                          onClick={() => handleAction(id, restoreNotificationAPI, "Đã khôi phục")} 
                        />
                      </Tooltip>
                    ) : (
                      <Popconfirm title="Xóa thông báo này?" onConfirm={() => handleAction(id, deleteNotificationAPI, "Đã chuyển vào thùng rác")}>
                        <Tooltip title="Xóa">
                          <Button type="text" danger icon={<DeleteOutlined />} loading={busyId === id} />
                        </Tooltip>
                      </Popconfirm>
                    )
                  ].filter(Boolean)}
                >
                  <List.Item.Meta
                    avatar={
                      <div className={`noti-avatar ${!readStatus ? 'active' : ''}`}>
                        <BellOutlined />
                        {!readStatus && <span className="unread-dot" />}
                      </div>
                    }
                    title={
                      <Space>
                        <Text strong={!readStatus} style={{ fontSize: 15 }}>{n?.title || n?.subject || "Thông báo hệ thống"}</Text>
                        {deletedStatus ? <Tag color="error">Đã xóa</Tag> : !readStatus ? <Tag color="processing">Mới</Tag> : null}
                      </Space>
                    }
                    description={
                      <div onClick={() => showDetail(n)} style={{ cursor: 'pointer' }}>
                        <Paragraph ellipsis={{ rows: 2 }} type="secondary" style={{ marginBottom: 4 }}>
                          {n?.message || n?.content || n?.body}
                        </Paragraph>
                        <Text type="secondary" style={{ fontSize: 11 }}>{n?.createdAt || n?.created_at || "Vừa xong"}</Text>
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        </Card>

        {/* DETAIL MODAL */}
        <Modal
          title="Chi tiết thông báo"
          open={detailModal.open}
          onCancel={() => setDetailModal({ open: false, data: null })}
          footer={[
            <Button key="close" onClick={() => setDetailModal({ open: false, data: null })}>Đóng</Button>
          ]}
        >
          {detailModal.data && (
            <div style={{ padding: '10px 0' }}>
              <Title level={4}>{detailModal.data.title || detailModal.data.subject}</Title>
              <Divider style={{ margin: '12px 0' }} />
              <Paragraph style={{ whiteSpace: 'pre-wrap', fontSize: 15 }}>
                {detailModal.data.message || detailModal.data.content || detailModal.data.body}
              </Paragraph>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Ngày gửi: {detailModal.data.createdAt || detailModal.data.created_at}
              </Text>
            </div>
          )}
        </Modal>
      </div>

      <style jsx="true">{`
        .noti-page-wrapper {
          min-height: 100vh;
          background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
          padding: 40px 20px;
        }
        .noti-container {
          max-width: 1100px;
          margin: 0 auto;
        }
        .noti-header {
          margin-bottom: 30px;
        }
        .noti-icon-main {
          width: 56px; height: 56px;
          background: #10b981;
          color: white;
          border-radius: 18px;
          display: flex; align-items: center; justify-content: center;
          font-size: 26px;
          box-shadow: 0 10px 20px rgba(16, 185, 129, 0.2);
        }
        .noti-header-actions {
          display: flex;
          justify-content: flex-end;
        }
        .btn-mark-all {
          background: #059669 !important;
          border-radius: 8px !important;
          font-weight: 600 !important;
        }
        .noti-tabs {
          margin-bottom: 8px;
        }
        .noti-list-card {
          border-radius: 20px !important;
          box-shadow: 0 10px 30px rgba(0,0,0,0.03) !important;
          overflow: hidden;
        }
        .noti-item {
          padding: 20px 24px !important;
          transition: all 0.3s ease;
          border-bottom: 1px solid #f1f5f9 !important;
        }
        .noti-item:hover {
          background: #f8fafc;
        }
        .noti-item.is-unread {
          background: #f0fdf4;
        }
        .noti-avatar {
          width: 44px; height: 44px;
          background: #f1f5f9;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
          color: #94a3b8;
          position: relative;
        }
        .noti-avatar.active {
          background: #dcfce7;
          color: #10b981;
        }
        .unread-dot {
          position: absolute;
          top: -2px; right: -2px;
          width: 10px; height: 10px;
          background: #ef4444;
          border: 2px solid white;
          border-radius: 50%;
        }
        @media (max-width: 576px) {
          .noti-header-actions, .noti-header-actions .ant-space {
            width: 100%;
          }
          .noti-header-actions .ant-btn {
            flex: 1;
            height: 40px;
          }
          .noti-item {
            padding: 16px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationPage;