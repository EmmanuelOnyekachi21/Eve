import sys
sys.path.append('.')

from ml.data_preparation import DataPreparation

# Test loading
df = DataPreparation.load_incidents()
print(f"✅ Loaded {len(df)} incidents")
print(f"Columns: {df.columns.tolist()}")

# Test feature engineering
df_eng = DataPreparation.engineer_features(df)
print(f"\n✅ Engineered features")
print(df_eng.head())

# Test full pipeline
data = DataPreparation.prepare_full_dataset()
print(f"\n✅ Full dataset prepared")
print(f"Training shape: {data['X_train'].shape}")
print(f"Test shape: {data['X_test'].shape}")