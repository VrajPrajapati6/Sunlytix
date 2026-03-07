import pandas as pd
import pickle
import shap
import numpy as np

# Load model
model = pickle.load(open("model.pkl", "rb"))
feature_columns = pickle.load(open("feature_columns.pkl", "rb"))

# Load telemetry
data = pd.read_csv("new_telemetry_data.csv")
X = data[feature_columns]

# Prediction
prediction = model.predict(X)
probability = model.predict_proba(X)[:,1]

print("Prediction:", prediction)
print("Failure probability:", probability)

# SHAP
explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X)

# Handle SHAP output properly
if isinstance(shap_values, list):
    shap_vals = shap_values[1][0]
else:
    shap_vals = shap_values[0]

# Combine feature names with SHAP values
feature_importance = list(zip(feature_columns, shap_vals))

# Sort by importance
feature_importance = sorted(
    feature_importance,
    key=lambda x: abs(x[1]),
    reverse=True
)

# Top 5
top5 = feature_importance[:5]

print("\nTop 5 factors affecting prediction:\n")

for feature, value in top5:
    print(f"{feature}: {value:.4f}")