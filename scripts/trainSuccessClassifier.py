# scripts/trainSuccessClassifier.py
import json
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import joblib
import os

print("🚀 Training Transaction Success Classifier for BELAY\n")

# Load data
print("📂 Loading ML training data...")
with open('data/ml_training_data_2025-10-25T01-01-37.853Z.json', 'r') as f:
    data = json.load(f)

print(f"✅ Loaded {len(data)} transactions\n")

# Convert to DataFrame
df = pd.DataFrame(data)

print(f"📊 Dataset composition:")
print(f"   Success: {df['success'].sum()} ({df['success'].sum()/len(df)*100:.1f}%)")
print(f"   Failed: {(~df['success']).sum()} ({(~df['success']).sum()/len(df)*100:.1f}%)\n")

# Feature engineering
print("📊 Engineering features...\n")

# Program encoding
df['program_jupiter'] = (df['programId'] == 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4').astype(int)
df['program_raydium'] = (df['programId'] == '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8').astype(int)

# Handle missing compute units
df['computeUnitsUsed'] = df['computeUnitsUsed'].fillna(df['computeUnitsUsed'].median())

# Feature columns
feature_columns = [
    'instructionCount',
    'accountCount',
    'computeUnitsUsed',
    'priorityFee',
    'slotTime',
    'program_jupiter',
    'program_raydium'
]

# Prepare X and y
X = df[feature_columns].values
y = df['success'].astype(int).values  # 1 = success, 0 = failure

print(f"📊 Features shape: {X.shape}")
print(f"📊 Target shape: {y.shape}")
print(f"📊 Feature columns: {feature_columns}\n")

# Train/test split with stratification
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"📊 Train: {len(X_train)} samples | Test: {len(X_test)} samples\n")

# Train Random Forest Classifier
print("🌳 Training Random Forest Classifier...\n")
model = RandomForestClassifier(
    n_estimators=100,
    max_depth=15,
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1,
    class_weight='balanced'  # Handle class imbalance
)

model.fit(X_train, y_train)
print("✅ Training complete!\n")

# Evaluate
print("📈 Evaluating model...\n")
y_pred = model.predict(X_test)
y_pred_proba = model.predict_proba(X_test)[:, 1]  # Probability of success

accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)

print(f"📊 MODEL PERFORMANCE:")
print(f"   Accuracy:  {accuracy:.3f} ({accuracy*100:.1f}%)")
print(f"   Precision: {precision:.3f}")
print(f"   Recall:    {recall:.3f}")
print(f"   F1 Score:  {f1:.3f}\n")

# Confusion matrix
cm = confusion_matrix(y_test, y_pred)
print(f"🔍 Confusion Matrix:")
print(f"   True Neg:  {cm[0][0]} | False Pos: {cm[0][1]}")
print(f"   False Neg: {cm[1][0]} | True Pos:  {cm[1][1]}\n")

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
    actual = "Success" if y_test[i] == 1 else "Failure"
    predicted = "Success" if y_pred[i] == 1 else "Failure"
    confidence = y_pred_proba[i] if y_pred[i] == 1 else (1 - y_pred_proba[i])
    match = "✓" if y_test[i] == y_pred[i] else "✗"
    print(f"   {match} Actual: {actual:7s} | Predicted: {predicted:7s} | Confidence: {confidence:.1%}")
print()

# Save model
os.makedirs('models', exist_ok=True)
model_path = 'models/success_classifier.pkl'
print(f"💾 Saving model to {model_path}...")
joblib.dump(model, model_path)

# Save metadata
metadata = {
    'model_type': 'RandomForestClassifier',
    'n_estimators': 100,
    'feature_columns': feature_columns,
    'train_samples': len(X_train),
    'test_samples': len(X_test),
    'accuracy': float(accuracy),
    'precision': float(precision),
    'recall': float(recall),
    'f1_score': float(f1),
    'accuracy_percent': float(accuracy * 100),
    'trained_on_transactions': len(data)
}

metadata_path = 'models/success_classifier_metadata.json'
print(f"💾 Saving metadata to {metadata_path}...")
with open(metadata_path, 'w') as f:
    json.dump(metadata, f, indent=2)

print("\n🎉 Success Classifier Training Complete!")
print(f"   Model: {model_path}")
print(f"   Metadata: {metadata_path}")
print(f"\n✅ Ready to predict transaction success probability!\n")