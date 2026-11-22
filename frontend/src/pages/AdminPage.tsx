
import { Navigate } from "react-router-dom";
import App from "../App";
import { authService } from "../services/authService";

export default function AdminPage() {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }

  return <App />;
}
