"""
generate_knowledge_base.py
--------------------------
Generates a rich, diverse knowledge base from:
  1. Actual dataset statistics (per-inverter, per-plant)
  2. Domain expertise documents (alarm codes, op states, root causes)
  3. Feature interpretation guides
  4. Maintenance recommendations

Each document is a self-contained paragraph separated by '---DOC---' delimiter.
"""

import pandas as pd
import numpy as np
import os

# ---------------------------------------------------------------------------
# LOAD DATASET
# ---------------------------------------------------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(SCRIPT_DIR, "solar_processed_dataset.csv")

df = pd.read_csv(CSV_PATH)

# ---------------------------------------------------------------------------
# CONSTANTS
# ---------------------------------------------------------------------------
MAC_NAMES = {
    "80-1F-12-0F-AC-BB": "INV-BB",
    "80-1F-12-0F-AC-12": "INV-12",
    "ICR2-LT2-Celestical-10000.73": "INV-LT2",
    "ICR2-LT1-Celestical-10000.73": "INV-LT1",
    "54-10-EC-8C-14-6E": "INV-6E",
    "54-10-EC-8C-14-69": "INV-69",
}

MAC_TO_PLANT = {}
for mac in df["mac"].unique():
    sub = df[df["mac"] == mac]
    if sub["plant_id_plant_1"].any():
        MAC_TO_PLANT[mac] = "Plant 1"
    elif sub["plant_id_plant_2"].any():
        MAC_TO_PLANT[mac] = "Plant 2"
    else:
        MAC_TO_PLANT[mac] = "Plant 3"

ALARM_CODES = {
    0: "No alarm – inverter operating normally.",
    8: "Grid under-voltage – grid voltage dropped below the acceptable threshold.",
    10: "Grid over-voltage – grid voltage exceeded the safe upper limit.",
    39: "Insulation resistance fault – DC-side insulation degradation detected.",
    100: "General inverter warning – non-critical alert; check logs for details.",
    534: "Fan failure – cooling fan stopped or running below required RPM.",
    548: "Over-temperature shutdown – inverter temperature exceeded safe operating limit (typically >75°C).",
    556: "DC arc fault detected – potential arc on the DC string wiring.",
    558: "Communication timeout – inverter lost data link with the monitoring gateway.",
    563: "Ground fault – current leakage to ground detected on DC side.",
}

OP_STATES = {
    -1: "Unknown / Offline – inverter is not communicating or in an undefined state.",
    0: "Standby – inverter is powered on but not generating (e.g., nighttime or waiting for sufficient irradiance).",
    3: "Starting – inverter is initializing and preparing to connect to grid.",
    4: "Running (Grid-tied) – inverter is actively converting DC to AC and feeding power to the grid.",
    8: "Shutdown – inverter has performed a controlled shutdown (manual or automated).",
    4864: "Fault recovery – inverter is attempting to automatically recover from a fault condition.",
    5120: "Warning state – inverter is running but has an active warning flag. Performance may be degraded.",
    5632: "Derating – inverter has reduced output power to protect itself (thermal or voltage derating).",
    33280: "Emergency stop – inverter was stopped due to a critical safety event.",
    37120: "Maintenance mode – inverter is in service/maintenance mode, not producing power.",
}

docs = []

# ---------------------------------------------------------------------------
# SECTION 1: SYSTEM OVERVIEW
# ---------------------------------------------------------------------------
total_rows = len(df)
total_macs = df["mac"].nunique()
total_failures = int(df["future_failure"].sum())
failure_pct = df["future_failure"].mean() * 100

