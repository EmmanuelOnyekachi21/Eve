"""
Prediction service using trained LSTM model.
"""

import torch
import pickle
import numpy as np
from django.contrib.gis.geos import Point
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sentinelsphere.settings')
django.setup()

from ml.lstm_model import ThreatLSTM
from apps.prediction.models import IncidentReport
from datetime import datetime
from django.contrib.gis.measure import D



class ThreatPredictor:
    """
    Makes predictions using trained LSTM model
    """
    def __init__(self):
        self.model = None
        self.scalar = None
        self.feature_names = None
        self._load_model()
    
    def _load_model(self):
        """
        Load trained model and scaler
        """
        try:
            # Load model
            self.model = ThreatLSTM(input_size=7)
            state_dict = torch.load('ml/threat_model.pth')
            self.model.load_state_dict(state_dict)
            self.model.eval()
            print("✅ Model loaded successfully")

            # Load scalar
            with open('ml/scaler.pkl', 'rb') as f:
                self.scalar = pickle.load(f)
            print("✅ Scalar loaded successfully")

            # Load feature names
            with open('ml/feature_names.pkl', 'rb') as f:
                self.feature_names = pickle.load(f)
            print("✅ Feature names loaded successfully")
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            raise


    def calculate_location_risk(self, lat, long):
        """
        Calculate historical risk at this location
        (How many incidents happened near here?)
        
        Args:
            latitude, longitude: Location coordinates
            
        Returns:
            Risk score (0.0 - 1.0)
        """

        point = Point(long, lat, srid=4326)

        nearby_incidents = IncidentReport.objects.filter(
            location__distance_lte=(point, D(m=150))  # 150 meters
        ).count()

        total_incidents = IncidentReport.objects.count()
        
        if total_incidents == 0:
            return 0.0
        
        # Risk = percentage of incidents that happened here
        risk = nearby_incidents / total_incidents
        return risk
    
    def prepare_features(self, latitude, longitude, hour, day_of_week):
        """
        Create feature array for prediction
        
        Args:
            latitude, longitude: Location
            hour: 0-23
            day_of_week: 0-6 (0=Monday)
            
        Returns:
            Feature array ready for model.
        """
        # Calculate derived features
        is_night = 1 if hour > 22 or hour < 6 else 0
        is_weekend = 1 if day_of_week >= 5 else 0

        location_risk = self.calculate_location_risk(latitude, longitude)       

        # Create feature array (must match training order!)

        features = np.array([
            latitude,
            longitude,
            hour,
            day_of_week,
            is_night,
            is_weekend,
            location_risk
        ])

        # Normalize using the saved scaler
        # Reshape to 2D array (samples, features)
        features = features.reshape(1, -1)
        features_normalized = self.scalar.transform(features)

        return features_normalized
    
    def predict(self, latitude, longitude, hour, day_of_week):
        """
        Predict threat probability for location + time
        
        Args:
            latitude, longitude: Location
            hour: 0-23
            day_of_week: 0-6
            
        Returns:
            {
                'risk_probability': 0.87,
                'risk_percentage': 87,
                'confidence': 'High',
                'features_used': {...}
            }
        """
        features = self.prepare_features(latitude, longitude, hour, day_of_week)
        
        # COnvert to tensors
        features_tensor = torch.FloatTensor(features)

        # Make prediction
        self.model.eval()
        with torch.no_grad():
            print(f"DEBUG FEATURES: {features[0]}")
            prediction = self.model(features_tensor)
            risk_prob = prediction.item()

        # Determine confidence level
        if risk_prob > 0.8:
            confidence = 'Very High'
        elif risk_prob > 0.6:
            confidence = 'High'
        elif risk_prob > 0.4:
            confidence = 'Medium'
        else:
            confidence = 'Low'
        
        # Return result
        return {
            'risk_probability': round(risk_prob, 3),
            'risk_percentage': round(risk_prob * 100, 1),
            'confidence': confidence,
            'features_used': {
                'latitude': latitude,
                'longitude': longitude,
                'hour': hour,
                'day_of_week': day_of_week,
                'is_night': 1 if (hour >= 22 or hour <= 5) else 0,
                'is_weekend': 1 if (day_of_week >= 5) else 0,
                'location_risk': self.calculate_location_risk(latitude, longitude)
            }
        }
    
    def predict_24h_grid(self, center_lat, center_lon, radius_degrees=0.005, grid_points=10):
        """
        Generate prediction grid for next 24 hours
        Used for heatmap visualization
        
        Args:
            center_lat, center_lon: Center point
            radius_degrees: How far around center (0.005 ≈ 550m)
            grid_points: Grid resolution (10x10 = 100 predictions)
            
        Returns:
            List of predictions:
            [
                {'lat': 5.125, 'lon': 7.356, 'hour': 0, 'risk': 0.23},
                {'lat': 5.125, 'lon': 7.357, 'hour': 0, 'risk': 0.45},
                ...
            ]
        """
        # TODO:
        predictions = []
        # 1. Create grid of locations around center
        lat_range = np.linspace(
            center_lat - radius_degrees,
            center_lat + radius_degrees,
            grid_points
        )
        lon_range = np.linspace(
            center_lon - radius_degrees,
            center_lon + radius_degrees,
            grid_points
        )
        
        # 2. For each hour (0-23):
        # Current day of week
        current_day = datetime.now().weekday()
        
        # For each hour
        for hour in range(24):
            # For each grid point
            for lat in lat_range:
                for lon in lon_range:
                    result = self.predict(lat, lon, hour, current_day)
                    
                    predictions.append({
                        'latitude': lat,
                        'longitude': lon,
                        'hour': hour,
                        'risk_probability': result['risk_probability'],
                        'risk_percentage': result['risk_percentage']
                    })
    
        return predictions



