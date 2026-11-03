
import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Search,
  Package,
  Clock,
  CheckCircle2,
  ChefHat,
  Truck,
  XCircle,
  ArrowLeft,
  RefreshCw,
  ClipboardList,
  Phone,
  UserRound,
} from "lucide-react";
import axios from "axios";

import { orderService } from "../services/orderService";
import type { Order } from "../types/order";

const formatPrice = (price: number, currencyCode?: string) => {
  if (currencyCode === "USD") {
    return `$${Number(price).toFixed(2)}`;
  }

  return `${Math.round(price).toLocaleString("en-US")}៛`;
};

const getStatusInfo = (status: string) => {
  const value = status?.toLowerCase().replace(/[\s_-]/g, "");

  if (["pending", "new"].includes(value)) {
    return {
      label: "កំពុងរង់ចាំការបញ្ជាក់",
      description: "Order របស់អ្នកបានទទួលហើយ។",
      color: "#D97706",
      icon: Clock,
      step: 0,
    };
  }

  if (["confirmed", "confirm"].includes(value)) {
    return {
      label: "បានបញ្ជាក់ការកម្មង់",
      description: "ហាងបានបញ្ជាក់ Order របស់អ្នកហើយ។",
      color: "#2563EB",
      icon: CheckCircle2,
      step: 1,
    };
  }

  if (["preparing", "processing", "inprogress"].includes(value)) {
    return {
      label: "កំពុងរៀបចំម្ហូប",
      description: "ចុងភៅកំពុងរៀបចំម្ហូបរបស់អ្នក។",
      color: "#D97706",
      icon: ChefHat,
      step: 2,
    };
  }

  if (["ready", "completed", "served"].includes(value)) {
    return {
      label: "ម្ហូបរួចរាល់",
      description: "ម្ហូបរបស់អ្នករួចរាល់ហើយ។",
      color: "#16A34A",
      icon: CheckCircle2,
      step: 3,
    };
  }

  if (["cancelled", "canceled", "rejected"].includes(value)) {
    return {
      label: "ការកម្មង់ត្រូវបានលុបចោល",
      description: "សូមទាក់ទងហាង ប្រសិនបើអ្នកត្រូវការជំនួយ។",
      color: "#DC2626",
      icon: XCircle,
      step: -1,
    };
  }

  return {
    label: status || "មិនស្គាល់ស្ថានភាព",
    description: "ស្ថានភាព Order បច្ចុប្បន្ន។",
    color: "#78716C",
    icon: Package,
    step: 0,
  };
};

