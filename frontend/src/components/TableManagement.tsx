import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  Armchair,
  CheckCircle2,
  Circle,
  Clock3,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Users,
  X,
  XCircle,
  MoreHorizontal,
  Filter,
} from "lucide-react";
import { tableService } from "../services/tableService";
import type { Table, TableAvailability } from "../types/table";

type TableFilter = "All" | "Active" | "Inactive";
type ViewMode = "grid" | "list";

const getAvailability = (
  table: Table,
  availability: TableAvailability[],
): boolean | null => {
  const match = availability.find((item) => item.id === table.id);
  if (!match) return null;
  return match.isAvailable;
};

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: typeof Armchair;
  tone: "orange" | "green" | "purple" | "red";
}) {
  const tones = {
    orange: "bg-orange-50 text-orange-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-violet-50 text-violet-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tones[tone]}`}>
          <Icon size={23} />
        </div>
        <span className="text-xs font-semibold text-slate-400">{subtitle}</span>
      </div>
      <p className="mt-4 text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      <div className={`pointer-events-none absolute -bottom-7 -right-4 h-16 w-28 rounded-full opacity-50 blur-2xl ${tones[tone]}`} />
    </div>
  );
}

function StatusBadge({
  active,
  available,
}: {
  active: boolean;
  available: boolean | null;
}) {
  if (!active) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
        <Circle size={12} /> Inactive
      </span>
    );
  }

  if (available === false) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700">
        <XCircle size={13} /> Occupied
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
      <CheckCircle2 size={13} /> {available === null ? "Active" : "Available"}
    </span>
  );
}

