
import { useEffect, useState } from "react";

import {
  LayoutDashboard,
  ShoppingBag,
  CreditCard,
  UtensilsCrossed,
  Users,
  Settings,
  Bell,
  Search,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Menu,
  ChevronDown,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";

import ProductManagement from "./components/ProductManagement";
import OrderManagement from "./components/OrderManagement";
import { paymentService } from "./services/paymentService";
import type { Payment } from "./types/payment";

// ==========================================
// HELPER FUNCTIONS
// ==========================================

type PageName =
  | "Dashboard"
  | "Orders"
  | "Payments"
  | "Products"
  | "Customers";

const formatMoney = (amount: number, currency = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const getStatusStyle = (status: Payment["status"]) => {
  switch (status) {
    case "Verified":
      return "bg-green-50 text-green-600";

    case "Rejected":
      return "bg-red-50 text-red-600";

    case "Refunded":
      return "bg-purple-50 text-purple-600";

    default:
      return "bg-amber-50 text-amber-600";
  }
};

// ==========================================
// PAYMENT MANAGEMENT COMPONENT
// ==========================================

function PaymentManagement({
  payments,
  onRefresh,
  refreshing,
}: {
  payments: Payment[];
  onRefresh: () => Promise<void>;
  refreshing: boolean;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [modalType, setModalType] = useState<"verify" | "reject" | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const closeModal = () => {
    if (actionLoading) return;
    setModalType(null);
    setSelectedPayment(null);
    setRejectReason("");
    setActionError(null);
  };

  const handleVerify = async () => {
    if (!selectedPayment) return;

    try {
      setActionLoading(true);
      setActionError(null);

      await paymentService.verify(selectedPayment.id);
      await onRefresh();

      setModalType(null);
      setSelectedPayment(null);
    } catch (error) {
      console.error("Verify payment failed:", error);
      setActionError("Unable to verify payment. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPayment) return;

    if (!rejectReason.trim()) {
      setActionError("Please enter a rejection reason.");
      return;
    }

    try {
      setActionLoading(true);
      setActionError(null);

      await paymentService.reject(selectedPayment.id, rejectReason.trim());
      await onRefresh();

      setModalType(null);
      setSelectedPayment(null);
      setRejectReason("");
    } catch (error) {
      console.error("Reject payment failed:", error);
      setActionError("Unable to reject payment. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = payment.orderNumber
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesStatus = filter === "All" || payment.status === filter;

    return matchesSearch && matchesStatus;
  });

  const pendingCount = payments.filter((p) => p.status === "Pending").length;
  const verifiedCount = payments.filter((p) => p.status === "Verified").length;
  const rejectedCount = payments.filter((p) => p.status === "Rejected").length;

  return (
    <div className="space-y-6 p-5 md:p-8">
      {/* Page Heading */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Payment Management
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage and review customer payment transactions.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing || actionLoading}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Payment Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Payments</p>
          <h3 className="mt-2 text-2xl font-bold">{payments.length}</h3>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Pending</p>
          <h3 className="mt-2 text-2xl font-bold text-amber-600">{pendingCount}</h3>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Verified</p>
          <h3 className="mt-2 text-2xl font-bold text-green-600">{verifiedCount}</h3>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Rejected</p>
          <h3 className="mt-2 text-2xl font-bold text-red-600">{rejectedCount}</h3>
        </div>
      </div>

      {/* Payments Table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5">
          <div>
            <h3 className="font-bold text-slate-900">All Payments</h3>
            <p className="mt-1 text-xs text-slate-400">
              Search and filter payment transactions.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Order Number..."
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-orange-500 sm:w-64"
            />

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-orange-500"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Verified">Verified</option>
              <option value="Rejected">Rejected</option>
              <option value="Refunded">Refunded</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-5 py-4">Order Number</th>
                <th className="px-5 py-4">Method</th>
                <th className="px-5 py-4">Amount</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Receipt</th>
                <th className="px-5 py-4">Reason</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="transition hover:bg-slate-50">
                  <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-700">
                    {payment.orderNumber}
                  </td>

                  <td className="px-5 py-4">{payment.paymentMethod}</td>

                  <td className="whitespace-nowrap px-5 py-4 font-semibold">
                    {formatMoney(payment.amount, payment.currencyCode)}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                    {formatDate(payment.createdAt)}
                  </td>

                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(payment.status)}`}>
                      {payment.status}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    {payment.receiptImageUrl ? (
                      <a
                        href={payment.receiptImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-orange-600 hover:underline"
                      >
                        View Receipt
                      </a>
                    ) : (
                      <span className="text-slate-400">No receipt</span>
                    )}
                  </td>

                  <td className="max-w-[180px] px-5 py-4 text-slate-500">
                    {payment.rejectionReason || "-"}
                  </td>

                  <td className="px-5 py-4">
                    {payment.status === "Pending" ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setModalType("verify");
                            setActionError(null);
                          }}
                          className="rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-100"
                        >
                          Verify
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setModalType("reject");
                            setRejectReason("");
                            setActionError(null);
                          }}
                          className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">No actions</span>
                    )}
                  </td>
                </tr>
              ))}

              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    No payments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-400">
          Showing {filteredPayments.length} of {payments.length} payments
        </div>
      </section>

      {/* Verify / Reject Modal */}
      {modalType && selectedPayment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-modal-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id="payment-modal-title" className="text-xl font-bold text-slate-900">
                  {modalType === "verify" ? "Verify Payment" : "Reject Payment"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Review this transaction before continuing.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={actionLoading}
                aria-label="Close modal"
                className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Order Number</p>
              <p className="mt-1 break-all text-sm font-semibold text-slate-900">
                {selectedPayment.orderNumber}
              </p>

              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-sm text-slate-500">Payment Method</span>
                <span className="text-sm font-medium">{selectedPayment.paymentMethod}</span>
              </div>

              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-sm text-slate-500">Amount</span>
                <span className="text-sm font-bold text-slate-900">
                  {formatMoney(selectedPayment.amount, selectedPayment.currencyCode)}
                </span>
              </div>
            </div>

            {modalType === "verify" ? (
              <p className="mt-5 text-sm leading-6 text-slate-600">
                Are you sure you want to verify this payment? The order will be
                automatically confirmed after successful verification.
              </p>
            ) : (
              <div className="mt-5">
                <label htmlFor="reject-reason" className="mb-2 block text-sm font-medium text-slate-700">
                  Rejection Reason
                </label>
                <textarea
                  id="reject-reason"
                  value={rejectReason}
                  onChange={(e) => {
                    setRejectReason(e.target.value);
                    setActionError(null);
                  }}
                  placeholder="Enter reason for rejection..."
                  rows={4}
                  maxLength={500}
                  className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
                <p className="mt-1 text-right text-xs text-slate-400">
                  {rejectReason.length}/500
                </p>
              </div>
            )}

            {actionError && (
              <div role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {actionError}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={actionLoading}
                onClick={closeModal}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  actionLoading ||
                  (modalType === "reject" && !rejectReason.trim())
                }
                onClick={modalType === "verify" ? handleVerify : handleReject}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${
                  modalType === "verify"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {actionLoading
                  ? "Processing..."
                  : modalType === "verify"
                    ? "Confirm Verify"
                    : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// MAIN APP COMPONENT
// ==========================================

function App() {

  // Active Page
  const [activePage, setActivePage] =
    useState<PageName>("Dashboard");

  // Mobile Sidebar
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  // Payment States
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ========================================
  // FETCH PAYMENTS API
  // ========================================

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await paymentService.getAll();

      setPayments(data);
    } catch (err) {
      console.error("Failed to fetch payments:", err);

      setError(
        "Unable to load payments. Please check your API connection."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  
// AUTO REFRESH PAYMENTS EVERY 5 SECONDS
useEffect(() => {
  const intervalId = window.setInterval(async () => {
    try {
      const data = await paymentService.getAll();

      setPayments(data);
    } catch (error) {
      console.error("Auto refresh payments failed:", error);
    }
  }, 10000);

  return () => {
    window.clearInterval(intervalId);
  };
}, []);


  // ========================================
  // PAYMENT STATISTICS
  // ========================================

  const pendingPayments = payments.filter(
    (p) => p.status === "Pending"
  );

  const verifiedPayments = payments.filter(
    (p) => p.status === "Verified"
  );

  const rejectedPayments = payments.filter(
    (p) => p.status === "Rejected"
  );

  const totalPaid = verifiedPayments.reduce(
    (total, payment) => total + payment.amount,
    0
  );

  const stats = [
    {
      title: "Total Paid",
      value: formatMoney(totalPaid),
      description: "Verified payment amount",
      icon: TrendingUp,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Total Payments",
      value: payments.length.toLocaleString(),
      description: "All transactions",
      icon: ShoppingBag,
      color: "bg-orange-50 text-orange-600",
    },
    {
      title: "Pending Payments",
      value: pendingPayments.length.toLocaleString(),
      description: "Need review",
      icon: Clock,
      color: "bg-amber-50 text-amber-600",
    },
    {
      title: "Verified Payments",
      value: verifiedPayments.length.toLocaleString(),
      description: "Successfully verified",
      icon: CheckCircle2,
      color: "bg-green-50 text-green-600",
    },
  ];

  // ========================================
  // SIDEBAR MENU
  // ========================================

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Orders", icon: ShoppingBag },
    { name: "Payments", icon: CreditCard },
    { name: "Products", icon: UtensilsCrossed },
    { name: "Customers", icon: Users },
  ] as const;

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <button
          aria-label="Close menu"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 ${
          mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full"
        } lg:translate-x-0`}
      >

        {/* Brand */}
        <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-xl font-bold text-white">
            T
          </div>

          <div>
            <h1 className="text-lg font-bold text-slate-900">
              TV JROK
            </h1>

            <p className="text-xs text-slate-400">
              Restaurant Admin
            </p>
          </div>

        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">

          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Main Menu
          </p>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.name;

            return (
              <button
                key={item.name}
                onClick={() => {
                  setActivePage(item.name);
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-orange-50 text-orange-600"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon size={19} />
                {item.name}
              </button>
            );
          })}

          <p className="mb-3 mt-8 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Preferences
          </p>

          <button
            onClick={() => {
              setActivePage("Dashboard");
              setMobileMenuOpen(false);
            }}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-500 hover:bg-slate-50"
          >
            <Settings size={19} />
            Settings
          </button>

        </nav>

        {/* Admin Profile */}
        <div className="border-t border-slate-100 p-4">

          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-600">
              A
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">
                Administrator
              </p>

              <p className="text-xs text-slate-400">
                Admin Account
              </p>
            </div>

            <ChevronDown size={16} className="text-slate-400" />

          </div>
        </div>

      </aside>

      {/* Main Content */}
      <main className="min-h-screen lg:ml-64">

        {/* Header */}
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur-md md:px-8">

          <div className="flex items-center gap-3">

            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={23} />
            </button>

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {activePage}
              </h2>

              <p className="hidden text-xs text-slate-400 sm:block">
                Welcome back, Administrator
              </p>
            </div>

          </div>

          <div className="flex items-center gap-3">

            <button className="hidden items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-400 sm:flex">
              <Search size={17} />
              Search...
              <span className="ml-4 text-xs">Ctrl K</span>
            </button>

            <button className="relative rounded-xl border border-slate-200 p-2.5">
              <Bell size={19} />

              {pendingPayments.length > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
              )}
            </button>

          </div>

        </header>

        {/* ================================== */}
        {/* DASHBOARD PAGE */}
        {/* ================================== */}

        {activePage === "Dashboard" ? (

          <div className="space-y-7 p-5 md:p-8">

            {/* Overview */}
            <div className="flex flex-wrap items-center justify-between gap-3">

              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Overview
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Here's what's happening with your restaurant today.
                </p>
              </div>

              <button
                onClick={fetchPayments}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>

            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">

                <div>
                  <p className="font-semibold">
                    Connection Error
                  </p>

                  <p>{error}</p>
                </div>

                <button
                  onClick={fetchPayments}
                  className="shrink-0 font-semibold underline"
                >
                  Retry
                </button>

              </div>
            )}

            {/* Statistics */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

              {stats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <div
                    key={stat.title}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >

                    <div className="flex items-center justify-between">

                      <div className={`rounded-xl p-3 ${stat.color}`}>
                        <Icon size={22} />
                      </div>

                      <ArrowUpRight
                        size={18}
                        className="text-slate-300"
                      />

                    </div>

                    <p className="mt-5 text-sm text-slate-500">
                      {stat.title}
                    </p>

                    <h3 className="mt-1 text-2xl font-bold text-slate-900">
                      {loading ? "..." : stat.value}
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      {stat.description}
                    </p>

                  </div>
                );
              })}

            </div>

            {/* Rejected Payments */}
            <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-white p-4">

              <div className="rounded-xl bg-red-50 p-3 text-red-500">
                <XCircle size={20} />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700">
                  Rejected Payments
                </p>

                <p className="text-lg font-bold text-slate-900">
                  {loading ? "..." : rejectedPayments.length}
                </p>
              </div>

            </div>

            {/* Recent Payments */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5">

                <div>
                  <h3 className="font-bold text-slate-900">
                    Recent Payments
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    Latest customer payment transactions
                  </p>
                </div>

                <button
                  onClick={() => setActivePage("Payments")}
                  className="rounded-lg bg-orange-500 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-orange-600"
                >
                  View All Payments
                </button>

              </div>

              <div className="overflow-x-auto">

                <table className="w-full min-w-[700px] text-left text-sm">

                  <thead className="bg-slate-50 text-xs uppercase text-slate-400">
                    <tr>
                      <th className="px-5 py-4">Order ID</th>
                      <th className="px-5 py-4">Method</th>
                      <th className="px-5 py-4">Amount</th>
                      <th className="px-5 py-4">Date</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Receipt</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">

                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                          Loading payments...
                        </td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-red-500">
                          Unable to load payment data.
                        </td>
                      </tr>
                    ) : payments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                          No payments found.
                        </td>
                      </tr>
                    ) : (
                      payments.slice(0, 5).map((payment) => (
                        <tr
                          key={payment.id}
                          className="transition hover:bg-slate-50"
                        >

                          <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-700">
                            {payment.orderNumber}
                          </td>

                          <td className="px-5 py-4">
                            {payment.paymentMethod}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 font-semibold">
                            {formatMoney(
                              payment.amount,
                              payment.currencyCode
                            )}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                            {formatDate(payment.createdAt)}
                          </td>

                          <td className="px-5 py-4">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(payment.status)}`}>
                              {payment.status}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            {payment.receiptImageUrl ? (
                              <a
                                href={payment.receiptImageUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium text-orange-600 hover:underline"
                              >
                                View Receipt
                              </a>
                            ) : (
                              <span className="text-xs text-slate-400">
                                No receipt
                              </span>
                            )}
                          </td>

                        </tr>
                      ))
                    )}

                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">

                <p className="text-xs text-slate-400">
                  Showing {Math.min(payments.length, 5)} of {payments.length} payments
                </p>

                <p className="text-xs font-medium text-slate-500">
                  TV JROK Admin
                </p>

              </div>

            </section>

          </div>

       ) : activePage === "Payments" ? (
  <PaymentManagement
    payments={payments}
    onRefresh={fetchPayments}
    refreshing={loading}
  />
) : activePage === "Orders" ? (
  <OrderManagement />
) : activePage === "Products" ? (
  <ProductManagement />
) : (

          /* OTHER MODULES */
          <div className="p-8">

            <h2 className="text-2xl font-bold text-slate-900">
              {activePage}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              This module is coming soon.
            </p>

          </div>

        )}

      </main>
    </div>
  );
}

export default App;
