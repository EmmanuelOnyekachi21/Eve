import React from 'react';
import './InfoCards.css';

function NearestDanger({ riskData }) {
  const nearestZone = riskData?.nearest_danger_zone;
  
  const getRiskBadgeClass = (riskLevel) => {
    if (!riskLevel) return 'bg-secondary';
    if (riskLevel < 40) return 'bg-success';
    if (riskLevel < 70) return 'bg-warning';
    return 'bg-danger';
  };

  return (
    <div className="card shadow-sm mb-3 fade-in info-card">
      <div className="card-body">
        <h5 className="card-title mb-3">
          <i className="bi bi-pin-map-fill me-2"></i>
          Nearest Danger Zone
        </h5>
        <div className="danger-info">
          <div className="info-row">
            <span className="info-label">
              <i className="bi bi-geo-fill me-2"></i>
              Zone Name
            </span>
            <span className="info-value">
              {nearestZone?.name || '--'}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">
              <i className="bi bi-rulers me-2"></i>
              Distance
            </span>
            <span className="info-value">
              {nearestZone?.distance ? `${nearestZone.distance.toFixed(0)}m` : '--'}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">
              <i className="bi bi-shield-exclamation me-2"></i>
              Risk Level
            </span>
            <span className={`badge ${getRiskBadgeClass(nearestZone?.risk_level)}`}>
              {nearestZone?.risk_level ? nearestZone.risk_level.toFixed(0) : 'Unknown'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NearestDanger;
