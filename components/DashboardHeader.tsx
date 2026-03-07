"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  User,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Zap,
  BrainCircuit,
  MessageSquare,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inverters", label: "Inverters", icon: Zap },
  { href: "/insights", label: "AI Insights", icon: BrainCircuit },
  { href: "/assistant", label: "AI Assistant", icon: MessageSquare },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function DashboardHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data?.user || null))
      .catch(() => setUser(null));
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  const notifications = [
    { id: 1, text: "INV-03 thermal anomaly — inverter temp 68°C", time: "5m ago", severity: "high" as const },
    { id: 2, text: "INV-05 alarm code triggered in Plant 3", time: "22m ago", severity: "high" as const },
    { id: 3, text: "INV-01 rolling power deviation detected", time: "1h ago", severity: "medium" as const },
    { id: 4, text: "Daily energy report ready — 3 plants", time: "3h ago", severity: "low" as const },
  ];

  const severityDot = {
    high: "bg-red-500",
    medium: "bg-[#FF6A00]",
    low: "bg-blue-500",
  };

  return (
    <>
      <header className="h-16 bg-black border-b border-glow-orange flex items-center justify-between px-4 lg:px-6 shrink-0 relative z-50">
        {/* Left — Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 flex-shrink-0">
          <Image
            src="/favicon.png"
            alt="Sunlytix Logo"
            width={36}
            height={36}
            className="rounded-lg"
          />
          <div className="hidden sm:block">
            <p className="font-bold text-sm text-white leading-tight tracking-tight">Sunlytix</p>
            <p className="text-[10px] text-[#A0A0A0] leading-tight">Predict. Prevent. Power the Sun.</p>
          </div>
        </Link>

        {/* Center — Navigation (desktop) */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-[#FF6A00]/15 text-[#FF6A00] shadow-[0_0_15px_rgba(255,106,0,0.15)]"
                    : "text-[#A0A0A0] hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right — Actions */}
        <div className="flex items-center gap-1.5">
          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen((o) => !o)}
              className="relative p-2 rounded-lg hover:bg-white/5 transition-colors text-[#A0A0A0] hover:text-white"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF6A00] animate-pulse-orange" />
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-11 z-50 w-80 bg-[#111111] border border-[#1f1f1f] rounded-xl shadow-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-[#1f1f1f] flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">Notifications</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF6A00]/15 text-[#FF6A00] font-medium">
                    {notifications.length} new
                  </span>
                </div>
                <ul className="max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <li
                      key={n.id}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer border-b border-[#1f1f1f]/50 last:border-0"
                    >
                      <span className={cn("mt-1.5 w-2 h-2 rounded-full flex-shrink-0", severityDot[n.severity])} />
                      <div className="min-w-0">
                        <p className="text-sm text-white leading-snug">{n.text}</p>
                        <p className="text-xs text-[#A0A0A0] mt-0.5">{n.time}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="px-4 py-2.5 border-t border-[#1f1f1f]">
                  <button className="text-xs text-[#FF6A00] hover:text-[#FFA94D] transition-colors font-medium">
                    Mark all as read
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative ml-1" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((o) => !o)}
              className="flex items-center gap-2 p-1.5 pl-3 hover:bg-white/5 rounded-lg transition-colors group"
            >
              <div className="w-7 h-7 rounded-full bg-[#FF6A00]/20 border border-[#FF6A00]/30 flex items-center justify-center">
                <User className="w-4 h-4 text-[#FF6A00]" />
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-white leading-none">{user?.name || "Operator"}</p>
                <p className="text-[10px] text-[#A0A0A0] leading-none mt-0.5">Solar Engineer</p>
              </div>
              <ChevronDown className={cn("w-3.5 h-3.5 text-[#A0A0A0] transition-transform", profileOpen && "rotate-180")} />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-12 z-50 w-56 bg-[#111111] border border-[#1f1f1f] rounded-xl shadow-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-[#1f1f1f] bg-[#0a0a0a]">
                  <p className="text-sm font-bold text-white truncate">{user?.name || "Solar Operator"}</p>
                  <p className="text-xs text-[#A0A0A0] truncate">{user?.email || "operator@sunlytix.com"}</p>
                </div>
                <div className="p-1.5">
                  <button
                    onClick={() => { setProfileOpen(false); router.push("/profile"); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#A0A0A0] hover:text-white hover:bg-white/5 transition-all"
                  >
                    <User className="w-4 h-4" />
                    My Profile
                  </button>
                  <div className="h-px bg-[#1f1f1f] my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden p-2 rounded-lg hover:bg-white/5 text-[#A0A0A0] hover:text-white transition-colors ml-1"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile navigation */}
      {mobileOpen && (
        <div className="md:hidden bg-black border-b border-[#1f1f1f] px-4 py-3 z-40">
          <nav className="flex flex-col gap-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "bg-[#FF6A00]/15 text-[#FF6A00]"
                      : "text-[#A0A0A0] hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}
