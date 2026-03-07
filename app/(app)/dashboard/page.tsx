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
  Gauge,
  Upload,
  CheckCircle,
  FileSpreadsheet,
} from "lucide-react";
import { RiskDistributionChart, PowerTrendChart, TempTrendChart } from "@/components/Charts";
import { getInverters } from "@/services/api";
import { mockInverters, mockPowerTrend, mockTempTrend, type Inverter, type InverterStatus } from "@/lib/mockData";
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
    <div className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-6 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_0_20px_rgba(255,106,0,0.02)] backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
          <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping opacity-40" />
        </div>
        <p className="text-sm text-gray-400">
          <span className="text-white font-bold tracking-tight">Sunlytix AI</span> monitoring active —{" "}
          <span className="text-orange-500 font-semibold">{total} inverters</span> scanned —{" "}
          <span className="text-red-400 font-semibold">{alerts} alerts detected</span>
        </p>
      </div>
      <div className="flex items-center gap-6">
        {plants.map((plant, i) => (
          <div key={plant} className="flex items-center gap-2">
            <div
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all duration-700",
                i === activeIdx ? "bg-orange-500 shadow-[0_0_8px_rgba(255,106,0,0.6)] scale-125" : "bg-white/10"
              )}
            />
            <span className={cn("text-[11px] font-medium uppercase tracking-widest transition-colors duration-500", i === activeIdx ? "text-orange-400" : "text-gray-600")}>
              {plant}
            </span>
          </div>
        ))}
        <div className="h-4 w-px bg-white/10 hidden sm:block mx-2" />
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 font-mono">SCANNING...</span>
        </div>
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
    green: { bg: "bg-emerald-500/10", text: "text-emerald-400", glow: "shadow-[0_0_30px_rgba(16,185,129,0.08)]", border: "border-emerald-500/20" },
    orange: { bg: "bg-orange-500/10", text: "text-orange-500", glow: "shadow-[0_0_30px_rgba(255,106,0,0.1)]", border: "border-orange-500/20" },
    red: { bg: "bg-red-500/10", text: "text-red-500", glow: "shadow-[0_0_30px_rgba(239,68,68,0.1)]", border: "border-red-500/20" },
    white: { bg: "bg-white/5", text: "text-white", glow: "shadow-[0_0_30px_rgba(255,255,255,0.02)]", border: "border-white/10" },
  };
  const c = colorMap[color] ?? colorMap.white;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-white/[0.03] p-6 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl backdrop-blur-md",
        c.border,
        c.glow,
        "animate-slide-up"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Decorative background glow */}
      <div className={cn("absolute -right-4 -top-4 w-24 h-24 blur-3xl rounded-full opacity-10 transition-opacity group-hover:opacity-20", c.bg)} />

      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{title}</p>
          <div className="flex items-baseline gap-1">
            <h3 className={cn("text-4xl font-bold tracking-tight", c.text)}>
              <AnimatedNumber value={value} />
            </h3>
          </div>
          <p className="text-xs text-gray-400 font-medium flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
            <span className="w-1 h-1 rounded-full bg-gray-600" />
            {subtitle}
          </p>
        </div>
        <div className={cn("p-3 rounded-xl border border-white/5 shadow-inner transition-transform group-hover:scale-110 duration-500", c.bg)}>
          <Icon className={cn("w-6 h-6", c.text)} />
        </div>
      </div>
      
      {/* Bottom accent line */}
      <div className={cn("absolute bottom-0 left-0 h-[3px] w-0 bg-gradient-to-r from-transparent via-current to-transparent transition-all duration-700 group-hover:w-full opacity-30", c.text)} />
    </div>
  );
}

