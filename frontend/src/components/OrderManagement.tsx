
import { useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Search,
  Eye,
  History,
  X,
  CheckCircle2,
  Clock,
  XCircle,
  ShoppingBag,
} from "lucide-react";

import { orderService } from "../services/orderService";
import type {
  Order,
  OrderStatus,
  OrderStatusHistory,
} from "../types/order";

const formatMoney = (amount: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);

const formatDate = (date: string) =>
  new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const statusStyle = (status: OrderStatus) => {
  switch (status) {
    case "Confirm":
      return "bg-blue-50 text-blue-600";
    case "Preparing":
      return "bg-orange-50 text-orange-600";
    case "Complete":
      return "bg-green-50 text-green-600";
    case "Cancel":
      return "bg-red-50 text-red-600";
    default:
      return "bg-amber-50 text-amber-600";
  }
};

const availableStatuses = (status: OrderStatus): OrderStatus[] => {
  switch (status) {
    case "Pending":
      return ["Confirm", "Cancel"];
    case "Confirm":
      return ["Preparing", "Cancel"];
    case "Preparing":
      return ["Complete", "Cancel"];
    default:
      return [];
  }
};

type ModalType = "details" | "history" | "status" | null;

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalType, setModalType] = useState<ModalType>(null);

  const [newStatus, setNewStatus] = useState<OrderStatus>("Confirm");
  const [statusNote, setStatusNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [history, setHistory] = useState<OrderStatusHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchOrders = async (showLoading = false) => {
    try {
      if (showLoading) setRefreshing(true);

      setError(null);
      const data = await orderService.getAll();
      setOrders(data);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError("Unable to load orders. Please check your API connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const intervalId = window.setInterval(() => {
  fetchOrders();
}, 10000);

    return () => window.clearInterval(intervalId);
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const keyword = search.toLowerCase();

      const matchesSearch =
        order.orderNumber.toLowerCase().includes(keyword) ||
        order.customerName.toLowerCase().includes(keyword) ||
        order.customerPhone.toLowerCase().includes(keyword);

      const matchesStatus =
        filter === "All" || order.status === filter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, filter]);

  const pendingCount = orders.filter(
    (order) => order.status === "Pending"
  ).length;

  const confirmedCount = orders.filter(
    (order) => order.status === "Confirm"
  ).length;

  const completedCount = orders.filter(
    (order) => order.status === "Complete"
  ).length;

  const cancelledCount = orders.filter(
    (order) => order.status === "Cancel"
  ).length;

  const closeModal = () => {
    if (actionLoading) return;

    setModalType(null);
    setSelectedOrder(null);
    setHistory([]);
    setStatusNote("");
    setActionError(null);
  };

  const openStatusModal = (order: Order) => {
    const options = availableStatuses(order.status);

    if (options.length === 0) return;

    setSelectedOrder(order);
    setNewStatus(options[0]);
    setStatusNote("");
    setActionError(null);
    setModalType("status");
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;

    try {
      setActionLoading(true);
      setActionError(null);

      await orderService.updateStatus(
        selectedOrder.id,
        newStatus,
        statusNote.trim() || undefined
      );

      await fetchOrders();

      setModalType(null);
      setSelectedOrder(null);
      setStatusNote("");
    } catch (err) {
      console.error("Update order status failed:", err);
      setActionError(
        "Unable to update order status. Please try again."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const openHistory = async (order: Order) => {
    setSelectedOrder(order);
    setHistory([]);
    setHistoryLoading(true);
    setActionError(null);
    setModalType("history");

    try {
      const data = await orderService.getHistory(order.id);
      setHistory(data);
    } catch (err) {
      console.error("Failed to load order history:", err);
      setActionError("Unable to load order history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-5 md:p-8">
      {/* Page Heading */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Order Management
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage customer orders and track order progress.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchOrders(true)}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Pending Orders</p>
          <h3 className="mt-2 text-2xl font-bold text-amber-600">
            {pendingCount}
          </h3>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Confirmed Orders</p>
          <h3 className="mt-2 text-2xl font-bold text-blue-600">
            {confirmedCount}
          </h3>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Completed Orders</p>
          <h3 className="mt-2 text-2xl font-bold text-green-600">
            {completedCount}
          </h3>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Cancelled Orders</p>
          <h3 className="mt-2 text-2xl font-bold text-red-600">
            {cancelledCount}
          </h3>
        </div>
      </div>

      {/* Orders Table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5">
          <div>
            <h3 className="font-bold text-slate-900">All Orders</h3>
            <p className="mt-1 text-xs text-slate-400">
              Search and manage customer orders.
            </p>
          </div>

          <div className="flex w-full flex-wrap gap-3 sm:w-auto">
            <div className="relative min-w-0 flex-1 sm:w-64">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search order or customer..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-orange-500"
              />
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-orange-500"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Confirm">Confirm</option>
              <option value="Preparing">Preparing</option>
              <option value="Complete">Complete</option>
              <option value="Cancel">Cancel</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
            <button
              type="button"
              onClick={() => fetchOrders(true)}
              className="ml-2 font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-5 py-4">Order Number</th>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Phone</th>
                <th className="px-5 py-4">Items</th>
                <th className="px-5 py-4">Total</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    No orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="transition hover:bg-slate-50">
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-700">
                      {order.orderNumber}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-700">
                        {order.customerName}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                      {order.customerPhone}
                    </td>

                    <td className="px-5 py-4">
                      {order.items.length} items
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 font-semibold">
                      {formatMoney(order.totalAmount, order.currencyCode)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                      {formatDate(order.createdAt)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          title="View Details"
                          onClick={() => {
                            setSelectedOrder(order);
                            setModalType("details");
                          }}
                          className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          type="button"
                          title="Order History"
                          onClick={() => openHistory(order)}
                          className="rounded-lg bg-purple-50 p-2 text-purple-600 hover:bg-purple-100"
                        >
                          <History size={16} />
                        </button>

                        {availableStatuses(order.status).length > 0 && (
                          <button
                            type="button"
                            onClick={() => openStatusModal(order)}
                            className="rounded-lg bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-600 hover:bg-orange-100"
                          >
                            Update
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-400">
          Showing {filteredOrders.length} of {orders.length} orders
          <span className="ml-2">· Auto refresh every 10 seconds</span>
        </div>
      </section>

      {/* Modal */}
      {modalType && selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="my-8 w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {modalType === "details"
                    ? "Order Details"
                    : modalType === "history"
                      ? "Order Status History"
                      : "Update Order Status"}
                </h3>

                <p className="mt-1 break-all text-sm text-slate-500">
                  {selectedOrder.orderNumber}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={actionLoading}
                aria-label="Close modal"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Order Details */}
            {modalType === "details" && (
              <div className="mt-5 space-y-5">
                <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4">
                  <div>
                    <p className="text-xs text-slate-400">Customer</p>
                    <p className="mt-1 text-sm font-semibold">
                      {selectedOrder.customerName}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">Phone</p>
                    <p className="mt-1 text-sm font-semibold">
                      {selectedOrder.customerPhone}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">Order Status</p>
                    <span
                      className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(selectedOrder.status)}`}
                    >
                      {selectedOrder.status}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">Order Date</p>
                    <p className="mt-1 text-sm font-semibold">
                      {formatDate(selectedOrder.createdAt)}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 flex items-center gap-2 font-bold text-slate-800">
                    <ShoppingBag size={18} />
                    Order Items
                  </h4>

                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    {selectedOrder.items.map((item, index) => (
                      <div
                        key={`${item.productId}-${index}`}
                        className="flex items-center justify-between gap-3 border-b border-slate-100 p-4 last:border-0"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-700">
                            {item.productName}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {formatMoney(item.unitPrice, selectedOrder.currencyCode)} × {item.quantity}
                          </p>
                        </div>

                        <p className="whitespace-nowrap text-sm font-bold">
                          {formatMoney(item.subtotal, selectedOrder.currencyCode)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div className="rounded-xl bg-amber-50 p-4">
                    <p className="text-xs font-semibold text-amber-700">
                      Customer Notes
                    </p>
                    <p className="mt-1 text-sm text-amber-800">
                      {selectedOrder.notes}
                    </p>
                  </div>
                )}

                <div className="flex justify-between border-t border-slate-100 pt-4">
                  <span className="font-semibold text-slate-600">
                    Total Amount
                  </span>
                  <span className="text-xl font-bold text-orange-600">
                    {formatMoney(selectedOrder.totalAmount, selectedOrder.currencyCode)}
                  </span>
                </div>
              </div>
            )}

            {/* History */}
            {modalType === "history" && (
              <div className="mt-6">
                {historyLoading ? (
                  <p className="py-10 text-center text-sm text-slate-400">
                    Loading history...
                  </p>
                ) : actionError ? (
                  <p role="alert" className="py-6 text-center text-sm text-red-500">
                    {actionError}
                  </p>
                ) : history.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-400">
                    No status history found.
                  </p>
                ) : (
                  <div className="space-y-5">
                    {history.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="mt-1">
                          {item.status === "Complete" ? (
                            <CheckCircle2 className="text-green-500" size={20} />
                          ) : item.status === "Cancel" ? (
                            <XCircle className="text-red-500" size={20} />
                          ) : item.status === "Confirm" ? (
                            <CheckCircle2 className="text-blue-500" size={20} />
                          ) : item.status === "Preparing" ? (
                            <Clock className="text-orange-500" size={20} />
                          ) : (
                            <Clock className="text-amber-500" size={20} />
                          )}
                        </div>

                        <div className="flex-1 border-b border-slate-100 pb-4">
                          <p className="text-sm font-bold text-slate-800">
                            {item.status}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {formatDate(item.createdAt)}
                          </p>
                          {item.note && (
                            <p className="mt-2 text-sm text-slate-600">
                              {item.note}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Update Status */}
            {modalType === "status" && (
              <div className="mt-5 space-y-5">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">Current Status</p>
                  <span
                    className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(selectedOrder.status)}`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    New Status
                  </label>

                  <select
                    value={newStatus}
                    onChange={(e) =>
                      setNewStatus(e.target.value as OrderStatus)
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-500"
                  >
                    {availableStatuses(selectedOrder.status).map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Note (Optional)
                  </label>

                  <textarea
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Enter a note..."
                    className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-orange-500"
                  />
                </div>

                {actionError && (
                  <p role="alert" className="text-sm text-red-500">
                    {actionError}
                  </p>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={actionLoading}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleUpdateStatus}
                    disabled={actionLoading}
                    className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                  >
                    {actionLoading ? "Updating..." : "Update Status"}
                  </button>
                </div>
              </div>
            )}

            {modalType !== "status" && (
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
