import { create } from 'zustand';
import axios from 'axios';
import { notification } from 'antd';
import { getApiUrl } from "@/services/http";

const API_URL = getApiUrl("/api/schedules");

export const useScheduleStore = create((set, get) => ({
    schedules: [],
    loading: false,
    error: null,

    // Add a new schedule
    addSchedule: async (scheduleData) => {
        set({ loading: true, error: null });
        try {
            const response = await axios.post(`${API_URL}/addSchedule`, scheduleData);

            if (response.data) {
                set(state => ({
                    schedules: [...state.schedules, response.data.schedule],
                    loading: false,
                    error: null
                }));

                notification.success({
                    message: "Success",
                    description: "Visit scheduled successfully",
                });

                return response.data;
            }
        } catch (error) {
            console.error("Error adding schedule:", error);
            set({ 
                error: error.response?.data?.message || "Failed to schedule visit", 
                loading: false 
            });

            notification.error({
                message: "Error",
                description: error.response?.data?.message || "Failed to schedule visit",
            });

            throw error;
        }
    },

    // Get schedules for a specific user
    getSchedulesByUserId: async (userId) => {
        set({ loading: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/user/${userId}`);
            
            if (response.data) {
                set({ 
                    schedules: response.data.schedules,
                    loading: false,
                    error: null
                });
                return response.data.schedules;
            }
        } catch (error) {
            console.error("Error fetching schedules:", error);
            set({ 
                error: error.response?.data?.message || "Failed to fetch schedules", 
                loading: false 
            });
            
            notification.error({
                message: "Error",
                description: error.response?.data?.message || "Failed to fetch schedules",
            });
            
            throw error;
        }
    },

    // Get schedules for a specific landlord
    getSchedulesByLandlordId: async (landlordId) => {
        set({ loading: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/landlord/${landlordId}`);
            
            if (response.data) {
                set({ 
                    schedules: response.data.schedules,
                    loading: false,
                    error: null
                });
                return response.data.schedules;
            }
        } catch (error) {
            console.error("Error fetching landlord schedules:", error);
            set({ 
                error: error.response?.data?.message || "Failed to fetch schedules", 
                loading: false 
            });
            
            notification.error({
                message: "Error",
                description: error.response?.data?.message || "Failed to fetch schedules",
            });
            
            throw error;
        }
    },

    // Update schedule status (confirm/reject)
    updateScheduleStatus: async (scheduleId, status) => {
        set({ loading: true, error: null });
        try {
            const response = await axios.patch(`${API_URL}/${scheduleId}/status`, { status });
            
            if (response.data) {
                set(state => ({
                    schedules: state.schedules.map(schedule => 
                        schedule._id === scheduleId ? {...schedule, status} : schedule
                    ),
                    loading: false,
                    error: null
                }));

                let successMessage = '';
                if (status === 'confirmed') {
                    successMessage = 'The scheduled visit has been confirmed successfully.';
                } else if (status === 'rejected') {
                    successMessage = 'The scheduled visit has been rejected successfully.'; 
                }

                notification.success({
                    message: 'Success',
                    description: successMessage
                });

                return response.data;
            }
        } catch (error) {
            console.error(`Error updating schedule status to ${status}:`, error);
            set({ 
                error: error.response?.data?.message || `Failed to update visit status`, 
                loading: false 
            });
            
            notification.error({
                message: 'Error',
                description: error.response?.data?.message || `Failed to update visit status`
            });
            
            throw error;
        }
    },

    // Reset store
    resetSchedules: () => {
        set({ schedules: [], loading: false, error: null });
    }
}));

// For backward compatibility with existing code
const scheduleStore = {
    schedules: [],
    
    addSchedule: async (scheduleData) => {
        return await useScheduleStore.getState().addSchedule(scheduleData);
    },
    
    getSchedulesByUserId: async (userId) => {
        return await useScheduleStore.getState().getSchedulesByUserId(userId);
    }
};

export default scheduleStore;
