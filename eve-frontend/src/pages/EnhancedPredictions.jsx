import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SafeRoutePanel from '../components/SafeRoutePanel';
import SafeZonesPanel from '../components/SafeZonesPanel';
import ConfidenceMapPanel from '../components/ConfidenceMapPanel';
import './EnhancedPredictions.css';

const EnhancedPredictions = () => {
  const navigate = useNavigate();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [activeTab, setActiveTab] = useState('route');
  const [gpsError, setGpsError] = useState(null);

  useEffect(() => {
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setGpsError(null);
        },
        (error) => {
          console.error('GPS Error:', error);
          setGpsError('Unable to get your location. Please enable GPS.');
          // Use default location for testing
          setCurrentLocation({
            latitude: 5.125086,
            longitude: 7.356695,
          });
        }
      );

      // Watch position for updates
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('GPS Watch Error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    } else {
      setGpsError('GPS not supported by your browser');
    }
  }, []);

  return (
    <div className="enhanced-predictions-page">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/dashboard')}>
          ← Back
        </button>
        <div className="header-content">
          <h1>🎯 Enhanced Safety Features</h1>
          <p className="header-subtitle">
            AI-powered route planning, emergency escape, and prediction confidence
          </p>
        </div>
      </div>

      {gpsError && (
        <div className="gps-warning">
          ⚠️ {gpsError}
        </div>
      )}

      {currentLocation && (
        <div className="location-indicator">
          <span className="location-icon">📍</span>
          <span className="location-text">
            Current: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
          </span>
        </div>
      )}

      <div className="tabs-container">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'route' ? 'active' : ''}`}
            onClick={() => setActiveTab('route')}
          >
            <span className="tab-icon">🛣️</span>
            <span className="tab-label">Safe Route</span>
          </button>
          <button
            className={`tab ${activeTab === 'zones' ? 'active' : ''}`}
            onClick={() => setActiveTab('zones')}
          >
            <span className="tab-icon">🏃</span>
            <span className="tab-label">Safe Zones</span>
          </button>
          <button
            className={`tab ${activeTab === 'confidence' ? 'active' : ''}`}
            onClick={() => setActiveTab('confidence')}
          >
            <span className="tab-icon">📊</span>
            <span className="tab-label">Confidence</span>
          </button>
        </div>
      </div>

      <div className="content-container">
        {activeTab === 'route' && (
          <div className="tab-content">
            <SafeRoutePanel currentLocation={currentLocation} />
          </div>
        )}

        {activeTab === 'zones' && (
          <div className="tab-content">
            <SafeZonesPanel currentLocation={currentLocation} />
          </div>
        )}

        {activeTab === 'confidence' && (
          <div className="tab-content">
            <ConfidenceMapPanel currentLocation={currentLocation} />
          </div>
        )}
      </div>

      <div className="features-info">
        <h3>About These Features</h3>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🛣️</div>
            <h4>Safe Route Planner</h4>
            <p>
              Plan your journey with AI-powered risk analysis. Get safety scores,
              waypoint-by-waypoint risk levels, and recommendations for safer travel times.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🏃</div>
            <h4>Emergency Safe Zones</h4>
            <p>
              Find the nearest safe areas instantly. Get clear directions with distance
              and compass bearings to escape dangerous situations quickly.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h4>Prediction Confidence</h4>
            <p>
              Know how reliable our predictions are. See data quality by direction
              and understand the accuracy of risk assessments in your area.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPredictions;
