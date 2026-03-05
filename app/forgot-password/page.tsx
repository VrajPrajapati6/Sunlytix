"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to send reset link");
            } else {
                setSuccess(true);
            }
        } catch {
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    }

    if (success) {
        return (
            <div className="min-h-screen bg-[#0B0F19] text-[#E6EAF2] flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-[#121826] border border-[#2A3448] rounded-2xl p-8 shadow-xl text-center">
                    <div className="w-16 h-16 bg-[#00E5A8]/10 border border-[#00E5A8]/30 flex items-center justify-center rounded-full mx-auto mb-6">
                        <CheckCircle className="w-8 h-8 text-[#00E5A8]" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Check your email</h2>
                    <p className="text-[#9AA4B2] mb-6">
                        If an account exists for <strong>{email}</strong>, we have sent a password reset link.
                    </p>
                    <Link href="/login" className="inline-block w-full bg-[#1A2236] text-[#E6EAF2] border border-[#2A3448] hover:bg-[#26314A] py-2.5 rounded-lg font-medium transition-colors">
                        Return to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0B0F19] text-[#E6EAF2] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8 flex flex-col items-center">
                    <div className="w-12 h-12 bg-[#121826] border border-[#2A3448] flex items-center justify-center rounded-xl mb-4">
                        <KeyRound className="w-6 h-6 text-[#4F8CFF]" />
                    </div>
                    <h1 className="text-2xl font-bold">Forgot password?</h1>
                    <p className="text-[#9AA4B2] mt-2">No worries, we'll send you reset instructions.</p>
                </div>

                <div className="bg-[#121826] border border-[#2A3448] rounded-2xl p-6 shadow-xl">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-[#FF4D4F]/10 border border-[#FF4D4F]/20 text-[#FF4D4F] rounded-lg text-sm">
                                {error}
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

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#4F8CFF] hover:bg-[#3A74E6] text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 mt-4"
                        >
                            {loading ? "Sending..." : "Reset password"}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link href="/login" className="text-sm text-[#9AA4B2] hover:text-[#E6EAF2] transition-colors">
                            ← Back to log in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
