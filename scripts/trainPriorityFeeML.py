# scripts/trainPriorityFeeML.py
import json
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score, mean_squared_error
import joblib
import os

print("🚀 Training Priority Fee ML Model for BELAY\n")

# Load data
print("📂 Loading ML training data...")
with open('data/ml_training_data_2025-10-25T01-01-37.853Z.json', 'r') as f:
    data = json.load(f)

print(f"✅ Loaded {len(data)} transactions\n")

# Convert to DataFrame
df = pd.DataFrame(data)

# Filter: Only successful transactions with fees
df_success = df[df['success'] == True].copy()
df_success = df_success[df_success['priorityFee'] > 0]

print(f"✅ {len(df_success)} successful transactions with priority fees\n")

if len(df_success) < 50:
    print("❌ Not enough data! Need at least 50 transactions.")
    exit(1)

# Feature engineering
print("📊 Engineering features...\n")

# Program encoding
df_success['program_jupiter'] = (df_success['programId'] == 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4').astype(int)
df_success['program_raydium'] = (df_success['programId'] == '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8').astype(int)

# Handle missing compute units
df_success['computeUnitsUsed'] = df_success['computeUnitsUsed'].fillna(df_success['computeUnitsUsed'].median())

# Feature columns
feature_columns = [
    'instructionCount',
    'accountCount',
    'computeUnitsUsed',
    'slotTime',
    'program_jupiter',
    'program_raydium'
]

# Prepare X and y
X = df_success[feature_columns].values
y = df_success['priorityFee'].values

print(f"📊 Features shape: {X.shape}")
print(f"📊 Target shape: {y.shape}")
print(f"📊 Feature columns: {feature_columns}\n")

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

print(f"📊 Train: {len(X_train)} samples | Test: {len(X_test)} samples\n")

# Train Random Forest
print("🌳 Training Random Forest Regressor...\n")
model = RandomForestRegressor(
    n_estimators=100,
    max_depth=15,
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1
)

model.fit(X_train, y_train)
print("✅ Training complete!\n")

# Evaluate
print("📈 Evaluating model...\n")
y_pred = model.predict(X_test)

mae = mean_absolute_error(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
r2 = r2_score(y_test, y_pred)

print(f"📊 MODEL PERFORMANCE:")
print(f"   MAE:  {mae:.8f} SOL")
print(f"   RMSE: {rmse:.8f} SOL")
print(f"   R² Score: {r2:.3f}")
print(f"   Accuracy: {r2 * 100:.1f}%\n")

# Feature importance
print("🎯 Feature Importance:")
importance_df = pd.DataFrame({
    'feature': feature_columns,
    'importance': model.feature_importances_
}).sort_values('importance', ascending=False)

for _, row in importance_df.iterrows():
    bar = '█' * int(row['importance'] * 50)
    print(f"   {row['feature']:20s} {bar} {row['importance']:.3f}")
print()

# Sample predictions
print("🔍 Sample Predictions:")
for i in range(min(5, len(X_test))):
    actual = y_test[i]
    predicted = y_pred[i]
    error = abs(actual - predicted)
    error_pct = (error / actual) * 100 if actual > 0 else 0
    print(f"   Actual: {actual:.8f} | Predicted: {predicted:.8f} | Error: {error_pct:.1f}%")
print()

# Save model
os.makedirs('models', exist_ok=True)
model_path = 'models/priority_fee_model.pkl'
print(f"💾 Saving model to {model_path}...")
joblib.dump(model, model_path)

# Save metadata
metadata = {
    'model_type': 'RandomForestRegressor',
    'n_estimators': 100,
    'feature_columns': feature_columns,
    'train_samples': len(X_train),
    'test_samples': len(X_test),
    'mae': float(mae),
    'rmse': float(rmse),
    'r2_score': float(r2),
    'accuracy_percent': float(r2 * 100),
    'trained_on_transactions': len(df_success),
    'total_dataset': len(data)
}

metadata_path = 'models/priority_fee_metadata.json'
print(f"💾 Saving metadata to {metadata_path}...")
with open(metadata_path, 'w') as f:
    json.dump(metadata, f, indent=2)

print("\n🎉 Priority Fee Model Training Complete!")
print(f"   Model: {model_path}")
print(f"   Metadata: {metadata_path}")
print(f"\n✅ Ready to predict optimal priority fees!\n")