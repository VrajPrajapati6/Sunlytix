"use client";

import { Bell, Sun, Moon, User, LogOut, Settings as SettingsIcon, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data))
      .catch(() => setUser(null));
  }, []);

  function toggleDark() {
    setDarkMode((d) => !d);
    document.documentElement.classList.toggle("dark");
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  const notifications = [
    { id: 1, text: "INV-21 reached High Risk threshold", time: "5m ago", dot: "bg-red-500" },
    { id: 2, text: "INV-44 thermal anomaly detected", time: "22m ago", dot: "bg-red-500" },
    { id: 3, text: "INV-15 scheduled for maintenance", time: "1h ago", dot: "bg-yellow-500" },
    { id: 4, text: "Daily report is ready", time: "3h ago", dot: "bg-blue-500" },
  ];

  return (
    <header className="h-16 border-b border-border bg-[#121826] flex items-center justify-between px-6 shrink-0 relative z-30">
      {/* Brand */}
      <div className="flex items-center gap-2">
        <Sun className="w-5 h-5 text-primary" />
        <div>
          <span className="font-bold text-sm text-foreground">Sunlytix</span>
          <span className="hidden sm:inline text-xs text-muted-foreground ml-2">
            Predict. Prevent. Power the Sun.
          </span>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Dark mode */}
        <button
          onClick={toggleDark}
          className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-10 z-20 w-80 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-semibold text-foreground">Notifications</p>
                </div>
                <ul className="max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <li
                      key={n.id}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-secondary transition-colors cursor-pointer"
                    >
                      <span className={cn("mt-1.5 w-2 h-2 rounded-full flex-shrink-0", n.dot)} />
                      <div className="min-w-0">
                        <p className="text-sm text-foreground leading-snug">{n.text}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{n.time}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="px-4 py-2 border-t border-border">
                  <button className="text-xs text-primary hover:underline">Mark all as read</button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User profile */}
        <div className="relative ml-1">
          <button
            onClick={() => setProfileOpen((o) => !o)}
            className="flex items-center gap-2 p-1 pl-2 border-l border-border hover:bg-secondary/50 rounded-lg transition-colors group"
          >
            <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-foreground leading-none">
                {user?.name || "Loading..."}
              </p>
              <p className="text-[10px] text-muted-foreground leading-none mt-1">
                {user ? "Authorized Operator" : "Sunlytix User"}
              </p>
            </div>
            <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", profileOpen && "rotate-180")} />
          </button>

          {profileOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
              <div className="absolute right-0 top-12 z-20 w-56 bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-3 border-b border-border bg-secondary/30">
                  <p className="text-sm font-bold text-foreground truncate">{user?.name || "Solar Operator"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email || "operator@sunlytix.com"}</p>
                </div>
                <div className="p-1.5">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      router.push("/settings");
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all"
                  >
                    <SettingsIcon className="w-4 h-4" />
                    Account Settings
                  </button>
                  <div className="h-px bg-border my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#FF4D4F] hover:bg-[#FF4D4F]/10 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
