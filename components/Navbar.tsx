"use client";

import { Bell, Sun, Moon, User } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  function toggleDark() {
    setDarkMode((d) => !d);
    document.documentElement.classList.toggle("dark");
  }

  const notifications = [
    { id: 1, text: "INV-21 reached High Risk threshold", time: "5m ago", dot: "bg-red-500" },
    { id: 2, text: "INV-44 thermal anomaly detected", time: "22m ago", dot: "bg-red-500" },
    { id: 3, text: "INV-15 scheduled for maintenance", time: "1h ago", dot: "bg-yellow-500" },
    { id: 4, text: "Daily report is ready", time: "3h ago", dot: "bg-blue-500" },
  ];

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
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

        {/* User avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-border ml-1">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
            <User className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-foreground leading-none">Admin</p>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Plant Operator</p>
          </div>
        </div>
      </div>
    </header>
  );
}
