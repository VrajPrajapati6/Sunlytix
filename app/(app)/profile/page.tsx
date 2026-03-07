"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Calendar,
  Clock,
  Shield,
  ChevronLeft,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  provider: string;
  photoURL: string | null;
  createdAt: string;
  lastLoginAt: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then((data) => setUser(data.user))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <User className="w-8 h-8 animate-pulse text-primary" />
          <p className="text-sm">Loading profile…</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center h-64 flex-col gap-4 text-muted-foreground">
        <User className="w-12 h-12 opacity-30" />
        <p className="text-base font-medium">
          {error === "Not authenticated"
            ? "Please log in to view your profile"
            : "Could not load profile"}
        </p>
        <button
          onClick={() => router.push("/auth")}
          className="text-sm text-primary hover:underline"
        >
          Go to Login →
        </button>
      </div>
    );
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <button
        onClick={() => router.push("/dashboard")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      {/* Profile Card */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />

        {/* Avatar + Name */}
        <div className="px-6 -mt-10">
          <div className="flex items-end gap-4">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.name}
                className="w-20 h-20 rounded-xl border-4 border-card object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl border-4 border-card bg-primary/20 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">
                  {initials}
                </span>
              </div>
            )}
            <div className="pb-1">
              <h1 className="text-xl font-bold text-foreground">{user.name}</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: Mail,
                label: "Email",
                value: user.email,
              },
              {
                icon: Shield,
                label: "Auth Provider",
                value:
                  user.provider === "google"
                    ? "Google Account"
                    : "Email & Password",
              },
              {
                icon: Calendar,
                label: "Member Since",
                value: formatDate(user.createdAt),
              },
              {
                icon: Clock,
                label: "Last Login",
                value: formatDate(user.lastLoginAt),
              },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50"
              >
                <Icon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium text-foreground">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Logout */}
          <div className="pt-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 text-sm font-medium transition-colors border border-red-500/20"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