docs.append(f"""Sunlytix Solar Monitoring System Overview

The Sunlytix platform monitors {total_macs} solar inverters across 3 plants. The dataset contains {total_rows:,} telemetry records collected from March 2024 onward. Each record includes power output, voltage, current, temperature, grid metrics, alarm codes, and operational state.

Overall failure rate across the fleet: {failure_pct:.1f}% of time windows show an upcoming failure within the prediction horizon. The ML model (RandomForestClassifier with 24 features) achieves 95.88% accuracy predicting future failures.

Plants monitored:
- Plant 1: Inverters INV-6E (MAC 54-10-EC-8C-14-6E) and INV-69 (MAC 54-10-EC-8C-14-69)
- Plant 2: Inverters INV-BB (MAC 80-1F-12-0F-AC-BB) and INV-12 (MAC 80-1F-12-0F-AC-12)
- Plant 3: Inverters INV-LT1 (MAC ICR2-LT1-Celestical-10000.73) and INV-LT2 (MAC ICR2-LT2-Celestical-10000.73)""")

# ---------------------------------------------------------------------------
# SECTION 2: PER-INVERTER PROFILES
# ---------------------------------------------------------------------------
for mac in df["mac"].unique():
    sub = df[df["mac"] == mac]
    plant = MAC_TO_PLANT[mac]
    name = MAC_NAMES.get(mac, mac)

    fail_sub = sub[sub["future_failure"] == True]
    ok_sub = sub[sub["future_failure"] == False]

    avg_power = sub["inverter_power"].mean()
    max_power = sub["inverter_power"].max()
    avg_temp = sub["inverter_temp"].mean()
    max_temp = sub["inverter_temp"].max()
    fail_rate = sub["future_failure"].mean() * 100
    total_records = len(sub)

    fail_avg_temp = fail_sub["inverter_temp"].mean() if len(fail_sub) > 0 else 0
    fail_avg_power = fail_sub["inverter_power"].mean() if len(fail_sub) > 0 else 0
    ok_avg_temp = ok_sub["inverter_temp"].mean() if len(ok_sub) > 0 else 0
    ok_avg_power = ok_sub["inverter_power"].mean() if len(ok_sub) > 0 else 0

    if len(fail_sub) > 0:
        top_alarm = fail_sub["inverters_alarm_code"].mode().values[0]
        alarm_desc = ALARM_CODES.get(int(top_alarm), "Unknown alarm")
    else:
        top_alarm = 0
        alarm_desc = "N/A"

    temp_delta = fail_avg_temp - ok_avg_temp
    temp_insight = (
        f"Temperature rises by {temp_delta:.1f} degrees C on average before failure events."
        if temp_delta > 0.5
        else "Temperature does not significantly increase before failures for this inverter."
    )

    docs.append(f"""Inverter Profile: {name} (MAC: {mac})

Location: {plant}
Total telemetry records: {total_records:,}
Failure rate: {fail_rate:.1f}%

Normal operation averages: power={ok_avg_power:.1f}W, temperature={ok_avg_temp:.1f}°C
Pre-failure averages: power={fail_avg_power:.1f}W, temperature={fail_avg_temp:.1f}°C
Maximum recorded: power={max_power:.1f}W, temperature={max_temp:.1f}°C

Most frequent alarm during pre-failure windows: code {int(top_alarm)} – {alarm_desc}

Key insight: {temp_insight}""")

# ---------------------------------------------------------------------------
# SECTION 3: PER-PLANT SUMMARIES
# ---------------------------------------------------------------------------
for plant_col, plant_name in [
    ("plant_id_plant_1", "Plant 1"),
    ("plant_id_plant_2", "Plant 2"),
    ("plant_id_plant_3", "Plant 3"),
]:
    sub = df[df[plant_col] == True]
    if len(sub) == 0:
        continue
    inverters = sub["mac"].unique()
    inv_names = [MAC_NAMES.get(m, m) for m in inverters]
    fail_rate = sub["future_failure"].mean() * 100
    avg_power = sub["inverter_power"].mean()
    avg_temp = sub["inverter_temp"].mean()
    top_alarm = sub[sub["inverters_alarm_code"] > 0]["inverters_alarm_code"].mode()
    top_alarm_val = int(top_alarm.values[0]) if len(top_alarm) > 0 else 0

    docs.append(f"""{plant_name} Summary

Inverters: {', '.join(inv_names)} (MACs: {', '.join(inverters)})
Total records: {len(sub):,}
Fleet failure rate: {fail_rate:.1f}%
Average power output: {avg_power:.1f}W
Average inverter temperature: {avg_temp:.1f}°C
Most common non-zero alarm code: {top_alarm_val} – {ALARM_CODES.get(top_alarm_val, 'Unknown')}

{"This plant has the highest failure rate in the fleet and requires closer monitoring." if fail_rate > 54 else "This plant operates within normal failure rate bounds."}""")

