import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  ShoppingCart,
  UtensilsCrossed,
  Search,
  Plus,
  Minus,
  X,
  Trash2,
  ChefHat,
  Table2,
  ArrowRight,
  Grid2X2,
  GlassWater,
  Soup,
  Drumstick,
  Check,
  UserRound,
  Phone,
  FileText,
  ClipboardCheck,
  Home,
  ClipboardList,
  RefreshCw,
  Package,
} from "lucide-react";

import axios from "axios";
import type { CreateOrderDto, Order } from "../types/order";
import { orderService } from "../services/orderService";
import { productService } from "../services/productService";
import { categoryService } from "../services/categoryService";
import { tableService } from "../services/tableService";

import type { Product } from "../types/product";
import type { Category } from "../types/category";
import type { Table } from "../types/table";

interface CartItem {
  product: Product;
  quantity: number;
}

const COLORS = {
  orange: "#F4511E",
  darkOrange: "#D94012",
  brown: "#1C1713",
  text: "#211A15",
  muted: "#81786F",
  background: "#F7F5F1",
  border: "#EAE4DC",
  lightOrange: "#FFF2EB",
  success: "#239653",
  error: "#C62828",
  warning: "#785A19",
};

const formatPrice = (price: number) =>
  `${Math.round(price).toLocaleString("en-US")}៛`;

const TRACKING_STEPS = [
  {
    status: "Pending",
    title: "បានទទួលការកម្មង់",
    description: "Order របស់អ្នកបានបញ្ជូនទៅភោជនីយដ្ឋាន។",
  },
  {
    status: "Confirm",
    title: "បានបញ្ជាក់ការកម្មង់",
    description: "ភោជនីយដ្ឋានបានទទួល និងបញ្ជាក់ Order របស់អ្នក។",
  },
  {
    status: "Preparing",
    title: "កំពុងរៀបចំម្ហូប",
    description: "ចុងភៅកំពុងរៀបចំម្ហូបជូនអ្នក។",
  },
  {
    status: "Complete",
    title: "ការកម្មង់រួចរាល់",
    description: "ម្ហូបរបស់អ្នកបានរៀបចំរួចរាល់ហើយ។",
  },
] as const;

function getProductImage(product: Product) {
  return (
    product.images?.find((image) => image.isPrimary) ?? product.images?.[0]
  );
}

