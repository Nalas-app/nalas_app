import api from "./axios";
import { LoginPayload } from "@/types/auth.types";

export const login = async (data: LoginPayload) => {
  const response = await api.post("/auth/login", data);
  return response.data;
};

export const logout = async () => {
  await api.post("/auth/logout");
};

export const getProfile = async () => {
  const response = await api.get("/auth/profile");
  return response.data;
};
