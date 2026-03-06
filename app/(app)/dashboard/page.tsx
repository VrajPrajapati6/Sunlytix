"use client";

import { useEffect, useState, useRef } from "react";
import {
  Zap,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Activity,
  Thermometer,
  BrainCircuit,
  Terminal,
  TrendingUp,
  Clock,
  Lightbulb,
  Gauge,
} from "lucide-react";
import { RiskDistributionChart, PowerTrendChart, TempTrendChart } from "@/components/Charts";
import { getInverters } from "@/services/api";
import { mockInverters, mockPowerTrend, mockTempTrend, mockInsights, type Inverter } from "@/lib/mockData";
import { cn } from "@/lib/utils";

/* ─── Animated Counter ─── */
function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    const start = ref.current;
    const end = value;
    const startTime = performance.now();
    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
      else ref.current = end;
    }
    requestAnimationFrame(tick);
  }, [value, duration]);

  return <>{display}</>;
}

/* ─── AI System Status Bar ─── */
function AIStatusBar({ total, alerts }: { total: number; alerts: number }) {
  const plants = ["Plant 1", "Plant 2", "Plant 3"];
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setActiveIdx((i) => (i + 1) % plants.length), 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl px-5 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-[#FF6A00] animate-pulse-orange" />
        <p className="text-sm text-[#A0A0A0]">
          <span className="text-white font-medium">Sunlytix AI</span> monitoring active —{" "}
          <span className="text-[#FF6A00]">{total} inverters</span> scanned —{" "}
          <span className="text-red-400">{alerts} alerts detected</span>
        </p>
      </div>
      <div className="flex items-center gap-4">
        {plants.map((plant, i) => (
          <div key={plant} className="flex items-center gap-1.5">
            <div
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all duration-500",
                i === activeIdx ? "bg-[#FF6A00] animate-scanning scale-125" : "bg-[#333]"
              )}
            />
            <span className={cn("text-xs transition-colors duration-300", i === activeIdx ? "text-[#FF6A00]" : "text-[#555]")}>
              {plant}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── KPI Card ─── */
function KPICard({
  icon: Icon,
  title,
  value,
  subtitle,
  color,
  delay = 0,
}: {
  icon: React.ElementType;
  title: string;
  value: number;
  subtitle: string;
  color: string;
  delay?: number;
}) {
  const colorMap: Record<string, { bg: string; text: string; glow: string; border: string }> = {
    blue: { bg: "bg-blue-500/10", text: "text-blue-400", glow: "shadow-[0_0_20px_rgba(59,130,246,0.15)]", border: "border-blue-500/20" },
    green: { bg: "bg-emerald-500/10", text: "text-emerald-400", glow: "shadow-[0_0_20px_rgba(16,185,129,0.15)]", border: "border-emerald-500/20" },
    orange: { bg: "bg-[#FF6A00]/10", text: "text-[#FF6A00]", glow: "shadow-[0_0_20px_rgba(255,106,0,0.15)]", border: "border-[#FF6A00]/20" },
    red: { bg: "bg-red-500/10", text: "text-red-400", glow: "shadow-[0_0_20px_rgba(239,68,68,0.15)]", border: "border-red-500/20" },
  };
  const c = colorMap[color] ?? colorMap.blue;

  return (
    <div
      className={cn("glass-card card-3d rounded-xl p-5 border", c.border, c.glow, "animate-slide-up")}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider">{title}</p>
          <p className={cn("text-4xl font-bold mt-2", c.text)}>
            <AnimatedNumber value={value} />
          </p>
          <p className="text-xs text-[#666] mt-1.5">{subtitle}</p>
        </div>
        <div className={cn("p-2.5 rounded-lg", c.bg)}>
          <Icon className={cn("w-5 h-5", c.text)} />
        </div>
      </div>
    </div>
  );
}

/* ─── Plant Heatmap ─── */
function PlantHeatmap({ inverters }: { inverters: Inverter[] }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const plants = ["Plant 1", "Plant 2", "Plant 3"];

  const getColor = (status: string) => {
    if (status === "High Risk") return "bg-red-500/80 border-red-500/50 animate-pulse-red";
    if (status === "Medium Risk") return "bg-[#FF6A00]/60 border-[#FF6A00]/40";
    return "bg-emerald-500/50 border-emerald-500/30";
  };

  return (
    <div className="space-y-4">
      {plants.map((plant) => {
        const plantInvs = inverters.filter((i) => i.plant === plant);
        return (
          <div key={plant}>
            <p className="text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider mb-2">{plant}</p>
            <div className="grid grid-cols-2 gap-2">
              {plantInvs.map((inv) => (
                <div
                  key={inv.id}
                  className="relative"
                  onMouseEnter={() => setHoveredId(inv.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div
                    className={cn(
                      "rounded-lg border px-3 py-2 text-center cursor-pointer transition-all duration-300",
                      getColor(inv.status),
                      "hover:scale-105 hover:shadow-lg"
                    )}
                  >
                    <p className="text-xs font-bold text-white">{inv.id}</p>
                    <p className="text-[10px] text-white/70">{inv.inverter_temp}°C</p>
                  </div>
                  {hoveredId === inv.id && (
                    <div className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-[#111] border border-[#1f1f1f] rounded-lg p-3 shadow-2xl animate-fade-in">
                      <p className="text-xs font-bold text-white">{inv.id} — {inv.plant}</p>
                      <div className="mt-1.5 space-y-1 text-[11px]">
                        <div className="flex justify-between"><span className="text-[#A0A0A0]">Inverter Temp</span><span className="text-white">{inv.inverter_temp}°C</span></div>
                        <div className="flex justify-between"><span className="text-[#A0A0A0]">Power Output</span><span className="text-white">{(inv.inverter_power / 1000).toFixed(1)} kW</span></div>
                        <div className="flex justify-between"><span className="text-[#A0A0A0]">Power Factor</span><span className="text-white">{inv.power_factor}</span></div>
                        <div className="flex justify-between"><span className="text-[#A0A0A0]">Risk Score</span><span className={cn(inv.riskScore > 0.66 ? "text-red-400" : inv.riskScore > 0.33 ? "text-[#FF6A00]" : "text-emerald-400")}>{inv.riskScore.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="text-[#A0A0A0]">Alarm Codes</span><span className="text-white">{inv.inverters_alarm_code}</span></div>
                      </div>
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-[#111] border-r border-b border-[#1f1f1f]" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── AI Prediction Timeline ─── */
function PredictionTimeline({ inverters }: { inverters: Inverter[] }) {
  const atRisk = inverters.filter((i) => i.status !== "Healthy").sort((a, b) => b.riskScore - a.riskScore);
  const stages = ["Today", "+3 Days", "+7 Days"];

  return (
    <div className="space-y-4">
      {atRisk.map((inv) => {
        const isHigh = inv.status === "High Risk";
        return (
          <div key={inv.id} className="flex items-center gap-4">
            <div className="w-16 flex-shrink-0">
              <p className="text-sm font-bold text-white">{inv.id}</p>
              <p className="text-[10px] text-[#A0A0A0]">{inv.plant}</p>
            </div>
            <div className="flex-1 flex items-center gap-0">
              {stages.map((stage, i) => (
                <div key={stage} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs border",
                        i === 0
                          ? "bg-[#FF6A00]/20 border-[#FF6A00] text-[#FF6A00]"
                          : i === 1
                          ? isHigh ? "bg-red-500/20 border-red-500 text-red-400" : "bg-[#FF6A00]/20 border-[#FF6A00] text-[#FF6A00]"
                          : isHigh ? "bg-red-500/30 border-red-500 text-red-400" : "bg-[#FF6A00]/10 border-[#FF6A00]/40 text-[#FF6A00]/60"
                      )}
                    >
                      {i === 0 ? "\u26A0" : i === 2 && isHigh ? "\u2715" : "\u26A0"}
                    </div>
                    <p className="text-[9px] text-[#666] mt-1">{stage}</p>
                  </div>
                  {i < stages.length - 1 && (
                    <div className="flex-1 h-0.5 mx-1 bg-gradient-to-r from-[#FF6A00]/40 to-red-500/40 rounded-full opacity-50" />
                  )}
                </div>
              ))}
            </div>
            <div className="w-32 flex-shrink-0 text-right">
              <p className={cn("text-xs font-medium", isHigh ? "text-red-400" : "text-[#FF6A00]")}>
                {isHigh ? "shutdown risk" : "degradation risk"}
              </p>
            </div>
          </div>
        );
      })}
      {atRisk.length === 0 && (
        <p className="text-sm text-[#666] text-center py-4">No predicted failures — all inverters healthy</p>
      )}
    </div>
  );
}

/* ─── AI Monitoring Terminal ─── */
function MonitoringTerminal() {
  const allLogs = [
    { text: "[AI] scanning inverter fleet — 6 inverters across 3 plants", type: "info" as const },
    { text: "[AI] INV-05 thermal anomaly detected — inverter_temp 62\u00B0C", type: "alert" as const },
    { text: "[AI] INV-03 power degradation — output dropped to 3200W", type: "alert" as const },
    { text: "[AI] INV-05 risk score increased to 0.85", type: "warning" as const },
    { text: "[AI] INV-04 power_factor declining — now 0.95", type: "warning" as const },
    { text: "[AI] maintenance recommended: INV-05, INV-03", type: "action" as const },
    { text: "[AI] Plant 1 status: all systems nominal", type: "info" as const },
    { text: "[AI] Plant 2 risk elevated — 1 high risk, 1 medium risk", type: "warning" as const },
    { text: "[AI] Plant 3 alert — INV-05 alarm_code count: 3", type: "alert" as const },
    { text: "[AI] rolling_mean_power_24h analysis complete", type: "info" as const },
    { text: "[AI] grid_frequency stable across all plants ~50Hz", type: "info" as const },
    { text: "[AI] temp_difference anomaly: INV-05 at 23\u00B0C delta", type: "alert" as const },
  ];

  const [visibleLogs, setVisibleLogs] = useState<typeof allLogs>([]);

  useEffect(() => {
    let idx = 0;
    const timer = setInterval(() => {
      if (idx < allLogs.length) {
        const currentLog = allLogs[idx];
        idx++;
        setVisibleLogs((prev) => [...prev, currentLog]);
      } else {
        clearInterval(timer);
      }
    }, 600);
    return () => clearInterval(timer);
  }, []);

  const typeColor = {
    info: "text-[#555]",
    warning: "text-[#FF6A00]",
    alert: "text-red-400",
    action: "text-emerald-400",
  };

  return (
    <div className="bg-[#0a0a0a] rounded-lg border border-[#1a1a1a] p-4 h-64 overflow-y-auto font-mono text-xs">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#1a1a1a]">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
        <span className="text-[10px] text-[#444] ml-2">AI Monitor — live feed</span>
      </div>
      <div className="space-y-1">
        {visibleLogs.map((log, i) => (
          <p key={i} className={cn("animate-fade-in-up", typeColor[log.type])} style={{ animationDelay: `${i * 50}ms` }}>
            {log.text}
          </p>
        ))}
        <span className="inline-block w-2 h-3.5 bg-[#FF6A00] animate-pulse-orange ml-0.5" />
      </div>
    </div>
  );
}

/* ─── AI Insights Panel ─── */
function InsightsPanel() {
  const topInsights = mockInsights.filter((i) => i.severity !== "low").slice(0, 3);

  return (
    <div className="space-y-3">
      {topInsights.map((insight) => (
        <div
          key={insight.id}
          className={cn(
            "rounded-lg border p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg",
            insight.severity === "high"
              ? "border-red-500/30 bg-red-500/5"
              : "border-[#FF6A00]/20 bg-[#FF6A00]/5"
          )}
        >
          <div className="flex items-start gap-3">
            <div className={cn(
              "p-1.5 rounded-lg flex-shrink-0 mt-0.5",
              insight.severity === "high" ? "bg-red-500/15" : "bg-[#FF6A00]/15"
            )}>
              <Lightbulb className={cn("w-4 h-4", insight.severity === "high" ? "text-red-400" : "text-[#FF6A00]")} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-white">{insight.title}</p>
                <span className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded-full font-medium uppercase",
                  insight.severity === "high" ? "bg-red-500/15 text-red-400" : "bg-[#FF6A00]/15 text-[#FF6A00]"
                )}>
                  {insight.severity}
                </span>
              </div>
              <p className="text-xs text-[#A0A0A0] mt-1 leading-relaxed">{insight.description}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#1f1f1f] text-[#FF6A00] font-medium">
                  {insight.inverterId}
                </span>
                <span className="text-[10px] text-[#555]">
                  {new Date(insight.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*                    MAIN DASHBOARD PAGE                         */
/* ═══════════════════════════════════════════════════════════════ */

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
  const alerts = medium + high;

  const totalPower = inverters.reduce((s, i) => s + (i.inverter_power ?? i.AC_POWER ?? 0), 0);
  const totalEnergyToday = inverters.reduce((s, i) => s + (i.energy_today ?? 0), 0);
  const avgTemp = inverters.length > 0
    ? inverters.reduce((s, i) => s + (i.inverter_temp ?? i.MODULE_TEMPERATURE ?? 0), 0) / inverters.length
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-[#A0A0A0]">
          <Activity className="w-10 h-10 animate-pulse text-[#FF6A00]" />
          <p className="text-sm">Initializing AI monitoring system…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-6 space-y-6 max-w-[1440px] mx-auto">
      {/* ─── AI System Status Bar ─── */}
      <AIStatusBar total={total} alerts={alerts} />

      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Control Center</h1>
          <p className="text-sm text-[#A0A0A0] mt-0.5">
            Real-time solar fleet intelligence — {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-[#666]">
          <span className="flex items-center gap-1.5"><Gauge className="w-3.5 h-3.5" /> {(totalPower / 1000).toFixed(1)} kW total</span>
          <span className="flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> {totalEnergyToday.toFixed(1)} kWh today</span>
          <span className="flex items-center gap-1.5"><Thermometer className="w-3.5 h-3.5" /> {avgTemp.toFixed(0)}°C avg</span>
        </div>
      </div>

      {/* ─── KPI Summary Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={Zap} title="Total Inverters" value={total} subtitle="Across 3 plants" color="blue" delay={0} />
        <KPICard icon={ShieldCheck} title="Healthy" value={healthy} subtitle="Operating normally" color="green" delay={100} />
        <KPICard icon={AlertCircle} title="Medium Risk" value={medium} subtitle="Monitoring closely" color="orange" delay={200} />
        <KPICard icon={AlertTriangle} title="High Risk" value={high} subtitle="Immediate action required" color="red" delay={300} />
      </div>

      {/* ─── Plant Health Overview — Pie + Heatmap ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl border border-[#1f1f1f] p-5">
          <div className="flex items-center gap-2 mb-1">
            <BrainCircuit className="w-4 h-4 text-[#FF6A00]" />
            <h2 className="text-sm font-semibold text-white">Risk Distribution</h2>
          </div>
          <p className="text-xs text-[#666] mb-4">Fleet health breakdown</p>
          <RiskDistributionChart healthy={healthy} medium={medium} high={high} />
        </div>
        <div className="glass-card rounded-xl border border-[#1f1f1f] p-5">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-[#FF6A00]" />
            <h2 className="text-sm font-semibold text-white">Plant Risk Heatmap</h2>
          </div>
          <p className="text-xs text-[#666] mb-4">Hover for inverter details</p>
          <PlantHeatmap inverters={inverters} />
        </div>
      </div>

      {/* ─── Charts — Power + Temp ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl border border-[#1f1f1f] p-5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-[#FF6A00]" />
            <h2 className="text-sm font-semibold text-white">Power Output Trend</h2>
          </div>
          <p className="text-xs text-[#666] mb-4">Fleet output — last 14 days (kW)</p>
          <PowerTrendChart data={mockPowerTrend} />
        </div>
        <div className="glass-card rounded-xl border border-[#1f1f1f] p-5">
          <div className="flex items-center gap-2 mb-1">
            <Thermometer className="w-4 h-4 text-[#FF6A00]" />
            <h2 className="text-sm font-semibold text-white">Temperature Trend</h2>
          </div>
          <p className="text-xs text-[#666] mb-4">Avg inverter temp — last 14 days (°C)</p>
          <TempTrendChart data={mockTempTrend} />
        </div>
      </div>

      {/* ─── AI Prediction Timeline ─── */}
      <div className="glass-card rounded-xl border border-[#1f1f1f] p-5">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-4 h-4 text-[#FF6A00]" />
          <h2 className="text-sm font-semibold text-white">AI Prediction Timeline</h2>
        </div>
        <p className="text-xs text-[#666] mb-4">Predicted inverter failure risk over next 7 days</p>
        <PredictionTimeline inverters={inverters} />
      </div>

      {/* ─── Terminal + Insights ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl border border-[#1f1f1f] p-5">
          <div className="flex items-center gap-2 mb-3">
            <Terminal className="w-4 h-4 text-[#FF6A00]" />
            <h2 className="text-sm font-semibold text-white">AI Monitoring Terminal</h2>
          </div>
          <MonitoringTerminal />
        </div>
        <div className="glass-card rounded-xl border border-[#1f1f1f] p-5">
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb className="w-4 h-4 text-[#FF6A00]" />
            <h2 className="text-sm font-semibold text-white">AI Insights & Recommendations</h2>
          </div>
          <p className="text-xs text-[#666] mb-3">AI-generated maintenance recommendations</p>
          <InsightsPanel />
        </div>
      </div>

      {/* ─── High-Risk Summary ─── */}
      {high > 0 && (
        <div className="glass-card rounded-xl border border-red-500/30 overflow-hidden shadow-[0_0_20px_rgba(239,68,68,0.1)]">
          <div className="px-5 py-4 border-b border-red-500/20 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h2 className="text-sm font-semibold text-white">High-Risk Inverters — Immediate Action Required</h2>
          </div>
          <div className="divide-y divide-[#1f1f1f]">
            {inverters
              .filter((i) => i.status === "High Risk")
              .map((inv) => (
                <a
                  key={inv.id}
                  href={`/inverters/${inv.id}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3.5 hover:bg-red-500/5 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="font-semibold text-sm text-white">{inv.id}</span>
                    <span className="text-xs text-[#A0A0A0]">{inv.plant} · {inv.mac}</span>
                  </div>
                  <div className="flex items-center gap-5 text-xs mt-2 sm:mt-0">
                    <span className="text-[#A0A0A0]">Temp: <span className="text-red-400 font-medium">{inv.inverter_temp}°C</span></span>
                    <span className="text-[#A0A0A0]">Power: <span className="text-white">{(inv.inverter_power / 1000).toFixed(1)} kW</span></span>
                    <span className="text-[#A0A0A0]">Risk: <span className="text-red-400 font-bold">{inv.riskScore.toFixed(2)}</span></span>
                    <span className="text-[#A0A0A0]">Alarms: <span className="text-red-400">{inv.inverters_alarm_code}</span></span>
                    <span className="text-[#FF6A00] opacity-0 group-hover:opacity-100 transition-opacity">View →</span>
                  </div>
                </a>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
