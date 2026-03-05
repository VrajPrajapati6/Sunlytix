"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, XCircle } from "lucide-react";

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("Verifying your email...");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("No verification token provided in the URL.");
            return;
        }

        fetch("/api/auth/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
        })
            .then(async (res) => {
                const data = await res.json();
                if (res.ok) {
                    setStatus("success");
                    setMessage(data.message);
                } else {
                    setStatus("error");
                    setMessage(data.error);
                }
            })
            .catch(() => {
                setStatus("error");
                setMessage("An unexpected error occurred during verification.");
            });
    }, [token]);

    return (
        <div className="w-full max-w-md bg-[#121826] border border-[#2A3448] rounded-2xl p-8 shadow-xl text-center">
            {status === "loading" && (
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-16 h-16 bg-[#4F8CFF]/20 rounded-full mb-4"></div>
                    <p className="text-[#E6EAF2]">{message}</p>
                </div>
            )}

            {status === "success" && (
                <>
                    <div className="w-16 h-16 bg-[rgba(0,229,168,0.15)] border border-[#00E5A8]/30 flex items-center justify-center rounded-full mx-auto mb-6">
                        <ShieldCheck className="w-8 h-8 text-[#00E5A8]" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Email Verified!</h2>
                    <p className="text-[#9AA4B2] mb-6">{message}</p>
                    <Link href="/login" className="inline-block w-full bg-[#4F8CFF] hover:bg-[#3A74E6] text-white py-2.5 rounded-lg font-medium transition-colors">
                        Continue to Login
                    </Link>
                </>
            )}

            {status === "error" && (
                <>
                    <div className="w-16 h-16 bg-[#FF4D4F]/10 border border-[#FF4D4F]/20 flex items-center justify-center rounded-full mx-auto mb-6">
                        <XCircle className="w-8 h-8 text-[#FF4D4F]" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Verification Failed</h2>
                    <p className="text-[#9AA4B2] mb-6">{message}</p>
                    <Link href="/login" className="inline-block w-full bg-[#1A2236] text-[#E6EAF2] border border-[#2A3448] hover:bg-[#26314A] py-2.5 rounded-lg font-medium transition-colors">
                        Return to Login
                    </Link>
                </>
            )}
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen bg-[#0B0F19] text-[#E6EAF2] flex items-center justify-center p-4">
            <Suspense fallback={<div className="text-[#9AA4B2]">Loading...</div>}>
                <VerifyEmailContent />
            </Suspense>
        </div>
    );
}
