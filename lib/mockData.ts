export type InverterStatus = "Healthy" | "Medium Risk" | "High Risk";

export interface Inverter {
  id: string;
  mac: string;
  plant: string;
  inverter_power: number;
  pv1_power: number;
  pv2_power: number;
  energy_today: number;
  energy_total: number;
  power_factor: number;
  grid_frequency: number;
  grid_power: number;
  pv1_voltage: number;
  pv2_voltage: number;
  pv1_current: number;
  pv2_current: number;
  ambient_temperature: number;
  inverter_temp: number;
  temp_difference: number;
  inverters_alarm_code: number;
  inverters_op_state: number;
  rolling_mean_power_24h: number;
  rolling_std_power_24h: number;
  failure_label: number;
  riskScore: number;
  status: InverterStatus;
  // Legacy compat
  DC_POWER: number;
  AC_POWER: number;
  MODULE_TEMPERATURE: number;
  AMBIENT_TEMPERATURE: number;
  IRRADIATION: number;
  location: string;
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

/** 6 real inverters across 3 plants — aligned with solar_processed_dataset.csv */
export const mockInverters: Inverter[] = [
  {
    id: "INV-01",
    mac: "80-1F-12-0F-AC-BB",
    plant: "Plant 1",
    inverter_power: 4820,
    pv1_power: 2580,
    pv2_power: 2310,
    energy_today: 28.4,
    energy_total: 497983,
    power_factor: 0.98,
    grid_frequency: 49.98,
    grid_power: 4780,
    pv1_voltage: 602,
    pv2_voltage: 595,
    pv1_current: 4.28,
    pv2_current: 3.88,
    ambient_temperature: 34,
    inverter_temp: 42,
    temp_difference: 8,
    inverters_alarm_code: 0,
    inverters_op_state: 5120,
    rolling_mean_power_24h: 3200,
    rolling_std_power_24h: 1450,
    failure_label: 0,
    riskScore: 0.08,
    status: "Healthy",
    DC_POWER: 4890,
    AC_POWER: 4820,
    MODULE_TEMPERATURE: 42,
    AMBIENT_TEMPERATURE: 34,
    IRRADIATION: 920,
    location: "Plant 1",
    runtimeHours: 3200,
    lastMaintenance: "2026-01-15",
  },
  {
    id: "INV-02",
    mac: "80-1F-12-0F-AC-12",
    plant: "Plant 1",
    inverter_power: 4650,
    pv1_power: 2490,
    pv2_power: 2220,
    energy_today: 26.8,
    energy_total: 392107,
    power_factor: 0.97,
    grid_frequency: 49.95,
    grid_power: 4600,
    pv1_voltage: 598,
    pv2_voltage: 590,
    pv1_current: 4.16,
    pv2_current: 3.76,
    ambient_temperature: 35,
    inverter_temp: 44,
    temp_difference: 9,
    inverters_alarm_code: 0,
    inverters_op_state: 5120,
    rolling_mean_power_24h: 3050,
    rolling_std_power_24h: 1380,
    failure_label: 0,
    riskScore: 0.12,
    status: "Healthy",
    DC_POWER: 4710,
    AC_POWER: 4650,
    MODULE_TEMPERATURE: 44,
    AMBIENT_TEMPERATURE: 35,
    IRRADIATION: 910,
    location: "Plant 1",
    runtimeHours: 3100,
    lastMaintenance: "2026-01-20",
  },
  {
    id: "INV-03",
    mac: "ICR2-LT2-Celestical-10000.73",
    plant: "Plant 2",
    inverter_power: 3200,
    pv1_power: 1800,
    pv2_power: 1520,
    energy_today: 18.2,
    energy_total: 662002,
    power_factor: 0.93,
    grid_frequency: 50.01,
    grid_power: 3100,
    pv1_voltage: 580,
    pv2_voltage: 545,
    pv1_current: 3.1,
    pv2_current: 2.79,
    ambient_temperature: 38,
    inverter_temp: 58,
    temp_difference: 20,
    inverters_alarm_code: 2,
    inverters_op_state: -1,
    rolling_mean_power_24h: 2400,
    rolling_std_power_24h: 1800,
    failure_label: 1,
    riskScore: 0.72,
    status: "High Risk",
    DC_POWER: 3320,
    AC_POWER: 3200,
    MODULE_TEMPERATURE: 58,
    AMBIENT_TEMPERATURE: 38,
    IRRADIATION: 780,
    location: "Plant 2",
    runtimeHours: 4500,
    lastMaintenance: "2025-09-10",
  },
  {
    id: "INV-04",
    mac: "ICR2-LT1-Celestical-10000.73",
    plant: "Plant 2",
    inverter_power: 3900,
    pv1_power: 2100,
    pv2_power: 1880,
    energy_today: 22.1,
    energy_total: 580440,
    power_factor: 0.95,
    grid_frequency: 50.00,
    grid_power: 3850,
    pv1_voltage: 590,
    pv2_voltage: 570,
    pv1_current: 3.56,
    pv2_current: 3.3,
    ambient_temperature: 37,
    inverter_temp: 51,
    temp_difference: 14,
    inverters_alarm_code: 1,
    inverters_op_state: 5120,
    rolling_mean_power_24h: 2800,
    rolling_std_power_24h: 1520,
    failure_label: 0,
    riskScore: 0.45,
    status: "Medium Risk",
    DC_POWER: 3980,
    AC_POWER: 3900,
    MODULE_TEMPERATURE: 51,
    AMBIENT_TEMPERATURE: 37,
    IRRADIATION: 850,
    location: "Plant 2",
    runtimeHours: 4200,
    lastMaintenance: "2025-11-05",
  },
  {
    id: "INV-05",
    mac: "54-10-EC-8C-14-6E",
    plant: "Plant 3",
    inverter_power: 2800,
    pv1_power: 1550,
    pv2_power: 1340,
    energy_today: 15.6,
    energy_total: 310250,
    power_factor: 0.91,
    grid_frequency: 49.92,
    grid_power: 2720,
    pv1_voltage: 560,
    pv2_voltage: 530,
    pv1_current: 2.77,
    pv2_current: 2.53,
    ambient_temperature: 39,
    inverter_temp: 62,
    temp_difference: 23,
    inverters_alarm_code: 3,
    inverters_op_state: -1,
    rolling_mean_power_24h: 2000,
    rolling_std_power_24h: 1900,
    failure_label: 1,
    riskScore: 0.85,
    status: "High Risk",
    DC_POWER: 2890,
    AC_POWER: 2800,
    MODULE_TEMPERATURE: 62,
    AMBIENT_TEMPERATURE: 39,
    IRRADIATION: 720,
    location: "Plant 3",
    runtimeHours: 4800,
    lastMaintenance: "2025-08-20",
  },
  {
    id: "INV-06",
    mac: "54-10-EC-8C-14-69",
    plant: "Plant 3",
    inverter_power: 4200,
    pv1_power: 2280,
    pv2_power: 2000,
    energy_today: 24.5,
    energy_total: 445830,
    power_factor: 0.96,
    grid_frequency: 49.97,
    grid_power: 4150,
    pv1_voltage: 595,
    pv2_voltage: 582,
    pv1_current: 3.83,
    pv2_current: 3.44,
    ambient_temperature: 36,
    inverter_temp: 46,
    temp_difference: 10,
    inverters_alarm_code: 0,
    inverters_op_state: 5120,
    rolling_mean_power_24h: 2900,
    rolling_std_power_24h: 1400,
    failure_label: 0,
    riskScore: 0.18,
    status: "Healthy",
    DC_POWER: 4280,
    AC_POWER: 4200,
    MODULE_TEMPERATURE: 46,
    AMBIENT_TEMPERATURE: 36,
    IRRADIATION: 890,
    location: "Plant 3",
    runtimeHours: 3600,
    lastMaintenance: "2026-02-01",
  },
];

// Power output trend (last 14 days — aggregated fleet kW)
export const mockPowerTrend = [
  { date: "Feb 20", output: 22.4 },
  { date: "Feb 21", output: 23.1 },
  { date: "Feb 22", output: 21.8 },
  { date: "Feb 23", output: 24.2 },
  { date: "Feb 24", output: 24.8 },
  { date: "Feb 25", output: 22.9 },
  { date: "Feb 26", output: 21.5 },
  { date: "Feb 27", output: 23.4 },
  { date: "Feb 28", output: 24.0 },
  { date: "Mar 01", output: 24.6 },
  { date: "Mar 02", output: 23.2 },
  { date: "Mar 03", output: 23.8 },
  { date: "Mar 04", output: 22.7 },
  { date: "Mar 05", output: 23.6 },
];

// Temperature trend (last 14 days — avg inverter temp °C)
export const mockTempTrend = [
  { date: "Feb 20", avg: 44 },
  { date: "Feb 21", avg: 45 },
  { date: "Feb 22", avg: 43 },
  { date: "Feb 23", avg: 47 },
  { date: "Feb 24", avg: 48 },
  { date: "Feb 25", avg: 46 },
  { date: "Feb 26", avg: 49 },
  { date: "Feb 27", avg: 50 },
  { date: "Feb 28", avg: 48 },
  { date: "Mar 01", avg: 51 },
  { date: "Mar 02", avg: 52 },
  { date: "Mar 03", avg: 50 },
  { date: "Mar 04", avg: 53 },
  { date: "Mar 05", avg: 51 },
];

// Per-inverter telemetry (last 24 hours, hourly)
export function getMockTelemetry(inverterId: string): TelemetryPoint[] {
  const inv = mockInverters.find((i) => i.id === inverterId);
  const baseDC = inv?.DC_POWER ?? 4500;
  const baseAC = inv?.AC_POWER ?? 4400;
  const baseModTemp = inv?.MODULE_TEMPERATURE ?? 45;
  const baseAmbTemp = inv?.AMBIENT_TEMPERATURE ?? 36;
  const baseIrr = inv?.IRRADIATION ?? 920;

  return Array.from({ length: 24 }, (_, h) => {
    const timeStr = `${String(h).padStart(2, "0")}:00`;
    const solarFactor = h >= 6 && h <= 18 ? Math.sin(((h - 6) / 12) * Math.PI) : 0;
    return {
      time: timeStr,
      DC_POWER: parseFloat(Math.max(0, baseDC * solarFactor + (Math.random() * 200 - 100)).toFixed(1)),
      AC_POWER: parseFloat(Math.max(0, baseAC * solarFactor + (Math.random() * 150 - 75)).toFixed(1)),
      MODULE_TEMPERATURE: parseFloat((baseModTemp + solarFactor * 12 + (Math.random() * 3 - 1.5)).toFixed(1)),
      AMBIENT_TEMPERATURE: parseFloat((baseAmbTemp + solarFactor * 6 + (Math.random() * 2 - 1)).toFixed(1)),
      IRRADIATION: parseFloat(Math.max(0, baseIrr * solarFactor + (Math.random() * 40 - 20)).toFixed(1)),
    };
  });
}

export const mockInsights: Insight[] = [
  {
    id: "INS-001",
    inverterId: "INV-05",
    title: "High Risk — Thermal Stress Detected",
    description:
      "Inverter INV-05 (Plant 3, MAC: 54-10-EC-8C-14-6E) shows elevated inverter_temp at 62°C with temp_difference of 23°C. 3 alarm codes triggered. Immediate cooling system inspection required.",
    severity: "high",
    timestamp: "2026-03-07T08:30:00Z",
    actionRequired: "Inspect cooling fans and ventilation in Plant 3",
  },
  {
    id: "INS-002",
    inverterId: "INV-03",
    title: "High Risk — Power Degradation",
    description:
      "INV-03 (Plant 2, MAC: ICR2-LT2) shows power output at 3200W vs expected 4500W. Inverter temp at 58°C, rolling_mean_power_24h dropped to 2400W. Alarm code 2 active.",
    severity: "high",
    timestamp: "2026-03-07T07:15:00Z",
    actionRequired: "Check PV string connections and inverter IGBT",
  },
  {
    id: "INS-003",
    inverterId: "INV-04",
    title: "Medium Risk — Efficiency Declining",
    description:
      "INV-04 (Plant 2) power_factor dropped to 0.95 with rising temp_difference (14°C). Rolling power std deviation elevated at 1520W. Schedule maintenance within 2 weeks.",
    severity: "medium",
    timestamp: "2026-03-06T22:00:00Z",
    actionRequired: "Schedule preventive maintenance for INV-04",
  },
  {
    id: "INS-004",
    inverterId: "INV-01",
    title: "Healthy — Optimal Performance",
    description:
      "INV-01 (Plant 1) operating at peak efficiency. Power factor 0.98, inverter_temp stable at 42°C. No alarms. Energy today: 28.4 kWh.",
    severity: "low",
    timestamp: "2026-03-07T09:00:00Z",
    actionRequired: "No action required — continue monitoring",
  },
  {
    id: "INS-005",
    inverterId: "INV-06",
    title: "Healthy — Stable Output",
    description:
      "INV-06 (Plant 3) performing well despite Plant 3 conditions. Power output 4200W, temp stable at 46°C. Good candidate for reference baseline.",
    severity: "low",
    timestamp: "2026-03-06T16:30:00Z",
    actionRequired: "No action required",
  },
];

export const mockFeatureImportance = [
  { feature: "inverter_temp Rise", importance: 0.38 },
  { feature: "Power Output Drop", importance: 0.26 },
  { feature: "temp_difference", importance: 0.18 },
  { feature: "rolling_std_power_24h", importance: 0.12 },
  { feature: "alarm_code Frequency", importance: 0.06 },
];

export const mockAssistantResponses: Record<string, string> = {
  default:
    "I'm Sunlytix AI Assistant. I can help you analyze inverter health, review failure patterns, and provide maintenance recommendations. Try asking about a specific inverter or plant status.",
  risk: "Based on current telemetry, **INV-05** (Plant 3) has the highest risk score (0.85). Inverter temp: 62°C, temp_difference: 23°C, 3 alarm codes active. **INV-03** (Plant 2) is also critical at 0.72 risk with power degradation to 3200W. Both require immediate inspection.",
  "inv-21":
    "**INV-03** (Plant 2, ICR2-LT2) is in High Risk status:\n\n- inverter_power: 3200W (expected ~4500W)\n- inverter_temp: 58°C (threshold: 55°C)\n- temp_difference: 20°C\n- power_factor: 0.93\n- alarm_code: 2 active\n- rolling_mean_power_24h: 2400W\n- Risk Score: 0.72\n\n**Recommended Action:** Check PV string connections, inspect IGBT modules, and verify MPPT configuration.",
  inspect:
    "Priority inspection order based on risk scores:\n\n1. 🔴 **INV-05** (Risk: 0.85) — Plant 3 — Immediate\n2. 🔴 **INV-03** (Risk: 0.72) — Plant 2 — Immediate\n3. 🟡 **INV-04** (Risk: 0.45) — Plant 2 — Within 2 weeks\n4. 🟢 **INV-06** (Risk: 0.18) — Plant 3 — Routine\n5. 🟢 **INV-02** (Risk: 0.12) — Plant 1 — Routine\n6. 🟢 **INV-01** (Risk: 0.08) — Plant 1 — No action",
  overview:
    "**Fleet Overview — Mar 7, 2026:**\n\n- Total Inverters: 6 across 3 plants\n- Healthy: 3 (INV-01, INV-02, INV-06)\n- Medium Risk: 1 (INV-04)\n- High Risk: 2 (INV-03, INV-05)\n- Total Power Output: ~23.6 kW\n- Avg Inverter Temp: 50.5°C\n- Total Energy Today: 135.6 kWh\n\nPlant 1 is performing well. Plant 2 and Plant 3 each have one critical inverter requiring immediate attention.",
  degrading:
    "**INV-05 Degradation Analysis:**\n\nOver the past 14 days, INV-05 (Plant 3) shows consistent degradation:\n- inverter_temp: 48°C → 62°C (+14°C)\n- inverter_power: 4200W → 2800W (-33%)\n- temp_difference: 12°C → 23°C\n- alarm_codes: 0 → 3\n- power_factor: 0.96 → 0.91\n\nMost likely root causes:\n1. **Cooling system failure** (40% likelihood)\n2. **IGBT thermal stress** (32% likelihood)\n3. **PV string connection degradation** (28% likelihood)",
};
