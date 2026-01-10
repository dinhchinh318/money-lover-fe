import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  List,
  Typography,
  Space,
  Button,
  Tag,
  message,
  Popconfirm,
  Empty,
  Tabs,
  Badge,
  Modal,
  Tooltip,
  Row,
  Col,
  Divider,
} from "antd";
import {
  BellOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  ReloadOutlined,
  RestOutlined,
  EyeOutlined,
  MailOutlined,
} from "@ant-design/icons";
import {
  getNotificationsAPI,
  markNotificationReadAPI,
  markAllNotificationsReadAPI,
  deleteNotificationAPI,
  restoreNotificationAPI,
} from "../../services/api.notification";

// ✅ i18n
import { useTranslation } from "react-i18next";

const { Title, Text, Paragraph } = Typography;

const NotificationPage = () => {
  const { t } = useTranslation();

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
      message.error(t("notifications.toast.fetchError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNoti();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAction = async (id, apiFunc, successMsg) => {
    setBusyId(id);
    try {
      await apiFunc(id);
      if (successMsg) message.success(successMsg);
      await fetchNoti();
    } catch (err) {
      message.error(err?.response?.data?.message || t("notifications.toast.actionFail"));
    } finally {
      setBusyId(null);
    }
  };

  const markAllRead = async () => {
    setBusyId("__all__");
    try {
      await markAllNotificationsReadAPI();
      message.success(t("notifications.toast.allRead"));
      await fetchNoti();
    } finally {
      setBusyId(null);
    }
  };

  // --- FILTERED DATA ---
  const filteredItems = useMemo(() => {
    switch (activeTab) {
      case "unread":
        return items.filter((n) => !isRead(n) && !isDeleted(n));
      case "read":
        return items.filter((n) => isRead(n) && !isDeleted(n));
      case "deleted":
        return items.filter((n) => isDeleted(n));
      default:
        return items.filter((n) => !isDeleted(n));
    }
  }, [items, activeTab]);

  const unreadCount = useMemo(
    () => items.filter((n) => !isRead(n) && !isDeleted(n)).length,
    [items]
  );

  const nonDeletedCount = useMemo(
    () => items.filter((n) => !isDeleted(n)).length,
    [items]
  );

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
                <div className="noti-icon-main">
                  <BellOutlined />
                </div>
                <div>
                  <Title level={2} style={{ margin: 0, color: "#064e3b" }}>
                    {t("notifications.title")}
                  </Title>

                  <Text type="secondary">
                    {t("notifications.subtitle.before")}{" "}
                    <Badge
                      count={unreadCount}
                      offset={[10, -2]}
                      size="small"
                    >
                      <Text strong>{unreadCount}</Text>
                    </Badge>{" "}
                    {t("notifications.subtitle.after")}
                  </Text>
                </div>
              </Space>
            </Col>

            <Col xs={24} sm={10} className="noti-header-actions">
              <Space>
                <Button icon={<ReloadOutlined />} onClick={fetchNoti} loading={loading}>
                  {t("notifications.actions.reload")}
                </Button>

                <Button
                  type="primary"
                  className="btn-mark-all"
                  icon={<CheckCircleOutlined />}
                  onClick={markAllRead}
                  loading={busyId === "__all__"}
                  disabled={unreadCount === 0}
                >
                  {t("notifications.actions.readAll")}
                </Button>
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
            {
              key: "all",
              label: t("notifications.tabs.all", { count: nonDeletedCount }),
            },
            { key: "unread", label: t("notifications.tabs.unread") },
            { key: "read", label: t("notifications.tabs.read") },
            { key: "deleted", label: t("notifications.tabs.deleted") },
          ]}
        />

        {/* LIST SECTION */}
        <Card bordered={false} className="noti-list-card">
          <List
            loading={loading}
            dataSource={filteredItems}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={t("notifications.empty")}
                />
              ),
            }}
            renderItem={(n) => {
              const id = getId(n);
              const readStatus = isRead(n);
              const deletedStatus = isDeleted(n);

              const title =
                n?.title || n?.subject || t("notifications.systemTitle");
              const content = n?.message || n?.content || n?.body || "";
              const createdAt = n?.createdAt || n?.created_at || t("notifications.justNow");

              return (
                <List.Item
                  className={`noti-item ${!readStatus ? "is-unread" : ""}`}
                  actions={[
                    <Tooltip title={t("notifications.tooltips.detail")} key="detail">
                      <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => showDetail(n)}
                      />
                    </Tooltip>,

                    !deletedStatus && !readStatus && (
                      <Tooltip title={t("notifications.tooltips.markRead")} key="markRead">
                        <Button
                          type="text"
                          icon={<MailOutlined />}
                          loading={busyId === id}
                          onClick={() =>
                            handleAction(id, markNotificationReadAPI, t("notifications.toast.markedRead"))
                          }
                        />
                      </Tooltip>
                    ),

                    deletedStatus ? (
                      <Tooltip title={t("notifications.tooltips.restore")} key="restore">
                        <Button
                          type="text"
                          icon={<RestOutlined />}
                          loading={busyId === id}
                          onClick={() =>
                            handleAction(id, restoreNotificationAPI, t("notifications.toast.restored"))
                          }
                        />
                      </Tooltip>
                    ) : (
                      <Popconfirm
                        key="delete"
                        title={t("notifications.confirm.deleteTitle")}
                        onConfirm={() =>
                          handleAction(id, deleteNotificationAPI, t("notifications.toast.movedToTrash"))
                        }
                      >
                        <Tooltip title={t("notifications.tooltips.delete")}>
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            loading={busyId === id}
                          />
                        </Tooltip>
                      </Popconfirm>
                    ),
                  ].filter(Boolean)}
                >
                  <List.Item.Meta
                    avatar={
                      <div className={`noti-avatar ${!readStatus ? "active" : ""}`}>
                        <BellOutlined />
                        {!readStatus && <span className="unread-dot" />}
                      </div>
                    }
                    title={
                      <Space>
                        <Text strong={!readStatus} style={{ fontSize: 15 }}>
                          {title}
                        </Text>

                        {deletedStatus ? (
                          <Tag color="error">{t("notifications.tags.deleted")}</Tag>
                        ) : !readStatus ? (
                          <Tag color="processing">{t("notifications.tags.new")}</Tag>
                        ) : null}
                      </Space>
                    }
                    description={
                      <div onClick={() => showDetail(n)} style={{ cursor: "pointer" }}>
                        <Paragraph
                          ellipsis={{ rows: 2 }}
                          type="secondary"
                          style={{ marginBottom: 4 }}
                        >
                          {content}
                        </Paragraph>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {createdAt}
                        </Text>
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
          title={t("notifications.detail.title")}
          open={detailModal.open}
          onCancel={() => setDetailModal({ open: false, data: null })}
          footer={[
            <Button key="close" onClick={() => setDetailModal({ open: false, data: null })}>
              {t("notifications.detail.close")}
            </Button>,
          ]}
        >
          {detailModal.data && (
            <div style={{ padding: "10px 0" }}>
              <Title level={4}>
                {detailModal.data.title ||
                  detailModal.data.subject ||
                  t("notifications.systemTitle")}
              </Title>
              <Divider style={{ margin: "12px 0" }} />
              <Paragraph style={{ whiteSpace: "pre-wrap", fontSize: 15 }}>
                {detailModal.data.message ||
                  detailModal.data.content ||
                  detailModal.data.body}
              </Paragraph>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t("notifications.detail.sentAt")}:{" "}
                {detailModal.data.createdAt || detailModal.data.created_at || "—"}
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
          width: 56px;
          height: 56px;
          background: #10b981;
          color: white;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
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
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03) !important;
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
          width: 44px;
          height: 44px;
          background: #f1f5f9;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
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
          top: -2px;
          right: -2px;
          width: 10px;
          height: 10px;
          background: #ef4444;
          border: 2px solid white;
          border-radius: 50%;
        }
        @media (max-width: 576px) {
          .noti-header-actions,
          .noti-header-actions .ant-space {
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
