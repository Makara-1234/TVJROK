
import { Navigate, Route, Routes } from "react-router-dom";

import AdminPage from "./pages/AdminPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import CustomerPage from "./pages/CustomerPage";
import OrderTrackingPage from "./pages/OrderTrackingPage";

import { authService } from "./services/authService";

export default function AppRouter() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to="/order" replace />}
      />

      <Route
        path="/admin/login"
        element={
          authService.isAuthenticated()
            ? <Navigate to="/admin" replace />
            : <AdminLoginPage />
        }
      />

        <Route path="/admin/login" element={
  authService.isAuthenticated()
    ? <Navigate to="/admin" replace />
    : <AdminLoginPage />
} />
<Route path="/admin" element={<AdminPage />} />

      <Route
        path="/admin"
        element={<AdminPage />}
      />

      <Route
        path="/order"
        element={<CustomerPage />}
      />

      <Route
        path="/order-tracking"
        element={<OrderTrackingPage />}
      />

      <Route
        path="*"
        element={<Navigate to="/order" replace />}
      />
    </Routes>
  );
}