# ---------------------------------------------------------------------------
# SECTION 4: ALARM CODE REFERENCE
# ---------------------------------------------------------------------------
alarm_doc = "Solar Inverter Alarm Code Reference Guide\n\n"
alarm_doc += "The following alarm codes are observed in the Sunlytix monitoring system:\n\n"
for code, desc in sorted(ALARM_CODES.items()):
    count = int((df["inverters_alarm_code"] == code).sum())
    pct = count / len(df) * 100
    alarm_doc += f"- Alarm {code}: {desc} (Occurrences: {count:,}, {pct:.2f}% of records)\n"
alarm_doc += "\nAlarm code 0 means normal operation. Alarm 100 is the most common alert and indicates a general warning. Alarms 548 and 558 are significant – 548 indicates dangerous over-temperature and 558 indicates communication loss with the monitoring system."
docs.append(alarm_doc)

# ---------------------------------------------------------------------------
# SECTION 5: OPERATIONAL STATE REFERENCE
# ---------------------------------------------------------------------------
op_doc = "Solar Inverter Operational State Reference Guide\n\n"
op_doc += "Inverters report an operational state code indicating their current mode:\n\n"
for state, desc in sorted(OP_STATES.items()):
    count = int((df["inverters_op_state"] == state).sum())
    pct = count / len(df) * 100
    op_doc += f"- State {state}: {desc} (Occurrences: {count:,}, {pct:.2f}% of records)\n"
op_doc += "\nState 0 (Standby) is the most common state, accounting for nighttime and low-irradiance periods. State 4 (Running) represents active power generation. State 5120 (Warning) is critical to monitor as it often precedes failure events."
docs.append(op_doc)

# ---------------------------------------------------------------------------
# SECTION 6: FEATURE IMPORTANCE & INTERPRETATION
# ---------------------------------------------------------------------------
docs.append("""ML Model Feature Guide: What Each Telemetry Signal Means

The RandomForestClassifier uses 24 features to predict future inverter failures. Understanding what each feature represents helps interpret predictions:

Power metrics:
- inverter_power: Total AC power output of the inverter in watts. A sudden drop or spike indicates anomalies.
- pv1_power / pv2_power: Power from PV string 1 and string 2. Imbalance between strings suggests shading, soiling, or string-level faults.
- grid_power: Power flowing to/from the grid. Negative values indicate power export.
- energy_today: Cumulative energy produced today in kWh.
- energy_total: Lifetime energy production in kWh.

Voltage and current:
- pv1_voltage / pv2_voltage: DC voltage from each PV string. Low voltage may indicate shading or cell degradation.
- pv1_current / pv2_current: DC current from each string. High current with low voltage can indicate short circuits.
- power_factor: Ratio of real to apparent power. Values far from 1.0 indicate reactive power issues.

Temperature:
- inverter_temp: Internal temperature of the inverter in degrees Celsius. Normal range is 25-55 degrees C. Above 65 degrees C is a warning, above 75 degrees C triggers shutdown.
- ambient_temperature: External ambient temperature (note: currently reads 0 in this dataset due to sensor issue).
- temp_difference: Difference between inverter and ambient temperature. Due to ambient being 0, this equals inverter_temp.

Grid:
- grid_frequency: AC grid frequency in Hz. Normal is 49.9-50.1 Hz. Deviations indicate grid instability.

Derived features:
- smu_std_current: Standard deviation of current measurements. High values indicate unstable current flow.
- rolling_mean_power_24h: 24-hour rolling average of power output. Tracks generation trends.
- rolling_std_power_24h: 24-hour rolling standard deviation of power. High values indicate erratic output.
- day_of_week: Day of week (0=Monday to 6=Sunday). Captures weekly maintenance patterns.

Categorical:
- inverters_alarm_code: Current alarm code (see Alarm Code Reference).
- inverters_op_state: Current operational state (see Operational State Reference).
- plant_id_plant_1 / plant_id_plant_2 / plant_id_plant_3: One-hot encoded plant identifier.""")

