import { api } from "@/services/http";

const withStudentRole = {
  headers: {
    "X-Auth-Role": "student",
  },
};

export async function fetchStudentNotifications(userId) {
  const response = await api.get(`/notifications/user/${userId}`, withStudentRole);
  return Array.isArray(response.data?.notifications) ? response.data.notifications : [];
}

export async function markStudentNotificationRead(notificationId) {
  const response = await api.patch(
    `/notifications/${notificationId}/read`,
    {},
    withStudentRole
  );
  return response.data;
}
