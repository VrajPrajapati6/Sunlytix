"use client";

import { useEffect, useState } from "react";
import { Zap, ShieldCheck, AlertTriangle, AlertCircle, Activity } from "lucide-react";
import MetricCard from "@/components/MetricCard";
import { RiskDistributionChart, PowerTrendChart, TempTrendChart } from "@/components/Charts";
import { getInverters } from "@/services/api";
import { mockInverters, mockPowerTrend, mockTempTrend, type Inverter } from "@/lib/mockData";

export default function DashboardPage() {
  const [inverters, setInverters] = useState<Inverter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInverters()
      .then((data) => {
        setInverters(data.length > 0 ? data : mockInverters);
      })
      .catch(() => {
        console.warn("API unavailable — using mock data");
        setInverters(mockInverters);
      })
      .finally(() => setLoading(false));
  }, []);

  const healthy = inverters.filter((i) => i.status === "Healthy").length;
  const medium = inverters.filter((i) => i.status === "Medium Risk").length;
  const high = inverters.filter((i) => i.status === "High Risk").length;
  const total = inverters.length;

  const avgConvEff =
    inverters.length > 0
      ? (
          (inverters.reduce((sum, i) => sum + (i.DC_POWER > 0 ? i.AC_POWER / i.DC_POWER : 0), 0) /
            inverters.length) *
          100
        ).toFixed(1)
      : "—";
  const totalACPower =
    inverters.length > 0
      ? (inverters.reduce((sum, i) => sum + i.AC_POWER, 0) / 1000).toFixed(1)
      : "—";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Activity className="w-8 h-8 animate-pulse text-primary" />
          <p className="text-sm">Loading plant data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Plant Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time AI monitoring dashboard — {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Inverters"
          value={total}
          subtitle="Across 4 blocks"
          icon={Zap}
          variant="default"
        />
        <MetricCard
          title="Healthy Inverters"
          value={healthy}
          subtitle={`${((healthy / total) * 100).toFixed(0)}% of fleet`}
          icon={ShieldCheck}
          variant="healthy"
          trend={{ value: "Operating normally", positive: true }}
        />
        <MetricCard
          title="Medium Risk"
          value={medium}
          subtitle="Monitoring closely"
          icon={AlertCircle}
          variant="medium"
          trend={{ value: "Schedule maintenance", positive: false }}
        />
        <MetricCard
          title="High Risk"
          value={high}
          subtitle="Immediate action required"
          icon={AlertTriangle}
          variant="high"
          trend={{ value: "Inspect immediately", positive: false }}
        />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Avg DC→AC Efficiency</p>
          <p className="text-3xl font-bold text-foreground mt-2">{avgConvEff}%</p>
          <p className="text-xs text-muted-foreground mt-1">AC / DC power ratio across fleet</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total AC Output</p>
          <p className="text-3xl font-bold text-foreground mt-2">{totalACPower} kW</p>
          <p className="text-xs text-muted-foreground mt-1">Sum of AC_POWER across all inverters</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">AI Risk Alerts</p>
          <p className="text-3xl font-bold text-red-500 mt-2">{high + medium}</p>
          <p className="text-xs text-muted-foreground mt-1">{high} critical · {medium} warnings</p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Risk distribution */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground mb-1">Risk Distribution</h2>
          <p className="text-xs text-muted-foreground mb-4">Fleet health at a glance</p>
          <RiskDistributionChart healthy={healthy} medium={medium} high={high} />
        </div>

        {/* Power trend */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground mb-1">Power Output Trend</h2>
          <p className="text-xs text-muted-foreground mb-4">Total fleet output — last 14 days (kW)</p>
          <PowerTrendChart data={mockPowerTrend} />
        </div>

        {/* Temp trend */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground mb-1">Temperature Trend</h2>
          <p className="text-xs text-muted-foreground mb-4">Fleet avg temperature — last 14 days (°C)</p>
          <TempTrendChart data={mockTempTrend} />
        </div>
      </div>

      {/* High-risk summary table */}
      {high > 0 && (
        <div className="bg-card border border-red-200 dark:border-red-900 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-red-200 dark:border-red-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-semibold text-foreground">High-Risk Inverters — Immediate Action</h2>
          </div>
          <div className="divide-y divide-border">
            {inverters
              .filter((i) => i.status === "High Risk")
              .map((inv) => (
                <a
                  key={inv.id}
                  href={`/inverters/${inv.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                >
                  <div>
                    <span className="font-semibold text-sm text-foreground">{inv.id}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{inv.location}</span>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <span className="text-muted-foreground">{inv.MODULE_TEMPERATURE}°C</span>
                    <span className="text-muted-foreground">AC: {inv.AC_POWER}W</span>
                    <span className="font-bold text-red-600 dark:text-red-400">
                      Risk: {inv.riskScore.toFixed(2)}
                    </span>
                  </div>
                </a>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
