import React from 'react';
import LiveMapComponent from '../components/LiveMapComponent';
import './LiveMap.css';

function LiveMap() {
  return (
    <div className="live-map-page container-fluid fade-in">
      <div className="row mb-4">
        <div className="col-12">
          <h1 className="page-title">
            <i className="bi bi-map me-2"></i>
            Live Location Map
          </h1>
          <p className="text-muted">Real-time tracking with crime zone visualization</p>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body p-0">
              <div className="map-fullscreen">
                <LiveMapComponent />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">
                <i className="bi bi-info-circle me-2"></i>
                Map Legend
              </h5>
              <div className="legend-items">
                <div className="legend-item">
                  <span className="legend-marker" style={{ backgroundColor: '#2563eb' }}></span>
                  <span>Your Location</span>
                </div>
                <div className="legend-item">
                  <span className="legend-circle" style={{ borderColor: '#10b981' }}></span>
                  <span>Low Risk Zone</span>
                </div>
                <div className="legend-item">
                  <span className="legend-circle" style={{ borderColor: '#f59e0b' }}></span>
                  <span>Medium Risk Zone</span>
                </div>
                <div className="legend-item">
                  <span className="legend-circle" style={{ borderColor: '#ef4444' }}></span>
                  <span>High Risk Zone</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LiveMap;
