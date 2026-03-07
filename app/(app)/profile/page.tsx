"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Calendar,
  Clock,
  Shield,
  LogOut,
  Sun,
  Edit3,
  Check,
  X,
  ChevronRight,
  LogIn,
} from "lucide-react";
import { motion } from "framer-motion";
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

/* ── helpers ─────────────────────────────────────────────── */
function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "Never";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
}

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return "Never";
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function InfoRow({
  icon: Icon, label, value, accent,
}: {
  icon: React.ElementType; label: string; value: string; accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-[#1A1A1A] last:border-0">
      <div className="p-2 rounded-lg bg-[#131313] border border-[#1f1f1f] flex-shrink-0">
        <Icon className={cn("w-4 h-4", accent ? "text-[#FF6A00]" : "text-[#A0A0A0]")} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-[#6B7280] uppercase tracking-wider font-medium">{label}</p>
        <p className="text-sm text-white font-medium truncate mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function ProviderBadge({ provider }: { provider: string }) {
  const isGoogle = provider === "google";
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
      isGoogle
        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
        : "bg-[#FF6A00]/10 text-[#FF6A00] border border-[#FF6A00]/20"
    )}>
      {isGoogle ? (
        <svg className="w-3 h-3" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      ) : (
        <Sun className="w-3 h-3" />
      )}
      {isGoogle ? "Google" : "Email & Password"}
    </span>
  );
}

