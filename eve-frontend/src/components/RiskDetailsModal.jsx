import React from 'react';
import './RiskDetailsModal.css';

function RiskDetailsModal({ riskData, onClose }) {
  if (!riskData) return null;

  const factors = riskData.factors || {};
  const anomalies = riskData.anomalies || {};
  const prediction = riskData.prediction || {};
  const nearestZone = riskData.nearest_danger_zone || {};

  return (
    <div className="risk-details-overlay" onClick={onClose}>
      <div className="risk-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <i className="bi bi-info-circle me-2"></i>
            Risk Analysis Details
          </h3>
          <button className="btn-close" onClick={onClose}></button>
        </div>

        <div className="modal-body">
          {/* Overall Risk */}
          <div className="detail-section">
            <h4>Overall Risk Score</h4>
            <div className="risk-score-display">
              <div className="score-circle">
                <span className="score-value">{riskData.risk_score?.toFixed(1)}</span>
                <span className="score-label">/ 100</span>
              </div>
              <div className="risk-level-badge">
                <span className={`badge badge-${riskData.risk_level?.toLowerCase()}`}>
                  {riskData.risk_level}
                </span>
              </div>
            </div>
          </div>

          {/* Risk Factors */}
          <div className="detail-section">
            <h4>Risk Factors Breakdown</h4>
            <div className="factors-list">
              <div className="factor-item">
                <div className="factor-label">
                  <i className="bi bi-geo-alt-fill text-danger"></i>
                  Zone Risk
                </div>
                <div className="factor-bar">
                  <div 
                    className="factor-fill zone" 
                    style={{ width: `${Math.min(100, factors.zone_risk || 0)}%` }}
                  ></div>
                </div>
                <div className="factor-value">{factors.zone_risk?.toFixed(1) || 0}</div>
              </div>

              <div className="factor-item">
                <div className="factor-label">
                  <i className="bi bi-clock-fill text-warning"></i>
                  Time Risk
                </div>
                <div className="factor-bar">
                  <div 
                    className="factor-fill time" 
                    style={{ width: `${Math.min(100, factors.time_risk || 0)}%` }}
                  ></div>
                </div>
                <div className="factor-value">{factors.time_risk || 0}</div>
              </div>

              <div className="factor-item">
                <div className="factor-label">
                  <i className="bi bi-speedometer text-info"></i>
                  Speed Risk
                </div>
                <div className="factor-bar">
                  <div 
                    className="factor-fill speed" 
                    style={{ width: `${Math.min(100, factors.speed_risk || 0)}%` }}
                  ></div>
                </div>
                <div className="factor-value">{factors.speed_risk || 0}</div>
              </div>

              {factors.prediction_risk > 0 && (
                <div className="factor-item">
                  <div className="factor-label">
                    <i className="bi bi-graph-up text-primary"></i>
                    AI Prediction
                  </div>
                  <div className="factor-bar">
                    <div 
                      className="factor-fill prediction" 
                      style={{ width: `${Math.min(100, factors.prediction_risk || 0)}%` }}
                    ></div>
                  </div>
                  <div className="factor-value">{factors.prediction_risk?.toFixed(1) || 0}</div>
                </div>
              )}
            </div>
          </div>

          {/* Nearest Danger Zone */}
          {nearestZone.name && nearestZone.name !== 'None' && (
            <div className="detail-section">
              <h4>Nearest Danger Zone</h4>
              <div className="zone-info">
                <div className="zone-name">
                  <i className="bi bi-exclamation-triangle-fill text-danger me-2"></i>
                  {nearestZone.name}
                </div>
                <div className="zone-details">
                  <span className="zone-distance">
                    <i className="bi bi-pin-map me-1"></i>
                    {nearestZone.distance_meters?.toFixed(0)}m away
                  </span>
                  <span className="zone-risk">
                    <i className="bi bi-shield-exclamation me-1"></i>
                    Risk Level: {nearestZone.risk_level}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Anomalies */}
          {anomalies.detected && (
            <div className="detail-section alert-section">
              <h4>
                <i className="bi bi-exclamation-octagon-fill text-warning me-2"></i>
                Anomalies Detected ({anomalies.count})
              </h4>
              <ul className="anomalies-list">
                {anomalies.details?.map((detail, index) => (
                  <li key={index}>{detail}</li>
                ))}
              </ul>
              <div className="anomaly-risk">
                Additional Risk: +{anomalies.risk_added}
              </div>
            </div>
          )}

          {/* AI Prediction */}
          {prediction.enabled && prediction.risk_probability > 0 && (
            <div className="detail-section">
              <h4>
                <i className="bi bi-cpu-fill text-primary me-2"></i>
                AI Threat Prediction
              </h4>
              <div className="prediction-info">
                <div className="prediction-stat">
                  <span className="stat-label">Risk Probability</span>
                  <span className="stat-value">{prediction.risk_percentage}%</span>
                </div>
                <div className="prediction-stat">
                  <span className="stat-label">Confidence</span>
                  <span className="stat-value">{prediction.confidence}</span>
                </div>
              </div>
            </div>
          )}

          {/* Reason */}
          <div className="detail-section">
            <h4>Summary</h4>
            <p className="reason-text">{riskData.reason}</p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            <i className="bi bi-check-circle me-2"></i>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export default RiskDetailsModal;
