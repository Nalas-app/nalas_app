import api from "./axios";
import { LoginPayload } from "@/types/auth.types";

export const login = async (data: LoginPayload) => {
  const response = await api.post("/admin/login", data);
  return response.data;
};

export const logout = async () => {
  await api.post("/admin/logout");
};

export const getProfile = async () => {
  const response = await api.get("/admin/profile");
  return response.data;
};