export default function OrderTrackingPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [orderNumber, setOrderNumber] = useState(
    searchParams.get("orderNumber") ?? ""
  );
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchOrder = useCallback(
    async (number: string, silent = false) => {
      const trimmedNumber = number.trim();

      if (!trimmedNumber) {
        setError("សូមបញ្ចូល Order Number ជាមុនសិន។");
        return;
      }

      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
          setError("");
          setOrder(null);
        }

        const result = await orderService.getByNumber(trimmedNumber);

        setOrder(result);
        setError("");
        setSearchParams({ orderNumber: trimmedNumber });
      } catch (err: unknown) {
        console.error("Failed to fetch order:", err);

        if (!silent) {
          if (axios.isAxiosError(err) && err.response?.status === 404) {
            setError("រកមិនឃើញ Order Number នេះទេ។ សូមពិនិត្យម្ដងទៀត។");
          } else {
            setError("មិនអាចទាញយកព័ត៌មាន Order បានទេ។ សូមព្យាយាមម្ដងទៀត។");
          }
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [setSearchParams]
  );

  // Load order from URL when the page opens.
  useEffect(() => {
    const number = searchParams.get("orderNumber");

    if (number) {
      setOrderNumber(number);
      void fetchOrder(number);
    }
  }, [searchParams, fetchOrder]);

  // Automatically refresh order status every 10 seconds.
  useEffect(() => {
    if (!order?.orderNumber) return;

    const intervalId = window.setInterval(() => {
      void fetchOrder(order.orderNumber, true);
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [order?.orderNumber, fetchOrder]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void fetchOrder(orderNumber);
  };

  const statusInfo = order ? getStatusInfo(order.status) : null;
  const StatusIcon = statusInfo?.icon;

  const steps = [
    { label: "ទទួល Order", icon: ClipboardList },
    { label: "បានបញ្ជាក់", icon: CheckCircle2 },
    { label: "កំពុងរៀបចំ", icon: ChefHat },
    { label: "រួចរាល់", icon: Truck },
  ];

  return (
    <div className="min-h-screen bg-[#F7F5F1] text-[#211A15]">
      {/* Header */}
      <header className="bg-[#1C1713] text-white shadow-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <button
            onClick={() => navigate("/order")}
            className="flex items-center gap-2"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F4511E]">
              <ChefHat size={23} />
            </span>
            <span>
              <span className="block text-xl font-black text-[#FF9A45]">
                TV JROK
              </span>
              <span className="block text-[9px] tracking-widest text-[#C9BDB1]">
                FOOD · DRINKS · GOOD VIBES
              </span>
            </span>
          </button>

          <button
            onClick={() => navigate("/order")}
            className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/20"
          >
            <ArrowLeft size={16} />
            ត្រឡប់ទៅ Menu
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Title */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF2EB] text-[#F4511E]">
            <Package size={32} />
          </div>

          <p className="mt-5 text-[10px] font-black tracking-[0.2em] text-[#F4511E]">
            TV JROK · ORDER TRACKING
          </p>

          <h1 className="mt-2 text-2xl font-black sm:text-3xl">
            តាមដានការកម្មង់របស់អ្នក
          </h1>

          <p className="mt-2 text-sm text-[#81786F]">
            បញ្ចូល Order Number ដើម្បីពិនិត្យស្ថានភាពការកម្មង់។
          </p>
        </div>

        {/* Search */}
        <form
          onSubmit={handleSearch}
          className="mt-8 flex gap-2 rounded-2xl border border-[#EAE4DC] bg-white p-2 shadow-sm"
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 px-2 sm:px-3">
            <Search size={20} className="shrink-0 text-[#F4511E]" />
            <input
              value={orderNumber}
              onChange={(event) => setOrderNumber(event.target.value)}
              placeholder="បញ្ចូល Order Number..."
              className="w-full min-w-0 bg-transparent py-2 text-sm outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !orderNumber.trim()}
            className="shrink-0 rounded-xl bg-[#F4511E] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#D94012] disabled:opacity-50"
          >
            {loading ? "កំពុងស្វែងរក..." : "ស្វែងរក"}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && !order && (
          <div className="mt-8 rounded-2xl bg-white p-10 text-center shadow-sm">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-[#F4511E]/20 border-t-[#F4511E]" />
            <p className="mt-4 text-sm text-[#81786F]">
              កំពុងទាញយកព័ត៌មាន Order...
            </p>
          </div>
        )}

        {/* Order Details */}
        {order && statusInfo && (
          <div className="mt-8 space-y-5">
            {/* Status Card */}
            <section className="rounded-2xl border border-[#EAE4DC] bg-white p-5 shadow-sm sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-[#81786F]">
                    ORDER NUMBER
                  </p>
                  <h2 className="mt-1 break-all text-xl font-black text-[#D94012] sm:text-2xl">
                    {order.orderNumber}
                  </h2>
                </div>

                <button
                  onClick={() => void fetchOrder(order.orderNumber, true)}
                  disabled={refreshing}
                  className="flex items-center gap-2 rounded-lg border border-[#EAE4DC] px-3 py-2 text-xs font-bold hover:bg-[#F7F5F1] disabled:opacity-50"
                >
                  <RefreshCw
                    size={14}
                    className={refreshing ? "animate-spin" : ""}
                  />
                  Refresh
                </button>
              </div>

              <div className="mt-6 rounded-2xl p-5" style={{ background: `${statusInfo.color}10` }}>
                <div className="flex items-center gap-3">
                  {StatusIcon && (
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white"
                      style={{ color: statusInfo.color }}
                    >
                      <StatusIcon size={27} />
                    </div>
                  )}

                  <div>
                    <p className="text-lg font-black" style={{ color: statusInfo.color }}>
                      {statusInfo.label}
                    </p>
                    <p className="mt-1 text-xs text-[#81786F]">
                      {statusInfo.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress */}
              {statusInfo.step >= 0 && (
                <div className="mt-8">
                  <div className="space-y-0">
                    {steps.map((step, index) => {
                      const Icon = step.icon;
                      const completed = index <= statusInfo.step;

                      return (
                        <div key={step.label} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                                completed
                                  ? "bg-[#F4511E] text-white"
                                  : "bg-[#F1ECE5] text-[#A69A8E]"
                              }`}
                            >
                              <Icon size={18} />
                            </div>

                            {index !== steps.length - 1 && (
                              <div
                                className={`my-1 h-8 w-0.5 ${
                                  index < statusInfo.step
                                    ? "bg-[#F4511E]"
                                    : "bg-[#EAE4DC]"
                                }`}
                              />
                            )}
                          </div>

                          <div className="pt-2">
                            <p
                              className={`text-sm font-bold ${
                                completed ? "text-[#211A15]" : "text-[#A69A8E]"
                              }`}
                            >
                              {step.label}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            {/* Customer Information */}
            <section className="rounded-2xl border border-[#EAE4DC] bg-white p-5 shadow-sm sm:p-6">
              <h3 className="flex items-center gap-2 font-black">
                <ClipboardList size={19} className="text-[#F4511E]" />
                ព័ត៌មានការកម្មង់
              </h3>

              <div className="mt-5 space-y-4">
                <div className="flex items-center gap-3">
                  <UserRound size={18} className="text-[#81786F]" />
                  <div>
                    <p className="text-[11px] text-[#81786F]">ឈ្មោះអតិថិជន</p>
                    <p className="text-sm font-bold">{order.customerName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-[#81786F]" />
                  <div>
                    <p className="text-[11px] text-[#81786F]">លេខទូរស័ព្ទ</p>
                    <p className="text-sm font-bold">{order.customerPhone}</p>
                  </div>
                </div>

                {order.notes && (
                  <div>
                    <p className="text-[11px] text-[#81786F]">ចំណាំ</p>
                    <p className="mt-1 text-sm">{order.notes}</p>
                  </div>
                )}

                <div className="border-t border-[#EAE4DC] pt-4">
                  <p className="text-[11px] text-[#81786F]">ថ្ងៃបង្កើត Order</p>
                  <p className="mt-1 text-sm font-bold">
                    {new Date(order.createdAt).toLocaleString("en-GB")}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-[#EAE4DC] pt-4">
                  <span className="text-sm font-bold text-[#81786F]">
                    តម្លៃសរុប
                  </span>
                  <span className="text-xl font-black text-[#D94012]">
                    {formatPrice(order.totalAmount, order.currencyCode)}
                  </span>
                </div>
              </div>
            </section>

            <p className="flex items-center justify-center gap-2 text-center text-xs text-[#81786F]">
              <RefreshCw size={13} />
              ប្រព័ន្ធធ្វើបច្ចុប្បន្នភាពស្ថានភាពរៀងរាល់ 10 វិនាទី។
            </p>
          </div>
        )}

        {!loading && !order && !error && (
          <div className="mt-8 rounded-2xl border border-dashed border-[#DED5CA] bg-white p-10 text-center">
            <Package size={38} className="mx-auto text-[#C8BDB1]" />
            <p className="mt-4 font-bold">មិនទាន់មាន Order ត្រូវបានស្វែងរក</p>
            <p className="mt-2 text-xs text-[#81786F]">
              សូមបញ្ចូល Order Number ខាងលើ។
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
