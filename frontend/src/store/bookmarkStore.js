import { create } from "zustand";
import axios from "axios";
import { getApiUrl } from "@/services/http";

const API_URL = getApiUrl("/api/bookmark");

export const useBookmarkStore = create((set, get) => ({
  bookmarks: [],
  isLoading: false,
  error: null,

  fetchBookmarks: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_URL}/${userId}`);
      set({ bookmarks: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to fetch bookmarks",
        isLoading: false,
      });
      throw error;
    }
  },

  addBookmark: async (listingId, userId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/addBookMark`, {
        listing: listingId,
        user: userId
      });
      
      // Refresh bookmarks after adding
      await get().fetchBookmarks(userId);
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to add bookmark",
        isLoading: false,
      });
      throw error;
    }
  },

  removeBookmark: async (bookmarkId, userId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.delete(`${API_URL}/${bookmarkId}`);
      
      // Refresh bookmarks after removal
      await get().fetchBookmarks(userId);
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to remove bookmark",
        isLoading: false,
      });
      throw error;
    }
  },

  isListingBookmarked: (listingId) => {
    return get().bookmarks.some(bookmark => bookmark.listing?._id === listingId || bookmark.listing === listingId);
  }
}));
