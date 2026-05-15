import { create } from "zustand";
import axios from "axios";
import { getApiUrl } from "@/services/http";

const API_URL = getApiUrl("/api/auth");

axios.defaults.withCredentials = true;

export const useAdminAuthStore = create((set) => ({
    admin: null,
    isAdminAuthenticated: false,
    error: null,
    isLoading: false,
    isCheckingAdminAuth: true,
    message: null,

    adminSignup: async (email, password, username) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(`${API_URL}/admin/register`, { email, password, username });
            set({ admin: response.data.admin, isAdminAuthenticated: true, isLoading: false });
        } catch (error) {
            set({ error: error.response.data.message || "Error signing up", isLoading: false });
            throw error;
        }
    },

    adminLogin: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(`${API_URL}/admin/login`, 
                { email, password },
                { withCredentials: true }
            );
            
            if (response.data.success) {
                set({
                    isAdminAuthenticated: true,
                    admin: response.data.admin,
                    error: null,
                    isLoading: false,
                });
                return response.data;
            }
        } catch (error) {
            set({ 
                error: error.response?.data?.message || "Error logging in", 
                isLoading: false,
                isAdminAuthenticated: false,
                admin: null
            });
            throw error;
        }
    },

    adminLogout: async () => {
        set({ isLoading: true, error: null });
        try {
            await axios.post(`${API_URL}/admin/logout`);
            set({ 
                admin: null, 
                isAdminAuthenticated: false, 
                error: null, 
                isLoading: false,
                isCheckingAdminAuth: false 
            });
            return true;
        } catch (error) {
            set({ 
                error: "Error logging out", 
                isLoading: false,
                isCheckingAdminAuth: false
            });
            throw error;
        }
    },

    checkAdminAuth: async () => {
        try {
            const response = await axios.get(`${API_URL}/admin/checkAdminAuth`, {
                withCredentials: true
            });
            
            if (response.data && response.data.admin) {
                set({ 
                    admin: response.data.admin, 
                    isAdminAuthenticated: true, 
                    isCheckingAdminAuth: false,
                    error: null 
                });
                return true;
            }
            set({ 
                admin: null, 
                isAdminAuthenticated: false, 
                isCheckingAdminAuth: false,
                error: null 
            });
            return false;
        } catch (error) {
            set({ 
                admin: null,
                isAdminAuthenticated: false, 
                isCheckingAdminAuth: false,
                error: null
            });
            return false;
        }
    }
}));
