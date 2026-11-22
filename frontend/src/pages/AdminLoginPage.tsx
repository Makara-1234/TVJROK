import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChefHat,
  UserRound,
  LockKeyhole,
  Eye,
  EyeOff,
  LogIn,
  LayoutDashboard,
  ShoppingBag,
  CreditCard,
  Utensils,
  Loader2,
  ArrowUpRight,
} from "lucide-react";
import { authService } from "../services/authService";

export default function AdminLoginPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Please enter your username and password.");
      return;
    }

    try {
      setLoading(true);
      await authService.login(
        { username: username.trim(), password },
        rememberMe
      );
      navigate("/admin", { replace: true });
    } catch (err: any) {
      console.error("Admin login failed:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Invalid username or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { label: "Dashboard", icon: LayoutDashboard },
    { label: "Orders", icon: ShoppingBag },
    { label: "Payments", icon: CreditCard },
    { label: "Products", icon: Utensils },
  ];

  return (
    <main className="min-h-screen w-full overflow-hidden bg-[#fffaf6] lg:grid lg:grid-cols-[minmax(420px,0.92fr)_minmax(560px,1.08fr)]">
      {/* LEFT BRAND PANEL */}
      <section className="relative hidden min-h-screen overflow-hidden bg-[#21150f] text-white lg:flex lg:items-center lg:px-12 xl:px-16 2xl:px-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_15%_15%,rgba(249,115,22,0.30),transparent_42%),radial-gradient(ellipse_at_85%_85%,rgba(194,65,12,0.20),transparent_42%),linear-gradient(135deg,#382115_0%,#21150f_55%,#140f0c_100%)]" />
        <div className="absolute -left-40 top-1/3 h-[460px] w-[460px] rounded-full border border-orange-300/10" />
        <div className="absolute -left-24 top-[38%] h-[330px] w-[330px] rounded-full border border-orange-300/10" />
        <div className="absolute -bottom-48 -right-40 h-[540px] w-[540px] rounded-full bg-orange-500/10 blur-3xl" />

        <div className="relative z-10 w-full max-w-[590px]">
          <div className="flex items-center gap-5">
            <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-[22px] bg-gradient-to-br from-orange-400 to-orange-600 shadow-[0_14px_35px_rgba(249,115,22,0.28)]">
              <ChefHat size={39} strokeWidth={2.1} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white xl:text-5xl">
                TV JROK
              </h1>
              <p className="mt-1 text-base font-medium tracking-wide text-orange-200 xl:text-lg">
                RESTAURANT ADMIN
              </p>
            </div>
          </div>

          <div className="mb-8 mt-12 h-[3px] w-16 rounded-full bg-orange-500" />

          <h2 className="max-w-[540px] text-4xl font-bold leading-[1.18] text-white xl:text-[52px]">
            Manage your restaurant
            <span className="mt-2 block text-orange-400">smarter.</span>
          </h2>

          <p className="mt-6 max-w-[440px] text-base leading-8 text-white/70 xl:text-lg">
            Manage your restaurant, orders, payments and products with one
            simple and powerful platform.
          </p>

          <div className="mt-12 grid grid-cols-4 gap-3">
            {features.map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="group flex min-h-[112px] flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-2 py-5 shadow-sm backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-orange-400/40 hover:bg-white/[0.10]"
              >
                <Icon
                  size={27}
                  strokeWidth={1.8}
                  className="text-orange-300 transition group-hover:text-orange-200"
                />
                <span className="text-xs font-semibold tracking-wide text-white/85">
                  {label}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-14 flex items-center gap-2 text-sm text-white/40">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
            © {new Date().getFullYear()} TV JROK. All rights reserved.
          </div>
        </div>

        <div className="pointer-events-none absolute right-10 top-10 text-orange-300/10">
          <ChefHat size={150} strokeWidth={0.7} />
        </div>
      </section>

      {/* RIGHT LOGIN AREA */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10 sm:px-10 lg:px-12 xl:px-16">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-orange-200/35 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-48 -left-32 h-[520px] w-[520px] rounded-full bg-amber-100/70 blur-[110px]" />
        <div className="pointer-events-none absolute right-12 top-16 h-40 w-40 rounded-full border border-orange-200/40" />
        <div className="pointer-events-none absolute bottom-16 left-10 h-24 w-24 rounded-full border border-orange-200/40" />

        <div className="relative z-10 w-full max-w-[510px]">
          {/* Mobile brand */}


          <div className="mb-8 text-center">
            <div className="mx-auto flex h-[76px] w-[76px] items-center justify-center rounded-[24px] bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-[0_14px_32px_rgba(234,88,12,0.25)]">
              <ChefHat size={42} strokeWidth={2.1} />
            </div>
            <h2 className="mt-6 text-[32px] font-extrabold tracking-tight text-slate-900 sm:text-[38px]">
              TV JROK <span className="text-orange-600">Admin</span>
            </h2>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Welcome back! Sign in to continue.
            </p>
          </div>

          <div className="rounded-[30px] border border-white bg-white/95 p-6 shadow-[0_28px_90px_-35px_rgba(124,45,18,0.25)] sm:p-9 xl:p-10">
            <div className="mb-7">
              <h3 className="text-xl font-bold text-slate-900">
                Sign in to your account
              </h3>
              <p className="mt-1.5 text-sm text-slate-500">
                Enter your admin credentials below.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* USERNAME */}
              <div>
                <label
                  htmlFor="username"
                  className="mb-2.5 block text-sm font-semibold text-slate-800"
                >
                  Username
                </label>
                <div className="flex h-[58px] items-center gap-3 rounded-2xl border border-slate-200 bg-[#fdfdfd] px-4 transition-all duration-200 focus-within:border-orange-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-500/10">
                  <UserRound
                    size={21}
                    className="shrink-0 text-slate-400"
                  />
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    disabled={loading}
                    className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-slate-900 outline-none focus:outline-none focus-visible:outline-none placeholder:text-slate-400 disabled:opacity-60"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2.5 block text-sm font-semibold text-slate-800"
                >
                  Password
                </label>
                <div className="flex h-[58px] items-center gap-3 rounded-2xl border border-slate-200 bg-[#fdfdfd] px-4 transition-all duration-200 focus-within:border-orange-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-500/10">
                  <LockKeyhole
                    size={21}
                    className="shrink-0 text-slate-400"
                  />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={loading}
                    className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-slate-900 outline-none focus:outline-none focus-visible:outline-none placeholder:text-slate-400 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-orange-50 hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2"
                  >
                    {showPassword ? <EyeOff size={21} /> : <Eye size={21} />}
                  </button>
                </div>
              </div>

              {/* REMEMBER / FORGOT */}
              <div className="flex min-h-8 flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-1">
                <label className="inline-flex shrink-0 cursor-pointer items-center gap-2.5 whitespace-nowrap text-sm font-medium text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="h-[17px] w-[17px] cursor-pointer rounded accent-orange-600"
                  />
                  Remember me
                </label>

                <button
                  type="button"
                  onClick={() =>
                    setError(
                      "Please contact your system administrator to reset your password."
                    )
                  }
                  className="whitespace-nowrap text-sm font-semibold text-orange-600 transition hover:text-orange-700 hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
                >
                  {error}
                </div>
              )}

              {/* SIGN IN */}
              <button
                type="submit"
                disabled={loading}
                className="group flex h-[58px] w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-base font-bold text-white shadow-[0_12px_25px_rgba(234,88,12,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:from-orange-600 hover:to-orange-700 hover:shadow-[0_16px_30px_rgba(234,88,12,0.30)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={21} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn size={21} />
                    Sign In
                    <ArrowUpRight
                      size={18}
                      className="ml-1 opacity-70 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 border-t border-slate-100 pt-5 text-center">
              <p className="text-xs leading-5 text-slate-400">
                Secure Admin Access
                <span className="mx-2 text-orange-300">•</span>
                TV JROK Restaurant Management
              </p>
            </div>
          </div>

          <p className="mt-7 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} TV JROK. All rights reserved.
          </p>
        </div>
      </section>
    </main>
  );
}
