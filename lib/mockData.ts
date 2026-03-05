export type InverterStatus = "Healthy" | "Medium Risk" | "High Risk";

export interface Inverter {
  id: string;
  location: string;
  DC_POWER: number;          // Watts — DC input from solar panels
  AC_POWER: number;          // Watts — AC output after inverter conversion
  MODULE_TEMPERATURE: number; // °C — solar module surface temperature
  AMBIENT_TEMPERATURE: number; // °C — surrounding air temperature
  IRRADIATION: number;       // W/m² — solar irradiation on panel surface
  riskScore: number;
  status: InverterStatus;
  runtimeHours: number;
  lastMaintenance: string;
}

export interface TelemetryPoint {
  time: string;
  DC_POWER: number;
  AC_POWER: number;
  MODULE_TEMPERATURE: number;
  AMBIENT_TEMPERATURE: number;
  IRRADIATION: number;
}

export interface Insight {
  id: string;
  inverterId: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
  timestamp: string;
  actionRequired: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const blocks = ["Block A", "Block B", "Block C", "Block D"];

function getRiskScore(index: number): number {
  // Distribute: ~75% healthy, ~17% medium, ~8% high
  if (index < 36) return parseFloat((Math.random() * 0.25).toFixed(2));
  if (index < 44) return parseFloat((0.35 + Math.random() * 0.3).toFixed(2));
  return parseFloat((0.7 + Math.random() * 0.29).toFixed(2));
}

function getStatus(riskScore: number): InverterStatus {
  if (riskScore < 0.33) return "Healthy";
  if (riskScore < 0.66) return "Medium Risk";
  return "High Risk";
}

function getDCPower(riskScore: number): number {
  // DC input slightly lower when panels degrade
  const base = 555 - riskScore * 90;
  return parseFloat((base + (Math.random() * 30 - 15)).toFixed(1));
}

function getACPower(dcPower: number, riskScore: number): number {
  // Inverter conversion efficiency degrades with risk
  const convEff = 0.95 - riskScore * 0.13;
  return parseFloat((dcPower * convEff + (Math.random() * 10 - 5)).toFixed(1));
}

function getModuleTemp(riskScore: number): number {
  const base = 40 + riskScore * 38;
  return parseFloat((base + (Math.random() * 4 - 2)).toFixed(1));
}

function getAmbientTemp(): number {
  return parseFloat((30 + Math.random() * 12).toFixed(1));
}

function getIrradiation(riskScore: number): number {
  // Lower irradiation with higher risk (cloud/soiling correlation)
  const base = 960 - riskScore * 130;
  return parseFloat((base + (Math.random() * 40 - 20)).toFixed(1));
}

export const mockInverters: Inverter[] = Array.from({ length: 48 }, (_, i) => {
  const index = i;
  const riskScore = getRiskScore(index);
  const status = getStatus(riskScore);
  const DC_POWER = getDCPower(riskScore);
  const AC_POWER = getACPower(DC_POWER, riskScore);
  const MODULE_TEMPERATURE = getModuleTemp(riskScore);
  const AMBIENT_TEMPERATURE = getAmbientTemp();
  const IRRADIATION = getIrradiation(riskScore);
  const blockIndex = Math.floor(i / 12);
  const location = blocks[blockIndex] ?? "Block A";

  return {
    id: `INV-${String(i + 1).padStart(2, "0")}`,
    location,
    DC_POWER,
    AC_POWER,
    MODULE_TEMPERATURE,
    AMBIENT_TEMPERATURE,
    IRRADIATION,
    riskScore,
    status,
    runtimeHours: 1200 + Math.floor(Math.random() * 4000),
    lastMaintenance: `2025-${String(Math.floor(Math.random() * 12) + 1).padStart(2, "0")}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}`,
  };
});

// Force specific showcase inverters — values match model input format exactly
mockInverters[0] = {
  ...mockInverters[0],
  id: "INV-01",
  location: "Block A",
  DC_POWER: 540,
  AC_POWER: 510,
  MODULE_TEMPERATURE: 45,
  AMBIENT_TEMPERATURE: 36,
  IRRADIATION: 920,
  riskScore: 0.12,
  status: "Healthy",
};
mockInverters[14] = {
  ...mockInverters[14],
  id: "INV-15",
  location: "Block B",
  DC_POWER: 480,
  AC_POWER: 420,
  MODULE_TEMPERATURE: 60,
  AMBIENT_TEMPERATURE: 38,
  IRRADIATION: 830,
  riskScore: 0.48,
  status: "Medium Risk",
};
mockInverters[20] = {
  ...mockInverters[20],
  id: "INV-21",
  location: "Block B",
  DC_POWER: 390,
  AC_POWER: 310,
  MODULE_TEMPERATURE: 72,
  AMBIENT_TEMPERATURE: 41,
  IRRADIATION: 720,
  riskScore: 0.82,
  status: "High Risk",
};

// Power output trend (last 14 days)
export const mockPowerTrend = [
  { date: "Feb 20", output: 142 },
  { date: "Feb 21", output: 148 },
  { date: "Feb 22", output: 139 },
  { date: "Feb 23", output: 152 },
  { date: "Feb 24", output: 155 },
  { date: "Feb 25", output: 144 },
  { date: "Feb 26", output: 138 },
  { date: "Feb 27", output: 141 },
  { date: "Feb 28", output: 150 },
  { date: "Mar 01", output: 153 },
  { date: "Mar 02", output: 147 },
  { date: "Mar 03", output: 149 },
  { date: "Mar 04", output: 144 },
  { date: "Mar 05", output: 151 },
];

// Temperature trend (last 14 days)
export const mockTempTrend = [
  { date: "Feb 20", avg: 42 },
  { date: "Feb 21", avg: 44 },
  { date: "Feb 22", avg: 43 },
  { date: "Feb 23", avg: 46 },
  { date: "Feb 24", avg: 47 },
  { date: "Feb 25", avg: 45 },
  { date: "Feb 26", avg: 48 },
  { date: "Feb 27", avg: 50 },
  { date: "Feb 28", avg: 49 },
  { date: "Mar 01", avg: 51 },
  { date: "Mar 02", avg: 53 },
  { date: "Mar 03", avg: 52 },
  { date: "Mar 04", avg: 55 },
  { date: "Mar 05", avg: 57 },
];

// Per-inverter telemetry (last 24 hours, hourly) — fields match ML model input
export function getMockTelemetry(inverterId: string): TelemetryPoint[] {
  const inv = mockInverters.find((i) => i.id === inverterId);
  const baseDC = inv?.DC_POWER ?? 540;
  const baseAC = inv?.AC_POWER ?? 510;
  const baseModTemp = inv?.MODULE_TEMPERATURE ?? 45;
  const baseAmbTemp = inv?.AMBIENT_TEMPERATURE ?? 36;
  const baseIrr = inv?.IRRADIATION ?? 920;

  return Array.from({ length: 24 }, (_, h) => {
    const timeStr = `${String(h).padStart(2, "00")}:00`;
    // Solar curve: zero at night, peaks at solar noon (~hour 12)
    const solarFactor = h >= 6 && h <= 18 ? Math.sin(((h - 6) / 12) * Math.PI) : 0;
    return {
      time: timeStr,
      DC_POWER: parseFloat(Math.max(0, baseDC * solarFactor + (Math.random() * 20 - 10)).toFixed(1)),
      AC_POWER: parseFloat(Math.max(0, baseAC * solarFactor + (Math.random() * 15 - 7.5)).toFixed(1)),
      MODULE_TEMPERATURE: parseFloat((baseModTemp + solarFactor * 12 + (Math.random() * 3 - 1.5)).toFixed(1)),
      AMBIENT_TEMPERATURE: parseFloat((baseAmbTemp + solarFactor * 6 + (Math.random() * 2 - 1)).toFixed(1)),
      IRRADIATION: parseFloat(Math.max(0, baseIrr * solarFactor + (Math.random() * 40 - 20)).toFixed(1)),
    };
  });
}

export const mockInsights: Insight[] = [
  {
    id: "INS-001",
    inverterId: "INV-21",
    title: "High Risk Detected",
    description:
      "Inverter INV-21 shows elevated failure risk due to rising temperature (72°C) and declining efficiency (86%). Recommended action: inspect cooling fans and clean ventilation pathways immediately.",
    severity: "high",
    timestamp: "2026-03-05T08:30:00Z",
    actionRequired: "Inspect cooling fans and clean ventilation",
  },
  {
    id: "INS-002",
    inverterId: "INV-15",
    title: "Medium Risk — Efficiency Degradation",
    description:
      "Inverter INV-15 in Block B is showing gradual efficiency drop from 96% to 92% over the past 7 days. Voltage fluctuations detected. Schedule a maintenance check within 2 weeks.",
    severity: "medium",
    timestamp: "2026-03-05T07:15:00Z",
    actionRequired: "Schedule maintenance check within 2 weeks",
  },
  {
    id: "INS-003",
    inverterId: "INV-33",
    title: "Alarm Frequency Spike",
    description:
      "INV-33 has triggered 9 alarms in the past 48 hours — significantly above the healthy threshold of 2. Possible causes: faulty DC input connection or MPPT misconfiguration.",
    severity: "medium",
    timestamp: "2026-03-04T22:00:00Z",
    actionRequired: "Check DC input connections and MPPT config",
  },
  {
    id: "INS-004",
    inverterId: "INV-44",
    title: "High Risk — Thermal Runaway Probability",
    description:
      "INV-44 temperature has increased by 18°C within 6 hours. Combined with declining power output, there is a 79% probability of thermal failure within 7 days without intervention.",
    severity: "high",
    timestamp: "2026-03-04T18:45:00Z",
    actionRequired: "Immediate inspection required — possible thermal failure",
  },
  {
    id: "INS-005",
    inverterId: "INV-07",
    title: "Routine Maintenance Due",
    description:
      "INV-07 has accumulated 4,800 runtime hours since last maintenance. Proactive cleaning and inspection recommended to maintain optimal performance.",
    severity: "low",
    timestamp: "2026-03-04T09:00:00Z",
    actionRequired: "Schedule routine maintenance",
  },
  {
    id: "INS-006",
    inverterId: "INV-28",
    title: "Power Output Anomaly",
    description:
      "INV-28 produced 14% less power than the block average during peak solar hours today. Possible soiling on panel surface or partial shading. Check array connections.",
    severity: "medium",
    timestamp: "2026-03-03T16:30:00Z",
    actionRequired: "Inspect panel surface and array connections",
  },
];

export const mockFeatureImportance = [
  { feature: "MODULE_TEMPERATURE Rise", importance: 0.42 },
  { feature: "AC_POWER Drop", importance: 0.28 },
  { feature: "DC→AC Conversion Loss", importance: 0.16 },
  { feature: "IRRADIATION Anomaly", importance: 0.09 },
  { feature: "AMBIENT_TEMPERATURE", importance: 0.05 },
];

export const mockAssistantResponses: Record<string, string> = {
  default:
    "I'm Sunlytix AI Assistant. I can help you analyze inverter health, predict failures, and provide maintenance recommendations. Try asking about a specific inverter or the overall plant status.",
  risk: "Based on current telemetry, **INV-21** has the highest failure risk (score: 0.82). MODULE_TEMPERATURE: 72°C, AC_POWER: 310W, DC_POWER: 390W — all critical indicators. Immediate inspection of cooling systems is recommended.",
  "inv-21":
    "**INV-21** (Block B) is in High Risk status:\n\n- MODULE_TEMPERATURE: 72°C (critical threshold: 65°C)\n- AC_POWER: 310W (degraded from 510W over 30 days)\n- DC_POWER: 390W\n- AMBIENT_TEMPERATURE: 41°C\n- IRRADIATION: 720 W/m²\n- Risk Score: 0.82 / 1.0\n\nThe primary driver is thermal stress (MODULE_TEMPERATURE rise). SHAP analysis shows MODULE_TEMPERATURE contributes 42% to the risk score. **Recommended Action:** Inspect and clean cooling fans. Check DC cable insulation.",
  inspect:
    "Priority inspection order based on AI risk scores:\n\n1. 🔴 **INV-21** (Risk: 0.82) — Block B — Immediate\n2. 🔴 **INV-44** (Risk: 0.79) — Block D — Immediate\n3. 🟡 **INV-15** (Risk: 0.48) — Block B — Within 2 weeks\n4. 🟡 **INV-33** (Risk: 0.44) — Block C — Within 2 weeks\n\nAll other inverters are currently in the healthy range.",
  overview:
    "**Plant Overview — Mar 5, 2026:**\n\n- Total Inverters: 48\n- Healthy: 36 (75%)\n- Medium Risk: 8 (17%)\n- High Risk: 4 (8%)\n- Avg AC_POWER: ~480W/inverter\n- Avg MODULE_TEMPERATURE: 47°C\n- Avg IRRADIATION: 892 W/m²\n\nThe plant is operating within normal parameters overall, but immediate attention is required for 4 high-risk inverters.",
  degrading:
    "**INV-21 Degradation Analysis:**\n\nOver the past 30 days, INV-21 has shown a consistent degradation pattern:\n- MODULE_TEMPERATURE: 58°C → 72°C (+14°C)\n- AC_POWER: 510W → 310W (-200W)\n- DC→AC conversion efficiency: 94% → 79%\n- IRRADIATION: 920 → 720 W/m² (soiling detected)\n\nThe most likely root causes based on our ML model:\n1. **Cooling system failure** (42% likelihood)\n2. **IGBT thermal stress** (31% likelihood)\n3. **DC cable degradation** (27% likelihood)",
};
