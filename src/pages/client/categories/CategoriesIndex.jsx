import { useEffect, useMemo, useState } from "react";
import { Plus, Edit, Trash2, Folder, Search } from "lucide-react";
import { message, Modal, Pagination, Input } from "antd";
import { getCategoriesAPI, deleteCategoryAPI } from "../../../services/api.category";
import CategoryModal from "../../../components/categories/CategoryModal";
import { useTranslation } from "react-i18next";

function buildCategoryTree(list = []) {
  const map = new Map();
  const roots = [];

  const getParentId = (c) => {
    const p = c?.parent_id;
    if (!p) return null;
    if (typeof p === "string") return p;
    if (typeof p === "object" && p._id) return String(p._id);
    return String(p);
  };

  for (const c of list) {
    map.set(String(c._id), { ...c, children: [] });
  }

  for (const c of list) {
    const id = String(c._id);
    const node = map.get(id);
    const parentId = getParentId(c);

    if (parentId && map.has(String(parentId))) {
      map.get(String(parentId)).children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortRec = (nodes) => {
    nodes.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    nodes.forEach((n) => sortRec(n.children || []));
  };
  sortRec(roots);

  return roots;
}

function filterTree(nodes, predicate, queryLower) {
  const q = (queryLower || "").trim();

  const dfs = (node) => {
    const children = (node.children || []).map(dfs).filter(Boolean);

    const name = (node.name || "").toLowerCase();
    const selfMatch = !q || name.includes(q);

    const typeMatch = predicate(node);

    if (typeMatch && (selfMatch || children.length > 0)) {
      return { ...node, children };
    }
    return null;
  };

  return (nodes || []).map(dfs).filter(Boolean);
}

function CategoryRow({ node, level = 0, t, getIconEmoji, onEdit, onDelete }) {
  const [open, setOpen] = useState(true);
  const hasChildren = (node.children || []).length > 0;

  return (
    <div className="w-full">
      <div
        className="ds-card group w-full flex items-center gap-4 px-4 py-3 hover:shadow-md transition"
        style={{ marginLeft: level * 18 }}
      >
        {/* Expand / bullet */}
        <div className="w-8 flex items-center justify-center shrink-0">
          {hasChildren ? (
            <button
              onClick={() => setOpen((v) => !v)}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"
              title={open ? t("common3.collapse") : t("common3.expand")}
            >
              <span className="text-lg leading-none">{open ? "▾" : "▸"}</span>
            </button>
          ) : (
            <span className="text-slate-300">•</span>
          )}
        </div>

        {/* Icon */}
        <div
          className={`w-11 h-11 rounded-full flex items-center justify-center text-2xl shrink-0 ${
            node.type === "income" ? "bg-[#10B981]/10" : "bg-[#EF4444]/10"
          }`}
        >
          {getIconEmoji(node.icon)}
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-semibold text-slate-900 truncate">{node.name}</div>

            <span
              className={`ds-badge ${
                node.type === "income" ? "ds-badge-success" : "ds-badge-danger"
              }`}
            >
              {node.type === "income" ? t("categories.type.income") : t("categories.type.expense")}
            </span>

            {hasChildren && (
              <span className="text-xs text-slate-500">
                {t("categories.badge.child")} • {node.children.length}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(node)}
            className="p-2 bg-white rounded-lg shadow-sm hover:bg-[#F9FAFB] transition-colors"
            title={t("common3.edit")}
          >
            <Edit size={16} className="text-[#6B7280]" />
          </button>

          <button
            onClick={() => onDelete(node)}
            className="p-2 bg-white rounded-lg shadow-sm hover:bg-red-50 transition-colors"
            title={t("common3.delete")}
          >
            <Trash2 size={16} className="text-[#EF4444]" />
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && open && (
        <div className="mt-2 space-y-2">
          {node.children.map((child) => (
            <CategoryRow
              key={child._id}
              node={child}
              level={level + 1}
              t={t}
              getIconEmoji={getIconEmoji}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const CategoriesIndex = () => {
  const { t } = useTranslation();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [q, setQ] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

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
        message.error(t("categories.toast.loadFail"));
      }
    } catch (error) {
      message.error(t("categories.toast.loadFail"));
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
      title: t("categories.confirm.deleteTitle"),
      content: t("categories.confirm.deleteContent", { name: category?.name || "" }),
      okText: t("common3.delete"),
      okType: "danger",
      cancelText: t("common3.cancel"),
      onOk: async () => {
        try {
          const res = await deleteCategoryAPI(category._id);
          if (res?.EC === 0) {
            message.success(t("categories.toast.deleteSuccess"));
            loadCategories();
          } else {
            message.error(res?.message || t("categories.toast.deleteFail"));
          }
        } catch (error) {
          message.error(t("common3.error"));
        }
      },
    });
  };

  const tabs = [
    { key: "all", label: t("categories.tabs.all") },
    { key: "income", label: t("categories.tabs.income"), color: "#10B981" },
    { key: "expense", label: t("categories.tabs.expense"), color: "#EF4444" },
  ];

  // TREE + FILTER + SEARCH
  const treeRoots = useMemo(() => buildCategoryTree(categories), [categories]);

  const filteredTree = useMemo(() => {
    const predicate = (c) => {
      if (activeTab === "income") return c.type === "income";
      if (activeTab === "expense") return c.type === "expense";
      return true;
    };
    return filterTree(treeRoots, predicate, q.toLowerCase());
  }, [treeRoots, activeTab, q]);

  // PAGINATION (roots only)
  const total = filteredTree.length;
  const pagedRoots = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTree.slice(start, start + pageSize);
  }, [filteredTree, page, pageSize]);

  const emptyText =
    activeTab === "income"
      ? t("categories.empty.income")
      : activeTab === "expense"
      ? t("categories.empty.expense")
      : t("categories.empty.all");

  return (
    <div
      className="
        min-h-screen
        bg-gradient-to-b from-emerald-50/70 via-white to-white
        dark:bg-none dark:bg-[var(--color-background)]
      "
    >
      <div className="max-w-[95%] mx-auto px-2 sm:px-4 lg:px-6 py-6 sm:py-8 lg:py-10">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <h1 className="ds-heading-1" style={{ fontSize: "24px", fontWeight: 700 }}>
            {t("categories.title")}
          </h1>

          <button
            onClick={handleAddCategory}
            className="ds-button-primary"
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
            aria-label={t("categories.actions.addAria")}
            title={t("categories.actions.addTitle")}
          >
            <Plus size={18} />
            <span className="hidden sm:inline">{t("categories.actions.add")}</span>
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
              placeholder={t("categories.search.placeholder")}
              prefix={<Search size={16} className="text-slate-400" />}
              className="h-11 rounded-xl"
            />
          </div>
        </div>

        {/* Vertical Tree List */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="ds-card ds-skeleton w-full" style={{ height: 64 }} />
            ))}
          </div>
        ) : total > 0 ? (
          <>
            <div className="space-y-3">
              {pagedRoots.map((root) => (
                <CategoryRow
                  key={root._id}
                  node={root}
                  level={0}
                  t={t}
                  getIconEmoji={getIconEmoji}
                  onEdit={handleEditCategory}
                  onDelete={handleDeleteCategory}
                />
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-sm text-slate-600">
                {t("categories.pagination.showing")}{" "}
                <span className="font-semibold text-slate-800">
                  {total === 0 ? 0 : (page - 1) * pageSize + 1}
                </span>
                {" - "}
                <span className="font-semibold text-slate-800">{Math.min(page * pageSize, total)}</span>{" "}
                / {total} {t("categories.pagination.items")}
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
            <p className="ds-empty-state-text">{emptyText}</p>

            <button onClick={handleAddCategory} className="ds-button-primary mt-4">
              <Plus size={18} />
              <span className="hidden sm:inline ml-2">{t("categories.actions.addFirst")}</span>
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
