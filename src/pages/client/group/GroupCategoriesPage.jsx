import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import {
  createGroupCategoryApi,
  disableGroupCategoryApi,
  listGroupCategoriesApi,
  updateGroupCategoryApi,
} from "../../../services/api.group";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/35" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="text-base font-semibold text-slate-900">{title}</div>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

function getApiErrorMessage(err) {
  const data = err?.response?.data;
  const obj = err?.ok === false ? err : null;

  const code = obj?.code || data?.code;

  if (code === 11000 || obj?.message === "CATEGORY_NAME_ALREADY_EXISTS") {
    return "Tên category đã tồn tại trong nhóm. Vui lòng đặt tên khác.";
  }

  return (
    obj?.message ||
    data?.message ||
    data?.error ||
    data?.code ||
    err?.message ||
    "Có lỗi xảy ra, vui lòng thử lại."
  );
}

function ensureOk(res) {
  if (res?.ok === false) throw res;
  return res;
}

export default function GroupCategoriesPage() {
  const { groupId } = useParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [openDisable, setOpenDisable] = useState(false);
  const [disableTarget, setDisableTarget] = useState(null);
  const [disabling, setDisabling] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors, isValid },
  } = useForm({
    mode: "onChange",
    defaultValues: { name: "", type: "expense" },
  });

  async function load() {
    if (!groupId) return;
    setLoading(true);
    try {
      const res = ensureOk(await listGroupCategoriesApi(groupId));
      setRows(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setRows([]);
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [groupId]);

  function openCreate() {
    setEditing(null);
    setFormError("");
    reset({ name: "", type: "expense" });
    setOpenForm(true);
    setTimeout(() => setFocus("name"), 0);
  }

  function openEdit(cat) {
    setEditing(cat);
    setFormError("");
    reset({
      name: cat?.name || "",
      type: cat?.type || "expense",
    });
    setOpenForm(true);
    setTimeout(() => setFocus("name"), 0);
  }

  function openDisableConfirm(cat) {
    setDisableTarget(cat);
    setOpenDisable(true);
  }

  const onSubmit = async (values) => {
    if (!groupId || saving) return;

    setSaving(true);
    setFormError("");

    try {
      const payload = {
        name: String(values.name || "").trim(),
        type: values.type,
      };

      if (editing) {
        const categoryId = editing._id || editing.id;
        ensureOk(await updateGroupCategoryApi(groupId, categoryId, payload));
        toast.success("Đã cập nhật danh mục");
      } else {
        ensureOk(await createGroupCategoryApi(groupId, payload));
        toast.success("Đã tạo danh mục");
      }

      setOpenForm(false);
      setEditing(null);
      reset({ name: "", type: "expense" });
      await load();
    } catch (err) {
      const msg = getApiErrorMessage(err);
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  async function confirmDisable() {
    if (!groupId || !disableTarget || disabling) return;

    setDisabling(true);
    try {
      const categoryId = disableTarget._id || disableTarget.id;
      ensureOk(await disableGroupCategoryApi(groupId, categoryId));
      toast.success("Đã xóa danh mục");

      setOpenDisable(false);
      setDisableTarget(null);
      await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setDisabling(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Danh mục</h3>
        <button
          onClick={openCreate}
          className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          + Thêm danh mục
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-slate-600">Loading...</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-slate-600">Không có danh mục nào.</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {rows.map((c) => (
            <div
              key={c._id || c.id}
              className="flex items-center justify-between gap-4 py-3"
            >
              <div>
                <div className="font-semibold text-slate-900">{c.name}</div>
                <div className="text-sm text-slate-600">
                  Loại: {c.type == "expense" ? "Chi tiêu" : "Thu nhập"}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(c)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Chỉnh sửa
                </button>
                <button
                  onClick={() => openDisableConfirm(c)}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit modal */}
      <Modal
        open={openForm}
        title={editing ? "Chỉnh sửa danh mục" : "Tạo danh mục"}
        onClose={() => {
          if (saving) return;
          setOpenForm(false);
          setEditing(null);
          setFormError("");
          reset({ name: "", type: "expense" });
        }}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {formError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {formError}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Tên danh mục
            </label>
            <input
              {...register("name", {
                required: "Vui lòng nhập tên category",
                minLength: { value: 2, message: "Tối thiểu 2 ký tự" },
                validate: (v) =>
                  String(v || "").trim().length >= 2 || "Tối thiểu 2 ký tự",
              })}
              className={cn(
                "w-full rounded-xl border bg-slate-50/50 px-4 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-100",
                errors.name ? "border-rose-300" : "border-slate-200"
              )}
              placeholder="VD: Ăn uống, Di chuyển..."
              disabled={saving}
            />
            {errors.name && (
              <div className="mt-1 text-xs text-rose-700">
                {errors.name.message}
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Loại
            </label>
            <select
              {...register("type", { required: true })}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
              disabled={saving}
            >
              <option value="expense">Chi tiêu</option>
              <option value="income">Thu nhập</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                if (saving) return;
                setOpenForm(false);
                setEditing(null);
                setFormError("");
                reset({ name: "", type: "expense" });
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              disabled={saving}
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={!isValid || saving}
              className={cn(
                "rounded-xl px-4 py-2.5 text-sm font-semibold transition",
                !isValid || saving
                  ? "bg-slate-200 text-slate-500"
                  : "bg-slate-900 text-white hover:bg-slate-800"
              )}
            >
              {saving ? "Đang lưu..." : editing ? "Lưu" : "Tạo"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Disable confirm modal */}
      <Modal
        open={openDisable}
        title="Xóa danh mục"
        onClose={() => {
          if (disabling) return;
          setOpenDisable(false);
          setDisableTarget(null);
        }}
      >
        <div className="space-y-4">
          <div className="text-sm text-slate-700">
            Bạn chắc chắn muốn xóa danh mục {" "}
            <span className="font-semibold text-slate-900">
              "{disableTarget?.name}"
            </span>
            ?
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                if (disabling) return;
                setOpenDisable(false);
                setDisableTarget(null);
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              disabled={disabling}
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={confirmDisable}
              className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
              disabled={disabling}
            >
              {disabling ? "Đang xóa..." : "Xóa"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
