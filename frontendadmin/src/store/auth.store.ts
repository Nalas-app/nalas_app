import { create } from "zustand";

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  setToken: (token: string, refreshToken?: string) => void;
  logout: () => void;
}

// Helper to set cookie safely
const setCookie = (name: string, value: string, days = 7) => {
  if (typeof window === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
};

// Helper to remove cookie
const removeCookie = (name: string) => {
  if (typeof window === "undefined") return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  refreshToken: typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null,

  setToken: (token, refreshToken) => {
    localStorage.setItem("token", token);
    setCookie("token", token);
    
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
      setCookie("refreshToken", refreshToken);
      set({ token, refreshToken });
    } else {
      set({ token });
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    removeCookie("token");
    removeCookie("refreshToken");
    set({ token: null, refreshToken: null });
    window.location.href = "/";
  },
}));
