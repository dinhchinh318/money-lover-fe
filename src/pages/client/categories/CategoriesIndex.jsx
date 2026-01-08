import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Folder,
  TrendingUp,
  Search,
} from "lucide-react";
import { message, Modal, Pagination, Input } from "antd";
import {
  getCategoriesAPI,
  deleteCategoryAPI,
  setDefaultCategoryAPI,
} from "../../../services/api.category";
import CategoryModal from "../../../components/categories/CategoryModal";

const CategoriesIndex = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("all"); // all, income, expense
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // optional: search theo tên (giúp nhiều danh mục)
  const [q, setQ] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  // reset về trang 1 khi đổi tab / đổi search / đổi data
  useEffect(() => {
    setPage(1);
  }, [activeTab, q, categories.length]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await getCategoriesAPI();
      if (res?.EC === 0 && res?.data) {
        setCategories(Array.isArray(res.data) ? res.data : []);
      } else {
        message.error("Không thể tải danh sách danh mục!");
      }
    } catch (error) {
      message.error("Có lỗi xảy ra khi tải danh sách danh mục!");
    } finally {
      setLoading(false);
    }
  };

  const getIconEmoji = (iconValue) => {
    const iconMap = {
      default: "📁",
      utensils: "🍔",
      coffee: "☕",
      car: "🛵",
      "shopping-bag": "🛍️",
      home: "🏠",
      zap: "💡",
      smartphone: "📱",
      "gamepad-2": "🎮",
      plane: "✈️",
      stethoscope: "🏥",
      "graduation-cap": "📚",
      gift: "🎁",
      "more-horizontal": "📦",
      briefcase: "💼",
      "party-popper": "🎉",
      laptop: "🧑‍💻",
      store: "🏪",
      "trending-up": "📈",
      "credit-card": "💳",
      plus: "📥",
      // old keys
      food: "🍔",
      shopping: "🛒",
      transport: "🚗",
      bills: "💳",
      entertainment: "🎬",
      health: "🏥",
      education: "📚",
      salary: "💰",
      investment: "📈",
      other: "📦",
    };
    if (!iconValue) return iconMap.default;
    return iconMap[iconValue] || iconMap.default;
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setModalOpen(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setModalOpen(true);
  };

  const handleDeleteCategory = (category) => {
    Modal.confirm({
      title: "Xác nhận xóa danh mục",
      content: `Bạn có chắc chắn muốn xóa danh mục "${category.name}"?`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          const res = await deleteCategoryAPI(category._id);
          if (res?.EC === 0) {
            message.success("Xóa danh mục thành công!");
            loadCategories();
          } else {
            message.error(res?.message || "Xóa danh mục thất bại!");
          }
        } catch (error) {
          message.error("Có lỗi xảy ra!");
        }
      },
    });
  };

  const handleSetDefault = async (category) => {
    try {
      const res = await setDefaultCategoryAPI(category._id);
      if (res?.EC === 0) {
        message.success("Đặt làm danh mục mặc định thành công!");
        loadCategories();
      } else {
        message.error(res?.message || "Thất bại!");
      }
    } catch (error) {
      message.error("Có lỗi xảy ra!");
    }
  };

  const tabs = [
    { key: "all", label: "Tất cả" },
    { key: "income", label: "Thu nhập", color: "#10B981" },
    { key: "expense", label: "Chi tiêu", color: "#EF4444" },
  ];

  // FILTER + SEARCH (memo)
  const filteredCategories = useMemo(() => {
    let filtered = [...categories];

    if (activeTab === "income") filtered = filtered.filter((c) => c.type === "income");
    if (activeTab === "expense") filtered = filtered.filter((c) => c.type === "expense");

    const query = q.trim().toLowerCase();
    if (query) {
      filtered = filtered.filter((c) => (c.name || "").toLowerCase().includes(query));
    }

    return filtered;
  }, [categories, activeTab, q]);

  // PAGINATION (memo)
  const total = filteredCategories.length;
  const pagedCategories = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCategories.slice(start, start + pageSize);
  }, [filteredCategories, page, pageSize]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/70 via-white to-white">
      <div className="max-w-[95%] mx-auto px-2 sm:px-4 lg:px-6 py-6 sm:py-8 lg:py-10">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <h1 className="ds-heading-1" style={{ fontSize: "24px", fontWeight: 700 }}>
            Quản lý Danh mục
          </h1>

          {/* Nút thêm: mobile chỉ dấu + */}
          <button
            onClick={handleAddCategory}
            className="ds-button-primary"
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
            aria-label="Thêm danh mục"
            title="Thêm danh mục"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Thêm danh mục</span>
          </button>
        </div>

        {/* Tabs + Search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          {/* Tabs */}
          <div className="flex gap-2 bg-white p-1 rounded-lg border border-[#E5E7EB] inline-flex w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-md font-medium transition-all ${
                  activeTab === tab.key
                    ? "bg-[#10B981] text-white shadow-sm"
                    : "text-[#6B7280] hover:bg-[#F9FAFB]"
                }`}
                style={activeTab === tab.key && tab.color ? { backgroundColor: tab.color } : {}}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="w-full sm:w-[320px]">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              allowClear
              placeholder="Tìm danh mục theo tên..."
              prefix={<Search size={16} className="text-slate-400" />}
              className="h-11 rounded-xl"
            />
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="ds-card ds-skeleton" style={{ height: "180px" }} />
            ))}
          </div>
        ) : total > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
              {pagedCategories.map((category) => (
                <div
                  key={category._id}
                  className="ds-card relative group cursor-pointer hover:scale-[1.02] transition-transform"
                >
                  {/* Actions hover */}
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    {!category.is_default && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetDefault(category);
                        }}
                        className="p-2 bg-white rounded-lg shadow-md hover:bg-green-50 transition-colors"
                        title="Đặt làm mặc định"
                      >
                        <TrendingUp size={16} className="text-[#10B981]" />
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditCategory(category);
                      }}
                      className="p-2 bg-white rounded-lg shadow-md hover:bg-[#F9FAFB] transition-colors"
                      title="Chỉnh sửa"
                    >
                      <Edit size={16} className="text-[#6B7280]" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(category);
                      }}
                      className="p-2 bg-white rounded-lg shadow-md hover:bg-red-50 transition-colors"
                      title="Xóa"
                    >
                      <Trash2 size={16} className="text-[#EF4444]" />
                    </button>
                  </div>

                  {/* Badge loại */}
                  <div className="absolute top-2 left-2">
                    <span
                      className={`ds-badge ${
                        category.type === "income" ? "ds-badge-success" : "ds-badge-danger"
                      }`}
                    >
                      {category.type === "income" ? "Thu nhập" : "Chi tiêu"}
                    </span>
                  </div>

                  {/* Badge mặc định */}
                  {category.is_default && (
                    <div className="absolute top-2 left-2 mt-6">
                      <span className="ds-badge ds-badge-primary">Mặc định</span>
                    </div>
                  )}

                  {/* Icon */}
                  <div className="flex justify-center mb-4 mt-8">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center text-4xl ${
                        category.type === "income" ? "bg-[#10B981]/10" : "bg-[#EF4444]/10"
                      }`}
                    >
                      {getIconEmoji(category.icon)}
                    </div>
                  </div>

                  {/* Name */}
                  <div className="text-center">
                    <h3 className="ds-heading-3 mb-2 line-clamp-2">{category.name}</h3>
                    {category.parent_id && (
                      <p className="ds-text-small text-[#6B7280]">
                        <Folder size={12} className="inline mr-1" />
                        Danh mục con
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-sm text-slate-600">
                Hiển thị{" "}
                <span className="font-semibold text-slate-800">
                  {(page - 1) * pageSize + 1}
                </span>
                {" - "}
                <span className="font-semibold text-slate-800">
                  {Math.min(page * pageSize, total)}
                </span>{" "}
                / {total} danh mục
              </div>

              <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                showSizeChanger
                pageSizeOptions={[10, 20, 30, 50]}
                onChange={(p, ps) => {
                  setPage(p);
                  setPageSize(ps);
                }}
                showLessItems
              />
            </div>
          </>
        ) : (
          <div className="ds-empty-state">
            <Folder className="ds-empty-state-icon" size={64} />
            <p className="ds-empty-state-text">
              {activeTab === "income"
                ? "Chưa có danh mục thu nhập nào"
                : activeTab === "expense"
                ? "Chưa có danh mục chi tiêu nào"
                : "Chưa có danh mục nào"}
            </p>
            <button onClick={handleAddCategory} className="ds-button-primary mt-4">
              <Plus size={18} />
              <span className="hidden sm:inline ml-2">Thêm danh mục đầu tiên</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      <CategoryModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingCategory(null);
        }}
        category={editingCategory}
        onSuccess={loadCategories}
      />
    </div>
  );
};

export default CategoriesIndex;
