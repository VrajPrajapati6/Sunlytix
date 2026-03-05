"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

/* ─── Risk Distribution Pie Chart ────────────────────────────── */
interface RiskPieProps {
  healthy: number;
  medium: number;
  high: number;
}

export function RiskDistributionChart({ healthy, medium, high }: RiskPieProps) {
  const data = [
    { name: "Healthy", value: healthy },
    { name: "Medium Risk", value: medium },
    { name: "High Risk", value: high },
  ];
  const COLORS = ["#22c55e", "#eab308", "#ef4444"];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={4}
          dataKey="value"
        >
          {data.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "12px",
            color: "hsl(var(--foreground))",
          }}
        />
        <Legend
          formatter={(value) => (
            <span style={{ color: "hsl(var(--muted-foreground))", fontSize: "12px" }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

/* ─── Power Output Trend Line Chart ──────────────────────────── */
interface TrendPoint {
  date: string;
  output: number;
}

export function PowerTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="date"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          domain={["auto", "auto"]}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "12px",
            color: "hsl(var(--foreground))",
          }}
        />
        <Line
          type="monotone"
          dataKey="output"
          stroke="hsl(var(--primary))"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "hsl(var(--primary))" }}
          activeDot={{ r: 5 }}
          name="Power (kW)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ─── Temperature Trend Line Chart ───────────────────────────── */
interface TempPoint {
  date: string;
  avg: number;
}

export function TempTrendChart({ data }: { data: TempPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="date"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          domain={["auto", "auto"]}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "12px",
            color: "hsl(var(--foreground))",
          }}
        />
        <Line
          type="monotone"
          dataKey="avg"
          stroke="#f97316"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "#f97316" }}
          activeDot={{ r: 5 }}
          name="Avg Temp (°C)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ─── Inverter Detail: Telemetry Line Chart ───────────────────── */
interface TelemetryPoint {
  time: string;
  DC_POWER: number;
  AC_POWER: number;
  MODULE_TEMPERATURE: number;
  AMBIENT_TEMPERATURE: number;
  IRRADIATION: number;
}

export function TelemetryLineChart({ data, metric }: { data: TelemetryPoint[]; metric: "MODULE_TEMPERATURE" | "AC_POWER" | "DC_POWER" | "IRRADIATION" | "AMBIENT_TEMPERATURE" }) {
  const config = {
    MODULE_TEMPERATURE: { color: "#f97316", name: "Module Temp (°C)", domain: [20, 90] as [number, number] },
    AMBIENT_TEMPERATURE: { color: "#fb923c", name: "Ambient Temp (°C)", domain: [20, 60] as [number, number] },
    AC_POWER: { color: "hsl(var(--primary))", name: "AC Power (W)", domain: [0, 600] as [number, number] },
    DC_POWER: { color: "#8b5cf6", name: "DC Power (W)", domain: [0, 640] as [number, number] },
    IRRADIATION: { color: "#eab308", name: "Irradiation (W/m²)", domain: [0, 1050] as [number, number] },
  };
  const { color, name, domain } = config[metric];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="time"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          interval={3}
        />
        <YAxis
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          domain={domain}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "12px",
            color: "hsl(var(--foreground))",
          }}
        />
        <Line
          type="monotone"
          dataKey={metric}
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
          name={name}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ─── SHAP Feature Importance Bar Chart ──────────────────────── */
interface FeaturePoint {
  feature: string;
  importance: number;
}

export function FeatureImportanceChart({ data }: { data: FeaturePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          domain={[0, 0.5]}
          tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
        />
        <YAxis
          type="category"
          dataKey="feature"
          tick={{ fill: "hsl(var(--foreground))", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={130}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "12px",
            color: "hsl(var(--foreground))",
          }}
          formatter={(v: number) => [`${(v * 100).toFixed(0)}%`, "Importance"]}
        />
        <Bar dataKey="importance" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
