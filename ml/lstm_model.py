"""
LSTM model for threat prediction
"""
import torch
import torch.nn as nn
import numpy as np
import pickle
import os


class ThreatLSTM(nn.Module):
    def __init__(self, input_size=7, hidden_size=64, num_layers=2):
        """
        Args:
            input_size: Number of features (7 in our case)
            hidden_size: LSTM hidden units (more = more complex patterns)
            num_layers: Stacked LSTM layers (more = deeper learning)
        """
        super(ThreatLSTM, self).__init__()
        # TODO: Define layers
        # 1. LSTM layer
        self.lstm = nn.LSTM(
            input_size,
            hidden_size,
            num_layers,
            batch_first=True,
            dropout=0.2  # 20% dropout to prevent overfitting
        )

        # 2. Dropout (prevents overfitting)
        self.dropout = nn.Dropout(0.3)

        # 3. Fully connected layer (output)
        self.fc = nn.Linear(hidden_size, 1)

        # 4. Sigmoid (converts to 0-1 probability)
        self.sigmoid = nn.Sigmoid()
    
    def forward(self, x):
        """
        Forward pass through network
        
        Args:
            x: Input features
            
        Returns:
            Predicted risk probability
        """
        # TODO: Pass through layers defined above
        # LSTM expects 3D input: (batch_size, sequence_length, features)
        # Our input is 2D: (batch_size, features)
        # Add sequence dimension
        if len(x.shape) == 2:
            x = x.unsqueeze(1)

        # LSTM forward
        lstm_out, _ = self.lstm(x)

        # Take last output
        lstm_out = lstm_out[:, -1, :]

        # Dropout
        lstm_out = self.dropout(lstm_out)

        # FC
        fc_out = self.fc(lstm_out)

        # Sigmoid
        return self.sigmoid(fc_out)


class ModelTrainer:
    """
    Handles training and evaluation
    """
    
    def __init__(self, model, device='cpu'):
        self.model = model
        self.device = device
        self.model.to(device)
        
        # Loss function (how wrong are predictions?)
        self.criterion = nn.BCELoss()  # Binary Cross Entropy for 0/1 classification
        
        # Optimizer (how to improve?)
        self.optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
    
    def train_epoch(self, X_train, y_train, batch_size=25):
        """
        Train for one epoch (one pass through all data)
        
        Returns:
            Average loss for this epoch
        """
        # TODO:
        self.model.train()

        total_loss = 0
        num_batches = 0
        
        # Convert to tensors
        X = torch.FloatTensor(X_train).to(self.device)
        y = torch.FloatTensor(y_train).reshape(-1, 1).to(self.device)
        
        # 1. Split data into batches
        # 2. For each batch:
        #    - Forward pass (predict)
        #    - Calculate loss (how wrong?)
        #    - Backward pass (learn from mistakes)
        #    - Update weights

        for i in range(0, len(X), batch_size):
            batch_X = X[i:i+batch_size]
            batch_y = y[i:i+batch_size]

            # Zero gradients
            self.optimizer.zero_grad()
            
            # Forward pass
            predictions = self.model(batch_X)
            
            # Calculate loss
            loss = self.criterion(predictions, batch_y)
            
            # Backward pass          
            loss.backward()
            
            # Update weights
            self.optimizer.step()
            
            total_loss += loss.item()
            num_batches += 1
        
        return total_loss / num_batches
    
    def evaluate(self, X_test, y_test):
        """
        Evaluate model on test data
        
        Returns:
            {
                'accuracy': 0.94,
                'loss': 0.15,
                'predictions': [0.87, 0.23, ...]
            }
        """
        # TODO:
        # 1. Switch to eval mode (no training)
        self.model.eval()

        # 2. Predict on test data
        with torch.no_grad():  # No gradient needed.
            X = torch.FloatTensor(X_test).to(self.device)
            y = torch.FloatTensor(y_test).reshape(-1, 1).to(self.device)

            # Predict
            predictions = self.model(X)

            # Calculate loss
            loss = self.criterion(predictions, y)

            # Calculate accuracy
            predicted_classes = (predictions > 0.5).float()
            correct = (predicted_classes == y).sum().item()
            accuracy = correct / len(y)

            # Return metrics
            return {
                'accuracy': accuracy,
                'loss': loss.item(),
                'predictions': predictions.cpu().numpy().flatten()
            }
    
    def train(self, X_train, y_train, X_test, y_test, epochs=50):
        """
        Full training loop
        
        Args:
            epochs: How many times to go through data (50 is good)
            
        Returns:
            Training history
        """
        print("Starting training...")
        print(f"Epochs: {epochs}, Training samples: {len(X_train)}\n")
        
        history = {
            'train_loss': [],
            'test_loss': [],
            'test_accuracy': []
        }
        # 1. For each epoch:
        for epoch in range(epochs):
            # Train
            train_loss = self.train_epoch(X_train, y_train)

            #Evaluate on test data
            eval_metrics = self.evaluate(X_test, y_test)

            # Store history
            history['train_loss'].append(train_loss)
            history['test_loss'].append(eval_metrics['loss'])
            history['test_accuracy'].append(eval_metrics['accuracy'])

            # Print progress every 10 epochs
            if (epoch + 1) % 10 == 0:
                print(f"Epoch {epoch+1}/{epochs}")
                print(f"  Train Loss: {train_loss:.4f}")
                print(f"  Test Loss: {eval_metrics['loss']:.4f}")
                print(f"  Test Accuracy: {eval_metrics['accuracy']:.2%}\n")

        # Final evaluation
        final_metrics = self.evaluate(X_test, y_test)
        print("="*50)
        print("TRAINING COMPLETE")
        print(f"Final Test Accuracy: {final_metrics['accuracy']:.2%}")
        print("="*50)

        # Return history
        return history
    
    def save_model(self, filepath='ml/threat_model.pth'):
        """Save trained model"""
        torch.save(self.model.state_dict(), filepath)
        print(f"✅ Model saved to {filepath}")
    
    @staticmethod
    def load_model(filepath='ml/threat_model.pth', input_size=7):
        """Load trained model"""
        model = ThreatLSTM(input_size=input_size)
        model.load_state_dict(torch.load(filepath))
        model.eval()
        return model

