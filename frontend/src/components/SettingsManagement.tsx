
import { useEffect, useState } from "react";
import {
  Store,
  Clock,
  Globe,
  Save,
  RefreshCw,
  Phone,
  MapPin,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import settingsService from "../services/settingsService";
import type {
  RestaurantSettings,
  UpdateRestaurantSettings,
} from "../services/settingsService";

export default function SettingsManagement() {
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await settingsService.getSettings();
      setSettings(data);
    } catch (err) {
      console.error("Load settings failed:", err);
      setError("Unable to load restaurant settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (
    field: keyof UpdateRestaurantSettings,
    value: string | boolean | null
  ) => {
    setSettings((current) =>
      current ? { ...current, [field]: value } : current
    );
    setSuccess("");
    setError("");
  };

  const handleSave = async () => {
    if (!settings) return;

    if (!settings.restaurantName.trim()) {
      setError("Restaurant name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

const payload: UpdateRestaurantSettings = {
  restaurantName: settings.restaurantName.trim(),
  phoneNumber: settings.phoneNumber.trim(),
  address: settings.address.trim(),
  logoUrl: settings.logoUrl,
  khqrImageUrl: settings.khqrImageUrl,
  currencyCode: settings.currencyCode,
  openingTime: settings.openingTime,
  closingTime: settings.closingTime,
  isOpen: settings.isOpen,
};

      const updated = await settingsService.updateSettings(payload);
      setSettings(updated);
      setSuccess("Restaurant settings saved successfully.");
    } catch (err) {
      console.error("Save settings failed:", err);
      setError("Unable to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100";

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <RefreshCw className="animate-spin text-orange-500" size={28} />
        <span className="ml-3 text-sm text-slate-500">
          Loading settings...
        </span>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-6 md:p-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-600">
          {error || "Settings are unavailable."}
          <button
            type="button"
            onClick={loadSettings}
            className="ml-3 font-semibold underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-5 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Restaurant Settings
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage your restaurant information and business preferences.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
        >
          <Save size={17} />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {success && (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
            <Store size={21} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">
              Restaurant Information
            </h3>
            <p className="text-xs text-slate-400">
              Basic information about your restaurant.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Restaurant Name *
            </label>
            <input
              className={inputClass}
              value={settings.restaurantName}
              onChange={(e) =>
                handleChange("restaurantName", e.target.value)
              }
              placeholder="Enter restaurant name"
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              <Phone size={15} /> Phone Number
            </label>
            <input
              className={inputClass}
              value={settings.phoneNumber}
              onChange={(e) =>
                handleChange("phoneNumber", e.target.value)
              }
              placeholder="Enter phone number"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              <MapPin size={15} /> Restaurant Address
            </label>
            <textarea
              className={inputClass}
              rows={3}
              value={settings.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Enter restaurant address"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              <ImageIcon size={15} /> Logo URL
            </label>
            <input
              className={inputClass}
              value={settings.logoUrl ?? ""}
              onChange={(e) =>
                handleChange("logoUrl", e.target.value || null)
              }
              placeholder="Enter restaurant logo URL"
            />
            <p className="mt-2 text-xs text-slate-400">
              Enter an image URL. File upload can be added separately.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <Clock size={21} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Business Hours</h3>
            <p className="text-xs text-slate-400">
              Set your restaurant operating hours.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Opening Time
            </label>
            <input
              type="time"
              className={inputClass}
              value={settings.openingTime}
              onChange={(e) =>
                handleChange("openingTime", e.target.value)
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Closing Time
            </label>
            <input
              type="time"
              className={inputClass}
              value={settings.closingTime}
              onChange={(e) =>
                handleChange("closingTime", e.target.value)
              }
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Restaurant Status
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {settings.isOpen
                ? "Your restaurant is currently open."
                : "Your restaurant is currently closed."}
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={settings.isOpen}
            onClick={() => handleChange("isOpen", !settings.isOpen)}
            className={`relative h-7 w-12 rounded-full transition ${
              settings.isOpen ? "bg-green-500" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                settings.isOpen ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
            <Globe size={21} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Regional Settings</h3>
            <p className="text-xs text-slate-400">
              Configure your restaurant currency.
            </p>
          </div>
        </div>

        <div className="max-w-md">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Currency
          </label>
          <select
            className={inputClass}
            value={settings.currencyCode}
            onChange={(e) =>
              handleChange("currencyCode", e.target.value)
            }
          >
            <option value="USD">USD - US Dollar ($)</option>
            <option value="KHR">KHR - Cambodian Riel (៛)</option>
          </select>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
        >
          <Save size={17} />
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