# ---------------------------------------------------------------------------
# SECTION 7: ROOT CAUSE ANALYSIS
# ---------------------------------------------------------------------------
docs.append("""Root Cause Analysis: Common Solar Inverter Failure Modes

Based on analysis of the Sunlytix fleet data, the following root causes are identified:

1. Thermal Degradation
   - Symptoms: inverter_temp above 65 degrees C, alarm code 548, op_state 5632 (derating)
   - Cause: Blocked ventilation, fan failure (alarm 534), high ambient temperature, or excessive load
   - Action: Inspect cooling system, clean air filters, check fan operation, verify ventilation clearance
   - Prevention: Schedule quarterly fan inspections, install temperature monitoring alerts at 60 degrees C

2. Communication Failures
   - Symptoms: alarm code 558, op_state -1 (offline)
   - Cause: Network cable damage, gateway malfunction, firmware bug, or power supply interruption
   - Action: Check network cables, restart gateway, verify firmware version, inspect power supply
   - Prevention: Use redundant communication paths, set up heartbeat monitoring

3. Grid Instability
   - Symptoms: grid_frequency outside 49.5-50.5 Hz, alarm codes 8 or 10, power_factor deviation
   - Cause: Local grid voltage fluctuations, transformer issues, or utility-side problems
   - Action: Monitor grid parameters, install voltage stabilizers, contact utility if persistent
   - Prevention: Install grid-side monitoring, configure appropriate voltage ride-through settings

4. DC-Side Faults
   - Symptoms: alarm codes 39 (insulation), 556 (arc fault), 563 (ground fault)
   - Cause: Cable insulation breakdown, connector corrosion, moisture ingress, rodent damage
   - Action: Perform insulation resistance testing, inspect all DC connectors and cables
   - Prevention: Annual IR testing, use rodent-proof conduit, apply waterproof connectors

5. Power Output Instability
   - Symptoms: high rolling_std_power_24h, large power swings, smu_std_current spikes
   - Cause: Intermittent shading, tracker malfunction, MPPT hunting, or inverter control board issues
   - Action: Inspect for shading sources, check tracker operation, review MPPT settings
   - Prevention: Vegetation management, tracker maintenance schedule, firmware updates

6. String Imbalance
   - Symptoms: large difference between pv1_power and pv2_power, or pv1_current and pv2_current
   - Cause: Panel degradation, soiling, shading on one string, broken bypass diode
   - Action: Compare string-level IV curves, clean panels, inspect bypass diodes
   - Prevention: Regular panel cleaning schedule, annual IV curve testing""")

# ---------------------------------------------------------------------------
# SECTION 8: MAINTENANCE RECOMMENDATIONS
# ---------------------------------------------------------------------------
docs.append("""Preventive Maintenance Schedule for Solar Inverters

Daily checks (automated via Sunlytix):
- Monitor inverter_power vs expected output for each inverter
- Check for new alarm codes (non-zero inverters_alarm_code)
- Verify all inverters are in expected op_state during daylight hours
- Flag any inverter_temp readings above 60 degrees C

Weekly checks:
- Review rolling_std_power_24h trends — increasing values indicate developing issues
- Compare string-level power (pv1_power vs pv2_power) for imbalance detection
- Check grid_frequency stability patterns
- Review the AI model failure predictions for the upcoming week

Monthly checks:
- Inspect inverter cooling systems (fans, filters, ventilation)
- Clean panels if soiling is detected through power degradation
- Verify communication reliability (any recurring alarm 558)
- Review energy_today trends against historical baselines

Quarterly checks:
- Perform thermal imaging of all inverters during peak load
- Test DC insulation resistance on all strings
- Inspect all electrical connections for corrosion or loosening
- Update inverter firmware if new versions are available

Annual checks:
- Full IV curve testing on all PV strings
- Comprehensive electrical safety testing
- Inverter calibration verification
- Review and update alarm thresholds based on fleet performance data""")

