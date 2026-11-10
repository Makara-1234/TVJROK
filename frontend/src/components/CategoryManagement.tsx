
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  FolderOpen,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Utensils,
  Layers3,
  EyeOff,
  Filter,
} from "lucide-react";

import { categoryService } from "../services/categoryService";
import type {
  Category,
  CreateCategoryDto,
} from "../types/category";

// ==========================================
// INITIAL FORM
// ==========================================

const emptyForm: CreateCategoryDto = {
  name: "",
  description: "",
  imageUrl: "",
};

// ==========================================
// CATEGORY MANAGEMENT
// ==========================================

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<Category | null>(null);

  const [form, setForm] = useState<CreateCategoryDto>(emptyForm);

  // ==========================================
  // FETCH CATEGORIES
  // ==========================================

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await categoryService.getAll();
      setCategories(data);
    } catch (err) {
      console.error("Failed to load categories:", err);
      setError("មិនអាចទាញយកទិន្នន័យ Category បានទេ។");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  // ==========================================
  // FILTER CATEGORIES
  // ==========================================

  const filteredCategories = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return categories.filter((category) => {
      const matchesSearch =
        category.name.toLowerCase().includes(keyword) ||
        (category.description ?? "").toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && category.isActive) ||
        (statusFilter === "inactive" && !category.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [categories, search, statusFilter]);

  // ==========================================
  // STATISTICS
  // ==========================================

  const activeCount = categories.filter(
    (category) => category.isActive
  ).length;

  const inactiveCount = categories.length - activeCount;

  const activePercentage = categories.length
    ? (activeCount / categories.length) * 100
    : 0;

  const inactivePercentage = categories.length
    ? (inactiveCount / categories.length) * 100
    : 0;

  // ==========================================
  // MODAL FUNCTIONS
  // ==========================================

  const openCreateModal = () => {
    setEditingCategory(null);
    setForm({ ...emptyForm });
    setError("");
    setShowModal(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);

    setForm({
      name: category.name,
      description: category.description ?? "",
      imageUrl: category.imageUrl ?? "",
    });

    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingCategory(null);
    setForm({ ...emptyForm });
    setError("");
  };

  // ==========================================
  // CREATE / UPDATE CATEGORY
  // ==========================================

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("សូមបញ្ចូលឈ្មោះ Category។");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload: CreateCategoryDto = {
        name: form.name.trim(),
        description: form.description?.trim() || null,
        imageUrl: form.imageUrl?.trim() || null,
      };

      if (editingCategory) {
        await categoryService.update(editingCategory.id, {
          ...payload,
          isActive: editingCategory.isActive,
        });
      } else {
        await categoryService.create(payload);
      }

      setShowModal(false);
      setEditingCategory(null);
      setForm({ ...emptyForm });

      await fetchCategories();
    } catch (err) {
      console.error("Failed to save category:", err);
      setError(
        "រក្សាទុក Category មិនបានទេ។ សូមពិនិត្យ API របស់អ្នក។"
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // DELETE CATEGORY
  // ==========================================

  const handleDelete = async (category: Category) => {
    const confirmed = window.confirm(
      `តើអ្នកប្រាកដថាចង់លុប "${category.name}" មែនទេ?`
    );

    if (!confirmed) return;

    try {
      setError("");

      await categoryService.delete(category.id);
      await fetchCategories();
    } catch (err) {
      console.error("Failed to delete category:", err);

      setError(
        "លុប Category មិនបានទេ។ វាអាចកំពុងត្រូវបានប្រើប្រាស់ដោយ Product។"
      );
    }
  };

  // ==========================================
  // TOGGLE ACTIVE / INACTIVE
  // ==========================================

  const handleToggleStatus = async (category: Category) => {
    try {
      setError("");

      await categoryService.update(category.id, {
        name: category.name,
        description: category.description,
        imageUrl: category.imageUrl,
        isActive: !category.isActive,
      });

      await fetchCategories();
    } catch (err) {
      console.error("Failed to update category status:", err);
      setError("មិនអាចផ្លាស់ប្តូរ Status បានទេ។");
    }
  };

  // ==========================================
  // CATEGORY IMAGE
  // ==========================================

  const CategoryImage = ({ category }: { category: Category }) => (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-orange-100 bg-[#fff7ed]">
      {category.imageUrl ? (
        <img
          src={category.imageUrl}
          alt={category.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <ImageIcon size={21} className="text-orange-500" />
      )}
    </div>
  );

  // ==========================================
  // CATEGORY STATUS
  // ==========================================

  const CategoryStatus = ({
    category,
  }: {
    category: Category;
  }) => (
    <button
      type="button"
      onClick={() => handleToggleStatus(category)}
      title="Click to change status"
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition hover:opacity-80 ${
        category.isActive
          ? "bg-green-50 text-green-700"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      {category.isActive ? (
        <CheckCircle2 size={14} />
      ) : (
        <XCircle size={14} />
      )}

      {category.isActive ? "Active" : "Inactive"}
    </button>
  );

  // ==========================================
  // CATEGORY ACTIONS
  // ==========================================

  const CategoryActions = ({
    category,
  }: {
    category: Category;
  }) => (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={() => openEditModal(category)}
        title="Edit category"
        aria-label={`Edit ${category.name}`}
        className="rounded-lg p-2.5 text-slate-400 transition hover:bg-orange-50 hover:text-orange-600"
      >
        <Pencil size={17} />
      </button>

      <button
        type="button"
        onClick={() => handleDelete(category)}
        title="Delete category"
        aria-label={`Delete ${category.name}`}
        className="rounded-lg p-2.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 size={17} />
      </button>
    </div>
  );

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="min-h-screen bg-[#f8f8f6] p-4 sm:p-6 lg:p-8">

      {/* ======================================
          PAGE HEADER
      ====================================== */}

      <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm text-slate-400">
            <FolderOpen size={16} />
            <span>Management</span>
            <span>/</span>
            <span className="font-medium text-orange-500">
              Categories
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Category Management
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            គ្រប់គ្រងប្រភេទម្ហូបនៅក្នុង Restaurant
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={fetchCategories}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-orange-200 transition hover:-translate-y-0.5 hover:bg-orange-600"
          >
            <Plus size={19} />
            Add Category
          </button>
        </div>
      </div>

      {/* ======================================
          WELCOME BANNER
      ====================================== */}

      <div className="relative mb-7 overflow-hidden rounded-2xl bg-gradient-to-r from-[#fff0df] via-[#fff6ed] to-[#fffaf4] p-5 sm:p-6">
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500">
              TV JROK RESTAURANT
            </p>

            <h2 className="mt-2 text-lg font-bold text-slate-800 sm:text-xl">
              Organize Your Menu
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage your food categories in one place.
            </p>
          </div>

          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-orange-500 shadow-sm sm:h-20 sm:w-20">
            <Utensils size={36} strokeWidth={1.5} />
          </div>
        </div>

        <div className="absolute -right-8 -top-12 h-40 w-40 rounded-full border-[20px] border-white/30" />

        <div className="absolute -bottom-16 right-28 h-36 w-36 rounded-full bg-orange-200/20" />
      </div>

      {/* ======================================
          STATISTICS
      ====================================== */}

      <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

        {/* Total Categories */}

        <div className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Categories
              </p>

              <h3 className="mt-3 text-3xl font-bold text-slate-900">
                {categories.length}
              </h3>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
              <Layers3 size={23} />
            </div>
          </div>

          <div className="mt-4 h-1 overflow-hidden rounded-full bg-orange-50">
            <div className="h-full w-full rounded-full bg-orange-400" />
          </div>
        </div>

        {/* Active Categories */}

        <div className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Active Categories
              </p>

              <h3 className="mt-3 text-3xl font-bold text-green-600">
                {activeCount}
              </h3>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <CheckCircle2 size={23} />
            </div>
          </div>

          <div className="mt-4 h-1 overflow-hidden rounded-full bg-green-50">
            <div
              className="h-full rounded-full bg-green-500"
              style={{ width: `${activePercentage}%` }}
            />
          </div>
        </div>

        {/* Inactive Categories */}

        <div className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:col-span-2 xl:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Inactive Categories
              </p>

              <h3 className="mt-3 text-3xl font-bold text-slate-500">
                {inactiveCount}
              </h3>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <EyeOff size={23} />
            </div>
          </div>

          <div className="mt-4 h-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-slate-400"
              style={{ width: `${inactivePercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* ======================================
          ERROR MESSAGE
      ====================================== */}

      {error && !showModal && (
        <div
          role="alert"
          className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600"
        >
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Close error"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* ======================================
          SEARCH AND FILTER
      ====================================== */}

      <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row">

          {/* Search */}

          <div className="relative min-w-0 flex-1">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search category name..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-50"
            />
          </div>

          {/* Status Filter */}

          <div className="relative md:w-56">
            <Filter
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-9 text-sm font-medium text-slate-600 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-50"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* ======================================
          CATEGORY LIST
      ====================================== */}

      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

        {/* List Header */}

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5">
          <div>
            <h2 className="font-bold text-slate-800">
              Categories List
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Manage your restaurant food categories
            </p>
          </div>

          <span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-600">
            {filteredCategories.length} categories
          </span>
        </div>

        {/* Loading */}

        {loading ? (
          <div className="p-14 text-center">
            <RefreshCw
              size={26}
              className="mx-auto mb-3 animate-spin text-orange-500"
            />

            <p className="text-sm text-slate-500">
              Loading categories...
            </p>
          </div>
        ) : filteredCategories.length === 0 ? (

          /* Empty State */

          <div className="p-14 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-400">
              <FolderOpen size={30} />
            </div>

            <h3 className="font-semibold text-slate-700">
              No categories found
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              Try another search or create a new category.
            </p>

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-4 text-sm font-semibold text-orange-500 hover:underline"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <>
            {/* ==================================
                MOBILE CARD LAYOUT
                Visible below md breakpoint
            ================================== */}

            <div className="space-y-3 p-4 md:hidden">
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-orange-100"
                >
                  {/* Category Information */}

                  <div className="flex items-start gap-3">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-orange-100 bg-orange-50">
                      {category.imageUrl ? (
                        <img
                          src={category.imageUrl}
                          alt={category.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageIcon
                          size={24}
                          className="text-orange-500"
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="break-words font-bold text-slate-800">
                        {category.name}
                      </h3>

                      <p className="mt-1 break-words text-xs leading-5 text-slate-500">
                        {category.description || "No description"}
                      </p>

                      <div className="mt-3">
                        <CategoryStatus category={category} />
                      </div>
                    </div>
                  </div>

                  {/* Mobile Actions */}

                  <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => openEditModal(category)}
                      className="inline-flex items-center gap-2 rounded-lg bg-orange-50 px-4 py-2.5 text-xs font-semibold text-orange-600 transition hover:bg-orange-100"
                    >
                      <Pencil size={15} />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(category)}
                      className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ==================================
                DESKTOP TABLE LAYOUT
                Visible at md and above
            ================================== */}

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[700px] text-left">
                <thead>
                  <tr className="bg-[#fafaf8] text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4">Category</th>
                    <th className="px-5 py-4">Description</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredCategories.map((category) => (
                    <tr
                      key={category.id}
                      className="group transition-colors hover:bg-[#fffaf5]"
                    >
                      {/* Category */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <CategoryImage category={category} />

                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800">
                              {category.name}
                            </p>

                            <p className="mt-0.5 text-[11px] text-slate-400">
                              Restaurant Category
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Description */}

                      <td className="max-w-xs px-5 py-4 text-sm text-slate-500">
                        <span className="line-clamp-2">
                          {category.description || "—"}
                        </span>
                      </td>

                      {/* Status */}

                      <td className="px-5 py-4">
                        <CategoryStatus category={category} />
                      </td>

                      {/* Actions */}

                      <td className="px-5 py-4">
                        <CategoryActions category={category} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* List Footer */}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-[#fdfdfc] px-5 py-4">
          <p className="text-xs text-slate-400">
            Showing {filteredCategories.length} of {categories.length} categories
          </p>

          <p className="text-xs font-medium text-slate-400">
            TV JROK Restaurant Admin
          </p>
        </div>
      </section>

      {/* ======================================
          ADD / EDIT MODAL
      ====================================== */}

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 backdrop-blur-[3px] sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-modal-title"
            className="my-auto max-h-[95vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >

            {/* Modal Header */}

            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-5 py-5 sm:px-6">
              <div>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                  <Utensils size={20} />
                </div>

                <h2
                  id="category-modal-title"
                  className="text-xl font-bold text-slate-800"
                >
                  {editingCategory ? "Edit Category" : "Add Category"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  បញ្ចូលព័ត៌មានប្រភេទម្ហូប
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X size={21} />
              </button>
            </div>

            {/* Modal Form */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-5 sm:p-6"
            >
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600"
                >
                  {error}
                </div>
              )}

              {/* Category Name */}

              <div>
                <label
                  htmlFor="category-name"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Category Name <span className="text-red-500">*</span>
                </label>

                <input
                  id="category-name"
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      name: event.target.value,
                    })
                  }
                  placeholder="Enter category name"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-50"
                />
              </div>

              {/* Description */}

              <div>
                <label
                  htmlFor="category-description"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Description
                </label>

                <textarea
                  id="category-description"
                  value={form.description ?? ""}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      description: event.target.value,
                    })
                  }
                  placeholder="Enter description"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-50"
                />
              </div>

              {/* Image URL */}

              <div>
                <label
                  htmlFor="category-image"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Image URL
                </label>

                <input
                  id="category-image"
                  type="url"
                  value={form.imageUrl ?? ""}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      imageUrl: event.target.value,
                    })
                  }
                  placeholder="https://example.com/image.jpg"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-50"
                />
              </div>

              {/* Modal Actions */}

              <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <RefreshCw
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  {saving
                    ? "Saving..."
                    : editingCategory
                      ? "Update Category"
                      : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
