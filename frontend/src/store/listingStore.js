import axios from 'axios';
import { create } from 'zustand';
import { getApiUrl } from '@/services/http';

const API_URL = getApiUrl("/api/listings");

// Keep the original addListing export
export const addListing = async (formData) => {
    try {
        const response = await axios.post(`${API_URL}/add-listing`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            withCredentials: true,
        });
        return response.data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

// Separate store for fetching listings
const useListingStore = create((set) => ({
    listings: [],
    popularListings: [],
    landlordListings: [],
    loading: false,
    error: null,
    currentListing: null,

    fetchAllListings: async () => {
        set({ loading: true });
        try {
            const response = await axios.get(API_URL, {
                withCredentials: true,
            });
            set({ listings: response.data, loading: false, error: null });
        } catch (error) {
            console.error('Error fetching listings:', error);
            set({ error: error.message, loading: false });
        }
    },

    getListingById: async (id) => {
        set({ loading: true });
        try {
            const response = await axios.get(`${API_URL}/${id}`, {
                withCredentials: true,
            });
            set({ currentListing: response.data, loading: false, error: null });
            return response.data;
        } catch (error) {
            console.error('Error fetching listing:', error);
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    fetchPopularListings: async (limit = 5) => {
        set({ loading: true });
        try {
            const response = await axios.get(`${API_URL}/popular`, {
                params: { limit },
                withCredentials: true,
            });
            set({ popularListings: response.data, loading: false, error: null });
            return response.data;
        } catch (error) {
            console.error('Error fetching popular listings:', error);
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    fetchLandlordListings: async (landlordId, limit = 0, updateState = true) => {
        if (updateState) {
            set({ loading: true });
        }
        
        try {
            const response = await axios.get(`${API_URL}/landlord/${landlordId}`, {
                params: { limit },
                withCredentials: true,
            });
            
            if (updateState) {
                set({ landlordListings: response.data, loading: false, error: null });
            }
            
            return response.data;
        } catch (error) {
            console.error('Error fetching landlord listings:', error);
            
            if (updateState) {
                set({ error: error.message, loading: false });
            }
            
            throw error;
        }
    },

    trackListingClick: async (listingId) => {
        try {
            const response = await axios.post(`${API_URL}/${listingId}/track-click`);
            return response.data; // Return the response so we can access the updated view count
        } catch (error) {
            console.error('Error tracking click:', error);
        }
    },
}));

export default useListingStore;
