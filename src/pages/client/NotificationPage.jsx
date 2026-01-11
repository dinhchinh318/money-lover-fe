// src/pages/client/NotificationPage.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
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
  Modal,
  Tooltip,
  Row,
  Col,
  Divider,
  Pagination,
} from "antd";
import {
  BellOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  ReloadOutlined,
  EyeOutlined,
  MailOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import {
  getNotificationsAPI,
  markNotificationReadAPI,
  markAllNotificationsReadAPI,
  deleteNotificationAPI,
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

  // ✅ Pagination for many notifications
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // --- HELPERS (robust) ---
  const getId = (n) => n?._id || n?.id;
  const isRead = (n) => Boolean(n?.isRead ?? n?.read);

  // ✅ BỎ "đã xóa": chỉ cần loại deleted khỏi UI (không còn tab deleted)
  const isDeleted = (n) => Boolean(n?.deleted || n?.deletedAt || n?.isDeleted);

  const safeTitle = (n) => n?.title || n?.subject || t("notifications.systemTitle");
  const safeContent = (n) => n?.message || n?.content || n?.body || "";
  const safeCreatedAt = (n) => {
    const raw = n?.createdAt || n?.created_at;
    if (!raw) return t("notifications.justNow");
    const d = dayjs(raw);
    return d.isValid() ? d.format("HH:mm DD/MM/YYYY") : String(raw);
  };

  // Parse multiple response shapes safely:
  const extractArray = (root) => {
    if (!root) return [];
    const arr = root?.data?.items || root?.data || root?.items || root;
    return Array.isArray(arr) ? arr : [];
  };

  // --- API HANDLERS ---
  const fetchNoti = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getNotificationsAPI();

      // ✅ luôn loại bỏ deleted khỏi list (vì bạn muốn bỏ "đã xóa")
      const arr = extractArray(res?.data).filter((n) => !isDeleted(n));

      // ✅ sort mới -> cũ (an toàn)
      arr.sort((a, b) => {
        const ta = new Date(a?.createdAt || a?.created_at || 0).getTime();
        const tb = new Date(b?.createdAt || b?.created_at || 0).getTime();
        return tb - ta;
      });

      setItems(arr);

      // ✅ nếu đang ở page lớn hơn total page thì kéo về
      const totalPages = Math.max(1, Math.ceil(arr.length / pageSize));
      setPage((p) => Math.min(p, totalPages));
    } catch (err) {
      message.error(err?.response?.data?.message || t("notifications.toast.fetchError"));
      setItems([]);
      setPage(1);
    } finally {
      setLoading(false);
    }
  }, [t, pageSize]);

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
    } catch (err) {
      message.error(err?.response?.data?.message || t("notifications.toast.actionFail"));
    } finally {
      setBusyId(null);
    }
  };

  const showDetail = (n) => setDetailModal({ open: true, data: n });

  // ✅ Click item: open detail + mark read
  const openAndMarkRead = async (n) => {
    const id = getId(n);
    const readStatus = isRead(n);

    showDetail(n);

    if (!readStatus && id) {
      await handleAction(id, markNotificationReadAPI, null);
    }
  };

  // --- FILTERED DATA (đã loại deleted) ---
  const filteredItems = useMemo(() => {
    switch (activeTab) {
      case "unread":
        return items.filter((n) => !isRead(n));
      case "read":
        return items.filter((n) => isRead(n));
      default:
        return items;
    }
  }, [items, activeTab]);

  const unreadCount = useMemo(() => items.filter((n) => !isRead(n)).length, [items]);
  const nonDeletedCount = useMemo(() => items.length, [items]);

  // ✅ pagination slice
  const total = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, safePage, pageSize]);

  // reset page when tab changes
  useEffect(() => {
    setPage(1);
  }, [activeTab]);

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
        {/* HEADER */}
        <div className="mb-6 sm:mb-8">
          <Row gutter={[16, 16]} align="middle" justify="space-between">
            <Col xs={24} sm={14}>
              <Space align="start" size={14}>
                <div
                  className="
                    w-14 h-14 rounded-2xl
                    bg-emerald-600 text-white
                    flex items-center justify-center text-2xl
                    shadow-md
                  "
                >
                  <BellOutlined />
                </div>

                <div className="min-w-0">
                  <Title
                    level={2}
                    className="!m-0 !text-emerald-900 dark:!text-[var(--color-text-primary)]"
                  >
                    {t("notifications.title")}
                  </Title>

                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Text className="!text-gray-600 dark:!text-[var(--color-text-secondary)]">
                      {t("notifications.subtitle.before")}{" "}
                      <Text
                        strong
                        className="!text-gray-900 dark:!text-[var(--color-text-primary)]"
                      >
                        {unreadCount}
                      </Text>{" "}
                      {t("notifications.subtitle.after")}
                    </Text>

                    {unreadCount > 0 ? (
                      <span
                        className="
                          inline-flex items-center gap-1
                          px-2 py-0.5 rounded-full
                          bg-rose-50 text-rose-600
                          border border-rose-200
                          text-xs font-semibold
                          dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30
                        "
                        title={t("notifications.tabs.unread")}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        {unreadCount} {t("notifications.tags.new")}
                      </span>
                    ) : (
                      <span
                        className="
                          inline-flex items-center gap-1
                          px-2 py-0.5 rounded-full
                          bg-emerald-50 text-emerald-700
                          border border-emerald-200
                          text-xs font-semibold
                          dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30
                        "
                      >
                        <CheckCircleOutlined />
                        {t("notifications.toast.allRead")}
                      </span>
                    )}

                    {/* ✅ hint tổng số thông báo */}
                    <span
                      className="
                        inline-flex items-center
                        px-2 py-0.5 rounded-full
                        bg-slate-50 text-slate-600
                        border border-slate-200
                        text-xs font-semibold
                        dark:bg-white/5 dark:text-[var(--color-text-secondary)] dark:border-[var(--color-border)]
                      "
                      title={t("notifications.tabs.all", { count: nonDeletedCount })}
                    >
                      {t("notifications.tabs.all", { count: nonDeletedCount })}
                    </span>
                  </div>
                </div>
              </Space>
            </Col>

            <Col xs={24} sm={10} className="flex sm:justify-end">
              <Space className="w-full sm:w-auto" style={{ justifyContent: "flex-end" }}>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={fetchNoti}
                  loading={loading}
                  className="
                    !rounded-xl
                    dark:!bg-[var(--color-background-alt)]
                    dark:!border-[var(--color-border)]
                    dark:!text-[var(--color-text-primary)]
                  "
                >
                  {t("notifications.actions.reload")}
                </Button>

                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={markAllRead}
                  loading={busyId === "__all__"}
                  disabled={unreadCount === 0}
                  className="
                    !rounded-xl !font-semibold !border-0
                    !bg-emerald-600 hover:!bg-emerald-700
                    dark:!bg-emerald-500 dark:hover:!bg-emerald-600
                  "
                >
                  {t("notifications.actions.readAll")}
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        {/* TABS (✅ bỏ tab đã xóa) */}
        <div className="mb-3">
          <Tabs
            className="noti-tabs"
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              { key: "all", label: t("notifications.tabs.all", { count: nonDeletedCount }) },
              { key: "unread", label: t("notifications.tabs.unread") },
              { key: "read", label: t("notifications.tabs.read") },
            ]}
          />
        </div>

        {/* LIST CARD */}
        <Card
          bordered={false}
          className="
            !rounded-2xl overflow-hidden
            !bg-white border border-gray-200 shadow-sm
            dark:!bg-[var(--color-background-alt)]
            dark:!border-[var(--color-border)]
          "
        >
          <List
            className="noti-list"
            loading={loading}
            dataSource={pagedItems}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <span className="text-gray-600 dark:text-[var(--color-text-secondary)]">
                      {t("notifications.empty")}
                    </span>
                  }
                />
              ),
            }}
            renderItem={(n) => {
              const id = getId(n);
              const readStatus = isRead(n);

              const title = safeTitle(n);
              const content = safeContent(n);
              const createdAt = safeCreatedAt(n);

              const itemEmphasis = !readStatus;

              return (
                <List.Item
                  key={id}
                  onClick={() => openAndMarkRead(n)}
                  className={`
                    noti-item
                    !px-4 sm:!px-6 !py-4 sm:!py-5
                    border-b border-gray-100
                    dark:border-[var(--color-border)]
                    hover:bg-gray-50 dark:hover:bg-white/5
                    transition
                    cursor-pointer
                    ${itemEmphasis ? "noti-unread" : ""}
                  `}
                  actions={[
                    <Tooltip title={t("notifications.tooltips.detail")} key="detail">
                      <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          showDetail(n);
                        }}
                        className="dark:!text-[var(--color-text-primary)]"
                      />
                    </Tooltip>,

                    !readStatus && (
                      <Tooltip title={t("notifications.tooltips.markRead")} key="markRead">
                        <Button
                          type="text"
                          icon={<MailOutlined />}
                          loading={busyId === id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(
                              id,
                              markNotificationReadAPI,
                              t("notifications.toast.markedRead")
                            );
                          }}
                          className="dark:!text-[var(--color-text-primary)]"
                        />
                      </Tooltip>
                    ),

                    <Popconfirm
                      key="delete"
                      title={t("notifications.confirm.deleteTitle")}
                      onConfirm={(e) => {
                        e?.stopPropagation?.();
                        handleAction(id, deleteNotificationAPI, t("notifications.toast.movedToTrash"));
                      }}
                    >
                      <Tooltip title={t("notifications.tooltips.delete")}>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          loading={busyId === id}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Tooltip>
                    </Popconfirm>,
                  ].filter(Boolean)}
                >
                  <List.Item.Meta
                    avatar={
                      <div
                        className={`
                          relative w-11 h-11 rounded-xl
                          flex items-center justify-center
                          border border-gray-200
                          bg-gray-50 text-gray-400
                          dark:border-[var(--color-border)]
                          dark:bg-white/5 dark:text-white/60
                          ${itemEmphasis
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                            : ""
                          }
                        `}
                      >
                        <BellOutlined />
                        {itemEmphasis ? (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[var(--color-background-alt)]" />
                        ) : null}
                      </div>
                    }
                    title={
                      <div className="flex items-center gap-2 min-w-0">
                        <Text
                          className={`
                            !text-[15px] truncate
                            ${itemEmphasis ? "!font-extrabold" : "!font-bold"}
                            !text-gray-900 dark:!text-[var(--color-text-primary)]
                          `}
                        >
                          {title}
                        </Text>

                        <div className="flex items-center gap-1 shrink-0">
                          {!readStatus ? (
                            <Tag color="processing" className="!m-0">
                              {t("notifications.tags.new")}
                            </Tag>
                          ) : (
                            <Tag color="success" className="!m-0">
                              {t("notifications.tabs.read")}
                            </Tag>
                          )}
                        </div>
                      </div>
                    }
                    description={
                      <div className="min-w-0">
                        <Paragraph
                          ellipsis={{ rows: 2 }}
                          className="!mb-1 !text-gray-600 dark:!text-[var(--color-text-secondary)]"
                        >
                          {content}
                        </Paragraph>

                        <Text className="!text-[11px] !text-gray-500 dark:!text-[var(--color-text-secondary)]">
                          {createdAt}
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />

          {/* ✅ Pagination UI */}
          {total > pageSize && (
            <div
              className="
                flex items-center justify-end
                px-4 sm:px-6 py-4
                border-t border-gray-100
                dark:border-[var(--color-border)]
              "
            >
              <Pagination
                current={safePage}
                pageSize={pageSize}
                total={total}
                showSizeChanger
                pageSizeOptions={[5, 10, 20, 50]}
                onChange={(p, ps) => {
                  setPage(p);
                  if (ps !== pageSize) setPageSize(ps);
                }}
              />
            </div>
          )}
        </Card>

        {/* DETAIL MODAL */}
        <Modal
          className="noti-detail-modal"
          title={null}
          open={detailModal.open}
          onCancel={() => setDetailModal({ open: false, data: null })}
          footer={[
            <Button
              key="close"
              onClick={() => setDetailModal({ open: false, data: null })}
              className="
                !rounded-xl
                dark:!bg-[var(--color-background-alt)]
                dark:!border-[var(--color-border)]
                dark:!text-[var(--color-text-primary)]
              "
            >
              {t("notifications.detail.close")}
            </Button>,
          ]}
        >
          {detailModal.data && (
            <div className="py-1">
              {/* Header */}
              <div className="flex items-start gap-3">
                <div
                  className="
                    w-11 h-11 rounded-xl
                    bg-emerald-600 text-white
                    flex items-center justify-center
                    shadow-sm
                    shrink-0
                  "
                >
                  <BellOutlined />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <Title
                      level={4}
                      className="!m-0 !leading-snug dark:!text-[var(--color-text-primary)]"
                    >
                      {safeTitle(detailModal.data)}
                    </Title>

                    <div className="flex items-center gap-1 shrink-0">
                      {!isRead(detailModal.data) ? (
                        <Tag color="processing" className="!m-0">
                          {t("notifications.tags.new")}
                        </Tag>
                      ) : (
                        <Tag color="success" className="!m-0">
                          {t("notifications.tabs.read")}
                        </Tag>
                      )}
                    </div>
                  </div>

                  <Text className="!text-xs !text-gray-500 dark:!text-[var(--color-text-secondary)]">
                    {t("notifications.detail.sentAt")}: {safeCreatedAt(detailModal.data)}
                  </Text>
                </div>
              </div>

              <Divider className="!my-4 dark:!border-[var(--color-border)]" />

              {/* Content box */}
              <div
                className="
                  rounded-2xl border border-gray-200
                  bg-gray-50
                  p-4
                  dark:bg-white/5 dark:border-[var(--color-border)]
                "
              >
                <Paragraph
                  className="!text-[15px] !mb-0 dark:!text-[var(--color-text-primary)]"
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {safeContent(detailModal.data)}
                </Paragraph>
              </div>

              {/* Quick hint */}
              {!isRead(detailModal.data) ? (
                <div className="mt-3">
                  <Text className="!text-xs !text-gray-500 dark:!text-[var(--color-text-secondary)]">
                    {t("notifications.toast.markedRead")}
                  </Text>
                </div>
              ) : null}
            </div>
          )}
        </Modal>
      </div>

      {/* ✅ Ant Modal & Tabs dark override */}
      <style jsx="true">{`
        .dark .noti-detail-modal .ant-modal-content {
          background: var(--color-background-alt) !important;
          border: 1px solid var(--color-border) !important;
        }
        .dark .noti-detail-modal .ant-modal-header {
          background: transparent !important;
          border-bottom: 1px solid var(--color-border) !important;
        }

        .dark .noti-tabs .ant-tabs-tab {
          color: var(--color-text-secondary) !important;
        }
        .dark .noti-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: var(--color-text-primary) !important;
        }

        /* ✅ Unread item accent */
        .noti-list .noti-item.noti-unread {
          position: relative;
        }
        .noti-list .noti-item.noti-unread::before {
          content: "";
          position: absolute;
          left: 0;
          top: 12px;
          bottom: 12px;
          width: 4px;
          border-radius: 999px;
          background: #10b981; /* emerald-500 */
        }
        .dark .noti-list .noti-item.noti-unread::before {
          background: rgba(16, 185, 129, 0.9);
        }

        /* ✅ Nicer actions spacing */
        .noti-list .ant-list-item-action {
          margin-left: 16px;
        }
        .noti-list .ant-list-item-action > li {
          padding: 0 4px;
        }
      `}</style>
    </div>
  );
};

export default NotificationPage;
