"""
Solar Inverter Failure Prediction
Multi-Horizon ML Pipeline

Prediction Windows
1-3 days
3-5 days
5-7 days
"""

import os
import pickle
import logging
import warnings

import numpy as np
import pandas as pd

from sklearn.multioutput import MultiOutputClassifier
from sklearn.metrics import precision_score, recall_score, f1_score, roc_auc_score

from xgboost import XGBClassifier

warnings.filterwarnings("ignore")

# ------------------------------------------------
# CONFIG
# ------------------------------------------------

DATA_PATH = "master-dataset-updated.csv"

TIMESTAMP_COL = "timestamp"
INVERTER_COL = "inverter_id"

MODEL_DIR = "model_artifacts"

TARGETS = [
    "failure_1_3_days",
    "failure_3_5_days",
    "failure_5_7_days"
]

# ------------------------------------------------
# LOGGING
# ------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)

logger = logging.getLogger()


# ------------------------------------------------
# LOAD DATA
# ------------------------------------------------

def load_dataset():

    logger.info("Loading dataset...")

    df = pd.read_csv(DATA_PATH, low_memory=False)

    df[TIMESTAMP_COL] = pd.to_datetime(df[TIMESTAMP_COL])

    df = df.sort_values([INVERTER_COL, TIMESTAMP_COL])

    # --------------------------------
    # FORCE NUMERIC CLEANING
    # --------------------------------

    numeric_cols = [
        "inverter_power",
        "inverter_pv1_power",
        "inverter_pv1_voltage",
        "inverter_pv1_current",
        "inverter_pv2_power",
        "inverter_pv2_voltage",
        "inverter_pv2_current",
        "inverter_temp",
        "ambient_temp",
        "meter_active_power",
        "meter_freq",
        "meter_pf",
        "inverter_alarm_code"
    ]

    for col in numeric_cols:

        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    logger.info(f"Dataset shape: {df.shape}")

    return df


# ------------------------------------------------
# FEATURE ENGINEERING
# ------------------------------------------------

def create_features(df):

    logger.info("Creating time-series features...")

    group = df.groupby(INVERTER_COL)

    base_cols = [
        "inverter_power",
        "inverter_pv1_power",
        "inverter_pv1_voltage",
        "inverter_pv1_current",
        "inverter_pv2_power",
        "inverter_pv2_voltage",
        "inverter_pv2_current",
        "inverter_temp",
        "ambient_temp",
        "meter_active_power",
        "meter_freq",
        "meter_pf"
    ]

    # -------------------------------
    # LAG FEATURES
    # -------------------------------

    for lag in [1,3,6,12]:

        for col in base_cols:

            if col in df.columns:

                df[f"{col}_lag_{lag}"] = group[col].shift(lag)

    # -------------------------------
    # ROLLING FEATURES
    # -------------------------------

    for window in [6,12]:

        for col in base_cols:

            if col in df.columns:

                df[f"{col}_mean_{window}"] = (
                    group[col]
                    .rolling(window)
                    .mean()
                    .reset_index(level=0, drop=True)
                )

                df[f"{col}_std_{window}"] = (
                    group[col]
                    .rolling(window)
                    .std()
                    .reset_index(level=0, drop=True)
                )

    # -------------------------------
    # CHANGE RATE FEATURES
    # -------------------------------

    df["power_change"] = group["inverter_power"].pct_change()

    df["temp_change"] = group["inverter_temp"].pct_change()

    # -------------------------------
    # CLEAN DATA
    # -------------------------------

    df = df.replace([np.inf, -np.inf], np.nan)

    df = df.fillna(0)

    return df


# ------------------------------------------------
# LABEL CREATION
# ------------------------------------------------

def create_labels(df):

    logger.info("Creating failure labels...")

    group = df.groupby("inverter_id")

    # assuming 5-minute interval data
    rows_per_day = 288

    shift_1 = rows_per_day * 1
    shift_3 = rows_per_day * 3
    shift_5 = rows_per_day * 5
    shift_7 = rows_per_day * 7

    # 1-3 days
    future_power = group["inverter_power"].shift(-shift_1)
    future_alarm = group["inverter_alarm_code"].shift(-shift_1)

    df["failure_1_3_days"] = (
        (future_power < 0.1) |
        (future_alarm > 0)
    ).astype(int)

    # 3-5 days
    future_power = group["inverter_power"].shift(-shift_3)
    future_alarm = group["inverter_alarm_code"].shift(-shift_3)

    df["failure_3_5_days"] = (
        (future_power < 0.1) |
        (future_alarm > 0)
    ).astype(int)

    # 5-7 days
    future_power = group["inverter_power"].shift(-shift_5)
    future_alarm = group["inverter_alarm_code"].shift(-shift_5)

    df["failure_5_7_days"] = (
        (future_power < 0.1) |
        (future_alarm > 0)
    ).astype(int)

    return df


# ------------------------------------------------
# SPLIT DATA
# ------------------------------------------------

def split_data(df):

    logger.info("Splitting dataset...")

    split = int(len(df) * 0.8)

    train = df.iloc[:split]
    test = df.iloc[split:]

    return train, test


# ------------------------------------------------
# TRAIN MODEL
# ------------------------------------------------

def train_model(X_train, y_train):

    logger.info("Training XGBoost model...")

    base_model = XGBClassifier(

        n_estimators=150,
        max_depth=8,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        tree_method="hist",
        n_jobs=-1,
        eval_metric="logloss"
    )

    model = MultiOutputClassifier(base_model)

    model.fit(X_train, y_train)

    return model


# ------------------------------------------------
# EVALUATION
# ------------------------------------------------

def evaluate(model, X_test, y_test):

    logger.info("Evaluating model...")

    preds = model.predict(X_test)

    probs = model.predict_proba(X_test)

    for i, target in enumerate(TARGETS):

        y_true = y_test[target]

        y_pred = preds[:, i]

        y_prob = probs[i][:, 1]

        print("\n", target)

        print("Precision:", precision_score(y_true, y_pred))

        print("Recall:", recall_score(y_true, y_pred))

        print("F1:", f1_score(y_true, y_pred))

        print("ROC:", roc_auc_score(y_true, y_prob))


# ------------------------------------------------
# SAVE MODEL
# ------------------------------------------------

def save_model(model, features):

    os.makedirs(MODEL_DIR, exist_ok=True)

    pickle.dump(model, open(f"{MODEL_DIR}/trained_model.pkl", "wb"))

    pickle.dump(features, open(f"{MODEL_DIR}/feature_columns.pkl", "wb"))

    logger.info("Model saved successfully")


# ------------------------------------------------
# MAIN
# ------------------------------------------------

def main():

    df = load_dataset()

    df = create_features(df)

    df = create_labels(df)

    # -------------------------------
    # SELECT ONLY NUMERIC FEATURES
    # -------------------------------

    feature_cols = df.select_dtypes(include=[np.number]).columns.tolist()

    feature_cols = [c for c in feature_cols if c not in TARGETS]

    logger.info(f"Feature count: {len(feature_cols)}")

    train, test = split_data(df)

    X_train = train[feature_cols]

    y_train = train[TARGETS]

    X_test = test[feature_cols]

    y_test = test[TARGETS]

    model = train_model(X_train, y_train)

    evaluate(model, X_test, y_test)

    save_model(model, feature_cols)

    logger.info("Training completed successfully")


# ------------------------------------------------

if __name__ == "__main__":

    main()