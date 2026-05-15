import { create } from "zustand";
import axios from "axios";
import { getApiUrl } from "@/services/http";

const API_URL = getApiUrl("/api/auth");

// ✅ Always send cookies
axios.defaults.withCredentials = true;

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  error: null,
  isLoading: false,
  isCheckingAuth: true,
  message: null,
  setUser: (user) =>
    set({
      user,
      isAuthenticated: Boolean(user),
    }),
  clearSession: () =>
    set({
      user: null,
      isAuthenticated: false,
      message: null,
      error: null,
    }),

  // ============================
  // SIGNUP
  // ============================
  signup: async (email, password, username) => {
    set({ isLoading: true, error: null });

    try {
      const { data } = await axios.post(`${API_URL}/signup`, {
        email,
        password,
        username,
      });

      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      });

      return data;
    } catch (error) {
      set({
        error:
          error?.response?.data?.message || "Error signing up",
        isLoading: false,
      });
      throw error;
    }
  },

  // ============================
  // LOGIN
  // ============================
  login: async (email, password) => {
    set({ isLoading: true, error: null });

    try {
      const { data } = await axios.post(`${API_URL}/login`, {
        email,
        password,
      });

      // 🚨 Handle flagged user
      if (data?.user?.isFlagged) {
        set({ isLoading: false });
        return {
          error: true,
          isFlagged: true,
          message:
            "Your account has been suspended. Please contact support.",
        };
      }

      set({
        isAuthenticated: true,
        user: data.user,
        isLoading: false,
      });

      // 🔁 Smart redirect moved to component
      const redirectPath = localStorage.getItem("redirectAfterLogin");

      if (redirectPath) {
        localStorage.removeItem("redirectAfterLogin");
        data.redirectPath = redirectPath;
      }

      return data;
    } catch (error) {
      if (error?.response?.status === 403) {
        set({ isLoading: false });
        return {
          error: true,
          isFlagged: Boolean(error.response.data?.isFlagged),
          accountStatus: error.response.data?.accountStatus || null,
          message: error.response.data.message,
        };
      }

      set({
        error:
          error?.response?.data?.message || "Error logging in",
        isLoading: false,
      });

      throw error;
    }
  },

  // ============================
  // LOGOUT
  // ============================
  logout: async () => {
    set({ isLoading: true, error: null });

    try {
      await axios.post(`${API_URL}/logout`);

      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: "Error logging out",
        isLoading: false,
      });
    }
  },

  // ============================
  // CHECK AUTH (FIXED 🚀)
  // ============================
  checkAuth: async () => {
    set({ isCheckingAuth: true });

    try {
      const { data } = await axios.get(`${API_URL}/check-auth`);

      set({
        user: data.user,
        isAuthenticated: true,
        isCheckingAuth: false,
      });
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isCheckingAuth: false,
      });
    }
  },

  // ============================
  // VERIFY EMAIL
  // ============================
  verifyEmail: async (code) => {
    set({ isLoading: true, error: null });

    try {
      const { data } = await axios.post(
        `${API_URL}/verify-email`,
        { code }
      );

      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      });

      return data;
    } catch (error) {
      set({
        error:
          error?.response?.data?.message ||
          "Error verifying email",
        isLoading: false,
      });
      throw error;
    }
  },

  // ============================
  // FORGOT PASSWORD
  // ============================
  forgotPassword: async (email) => {
    set({ isLoading: true, error: null });

    try {
      const { data } = await axios.post(
        `${API_URL}/forgot-password`,
        { email }
      );

      set({
        message: data.message,
        isLoading: false,
      });

      return data;
    } catch (error) {
      set({
        error:
          error?.response?.data?.message ||
          "Error sending reset email",
        isLoading: false,
      });
      throw error;
    }
  },

  // ============================
  // RESET PASSWORD
  // ============================
  resetPassword: async (code, password) => {
    set({ isLoading: true, error: null });

    try {
      const { data } = await axios.post(
        `${API_URL}/reset-password`,
        { code, password }
      );

      set({
        message: data.message,
        isLoading: false,
      });

      return data;
    } catch (error) {
      set({
        error:
          error?.response?.data?.message ||
          "Error resetting password",
        isLoading: false,
      });
      throw error;
    }
  },
}));