export default function CustomerPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTableId, setSelectedTableId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [tableModalOpen, setTableModalOpen] = useState(false);

  // Checkout form and order result
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  // Track an existing order without leaving the customer page.
  const [trackOpen, setTrackOpen] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingRefreshing, setTrackingRefreshing] = useState(false);
  const [trackingError, setTrackingError] = useState("");

  const fetchTrackedOrder = useCallback(async (number: string, silent = false) => {
    const value = number.trim();
    if (!value) {
      setTrackingError("សូមបញ្ចូល Order Number ជាមុនសិន។");
      return;
    }

    try {
      if (silent) setTrackingRefreshing(true);
      else {
        setTrackingLoading(true);
        setTrackingError("");
        setTrackedOrder(null);
      }

      const result = await orderService.getByNumber(value);
      setTrackedOrder(result);
      setTrackingNumber(value);
      setTrackingError("");
    } catch (err: unknown) {
      console.error("Failed to track order:", err);
      if (!silent) {
        setTrackingError(
          axios.isAxiosError(err) && err.response?.status === 404
            ? "រកមិនឃើញ Order Number នេះទេ។ សូមពិនិត្យម្ដងទៀត។"
            : "មិនអាចទាញយកព័ត៌មាន Order បានទេ។ សូមព្យាយាមម្ដងទៀត។"
        );
      }
    } finally {
      setTrackingLoading(false);
      setTrackingRefreshing(false);
    }
  }, []);

  // Refresh the tracked order status every 10 seconds while the dialog is open.
  useEffect(() => {
    if (!trackOpen || !trackedOrder?.orderNumber) return;
    const timer = window.setInterval(() => {
      void fetchTrackedOrder(trackedOrder.orderNumber, true);
    }, 10000);
    return () => window.clearInterval(timer);
  }, [trackOpen, trackedOrder?.orderNumber, fetchTrackedOrder]);

  // Keep the page behind the cart drawer from scrolling and support Escape to close.
  useEffect(() => {
    if (!cartOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCartOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [cartOpen]);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [productData, categoryData, tableData] = await Promise.all([
          productService.getAll(),
          categoryService.getAll(),
          tableService.getAll().catch(() => [] as Table[]),
        ]);

        if (!active) return;
        setProducts(productData.filter((product) => product.isAvailable));
        setCategories(categoryData.filter((category) => category.isActive));
        setTables(tableData.filter((table) => table.isActive));
      } catch (err) {
        console.error("Failed to load customer ordering data:", err);
        if (active) setError("មិនអាចទាញយកទិន្នន័យមុខម្ហូបបានទេ។ សូមព្យាយាមម្ដងទៀត។");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase();
    return products.filter((product) => {
      const matchCategory =
        selectedCategory === "All" || product.categoryId === selectedCategory;
      const matchSearch =
        !keyword ||
        product.name.toLocaleLowerCase().includes(keyword) ||
        (product.description ?? "").toLocaleLowerCase().includes(keyword) ||
        (product.categoryName ?? "").toLocaleLowerCase().includes(keyword);
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, search]);

  const promotionProducts = useMemo(() => {
    const beerCategoryIds = new Set(
      categories
        .filter((category) =>
          /beer|ស្រាបៀរ|បៀរ/i.test(category.name)
        )
        .map((category) => category.id)
    );

    return products
      .filter(
        (product) =>
          beerCategoryIds.has(product.categoryId) ||
          /angkor beer|beer|ស្រាបៀរ|បៀរ/i.test(
            `${product.name} ${product.categoryName}`
          )
      )
      .slice(0, 4);
  }, [products, categories]);

  const selectedTable = tables.find((table) => table.id === selectedTableId);

  const addToCart = (product: Product) => {
    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...current, { product, quantity: 1 }];
    });
  };

  const changeQuantity = (productId: string, amount: number) => {
    setCart((current) =>
      current
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity + amount }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((current) =>
      current.filter((item) => item.product.id !== productId)
    );
  };

  const openCheckout = () => {
    if (cart.length === 0) return;
    setCheckoutError("");
    setCreatedOrder(null);
    setCheckoutOpen(true);
  };

  const closeCheckout = () => {
    if (submittingOrder) return;
    setCheckoutOpen(false);
    setCheckoutError("");
    setCreatedOrder(null);
  };

  const handleCreateOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCheckoutError("");

    const trimmedName = customerName.trim();
    const trimmedPhone = customerPhone.trim();

    if (!trimmedName) {
      setCheckoutError("សូមបញ្ចូលឈ្មោះរបស់អ្នក។");
      return;
    }

    if (!trimmedPhone) {
      setCheckoutError("សូមបញ្ចូលលេខទូរស័ព្ទរបស់អ្នក។");
      return;
    }

    if (cart.length === 0) {
      setCheckoutError("កន្ត្រករបស់អ្នកមិនមានមុខម្ហូបទេ។");
      return;
    }

    const payload: CreateOrderDto = {
      tableId: selectedTable?.id ?? null,
      customerName: trimmedName,
      customerPhone: trimmedPhone,
      notes: orderNotes.trim() || null,
      items: cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
    };

    try {
      setSubmittingOrder(true);
      const order = await orderService.create(payload);
      setCreatedOrder(order);
      setCart([]);
      setCartOpen(false);
    } catch (err: unknown) {
      console.error("Failed to create order:", err);

      if (axios.isAxiosError(err)) {
        const message =
          err.response?.data?.message ||
          err.response?.data?.title ||
          "មិនអាចបញ្ជូនការកម្មង់បានទេ។ សូមព្យាយាមម្ដងទៀត។";
        setCheckoutError(String(message));
      } else {
        setCheckoutError("មានបញ្ហាកើតឡើង។ សូមព្យាយាមម្ដងទៀត។");
      }
    } finally {
      setSubmittingOrder(false);
    }
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  const scrollToMenu = () =>
    document.getElementById("food-menu")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ background: COLORS.background, color: COLORS.text }}
    >
      {/* HEADER */}
      <header
        className="sticky top-0 z-40 border-b border-white/10 text-white shadow-lg"
        style={{ background: COLORS.brown }}
      >
        <div className="mx-auto flex min-h-[74px] max-w-[1440px] flex-wrap items-center justify-between gap-3 px-3 py-3 sm:flex-nowrap sm:px-6 lg:px-8">
          <a href="#top" className="flex shrink-0 items-center gap-3" aria-label="TV JROK home">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-md sm:h-12 sm:w-12"
              style={{ background: COLORS.orange }}
            >
              <ChefHat size={27} strokeWidth={2.3} />
            </span>
            <span>
              <span className="brand block text-xl leading-none tracking-tight sm:text-2xl" style={{ color: "#FF9A45" }}>
                TV JROK
              </span>
              <span lang="en" className="mt-1 block text-[9px] font-semibold tracking-[0.16em] text-[#c9bdb1] sm:text-[10px]">
                FOOD · DRINKS · GOOD VIBES
              </span>
            </span>
          </a>

          <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-3">
            <div className="relative min-w-0 flex-1 sm:flex-none">
              <button
                type="button"
                onClick={() => setTableModalOpen(true)}
                className="flex w-full items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-left text-[#211A15] shadow-sm transition hover:bg-[#fff8f3] sm:min-w-[160px] sm:px-4"
                aria-haspopup="dialog"
                aria-expanded={tableModalOpen}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: COLORS.lightOrange, color: COLORS.orange }}>
                  <Table2 size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-[#9a8d82]">លេខតុ / TABLE</span>
                  <span className="block truncate text-xs font-extrabold sm:text-sm">
                    {selectedTable ? `Table ${selectedTable.tableNumber}` : "ជ្រើសរើសតុ"}
                  </span>
                </span>
                <span className="ml-1 text-xs">⌄</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-3 text-sm font-extrabold text-white shadow-md transition hover:brightness-95 sm:px-5"
              style={{ background: COLORS.orange }}
            >
              <ShoppingCart size={19} />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-black" style={{ color: COLORS.darkOrange }}>
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-74px)]">
        {/* Customer navigation sidebar: stays below the main header. */}
        <aside className="sticky top-[74px] flex h-[calc(100vh-74px)] w-[62px] shrink-0 flex-col items-center gap-3 border-r border-[#EAE4DC] bg-white px-2 py-4 sm:w-[76px] sm:gap-4 sm:py-5">
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} title="Home" aria-label="Home" className="flex h-10 w-10 items-center justify-center rounded-xl text-[#665D55] transition hover:bg-[#FFF2EB] hover:text-[#F4511E]">
            <Home size={21} />
          </button>
          <button type="button" onClick={scrollToMenu} title="Menu" aria-label="Menu" className="flex h-10 w-10 items-center justify-center rounded-xl text-[#665D55] transition hover:bg-[#FFF2EB] hover:text-[#F4511E]">
            <UtensilsCrossed size={21} />
          </button>
          <button type="button" onClick={() => { setTrackingError(""); setTrackedOrder(null); setTrackOpen(true); }} title="Track Order" aria-label="Track Order" className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF2EB] text-[#F4511E] shadow-sm ring-1 ring-[#F4511E]/15 transition hover:bg-[#F4511E] hover:text-white">
            <ClipboardList size={21} />
          </button>
          <button type="button" onClick={() => setCartOpen(true)} title="Cart" aria-label="Cart" className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[#665D55] transition hover:bg-[#FFF2EB] hover:text-[#F4511E]">
            <ShoppingCart size={21} />
            {cartCount > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#F4511E] px-1 text-[9px] font-black text-white">{cartCount}</span>}
          </button>
        </aside>

      <main id="top" className="mx-auto w-full min-w-0 max-w-[1440px] flex-1 px-3 pb-12 pt-5 sm:px-6 sm:pt-7 lg:px-8">
        {/* HERO */}
        <section className="relative isolate min-h-[300px] overflow-hidden rounded-[26px] text-white shadow-sm sm:min-h-[320px] lg:min-h-[340px]">
          <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 78% 35%, rgba(133,59,25,.58), transparent 34%), linear-gradient(110deg, #1C1713 0%, #2b180f 48%, #572a15 100%)" }} />
          <div className="pointer-events-none absolute -right-8 -top-36 h-[430px] w-[430px] rounded-full border-[34px] border-[#a85a2d]/10 sm:right-12" />
          <div className="pointer-events-none absolute right-[8%] top-[-90px] h-[310px] w-[310px] rounded-full border border-[#d27b42]/15" />
          <div className="relative z-10 flex min-h-[300px] items-center px-6 py-10 sm:min-h-[320px] sm:px-10 lg:min-h-[340px] lg:px-14">
            <div className="max-w-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: "#FF8A43" }}>WELCOME TO TV JROK</p>
              <h1 lang="km" className="!mt-4 text-2xl font-bold leading-[1.7] tracking-normal !text-white sm:text-4xl sm:leading-[1.5] lg:text-5xl">
                បរិយាកាស កក់ក្ដៅ
                <br className="hidden sm:block" /> រសជាតិពិសេស
              </h1>
              <p lang="en" className="mt-3 text-sm font-medium leading-relaxed text-[#e9d8c9] sm:text-base">
                Good Food. Cold Drinks. Great Moments.
              </p>
              <button
                type="button"
                onClick={scrollToMenu}
                className="mt-6 inline-flex items-center gap-3 rounded-xl px-5 py-3.5 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:brightness-105"
                style={{ background: COLORS.orange }}
              >
                ចាប់ផ្ដើមកម្មង់ <ArrowRight size={18} />
              </button>
            </div>

            <div className="absolute right-[7%] top-1/2 hidden h-40 w-40 -translate-y-1/2 rotate-6 items-center justify-center rounded-full border border-[#d18a53]/60 bg-[#21150f]/70 text-center shadow-2xl md:flex lg:right-[10%] lg:h-44 lg:w-44">
              <div>
                <UtensilsCrossed className="mx-auto mb-3" size={34} style={{ color: "#F59A4A" }} />
                <p className="text-xl font-black tracking-tight" style={{ color: "#F59A4A" }}>TV JROK</p>
                <p className="mt-2 text-[9px] font-bold tracking-[0.24em] text-[#e6c9ad]">CHILL AREA</p>
              </div>
            </div>
          </div>
        </section>

        {/* PROMOTION */}
        {promotionProducts.length > 0 && (
          <section className="relative mt-7 overflow-hidden rounded-[24px] px-5 py-6 text-white shadow-[0_14px_35px_rgba(95,48,20,0.12)] sm:mt-9 sm:px-7 sm:py-8 lg:px-8">
            <div className="absolute inset-0" style={{ background: "linear-gradient(110deg, #8e3518 0%, #c6531d 55%, #e47c2c 100%)" }} />
            <div className="pointer-events-none absolute -right-16 -top-40 h-80 w-80 rounded-full border-[28px] border-white/[0.06]" />
            <div className="pointer-events-none absolute bottom-[-170px] right-[12%] h-64 w-64 rounded-full border border-white/10" />
            <div className="relative z-10">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#ffd4b5]">SPECIAL DEALS · TV JROK</p>
                  <h2 className="mt-2 text-xl font-black sm:text-2xl">លក់ពិសេស Angkor Beer 🎉</h2>
                  <p className="mt-1.5 text-xs text-[#ffe0c8]">ជ្រើសរើសភេសជ្ជៈដែលអ្នកចូលចិត្ត</p>
                </div>
                <span className="rounded-full border border-white/40 px-4 py-2 text-[9px] font-black tracking-widest text-white">PROMOTION</span>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {promotionProducts.map((product, index) => {
                  const image = getProductImage(product);
                  return (
                    <article key={product.id} className="relative flex min-w-0 items-center gap-3 overflow-hidden rounded-2xl border border-white/70 bg-[#fffaf3] p-3 text-[#211A15] shadow-sm">
                      <div className="flex h-[68px] w-[58px] shrink-0 items-center justify-center overflow-hidden rounded-xl" style={{ background: "#F7D69B" }}>
                        {image ? (
                          <img src={image.imageUrl} alt={product.name} loading="lazy" className="h-full w-full object-cover" />
                        ) : (
                          <GlassWater size={27} style={{ color: "#9b632c" }} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 text-xs font-bold leading-relaxed">{product.name}</h3>
                        <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-[#93877b]">{product.categoryName || "TV JROK Special"}</p>
                        <p className="mt-1.5 text-base font-black" style={{ color: COLORS.darkOrange }}>{formatPrice(product.price)}</p>
                        <button type="button" onClick={() => addToCart(product)} className="mt-1 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-extrabold text-white transition hover:brightness-95" style={{ background: "#BD4A20" }}>
                          <Plus size={12} /> បន្ថែម
                        </button>
                      </div>
                      {index === 3 && <span className="absolute -right-7 top-3 rotate-45 bg-red-700 px-8 py-1 text-[7px] font-black text-white">SPECIAL</span>}
                    </article>
                  );
                })}
              </div>

              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    const beerCategory = categories.find((category) => /beer|ស្រាបៀរ|បៀរ/i.test(category.name));
                    if (beerCategory) setSelectedCategory(beerCategory.id);
                    scrollToMenu();
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-white/50 px-5 py-2 text-xs font-bold text-white transition hover:bg-white/10"
                >
                  មើល Promotion ទាំងអស់ <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* MENU */}
        <section id="food-menu" className="mt-8 scroll-mt-28 sm:mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: COLORS.orange }}>FRESH PICKS FOR YOUR TABLE</p>
              <div className="mt-2 flex flex-wrap items-baseline gap-3">
                <h2 className="text-xl font-bold leading-relaxed sm:text-3xl">មុខម្ហូបរបស់យើង</h2>
                <span className="text-xs font-medium" style={{ color: COLORS.muted }}>Our Menu</span>
              </div>
            </div>
            <span className="rounded-xl px-3 py-2 text-xs font-bold" style={{ background: COLORS.lightOrange, color: "#9C5737" }}>{filteredProducts.length} មុខ</span>
          </div>

          {/* SEARCH */}
          <label className="mt-5 flex items-center gap-3 rounded-2xl border bg-white px-4 py-3.5 shadow-[0_2px_8px_rgba(35,25,15,0.04)] focus-within:border-[#F4511E]" style={{ borderColor: COLORS.border }}>
            <Search size={20} className="shrink-0" style={{ color: COLORS.orange }} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ស្វែងរកមុខម្ហូប... / Search food"
              aria-label="ស្វែងរកមុខម្ហូប"
              className="w-full bg-transparent text-sm outline-none placeholder:text-[#aaa198]"
            />
            {search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="rounded-full p-1 text-[#81786F] hover:bg-[#f5eee8]"><X size={16} /></button>}
          </label>

          {/* CATEGORY FILTER */}
          <div className="mt-4 flex gap-2.5 overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setSelectedCategory("All")}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-extrabold transition ${selectedCategory === "All" ? "border-transparent text-white shadow-md" : "bg-white hover:border-[#F4511E]"}`}
              style={selectedCategory === "All" ? { background: COLORS.orange } : { borderColor: COLORS.border, color: COLORS.text }}
            >
              <Grid2X2 size={16} /> មុខម្ហូបទាំងអស់
            </button>
            {categories.map((category, index) => {
              const active = selectedCategory === category.id;
              const Icon = index % 4 === 0 ? Soup : index % 4 === 1 ? Drumstick : index % 4 === 2 ? GlassWater : UtensilsCrossed;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-bold transition ${active ? "border-transparent text-white shadow-md" : "bg-white hover:border-[#F4511E]"}`}
                  style={active ? { background: COLORS.orange } : { borderColor: COLORS.border, color: COLORS.text }}
                >
                  <Icon size={16} style={{ color: active ? "white" : COLORS.darkOrange }} />
                  {category.name}
                </button>
              );
            })}
          </div>

          {/* PRODUCT GRID */}
          {loading ? (
            <div className="grid grid-cols-2 gap-3 pt-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: COLORS.border }}>
                  <div className="aspect-[4/3] animate-pulse bg-[#eee9e2]" />
                  <div className="space-y-2 p-3"><div className="h-3 w-3/4 animate-pulse rounded bg-[#eee9e2]" /><div className="h-3 w-1/2 animate-pulse rounded bg-[#eee9e2]" /></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-8 text-center text-sm" style={{ color: COLORS.error }}>
              {error}
              <button type="button" onClick={() => window.location.reload()} className="mx-auto mt-3 block rounded-lg bg-white px-4 py-2 text-xs font-bold shadow-sm">សាកល្បងម្ដងទៀត</button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="mt-5 rounded-2xl border bg-white px-5 py-16 text-center" style={{ borderColor: COLORS.border }}>
              <UtensilsCrossed size={36} className="mx-auto" style={{ color: "#c9bfb5" }} />
              <p className="mt-3 font-bold">មិនមានមុខម្ហូប</p>
              <p className="mt-1 text-xs" style={{ color: COLORS.muted }}>សូមសាកល្បងស្វែងរក ឬជ្រើសរើសប្រភេទផ្សេងទៀត។</p>
              <button type="button" onClick={() => { setSearch(""); setSelectedCategory("All"); }} className="mt-4 rounded-lg px-4 py-2 text-xs font-bold text-white" style={{ background: COLORS.orange }}>បង្ហាញទាំងអស់</button>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:gap-5">
              {filteredProducts.map((product) => {
                const image = getProductImage(product);
                return (
                  <article key={product.id} className="group overflow-hidden rounded-2xl border bg-white shadow-[0_2px_8px_rgba(35,25,15,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-lg" style={{ borderColor: COLORS.border }}>
                    <div className="relative aspect-[4/3] overflow-hidden bg-[#eee9e2]">
                      {image ? (
                        <img src={image.imageUrl} alt={product.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center"><UtensilsCrossed size={36} style={{ color: "#c6b9aa" }} /></div>
                      )}
                      {product.isFeatured && <span className="absolute left-2 top-2 rounded-full px-3 py-1 text-[9px] font-black text-white shadow" style={{ background: COLORS.orange }}>FEATURED</span>}
                    </div>
                    <div className="p-3 sm:p-3.5">
                      <h3 className="line-clamp-2 text-xs font-bold leading-relaxed sm:text-sm" style={{ color: COLORS.text }}>{product.name}</h3>
                      {product.description && <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed sm:text-xs" style={{ color: COLORS.muted }}>{product.description}</p>}
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="text-sm font-extrabold sm:text-base" style={{ color: COLORS.darkOrange }}>{formatPrice(product.price)}</span>
                        <button
                          type="button"
                          onClick={() => addToCart(product)}
                          aria-label={`Add ${product.name} to cart`}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition hover:scale-105 hover:brightness-95 active:scale-95 sm:h-9 sm:w-9"
                          style={{ background: COLORS.orange }}
                        ><Plus size={19} /></button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* FOOTER */}
        <footer className="mt-12 rounded-2xl px-6 py-8 text-center text-white" style={{ background: COLORS.brown }}>
          <div className="flex items-center justify-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: COLORS.orange }}><ChefHat size={20} /></span>
            <span className="brand text-xl tracking-wide" style={{ color: "#FF9A45" }}>TV JROK</span>
          </div>
          <p className="mt-2 text-[10px] font-semibold tracking-[0.18em] text-[#b9aaa0]">FOOD · DRINKS · GOOD VIBES</p>
          <p className="mt-4 text-[10px] text-[#8f8178]">© {new Date().getFullYear()} TV JROK. All rights reserved.</p>
        </footer>
      </main>
      </div>

      {/* TRACK ORDER MODAL */}
      {trackOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#1C1713]/60 p-3 backdrop-blur-sm sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) setTrackOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="track-order-title" className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-[26px] bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b px-5 py-5 sm:px-7" style={{ borderColor: COLORS.border }}>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: COLORS.orange }}>TV JROK · ORDER TRACKING</p>
                <h2 id="track-order-title" className="mt-1 text-xl font-black sm:text-2xl">តាមដានការកម្មង់</h2>
                <p className="mt-1 text-xs" style={{ color: COLORS.muted }}>បញ្ចូល Order Number ដើម្បីពិនិត្យស្ថានភាព។</p>
              </div>
              <button type="button" onClick={() => setTrackOpen(false)} aria-label="Close tracking" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F7F5F1] hover:bg-[#F0E8E0]"><X size={20} /></button>
            </header>

            <form onSubmit={(event) => { event.preventDefault(); void fetchTrackedOrder(trackingNumber); }} className="flex gap-2 px-5 pt-5 sm:px-7">
              <input value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} placeholder="បញ្ចូល Order Number..." className="min-w-0 flex-1 rounded-xl border px-3 py-3 text-sm outline-none focus:border-[#F4511E]" style={{ borderColor: COLORS.border }} />
              <button type="submit" disabled={trackingLoading || !trackingNumber.trim()} className="rounded-xl px-4 py-3 text-sm font-bold text-white disabled:opacity-50" style={{ background: COLORS.orange }}>{trackingLoading ? "កំពុងស្វែងរក..." : "ស្វែងរក"}</button>
            </form>

            {trackingError && <p role="alert" className="mx-5 mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 sm:mx-7">{trackingError}</p>}

            {trackedOrder ? (
              <div className="space-y-4 px-5 py-5 sm:px-7">
                <div className="rounded-2xl p-4" style={{ background: COLORS.lightOrange }}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-[#81786F]">ORDER NUMBER</p>
                      <p className="mt-1 break-all text-lg font-black" style={{ color: COLORS.darkOrange }}>{trackedOrder.orderNumber}</p>
                    </div>
                    <button type="button" onClick={() => void fetchTrackedOrder(trackedOrder.orderNumber, true)} disabled={trackingRefreshing} className="flex shrink-0 items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-bold disabled:opacity-50">
                      <RefreshCw size={14} className={trackingRefreshing ? "animate-spin" : ""} /> Refresh
                    </button>
                  </div>
                  <div className="mt-4 flex items-center gap-3 border-t border-[#E9D7C9] pt-3">
                    <Package size={22} style={{ color: COLORS.orange }} />
                    <div>
                      <p className="text-[10px] text-[#81786F]">ស្ថានភាពបច្ចុប្បន្ន</p>
                      <p className="text-base font-black" style={{ color: COLORS.darkOrange }}>{trackedOrder.status}</p>
                    </div>
                  </div>
                </div>
                {trackedOrder.status === "Cancel" ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                    <div className="flex items-center gap-3">
                      <X size={22} className="shrink-0 text-red-600" />
                      <div>
                        <p className="font-black text-red-700">ការកម្មង់ត្រូវបានបោះបង់</p>
                        <p className="mt-1 text-xs leading-5 text-red-600">
                          Order នេះត្រូវបាន Cancel ដោយភោជនីយដ្ឋាន។ សូមទាក់ទងបុគ្គលិក ប្រសិនបើអ្នកត្រូវការព័ត៌មានបន្ថែម។
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border p-4 sm:p-5" style={{ borderColor: COLORS.border }}>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-black" style={{ color: COLORS.text }}>ដំណើរការការកម្មង់</p>
                        <p className="mt-1 text-[10px]" style={{ color: COLORS.muted }}>ORDER PROGRESS</p>
                      </div>
                      <span className="rounded-full px-3 py-1 text-[10px] font-bold" style={{ background: COLORS.lightOrange, color: COLORS.darkOrange }}>
                        {trackedOrder.status === "Complete" ? "រួចរាល់ 100%" : `ជំហាន ${Math.max(0, TRACKING_STEPS.findIndex((step) => step.status === trackedOrder.status)) + 1} នៃ 4`}
                      </span>
                    </div>

                    <div className="space-y-0">
                      {TRACKING_STEPS.map((step, index) => {
                        const currentIndex = TRACKING_STEPS.findIndex(
                          (item) => item.status === trackedOrder.status
                        );
                        const isCompleted = index < currentIndex || trackedOrder.status === "Complete";
                        const isCurrent = index === currentIndex && trackedOrder.status !== "Complete";
                        const isFuture = !isCompleted && !isCurrent;

                        return (
                          <div key={step.status} className="relative flex gap-3">
                            <div className="flex w-7 shrink-0 flex-col items-center">
                              <span
                                className="z-10 flex h-7 w-7 items-center justify-center rounded-full"
                                style={{
                                  background: isCompleted ? COLORS.success : isCurrent ? COLORS.orange : "#EEEAE5",
                                  color: isCompleted || isCurrent ? "#FFFFFF" : "#A79D93",
                                }}
                              >
                                {isCompleted ? <Check size={15} strokeWidth={3} /> : <span className="text-xs font-black">{index + 1}</span>}
                              </span>
                              {index < TRACKING_STEPS.length - 1 && (
                                <span
                                  className="min-h-10 w-0.5 flex-1"
                                  style={{ background: isCompleted ? COLORS.success : "#EAE4DC" }}
                                />
                              )}
                            </div>

                            <div className={`min-w-0 flex-1 ${index < TRACKING_STEPS.length - 1 ? "pb-5" : "pb-1"}`}>
                              <div className="flex flex-wrap items-center gap-2">
                                <p
                                  className="text-sm font-extrabold"
                                  style={{ color: isFuture ? "#A79D93" : COLORS.text }}
                                >
                                  {step.title}
                                </p>
                                {isCurrent && (
                                  <span className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: COLORS.lightOrange, color: COLORS.darkOrange }}>
                                    កំពុងដំណើរការ
                                  </span>
                                )}
                                {isCompleted && (
                                  <span className="text-[9px] font-bold" style={{ color: COLORS.success }}>រួចរាល់ ✓</span>
                                )}
                              </div>
                              <p className="mt-1 text-[11px] leading-5" style={{ color: isFuture ? "#B5ADA5" : COLORS.muted }}>
                                {step.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {trackedOrder.status === "Complete" && (
                      <div className="mt-3 rounded-xl p-3" style={{ background: "#EAF7EF" }}>
                        <p className="text-sm font-extrabold" style={{ color: COLORS.success }}>
                          <Check size={16} className="mr-1 inline" /> ការកម្មង់របស់អ្នករួចរាល់ហើយ!
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="rounded-xl border p-4" style={{ borderColor: COLORS.border }}>
                  <div className="flex justify-between gap-3 text-sm"><span style={{ color: COLORS.muted }}>អតិថិជន</span><strong>{trackedOrder.customerName}</strong></div>
                  <div className="mt-3 flex justify-between gap-3 text-sm"><span style={{ color: COLORS.muted }}>លេខទូរស័ព្ទ</span><strong>{trackedOrder.customerPhone}</strong></div>
                  <div className="mt-3 flex justify-between gap-3 text-sm"><span style={{ color: COLORS.muted }}>តម្លៃសរុប</span><strong style={{ color: COLORS.darkOrange }}>{formatPrice(trackedOrder.totalAmount)}</strong></div>
                </div>
                <p className="flex items-center justify-center gap-2 text-center text-[10px]" style={{ color: COLORS.muted }}><RefreshCw size={12} /> Status នឹង Refresh រៀងរាល់ 10 វិនាទី ខណៈ Popup បើក។</p>
              </div>
            ) : !trackingError && !trackingLoading ? (
              <div className="px-5 py-8 text-center sm:px-7"><Package size={32} className="mx-auto" style={{ color: "#C9BFB5" }} /><p className="mt-3 text-sm font-bold">សូមបញ្ចូល Order Number</p></div>
            ) : null}
          </section>
        </div>
      )}

      {/* TABLE SELECTION MODAL */}
      {tableModalOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setTableModalOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="table-modal-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[26px] bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between border-b px-5 py-5 sm:px-7" style={{ borderColor: COLORS.border }}>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: COLORS.orange }}>
                  TV JROK · TABLE SERVICE
                </p>
                <h2 id="table-modal-title" className="mt-1 text-xl font-black sm:text-2xl" style={{ color: COLORS.text }}>
                  ជ្រើសរើសលេខតុ
                </h2>
                <p className="mt-1 text-xs sm:text-sm" style={{ color: COLORS.muted }}>
                  សូមជ្រើសរើសតុដែលអ្នកកំពុងអង្គុយ
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTableModalOpen(false)}
                aria-label="Close table selection"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition hover:bg-[#FFF2EB]"
                style={{ color: COLORS.muted }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-5 pt-5 sm:px-7">
              <div className="flex items-center justify-between gap-3 rounded-2xl p-4" style={{ background: COLORS.lightOrange }}>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.muted }}>
                    តុដែលបានជ្រើសរើស
                  </p>
                  <p className="mt-1 text-lg font-black" style={{ color: COLORS.darkOrange }}>
                    {selectedTable ? `Table ${selectedTable.tableNumber}` : "មិនទាន់ជ្រើសរើស"}
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white" style={{ color: COLORS.orange }}>
                  <Table2 size={23} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2.5 p-5 sm:grid-cols-5 sm:gap-3 sm:px-7 sm:py-6">
              {tables
                .slice()
                .sort((a, b) => Number(a.tableNumber) - Number(b.tableNumber))
                .map((table) => {
                  const isSelected = selectedTableId === table.id;
                  return (
                    <button
                      key={table.id}
                      type="button"
                      onClick={() => {
                        setSelectedTableId(table.id);
                        setTableModalOpen(false);
                      }}
                      aria-pressed={isSelected}
                      className={`relative flex aspect-square min-h-[64px] flex-col items-center justify-center rounded-2xl border-2 transition duration-200 active:scale-95 ${
                        isSelected
                          ? "border-[#F4511E] bg-[#F4511E] text-white shadow-lg shadow-orange-200"
                          : "border-[#EAE4DC] bg-white text-[#211A15] hover:border-[#F4511E] hover:bg-[#FFF2EB]"
                      }`}
                    >
                      <span className={`text-[9px] font-bold tracking-wider ${isSelected ? "text-white/75" : "text-[#9A8D82]"}`}>
                        TABLE
                      </span>
                      <span className="mt-0.5 text-xl font-black sm:text-2xl">
                        {table.tableNumber}
                      </span>
                      {isSelected && (
                        <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white" style={{ color: COLORS.orange }}>
                          <Check size={11} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>

            {tables.length === 0 && (
              <div className="px-6 pb-5 text-center">
                <p className="rounded-xl bg-[#F7F5F1] px-4 py-6 text-sm" style={{ color: COLORS.muted }}>
                  មិនមានតុដែលអាចជ្រើសរើសបានទេ
                </p>
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 border-t p-5 sm:flex-row sm:justify-between sm:px-7" style={{ borderColor: COLORS.border }}>
              <button
                type="button"
                onClick={() => {
                  setSelectedTableId("");
                  setTableModalOpen(false);
                }}
                className="rounded-xl border px-4 py-3 text-sm font-bold transition hover:bg-[#F7F5F1]"
                style={{ borderColor: COLORS.border, color: COLORS.muted }}
              >
                មិនទាន់ជ្រើសរើសតុ
              </button>
              <button
                type="button"
                onClick={() => setTableModalOpen(false)}
                className="rounded-xl px-5 py-3 text-sm font-extrabold text-white transition hover:brightness-95"
                style={{ background: COLORS.orange }}
              >
                រួចរាល់
              </button>
            </div>
          </section>
        </div>
      )}

      {/* CART DRAWER */}
      {cartOpen && (
        <div className="fixed inset-0 z-[80] flex justify-end">
          <button
            type="button"
            aria-label="Close cart overlay"
            onClick={() => setCartOpen(false)}
            className="absolute inset-0 bg-[#1C1713]/55 backdrop-blur-sm"
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-label="កន្ត្រកទំនិញ"
            className="relative flex h-[100dvh] w-full max-w-full flex-col bg-white shadow-2xl sm:w-[min(100vw,580px)] sm:max-w-[580px]"
          >
            {/* Drawer header */}
            <header className="flex shrink-0 items-center justify-between border-b px-5 py-4 sm:px-6 sm:py-4" style={{ borderColor: COLORS.border }}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: COLORS.lightOrange, color: COLORS.orange }}>
                    <ShoppingCart size={19} />
                  </span>
                  <div>
                    <h2 className="text-lg font-black sm:text-xl" style={{ color: COLORS.text }}>កន្ត្រកទំនិញ</h2>
                    <p className="mt-0.5 text-xs" style={{ color: COLORS.muted }}>{cartCount} មុខក្នុងកន្ត្រក</p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                aria-label="Close cart"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F7F5F1] transition hover:bg-[#F0E8E0]"
                style={{ color: COLORS.text }}
              >
                <X size={20} />
              </button>
            </header>

            {/* Cart contents */}
            {cart.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full" style={{ background: COLORS.lightOrange, color: COLORS.orange }}>
                  <ShoppingCart size={34} />
                </div>
                <h3 className="mt-5 text-lg font-black" style={{ color: COLORS.text }}>កន្ត្រករបស់អ្នកទទេ</h3>
                <p className="mt-2 max-w-xs text-sm leading-6" style={{ color: COLORS.muted }}>
                  សូមជ្រើសរើសមុខម្ហូបដែលអ្នកចូលចិត្ត ដើម្បីបន្ថែមទៅក្នុងកន្ត្រក។
                </p>
                <button
                  type="button"
                  onClick={() => setCartOpen(false)}
                  className="mt-6 rounded-xl px-6 py-3 text-sm font-bold text-white transition hover:brightness-95"
                  style={{ background: COLORS.orange }}
                >
                  មើលមុខម្ហូប
                </button>
              </div>
            ) : (
              <>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6 sm:py-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.muted }}>Your order</p>
                    <p className="text-xs" style={{ color: COLORS.muted }}>{cartCount} items</p>
                  </div>

                  <div className="space-y-3">
                    {cart.map((item) => {
                      const image = getProductImage(item.product);
                      return (
                        <article
                          key={item.product.id}
                          className="flex gap-3 border-b pb-3 sm:gap-3"
                          style={{ borderColor: COLORS.border }}
                        >
                          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#F1ECE5] sm:h-24 sm:w-24">
                            {image ? (
                              <img src={image.imageUrl} alt={item.product.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center" style={{ color: COLORS.muted }}>
                                <ChefHat size={26} />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1 py-0.5">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="line-clamp-2 text-sm font-extrabold leading-5 sm:text-base" style={{ color: COLORS.text }}>
                                {item.product.name}
                              </h3>
                              <button
                                type="button"
                                onClick={() => removeFromCart(item.product.id)}
                                aria-label={`Remove ${item.product.name}`}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition hover:bg-red-50 hover:text-red-600"
                                style={{ color: COLORS.muted }}
                              >
                                <Trash2 size={17} />
                              </button>
                            </div>

                            <p className="mt-1 text-sm font-black" style={{ color: COLORS.darkOrange }}>
                              {formatPrice(item.product.price)}
                            </p>

                            <div className="mt-2.5 flex items-center gap-2.5">
                              <button
                                type="button"
                                onClick={() => changeQuantity(item.product.id, -1)}
                                aria-label="Decrease quantity"
                                className="flex h-9 w-9 items-center justify-center rounded-xl border transition hover:border-[#F4511E] hover:bg-[#FFF2EB]"
                                style={{ borderColor: COLORS.border, color: COLORS.text }}
                              >
                                <Minus size={15} />
                              </button>
                              <span className="min-w-5 text-center text-sm font-extrabold" style={{ color: COLORS.text }}>
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => changeQuantity(item.product.id, 1)}
                                aria-label="Increase quantity"
                                className="flex h-9 w-9 items-center justify-center rounded-xl border transition hover:border-[#F4511E] hover:bg-[#FFF2EB]"
                                style={{ borderColor: COLORS.border, color: COLORS.text }}
                              >
                                <Plus size={15} />
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>

                {/* Fixed order summary */}
                <footer className="shrink-0 border-t bg-white px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pt-4" style={{ borderColor: COLORS.border }}>
                  <div className="mb-3 flex items-center justify-between rounded-xl bg-[#F7F5F1] px-4 py-2.5">
                    <div>
                      <p className="text-[11px] font-medium" style={{ color: COLORS.muted }}>តុដែលបានជ្រើសរើស</p>
                      <p className="mt-0.5 text-sm font-extrabold" style={{ color: COLORS.text }}>
                        {selectedTable ? `Table ${selectedTable.tableNumber}` : "មិនទាន់ជ្រើសរើស"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCartOpen(false);
                        setTableModalOpen(true);
                      }}
                      className="text-xs font-bold underline underline-offset-4"
                      style={{ color: COLORS.orange }}
                    >
                      ប្តូរតុ
                    </button>
                  </div>

                  <div className="flex items-end justify-between gap-3">
                    <span className="text-sm font-bold" style={{ color: COLORS.muted }}>សរុបតម្លៃ</span>
                    <span className="text-2xl font-black tracking-tight" style={{ color: COLORS.darkOrange }}>
                      {formatPrice(cartTotal)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={openCheckout}
                    disabled={cart.length === 0}
                    className="mt-3 w-full rounded-xl py-3.5 text-sm font-extrabold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ background: COLORS.orange }}
                  >
                    បញ្ជាក់ការកម្មង់ <ArrowRight size={16} className="ml-1 inline" />
                  </button>
                  <p className="mt-2 text-center text-[10px]" style={{ color: COLORS.muted }}>
                    ព័ត៌មានរបស់អ្នកនឹងត្រូវផ្ញើទៅ TV JROK ដើម្បីរៀបចំការកម្មង់។
                  </p>
                </footer>
              </>
            )}
          </aside>
        </div>
      )}

      {/* CHECKOUT / ORDER SUCCESS MODAL */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1C1713]/60 p-3 backdrop-blur-sm sm:p-5">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-title"
            className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-[26px] bg-white shadow-2xl"
          >
            {createdOrder ? (
              <div className="px-6 py-8 text-center sm:px-9 sm:py-10">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full" style={{ background: "#EAF7EF", color: COLORS.success }}>
                  <ClipboardCheck size={38} />
                </div>
                <p className="mt-5 text-xs font-black uppercase tracking-[0.2em]" style={{ color: COLORS.success }}>
                  ORDER PLACED
                </p>
                <h2 id="checkout-title" className="mt-2 text-2xl font-black" style={{ color: COLORS.text }}>
                  កម្មង់បានជោគជ័យ!
                </h2>
                <p className="mt-2 text-sm" style={{ color: COLORS.muted }}>
                  សូមអរគុណដែលបានកម្មង់ជាមួយ TV JROK។
                </p>

                <div className="mt-6 rounded-2xl p-5 text-left" style={{ background: COLORS.background }}>
                  <p className="text-xs font-semibold" style={{ color: COLORS.muted }}>ORDER NUMBER</p>
                  <p className="mt-1 break-all text-xl font-black" style={{ color: COLORS.darkOrange }}>
                    {createdOrder.orderNumber}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t pt-3" style={{ borderColor: COLORS.border }}>
                    <span className="text-sm" style={{ color: COLORS.muted }}>ស្ថានភាព</span>
                    <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: "#FFF2DB", color: COLORS.warning }}>
                      {createdOrder.status}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm" style={{ color: COLORS.muted }}>តម្លៃសរុប</span>
                    <span className="text-lg font-black" style={{ color: COLORS.darkOrange }}>
                      {formatPrice(createdOrder.totalAmount)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCheckoutOpen(false);
                    setTrackingNumber(createdOrder.orderNumber);
                    setTrackingError("");
                    setTrackedOrder(null);
                    setTrackOpen(true);
                    void fetchTrackedOrder(createdOrder.orderNumber);
                  }}
                  className="mt-6 w-full rounded-xl py-3.5 text-sm font-extrabold text-white transition hover:brightness-95"
                  style={{ background: COLORS.orange }}
                >
                  <ClipboardCheck size={17} className="mr-2 inline" />
                  តាមដានការកម្មង់
                  <ArrowRight size={16} className="ml-1 inline" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCheckoutOpen(false);
                    setCreatedOrder(null);
                    setCustomerName("");
                    setCustomerPhone("");
                    setOrderNotes("");
                  }}
                  className="mt-2 w-full rounded-xl border py-3 text-sm font-bold transition hover:bg-[#F7F5F1]"
                  style={{ borderColor: COLORS.border, color: COLORS.muted }}
                >
                  រួចរាល់
                </button>
              </div>
            ) : (
              <>
                <header className="flex items-center justify-between border-b px-5 py-5 sm:px-7" style={{ borderColor: COLORS.border }}>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: COLORS.orange }}>
                      TV JROK · CHECKOUT
                    </p>
                    <h2 id="checkout-title" className="mt-1 text-xl font-black sm:text-2xl" style={{ color: COLORS.text }}>
                      បញ្ជាក់ការកម្មង់
                    </h2>
                    <p className="mt-1 text-xs" style={{ color: COLORS.muted }}>
                      សូមបំពេញព័ត៌មានមុនពេលបញ្ជូន Order
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeCheckout}
                    disabled={submittingOrder}
                    aria-label="Close checkout"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F7F5F1] transition hover:bg-[#F0E8E0] disabled:opacity-50"
                    style={{ color: COLORS.text }}
                  >
                    <X size={20} />
                  </button>
                </header>

                <form onSubmit={handleCreateOrder} className="space-y-4 px-5 py-5 sm:px-7 sm:py-6">
                  <div className="rounded-2xl p-4" style={{ background: COLORS.background }}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px]" style={{ color: COLORS.muted }}>តុដែលបានជ្រើសរើស</p>
                        <p className="mt-1 text-sm font-extrabold" style={{ color: COLORS.text }}>
                          {selectedTable ? `Table ${selectedTable.tableNumber}` : "មិនទាន់ជ្រើសរើសតុ"}
                        </p>
                      </div>
                      <Table2 size={22} style={{ color: COLORS.orange }} />
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t pt-3" style={{ borderColor: COLORS.border }}>
                      <span className="text-xs" style={{ color: COLORS.muted }}>{cartCount} items</span>
                      <span className="text-lg font-black" style={{ color: COLORS.darkOrange }}>{formatPrice(cartTotal)}</span>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="checkout-customer-name" className="mb-1.5 block text-sm font-bold" style={{ color: COLORS.text }}>
                      ឈ្មោះអតិថិជន <span style={{ color: COLORS.error }}>*</span>
                    </label>
                    <div className="flex items-center gap-3 rounded-xl border px-3.5 py-3 focus-within:border-[#F4511E]" style={{ borderColor: COLORS.border }}>
                      <UserRound size={18} style={{ color: COLORS.muted }} />
                      <input
                        id="checkout-customer-name"
                        value={customerName}
                        onChange={(event) => setCustomerName(event.target.value)}
                        placeholder="បញ្ចូលឈ្មោះរបស់អ្នក"
                        autoComplete="name"
                        maxLength={120}
                        required
                        disabled={submittingOrder}
                        className="w-full bg-transparent text-sm outline-none placeholder:text-[#aaa198]"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="checkout-customer-phone" className="mb-1.5 block text-sm font-bold" style={{ color: COLORS.text }}>
                      លេខទូរស័ព្ទ <span style={{ color: COLORS.error }}>*</span>
                    </label>
                    <div className="flex items-center gap-3 rounded-xl border px-3.5 py-3 focus-within:border-[#F4511E]" style={{ borderColor: COLORS.border }}>
                      <Phone size={18} style={{ color: COLORS.muted }} />
                      <input
                        id="checkout-customer-phone"
                        type="tel"
                        value={customerPhone}
                        onChange={(event) => setCustomerPhone(event.target.value)}
                        placeholder="ឧ. 012 345 678"
                        autoComplete="tel"
                        maxLength={30}
                        required
                        disabled={submittingOrder}
                        className="w-full bg-transparent text-sm outline-none placeholder:text-[#aaa198]"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="checkout-order-notes" className="mb-1.5 block text-sm font-bold" style={{ color: COLORS.text }}>
                      ចំណាំបន្ថែម <span className="font-normal" style={{ color: COLORS.muted }}>(Optional)</span>
                    </label>
                    <div className="flex items-start gap-3 rounded-xl border px-3.5 py-3 focus-within:border-[#F4511E]" style={{ borderColor: COLORS.border }}>
                      <FileText size={18} className="mt-0.5 shrink-0" style={{ color: COLORS.muted }} />
                      <textarea
                        id="checkout-order-notes"
                        value={orderNotes}
                        onChange={(event) => setOrderNotes(event.target.value)}
                        placeholder="ឧ. មិនដាក់ហឹរ..."
                        rows={3}
                        maxLength={500}
                        disabled={submittingOrder}
                        className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-[#aaa198]"
                      />
                    </div>
                  </div>

                  {checkoutError && (
                    <div role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6" style={{ color: COLORS.error }}>
                      {checkoutError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submittingOrder || cart.length === 0}
                    className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-extrabold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ background: COLORS.orange }}
                  >
                    {submittingOrder ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        កំពុងបញ្ជូន...
                      </>
                    ) : (
                      <>
                        បញ្ជាក់ការកម្មង់ <ArrowRight size={17} />
                      </>
                    )}
                  </button>
                  <p className="text-center text-[10px]" style={{ color: COLORS.muted }}>
                    ការកម្មង់របស់អ្នកនឹងត្រូវរក្សាទុកក្នុងប្រព័ន្ធ TV JROK។
                  </p>
                </form>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