# ---------------------------------------------------------------------------
# SECTION 9: THRESHOLD GUIDELINES
# ---------------------------------------------------------------------------
docs.append("""Telemetry Thresholds and Alert Levels for Sunlytix Monitoring

Temperature thresholds:
- Normal: inverter_temp below 55 degrees C — no action needed
- Elevated: 55-65 degrees C — monitor closely, check ventilation
- Warning: 65-75 degrees C — schedule maintenance, consider derating
- Critical: above 75 degrees C — immediate shutdown expected (alarm 548)

Power output thresholds:
- Normal variation: rolling_std_power_24h below 500W — expected daily fluctuation
- Elevated variation: 500-1000W — check for shading or tracker issues
- High variation: above 1000W — investigate inverter stability, MPPT, control board

Grid frequency thresholds:
- Normal: 49.9-50.1 Hz — stable grid connection
- Caution: 49.5-49.9 Hz or 50.1-50.5 Hz — grid stress detected
- Critical: below 49.5 Hz or above 50.5 Hz — disconnection may occur (alarms 8/10)

Current stability:
- Normal: smu_std_current below 50 — stable current flow
- Warning: 50-200 — current fluctuations, check DC connections
- Critical: above 200 — severe electrical instability, inspect immediately

Power factor:
- Normal: above 0.95 — clean power delivery
- Warning: 0.85-0.95 — reactive power compensation may be needed
- Poor: below 0.85 — investigate capacitor banks, inverter settings""")

# ---------------------------------------------------------------------------
# SECTION 10: DATA-DRIVEN FAILURE PATTERNS
# ---------------------------------------------------------------------------
failure_df = df[df["future_failure"] == True]
normal_df = df[df["future_failure"] == False]

f_std = failure_df["rolling_std_power_24h"].mean()
n_std = normal_df["rolling_std_power_24h"].mean()
stability_word = "increases" if f_std > n_std else "decreases"

docs.append(f"""Data-Driven Failure Patterns: Pre-Failure vs Normal Operation

Analysis of {len(failure_df):,} pre-failure records vs {len(normal_df):,} normal records reveals:

Temperature patterns:
- Normal operation average temperature: {normal_df['inverter_temp'].mean():.1f} degrees C
- Pre-failure average temperature: {failure_df['inverter_temp'].mean():.1f} degrees C
- Temperature difference: {failure_df['inverter_temp'].mean() - normal_df['inverter_temp'].mean():.1f} degrees C higher before failures

Power stability:
- Normal rolling_std_power_24h: {normal_df['rolling_std_power_24h'].mean():.1f}W
- Pre-failure rolling_std_power_24h: {failure_df['rolling_std_power_24h'].mean():.1f}W
- Power instability {stability_word} before failure events

Current stability:
- Normal smu_std_current: {normal_df['smu_std_current'].mean():.1f}
- Pre-failure smu_std_current: {failure_df['smu_std_current'].mean():.1f}

Grid frequency:
- Normal grid_frequency: {normal_df['grid_frequency'].mean():.3f} Hz
- Pre-failure grid_frequency: {failure_df['grid_frequency'].mean():.3f} Hz

Alarm code distribution during pre-failure windows:
- No alarm (code 0): {int((failure_df['inverters_alarm_code'] == 0).sum()):,} records ({(failure_df['inverters_alarm_code'] == 0).mean()*100:.1f}%)
- General warning (code 100): {int((failure_df['inverters_alarm_code'] == 100).sum()):,} records ({(failure_df['inverters_alarm_code'] == 100).mean()*100:.1f}%)
- Other alarms: {int((failure_df['inverters_alarm_code'] > 0).sum() - (failure_df['inverters_alarm_code'] == 100).sum()):,} records""")

