import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash2,
  Wallet,
  Building2,
  Star,
  Archive,
  TrendingUp,
  Search,
  ArrowUpDown,
  MoreVertical,
  Pin,
} from "lucide-react";
import { message, Dropdown, Modal, Input, Select, Pagination, Tooltip } from "antd";
import {
  getWalletsAPI,
  deleteWalletAPI,
  setDefaultWalletAPI,
  archiveWalletAPI,
  unarchiveWalletAPI,
} from "../../../services/api.wallet";
import WalletModal from "../../../components/wallets/WalletModal";

const { Option } = Select;

const WalletsIndex = () => {
  const navigate = useNavigate();

  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("all"); // all | active | archived
  const [typeFilter, setTypeFilter] = useState("all"); // all | cash | bank

  const [modalOpen, setModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState(null);

  // tiện ích khi nhiều ví
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState("default_first"); // default_first | balance_desc | name_asc | updated_desc
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const [summary, setSummary] = useState({
    totalWallets: 0,
    totalBalance: 0,
    cashWallets: 0,
    bankWallets: 0,
  });

  useEffect(() => {
    loadWallets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    calculateSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallets]);

  // reset page khi filter/search/sort thay đổi
  useEffect(() => {
    setPage(1);
  }, [activeTab, typeFilter, q, sortKey, pageSize]);

  const loadWallets = async () => {
    try {
      setLoading(true);
      const res = await getWalletsAPI();
      if (res?.status || res?.EC === 0) {
        const walletsData = res?.data?.wallets || res?.data || [];
        setWallets(Array.isArray(walletsData) ? walletsData : []);
      } else {
        message.error("Không thể tải danh sách ví!");
      }
    } catch (error) {
      message.error("Có lỗi xảy ra khi tải danh sách ví!");
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = () => {
    const total = wallets.length;
    const totalBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);
    const cashWallets = wallets.filter((w) => w.type === "cash" && !w.is_archived).length;
    const bankWallets = wallets.filter((w) => w.type === "bank" && !w.is_archived).length;

    setSummary({ totalWallets: total, totalBalance, cashWallets, bankWallets });
  };

  const formatCurrency = (amount, currency = "VND") =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency }).format(amount || 0);

  const handleAddWallet = () => {
    setEditingWallet(null);
    setModalOpen(true);
  };

  const handleEditWallet = (wallet) => {
    setEditingWallet(wallet);
    setModalOpen(true);
  };

  const handleDeleteWallet = (wallet) => {
    Modal.confirm({
      title: "Xác nhận xóa ví",
      content: `Bạn có chắc chắn muốn xóa ví "${wallet.name}"? Hành động này không thể hoàn tác.`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          const res = await deleteWalletAPI(wallet._id);
          if (res?.status || res?.EC === 0) {
            message.success("Xóa ví thành công!");
            loadWallets();
          } else {
            message.error(res?.message || "Xóa ví thất bại!");
          }
        } catch {
          message.error("Có lỗi xảy ra!");
        }
      },
    });
  };

  const handleSetDefault = async (wallet) => {
    try {
      const res = await setDefaultWalletAPI(wallet._id);
      if (res?.status || res?.EC === 0) {
        message.success("Đặt ví mặc định thành công!");
        loadWallets();
      } else {
        message.error(res?.message || "Thao tác thất bại!");
      }
    } catch {
      message.error("Có lỗi xảy ra!");
    }
  };

  const handleArchive = async (wallet) => {
    try {
      const res = await archiveWalletAPI(wallet._id);
      if (res?.status || res?.EC === 0) {
        message.success("Lưu trữ ví thành công!");
        loadWallets();
      } else {
        message.error(res?.message || "Thao tác thất bại!");
      }
    } catch {
      message.error("Có lỗi xảy ra!");
    }
  };

  const handleUnarchive = async (wallet) => {
    try {
      const res = await unarchiveWalletAPI(wallet._id);
      if (res?.status || res?.EC === 0) {
        message.success("Khôi phục ví thành công!");
        loadWallets();
      } else {
        message.error(res?.message || "Thao tác thất bại!");
      }
    } catch {
      message.error("Có lỗi xảy ra!");
    }
  };

  const getWalletMenuItems = (wallet) => {
    const items = [
      {
        key: "edit",
        label: "Chỉnh sửa",
        icon: <Edit size={16} />,
        onClick: () => handleEditWallet(wallet),
      },
    ];

    if (!wallet.is_default) {
      items.push({
        key: "setDefault",
        label: "Đặt làm mặc định",
        icon: <Star size={16} />,
        onClick: () => handleSetDefault(wallet),
      });
    }

    items.push({ type: "divider" });

    if (!wallet.is_archived) {
      items.push({
        key: "archive",
        label: "Lưu trữ",
        icon: <Archive size={16} />,
        onClick: () => handleArchive(wallet),
      });
    } else {
      items.push({
        key: "unarchive",
        label: "Khôi phục",
        icon: <Archive size={16} />,
        onClick: () => handleUnarchive(wallet),
      });
    }

    if (!wallet.is_default) {
      items.push({
        key: "delete",
        label: "Xóa",
        icon: <Trash2 size={16} />,
        danger: true,
        onClick: () => handleDeleteWallet(wallet),
      });
    }

    return items;
  };

  const tabs = [
    { key: "all", label: "Tất cả" },
    { key: "active", label: "Đang hoạt động" },
    { key: "archived", label: "Đã lưu trữ" },
  ];

  const filteredWallets = useMemo(() => {
    let arr = [...wallets];

    // tab lọc theo trạng thái
    if (activeTab === "active") arr = arr.filter((w) => !w.is_archived);
    if (activeTab === "archived") arr = arr.filter((w) => w.is_archived);

    // lọc theo loại ví
    if (typeFilter === "cash") arr = arr.filter((w) => w.type === "cash");
    if (typeFilter === "bank") arr = arr.filter((w) => w.type === "bank");

    // search
    const keyword = q.trim().toLowerCase();
    if (keyword) {
      arr = arr.filter((w) => {
        const name = (w.name || "").toLowerCase();
        const bankName = (w.bankName || "").toLowerCase();
        return name.includes(keyword) || bankName.includes(keyword);
      });
    }

    // sort
    const getUpdated = (w) => new Date(w.updatedAt || w.createdAt || 0).getTime();
    const getBalance = (w) => Number(w.balance || 0);

    arr.sort((a, b) => {
      if (sortKey === "default_first") {
        if (!!a.is_default !== !!b.is_default) return a.is_default ? -1 : 1;
        if (!!a.is_archived !== !!b.is_archived) return a.is_archived ? 1 : -1;
        return getBalance(b) - getBalance(a);
      }
      if (sortKey === "balance_desc") return getBalance(b) - getBalance(a);
      if (sortKey === "name_asc") return (a.name || "").localeCompare(b.name || "");
      if (sortKey === "updated_desc") return getUpdated(b) - getUpdated(a);
      return 0;
    });

    return arr;
  }, [wallets, activeTab, typeFilter, q, sortKey]);

  const totalItems = filteredWallets.length;

  const pagedWallets = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredWallets.slice(start, start + pageSize);
  }, [filteredWallets, page, pageSize]);

  const hasFilters =
    q.trim() ||
    activeTab !== "all" ||
    typeFilter !== "all" ||
    sortKey !== "default_first" ||
    pageSize !== 8;

  const clearFilters = () => {
    setQ("");
    setActiveTab("all");
    setTypeFilter("all");
    setSortKey("default_first");
    setPageSize(8);
    setPage(1);
  };

  const goWalletDetail = (id) => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    requestAnimationFrame(() => navigate(`/wallets/${id}`));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/70 via-white to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 truncate">
              Quản lý Ví
            </h1>
            <p className="text-gray-600 mt-1 text-sm">Theo dõi và quản lý tất cả ví</p>
          </div>

          <button
            onClick={handleAddWallet}
            className="shrink-0 px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-green-700 shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Thêm ví</span>
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Tổng ví</span>
              <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <Wallet className="text-blue-600" size={18} />
              </div>
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-extrabold text-gray-900">
              {loading ? "..." : summary.totalWallets}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Tổng số dư</span>
              <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                <TrendingUp className="text-emerald-600" size={18} />
              </div>
            </div>
            <div className="mt-2 text-base sm:text-lg font-extrabold text-emerald-700 truncate">
              {loading ? "..." : formatCurrency(summary.totalBalance)}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Tiền mặt</span>
              <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center">
                <Wallet className="text-amber-600" size={18} />
              </div>
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-extrabold text-gray-900">
              {loading ? "..." : summary.cashWallets}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Ngân hàng</span>
              <div className="h-9 w-9 rounded-xl bg-violet-50 flex items-center justify-center">
                <Building2 className="text-violet-600" size={18} />
              </div>
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-extrabold text-gray-900">
              {loading ? "..." : summary.bankWallets}
            </div>
          </div>
        </div>

        {/* Toolbar (Search + Tabs + Type filter + Sort + Page size) */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-3 sm:p-4 mb-4">
          {/* Search row */}
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
            <Search className="text-gray-400" size={18} />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo tên ví / ngân hàng..."
              borderless={false}
              allowClear
              className="bg-transparent"
            />
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 px-2 py-1 rounded-lg hover:bg-emerald-100/60 transition"
              >
                Xóa lọc
              </button>
            )}
          </div>

          {/* Pills row */}
          <div className="mt-3 flex flex-wrap gap-2 items-center">
            {/* Tabs */}
            <div className="inline-flex max-w-full overflow-x-auto gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition ${
                    activeTab === tab.key
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="hidden sm:block h-6 w-px bg-gray-200 mx-1" />

            {/* Type filter */}
            <div className="inline-flex max-w-full overflow-x-auto gap-2">
              {[
                { key: "all", label: "Tất cả loại" },
                { key: "cash", label: "Tiền mặt" },
                { key: "bank", label: "Ngân hàng" },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTypeFilter(t.key)}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition ${
                    typeFilter === t.key
                      ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Count */}
            <div className="ml-auto text-xs sm:text-sm text-gray-500">
              <span className="font-semibold text-gray-800">{totalItems}</span> kết quả
            </div>
          </div>

          {/* Sort + page size */}
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div className="col-span-2 sm:col-span-2 flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-200">
              <ArrowUpDown className="text-gray-400" size={18} />
              <Select value={sortKey} onChange={setSortKey} borderless={false} style={{ width: "100%" }}>
                <Option value="default_first">Ưu tiên mặc định</Option>
                <Option value="balance_desc">Số dư giảm dần</Option>
                <Option value="name_asc">Tên A → Z</Option>
                <Option value="updated_desc">Cập nhật mới nhất</Option>
              </Select>
            </div>

            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-200">
              <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">Hiển thị</span>
              <Select value={pageSize} onChange={setPageSize} borderless={false} style={{ width: "100%" }}>
                {[6, 8, 10, 12, 18, 24].map((n) => (
                  <Option key={n} value={n}>
                    {n}/trang
                  </Option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="ds-card ds-skeleton" style={{ height: "140px" }} />
            ))}
          </div>
        ) : totalItems > 0 ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-600">
                {totalItems} ví • Trang {page}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {pagedWallets.map((wallet) => {
                const isBank = wallet.type === "bank";
                const gradientFrom = isBank ? "from-blue-500 to-indigo-600" : "from-emerald-500 to-green-600";

                return (
                  <div
                    key={wallet._id}
                    onClick={() => goWalletDetail(wallet._id)}
                    className={`relative bg-white rounded-2xl p-4 border transition-all duration-200 group hover:shadow-md ${
                      wallet.is_default ? "border-emerald-300 ring-1 ring-emerald-200/60" : "border-gray-200"
                    } ${wallet.is_archived ? "opacity-80" : ""}`}
                  >
                    {/* menu */}
                    <div className="absolute top-3 right-3 z-30" onClick={(e) => e.stopPropagation()}>
                      <Dropdown menu={{ items: getWalletMenuItems(wallet) }} trigger={["click"]} placement="bottomRight">
                        <button
                          type="button"
                          className="h-9 w-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition"
                          aria-label="Wallet actions"
                        >
                          <MoreVertical className="text-gray-600" size={18} />
                        </button>
                      </Dropdown>
                    </div>

                    {/* default badge */}
                    {wallet.is_default && (
                      <div className="absolute top-3 left-3 z-20 pointer-events-none">
                        <div className="px-2 py-1 rounded-xl bg-emerald-600 text-white text-xs font-bold inline-flex items-center gap-1 shadow-sm">
                          <Star className="w-4 h-4 fill-white" />
                          Default
                        </div>
                      </div>
                    )}

                    {/* header row */}
                    <div className="flex items-center gap-3">
                      <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${gradientFrom} flex items-center justify-center shadow-sm`}>
                        {isBank ? <Building2 className="text-white" size={22} /> : <Wallet className="text-white" size={22} />}
                      </div>

                      <div className="min-w-0 flex-1 pr-10">
                        <p className="font-extrabold text-gray-900 truncate">{wallet.name}</p>
                        <div className="mt-1 flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold ${
                              isBank ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {isBank ? "Ngân hàng" : "Tiền mặt"}
                          </span>

                          {wallet.is_archived && (
                            <span className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-amber-50 text-amber-700">
                              Lưu trữ
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* balance */}
                    <div className="mt-3">
                      <p className="text-sm text-gray-500">Số dư</p>
                      <p className="text-xl font-extrabold text-emerald-700 truncate">
                        {formatCurrency(wallet.balance || 0, wallet.currency)}
                      </p>
                      {isBank && wallet.bankName && (
                        <p className="text-xs text-gray-500 mt-1 truncate">{wallet.bankName}</p>
                      )}
                    </div>

                    {/* Quick actions */}
                    <div
                      className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {!wallet.is_default ? (
                        <Tooltip title="Đặt làm mặc định">
                          <button
                            onClick={() => handleSetDefault(wallet)}
                            className="flex-1 h-10 rounded-xl bg-emerald-50 text-emerald-700 font-semibold text-sm hover:bg-emerald-100 transition inline-flex items-center justify-center gap-2"
                          >
                            <Pin size={16} />
                            Mặc định
                          </button>
                        </Tooltip>
                      ) : (
                        <div className="flex-1 h-10 rounded-xl bg-gray-50 text-gray-500 font-semibold text-sm inline-flex items-center justify-center gap-2">
                          <Star className="w-4 h-4 fill-gray-400 text-gray-400" />
                          Đang mặc định
                        </div>
                      )}

                      {!wallet.is_archived ? (
                        <Tooltip title="Lưu trữ ví">
                          <button
                            onClick={() => handleArchive(wallet)}
                            className="h-10 w-10 rounded-xl border border-gray-200 hover:bg-gray-50 transition inline-flex items-center justify-center"
                          >
                            <Archive size={18} className="text-gray-600" />
                          </button>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Khôi phục ví">
                          <button
                            onClick={() => handleUnarchive(wallet)}
                            className="h-10 w-10 rounded-xl border border-gray-200 hover:bg-gray-50 transition inline-flex items-center justify-center"
                          >
                            <Archive size={18} className="text-emerald-700" />
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalItems > pageSize && (
              <div className="mt-5 flex justify-center">
                <Pagination
                  current={page}
                  pageSize={pageSize}
                  total={totalItems}
                  onChange={(p) => setPage(p)}
                  showSizeChanger={false}
                />
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-14 bg-white rounded-2xl border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <Wallet className="text-gray-400" size={34} />
            </div>
            <p className="text-lg font-semibold text-gray-700 mb-1">
              {activeTab === "archived"
                ? "Chưa có ví nào được lưu trữ"
                : activeTab === "active"
                ? "Chưa có ví đang hoạt động"
                : "Chưa có ví nào"}
            </p>
            <p className="text-sm text-gray-500 mb-5 text-center px-6">
              {activeTab === "archived"
                ? "Các ví đã lưu trữ sẽ hiển thị ở đây"
                : "Hãy bắt đầu bằng cách thêm ví đầu tiên của bạn"}
            </p>
            <button
              onClick={handleAddWallet}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-green-700 shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
            >
              <Plus size={18} />
              Thêm ví
            </button>
          </div>
        )}
      </div>

      {/* Wallet Modal */}
      <WalletModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingWallet(null);
        }}
        wallet={editingWallet}
        onSuccess={loadWallets}
      />
    </div>
  );
};

export default WalletsIndex;
