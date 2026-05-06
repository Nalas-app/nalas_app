"use client";

import Image from "next/image";
import { useForm } from "react-hook-form";
import { login } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { LoginPayload } from "@/types/auth.types";
import theme from "@/utils/theme";
import { getErrorMessage } from "@/utils/errorHandler";

function LoginForm() {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginPayload>();
    const setToken = useAuthStore((state) => state.setToken);
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const onSubmit = async (data: LoginPayload) => {
        setIsLoading(true);
        setError("");

        try {
            const response = await login(data);
            
            // The backend returns { success: true, data: { user, token } }
            // Since auth.service returns response.data, the structure here is { success, data, message }
            const payload = response.data || response; // Fallback just in case
            
            const token = payload.token || payload.accessToken;
            const refreshToken = payload.refreshToken;
            if (payload && token) {
                // Ensure only admins can login to the admin UI
                if (payload.user?.role !== "admin" && payload.user?.role !== "super_admin") {
                    setError("Access denied: You do not have administrative privileges.");
                    setIsLoading(false);
                    return;
                }

                // Store token in Zustand and localStorage/cookie
                setToken(token, refreshToken);
                
                // Redirect to dashboard
                router.push("/dashboard");
            } else {
                setError("Invalid response from server. Missing token.");
            }
        } catch (err: unknown) {
            const errorMessage = getErrorMessage(err, "Login failed. Please check your credentials.");
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="flex items-center justify-center min-h-screen relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${theme.loginBgFrom} 0%, ${theme.loginBgVia} 50%, ${theme.loginBgTo} 100%)` }}
        >
            {/* Decorative blobs */}
            <div className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-10 pointer-events-none"
                style={{ background: theme.primary, filter: "blur(60px)", transform: "translate(-30%, -30%)" }} />
            <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-10 pointer-events-none"
                style={{ background: theme.primaryDark, filter: "blur(80px)", transform: "translate(30%, 30%)" }} />

            <div className="relative w-full max-w-md mx-4">
                <div className="rounded-2xl shadow-2xl overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.12)" }}>

                    {/* Header */}
                    <div className="px-8 pt-10 pb-6 text-center" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                        <Image src="/Magilam Foods Logo.jpeg" alt="Nalas Logo" width={120} height={60} className="mx-auto mb-4 object-contain" />

                        <h1 className="text-2xl font-extrabold text-black tracking-wide">Admin Login</h1>

                    </div>

                    {/* Form */}
                    <div className="px-8 py-8">
                        {error && (
                            <div className="rounded-lg p-3 mb-5 text-sm"
                                style={{ background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.4)", color: "#fca5a5" }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            <div>
                                <label htmlFor="email" className="block text-xs font-semibold mb-1.5 uppercase tracking-widest"
                                    style={{ color: theme.primarySoft }}>
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="admin@nalas.com"
                                    className="w-full px-4 py-3 rounded-lg  text-sm placeholder-gray-500 focus:outline-none transition-all text-gray-900 bg-white"
                                    style={{
                                        background: "rgba(255,255,255,0.08)",
                                        border: errors.email ? "1px solid #f87171" : "1px solid rgba(255,255,255,0.15)",
                                    }}
                                    {...register("email", {
                                        required: "Email is required",
                                        pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Invalid email address" }
                                    })}
                                />
                                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-xs font-semibold mb-1.5 uppercase tracking-widest"
                                    style={{ color: theme.primarySoft }}>
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className="w-full pl-4 pr-12 py-3 rounded-lg  text-sm placeholder-gray-500 focus:outline-none transition-all text-gray-900 bg-white"
                                        style={{
                                            background: "rgba(255,255,255,0.08)",
                                            border: errors.password ? "1px solid #f87171" : "1px solid rgba(255,255,255,0.15)",
                                        }}
                                        {...register("password", {
                                            required: "Password is required",
                                            minLength: { value: 6, message: "Password must be at least 6 characters" }
                                        })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        ) : (
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex items-center justify-center py-3 px-4 rounded-lg text-sm font-bold text-white transition-all duration-200 mt-2"
                                style={{
                                    background: isLoading
                                        ? `rgba(224,123,57,0.5)`
                                        : `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
                                    cursor: isLoading ? "not-allowed" : "pointer",
                                    boxShadow: `0 4px 20px ${theme.primaryDark}66`,
                                }}
                            >
                                {isLoading && (
                                    <svg className="animate-spin mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                )}
                                {isLoading ? "Signing in..." : "Sign In"}
                            </button>
                        </form>
                    </div>
                </div>

                <p className="text-center text-xs mt-6" style={{ color: "rgba(255,255,255,0.3)" }}>
                    © {new Date().getFullYear()} Nala&apos;s Restaurant. All rights reserved.
                </p>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black" />}>
            <LoginForm />
        </Suspense>
    );
}
