import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Users,
  Search,
  RefreshCw,
  Phone,
  ShoppingBag,
  Wallet,
  Eye,
  X,
  CalendarDays,
  Crown,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  ArrowUpRight,
  Clock3,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { orderService } from "../services/orderService";
import type { Order, OrderStatus } from "../types/order";

interface Customer {
  key: string;
  name: string;
  phone: string;
  orders: Order[];
  totalSpent: number;
  lastOrderDate: string;
}

type CustomerFilter = "All" | "VIP" | "Regular";

const VIP_ORDER_THRESHOLD = 5;
const PAGE_SIZE = 8;

const formatMoney = (amount: number, currency = "KHR") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "KHR" ? 0 : 2,
  }).format(amount);

const formatDate = (date: string) => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const getStatusStyle = (status: OrderStatus) => {
  switch (status) {
    case "Complete":
      return "bg-emerald-50 text-emerald-700";
    case "Cancel":
      return "bg-rose-50 text-rose-600";
    case "Preparing":
      return "bg-sky-50 text-sky-700";
    case "Confirm":
      return "bg-violet-50 text-violet-700";
    default:
      return "bg-amber-50 text-amber-700";
  }
};

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "?";

const monthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const monthLabel = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "short" });

export default function CustomersManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<CustomerFilter>("All");
  const [page, setPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const fetchOrders = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      else setRefreshing(true);

      setError(null);
      const data = await orderService.getAll();
      setOrders(data);
    } catch (err) {
      console.error("Failed to load customer orders:", err);
      setError("Unable to load customer data. Please check your API connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchOrders(true);
    const intervalId = window.setInterval(() => void fetchOrders(), 10000);
    return () => window.clearInterval(intervalId);
  }, [fetchOrders]);

  const customers = useMemo<Customer[]>(() => {
    const customerMap = new Map<string, Customer>();

    for (const order of orders) {
      const name = order.customerName?.trim() || "Unknown Customer";
      const phone = order.customerPhone?.trim() || "No phone number";
      const normalizedPhone = phone.replace(/\D/g, "");
      const key = normalizedPhone
        ? `phone:${normalizedPhone}`
        : `name:${name.toLowerCase()}`;

      const existing = customerMap.get(key);
      if (existing) {
        existing.orders.push(order);
        existing.totalSpent += order.totalAmount;
        if (
          new Date(order.createdAt).getTime() >
          new Date(existing.lastOrderDate).getTime()
        ) {
          existing.lastOrderDate = order.createdAt;
        }
      } else {
        customerMap.set(key, {
          key,
          name,
          phone,
          orders: [order],
          totalSpent: order.totalAmount,
          lastOrderDate: order.createdAt,
        });
      }
    }

    return Array.from(customerMap.values())
      .map((customer) => ({
        ...customer,
        orders: [...customer.orders].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
      }))
      .sort(
        (a, b) =>
          new Date(b.lastOrderDate).getTime() -
          new Date(a.lastOrderDate).getTime()
      );
  }, [orders]);

  const vipCount = customers.filter(
    (customer) => customer.orders.length >= VIP_ORDER_THRESHOLD
  ).length;

  const totalSpent = orders.reduce(
    (total, order) => total + order.totalAmount,
    0
  );

  const filteredCustomers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesSearch =
        !keyword ||
        customer.name.toLowerCase().includes(keyword) ||
        customer.phone.toLowerCase().includes(keyword);

      const isVip = customer.orders.length >= VIP_ORDER_THRESHOLD;
      const matchesFilter =
        filter === "All" ||
        (filter === "VIP" && isVip) ||
        (filter === "Regular" && !isVip);

      return matchesSearch && matchesFilter;
    });
  }, [customers, filter, search]);

  useEffect(() => {
    setPage(1);
  }, [search, filter]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const insights = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return {
        key: monthKey(date),
        month: monthLabel(date),
        customers: 0,
      };
    });
    const monthMap = new Map(months.map((month) => [month.key, month]));

    for (const customer of customers) {
      const firstOrder = customer.orders.reduce((earliest, order) => {
        const current = new Date(order.createdAt);
        return current.getTime() < earliest.getTime() ? current : earliest;
      }, new Date(customer.orders[0]?.createdAt ?? Date.now()));

      const bucket = monthMap.get(monthKey(firstOrder));
      if (bucket) bucket.customers += 1;
    }

    return months;
  }, [customers]);

  const topCustomers = useMemo(
    () => [...customers].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5),
    [customers]
  );

  const stats = [
    {
      label: "Total Customers",
      value: customers.length.toLocaleString(),
      detail: "Unique customer profiles",
      icon: Users,
      iconClass: "bg-orange-100 text-orange-600",
    },
    {
      label: "Total Orders",
      value: orders.length.toLocaleString(),
      detail: "Orders received",
      icon: ShoppingBag,
      iconClass: "bg-amber-100 text-amber-700",
    },
    {
      label: "Total Order Amount",
      value: formatMoney(totalSpent),
      detail: "Combined order value",
      icon: Wallet,
      iconClass: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "VIP Customers",
      value: vipCount.toLocaleString(),
      detail: `${VIP_ORDER_THRESHOLD}+ orders placed`,
      icon: Crown,
      iconClass: "bg-violet-100 text-violet-700",
    },
  ];

  return (
    <div className="min-h-full bg-[#faf8f4] p-4 text-slate-800 sm:p-5 lg:p-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* Heading */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-500">
              Customer relationship
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Customers
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Understand your customers and their ordering activity.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void fetchOrders()}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-[#eee6da] bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-2xl border border-[#eee7dc] bg-white p-5 shadow-[0_4px_18px_rgba(67,48,22,0.035)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-500">
                      {stat.label}
                    </p>
                    <p className="mt-3 break-words text-2xl font-bold tracking-tight text-slate-900">
                      {loading ? "—" : stat.value}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">{stat.detail}</p>
                  </div>
                  <div className={`rounded-xl p-3 ${stat.iconClass}`}>
                    <Icon size={21} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void fetchOrders(true)}
              className="font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Main content grid */}
        <div className="grid grid-cols-1 items-start gap-6 2xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.85fr)]">
          {/* Customer table */}
          <section className="min-w-0 overflow-hidden rounded-2xl border border-[#eee7dc] bg-white shadow-[0_4px_18px_rgba(67,48,22,0.035)]">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#f1ece4] p-5">
              <div>
                <h3 className="font-bold text-slate-900">All Customers</h3>
                <p className="mt-1 text-xs text-slate-400">
                  Customer information from your order records
                </p>
              </div>
              <span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700">
                {filteredCustomers.length} customers
              </span>
            </div>

            <div className="flex flex-col gap-3 border-b border-[#f1ece4] p-4 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search customer name or phone..."
                  className="w-full rounded-xl border border-[#eee7dc] bg-[#fdfcf9] py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:ring-4 focus:ring-orange-50"
                />
              </div>
              <div className="relative sm:w-40">
                <SlidersHorizontal
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <select
                  value={filter}
                  onChange={(event) =>
                    setFilter(event.target.value as CustomerFilter)
                  }
                  className="w-full appearance-none rounded-xl border border-[#eee7dc] bg-[#fdfcf9] py-2.5 pl-9 pr-3 text-sm text-slate-600 outline-none focus:border-orange-300"
                >
                  <option value="All">All customers</option>
                  <option value="VIP">VIP customers</option>
                  <option value="Regular">Regular customers</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-[#fcfaf6] text-[11px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Customer</th>
                    <th className="px-4 py-4 font-semibold">Phone</th>
                    <th className="px-4 py-4 font-semibold">Orders</th>
                    <th className="px-4 py-4 font-semibold">Total Spent</th>
                    <th className="px-4 py-4 font-semibold">Last Order</th>
                    <th className="px-5 py-4 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3eee7]">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-14 text-center text-sm text-slate-400">
                        Loading customers...
                      </td>
                    </tr>
                  ) : paginatedCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-14 text-center text-sm text-slate-400">
                        {search || filter !== "All"
                          ? "No customers match your search or filter."
                          : "No customers found yet."}
                      </td>
                    </tr>
                  ) : (
                    paginatedCustomers.map((customer) => {
                      const isVip = customer.orders.length >= VIP_ORDER_THRESHOLD;
                      return (
                        <tr key={customer.key} className="transition hover:bg-[#fffdf9]">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff0df] text-xs font-bold text-[#c76a24]">
                                {getInitials(customer.name)}
                              </div>
                              <div className="min-w-0">
                                <p className="max-w-[180px] truncate font-semibold text-slate-800">
                                  {customer.name}
                                </p>
                                <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                                  {isVip && <Crown size={11} className="text-amber-500" />}
                                  {isVip ? "VIP CUSTOMER" : "CUSTOMER"}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                            {customer.phone}
                          </td>
                          <td className="px-4 py-4 font-semibold text-slate-700">
                            {customer.orders.length}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-800">
                            {formatMoney(customer.totalSpent)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                            {formatDate(customer.lastOrderDate)}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedCustomer(customer)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#fff3e8] px-3 py-2 text-xs font-semibold text-[#c76a24] transition hover:bg-[#ffe8d4]"
                            >
                              <Eye size={14} />
                              Details
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f1ece4] px-5 py-4">
              <p className="text-xs text-slate-400">
                Showing{" "}
                {filteredCustomers.length === 0
                  ? 0
                  : (currentPage - 1) * PAGE_SIZE + 1}
                {"–"}
                {Math.min(currentPage * PAGE_SIZE, filteredCustomers.length)} of{" "}
                {filteredCustomers.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  disabled={currentPage <= 1}
                  aria-label="Previous page"
                  className="rounded-lg border border-[#eee7dc] p-2 text-slate-500 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="min-w-16 text-center text-xs font-medium text-slate-500">
                  Page {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                  disabled={currentPage >= totalPages}
                  aria-label="Next page"
                  className="rounded-lg border border-[#eee7dc] p-2 text-slate-500 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            <div className="border-t border-[#f7f2eb] px-5 py-3 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Auto refresh every 10 seconds
              </span>
            </div>
          </section>

          {/* Insights column */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-1">
            <section className="rounded-2xl border border-[#eee7dc] bg-white p-5 shadow-[0_4px_18px_rgba(67,48,22,0.035)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900">Customer Insights</h3>
                  <p className="mt-1 text-xs text-slate-400">
                    New customers by first order
                  </p>
                </div>
                <div className="rounded-xl bg-orange-50 p-2.5 text-orange-600">
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className="mt-5 h-[220px] w-full">
                {insights.every((item) => item.customers === 0) ? (
                  <div className="flex h-full items-center justify-center text-center text-sm text-slate-400">
                    No customer activity in the last six months.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={insights} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                      <CartesianGrid stroke="#f1ece4" strokeDasharray="4 4" vertical={false} />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#9ca3af", fontSize: 11 }}
                      />
                      <YAxis
                        allowDecimals={false}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#9ca3af", fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={{
                          border: "1px solid #eee7dc",
                          borderRadius: 12,
                          fontSize: 12,
                        }}
                        formatter={(value) => [`${value ?? 0} customers`, "New customers"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="customers"
                        stroke="#e88b43"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#e88b43", strokeWidth: 2, stroke: "#fff" }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                Based on each customer’s earliest recorded order.
              </p>
            </section>

            <section className="rounded-2xl border border-[#eee7dc] bg-white p-5 shadow-[0_4px_18px_rgba(67,48,22,0.035)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900">Top Customers</h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Ranked by total order amount
                  </p>
                </div>
                <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
                  <Crown size={18} />
                </div>
              </div>

              <div className="mt-4 space-y-4">
                {topCustomers.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-400">
                    No customer data available.
                  </p>
                ) : (
                  topCustomers.map((customer, index) => (
                    <button
                      type="button"
                      key={customer.key}
                      onClick={() => setSelectedCustomer(customer)}
                      className="flex w-full items-center gap-3 text-left"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#fff4e8] text-xs font-bold text-[#c76a24]">
                        {index + 1}
                      </span>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff0df] text-[11px] font-bold text-[#c76a24]">
                        {getInitials(customer.name)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-700">
                          {customer.name}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-slate-400">
                          {customer.orders.length} orders
                        </span>
                      </span>
                      <span className="whitespace-nowrap text-right text-xs font-bold text-slate-800">
                        {formatMoney(customer.totalSpent)}
                        <ArrowUpRight size={13} className="ml-auto mt-1 text-slate-300" />
                      </span>
                    </button>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-[2px] sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedCustomer(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-modal-title"
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#f1ece4] bg-white p-5">
              <div>
                <h3 id="customer-modal-title" className="text-xl font-bold text-slate-900">
                  Customer Details
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Profile information and order history
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                aria-label="Close customer details"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 p-5">
              <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-[#fcf8f1] p-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#ffead5] text-lg font-bold text-[#c76a24]">
                  {getInitials(selectedCustomer.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-lg font-bold text-slate-900">
                    {selectedCustomer.name}
                  </h4>
                  <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                    <Phone size={14} />
                    {selectedCustomer.phone}
                  </p>
                </div>
                {selectedCustomer.orders.length >= VIP_ORDER_THRESHOLD && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700">
                    <Crown size={13} /> VIP Customer
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-[#eee7dc] p-4">
                  <p className="text-xs text-slate-500">Total Orders</p>
                  <p className="mt-2 text-xl font-bold text-slate-900">
                    {selectedCustomer.orders.length}
                  </p>
                </div>
                <div className="rounded-xl border border-[#eee7dc] p-4">
                  <p className="text-xs text-slate-500">Total Spent</p>
                  <p className="mt-2 break-words text-lg font-bold text-slate-900">
                    {formatMoney(selectedCustomer.totalSpent)}
                  </p>
                </div>
                <div className="rounded-xl border border-[#eee7dc] p-4">
                  <p className="text-xs text-slate-500">Last Order</p>
                  <p className="mt-2 text-sm font-bold text-slate-900">
                    {formatDate(selectedCustomer.lastOrderDate)}
                  </p>
                </div>
              </div>

              <div>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h4 className="font-bold text-slate-900">Order History</h4>
                  <span className="text-xs text-slate-400">
                    {selectedCustomer.orders.length} records
                  </span>
                </div>
                <div className="space-y-3">
                  {selectedCustomer.orders.map((order) => (
                    <div key={order.id} className="rounded-xl border border-[#eee7dc] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-800">{order.orderNumber}</p>
                          <p className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                            <CalendarDays size={13} />
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#f1ece4] pt-3">
                        <span className="flex items-center gap-2 text-xs text-slate-500">
                          <ShoppingBag size={14} />
                          {order.items.length} item types
                        </span>
                        <span className="font-bold text-slate-900">
                          {formatMoney(order.totalAmount, order.currencyCode)}
                        </span>
                      </div>
                      {order.items.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {order.items.map((item, index) => (
                            <p
                              key={`${order.id}-${item.productId}-${index}`}
                              className="text-xs text-slate-500"
                            >
                              {item.productName} × {item.quantity}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock3 size={14} />
                Customer details are derived from existing order records.
              </div>
            </div>

            <div className="border-t border-[#f1ece4] p-5 text-right">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
