# ml/data_preparation.py
"""
Prepare incident data for LSTM training
"""
import pandas as pd
import numpy as np
import random
from datetime import datetime
import os
import django


# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eve.settings')
django.setup()

from apps.prediction.models import IncidentReport
from apps.safety.models import CrimeZone
from sklearn.preprocessing import MinMaxScaler


class DataPreparation:
    """
    Converts incident data into ML-ready features
    """
    
    @staticmethod
    def load_incidents():
        """
        Load all incidents from database
        
        Returns:
            DataFrame with columns:
            - latitude, longitude, hour, day_of_week, severity, incident_type
        """
        # TODO:
        # 1. Query all IncidentReports
        incidents = IncidentReport.objects.all()

        # 2. Extract needed fields
        data = []
        for inc in incidents:
            data.append({
                'latitude': inc.location.y,
                'longitude': inc.location.x,
                'hour': inc.hour_of_day,
                'day_of_week': inc.day_of_week,
                'severity': inc.severity,
                'incident_type': inc.incident_type,
                'occurred_at': inc.occurred_at
            })
        
        # 3. Convert to pandas DataFrame
        df = pd.DataFrame(data)
        print(f"Loaded {len(df)} incidents")

        # 4. Return
        return df

    @staticmethod
    def generate_negative_samples(incident_df, num_samples):
        """
        Generate random 'safe' samples within the same area
        """
        if len(incident_df) == 0:
            return pd.DataFrame()
            
        min_lat = incident_df['latitude'].min()
        max_lat = incident_df['latitude'].max()
        min_lon = incident_df['longitude'].min()
        max_lon = incident_df['longitude'].max()
        
        # Buffer to widen the area slightly
        lat_buffer = 0.01 
        lon_buffer = 0.01
        
        data = []
        for _ in range(num_samples):
            data.append({
                'latitude': random.uniform(min_lat - lat_buffer, max_lat + lat_buffer),
                'longitude': random.uniform(min_lon - lon_buffer, max_lon + lon_buffer),
                'hour': random.randint(0, 23),
                'day_of_week': random.randint(0, 6),
                'severity': 0,
                'incident_type': 'None',
                'target': 0  # 0 = Safe
            })
            
        return pd.DataFrame(data)
    
    @staticmethod
    def engineer_features(df):
        """
        Create additional features from raw data
        
        Args:
            df: DataFrame with incident data
            
        Returns:
            DataFrame with additional features:
            - is_night (boolean)
            - is_weekend (boolean)
            - location_risk (historical risk at that spot)
        """
        # TODO:
        # 1. Add is_night (hour >= 22 or hour <= 5)
        df['is_night'] = ((df['hour'] >= 20) | (df['hour'] <= 6)).astype(int)
        
        # 2. Add is_weekend (day_of_week in [5, 6])
        df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
        
        # Location risk: count incidents within 0.001 degrees (~111m)
        # 3. Calculate location_risk (count incidents near this spot)
        # Location risk: count incidents within 0.001 degrees (~111m)
        # 3. Calculate location_risk (count incidents near this spot)
        # IMPORTANT: Risk is based on INCIDENTS only. 
        # If df includes safe samples, we must only count the incidents for density calculation.
        
        # Identify which rows are incidents (severity > 0 or target == 1)
        # Assuming we passed a combined DF. If 'target' col doesn't exist, assume all are incidents.
        if 'target' in df.columns:
            incident_df = df[df['target'] == 1]
        else:
            incident_df = df
            
        location_risk = []
        for idx, row in df.iterrows():
            # Count incidents near this point
            nearby = incident_df[
                (abs(incident_df['latitude'] - row['latitude']) < 0.001) &
                (abs(incident_df['longitude'] - row['longitude']) < 0.001)
            ]
            # Normalize by total incidents to get a density score
            # A score of 0.1 means 10% of all crime happens in this 100m radius (that's high!)
            risk = len(nearby) / len(incident_df) if len(incident_df) > 0 else 0
            location_risk.append(risk)
        
        df['location_risk'] = location_risk
        
        print("Engineered features:")
        print(f"  - is_night: {df['is_night'].sum()} night incidents")
        print(f"  - is_weekend: {df['is_weekend'].sum()} weekend incidents")
        
        return df
    
    # Not used for now
    @staticmethod
    def create_sequences(df, sequence_length=5):
        """
        Create sequences for LSTM
        
        LSTM needs sequences, not single points.
        Example: To predict incident at time T, 
                 use incidents at times T-5, T-4, T-3, T-2, T-1
        
        Args:
            df: DataFrame sorted by time
            sequence_length: How many past points to use
            
        Returns:
            X: Input sequences (features)
            y: Target (1 = incident happened, 0 = no incident)
        """
        # TODO:
        # 1. Sort by occurred_at

        # 2. Create sliding windows
        # 3. Return X (sequences), y (targets)
        pass
    
    @staticmethod
    def normalize_features(X):
        """
        Scale features to 0-1 range
        
        Why? ML models work better when all features are similar scale.
        Latitude (5.12) vs Hour (22) → very different scales
        After normalization: both 0-1 range
        
        Args:
            X: Feature array
            
        Returns:
            X_normalized, scaler (need scaler for predictions later)
        """
        # TODO:
        scaler = MinMaxScaler()
        X_normalized = scaler.fit_transform(X)
        return X_normalized, scaler
    
    @staticmethod
    def prepare_full_dataset():
        """
        Complete pipeline: load → engineer → sequences → normalize
        
        Returns:
            {
                'X_train': training features,
                'y_train': training targets,
                'X_test': test features,
                'y_test': test targets,
                'scaler': normalization scaler,
                'feature_names': list of feature names
            }
        """
        # TODO:
        # 1. Load incidents
        incidents_df = DataPreparation.load_incidents()
        incidents_df['target'] = 1  # Label as threat
        
        # 1.5 Generate negative samples (Safe)
        # Generate same amount as incidents to have balanced classes (50/50 split)
        safe_df = DataPreparation.generate_negative_samples(incidents_df, num_samples=len(incidents_df))
        
        # Combine
        full_df = pd.concat([incidents_df, safe_df], ignore_index=True)
        
        # Shuffle
        full_df = full_df.sample(frac=1).reset_index(drop=True)

        # 2. Engineer features
        # Note: engineer_features now handles the mixed df correctly for location_risk
        df = DataPreparation.engineer_features(full_df)

        # Select features for model
        feature_columns = [
            'latitude', 'longitude', 'hour', 'day_of_week',
            'is_night', 'is_weekend', 'location_risk'    
        ]


        X = df[feature_columns].values
        y = df['target'].values # 1 or 0

        # 4. Split train/test (80/20)
        split_idx = int(0.8 * len(X))
        X_train = X[:split_idx]
        y_train = y[:split_idx]
        X_test = X[split_idx:]
        y_test = y[split_idx:]

        # 5. Normalize (fit on training data only!)
        X_train_normalized, scaler = DataPreparation.normalize_features(X_train)
        X_test_normalized = scaler.transform(X_test)


        print(f"\nDataset prepared:")
        print(f"  Training samples: {len(X_train)}")
        print(f"  Test samples: {len(X_test)}")
        print(f"  Features: {len(feature_columns)}")

        # 6. Return everything
        return {
            'X_train': X_train_normalized,
            'y_train': y_train,
            'X_test': X_test_normalized,
            'y_test': y_test,
            'scaler': scaler,
            'feature_names': feature_columns
        }
