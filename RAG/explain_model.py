import pandas as pd
import numpy as np
import xgboost as xgb
import shap
import pickle
import warnings
from train_model import load_and_prepare_data

# Suppress warnings for cleaner output
warnings.filterwarnings('ignore')

def explain_model(model_path: str, dataset_path: str, max_samples: int = 500):
    """
    Loads the trained model and dataset, calculates SHAP values, and aggregates 
    the top contributing features towards the failure risk prediction.
    """
    print(f"Loading model from {model_path}...")
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
        
    print("Loading data to calculate SHAP backgrounds...")
    # NOTE: In a real-world scenario with 1M rows, we'd sample heavily before calculation.
    # The load_and_prepare_data already does our feature engineering.
    X, y = load_and_prepare_data(dataset_path)
    
    print(f"\nSampling {max_samples} records for SHAP value computation...")
    # Sample background data to speed up SHAP calculation (especially for tree models)
    if len(X) > max_samples:
        X_sample = X.sample(n=max_samples, random_state=42)
    else:
        X_sample = X
        
    print("Calculating SHAP values (this may take a moment)...")
    # Initialize the TreeExplainer for XGBoost
    explainer = shap.TreeExplainer(model)
    
    # Calculate SHAP values
    shap_values = explainer.shap_values(X_sample)
    
    # --- Format and print the top 5 contributing factors ---
    print("\n" + "="*50)
    print("Top contributing factors:")
    
    # Get mean absolute SHAP values for each feature
    # shap_values shape for binary classification is usually (n_samples, n_features)
    # The higher the mean absolute value, the more impact it has on the model output.
    mean_abs_shap = np.abs(shap_values).mean(axis=0)
    
    # Create a DataFrame for easy sorting
    feature_importance = pd.DataFrame({
        'Feature': X_sample.columns,
        'Importance (Mean Abs SHAP)': mean_abs_shap
    })
    
    # Sort by descending importance
    feature_importance = feature_importance.sort_values(by='Importance (Mean Abs SHAP)', ascending=False)
    
    # Dictionary mapping internal variable names to user-friendly text interpretations
    # Based roughly on typical solar anomaly behavior
    interpretation_map = {
        'temperature': "inverter temperature",
        'dc_voltage': "DC voltage / Voltage instability",
        'ac_power': "AC power output limitations",
        'efficiency': "efficiency drop",
        'alarm_count': "alarm count frequency"
    }
    
    # We will look at the correlation to determine "High" vs "Low" driving risk
    # i.e., Does a high value of this feature push the model towards 1 (failure)?
    for i, row in feature_importance.head(5).iterrows():
        feature = row['Feature']
        importance = row['Importance (Mean Abs SHAP)']
        
        # We can analyze the correlation between the feature value and its SHAP value
        # to determine the directionality (e.g. "High temperature" vs "Low temperature")
        correlation = np.corrcoef(X_sample[feature], shap_values[:, i])[0, 1]
        
        direction = "High" if correlation > 0 else "Low"
        friendly_name = interpretation_map.get(feature, feature)
        
        print(f"- {direction} {friendly_name} (Impact: {importance:.4f})")

    print("="*50)
    
if __name__ == "__main__":
    csv_file_path = "Processed/solar_ml_master_dataset.csv"
    model_file_path = "trained_model.pkl"
    
    try:
        explain_model(model_file_path, csv_file_path, max_samples=1000)
    except Exception as e:
        print(f"Error generating explanation: {e}")