# ---------------------------------------------------------------------------
# SECTION 11: TEMPORAL PATTERNS
# ---------------------------------------------------------------------------
if "hour_of_day" in df.columns:
    hourly = df.groupby("hour_of_day")["future_failure"].mean() * 100
    peak_hour = int(hourly.idxmax())
    min_hour = int(hourly.idxmin())

    docs.append(f"""Temporal Failure Patterns in Solar Inverter Operation

Hourly analysis:
- Peak failure probability hour: {peak_hour}:00 ({hourly[peak_hour]:.1f}%)
- Lowest failure probability hour: {min_hour}:00 ({hourly[min_hour]:.1f}%)
- Nighttime (20:00-05:00): Inverters are typically in standby (op_state 0). Failures during night usually indicate communication or control system issues, not power conversion problems.
- Peak generation hours (10:00-15:00): Highest thermal stress. Monitor inverter temperatures closely.
- Morning ramp-up (06:00-09:00): MPPT initialization can cause brief power fluctuations. Alarm code 100 is common during startup.

Day-of-week analysis:
- Weekend failure rates may differ due to reduced maintenance staff availability
- Monday spikes can indicate issues that developed over the weekend without intervention

Seasonal considerations:
- Summer: Higher ambient temperatures increase thermal stress. Watch for alarm 548 (over-temperature).
- Winter: Lower irradiance means lower power output but also lower thermal stress.
- Monsoon or rainy season: Watch for ground faults (alarm 563) and insulation faults (alarm 39) due to moisture.""")

# ---------------------------------------------------------------------------
# SECTION 12: HIGH-VALUE FAILURE CASE STUDIES
# ---------------------------------------------------------------------------
for mac in list(df["mac"].unique())[:3]:
    sub = df[df["mac"] == mac]
    name = MAC_NAMES.get(mac, mac)
    plant = MAC_TO_PLANT[mac]

    fail_sub = sub[sub["future_failure"] == True]
    if len(fail_sub) == 0:
        continue

    hot_case = fail_sub.nlargest(1, "inverter_temp").iloc[0]
    alarm_val = int(hot_case["inverters_alarm_code"])
    op_val = int(hot_case["inverters_op_state"])

    docs.append(f"""Case Study: High Temperature Failure Event – {name} ({plant})

Inverter: {name} (MAC: {mac})
Timestamp: {hot_case['datetime']}
Inverter temperature: {hot_case['inverter_temp']:.1f} degrees C
Inverter power: {hot_case['inverter_power']:.1f}W
PV1 power: {hot_case['pv1_power']:.1f}W
PV2 power: {hot_case['pv2_power']:.1f}W
Alarm code: {alarm_val} – {ALARM_CODES.get(alarm_val, 'Unknown')}
Op state: {op_val} – {OP_STATES.get(op_val, 'Unknown')}
Rolling std power 24h: {hot_case['rolling_std_power_24h']:.1f}W
SMU std current: {hot_case['smu_std_current']:.1f}

Analysis: This event shows the inverter reaching {hot_case['inverter_temp']:.1f} degrees C, {"well above" if hot_case["inverter_temp"] > 65 else "within"} typical operating range. {"The combination of high temperature and alarm code " + str(alarm_val) + " suggests thermal stress was the primary failure driver." if hot_case["inverter_temp"] > 60 else "Temperature alone was not the primary driver; check other parameters."}""")

    # Communication failure case
    comm_fail = fail_sub[fail_sub["inverters_alarm_code"] == 558]
    if len(comm_fail) > 0:
        case = comm_fail.iloc[0]
        op_val2 = int(case["inverters_op_state"])
        docs.append(f"""Case Study: Communication Failure – {name} ({plant})

Inverter: {name} (MAC: {mac})
Timestamp: {case['datetime']}
Alarm code: 558 – Communication timeout
Op state: {op_val2} – {OP_STATES.get(op_val2, 'Unknown')}
Inverter power: {case['inverter_power']:.1f}W
Inverter temperature: {case['inverter_temp']:.1f} degrees C

Analysis: Communication timeout (alarm 558) indicates the inverter lost its data connection to the monitoring gateway. During this event, {"power output was zero, suggesting the inverter may have shut down" if case["inverter_power"] < 1 else "the inverter was still producing power, suggesting only the monitoring link was lost"}. Communication failures can mask developing faults since telemetry data is unavailable during the outage.""")