/* ─── Plant Heatmap ─── */
function PlantHeatmap({ inverters }: { inverters: Inverter[] }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const plants = ["Plant 1", "Plant 2", "Plant 3"];

  const getStatusStyles = (status: string) => {
    if (status === "High Risk") return "bg-red-500/20 border-red-500/40 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse";
    if (status === "Medium Risk") return "bg-orange-500/20 border-orange-500/40 text-orange-400 shadow-[0_0_15px_rgba(255,106,0,0.15)]";
    return "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plants.map((plant) => {
        const plantInvs = inverters.filter((i) => i.plant === plant);
        return (
          <div key={plant} className="space-y-3 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
            <div className="flex items-center justify-between px-1">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{plant}</p>
              <span className="text-[10px] text-gray-600 font-mono italic">{plantInvs.length} UNITS</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {plantInvs.map((inv) => (
                <div
                  key={inv.id}
                  className="relative group"
                  onMouseEnter={() => setHoveredId(inv.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div
                    className={cn(
                      "rounded-xl border px-3 py-3 transition-all duration-300 cursor-crosshair transform active:scale-95",
                      getStatusStyles(inv.status),
                      "hover:bg-white/[0.1] hover:border-white/20"
                    )}
                  >
                    <p className="text-xs font-black tracking-tighter mb-1">{inv.id}</p>
                    <div className="flex items-center justify-between">
                       <p className="text-[10px] font-bold opacity-80">{inv.inverter_temp}°C</p>
                       <Activity className="w-2.5 h-2.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  
                  {hoveredId === inv.id && (
                    <div className="absolute z-[100] bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 bg-black/95 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-fade-in ring-1 ring-white/5">
                      <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                        <span className="text-[10px] font-bold text-gray-500">{inv.id} CONTROL</span>
                        <span className={cn("text-[9px] px-2 py-0.5 rounded-full font-bold uppercase", inv.status === 'High Risk' ? "bg-red-500/20 text-red-400" : inv.status === 'Medium Risk' ? "bg-orange-500/20 text-orange-400" : "bg-emerald-500/20 text-emerald-400")}>{inv.status}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="space-y-0.5">
                          <p className="text-[9px] text-gray-500 font-bold uppercase">Temperature</p>
                          <p className="text-xs font-bold text-white tracking-tight">{inv.inverter_temp}°C</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[9px] text-gray-500 font-bold uppercase">AC Output</p>
                          <p className="text-xs font-bold text-white tracking-tight">{(inv.inverter_power / 1000).toFixed(1)} kW</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[9px] text-gray-500 font-bold uppercase">Risk Score</p>
                          <p className={cn("text-xs font-bold tracking-tight", inv.riskScore > 0.66 ? "text-red-400" : inv.riskScore > 0.33 ? "text-orange-400" : "text-emerald-400")}>{(inv.riskScore * 100).toFixed(0)}%</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[9px] text-gray-500 font-bold uppercase">PF</p>
                          <p className="text-xs font-bold text-white tracking-tight">{inv.power_factor}</p>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-white/5">
                         <p className="text-[9px] text-orange-400 font-bold uppercase mb-1 flex items-center gap-1.5"><BrainCircuit className="w-3 h-3"/> AI Analysis</p>
                         <p className="text-[10px] text-gray-400 leading-relaxed italic">&quot;{inv.status === 'Healthy' ? 'No anomalies detected. Performance is optimal.' : inv.status === 'High Risk' ? 'Immediate inspection required. Thermal limit nearing threshold.' : 'Monitoring increasing temp delta.'}&quot;</p>
                      </div>
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-black border-r border-b border-white/10 rotate-45" />
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

function AIInsightPanel({ inverters }: { inverters: Inverter[] }) {
  const highRisk = inverters.filter(i => i.status === 'High Risk');
  
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-orange-500/20 bg-gradient-to-br from-orange-500/[0.05] to-transparent p-8 backdrop-blur-xl shadow-[0_0_40px_rgba(255,106,0,0.05)] transition-all animate-slide-up">
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
        <BrainCircuit className="w-32 h-32 text-orange-500" />
      </div>
      
      <div className="flex flex-col md:flex-row md:items-start gap-8 relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-orange-500 shadow-[0_0_20px_rgba(255,106,0,0.4)] flex items-center justify-center flex-shrink-0 animate-float">
          <BrainCircuit className="w-8 h-8 text-black" />
        </div>
        
        <div className="space-y-6 flex-1">
          <div>
            <h3 className="text-2xl font-bold text-white tracking-tight">Sunlytix AI Insight</h3>
            <p className="text-gray-400 text-sm mt-1">Generative predictive maintenance report</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0 shadow-[0_0_8px_rgba(255,106,0,0.8)]" />
                <p className="text-sm text-gray-300 leading-relaxed">
                  <span className="text-orange-400 font-bold font-mono">CRITICAL:</span> {highRisk.length > 0 ? `Block 2 shows abnormal temperature rise in ${highRisk[0].id}.` : "Inverter fleet maintaining optimal operating temperatures."}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0 shadow-[0_0_8px_rgba(255,106,0,0.8)]" />
                <p className="text-sm text-gray-300 leading-relaxed">
                  <span className="text-orange-400 font-bold font-mono">PREDICTION:</span> {highRisk.length} inverters predicted to degrade significantly within <span className="text-white font-bold tracking-tighter">7 DAYS</span>.
                </p>
              </div>
            </div>
            
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Recommended Action</p>
              <p className="text-sm text-white font-medium italic leading-relaxed">
                "Initiate cooling fan inspection and clean ventilation intake on Plant {highRisk[0]?.plant?.slice(-1) || '2'} cluster to prevent thermal shutdown."
              </p>
              <button className="w-full py-2 bg-white text-black text-xs font-bold rounded-xl mt-2 hover:bg-orange-500 hover:text-white transition-all shadow-lg active:scale-95">
                GENERATE MAINTENANCE TICKET
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── AI Prediction Timeline ─── */
function PredictionTimeline({ inverters }: { inverters: Inverter[] }) {
  const atRisk = inverters.filter((i) => i.status !== "Healthy").sort((a, b) => b.riskScore - a.riskScore);
  const stages = ["Today", "+3 Days", "+7 Days"];

  return (
    <div className="space-y-6">
      {atRisk.map((inv) => {
        const isHigh = inv.status === "High Risk";
        return (
          <div key={inv.id} className="group flex items-center gap-6 p-4 rounded-2xl bg-white/[0.02] border border-white/5 transition-all hover:bg-white/5">
            <div className="w-20 flex-shrink-0">
              <p className="text-sm font-black text-white tracking-tighter">{inv.id}</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase">{inv.plant}</p>
            </div>
            <div className="flex-1 flex items-center gap-0">
              {stages.map((stage, i) => (
                <div key={stage} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs border-2 transition-all duration-500",
                        i === 0
                          ? "bg-orange-500/20 border-orange-500 text-orange-500 shadow-[0_0_10px_rgba(255,106,0,0.3)]"
                          : i === 1
                          ? isHigh ? "bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]" : "bg-orange-500/10 border-orange-500/40 text-orange-400"
                          : isHigh ? "bg-red-500/40 border-red-500/60 text-white animate-pulse" : "bg-white/5 border-white/10 text-gray-600"
                      )}
                    >
                      {i === 0 ? "\u26A0" : i === 2 && isHigh ? "\u2715" : i === 2 ? "\u2713" : "\u26A0"}
                    </div>
                    <p className="text-[9px] font-bold text-gray-600 mt-2 uppercase tracking-tighter">{stage}</p>
                  </div>
                  {i < stages.length - 1 && (
                    <div className="flex-1 h-[2px] mx-2 bg-gradient-to-r from-orange-500/20 to-current opacity-20" />
                  )}
                </div>
              ))}
            </div>
            <div className="w-40 flex-shrink-0 text-right">
              <p className={cn("text-xs font-black uppercase tracking-tight", isHigh ? "text-red-500" : "text-orange-500")}>
                {isHigh ? "CRITICAL SHUTDOWN" : "DEGRADATION ALERT"}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">Prob: {(inv.riskScore * 100).toFixed(0)}%</p>
            </div>
          </div>
        );
      })}
      {atRisk.length === 0 && (
        <div className="py-12 flex flex-col items-center gap-3 text-gray-600 border-2 border-dashed border-white/5 rounded-3xl">
          <CheckCircle className="w-8 h-8 opacity-20" />
          <p className="text-sm font-medium tracking-tight">System nominal — 0 predicted failures detected</p>
        </div>
      )}
    </div>
  );
}

/* ─── AI Monitoring Terminal ─── */
const ALL_MONITOR_LOGS = [
  { text: ">> AI_SYSTEM: Initializing multi-plant telemetry scan...", type: "info" as const },
  { text: ">> ALERT: INV-05 thermal gradient detected [high_severity]", type: "alert" as const },
  { text: ">> SIGNAL: INV-03 AC_output deviation from nominal baseline", type: "alert" as const },
  { text: ">> PREDICT: Yield degradation expected at Plant 2 (+48h)", type: "warning" as const },
  { text: ">> DATA: Cross-referencing historical maintenance logs...", type: "info" as const },
  { text: ">> ACTION: Dispatching cooling efficiency recommendation", type: "action" as const },
  { text: ">> STATUS: Grid synchronization confirmed @ 50.02Hz", type: "action" as const },
  { text: ">> AI_CORE: Neural inference complete - 98.4% accuracy", type: "info" as const },
];

function MonitoringTerminal() {
  const [logIndex, setLogIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setLogIndex((prev) => (prev < ALL_MONITOR_LOGS.length ? prev + 1 : prev));
    }, 800);
    return () => clearInterval(timer);
  }, []);

  const visibleLogs = ALL_MONITOR_LOGS.slice(0, logIndex);

  const typeColor = {
    info: "text-gray-500",
    warning: "text-orange-400",
    alert: "text-red-500",
    action: "text-white font-bold",
  };

  return (
    <div className="bg-black/80 rounded-2xl border border-white/5 p-5 h-72 overflow-y-auto font-mono ring-1 ring-white/5 shadow-inner">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/5">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-orange-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
        </div>
        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest ml-4">Sunlytix AI Live Interface</span>
        <div className="ml-auto flex items-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
           <span className="text-[8px] text-orange-500 font-bold uppercase">Streaming</span>
        </div>
      </div>
      <div className="space-y-1.5">
        {visibleLogs.map((log, i) => log && (
          <p key={i} className={cn("text-[11px] leading-relaxed animate-fade-in", typeColor[log.type])}>
            {log.text}
          </p>
        ))}
        <div className="flex items-center gap-2 mt-2">
           <span className="text-orange-500 font-bold">{" >> "}</span>
           <span className="w-2 h-4 bg-orange-500/80 animate-pulse-orange" />
        </div>
      </div>
    </div>
  );
}

function CSVUploadPanel({ setInverters, showToast, refreshData }: { setInverters: (inv: Inverter[]) => void; showToast: (msg: string) => void; refreshData: () => Promise<void> }) {
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  function pollStatus(jobId: string) {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/upload-status/${jobId}`);
        const data = await res.json();
        if (data.status === "completed") {
          clearInterval(interval);
          setUploading(false);
          setUploadMsg(`✓ Data Analysis Complete: ${data.result?.totalInverters || 0} units synced`);
          showToast("Fleet data updated");
          await refreshData();
        } else if (data.status === "failed") {
          clearInterval(interval);
          setUploading(false);
          setUploadMsg(`✗ Analysis failure in processing engine`);
        } else {
          setUploadMsg(data.message || `Processing... ${data.progress || 0}%`);
        }
      } catch (err) {
        clearInterval(interval);
        setUploading(false);
        setUploadMsg("✗ Connectivity error during sync");
      }
    }, 2000);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setUploadMsg(`Uploading payload: "${file.name}"...`);

    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload-csv", true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setProgress(percent);
        if (percent === 100) setUploadMsg("Initializing AI Neural Analysis...");
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.jobId) pollStatus(res.jobId);
          else {
            setUploading(false);
            setUploadMsg("✗ Job ID acquisition failed");
          }
        } catch (e) {
          setUploading(false);
          setUploadMsg("✗ System parsing error");
        }
      } else {
        setUploading(false);
        setUploadMsg("✗ Uplink failed: " + xhr.status);
      }
    };

    xhr.send(formData);
    e.target.value = "";
  }

  return (
    <div className="space-y-6">
      <label
        className="block rounded-3xl border-2 border-dashed border-white/5 bg-white/[0.01] p-10 text-center hover:border-orange-500/40 hover:bg-orange-500/[0.03] hover:shadow-[0_0_30px_rgba(255,106,0,0.05)] transition-all cursor-pointer group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,106,0,0.02),_transparent)] opacity-0 group-hover:opacity-100 transition-opacity" />
        <Upload className="w-12 h-12 text-gray-700 mx-auto mb-4 group-hover:text-orange-500 group-hover:scale-110 transition-all duration-500" />
        <p className="text-base font-bold text-white tracking-tight">Sync Fleet Telemetry</p>
        <p className="text-xs text-gray-500 mt-2 font-medium max-w-[240px] mx-auto leading-relaxed">
          Standard CSV format required: inverter_id, timestamp, temp, power, pf
        </p>
        <div className="mt-8 inline-flex items-center gap-2.5 px-6 py-3 bg-white text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all shadow-xl active:scale-95">
          <Upload className="w-4 h-4" />
          Select Data Payload
        </div>
        <input
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileUpload}
        />
      </label>

      {uploadMsg && (
        <div className={cn(
          "flex flex-col gap-3 p-5 rounded-2xl border backdrop-blur-md animate-slide-up",
          uploading
            ? "bg-orange-500/5 border-orange-500/20 text-orange-400 shadow-[0_0_20px_rgba(255,106,0,0.05)]"
            : "bg-emerald-500/5 border-emerald-500/20 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.05)]"
        )}>
          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider">
            {uploading
              ? <Activity className="w-4 h-4 animate-spin flex-shrink-0" />
              : <CheckCircle className="w-4 h-4 flex-shrink-0" />
            }
            {uploadMsg}
          </div>
          {uploading && (
            <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden ring-1 ring-white/5">
              <div 
                className="h-full bg-orange-500 shadow-[0_0_10px_rgba(255,106,0,0.8)] transition-all duration-700 ease-out" 
                style={{ width: `${Math.max(5, progress)}%` }} 
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*                    MAIN DASHBOARD PAGE                         */
/* ═══════════════════════════════════════════════════════════════ */

export default function DashboardPage() {
  const [inverters, setInverters] = useState<Inverter[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: "" });

  function showToast(message: string) {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  }

  async function refreshData() {
    try {
      setLoading(true);
      const data = await getInverters();
      setInverters(data);
    } catch {
      console.warn("API unavailable — using mock data");
      setInverters(mockInverters);
    } finally {
      setLoading(false);
    }
  }

  async function clearData() {
    try {
      const res = await fetch('/api/clear-db', { method: 'POST' });
      if (res.ok) {
        setInverters([]);
        showToast("Dashboard data cleared from database");
      }
    } catch (e) {
      console.error("Failed to clear DB", e);
    }
  }

  useEffect(() => {
    refreshData();
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
            <span className="w-1.5 h-8 bg-orange-500 rounded-full" />
            AI Control Center
          </h1>
          <p className="text-base text-gray-400 mt-2 font-medium">
            Real-time solar fleet intelligence — <span className="text-white">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-4 p-1.5 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-md">
          <div className="px-4 py-2 text-center border-r border-white/5 last:border-0">
            <div className="flex items-center justify-center gap-2 mb-0.5">
              <Gauge className="w-3.5 h-3.5 text-orange-500 shadow-[0_0_8px_rgba(255,106,0,0.4)]" />
              <span className="text-lg font-bold text-white">{(totalPower / 1000).toFixed(1)}</span>
              <span className="text-[10px] text-gray-500 font-bold uppercase mt-1">kW</span>
            </div>
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Total Output</p>
          </div>
          <div className="px-4 py-2 text-center border-r border-white/5 last:border-0">
            <div className="flex items-center justify-center gap-2 mb-0.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
              <span className="text-lg font-bold text-white">{totalEnergyToday.toFixed(1)}</span>
              <span className="text-[10px] text-gray-500 font-bold uppercase mt-1">kWh</span>
            </div>
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Today&apos;s Yield</p>
          </div>
          <div className="px-4 py-2 text-center border-r border-white/5 last:border-0">
            <div className="flex items-center justify-center gap-2 mb-0.5">
              <Thermometer className="w-3.5 h-3.5 text-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.4)]" />
              <span className="text-lg font-bold text-white">{avgTemp.toFixed(0)}</span>
              <span className="text-[10px] text-gray-500 font-bold uppercase mt-1">°C</span>
            </div>
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Avg Temp</p>
          </div>
          <button
            onClick={clearData}
            className="px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all text-xs font-bold uppercase tracking-tighter"
          >
            Reset
          </button>
        </div>
      </div>

      {/* ─── KPI Summary Cards ─── */}

      {/* Toast */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 bg-foreground text-background px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle className="w-4 h-4" />
          {toast.message}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard icon={Zap} title="Total Inverters" value={total} subtitle="Across 3 plants" color="white" delay={0} />
        <KPICard icon={ShieldCheck} title="Healthy Fleet" value={healthy} subtitle="Optimal performance" color="green" delay={100} />
        <KPICard icon={AlertCircle} title="Medium Risk" value={medium} subtitle="Predictive warnings" color="orange" delay={200} />
        <KPICard icon={AlertTriangle} title="High Risk" value={high} subtitle="Critical anomalies" color="red" delay={300} />
      </div>

      {/* ─── Plant Health Overview — Pie + Heatmap ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <BrainCircuit className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Health Variance</h2>
              <p className="text-xs text-gray-500 font-medium">Fleet-wide risk distribution</p>
            </div>
          </div>
          <RiskDistributionChart healthy={healthy} medium={medium} high={high} />
        </div>
        
        <div className="lg:col-span-8 rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Activity className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Plant Risk Heatmap</h2>
                <p className="text-xs text-gray-500 font-medium">Real-time unit performance</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold text-gray-500">
               <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> HEALTHY</div>
               <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500" /> WARNING</div>
               <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500" /> CRITICAL</div>
            </div>
          </div>
          <PlantHeatmap inverters={inverters} />
        </div>
      </div>

      {/* ─── AI Insight Panel (NEW) ─── */}
      <AIInsightPanel inverters={inverters} />

      {/* ─── Charts — Power + Temp ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <TrendingUp className="w-5 h-5 text-orange-500" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">Power Output Trend</h2>
          </div>
          <PowerTrendChart data={mockPowerTrend} />
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Thermometer className="w-5 h-5 text-orange-500" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">Temperature Trend</h2>
          </div>
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

      {/* ─── Terminal + CSV Upload ─── */}
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
            <FileSpreadsheet className="w-4 h-4 text-[#FF6A00]" />
            <h2 className="text-sm font-semibold text-white">Upload Telemetry Data</h2>
          </div>
          <p className="text-xs text-[#666] mb-4">Import historical inverter data via CSV (analyzed by AI backend)</p>
          <CSVUploadPanel setInverters={setInverters} showToast={showToast} refreshData={refreshData} />
        </div>
      </div>

      {/* ─── High-Risk Summary Alert Section ─── */}
      {high > 0 && (
        <div className="group relative overflow-hidden rounded-3xl border border-red-500/30 bg-red-500/[0.02] shadow-[0_0_50px_rgba(239,68,68,0.05)] transition-all animate-slide-up">
          <div className="absolute top-0 left-0 w-2 h-full bg-red-500 animate-pulse" />
          
          <div className="px-8 py-5 border-b border-red-500/10 flex items-center justify-between bg-red-500/[0.03]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <AlertTriangle className="w-5 h-5 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white tracking-tighter uppercase">High-Risk Fleet Anomalies</h2>
                <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest mt-0.5">Immediate intervention protocol active</p>
              </div>
            </div>
            <div className="px-4 py-1.5 rounded-full bg-red-500 text-white text-[10px] font-black tracking-widest animate-pulse">
               {high} UNITS REQUIRE ACTION
            </div>
          </div>

          <div className="divide-y divide-red-500/5">
            {inverters
              .filter((i) => i.status === "High Risk")
              .map((inv) => (
                <a
                  key={inv.id}
                  href={`/inverters/${inv.id}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between px-8 py-4 hover:bg-red-500/[0.05] transition-all group/item"
                >
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="absolute inset-0 w-3 h-3 rounded-full bg-red-500 animate-ping opacity-40" />
                    </div>
                    <div>
                      <span className="font-black text-base text-white tracking-tighter">{inv.id}</span>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">{inv.plant} · {inv.mac}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8 mt-4 sm:mt-0">
                    <div className="text-right">
                       <p className="text-[9px] text-gray-500 font-bold uppercase">Temp</p>
                       <p className="text-sm font-black text-red-500">{inv.inverter_temp}°C</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[9px] text-gray-500 font-bold uppercase">Risk Index</p>
                       <p className="text-sm font-black text-red-500">{(inv.riskScore * 100).toFixed(0)}%</p>
                    </div>
                    <div className="flex items-center gap-2 pl-4 border-l border-white/5">
                      <span className="text-[10px] font-black text-white bg-white/5 px-3 py-1.5 rounded-lg group-hover/item:bg-orange-500 transition-colors">DIAGNOSE</span>
                    </div>
                  </div>
                </a>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
