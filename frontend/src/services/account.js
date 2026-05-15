import { api } from "@/services/http";

export async function updateMyProfile(formData) {
  const response = await api.patch("/auth/me", formData);
  return response.data;
}

export async function changeMyPassword(payload) {
  const response = await api.patch("/auth/me/password", payload);
  return response.data;
}

export async function deactivateMyAccount() {
  const response = await api.post("/auth/me/deactivate");
  return response.data;
}

export async function deleteMyAccount(payload) {
  const response = await api.delete("/auth/me", { data: payload });
  return response.data;
}
