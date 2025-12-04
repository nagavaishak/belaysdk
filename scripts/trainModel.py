# scripts/trainModel.py
import json
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os

print("🚀 Starting ML Model Training...\n")

# Load labeled data
print("📂 Loading labeled_transactions.json...")
with open('data/labeled_transactions.json', 'r') as f:
    data = json.load(f)

print(f"✅ Loaded {len(data)} transactions\n")

# Convert to DataFrame
df = pd.DataFrame(data)

# Filter only successful transactions with CU data for training
print("🔍 Filtering successful transactions with CU data...")
df_success = df[df['success'] == True].copy()
df_success = df_success[df_success['computeUnitsUsed'].notna()]

print(f"✅ {len(df_success)} successful transactions available for training\n")

# Prepare features
print("📊 Preparing features...")

# Convert program to numeric (one-hot encoding)
df_success['program_jupiter'] = (df_success['program'] == 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4').astype(int)
df_success['program_raydium'] = (df_success['program'] == '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8').astype(int)

# Feature columns
feature_columns = [
    'instructionCount',
    'accountCount',
    'dataSize',
    'priorityFee',
    'networkCongestion',
    'program_jupiter',
    'program_raydium'
]

# Prepare X (features) and y (target)
X = df_success[feature_columns].values
y = df_success['computeUnitsUsed'].values

print(f"Feature shape: {X.shape}")
print(f"Target shape: {y.shape}")
print(f"\nFeature columns: {feature_columns}\n")

# Split into train and test sets
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

print(f"📊 Train set: {len(X_train)} samples")
print(f"📊 Test set: {len(X_test)} samples\n")

# Train Random Forest model
print("🌳 Training Random Forest Regressor...")
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

# Evaluate on test set
print("📈 Evaluating model...")
y_pred = model.predict(X_test)

mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print(f"\n📊 Model Performance:")
print(f"   Mean Absolute Error: {mae:,.0f} CU")
print(f"   R² Score: {r2:.3f}")
print(f"   Accuracy: {r2 * 100:.1f}%\n")

# Feature importance
print("🎯 Feature Importance:")
feature_importance = pd.DataFrame({
    'feature': feature_columns,
    'importance': model.feature_importances_
}).sort_values('importance', ascending=False)

for idx, row in feature_importance.iterrows():
    print(f"   {row['feature']}: {row['importance']:.3f}")
print()

# Show some predictions vs actual
print("🔍 Sample Predictions (first 5 test samples):")
for i in range(min(5, len(X_test))):
    actual = y_test[i]
    predicted = y_pred[i]
    error = abs(actual - predicted)
    error_pct = (error / actual) * 100
    print(f"   Actual: {actual:7.0f} CU | Predicted: {predicted:7.0f} CU | Error: {error:6.0f} CU ({error_pct:.1f}%)")
print()

# Save model
model_path = 'data/model.pkl'
print(f"💾 Saving model to {model_path}...")
joblib.dump(model, model_path)

# Save feature names for later use
metadata = {
    'feature_columns': feature_columns,
    'model_type': 'RandomForestRegressor',
    'n_estimators': 100,
    'train_samples': len(X_train),
    'test_samples': len(X_test),
    'mae': float(mae),
    'r2_score': float(r2),
    'accuracy_percent': float(r2 * 100)
}

metadata_path = 'data/model_metadata.json'
print(f"💾 Saving metadata to {metadata_path}...")
with open(metadata_path, 'w') as f:
    json.dump(metadata, f, indent=2)

print("\n🎉 Model training complete!")
print(f"   Model saved: {model_path}")
print(f"   Metadata saved: {metadata_path}")
print(f"\n✅ Ready to use for predictions!")