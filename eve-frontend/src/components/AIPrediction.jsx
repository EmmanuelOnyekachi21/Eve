import React from 'react';
import './InfoCards.css';

function AIPrediction({ riskData }) {
  const anomalies = riskData?.anomalies || [];
  const hasAnomalies = anomalies.length > 0;

  return (
    <div className="card shadow-sm mb-3 fade-in info-card ai-card">
      <div className="card-body">
        <h5 className="card-title mb-3">
          <i className="bi bi-cpu-fill me-2"></i>
          Anomaly Detection
        </h5>
        
        {hasAnomalies ? (
          <div className="anomalies-list">
            <div className="alert alert-danger mb-3">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              <strong>{anomalies.length} Anomal{anomalies.length > 1 ? 'ies' : 'y'} Detected!</strong>
            </div>
            {anomalies.map((anomaly, index) => (
              <div key={index} className="anomaly-item">
                <i className="bi bi-exclamation-circle text-danger me-2"></i>
                <span>{anomaly.type || anomaly}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="ai-prediction-content">
            <div className="prediction-main">
              <div className="prediction-label">Current Status</div>
              <div className="prediction-value text-success">Normal</div>
            </div>
            
            <div className="ai-status">
              <i className="bi bi-shield-check me-2 text-success"></i>
              <span className="text-success">No anomalies detected</span>
            </div>
          </div>
        )}

        {riskData && (
          <div className="mt-3 text-center">
            <small className="text-muted">
              <i className="bi bi-clock me-1"></i>
              Last checked: {new Date().toLocaleTimeString()}
            </small>
          </div>
        )}
      </div>
    </div>
  );
}

export default AIPrediction;