# ---------------------------------------------------------------------------
# SECTION 13: ML MODEL INTERPRETATION GUIDE
# ---------------------------------------------------------------------------
docs.append("""How to Interpret ML Model Predictions

The Sunlytix failure prediction model outputs:
1. Binary prediction: 0 (no failure expected) or 1 (failure likely)
2. Failure probability: 0.0 to 1.0 (confidence level)

Probability interpretation:
- 0.0 to 0.3: Low risk — continue normal monitoring
- 0.3 to 0.5: Moderate risk — increase monitoring frequency
- 0.5 to 0.7: High risk — schedule preventive maintenance within 48 hours
- 0.7 to 0.9: Very high risk — schedule maintenance within 24 hours
- 0.9 to 1.0: Critical — immediate inspection recommended

SHAP analysis shows the top factors driving predictions:
- rolling_std_power_24h (most important): High power variability is the strongest failure predictor
- inverter_temp: Elevated temperature strongly predicts failures
- smu_std_current: Unstable current patterns indicate electrical issues
- inverters_alarm_code: Active alarms significantly increase failure probability
- pv1_power and pv2_power: String-level power anomalies predict failures

When the model predicts a failure, check the SHAP values to understand which specific features drove the prediction. This enables targeted maintenance rather than general inspection.""")

# ---------------------------------------------------------------------------
# SECTION 14: FAQ-STYLE DOCUMENTS
# ---------------------------------------------------------------------------
faq_docs = [
    """Question: Why is my inverter temperature increasing?

Rising inverter temperature can be caused by several factors:
1. Blocked ventilation – Check if air intake and exhaust vents are obstructed by dust, debris, or vegetation
2. Fan failure – Alarm code 534 indicates fan malfunction. Inspect fan rotation and power supply
3. High ambient temperature – Summer heat increases baseline temperature. Normal operating range is 25-55 degrees C
4. Excessive load – Overloaded inverter generates more heat. Check if output exceeds rated capacity
5. Internal component degradation – Aging capacitors or IGBTs generate excess heat

Immediate actions: Check ventilation clearance, inspect fan operation, review recent power output levels.
If temperature exceeds 65 degrees C, schedule maintenance. Above 75 degrees C, expect automatic shutdown (alarm 548).""",

    """Question: Why did my inverter shut down?

Common shutdown causes and their alarm codes:
- Alarm 548: Over-temperature – inverter exceeded thermal limits. Check cooling system.
- Alarm 8: Grid under-voltage – grid voltage too low. Check grid connection and utility supply.
- Alarm 10: Grid over-voltage – grid voltage too high. May need grid operator intervention.
- Alarm 563: Ground fault – DC leakage current detected. Inspect cables and connectors.
- Alarm 556: DC arc fault – dangerous arcing on DC wiring. Immediate inspection required.
- Op state -1: Communication lost – inverter may still be running but monitoring is down.
- Op state 33280: Emergency stop – triggered by critical safety event.

Check the inverters_alarm_code and inverters_op_state for the specific cause.""",

    """Question: What does alarm code 100 mean?

Alarm code 100 is a general inverter warning. It is the most frequently occurring non-zero alarm in the Sunlytix fleet, appearing in approximately 16% of all records. This alarm indicates a non-critical condition that the inverter has flagged for attention.

Common triggers for alarm 100:
- Grid frequency approaching limits but not yet out of range
- Minor power factor deviation
- Transient sensor reading outside normal range
- Firmware-level informational alert

Action: Alarm 100 alone typically does not require immediate intervention. However, if alarm 100 persists for more than 24 hours or appears alongside elevated inverter_temp or high rolling_std_power_24h, it may indicate a developing issue that warrants investigation.""",

    """Question: How do I know if my inverter is operating normally?

A healthy inverter exhibits these characteristics:
- Op state 4 (Running) during daylight hours
- Op state 0 (Standby) during nighttime
- Alarm code 0 (No alarm)
- Inverter temperature between 25-55 degrees C
- Grid frequency between 49.9-50.1 Hz
- Power factor close to 1.0
- Balanced PV string power (pv1_power approximately equals pv2_power)
- Low rolling_std_power_24h (below 500W)
- Low smu_std_current (below 50)

If any of these parameters are outside normal range, investigate the cause. Use the ML model failure probability score for an integrated health assessment.""",

    """Question: Why is there a difference between pv1_power and pv2_power?

String imbalance (difference between PV string 1 and PV string 2 power) can indicate:
1. Partial shading – one string is shaded while the other receives full irradiance
2. Soiling – dirt, dust, or bird droppings on panels in one string
3. Panel degradation – cells in one string have aged or developed micro-cracks
4. Bypass diode failure – a failed bypass diode in one string reduces output
5. Wiring issue – loose connection, corroded terminal, or damaged cable on one string

Action: Compare pv1_voltage and pv2_voltage alongside power. If voltage is also imbalanced, the issue is at the panel or string level. If voltage is balanced but current differs, look for soiling or shading.""",

    """Question: My inverter shows op_state 5120 (Warning). What should I do?

Op state 5120 indicates the inverter is running but has an active warning condition. The inverter continues to produce power, but performance may be degraded.

Steps to investigate:
1. Check the concurrent alarm code – this tells you what specific warning is active
2. Monitor inverter_temp – warning state often accompanies thermal issues
3. Review rolling_std_power_24h – high values during warning state suggest power instability
4. Check if the warning is intermittent or persistent
5. Compare output with similar inverters at the same plant

If the warning state persists for more than 4 hours during generation hours, schedule maintenance. Recurring warning states indicate a developing fault that will likely escalate to failure.""",
]

