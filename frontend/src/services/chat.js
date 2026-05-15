import { io } from "socket.io-client";
import { api, SOCKET_URL } from "@/services/http";

const normalizeRole = (role) => {
  if (role === "landlord" || role === "admin") return role;
  return "student";
};

const withRole = (role, config = {}) => ({
  ...config,
  headers: {
    ...(config.headers || {}),
    "X-Auth-Role": normalizeRole(role),
  },
});

export const connectChatSocket = (role) =>
  io(SOCKET_URL, {
    withCredentials: true,
    auth: { role: normalizeRole(role) },
  });

export async function fetchChatConversations(role, params) {
  const response = await api.get(
    "/chat/conversations",
    withRole(role, { params })
  );
  return Array.isArray(response.data) ? response.data : [];
}

export async function fetchChatMessages(conversationId, role) {
  const response = await api.get(
    `/chat/conversations/${conversationId}/messages`,
    withRole(role)
  );
  return Array.isArray(response.data) ? response.data : [];
}

export async function markConversationRead(conversationId, role) {
  const response = await api.put(
    `/chat/conversations/${conversationId}/read`,
    {},
    withRole(role)
  );
  return response.data;
}

export async function sendChatMessage(conversationId, text, role) {
  const response = await api.post(
    "/chat/messages",
    { conversationId, text },
    withRole(role)
  );
  return response.data;
}

export async function createChatConversation(payload, role) {
  const response = await api.post("/chat/conversations", payload, withRole(role));
  return response.data;
}

export async function fetchChatUnreadCount(role) {
  const response = await api.get("/chat/unread-count", withRole(role));
  return Number(response.data?.unreadCount || 0);
}
