"""
FeatureGenerator
Mirrors the class used to create feature_generator.pkl.
The pkl was saved as __main__.FeatureGenerator (no stored state — pure transform).
This module defines the class so it can be imported wherever needed.
Usage:
    from models.feature_generator import FeatureGenerator
    import joblib, sys, models.feature_generator as _fg_mod
    sys.modules['__main__'].FeatureGenerator = FeatureGenerator
    fg = joblib.load('models/feature_generator.pkl')
    df_full = fg.transform(df_raw)   # adds 10 engineered columns
"""

import pandas as pd
import numpy as np


class FeatureGenerator:
    """Stateless sklearn-style transformer that adds derived features."""

    def fit(self, X, y=None):
        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        df = X.copy()

        pv1_i = df.get("pv1_current", pd.Series(0.0, index=df.index))
        pv1_v = df.get("pv1_voltage", pd.Series(0.0, index=df.index))
        pv2_v = df.get("pv2_voltage", pd.Series(0.0, index=df.index))
        pv2_i = df.get("pv2_current", pd.Series(0.0, index=df.index))
        inv_p = df.get("inverter_power", pd.Series(0.0, index=df.index))
        grid  = df.get("grid_power", pd.Series(0.0, index=df.index))
        eff   = df.get("efficiency", pd.Series(0.0, index=df.index))
        temp  = df.get("inverter_temp", pd.Series(0.0, index=df.index))
        amb   = df.get("ambient_temperature", pd.Series(25.0, index=df.index))
        freq  = df.get("grid_frequency", pd.Series(50.0, index=df.index))

        df["pv1_power_calc"]           = pv1_v * pv1_i
        df["pv2_power_calc"]           = pv2_v * pv2_i
        df["voltage_current_ratio"]    = pv1_v / pv1_i.replace(0, np.nan).fillna(1e-9)
        df["power_efficiency"]         = eff
        df["grid_power_ratio"]         = grid / inv_p.replace(0, np.nan).fillna(1e-9)
        df["temp_diff_calc"]           = temp - amb
        df["temp_voltage_interaction"] = temp * pv1_v
        df["pv1_current_sq"]           = pv1_i ** 2
        df["pv1_voltage_sq"]           = pv1_v ** 2
        df["freq_deviation"]           = (freq - 50.0).abs()

        return df

    def fit_transform(self, X, y=None):
        return self.fit(X, y).transform(X)
