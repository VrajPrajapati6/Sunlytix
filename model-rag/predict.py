
import pickle
import pandas as pd

# Load model
model = pickle.load(open("model.pkl", "rb"))
feature_columns = pickle.load(open("feature_columns.pkl", "rb"))

# Example input (new telemetry data)
data = pd.read_csv("new_telemetry_data.csv")

# Ensure feature order
X = data[feature_columns]

# Predict
prediction = model.predict(X)
probability = model.predict_proba(X)[:,1]

print("Prediction:", prediction)
print("Failure probability:", probability)