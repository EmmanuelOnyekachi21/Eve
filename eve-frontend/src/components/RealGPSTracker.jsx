import React, { useState, useEffect, useRef } from 'react';
import { sendLocation, calculateRisk } from '../services/api';
import './RealGPSTracker.css';

function RealGPSTracker({ onLocationChange, onRiskUpdate }) {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [speed, setSpeed] = useState(0);
  const [accuracy, setAccuracy] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [distance, setDistance] = useState(0);
  const watchIdRef = useRef(null);
  const lastPositionRef = useRef(null);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  // Handle position update
  const handlePositionUpdate = async (position) => {
    const { latitude, longitude, speed: gpsSpeed, accuracy: gpsAccuracy } = position.coords;
    
    console.log('Real GPS Update:', { latitude, longitude, speed: gpsSpeed, accuracy: gpsAccuracy });

    // Calculate distance traveled
    if (lastPositionRef.current) {
      const dist = calculateDistance(
        lastPositionRef.current.latitude,
        lastPositionRef.current.longitude,
        latitude,
        longitude
      );
      setDistance(prev => prev + dist);
    }

    lastPositionRef.current = { latitude, longitude };

    // Update location state
    const newLocation = { lat: latitude, lon: longitude };
    setCurrentLocation(newLocation);
    setAccuracy(gpsAccuracy);

    // Calculate speed (convert m/s to km/h)
    const speedKmh = gpsSpeed ? (gpsSpeed * 3.6) : 0;
    setSpeed(speedKmh);

    // Notify parent component
    if (onLocationChange) {
      onLocationChange(latitude, longitude);
    }

    try {
      // Send location to backend
      await sendLocation(latitude, longitude, speedKmh);
      
      // Calculate risk
      const riskData = await calculateRisk(latitude, longitude, speedKmh);
      console.log('Real GPS Risk:', riskData);
      
      if (onRiskUpdate) {
        onRiskUpdate(riskData);
      }
      
      setLastUpdate(new Date().toLocaleTimeString());
      setError(null);
    } catch (err) {
      console.error('Error processing GPS data:', err);
      setError('Failed to process location data');
    }
  };

  // Handle position error
  const handlePositionError = (err) => {
    console.error('GPS Error:', err);
    let errorMessage = 'Unknown error';
    
    switch (err.code) {
      case err.PERMISSION_DENIED:
        errorMessage = 'Location permission denied. Please enable location access.';
        break;
      case err.POSITION_UNAVAILABLE:
        errorMessage = 'Location unavailable. Please check your GPS settings.';
        break;
      case err.TIMEOUT:
        errorMessage = 'Location request timed out. Retrying...';
        break;
      default:
        errorMessage = err.message;
    }
    
    setError(errorMessage);
  };

  // Start real GPS tracking
  const startTracking = () => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by your device');
      return;
    }

    setIsTracking(true);
    setError(null);
    setDistance(0);
    lastPositionRef.current = null;

    // Watch position with high accuracy
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      handlePositionError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
        distanceFilter: 5 // Update every 5 meters
      }
    );

    console.log('Real GPS tracking started');
  };

  // Stop tracking
  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    console.log('Real GPS tracking stopped');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <div className="real-gps-tracker card shadow-sm mb-3">
      <div className="card-header bg-success text-white">
        <h6 className="mb-0">
          <i className="bi bi-geo-alt-fill me-2"></i>
          Real GPS Tracking
        </h6>
      </div>
      
      <div className="card-body">
        <p className="text-muted small mb-3">
          <i className="bi bi-info-circle me-1"></i>
          Uses your device's actual GPS. Walk around to see real-time updates!
        </p>

        {/* Current Location */}
        {currentLocation && (
          <div className="location-display mb-3">
            <div className="location-item">
              <span className="label">Latitude:</span>
              <span className="value">{currentLocation.lat.toFixed(6)}</span>
            </div>
            <div className="location-item">
              <span className="label">Longitude:</span>
              <span className="value">{currentLocation.lon.toFixed(6)}</span>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="gps-stats mb-3">
          <div className="stat-item">
            <i className="bi bi-speedometer2 me-2"></i>
            <span className="stat-label">Speed:</span>
            <span className="stat-value">{speed.toFixed(1)} km/h</span>
          </div>
          <div className="stat-item">
            <i className="bi bi-bullseye me-2"></i>
            <span className="stat-label">Accuracy:</span>
            <span className="stat-value">
              {accuracy ? `±${accuracy.toFixed(0)}m` : 'N/A'}
            </span>
          </div>
          <div className="stat-item">
            <i className="bi bi-arrow-left-right me-2"></i>
            <span className="stat-label">Distance:</span>
            <span className="stat-value">{distance.toFixed(0)}m</span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="alert alert-warning alert-dismissible fade show" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
            <button type="button" className="btn-close" onClick={() => setError(null)}></button>
          </div>
        )}

        {/* Control Buttons */}
        <div className="d-grid gap-2">
          {!isTracking ? (
            <button 
              className="btn btn-success"
              onClick={startTracking}
            >
              <i className="bi bi-play-fill me-2"></i>
              Start Real GPS Tracking
            </button>
          ) : (
            <button 
              className="btn btn-danger"
              onClick={stopTracking}
            >
              <i className="bi bi-stop-fill me-2"></i>
              Stop Tracking
            </button>
          )}
        </div>

        {/* Status */}
        {isTracking && (
          <div className="tracking-status mt-3">
            <div className="status-indicator">
              <span className="status-dot active"></span>
              <span className="status-text">Tracking Active</span>
            </div>
            {lastUpdate && (
              <small className="text-muted">
                <i className="bi bi-clock me-1"></i>
                Last update: {lastUpdate}
              </small>
            )}
          </div>
        )}

        {/* Tips */}
        <div className="gps-tips mt-3">
          <strong>Tips for best results:</strong>
          <ul className="small mb-0 mt-2">
            <li>Enable high-accuracy GPS on your device</li>
            <li>Use outdoors for better signal</li>
            <li>Keep the app open while walking</li>
            <li>Walk at least 5 meters for updates</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default RealGPSTracker;
