import pandas as pd
import numpy as np
import pickle
import warnings
from sklearn.model_selection import train_test_split, KFold, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
import xgboost as xgb
import lightgbm as lgb
import shap
import matplotlib.pyplot as plt

warnings.filterwarnings('ignore')

def load_data(file_path):
    """
    1. Data Loading: Load dataset from a CSV file using pandas.
    """
    print(f"Loading data from {file_path}...")
    try:
        df = pd.read_csv(file_path)
        return df
    except Exception as e:
        print(f"Error loading data: {e}")
        return None

def preprocess_data(df, target_col='failure_risk', label_encoders=None):
    """
    2. Data Preprocessing: Handle missing values, encode categorical features, 
       remove outliers, and prepare for scaling.
    """
    print("Preprocessing data...")
    df = df.copy()

    # Separate numeric and categorical columns
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    categorical_cols = df.select_dtypes(exclude=[np.number]).columns
    if target_col in categorical_cols:
        categorical_cols = categorical_cols.drop(target_col)

    # Handle missing values: median for numeric, mode for categorical
    for col in numeric_cols:
        if col in df.columns and col != target_col:
            df[col] = df[col].fillna(df[col].median() if not df[col].isnull().all() else 0)
            
    for col in categorical_cols:
        if col in df.columns and len(df[col].mode()) > 0:
            df[col] = df[col].fillna(df[col].mode()[0])

    # Encode categorical features
    is_training = label_encoders is None
    if is_training:
        label_encoders = {}

    for col in categorical_cols:
        if col not in df.columns: continue
        if is_training:
            le = LabelEncoder()
            df[col] = le.fit_transform(df[col].astype(str))
            label_encoders[col] = le
        else:
            if col in label_encoders:
                le = label_encoders[col]
                known_classes = set(le.classes_)
                df[col] = df[col].astype(str).map(lambda x: x if x in known_classes else le.classes_[0])
                df[col] = le.transform(df[col])

    # Remove/Cap outliers using 1st and 99th percentiles for numerical columns
    for col in numeric_cols:
        if col in df.columns and col != target_col:
            lower = df[col].quantile(0.01)
            upper = df[col].quantile(0.99)
            df[col] = np.clip(df[col], lower, upper)

    return df, label_encoders

def engineer_features(df, time_col='timestamp'):
    """
    3. Feature Engineering: Create rolling mean, rolling std, rate of change, anomaly indicators.
    """
    print("Engineering features...")
    df = df.copy()
    
    # Sort by time if time column is available for rolling operations
    if time_col in df.columns:
        df = df.sort_values(by=time_col)
        
    numeric_cols = [c for c in df.select_dtypes(include=[np.number]).columns if c not in ['failure_risk', 'id']]

    # Generate features for all meaningful numeric columns
    for col in numeric_cols:
        if len(df) > 7:
            # rolling mean and standard deviation (window=7 to represent 7 steps/days)
            df[f'{col}_rolling_mean'] = df[col].rolling(window=7, min_periods=1).mean()
            df[f'{col}_rolling_std'] = df[col].rolling(window=7, min_periods=1).std().fillna(0)
            
            # rate of change
            df[f'{col}_roc'] = df[col].pct_change().fillna(0).replace([np.inf, -np.inf], 0)
            
            # anomaly indicators: 1 if current value is > 2 std deviations from rolling mean, else 0
            df[f'{col}_anomaly_indicator'] = (np.abs(df[col] - df[f'{col}_rolling_mean']) > 2 * df[f'{col}_rolling_std']).astype(int)

    # Drop non-numeric temporal column after feature engineering
    if time_col in df.columns and not pd.api.types.is_numeric_dtype(df[time_col]):
        df = df.drop(columns=[time_col])
        
    return df

def train_and_evaluate_models(X_train, y_train, X_test, y_test):
    """
    5. Model Training and 6. Model Evaluation
    Train RandomForest, XGBoost, LightGBM and evaluate them.
    Select best model based on F1 and ROC-AUC.
    """
    print("\nTraining models...")
    models = {
        'RandomForest': RandomForestClassifier(random_state=42),
        'XGBoost': xgb.XGBClassifier(eval_metric='logloss', random_state=42),
        'LightGBM': lgb.LGBMClassifier(random_state=42, verbose=-1)
    }

    best_model = None
    best_score = 0
    best_name = ""

    for name, model in models.items():
        print(f"\nTraining {name}...")
        model.fit(X_train, y_train)
        
        # Predictions
        y_pred = model.predict(X_test)
        y_pred_proba = model.predict_proba(X_test)[:, 1]

        # Evaluation Matrix
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        roc_auc = roc_auc_score(y_test, y_pred_proba)
        cm = confusion_matrix(y_test, y_pred)

        print(f"--- {name} Evaluation ---")
        print(f"Accuracy: {acc:.4f}")
        print(f"Precision: {prec:.4f}")
        print(f"Recall: {rec:.4f}")
        print(f"F1 Score: {f1:.4f}")
        print(f"ROC AUC score: {roc_auc:.4f}")
        print(f"Confusion Matrix:\n{cm}")

        # Choose best model (Average between F1 and ROC AUC)
        combined_score = (f1 + roc_auc) / 2
        if combined_score > best_score:
            best_score = combined_score
            best_model = model
            best_name = name

    print(f"\n=> Best Model Selected: {best_name} with combined score (F1 + ROC AUC)/2: {best_score:.4f}")
    return best_model, best_name

