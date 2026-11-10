import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Search, Plus, Package, CheckCircle2, Star, Ban,
  Pencil, Trash2, RefreshCw, X, Upload, ImagePlus,
  List, LayoutGrid, ArrowUpDown,
  UtensilsCrossed, Salad, Grid2X2, Fish, Beef, Flame,
  CookingPot, Leaf, Soup, Beer, CupSoda, PlusCircle,
  Gift, Drumstick, Sandwich, ChevronLeft, ChevronRight,
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name-asc" | "price-low" | "price-high">("newest");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<CreateProductDto>(emptyForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  // Prevent overlapping requests when the interval and manual refresh
  // happen at nearly the same time.
  const isFetchingRef = useRef(false);

  const fetchData = useCallback(async (showRefresh = false) => {
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;

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
      isFetchingRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Load immediately when the page opens.
    void fetchData();

    // Refresh product and active-category data every 10 seconds.
    const interval = window.setInterval(() => {
      void fetchData();
    }, 10000);

    return () => {
      window.clearInterval(interval);
    };
  }, [fetchData]);

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

  const sortedProducts = useMemo(() => {
    const result = [...filteredProducts];
    switch (sortBy) {
      case "oldest":
        return result.reverse();
      case "name-asc":
        return result.sort((a, b) => a.name.localeCompare(b.name));
      case "price-low":
        return result.sort((a, b) => a.price - b.price);
      case "price-high":
        return result.sort((a, b) => b.price - a.price);
      case "newest":
      default:
        // The API's current ordering is retained as newest-first.
        return result;
    }
  }, [filteredProducts, sortBy]);

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


      {/* Product list heading and view controls */}
      <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <span className="rounded-xl bg-orange-50 p-2 text-orange-600"><Package size={18} /></span>
            Products List
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Showing {sortedProducts.length} {sortedProducts.length === 1 ? "product" : "products"}
          </p>
        </div>
        <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:flex sm:w-auto">
          <label className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-500 sm:flex-none">
            <ArrowUpDown size={16} />
            <span className="whitespace-nowrap">Sort by</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="min-w-0 bg-transparent font-semibold text-slate-800 outline-none"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="name-asc">Name: A–Z</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </label>
          <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
              onClick={() => setViewMode("grid")}
              className={`rounded-lg p-2 transition ${viewMode === "grid" ? "bg-orange-500 text-white shadow-sm" : "text-slate-500 hover:text-orange-600"}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              type="button"
              aria-label="List view"
              aria-pressed={viewMode === "list"}
              onClick={() => setViewMode("list")}
              className={`rounded-lg p-2 transition ${viewMode === "list" ? "bg-orange-500 text-white shadow-sm" : "text-slate-500 hover:text-orange-600"}`}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Product Grid / List */}
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
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-5 xl:grid-cols-4">
          {sortedProducts.map((product) => {
            const primaryImage =
              product.images.find((image) => image.isPrimary) ||
              product.images[0];

            return (
              <article
                key={product.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="relative flex h-28 items-center justify-center bg-slate-50 sm:h-48">
                  {primaryImage ? (
                    <img
                      src={primaryImage.imageUrl}
                      alt={product.name}
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
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

                <div className="p-2.5 sm:p-4">
                  <p className="text-xs font-medium text-slate-400">
                    {product.categoryName}
                  </p>

                  <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-bold leading-5 text-slate-900 sm:text-base">
                    {product.name}
                  </h3>

                  <div className="mt-2 flex flex-col items-start justify-between gap-1.5 sm:mt-3 sm:flex-row sm:items-center">
                    <span className="text-base font-bold text-orange-600 sm:text-lg">
                      {money(product.price)}
                    </span>

                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-semibold whitespace-nowrap sm:px-3 sm:text-xs ${
                        product.isAvailable
                          ? "bg-green-50 text-green-600"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {product.isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-1 border-t border-slate-100 pt-2 sm:mt-4 sm:gap-2 sm:pt-3">
                    <button
                      type="button"
                      onClick={() => openEditModal(product)}
                      className="flex shrink-0 items-center gap-1 rounded-lg p-1.5 text-[11px] font-semibold text-slate-600 hover:bg-orange-50 hover:text-orange-600 sm:gap-1.5 sm:p-0 sm:text-xs"
                    >
                      <Pencil size={15} />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(product)}
                      className="flex shrink-0 items-center gap-1 rounded-lg p-1.5 text-[11px] font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 sm:gap-1.5 sm:p-0 sm:text-xs"
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
                      className={`!relative !h-6 !w-11 !min-h-0 !min-w-0 !flex-none !shrink-0 !rounded-full !p-0 !shadow-none transition ${
                        product.isAvailable ? "bg-orange-500" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`!absolute !top-1 !h-4 !w-4 !min-h-0 !min-w-0 !rounded-full !bg-white !p-0 !shadow-none transition ${
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
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[minmax(220px,2fr)_1fr_1fr_1fr_auto] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
            <span>Product</span><span>Category</span><span>Price</span><span>Status</span><span>Actions</span>
          </div>
          <div className="divide-y divide-slate-100">
            {sortedProducts.map((product) => {
              const primaryImage = product.images.find((image) => image.isPrimary) || product.images[0];
              return (
                <div key={product.id} className="grid grid-cols-1 gap-3 px-4 py-4 md:grid-cols-[minmax(220px,2fr)_1fr_1fr_1fr_auto] md:items-center md:gap-4 md:px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="h-14 w-14 flex-none overflow-hidden rounded-xl bg-slate-100">
                      {primaryImage ? <img src={primaryImage.imageUrl} alt={product.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-300"><ImagePlus size={22} /></div>}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{product.name}</p>
                      <p className="truncate text-xs text-slate-500">{product.description || "No description"}</p>
                      {product.isFeatured && <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-orange-600"><Star size={12} fill="currentColor" /> Featured</span>}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 md:block"><span className="mr-2 text-xs text-slate-400 md:hidden">Category:</span>{product.categoryName}</p>
                  <p className="font-bold text-orange-600">{money(product.price)}</p>
                  <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${product.isAvailable ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>{product.isAvailable ? "Available" : "Unavailable"}</span>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => openEditModal(product)} aria-label={`Edit ${product.name}`} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:border-orange-300 hover:text-orange-600"><Pencil size={15} /></button>
                    <button type="button" onClick={() => handleDelete(product)} aria-label={`Delete ${product.name}`} className="rounded-lg border border-red-100 p-2 text-red-500 hover:bg-red-50"><Trash2 size={15} /></button>
                    <button type="button" role="switch" aria-checked={product.isAvailable} aria-label={`Toggle availability for ${product.name}`} onClick={() => handleToggleAvailable(product)} className={`!relative !h-6 !w-11 !min-h-0 !min-w-0 !flex-none !shrink-0 !rounded-full !p-0 !shadow-none transition ${product.isAvailable ? "bg-orange-500" : "bg-slate-300"}`}>
                      <span className={`!absolute !top-1 !h-4 !w-4 !min-h-0 !min-w-0 !rounded-full !bg-white !p-0 !shadow-none transition ${product.isAvailable ? "left-6" : "left-1"}`} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-xs text-slate-400">
        Showing {sortedProducts.length} of {products.length} products · Auto refresh every 10 seconds
      </p>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-950/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl">
            {/* Modal header */}
            <div className="flex flex-none items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-xl bg-orange-50 p-2 text-orange-600">
                    <Package size={19} />
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 sm:text-xl">
                    {editingProduct ? "Edit Product" : "Add New Product"}
                  </h3>
                </div>
                <p className="mt-2 text-xs text-slate-500 sm:text-sm">
                  {editingProduct ? "Update the product details below." : "Add a new item to your restaurant menu."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close product form"
                className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            {/* Scrollable form body */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-[190px_minmax(0,1fr)] sm:gap-6">
                {/* Image upload */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Product Image
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative flex h-44 w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/50 transition hover:border-orange-400 hover:bg-orange-50 sm:h-48"
                  >
                    {preview ? (
                      <img
                        src={preview}
                        alt="Product preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <>
                        <span className="rounded-2xl bg-white p-3 text-orange-500 shadow-sm">
                          <Upload size={25} />
                        </span>
                        <span className="mt-3 text-sm font-semibold text-slate-700">
                          Upload image
                        </span>
                        <span className="mt-1 text-center text-[11px] text-slate-500">
                          JPG, PNG or WEBP
                          <br />
                          Maximum 5 MB
                        </span>
                      </>
                    )}
                    {preview && (
                      <span className="absolute inset-x-2 bottom-2 rounded-lg bg-slate-950/65 px-2 py-1.5 text-center text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
                        Change image
                      </span>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    hidden
                    onChange={(e) => handleFileChange(e.target.files?.[0])}
                  />
                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    Choose a clear photo of the food or drink.
                  </p>
                </div>

                {/* Product fields */}
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Product Name <span className="text-orange-600">*</span>
                    </label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Khmer Fried Rice"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 sm:text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Category <span className="text-orange-600">*</span>
                      </label>
                      <select
                        value={form.categoryId}
                        onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-base outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 sm:text-sm"
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
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Price (KHR) <span className="text-orange-600">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={form.description || ""}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Add ingredients, flavor or serving details..."
                      className="w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-base outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Product visibility options */}
              <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <p className="mb-3 text-sm font-semibold text-slate-800">Product settings</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                    <input
                      type="checkbox"
                      checked={form.isAvailable}
                      onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
                      className="h-4 w-4 accent-orange-500"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-slate-800">Available</span>
                      <span className="block text-xs text-slate-500">Customers can order this item</span>
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                    <input
                      type="checkbox"
                      checked={form.isFeatured}
                      onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                      className="h-4 w-4 accent-orange-500"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-slate-800">Featured</span>
                      <span className="block text-xs text-slate-500">Highlight this item on the menu</span>
                    </span>
                  </label>
                </div>
              </div>

              {formError && (
                <p role="alert" className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">
                  {formError}
                </p>
              )}
            </div>

            {/* Sticky actions */}
            <div className="flex flex-none gap-3 border-t border-slate-100 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 sm:flex-none"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving || categories.length === 0}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
              >
                {saving ? "Saving..." : editingProduct ? "Save Changes" : "Create Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}