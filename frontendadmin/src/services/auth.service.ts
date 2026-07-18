import api from "./axios";
import { LoginPayload } from "@/types/auth.types";

export const login = async (data: LoginPayload) => {
  const response = await api.post("/auth/login", data);
  return response.data;
};

export const logout = async () => {
  // Backend uses stateless JWTs, so we just clear local state in the UI.
  // No need to hit the backend /auth/logout.
  return Promise.resolve();
};

export const getProfile = async () => {
  // Mock profile or remove if not used, since backend has no /auth/profile
  return Promise.resolve(null);
};
