"""
Train LSTM threat prediction model
"""
import sys
sys.path.append('.')

from ml.data_preparation import DataPreparation
from ml.lstm_model import ThreatLSTM, ModelTrainer
import pickle

def main():
    print("="*60)
    print("EVE - LSTM THREAT PREDICTION MODEL TRAINING")
    print("="*60)
    
    # Step 1: Prepare data
    print("\n[1/4] Preparing data...")
    data = DataPreparation.prepare_full_dataset()
    
    # Step 2: Create model
    print("\n[2/4] Creating LSTM model...")
    input_size = data['X_train'].shape[1]
    model = ThreatLSTM(input_size=input_size, hidden_size=64, num_layers=2)
    print(f"  Model created with {input_size} input features")
    
    # Step 3: Train
    print("\n[3/4] Training model...")
    trainer = ModelTrainer(model)
    history = trainer.train(
        data['X_train'], 
        data['y_train'],
        data['X_test'],
        data['y_test'],
        epochs=50
    )
    
    # Step 4: Save
    print("\n[4/4] Saving model and scaler...")
    trainer.save_model('ml/threat_model.pth')
    
    # Save scaler (needed for predictions)
    with open('ml/scaler.pkl', 'wb') as f:
        pickle.dump(data['scaler'], f)
    print("✅ Scaler saved to ml/scaler.pkl")
    
    # Save feature names
    with open('ml/feature_names.pkl', 'wb') as f:
        pickle.dump(data['feature_names'], f)
    print("✅ Feature names saved")
    
    print("\n" + "="*60)
    print("MODEL READY FOR PREDICTIONS!")
    print("="*60)

if __name__ == "__main__":
    main()