def evaluate_cross_validation(model, X, y, k=5):
    """
    7. Cross Validation: K-Fold cross validation (k=5).
    """
    print(f"\nPerforming {k}-Fold Cross Validation...")
    kf = KFold(n_splits=k, shuffle=True, random_state=42)
    
    cv_f1 = cross_val_score(model, X, y, cv=kf, scoring='f1')
    cv_roc = cross_val_score(model, X, y, cv=kf, scoring='roc_auc')

    print(f"K-Fold (k={k}) F1 Scores: {cv_f1}")
    print(f"Mean CV F1: {cv_f1.mean():.4f}")
    
    print(f"K-Fold (k={k}) ROC AUC Scores: {cv_roc}")
    print(f"Mean CV ROC AUC: {cv_roc.mean():.4f}")

def explain_model(model, X_train):
    """
    8. Model Explainability: Use SHAP to explain predictions.
    Generates SHAP summary plot and prints Top 5 important features.
    """
    print("\nGenerating SHAP explanations...")
    
    try:
        # For tree based models, mostly TreeExplainer works reliably
        explainer = shap.TreeExplainer(model)
        
        # We sample the dataset to speed up SHAP computations
        X_sample = X_train.sample(min(100, X_train.shape[0]), random_state=42) if len(X_train) > 100 else X_train
        shap_values = explainer.shap_values(X_sample)

        # Handle formatting of SHAP values for binary classification (sometimes returns list, sometimes array)
        if isinstance(shap_values, list):
            sv = shap_values[1]  # positive class
        else:
            sv = shap_values
            
        # Create and Save SHAP summary plot
        plt.figure()
        shap.summary_plot(sv, X_sample, show=False)
        plt.savefig('shap_summary_plot.png', bbox_inches='tight')
        print("-> SHAP summary plot generated and saved to 'shap_summary_plot.png'.")
        
        # Calculate Top 5 Important Features
        mean_abs_shap = np.abs(sv).mean(axis=0)
        feature_importance = pd.DataFrame(list(zip(X_sample.columns, mean_abs_shap)), columns=['Feature', 'Importance'])
        feature_importance = feature_importance.sort_values(by='Importance', ascending=False)
        print("\nTop 5 Important Features:")
        print(feature_importance.head(5).to_string(index=False))
        
    except Exception as e:
        print(f"Could not generate complete SHAP explanation: {e}")
        # Fallback using builtin importances
        if hasattr(model, 'feature_importances_'):
            feat_imp = pd.Series(model.feature_importances_, index=X_train.columns).sort_values(ascending=False)
            print("\nTop 5 Important Features (Using Model default feature importances):")
            print(feat_imp.head(5))

def save_artifacts(model, scaler, feature_cols, label_encoders):
    """
    9. Save the Model: Export essential items to predict later
    """
    print("\nSaving model files to disk...")
    with open('trained_model.pkl', 'wb') as f:
        pickle.dump(model, f)
    with open('scaler.pkl', 'wb') as f:
        pickle.dump(scaler, f)
    with open('feature_columns.pkl', 'wb') as f:
        pickle.dump(feature_cols, f)
    with open('label_encoders.pkl', 'wb') as f:
        pickle.dump(label_encoders, f)
    print("Saved files: trained_model.pkl, scaler.pkl, feature_columns.pkl, label_encoders.pkl")

# =========================================================================
# 10. Prediction Function
# =========================================================================

# Global cache for artifacts
_cached_model = None
_cached_scaler = None
_cached_feature_cols = None
_cached_label_encoders = None