/* ── main component ──────────────────────────────────────── */
export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) { setProfile(data.user); setEditName(data.user.name); }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }

  function startEdit() {
    if (profile) setEditName(profile.name);
    setEditError(null);
    setEditing(true);
  }

  function cancelEdit() { setEditing(false); setEditError(null); }

  async function saveEdit() {
    if (!editName.trim() || editName.trim().length < 2) {
      setEditError("Name must be at least 2 characters"); return;
    }
    setSaving(true); setEditError(null);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      if (res.ok) {
        setProfile((p) => p ? { ...p, name: editName.trim() } : p);
        setEditing(false);
        showToast("Name updated successfully");
      } else {
        const d = await res.json();
        setEditError(d.error || "Failed to update");
      }
    } catch { setEditError("Something went wrong"); }
    finally { setSaving(false); }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  /* ── loading ─── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#FF6A00]/30 border-t-[#FF6A00] rounded-full animate-spin" />
          <p className="text-sm text-[#A0A0A0]">Loading profile…</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <User className="w-12 h-12 text-[#A0A0A0] opacity-40" />
        <p className="text-sm text-[#A0A0A0]">Could not load profile.</p>
        <button onClick={() => router.push("/auth")} className="text-sm text-[#FF6A00] hover:underline">
          Go to Login →
        </button>
      </div>
    );
  }

  /* ── render ─── */
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <User className="w-6 h-6 text-[#FF6A00]" />
          My Profile
        </h1>
        <p className="text-sm text-[#A0A0A0] mt-1">
          Your account details and sign-in information
        </p>
      </div>

      {/* ── Hero card ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="bg-[#111111] border border-[#1f1f1f] rounded-2xl overflow-hidden"
      >
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-[#FF6A00]/30 via-[#FF6A00]/10 to-transparent" />

        {/* Avatar row */}
        <div className="px-6 pb-6 -mt-10 flex items-end justify-between gap-4 flex-wrap">
          <div className="flex items-end gap-4">
            {profile.photoURL ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={profile.photoURL}
                alt={profile.name}
                className="w-20 h-20 rounded-2xl border-4 border-[#111111] object-cover shadow-[0_0_30px_rgba(255,106,0,0.3)]"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FF6A00] to-[#FF4500] flex items-center justify-center text-white text-2xl font-bold shadow-[0_0_30px_rgba(255,106,0,0.4)] border-4 border-[#111111] flex-shrink-0">
                {getInitials(profile.name)}
              </div>
            )}
            <div className="pb-1">
              {editing ? (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                      autoFocus
                      aria-label="Edit full name"
                      placeholder="Your name"
                      className="text-lg font-bold bg-[#1A1A1A] border border-[#FF6A00]/40 text-white px-3 py-1.5 rounded-lg outline-none focus:ring-2 focus:ring-[#FF6A00]/40 focus:border-[#FF6A00] transition-all w-52"
                    />
                    <button onClick={saveEdit} disabled={saving} title="Save name" aria-label="Save name" className="p-1.5 rounded-lg bg-[#FF6A00]/10 hover:bg-[#FF6A00]/20 border border-[#FF6A00]/30 text-[#FF6A00] transition-colors disabled:opacity-50">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={cancelEdit} title="Cancel edit" aria-label="Cancel edit" className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-[#1f1f1f] text-[#A0A0A0] transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {editError && <p className="text-xs text-red-400">{editError}</p>}
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <p className="text-xl font-bold text-white">{profile.name}</p>
                  <button onClick={startEdit} className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-white/10 text-[#A0A0A0] hover:text-white transition-all" title="Edit name">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <div className="mt-1.5">
                <ProviderBadge provider={profile.provider} />
              </div>
            </div>
          </div>

          {!editing && (
            <button
              onClick={startEdit}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] text-[#A0A0A0] hover:text-white hover:border-[#FF6A00]/40 hover:bg-[#FF6A00]/5 text-sm font-medium transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Name
            </button>
          )}
        </div>
      </motion.div>

      {/* ── Account info card ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.08 }}
        className="bg-[#111111] border border-[#1f1f1f] rounded-2xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-[#1A1A1A] flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#FF6A00]/10 border border-[#FF6A00]/20">
            <User className="w-4 h-4 text-[#FF6A00]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Account Information</p>
            <p className="text-[11px] text-[#6B7280]">Details from your sign-up</p>
          </div>
        </div>
        <div className="px-5">
          <InfoRow icon={User}     label="Full Name"       value={profile.name} accent />
          <InfoRow icon={Mail}     label="Email Address"   value={profile.email} />
          <InfoRow icon={Shield}   label="Sign-in Method"  value={profile.provider === "google" ? "Google OAuth" : "Email & Password"} />
          <InfoRow icon={Calendar} label="Member Since"    value={formatDate(profile.createdAt)} />
          <InfoRow icon={Clock}    label="Last Sign-in"    value={formatDateTime(profile.lastLoginAt)} />
        </div>
      </motion.div>

      {/* ── Stats row ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.14 }}
        className="grid grid-cols-3 gap-3"
      >
        {[
          { label: "Role",         value: "Solar Engineer", icon: Sun   },
          { label: "Account Type", value: "Standard",       icon: Shield },
          { label: "Status",       value: "Active",         icon: LogIn  },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-[#111111] border border-[#1f1f1f] rounded-xl px-4 py-4 flex flex-col gap-2">
            <div className="p-1.5 rounded-lg bg-[#FF6A00]/10 w-fit">
              <Icon className="w-4 h-4 text-[#FF6A00]" />
            </div>
            <p className="text-[10px] text-[#6B7280] uppercase tracking-wider font-medium">{label}</p>
            <p className="text-sm font-semibold text-white">{value}</p>
          </div>
        ))}
      </motion.div>

      {/* ── Quick links ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.20 }}
        className="bg-[#111111] border border-[#1f1f1f] rounded-2xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-[#1A1A1A] flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#FF6A00]/10 border border-[#FF6A00]/20">
            <Shield className="w-4 h-4 text-[#FF6A00]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Security & Settings</p>
            <p className="text-[11px] text-[#6B7280]">Manage your account security</p>
          </div>
        </div>
        <div className="p-2">
          {[
            { label: "Account Settings",           desc: "Manage integrations and notifications", href: "/settings" },
            { label: "Change Password",             desc: "Update your sign-in credentials",       href: "/settings" },
            { label: "Notification Preferences",   desc: "Configure alert types and frequency",   href: "/settings" },
          ].map(({ label, desc, href }) => (
            <a key={label} href={href} className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-white/5 transition-colors group">
              <div>
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="text-xs text-[#6B7280]">{desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#A0A0A0] group-hover:text-[#FF6A00] transition-colors flex-shrink-0" />
            </a>
          ))}
        </div>
      </motion.div>

      {/* ── Logout ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.26 }}
      >
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium transition-colors border border-red-500/20 w-full sm:w-auto"
        >
          <LogOut className="w-4 h-4" />
          Log Out of Sunlytix
        </button>
      </motion.div>

      {/* ── Toast ─────────────────────────────────────────────── */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-white text-black px-4 py-3 rounded-xl shadow-2xl text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
          <Check className="w-4 h-4 text-green-600" />
          {toastMsg}
        </div>
      )}
    </div>
  );
}
