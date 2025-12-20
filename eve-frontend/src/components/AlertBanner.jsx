import React, { useState, useEffect } from 'react';
import './AlertBanner.css';

function AlertBanner({ riskLevel, riskData, onViewDetails }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (riskLevel > 70 && !dismissed) {
      setVisible(true);
      // Auto-hide after 10 seconds
      const timer = setTimeout(() => {
        setVisible(false);
      }, 10000);
      return () => clearTimeout(timer);
    } else if (riskLevel <= 70) {
      setVisible(false);
      setDismissed(false);
    }
  }, [riskLevel, dismissed]);

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
  };

  const getPrimaryReason = () => {
    if (!riskData) return 'High risk detected in your area';
    
    const factors = [
      { name: 'Zone Risk', value: riskData.zone_risk },
      { name: 'Time Risk', value: riskData.time_risk },
      { name: 'Anomaly Risk', value: riskData.anomaly_risk }
    ];
    
    const highest = factors.reduce((max, factor) => 
      factor.value > max.value ? factor : max
    );
    
    return `${highest.name}: ${highest.value?.toFixed(0)}%`;
  };

  if (!visible) return null;

  return (
    <div className="alert-banner">
      <div className="alert-content">
        <div className="alert-icon">
          <i className="bi bi-exclamation-triangle-fill"></i>
        </div>
        <div className="alert-text">
          <h4 className="alert-title">⚠️ HIGH RISK DETECTED</h4>
          <p className="alert-reason">{getPrimaryReason()}</p>
        </div>
        <div className="alert-actions">
          <button className="btn btn-light btn-sm me-2" onClick={onViewDetails}>
            <i className="bi bi-eye me-1"></i>
            View Details
          </button>
          <button className="btn-close btn-close-white" onClick={handleDismiss}></button>
        </div>
      </div>
    </div>
  );
}

export default AlertBanner;
