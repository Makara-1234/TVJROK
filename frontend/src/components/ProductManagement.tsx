import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search, Plus, Package, CheckCircle2, Star, Ban,
  Pencil, Trash2, RefreshCw, X, Upload, ImagePlus,
  UtensilsCrossed, Salad, Grid2X2,
Fish, Beef, Flame, CookingPot, Leaf, Soup, Beer, CupSoda,
  PlusCircle, Gift, Drumstick, Sandwich, ChevronLeft, ChevronRight,
} from "lucide-react";

import { productService } from "../services/productService";
import { categoryService } from "../services/categoryService";
import type {
  Product,
  CreateProductDto,
} from "../types/product";
import type { Category } from "../types/category";

const toKhmerDigits = (value: string) =>
  value.replace(/\d/g, (digit) => "០១២៣៤៥៦៧៨៩"[Number(digit)]);

const money = (value: number) => {
  const formatted = Math.round(value).toLocaleString("en-US");
  return `${toKhmerDigits(formatted)}៛`;
};

const emptyForm: CreateProductDto = {
  categoryId: "",
  name: "",
  description: "",
  price: 0,
  isAvailable: true,
  isFeatured: false,
};

// Match icons by Khmer category name so icons stay consistent
// even when the API returns categories in a different order.
const categoryIconMap = {
  "គ្រឿងសមុទ្រ": Fish,
  "ម្ហូបញាំ": Salad,
  "ម្ហូបសាច់": Beef,
  "ម្ហូបអាំង": Flame,
  "ម្ហូបឆា": CookingPot,
  "ម្ហូបបំពង": Sandwich,
  "ម្ហូបស្រស់": Leaf,
  "បាយ": Soup,
  "ស៊ុប": Soup,
  "ស្រាបៀរ": Beer,
  "ភេសជ្ជៈ": CupSoda,
  "ម្ហូបបន្ថែម": PlusCircle,
  "ម្ហូបថែម": Drumstick,
  "ម្ហូបផ្សេងៗ": UtensilsCrossed,
  "ឈុត Promotion": Gift,
} as const;

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [filter, setFilter] = useState("All");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<CreateProductDto>(emptyForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const fetchData = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      setError("");

      const [productData, categoryData] = await Promise.all([
        productService.getAll(),
        categoryService.getAll(),
      ]);

      setProducts(productData);
      setCategories(categoryData.filter((c) => c.isActive));
    } catch (err) {
      console.error("Load products failed:", err);
      setError("Unable to load products. Please check your API connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();

    const interval = window.setInterval(() => {
      fetchData();
    }, 10000);

    return () => window.clearInterval(interval);
  }, []);

  const availableCount = products.filter((p) => p.isAvailable).length;
  const featuredCount = products.filter((p) => p.isFeatured).length;
  const unavailableCount = products.filter((p) => !p.isAvailable).length;

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const keyword = search.toLowerCase();

      const matchesSearch =
        product.name.toLowerCase().includes(keyword) ||
        product.categoryName.toLowerCase().includes(keyword);

      const matchesCategory =
        selectedCategory === "All" ||
        product.categoryId === selectedCategory;

      const matchesFilter =
        filter === "All" ||
        (filter === "Available" && product.isAvailable) ||
        (filter === "Featured" && product.isFeatured) ||
        (filter === "Unavailable" && !product.isAvailable);

      return matchesSearch && matchesCategory && matchesFilter;
    });
  }, [products, search, selectedCategory, filter]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setForm({
      ...emptyForm,
      categoryId: categories[0]?.id || "",
    });
    setSelectedFile(null);
    setPreview("");
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setForm({
      categoryId: product.categoryId,
      name: product.name,
      description: product.description || "",
      price: product.price,
      isAvailable: product.isAvailable,
      isFeatured: product.isFeatured,
    });
    setSelectedFile(null);
    setPreview(product.images.find((i) => i.isPrimary)?.imageUrl ||
      product.images[0]?.imageUrl || "");
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingProduct(null);
    setSelectedFile(null);
    setPreview("");
    setFormError("");
  };

  const handleFileChange = (file?: File) => {
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp"];

    if (!allowed.includes(file.type)) {
      setFormError("Only JPG, PNG and WEBP images are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError("Image size must not exceed 5 MB.");
      return;
    }

    setFormError("");
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError("Product name is required.");
      return;
    }

    if (!form.categoryId) {
      setFormError("Please select a category.");
      return;
    }

    if (Number(form.price) <= 0) {
      setFormError("Price must be greater than zero.");
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      const payload: CreateProductDto = {
        ...form,
        name: form.name.trim(),
        description: form.description?.trim() || null,
        price: Number(form.price),
      };

      let productId: string;

      if (editingProduct) {
        await productService.update(editingProduct.id, payload);
        productId = editingProduct.id;
      } else {
        const created = await productService.create(payload);
        productId = created.id;
      }

      if (selectedFile) {
        await productService.uploadImage(productId, selectedFile);
      }

      await fetchData();

      setModalOpen(false);
      setEditingProduct(null);
      setSelectedFile(null);
      setPreview("");
    } catch (err) {
      console.error("Save product failed:", err);
      setFormError("Unable to save product. Please check the information and try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`
    );

    if (!confirmed) return;

    try {
      await productService.delete(product.id);
      await fetchData();
    } catch (err) {
      console.error("Delete product failed:", err);
      window.alert(
        "Unable to delete this product. It may be used in existing orders."
      );
    }
  };

  const handleToggleAvailable = async (product: Product) => {
    try {
      await productService.update(product.id, {
        categoryId: product.categoryId,
        name: product.name,
        description: product.description,
        price: product.price,
        isAvailable: !product.isAvailable,
        isFeatured: product.isFeatured,
      });

      await fetchData();
    } catch (err) {
      console.error("Update availability failed:", err);
      window.alert("Unable to update product availability.");
    }
  };

  const handleToggleFeatured = async (product: Product) => {
    try {
      await productService.update(product.id, {
        categoryId: product.categoryId,
        name: product.name,
        description: product.description,
        price: product.price,
        isAvailable: product.isAvailable,
        isFeatured: !product.isFeatured,
      });

      await fetchData();
    } catch (err) {
      console.error("Update featured failed:", err);
      window.alert("Unable to update featured status.");
    }
  };

  return (
    <div className="space-y-6 p-5 md:p-8">

      {/* Heading */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Products</h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage food & beverage items, categories, and availability.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
          >
            <Plus size={18} />
            Add Product
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
          <button
            type="button"
            onClick={() => fetchData(true)}
            className="ml-2 font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: "Total Products",
            value: products.length,
            icon: Package,
            color: "bg-orange-50 text-orange-600",
          },
          {
            title: "Available",
            value: availableCount,
            icon: CheckCircle2,
            color: "bg-green-50 text-green-600",
          },
          {
            title: "Featured",
            value: featuredCount,
            icon: Star,
            color: "bg-amber-50 text-amber-600",
          },
          {
            title: "Out of Stock",
            value: unavailableCount,
            icon: Ban,
            color: "bg-red-50 text-red-600",
          },
        ].map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className={`rounded-full p-3 ${stat.color}`}>
                <Icon size={23} />
              </div>
              <div>
                <p className="text-sm text-slate-500">{stat.title}</p>
                <h3 className="mt-1 text-2xl font-bold text-slate-900">
                  {loading ? "..." : stat.value}
                </h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search and Filters */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-lg">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-full border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="min-w-40 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500"
            >
              <option value="All">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500"
            >
              <option value="All">All Products</option>
              <option value="Available">Available</option>
              <option value="Featured">Featured</option>
              <option value="Unavailable">Unavailable</option>
            </select>
          </div>
        </div>

        {/* Category Cards - horizontally scrollable on desktop and mobile */}
        <div className="relative mt-6">
          <div
            ref={categoryScrollRef}
            className="flex gap-3 overflow-x-auto scroll-smooth pb-4"
            style={{ scrollbarWidth: "thin" }}
          >
            <button
              type="button"
              onClick={() => setSelectedCategory("All")}
              className={`flex w-36 flex-none snap-start flex-col items-center justify-center gap-1.5 rounded-xl border px-3 py-3 text-center transition sm:w-40 ${
                selectedCategory === "All"
                  ? "border-orange-500 bg-orange-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-orange-300 hover:bg-orange-50/40"
              }`}
            >
              <span className="rounded-xl bg-orange-100 p-2.5 text-orange-600">
                <Grid2X2 size={24} strokeWidth={2.2} />
              </span>
              <span className="text-xs font-bold text-slate-800">All Items</span>
              <span className="text-xs text-slate-500">{products.length} items</span>
            </button>

            {categories.map((category) => {
              const Icon =
                categoryIconMap[category.name as keyof typeof categoryIconMap] ??
                UtensilsCrossed;
              const count = products.filter(
                (product) => product.categoryId === category.id
              ).length;

              return (
                <button
                  type="button"
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex w-36 flex-none snap-start flex-col items-center justify-center gap-1.5 rounded-xl border px-3 py-3 text-center transition sm:w-40 ${
                    selectedCategory === category.id
                      ? "border-orange-500 bg-orange-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-orange-300 hover:bg-orange-50/40"
                  }`}
                >
                  <span className="rounded-xl bg-orange-50 p-2.5 text-orange-600">
                    <Icon size={24} strokeWidth={2.1} />
                  </span>
                  <span className="max-w-full truncate text-xs font-bold text-slate-800">
                    {category.name}
                  </span>
                  <span className="text-xs text-slate-500">{count} items</span>
                </button>
              );
            })}
          </div>

          <div className="mt-1 flex items-center justify-between">
            <button
              type="button"
              aria-label="Scroll categories left"
              onClick={() =>
                categoryScrollRef.current?.scrollBy({ left: -360, behavior: "smooth" })
              }
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:border-orange-300 hover:text-orange-600"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-xs text-slate-400">
              Scroll or swipe to view all categories
            </span>
            <button
              type="button"
              aria-label="Scroll categories right"
              onClick={() =>
                categoryScrollRef.current?.scrollBy({ left: 360, behavior: "smooth" })
              }
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:border-orange-300 hover:text-orange-600"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400">
          Loading products...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Package size={40} className="mx-auto text-slate-300" />
          <p className="mt-3 font-semibold text-slate-700">No products found</p>
          <p className="mt-1 text-sm text-slate-400">
            Try changing your search or filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {filteredProducts.map((product) => {
            const primaryImage =
              product.images.find((image) => image.isPrimary) ||
              product.images[0];

            return (
              <article
                key={product.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="relative flex h-48 items-center justify-center bg-slate-50">
                  {primaryImage ? (
                    <img
                      src={primaryImage.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-slate-300">
                      <ImagePlus size={42} />
                      <span className="mt-2 text-xs">No image</span>
                    </div>
                  )}

                  <button
                    type="button"
                    title={product.isFeatured ? "Remove featured" : "Set featured"}
                    onClick={() => handleToggleFeatured(product)}
                    className={`absolute right-3 top-3 rounded-full p-2 shadow-sm ${
                      product.isFeatured
                        ? "bg-orange-100 text-orange-500"
                        : "bg-white text-slate-400"
                    }`}
                  >
                    <Star
                      size={17}
                      fill={product.isFeatured ? "currentColor" : "none"}
                    />
                  </button>

                  {!product.isAvailable && (
                    <span className="absolute left-3 top-3 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white">
                      Unavailable
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <p className="text-xs font-medium text-slate-400">
                    {product.categoryName}
                  </p>

                  <h3 className="mt-1 truncate font-bold text-slate-900">
                    {product.name}
                  </h3>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-lg font-bold text-orange-600">
                      {money(product.price)}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        product.isAvailable
                          ? "bg-green-50 text-green-600"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {product.isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => openEditModal(product)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-orange-600"
                    >
                      <Pencil size={15} />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(product)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-red-600"
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={product.isAvailable}
                      title="Toggle availability"
                      onClick={() => handleToggleAvailable(product)}
                      className={`relative h-6 w-11 rounded-full transition ${
                        product.isAvailable ? "bg-orange-500" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                          product.isAvailable ? "left-6" : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="text-xs text-slate-400">
        Showing {filteredProducts.length} of {products.length} products · Auto refresh every 10 seconds
      </p>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="my-8 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Enter product information below.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {/* Image */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Product Image
                </label>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-40 w-full flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 hover:border-orange-400"
                >
                  {preview ? (
                    <img
                      src={preview}
                      alt="Product preview"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <>
                      <Upload size={27} className="text-slate-400" />
                      <span className="mt-2 text-sm font-medium text-slate-600">
                        Click to upload image
                      </span>
                      <span className="mt-1 text-xs text-slate-400">
                        JPG, PNG, WEBP · Maximum 5MB
                      </span>
                    </>
                  )}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  onChange={(e) => handleFileChange(e.target.files?.[0])}
                />
              </div>

              {/* Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Product Name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="Enter product name"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500"
                />
              </div>

              {/* Category and Price */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Category *
                  </label>
                  <select
                    value={form.categoryId}
                    onChange={(e) =>
                      setForm({ ...form, categoryId: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-orange-500"
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Price (KHR) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.description || ""}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Describe this product..."
                  className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-orange-500"
                />
              </div>

              {/* Switches */}
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.isAvailable}
                    onChange={(e) =>
                      setForm({ ...form, isAvailable: e.target.checked })
                    }
                    className="accent-orange-500"
                  />
                  Available
                </label>

                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) =>
                      setForm({ ...form, isFeatured: e.target.checked })
                    }
                    className="accent-orange-500"
                  />
                  Featured
                </label>
              </div>

              {formError && (
                <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || categories.length === 0}
                  className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingProduct ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}