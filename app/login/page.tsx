"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [unverified, setUnverified] = useState(false);
    const [resending, setResending] = useState(false);
    const [resendStatus, setResendStatus] = useState<string | null>(null);

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setUnverified(false);
        setResendStatus(null);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Login failed");
                if (data.unverified) {
                    setUnverified(true);
                }
            } else {
                router.push("/dashboard");
            }
        } catch (err) {
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    }

    async function handleResendVerification() {
        setResending(true);
        setResendStatus(null);
        try {
            const res = await fetch("/api/auth/resend-verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (res.ok) {
                setResendStatus(data.message || "Verification email sent!");
            } else {
                setResendStatus(data.error || "Failed to resend email.");
            }
        } catch (err) {
            setResendStatus("An error occurred. Please try again.");
        } finally {
            setResending(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#0B0F19] text-[#E6EAF2] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8 flex flex-col items-center">
                    <div className="w-12 h-12 bg-[#121826] border border-[#2A3448] flex items-center justify-center rounded-xl mb-4">
                        <Zap className="w-6 h-6 text-[#4F8CFF]" />
                    </div>
                    <h1 className="text-2xl font-bold">Welcome back</h1>
                    <p className="text-[#9AA4B2] mt-2">Sign in to your Sunlytix account</p>
                </div>

                <div className="bg-[#121826] border border-[#2A3448] rounded-2xl p-6 shadow-xl">
                    <form onSubmit={handleLogin} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-[#FF4D4F]/10 border border-[#FF4D4F]/20 text-[#FF4D4F] rounded-lg text-sm flex flex-col gap-2">
                                <span>{error}</span>
                                {unverified && (
                                    <button
                                        type="button"
                                        onClick={handleResendVerification}
                                        disabled={resending}
                                        className="text-[#4F8CFF] hover:text-[#3A74E6] text-xs font-semibold text-left underline underline-offset-4"
                                    >
                                        {resending ? "Sending..." : "Resend verification email"}
                                    </button>
                                )}
                            </div>
                        )}

                        {resendStatus && (
                            <div className="p-3 bg-[#00E5A8]/10 border border-[#00E5A8]/20 text-[#00E5A8] rounded-lg text-sm">
                                {resendStatus}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-[#9AA4B2] mb-1.5">Email address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2.5 bg-[#0B0F19] border border-[#2A3448] rounded-lg text-[#E6EAF2] outline-none focus:ring-[3px] focus:ring-[rgba(79,140,255,0.35)] focus:border-[#4F8CFF] transition-all"
                                placeholder="you@company.com"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-sm font-medium text-[#9AA4B2]">Password</label>
                                <Link href="/forgot-password" className="text-sm text-[#4F8CFF] hover:text-[#3A74E6] transition-colors">
                                    Forgot password?
                                </Link>
                            </div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2.5 bg-[#0B0F19] border border-[#2A3448] rounded-lg text-[#E6EAF2] outline-none focus:ring-[3px] focus:ring-[rgba(79,140,255,0.35)] focus:border-[#4F8CFF] transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#4F8CFF] hover:bg-[#3A74E6] text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 mt-2"
                        >
                            {loading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>

                    <p className="text-center text-sm text-[#9AA4B2] mt-6">
                        Don&apos;t have an account?{" "}
                        <Link href="/signup" className="text-[#4F8CFF] hover:text-[#3A74E6] font-medium transition-colors">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
