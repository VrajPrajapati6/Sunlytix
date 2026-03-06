"""
seed_mongo.py
Seeds MongoDB with minimal hardcoded inverter data for testing (41 features).

Run:
    python scripts/seed_mongo.py
"""

import os
import math
from pymongo import MongoClient, UpdateOne
from datetime import datetime

MONGODB_URI = os.getenv(
    "MONGODB_URI",
    "mongodb+srv://vrajprajapati6004_db_user:vraj123p@cluster0.exwest4.mongodb.net/?appName=Cluster0",
)
DB_NAME = "sunlytix"
NOW = datetime.now()


def make_features(
    inverter_power, inverter_temp, efficiency, power_factor,
    alarm_code=0.0, ambient_temp=28.0
):
    """Build a 41-feature dict from key values, auto-deriving engineered cols."""
    pv1_v = 360.0
    pv2_v = 358.0
    pv1_i = round(inverter_power * 0.52 / pv1_v, 3) if pv1_v else 0.0
    pv2_i = round(inverter_power * 0.50 / pv2_v, 3) if pv2_v else 0.0
    pv1_p = pv1_v * pv1_i
    pv2_p = pv2_v * pv2_i
    total_dc = pv1_p + pv2_p
    grid_pwr = inverter_power * 0.98
    e_today  = round(inverter_power * 6 / 1000, 2)
    freq     = 50.0

    return {
        # Raw measurements
        "inverter_power":           float(inverter_power),
        "pv1_power":                float(pv1_p),
        "energy_total":             float(e_today * 365 * 3),
        "power_factor":             float(power_factor),
        "inverters_limit_percent":  100.0,
        "inverters_alarm_code":     float(alarm_code),
        "grid_frequency":           float(freq),
        "meters_meter_kwh_import":  0.0,
        "pv1_voltage":              float(pv1_v),
        "ambient_temperature":      float(ambient_temp),
        "inverters_kwh_midnight":   float(e_today),
        "grid_power":               float(grid_pwr),
        "pv2_power":                float(pv2_p),
        "inverter_temp":            float(inverter_temp),
        "meters_meter_kwh_total":   float(e_today * 365 * 3),
        "pv2_voltage":              float(pv2_v),
        "pv2_current":              float(pv2_i),
        "inverters_op_state":       1.0,
        "energy_today":             float(e_today),
        "pv1_current":              float(pv1_i),
        "pv3_current":              0.0,
        "smu_total_current":        round(total_dc / pv1_v, 3),
        "smu_mean_current":         round(total_dc / pv1_v / 2, 3),
        "smu_std_current":          0.05,
        "total_dc_power":           float(total_dc),
        "efficiency":               float(efficiency),
        "temp_difference":          float(inverter_temp - ambient_temp),
        "hour_of_day":              12.0,
        "day_of_week":              2.0,
        "rolling_mean_power_24h":   float(inverter_power),
        "rolling_std_power_24h":    float(inverter_power * 0.02),
        # Engineered
        "voltage_current_ratio":    round(pv1_v / pv1_i, 3) if pv1_i else 0.0,
        "pv1_power_calc":           float(pv1_p),
        "pv2_power_calc":           float(pv2_p),
        "power_efficiency":         float(efficiency),
        "grid_power_ratio":         round(grid_pwr / inverter_power, 4) if inverter_power else 0.0,
        "temp_diff_calc":           float(inverter_temp - ambient_temp),
        "temp_voltage_interaction": round(inverter_temp * pv1_v, 2),
        "pv1_current_sq":           round(pv1_i ** 2, 4),
        "pv1_voltage_sq":           round(pv1_v ** 2, 2),
        "freq_deviation":           abs(freq - 50.0),
    }


INVERTERS_FEATURES = [
    {"inverterId": "INV-01", **make_features(4800, 42, 96.8, 0.99)},
    {"inverterId": "INV-02", **make_features(4750, 44, 96.5, 0.98)},
    {"inverterId": "INV-03", **make_features(4200, 62, 91.0, 0.95, alarm_code=0.0)},
    {"inverterId": "INV-04", **make_features(3100, 74, 83.0, 0.91, alarm_code=5.0)},
    {"inverterId": "INV-05", **make_features(800,  78, 71.0, 0.88, alarm_code=7.0)},
]

INVERTERS_DISPLAY = [
    {"id": "INV-01", "name": "Inverter 01", "location": "Plant A – Row 1",
     "status": "online",   "DC_POWER": 4800, "AC_POWER": 4752, "MODULE_TEMPERATURE": 42, "EFFICIENCY": 96.8, "lastUpdated": NOW},
    {"id": "INV-02", "name": "Inverter 02", "location": "Plant A – Row 2",
     "status": "online",   "DC_POWER": 4750, "AC_POWER": 4655, "MODULE_TEMPERATURE": 44, "EFFICIENCY": 96.5, "lastUpdated": NOW},
    {"id": "INV-03", "name": "Inverter 03", "location": "Plant A – Row 3",
     "status": "warning",  "DC_POWER": 4200, "AC_POWER": 3822, "MODULE_TEMPERATURE": 62, "EFFICIENCY": 91.0, "lastUpdated": NOW},
    {"id": "INV-04", "name": "Inverter 04", "location": "Plant B – Row 1",
     "status": "critical", "DC_POWER": 3100, "AC_POWER": 2573, "MODULE_TEMPERATURE": 74, "EFFICIENCY": 83.0, "lastUpdated": NOW},
    {"id": "INV-05", "name": "Inverter 05", "location": "Plant B – Row 2",
     "status": "critical", "DC_POWER": 800,  "AC_POWER": 576,  "MODULE_TEMPERATURE": 78, "EFFICIENCY": 71.0, "lastUpdated": NOW},
]


def seed():
    print("=" * 60)
    print("Sunlytix Minimal Seed (41 features)")
    print("=" * 60)

    client = MongoClient(MONGODB_URI, tls=True, tlsAllowInvalidCertificates=True)
    db = client[DB_NAME]

    r1 = db["inverter_features"].bulk_write([
        UpdateOne({"inverterId": d["inverterId"]}, {"$set": {**d, "seededAt": NOW}}, upsert=True)
        for d in INVERTERS_FEATURES
    ])
    print(f"[inverter_features]  upserted={r1.upserted_count}  modified={r1.modified_count}")

    r2 = db["inverters"].bulk_write([
        UpdateOne({"id": d["id"]}, {"$set": d}, upsert=True)
        for d in INVERTERS_DISPLAY
    ])
    print(f"[inverters]          upserted={r2.upserted_count}  modified={r2.modified_count}")

    client.close()
    print("\nDone. IDs: " + ", ".join(d["inverterId"] for d in INVERTERS_FEATURES))


if __name__ == "__main__":
    seed()
