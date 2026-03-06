"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  MapPin,
  Clock,
  Wrench,
  Thermometer,
  Activity,
  AlertTriangle,
  ShieldCheck,
  AlertCircle,
  Zap,
} from "lucide-react";
import { TelemetryLineChart } from "@/components/Charts";
import { getInverterById, getInverterTelemetry } from "@/services/api";
import { mockInverters, getMockTelemetry, type Inverter, type TelemetryPoint } from "@/lib/mockData";
import { cn } from "@/lib/utils";

const statusConfig = {
  Healthy: {
    badge: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    icon: ShieldCheck,
    iconColor: "text-green-500",
    ring: "ring-green-200 dark:ring-green-800",
    score: "text-green-600 dark:text-green-400",
  },
  "Medium Risk": {
    badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    icon: AlertCircle,
    iconColor: "text-yellow-500",
    ring: "ring-yellow-200 dark:ring-yellow-800",
    score: "text-yellow-600 dark:text-yellow-400",
  },
  "High Risk": {
    badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    icon: AlertTriangle,
    iconColor: "text-red-500",
    ring: "ring-red-200 dark:ring-red-800",
    score: "text-red-600 dark:text-red-400",
  },
};

export default function InverterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [inverter, setInverter] = useState<Inverter | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"MODULE_TEMPERATURE" | "AC_POWER" | "DC_POWER" | "IRRADIATION" | "AMBIENT_TEMPERATURE">("MODULE_TEMPERATURE");

  useEffect(() => {
    Promise.all([getInverterById(id), getInverterTelemetry(id)])
      .then(([inv, tel]) => {
        setInverter(inv);
        setTelemetry(tel);
      })
      .catch(() => {
        console.warn("API unavailable — using mock data");
        const mock = mockInverters.find((i) => i.id === id) || mockInverters[0];
        setInverter(mock);
        setTelemetry(getMockTelemetry(id));
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Activity className="w-8 h-8 animate-pulse text-primary" />
          <p className="text-sm">Loading inverter data…</p>
        </div>
      </div>
    );
  }

  if (!inverter) {
    return (
      <div className="flex items-center justify-center h-64 flex-col gap-4 text-muted-foreground">
        <Zap className="w-12 h-12 opacity-30" />
        <p className="text-base font-medium">Inverter &quot;{id}&quot; not found.</p>
        <button
          onClick={() => router.push("/inverters")}
          className="text-sm text-primary hover:underline"
        >
          ← Back to Inverters
        </button>
      </div>
    );
  }

  const cfg = statusConfig[inverter.status];
  const StatusIcon = cfg.icon;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* breadcrumb */}
      <button
        onClick={() => router.push("/inverters")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Inverters
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-3 rounded-xl bg-secondary ring-2", cfg.ring)}>
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{inverter.id}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5" />
              {inverter.location}
            </p>
          </div>
        </div>
        <span className={cn("px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 self-start sm:self-auto", cfg.badge)}>
          <StatusIcon className="w-4 h-4" />
          {inverter.status}
        </span>
      </div>

      {/* Inverter Info */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Inverter Info
          </h2>
          <dl className="space-y-3">
            {[
              { label: "Inverter ID", value: inverter.id },
              { label: "Location", value: inverter.location },
              { label: "Status", value: inverter.status },
              { label: "Runtime Hours", value: `${inverter.runtimeHours.toLocaleString()} hrs` },
              { label: "Last Maintenance", value: inverter.lastMaintenance },
              { label: "DC Power", value: `${inverter.DC_POWER} W` },
              { label: "AC Power", value: `${inverter.AC_POWER} W` },
              { label: "Module Temperature", value: `${inverter.MODULE_TEMPERATURE}°C` },
              { label: "Ambient Temperature", value: `${inverter.AMBIENT_TEMPERATURE}°C` },
              { label: "Irradiation", value: `${inverter.IRRADIATION} W/m²` },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="text-sm font-medium text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
      </div>

      {/* Telemetry Charts */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          24-Hour Telemetry
        </h2>
        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b border-border pb-3">
          {(
            [
              { key: "MODULE_TEMPERATURE", label: "Module Temp", icon: Thermometer },
              { key: "AC_POWER", label: "AC Power", icon: Activity },
              { key: "DC_POWER", label: "DC Power", icon: Zap },
              { key: "IRRADIATION", label: "Irradiation", icon: Activity },
            ] as { key: "MODULE_TEMPERATURE" | "AC_POWER" | "DC_POWER" | "IRRADIATION"; label: string; icon: React.ElementType }[]
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                activeTab === key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary"
              )}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>
        <TelemetryLineChart data={telemetry} metric={activeTab} />
      </div>

    </div>
  );
}
