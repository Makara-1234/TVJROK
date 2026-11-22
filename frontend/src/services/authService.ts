
import api from "../api/axios";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
  username: string;
}

const TOKEN_KEY = "tvjrok_admin_token";
const USER_KEY = "tvjrok_admin_user";

export const authService = {
  login: async (
    data: LoginRequest,
    rememberMe = true
  ): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>("/auth/login", data);
    const result = response.data;

    if (!result.accessToken) {
      throw new Error("Login response does not contain an access token.");
    }

    authService.logout();

    const storage = rememberMe ? localStorage : sessionStorage;

    storage.setItem(TOKEN_KEY, result.accessToken);
    storage.setItem(USER_KEY, result.username);

    return result;
  },

  getToken: () =>
    localStorage.getItem(TOKEN_KEY) ||
    sessionStorage.getItem(TOKEN_KEY),

  getUsername: () =>
    localStorage.getItem(USER_KEY) ||
    sessionStorage.getItem(USER_KEY),

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  },

  isAuthenticated: () => Boolean(
    localStorage.getItem(TOKEN_KEY) ||
    sessionStorage.getItem(TOKEN_KEY)
  ),
};