docs.extend(faq_docs)

# ---------------------------------------------------------------------------
# SECTION 15: COMPARATIVE ANALYSIS ACROSS PLANTS
# ---------------------------------------------------------------------------
p1 = df[df["plant_id_plant_1"] == True]
p2 = df[df["plant_id_plant_2"] == True]
p3 = df[df["plant_id_plant_3"] == True]

coverage_note = (
    "Plant 3 has fewer total records, which may indicate more frequent communication issues or a shorter operational history."
    if len(p3) < len(p1) * 0.7
    else "All plants have comparable data coverage."
)

docs.append(f"""Comparative Performance Analysis Across Plants

Plant 1 (Inverters: INV-6E, INV-69):
- Average power: {p1['inverter_power'].mean():.1f}W
- Average temperature: {p1['inverter_temp'].mean():.1f} degrees C
- Failure rate: {p1['future_failure'].mean()*100:.1f}%

Plant 2 (Inverters: INV-BB, INV-12):
- Average power: {p2['inverter_power'].mean():.1f}W
- Average temperature: {p2['inverter_temp'].mean():.1f} degrees C
- Failure rate: {p2['future_failure'].mean()*100:.1f}%

Plant 3 (Inverters: INV-LT1, INV-LT2):
- Average power: {p3['inverter_power'].mean():.1f}W
- Average temperature: {p3['inverter_temp'].mean():.1f} degrees C
- Failure rate: {p3['future_failure'].mean()*100:.1f}%

{coverage_note}""")

# ---------------------------------------------------------------------------
# WRITE KNOWLEDGE BASE
# ---------------------------------------------------------------------------
DOC_SEPARATOR = "\n---DOC---\n"
output_path = os.path.join(SCRIPT_DIR, "knowledge_base.txt")
with open(output_path, "w", encoding="utf-8") as f:
    f.write(DOC_SEPARATOR.join(docs))

print(f"Knowledge base generated successfully!")
print(f"Total documents: {len(docs)}")
print(f"Output: {output_path}")
