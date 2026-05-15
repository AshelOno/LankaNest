import { api } from "./http";

export const landlordSignup = {
  step1: async (data) => {
    const response = await api.post("/auth/landlord/signup/step1", data);
    return response.data;
  },
  step2: async (userId, data) => {
    const response = await api.post(`/auth/landlord/signup/step2/${userId}`, data);
    return response.data;
  }
};

export const landlordAuth = {
  signup: landlordSignup,
  signin: async (credentials) => {
    const response = await api.post("/auth/landlord/signin", credentials);
    return response.data;
  }
};
