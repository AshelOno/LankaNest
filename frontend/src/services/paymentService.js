import { api } from "./http";

export const paymentService = {
  async getPlans() {
    const { data } = await api.get("/plans");
    return data.plans || [];
  },

  async getMySubscription() {
    const { data } = await api.get("/payments/subscription/me");
    return data.subscription || { planType: "free" };
  },

  async getMyPayments() {
    const { data } = await api.get("/payments/my");
    return data.payments || [];
  },

  async createPayhereOrder({ planCode = "premium", landlordId, email }) {
    const { data } = await api.post("/payments/payhere/subscription-order", {
      planCode,
      landlordId,
      email,
    });
    return data;
  },

  async submitManualPayment({ planCode = "premium", receipt, notes }) {
    const formData = new FormData();
    formData.append("planCode", planCode);
    if (receipt) formData.append("receipt", receipt);
    if (notes) formData.append("notes", notes);

    const { data } = await api.post("/payments/manual", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.payment;
  },

  async adminListPayments(filters = {}) {
    const { data } = await api.get("/admin/payments", { params: filters });
    return data.payments || [];
  },

  async adminListPlans() {
    const { data } = await api.get("/admin/plans");
    return data.plans || [];
  },

  async adminSavePlan(code, payload) {
    const { data } = await api.put(`/admin/plans/${code}`, payload);
    return data.plan;
  },

  async adminListPaymentMethods() {
    const { data } = await api.get("/admin/payment-methods");
    return data.methods || [];
  },

  async adminUpdatePaymentMethod(method, payload) {
    const { data } = await api.patch(`/admin/payment-methods/${method}`, payload);
    return data.method;
  },

  async approveManualPayment(id, reason = "") {
    const { data } = await api.post(`/admin/payments/${id}/approve-manual`, {
      reason,
    });
    return data.payment;
  },

  async rejectManualPayment(id, reason = "") {
    const { data } = await api.post(`/admin/payments/${id}/reject-manual`, {
      reason,
    });
    return data.payment;
  },

  async flagPayment(id, reason = "") {
    const { data } = await api.patch(`/admin/payments/${id}/flag`, { reason });
    return data.payment;
  },

  async refundPayment(id, payload = {}) {
    const { data } = await api.post(`/admin/payments/${id}/refund`, payload);
    return data.payment;
  },
};
