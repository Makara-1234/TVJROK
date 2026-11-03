import { Navigate, Route, Routes } from "react-router-dom";

import AdminPage from "./pages/AdminPage";
import CustomerPage from "./pages/CustomerPage";
import OrderTrackingPage from "./pages/OrderTrackingPage";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/order" replace />} />

      <Route path="/admin" element={<AdminPage />} />

      <Route path="/order" element={<CustomerPage />} />

      <Route path="/order-tracking" element={<OrderTrackingPage />} />

      <Route path="*" element={<Navigate to="/order" replace />} />
    </Routes>
  );
}
