"use client";

import { useEffect, useState } from "react";
import { Zap, Activity } from "lucide-react";
import InverterTable from "@/components/InverterTable";
import { getInverters } from "@/services/api";
import { type Inverter } from "@/lib/mockData";

export default function InvertersPage() {
  const [inverters, setInverters] = useState<Inverter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInverters().then((data) => {
      setInverters(data);
      setLoading(false);
    });
  }, []);

  const healthy = inverters.filter((i) => i.status === "Healthy").length;
  const medium = inverters.filter((i) => i.status === "Medium Risk").length;
  const high = inverters.filter((i) => i.status === "High Risk").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" />
            Inverters
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and monitor all solar inverters in your plant
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#00E5A8]/20 text-[#00E5A8]">
            {healthy} Healthy
          </span>
          <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#FFB020]/20 text-[#FFB020]">
            {medium} Medium Risk
          </span>
          <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#FF4D4F]/20 text-[#FF4D4F]">
            {high} High Risk
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Activity className="w-8 h-8 animate-pulse text-primary" />
            <p className="text-sm">Loading inverter fleet…</p>
          </div>
        </div>
      ) : (
        <InverterTable inverters={inverters} />
      )}
    </div>
  );
}