def predict_inverter_failure(new_data):
    """
    Predict inverter failure or underperformance risk.
    
    Input:
    new_data: pandas dataframe containing features.
    
    Output:
    Dictionary with prediction (0 or 1) and risk_probability
    """
    global _cached_model, _cached_scaler, _cached_feature_cols, _cached_label_encoders
    
    # Load artifacts if not already loaded
    if _cached_model is None:
        try:
            with open('trained_model.pkl', 'rb') as f:
                _cached_model = pickle.load(f)
            with open('scaler.pkl', 'rb') as f:
                _cached_scaler = pickle.load(f)
            with open('feature_columns.pkl', 'rb') as f:
                _cached_feature_cols = pickle.load(f)
            with open('label_encoders.pkl', 'rb') as f:
                _cached_label_encoders = pickle.load(f)
        except Exception as e:
            raise FileNotFoundError(f"Model files missing. Ensure the model has been trained and saved. Error: {e}")
            
    # Copy dataset
    df = new_data.copy()
    
    # Preprocess using cached label encoders
    df, _ = preprocess_data(df, target_col='failure_risk', label_encoders=_cached_label_encoders)
    
    # Ensure new_data goes through the engineered features process.
    df = engineer_features(df)
    
    # Guarantee columns match what the model expects
    df = df.reindex(columns=_cached_feature_cols, fill_value=0)
    
    # Scale numeric data
    df_scaled = _cached_scaler.transform(df)
    
    # Predict the last row or all rows (assuming we want it for the current/last state)
    # the function signature implies returning a single dict ideally, but let's handle single batch item
    pred = _cached_model.predict(df_scaled)
    prob = _cached_model.predict_proba(df_scaled)[:, 1]
    
    # Returning the prediction for the first row in the new_data block.
    # Adjust index if batch prediction is needed.
    return {
        "prediction": int(pred[0]),
        "risk_probability": float(prob[0])
    }

# =========================================================================
# 11. Main Execution (Example Usage)
# =========================================================================

def main():
    print("=== Inverter Failure Prediction ML Pipeline ===")
    
    # Example setup: Creating dummy data to illustrate the e2e flow since we don't have the dataset
    csv_file = 'inverter_data.csv'
    import os
    if not os.path.exists(csv_file):
        print(f"\n[Note] {csv_file} not found. Generating dummy tabular data for demonstration...")
        np.random.seed(42)
        dates = pd.date_range(start='2025-01-01', periods=1500, freq='h')
        dummy_df = pd.DataFrame({
            'timestamp': dates,
            'dc_power': np.random.normal(5000, 500, 1500),
            'ac_power': np.random.normal(4800, 400, 1500),
            'temperature': np.random.normal(45, 10, 1500),
            'voltage': np.random.normal(230, 5, 1500),
            'status': np.random.choice(['online', 'offline', 'warning'], 1500),
            # 0 -> Normal, 1 -> Failure risk
            'failure_risk': np.random.choice([0, 1], p=[0.85, 0.15], size=1500) 
        })
        dummy_df.to_csv(csv_file, index=False)

    # 1. Load Data
    df = load_data(csv_file)
    if df is None: return

    target_col = 'failure_risk'

    # 2. Preprocessing
    df_prep, label_encoders = preprocess_data(df, target_col=target_col)

    # 3. Feature Engineering
    df_feat = engineer_features(df_prep, time_col='timestamp')

    # Prepare inputs
    X = df_feat.drop(columns=[target_col])
    y = df_feat[target_col]
    feature_columns = X.columns.tolist()

    # 4. Train/Test Split (80% train, 20% test)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)

    # Scale numeric features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    X_scaled_full = scaler.transform(X) # for CV later
    
    # Retain DataFrame structures for Models and SHAP processing
    X_train_scaled_df = pd.DataFrame(X_train_scaled, columns=feature_columns)
    X_test_scaled_df = pd.DataFrame(X_test_scaled, columns=feature_columns)
    X_scaled_full_df = pd.DataFrame(X_scaled_full, columns=feature_columns)

    # 5 & 6. Model Training & Evaluation
    best_model, best_model_name = train_and_evaluate_models(X_train_scaled_df, y_train, X_test_scaled_df, y_test)

    # 7. Cross Validation (k=5)
    evaluate_cross_validation(best_model, X_scaled_full_df, y, k=5)

    # 8. Model Explainability
    explain_model(best_model, X_train_scaled_df)

    # 9. Save Files
    save_artifacts(best_model, scaler, feature_columns, label_encoders)

    # 10. Example Usage of prediction function
    print("\n--- Testing predict_inverter_failure function ---")
    
    # We take a small slice of data as "new data"
    sample_data = df.tail(10).drop(columns=[target_col], errors='ignore')
    
    result = predict_inverter_failure(sample_data.tail(1))
    print(f"Input Data Prediction: {result}")
    
    print("\n=== Pipeline Execution Finished ===")


if __name__ == "__main__":
    main()
