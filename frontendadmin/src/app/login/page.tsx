"use client";

import Image from "next/image";
import { useForm } from "react-hook-form";
import { login } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { LoginPayload } from "@/types/auth.types";
import theme from "@/utils/theme";

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

    const onSubmit = async (data: LoginPayload) => {
        setIsLoading(true);
        setError("");

        try {
            // Hardcoded test credentials
            if (
                data.email === "testing@gmail.com" &&
                data.password === "testing@54321"
            ) {
                const fakeToken = "fake-token-for-testing";

                // Set cookie
                document.cookie = `token=${fakeToken}; path=/; max-age=86400`;

                // Optional: also store in Zustand if needed
                setToken(fakeToken);

                router.push("/dashboard");
            } else {
                setError("Invalid credentials");
            }
        } catch (err: any) {
            setError("Login failed");
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
                                    className="w-full px-4 py-3 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none transition-all"
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
                                <input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none transition-all"
                                    style={{
                                        background: "rgba(255,255,255,0.08)",
                                        border: errors.password ? "1px solid #f87171" : "1px solid rgba(255,255,255,0.15)",
                                    }}
                                    {...register("password", {
                                        required: "Password is required",
                                        minLength: { value: 6, message: "Password must be at least 6 characters" }
                                    })}
                                />
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
