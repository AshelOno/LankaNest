import { api } from "@/services/http";
import { create } from "zustand";

const getUnreadCount = (notifications) =>
  notifications.filter((notification) => !notification.read).length;

const normalizeNotifications = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.notifications)) return data.notifications;
  return [];
};

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  loading: false,
  error: null,
  lastFetchedAt: null,

  fetchUserNotifications: async (userId, options = {}) => {
    const { force = false, silent = false } = options;

    if (!userId) return [];

    const { lastFetchedAt, notifications } = get();
    const hasFreshData =
      lastFetchedAt && Date.now() - lastFetchedAt < 30000 && notifications.length > 0;

    if (!force && hasFreshData) return notifications;

    if (!silent) {
      set({ isLoading: true, loading: true, error: null });
    }

    try {
      const response = await api.get(`/notifications/user/${userId}`);
      const nextNotifications = normalizeNotifications(response.data);

      set({
        notifications: nextNotifications,
        unreadCount: getUnreadCount(nextNotifications),
        isLoading: false,
        loading: false,
        error: null,
        lastFetchedAt: Date.now(),
      });

      return nextNotifications;
    } catch (error) {
      const message =
        error.userMessage ||
        error.response?.data?.message ||
        "Failed to load notifications";

      set({
        error: message,
        isLoading: false,
        loading: false,
      });

      throw error;
    }
  },

  markNotificationRead: async (notificationId) => {
    if (!notificationId) return;

    const previousNotifications = get().notifications;
    const nextNotifications = previousNotifications.map((notification) =>
      notification._id === notificationId
        ? { ...notification, read: true }
        : notification
    );

    set({
      notifications: nextNotifications,
      unreadCount: getUnreadCount(nextNotifications),
    });

    try {
      await api.patch(`/notifications/${notificationId}/read`);
    } catch (error) {
      set({
        notifications: previousNotifications,
        unreadCount: getUnreadCount(previousNotifications),
      });
      throw error;
    }
  },

  markAsRead: async (notificationId) => get().markNotificationRead(notificationId),
}));

export default useNotificationStore;
