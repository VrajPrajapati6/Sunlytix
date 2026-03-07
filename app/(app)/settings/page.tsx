"use client";

import { useState } from "react";
import {
  Settings,
  Upload,
  Plug,
  Database,
  CheckCircle,
  Wifi,
  FileSpreadsheet,
  Bell,
  Shield,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface ToastState {
  show: boolean;
  message: string;
}

function SettingSection({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function StatusBadge({ connected }: { connected: boolean }) {
  return (
    <span
      className={cn(
        "px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5",
        connected
          ? "bg-[rgba(0,229,168,0.15)] text-[#00E5A8]"
          : "bg-[rgba(255,176,32,0.15)] text-[#FFB020]"
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", connected ? "bg-[#00E5A8]" : "bg-[#FFB020]")} />
      {connected ? "Connected" : "Not Connected"}
    </span>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [scadaConnected, setScadaConnected] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({ show: false, message: "" });
  const [apiKey, setApiKey] = useState("");
  const [scadaUrl, setScadaUrl] = useState("");
  const [notifications, setNotifications] = useState({
    highRisk: true,
    mediumRisk: true,
    maintenance: false,
    reports: true,
  });

  function showToast(message: string) {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  }

  function handleScadaConnect() {
    if (!scadaUrl) { showToast("Please enter a SCADA endpoint URL"); return; }
    setTimeout(() => {
      setScadaConnected(true);
      showToast("SCADA API connected successfully (mock)");
    }, 1200);
  }

  function handleApiConnect() {
    if (!apiKey) { showToast("Please enter an API key"); return; }
    setTimeout(() => {
      setApiConnected(true);
      showToast("Backend API connected successfully (mock)");
    }, 1000);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setUploadMsg(`Processing "${file.name}"…`);
      setTimeout(() => {
        setUploadMsg(`✓ "${file.name}" uploaded successfully — ${(file.size / 1024).toFixed(1)} KB`);
        showToast("Telemetry data uploaded (mock)");
      }, 1500);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto px-4 lg:px-6 py-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure integrations, data sources, and notification preferences
        </p>
      </div>

      {/* CSV Upload */}
      <SettingSection
        title="CSV Data Upload"
        description="Upload historical telemetry data in CSV format"
        icon={FileSpreadsheet}
      >
        <div className="space-y-4">
          <div className="bg-[#121826] border-2 border-dashed border-[#2A3448] rounded-xl p-8 text-center hover:border-[#FF6A00] transition-colors">
            <Upload className="w-8 h-8 text-[#9AA4B2] mx-auto mb-3" />
            <p className="text-sm text-[#E6EAF2] font-medium">Drop CSV file here or click to browse</p>
            <p className="text-xs text-[#6B7280] mt-1">
              Supports: inverter_id, timestamp, temperature, efficiency, power_output, voltage
            </p>
            <label className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />
              Upload Telemetry Data
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>
          {uploadMsg && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              {uploadMsg}
            </p>
          )}
          <div className="bg-secondary rounded-lg p-3">
            <p className="text-xs font-semibold text-foreground mb-1">Expected CSV format:</p>
            <code className="text-xs text-muted-foreground font-mono">
              inverter_id,timestamp,temperature,efficiency,power_output,voltage,current,alarm_count
            </code>
          </div>
        </div>
      </SettingSection>

      {/* SCADA Integration */}
      <SettingSection
        title="SCADA Integration"
        description="Connect to your SCADA system for real-time telemetry"
        icon={Wifi}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Connection Status</p>
            <StatusBadge connected={scadaConnected} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              SCADA Endpoint URL
            </label>
            <input
              type="text"
              value={scadaUrl}
              onChange={(e) => setScadaUrl(e.target.value)}
              placeholder="https://scada.yourplant.com/api/v1"
              className="w-full px-4 py-2.5 text-sm bg-[#121826] border border-[#2A3448] text-[#E6EAF2] placeholder:text-[#6B7280] rounded-lg outline-none focus:ring-[3px] focus:ring-[rgba(255,106,0,0.35)] focus:border-[#FF6A00] transition-all duration-200"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              Authentication Token
            </label>
            <input
              type="password"
              placeholder="Bearer token or API key"
              className="w-full px-4 py-2.5 text-sm bg-[#121826] border border-[#2A3448] text-[#E6EAF2] placeholder:text-[#6B7280] rounded-lg outline-none focus:ring-[3px] focus:ring-[rgba(255,106,0,0.35)] focus:border-[#FF6A00] transition-all duration-200"
            />
          </div>
          <button
            onClick={handleScadaConnect}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            <Plug className="w-4 h-4" />
            Connect SCADA API
          </button>
        </div>
      </SettingSection>

      {/* Backend API */}
      <SettingSection
        title="Backend API Connection"
        description="Connect to the Sunlytix backend API"
        icon={Database}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">API Status</p>
            <StatusBadge connected={apiConnected} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              API Base URL
            </label>
            <input
              type="text"
              defaultValue="https://api.sunlytix.io/v1"
              className="w-full px-4 py-2.5 text-sm bg-[#121826] border border-[#2A3448] text-[#E6EAF2] rounded-lg outline-none focus:ring-[3px] focus:ring-[rgba(255,106,0,0.35)] focus:border-[#FF6A00] transition-all duration-200"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-sunlytix-xxxxxxxxxxxx"
              className="w-full px-4 py-2.5 text-sm bg-[#121826] border border-[#2A3448] text-[#E6EAF2] placeholder:text-[#6B7280] rounded-lg outline-none focus:ring-[3px] focus:ring-[rgba(255,106,0,0.35)] focus:border-[#FF6A00] transition-all duration-200"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleApiConnect}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Connect API
            </button>
            <button
              onClick={() => showToast("Connection test initiated (mock)")}
              className="flex items-center gap-2 px-4 py-2 bg-[#1A2236] text-[#E6EAF2] border border-[#2A3448] rounded-lg text-sm font-medium hover:bg-[#26314A] transition-colors"
            >
              Test Connection
            </button>
          </div>
        </div>
      </SettingSection>

      {/* Notifications */}
      <SettingSection
        title="Notification Preferences"
        description="Configure which alerts you want to receive"
        icon={Bell}
      >
        <div className="space-y-3">
          {(
            [
              { key: "highRisk", label: "High Risk Alerts", desc: "Immediate alerts for high-risk inverters" },
              { key: "mediumRisk", label: "Medium Risk Warnings", desc: "Warnings for medium-risk inverters" },
              { key: "maintenance", label: "Maintenance Reminders", desc: "Scheduled maintenance notifications" },
              { key: "reports", label: "Daily Reports", desc: "Daily plant performance summary" },
            ] as { key: keyof typeof notifications; label: string; desc: string }[]
          ).map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <button
                onClick={() => setNotifications((n) => ({ ...n, [key]: !n[key] }))}
                className={cn(
                  "relative w-10 h-5 rounded-full transition-colors",
                  notifications[key] ? "bg-primary" : "bg-secondary border border-border"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                    notifications[key] ? "translate-x-5" : "translate-x-0.5"
                  )}
                />
              </button>
            </div>
          ))}
        </div>
      </SettingSection>

      {/* Security */}
      <SettingSection
        title="Security & Access"
        description="Manage user roles and security settings"
        icon={Shield}
      >
        <div className="space-y-2">
          {["Change Password", "Two-Factor Authentication", "API Access Tokens", "Audit Log"].map((item) => (
            <button
              key={item}
              onClick={() => showToast(`${item} — coming in backend integration`)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-secondary transition-colors text-sm text-foreground"
            >
              <span>{item}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
          <div className="h-px bg-border my-2" />
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-[#FF4D4F]/10 hover:bg-[#FF4D4F]/20 transition-colors text-sm text-[#FF4D4F] border border-[#FF4D4F]/20"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-4 h-4" />
              <span className="font-semibold">Log Out of Sunlytix</span>
            </div>
          </button>
        </div>
      </SettingSection>

      {/* Toast */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 bg-foreground text-background px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle className="w-4 h-4" />
          {toast.message}
        </div>
      )}
    </div>
  );
}
