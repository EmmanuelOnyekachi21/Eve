import React, { useState, useEffect } from 'react';
import { sendLocation, calculateRisk } from '../services/api';
import './GPSSimulator.css';

function GPSSimulator({ crimeZones, onLocationChange, onRiskUpdate }) {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState({ lat: 5.125086, lon: 7.356695 });
  const [speed, setSpeed] = useState(0);
  const [isStopped, setIsStopped] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Tracking interval
  useEffect(() => {
    let interval;
    if (isTracking) {
      // Initial calculation
      const calculateRiskNow = async () => {
        try {
          await sendLocation(currentLocation.lat, currentLocation.lon, speed);
          const riskData = await calculateRisk(currentLocation.lat, currentLocation.lon, speed);
          console.log('Risk calculation:', riskData);
          if (onRiskUpdate) {
            onRiskUpdate(riskData);
          }
          setLastUpdate(new Date().toLocaleTimeString());
        } catch (error) {
          console.error('Error during tracking:', error);
        }
      };
      
      // Calculate immediately when tracking starts
      calculateRiskNow();
      
      // Then calculate every 5 seconds
      interval = setInterval(calculateRiskNow, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking, currentLocation, speed, onRiskUpdate]);

  const handleStartTracking = () => {
    setIsTracking(true);
    setIsStopped(false);
    // Set random speed between 10-25 km/h
    setSpeed(Math.floor(Math.random() * 16) + 10);
  };

  const handleStopTracking = () => {
    setIsTracking(false);
    setSpeed(0);
    setIsStopped(true);
  };

  const handleSimulateStop = () => {
    setSpeed(0);
    setIsStopped(true);
  };

  const handleTeleportToZone = async (e) => {
    const zoneId = e.target.value;
    if (!zoneId) return;

    const zone = crimeZones.find(z => z.id === parseInt(zoneId));
    if (zone) {
      const newLocation = { lat: zone.latitude, lon: zone.longitude };
      setCurrentLocation(newLocation);
      
      // Notify parent component
      if (onLocationChange) {
        onLocationChange(newLocation.lat, newLocation.lon);
      }

      // Immediately calculate risk for new location
      try {
        const riskData = await calculateRisk(newLocation.lat, newLocation.lon, speed);
        console.log('Risk at new location:', riskData);
        
        if (onRiskUpdate) {
          onRiskUpdate(riskData);
        }
        
        setLastUpdate(new Date().toLocaleTimeString());
      } catch (error) {
        console.error('Error calculating risk:', error);
      }
    }
  };

  return (
    <div className={`gps-simulator card shadow-sm mb-3 ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="card-header" onClick={() => setIsCollapsed(!isCollapsed)}>
        <h6 className="mb-0">
          <i className="bi bi-broadcast me-2"></i>
          GPS Simulator
          <i className={`bi bi-chevron-${isCollapsed ? 'down' : 'up'} float-end`}></i>
        </h6>
      </div>
      
      {!isCollapsed && (
        <div className="card-body">
          <p className="text-muted small mb-3">
            <i className="bi bi-info-circle me-1"></i>
            Use this to simulate walking around campus
          </p>

          {/* Current Coordinates */}
          <div className="mb-3">
            <label className="form-label small fw-bold">Current Location</label>
            <div className="input-group input-group-sm mb-2">
              <span className="input-group-text">Lat</span>
              <input 
                type="text" 
                className="form-control" 
                value={currentLocation.lat.toFixed(6)} 
                readOnly 
              />
            </div>
            <div className="input-group input-group-sm">
              <span className="input-group-text">Lon</span>
              <input 
                type="text" 
                className="form-control" 
                value={currentLocation.lon.toFixed(6)} 
                readOnly 
              />
            </div>
          </div>

          {/* Speed Display */}
          <div className="mb-3">
            <label className="form-label small fw-bold">Speed</label>
            <div className="speed-display">
              <span className="speed-value">{speed}</span>
              <span className="speed-unit">km/h</span>
              {isStopped && <span className="badge bg-secondary ms-2">Stopped</span>}
              {!isStopped && speed > 0 && <span className="badge bg-success ms-2">Moving</span>}
            </div>
          </div>

          {/* Teleport to Zone */}
          <div className="mb-3">
            <label className="form-label small fw-bold">Teleport to Zone</label>
            <select 
              className="form-select form-select-sm" 
              onChange={handleTeleportToZone}
              defaultValue=""
            >
              <option value="">Select a zone...</option>
              {crimeZones.map(zone => (
                <option key={zone.id} value={zone.id}>
                  {zone.name} (Risk: {zone.risk_level})
                </option>
              ))}
            </select>
          </div>

          {/* Control Buttons */}
          <div className="d-grid gap-2">
            <button 
              className="btn btn-success btn-sm"
              onClick={handleStartTracking}
              disabled={isTracking}
            >
              <i className="bi bi-play-fill me-2"></i>
              Start Tracking
            </button>
            
            <button 
              className="btn btn-danger btn-sm"
              onClick={handleStopTracking}
              disabled={!isTracking}
            >
              <i className="bi bi-stop-fill me-2"></i>
              Stop Tracking
            </button>

            <button 
              className="btn btn-warning btn-sm"
              onClick={handleSimulateStop}
              disabled={!isTracking}
            >
              <i className="bi bi-pause-fill me-2"></i>
              Simulate Stop
            </button>
            
            <button 
              className="btn btn-info btn-sm"
              onClick={async () => {
                try {
                  const riskData = await calculateRisk(currentLocation.lat, currentLocation.lon, speed);
                  if (onRiskUpdate) {
                    onRiskUpdate(riskData);
                  }
                  setLastUpdate(new Date().toLocaleTimeString());
                } catch (error) {
                  console.error('Error recalculating risk:', error);
                }
              }}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Recalculate Risk Now
            </button>
          </div>

          {/* Status */}
          {lastUpdate && (
            <div className="mt-3 text-center">
              <small className="text-muted">
                <i className="bi bi-clock me-1"></i>
                Last update: {lastUpdate}
              </small>
            </div>
          )}

          {isTracking && (
            <div className="mt-2 text-center">
              <span className="badge bg-primary">
                <span className="spinner-grow spinner-grow-sm me-2"></span>
                Tracking Active
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GPSSimulator;