export default function TableManagement() {
  const [tables, setTables] = useState<Table[]>([]);
  const [availability, setAvailability] = useState<TableAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<TableFilter>("All");
  const [view, setView] = useState<ViewMode>("grid");
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [tableNumber, setTableNumber] = useState("");
  const [capacity, setCapacity] = useState("4");
  const [formError, setFormError] = useState("");

  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [tableData, availabilityData] = await Promise.all([
        tableService.getAll(),
        tableService.getAvailability().catch(() => [] as TableAvailability[]),
      ]);
      const sorted = [...tableData].sort((a, b) =>
        a.tableNumber.localeCompare(b.tableNumber, undefined, {
          numeric: true,
          sensitivity: "base",
        }),
      );
      setTables(sorted);
      setAvailability(availabilityData);
      setSelectedTable((current) =>
        current ? sorted.find((item) => item.id === current.id) ?? null : sorted[0] ?? null,
      );
    } catch (err) {
      console.error("Failed to load tables:", err);
      setError("Unable to load tables. Please check your API connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTables();
  }, [fetchTables]);

  const activeTables = tables.filter((table) => table.isActive);
  const occupiedTables = activeTables.filter(
    (table) => getAvailability(table, availability) === false,
  );
  const totalSeats = activeTables.reduce((sum, table) => sum + table.capacity, 0);

  const filteredTables = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tables.filter((table) => {
      const matchesSearch = table.tableNumber.toLowerCase().includes(query);
      const matchesFilter =
        filter === "All" ||
        (filter === "Active" && table.isActive) ||
        (filter === "Inactive" && !table.isActive);
      return matchesSearch && matchesFilter;
    });
  }, [tables, search, filter]);

  const openCreate = () => {
    setEditingTable(null);
    setTableNumber("");
    setCapacity("4");
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (table: Table) => {
    setEditingTable(table);
    setTableNumber(table.tableNumber);
    setCapacity(String(table.capacity));
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingTable(null);
    setFormError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanNumber = tableNumber.trim();
    const seats = Number(capacity);

    if (!cleanNumber) {
      setFormError("Please enter a table number.");
      return;
    }
    if (!Number.isInteger(seats) || seats < 1 || seats > 100) {
      setFormError("Capacity must be a whole number between 1 and 100.");
      return;
    }
    const duplicate = tables.some(
      (table) =>
        table.tableNumber.trim().toLowerCase() === cleanNumber.toLowerCase() &&
        table.id !== editingTable?.id,
    );
    if (duplicate) {
      setFormError("This table number already exists.");
      return;
    }

    try {
      setSaving(true);
      setFormError("");
      if (editingTable) {
        await tableService.update(editingTable.id, {
          tableNumber: cleanNumber,
          capacity: seats,
          isActive: editingTable.isActive,
        });
      } else {
        await tableService.create({ tableNumber: cleanNumber, capacity: seats });
      }
      setModalOpen(false);
      setEditingTable(null);
      await fetchTables();
    } catch (err) {
      console.error("Save table failed:", err);
      setFormError("Unable to save this table. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (table: Table) => {
    const action = table.isActive ? "deactivate" : "activate";
    if (!window.confirm(`Are you sure you want to ${action} ${table.tableNumber}?`)) return;

    try {
      setError("");
      if (table.isActive) {
        await tableService.deactivate(table.id);
      } else {
        await tableService.update(table.id, {
          tableNumber: table.tableNumber,
          capacity: table.capacity,
          isActive: true,
        });
      }
      await fetchTables();
    } catch (err) {
      console.error("Change table status failed:", err);
      setError("Unable to change table status. Please try again.");
    }
  };

  const selectedAvailability = selectedTable
    ? getAvailability(selectedTable, availability)
    : null;

  return (
    <div className="min-h-full space-y-6 bg-[#fffaf7] p-4 md:p-7">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl bg-gradient-to-r from-white via-white to-orange-50 p-5 md:flex-row md:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">
            <LayoutGrid size={14} /> / <span className="text-slate-700">Tables</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
            Tables <span className="text-orange-600">Management</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Manage restaurant table numbers, seating capacity, and status.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void fetchTables()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
          >
            <Plus size={18} /> Add New Table
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={() => void fetchTables()} className="font-semibold underline">Try again</button>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Tables" value={tables.length} subtitle="All records" icon={Armchair} tone="orange" />
        <StatCard title="Active Tables" value={activeTables.length} subtitle="Currently enabled" icon={CheckCircle2} tone="green" />
        <StatCard title="Total Seats" value={totalSeats} subtitle="Active table capacity" icon={Users} tone="purple" />
        <StatCard title="Occupied Tables" value={occupiedTables.length} subtitle="From availability API" icon={Clock3} tone="red" />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 items-start gap-5 2xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setView("grid")}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${view === "grid" ? "bg-orange-600 text-white shadow-sm" : "text-slate-600 hover:bg-white"}`}
              >
                <LayoutGrid size={16} /> Grid View
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${view === "list" ? "bg-orange-600 text-white shadow-sm" : "text-slate-600 hover:bg-white"}`}
              >
                <List size={16} /> List View
              </button>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative block">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search table..."
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 sm:w-48"
                />
              </label>
              <label className="relative block">
                <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={filter}
                  onChange={(event) => setFilter(event.target.value as TableFilter)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm font-medium text-slate-700 outline-none focus:border-orange-400 sm:w-40"
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </label>
            </div>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="grid min-h-64 place-items-center text-sm text-slate-400">
                <div className="text-center">
                  <RefreshCw size={25} className="mx-auto mb-3 animate-spin text-orange-500" />
                  Loading tables...
                </div>
              </div>
            ) : filteredTables.length === 0 ? (
              <div className="grid min-h-64 place-items-center rounded-xl border border-dashed border-slate-200 text-center">
                <div>
                  <Armchair size={34} className="mx-auto mb-3 text-slate-300" />
                  <p className="font-semibold text-slate-700">No tables found</p>
                  <p className="mt-1 text-sm text-slate-400">Try another search or add a new table.</p>
                  <button type="button" onClick={openCreate} className="mt-4 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700">
                    Add New Table
                  </button>
                </div>
              </div>
            ) : view === "grid" ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {filteredTables.map((table) => {
                  const available = getAvailability(table, availability);
                  const selected = selectedTable?.id === table.id;
                  const occupied = table.isActive && available === false;
                  return (
                    <button
                      key={table.id}
                      type="button"
                      onClick={() => setSelectedTable(table)}
                      className={`group relative rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${selected ? "border-orange-400 bg-orange-50/60 ring-1 ring-orange-200" : "border-slate-200 bg-white hover:border-orange-200"}`}
                    >
                      <span className="absolute right-3 top-3 text-slate-400 opacity-0 transition group-hover:opacity-100">
                        <MoreHorizontal size={18} />
                      </span>
                      <div className="flex items-center gap-3">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${!table.isActive ? "bg-slate-100 text-slate-400" : occupied ? "bg-orange-50 text-orange-600" : "bg-green-50 text-green-600"}`}>
                          <Armchair size={25} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-900">{table.tableNumber}</p>
                          <p className="mt-1 text-sm text-slate-500">{table.capacity} Seats</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <StatusBadge active={table.isActive} available={available} />
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Table</th>
                      <th className="px-4 py-3">Capacity</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTables.map((table) => (
                      <tr key={table.id} className={selectedTable?.id === table.id ? "bg-orange-50/60" : "hover:bg-slate-50"}>
                        <td className="px-4 py-3 font-semibold text-slate-800">{table.tableNumber}</td>
                        <td className="px-4 py-3 text-slate-600">{table.capacity} seats</td>
                        <td className="px-4 py-3"><StatusBadge active={table.isActive} available={getAvailability(table, availability)} /></td>
                        <td className="px-4 py-3 text-right">
                          <button type="button" onClick={() => setSelectedTable(table)} className="mr-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-white">View</button>
                          <button type="button" onClick={() => openEdit(table)} className="rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100">Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-400">
            Showing {filteredTables.length} of {tables.length} tables
          </div>
        </section>

        {/* Details panel */}
        <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {selectedTable ? (
            <>
              <div className="relative flex h-36 items-center justify-center overflow-hidden bg-gradient-to-br from-orange-100 via-amber-50 to-orange-200">
                <div className="absolute -right-6 -top-12 h-40 w-40 rounded-full bg-white/40 blur-2xl" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-white/70 bg-white/70 text-orange-600 shadow-sm">
                  <Armchair size={42} />
                </div>
                <span className="absolute left-4 top-4">
                  <StatusBadge active={selectedTable.isActive} available={selectedAvailability} />
                </span>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-orange-50 p-2 text-orange-600"><Armchair size={21} /></div>
                    <h2 className="text-xl font-extrabold text-slate-900">{selectedTable.tableNumber}</h2>
                  </div>
                  <button type="button" onClick={() => openEdit(selectedTable)} aria-label="Edit table" className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600">
                    <Pencil size={17} />
                  </button>
                </div>

                <div className="mt-5 space-y-4">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 text-slate-500"><Users size={17} /> Capacity</span>
                    <span className="font-semibold text-slate-800">{selectedTable.capacity} Seats</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 text-slate-500"><CheckCircle2 size={17} /> Status</span>
                    <StatusBadge active={selectedTable.isActive} available={selectedAvailability} />
                  </div>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-500">Created</span>
                    <span className="font-medium text-slate-700">{new Date(selectedTable.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="my-5 border-t border-slate-100" />
                <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-900">
                  <span className="text-orange-500">ϟ</span> Quick Actions
                </h3>
                <div className="space-y-2">
                  <button type="button" onClick={() => openEdit(selectedTable)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-700">
                    <Pencil size={16} /> Edit Table
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleStatus(selectedTable)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <RefreshCw size={16} /> {selectedTable.isActive ? "Deactivate Table" : "Activate Table"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="grid min-h-80 place-items-center p-6 text-center">
              <div>
                <Armchair size={35} className="mx-auto mb-3 text-slate-300" />
                <p className="font-semibold text-slate-700">Select a table</p>
                <p className="mt-1 text-sm text-slate-400">Choose a table card to view its details.</p>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Add / Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeModal();
        }}>
          <div role="dialog" aria-modal="true" aria-labelledby="table-modal-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 id="table-modal-title" className="text-xl font-bold text-slate-900">{editingTable ? "Edit Table" : "Add New Table"}</h2>
                <p className="mt-1 text-sm text-slate-500">Enter the table number and seating capacity.</p>
              </div>
              <button type="button" onClick={closeModal} disabled={saving} aria-label="Close" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={19} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="table-number" className="mb-1.5 block text-sm font-semibold text-slate-700">Table Number</label>
                <input id="table-number" autoFocus value={tableNumber} onChange={(event) => setTableNumber(event.target.value)} placeholder="e.g. Table 01" maxLength={30} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
              </div>
              <div>
                <label htmlFor="table-capacity" className="mb-1.5 block text-sm font-semibold text-slate-700">Seating Capacity</label>
                <input id="table-capacity" type="number" min="1" max="100" step="1" value={capacity} onChange={(event) => setCapacity(event.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
              </div>
              {editingTable && (
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Table Status</label>
                  <select
                    value={editingTable.isActive ? "active" : "inactive"}
                    onChange={(event) => setEditingTable({ ...editingTable, isActive: event.target.value === "active" })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              )}
              {formError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeModal} disabled={saving} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50">
                  {saving ? <RefreshCw size={15} className="animate-spin" /> : <Plus size={16} />}
                  {saving ? "Saving..." : editingTable ? "Save Changes" : "Create Table"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
