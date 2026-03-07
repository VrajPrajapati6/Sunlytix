"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { type Inverter, type InverterStatus } from "@/lib/mockData";
import { cn } from "@/lib/utils";

interface InverterTableProps {
  inverters: Inverter[];
}

const statusStyles: Record<InverterStatus, string> = {
  Healthy: "bg-white/5 border border-white/10 text-gray-400 font-medium",
  "Medium Risk": "bg-orange-500/10 border border-orange-500/20 text-orange-400 font-medium",
  "High Risk": "bg-orange-500/20 border border-orange-500/30 text-orange-500 font-medium",
};

const riskBarColor: Record<InverterStatus, string> = {
  Healthy: "bg-gray-500",
  "Medium Risk": "bg-orange-400",
  "High Risk": "bg-orange-500",
};

type SortField = keyof Pick<Inverter, "id" | "mac" | "location" | "MODULE_TEMPERATURE" | "DC_POWER" | "AC_POWER" | "riskScore">;
type SortDir = "asc" | "desc";

export default function InverterTable({ inverters }: InverterTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("riskScore");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return inverters
      .filter(
        (inv) =>
          inv.id.toLowerCase().includes(q) ||
          inv.location.toLowerCase().includes(q) ||
          inv.status.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const av = a[sortField];
        const bv = b[sortField];
        const cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [inverters, search, sortField, sortDir]);

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortDir === "asc" ? (
      <ArrowUp className="w-3 h-3 text-primary" />
    ) : (
      <ArrowDown className="w-3 h-3 text-primary" />
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      {/* Search bar */}
      <div className="p-4 border-b border-border">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search inverters..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white/5 border border-white/10 rounded-lg outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 text-white placeholder:text-gray-500 transition-all duration-200"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Showing {filtered.length} of {inverters.length} inverters
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-white/[0.02]">
              {(
                [
                  { field: "id", label: "Inverter ID" },
                  { field: "location", label: "Location" },
                  { field: "MODULE_TEMPERATURE", label: "Module Temp" },
                  { field: "DC_POWER", label: "DC Power" },
                  { field: "AC_POWER", label: "AC Power" },
                  { field: "mac", label: "MAC Address" },
                  { field: "riskScore", label: "Risk Score" },
                ] as { field: SortField; label: string }[]
              ).map(({ field, label }) => (
                <th
                  key={field}
                  className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer select-none"
                  onClick={() => handleSort(field)}
                >
                  <span className="flex items-center gap-1.5">
                    {label}
                    <SortIcon field={field} />
                  </span>
                </th>
              ))}
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv, idx) => (
              <tr
                key={inv.id}
                onClick={() => router.push(`/inverters/${inv.id}`)}
                className={cn(
                  "border-b border-border last:border-0 cursor-pointer transition-colors hover:bg-white/10",
                  idx % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]"
                )}
              >
                <td className="px-4 py-3 font-semibold text-foreground">{inv.id}</td>
                <td className="px-4 py-3 text-muted-foreground">{inv.location}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "font-medium",
                      inv.MODULE_TEMPERATURE >= 65
                        ? "text-orange-500"
                        : inv.MODULE_TEMPERATURE >= 50
                          ? "text-orange-400"
                          : "text-foreground"
                    )}
                  >
                    {inv.MODULE_TEMPERATURE}°C
                  </span>
                </td>
                <td className="px-4 py-3 text-foreground">{inv.DC_POWER} W</td>
                <td className="px-4 py-3 text-foreground">{inv.AC_POWER} W</td>
                <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{inv.mac || "-"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", riskBarColor[inv.status])}
                        style={{ width: `${inv.riskScore * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8">{inv.riskScore.toFixed(2)}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", statusStyles[inv.status])}>
                    {inv.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground text-sm">
            No inverters match your search.
          </div>
        )}
      </div>
    </div>
  );
}
