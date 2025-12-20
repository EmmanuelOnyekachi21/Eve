import React, { useState, useEffect } from 'react';
import { getConfidenceMap, getConfidenceColor, getConfidenceIcon } from '../services/enhancedPredictionService';
import './ConfidenceMapPanel.css';

const ConfidenceMapPanel = ({ currentLocation, autoLoad = false }) => {
  const [confidenceData, setConfidenceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchConfidenceMap = async () => {
    if (!currentLocation) {
      setError('Current location not available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getConfidenceMap(
        currentLocation.latitude,
        currentLocation.longitude
      );
      setConfidenceData(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch confidence map');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentLocation && autoLoad) {
      fetchConfidenceMap();
    }
  }, [currentLocation, autoLoad]);

  const getReliabilityPercentage = (reliability) => {
    return Math.round(reliability * 100);
  };

  return (
    <div className="confidence-map-panel">
      <div className="panel-header">
        <h3>📊 Prediction Confidence</h3>
        <p className="panel-subtitle">How reliable are predictions in this area?</p>
      </div>

      <button
        className="btn-primary btn-check"
        onClick={fetchConfidenceMap}
        disabled={loading || !currentLocation}
      >
        {loading ? 'Analyzing...' : '🔍 Check Confidence'}
      </button>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {confidenceData && (
        <div className="confidence-results">
          {/* Overall Confidence */}
          <div className="overall-confidence-card">
            <div className="confidence-icon-large">
              {getConfidenceIcon(confidenceData.overall_confidence)}
            </div>
            <div className="confidence-main">
              <div className="confidence-level" style={{ color: getConfidenceColor(confidenceData.overall_confidence) }}>
                {confidenceData.overall_confidence}
              </div>
              <div className="confidence-label">Overall Confidence</div>
            </div>
          </div>

          {/* Data Quality */}
          <div className="data-quality-card">
            <h4>📈 Data Quality</h4>
            <div className="quality-stats">
              <div className="quality-stat">
                <span className="stat-icon">📍</span>
                <div className="stat-info">
                  <div className="stat-value">{confidenceData.data_quality.total_incidents_nearby}</div>
                  <div className="stat-label">Total Incidents</div>
                </div>
              </div>
              <div className="quality-stat">
                <span className="stat-icon">📊</span>
                <div className="stat-info">
                  <div className="stat-value">{confidenceData.data_quality.average_per_direction.toFixed(1)}</div>
                  <div className="stat-label">Avg per Direction</div>
                </div>
              </div>
              <div className="quality-stat">
                <span className="stat-icon">✅</span>
                <div className="stat-info">
                  <div className="stat-value">{confidenceData.data_quality.coverage}</div>
                  <div className="stat-label">Coverage</div>
                </div>
              </div>
            </div>
            <div className="quality-recommendation">
              💡 {confidenceData.data_quality.recommendation}
            </div>
          </div>

          {/* Directional Confidence */}
          <div className="directional-confidence">
            <h4>🧭 Confidence by Direction</h4>
            <div className="confidence-grid">
              {confidenceData.confidence_zones.map((zone, index) => (
                <div key={index} className="direction-card">
                  <div className="direction-header">
                    <span className="direction-name">{zone.area}</span>
                    <span
                      className="direction-confidence"
                      style={{ color: getConfidenceColor(zone.confidence) }}
                    >
                      {getConfidenceIcon(zone.confidence)} {zone.confidence}
                    </span>
                  </div>
                  <div className="direction-details">
                    <div className="direction-stat">
                      <span className="detail-label">Data Points:</span>
                      <span className="detail-value">{zone.data_points}</span>
                    </div>
                    <div className="direction-stat">
                      <span className="detail-label">Reliability:</span>
                      <span className="detail-value">{getReliabilityPercentage(zone.reliability)}%</span>
                    </div>
                  </div>
                  <div className="direction-description">
                    {zone.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interpretation Guide */}
          <div className="interpretation-guide">
            <h4>📖 Accuracy Guide</h4>
            <div className="interpretation-list">
              {Object.entries(confidenceData.interpretation).map(([level, accuracy]) => (
                <div key={level} className="interpretation-item">
                  <span className="interpretation-icon">
                    {getConfidenceIcon(level.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '))}
                  </span>
                  <span className="interpretation-level">
                    {level.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}:
                  </span>
                  <span className="interpretation-accuracy">{accuracy}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Compass Visualization */}
          <div className="compass-visualization">
            <div className="compass-container">
              <div className="compass-center">
                <div className="compass-icon">📍</div>
                <div className="compass-label">You</div>
              </div>
              {confidenceData.confidence_zones.slice(0, 8).map((zone, index) => {
                const angle = (index * 45) - 90; // Start from North
                const radius = 80;
                const x = Math.cos(angle * Math.PI / 180) * radius;
                const y = Math.sin(angle * Math.PI / 180) * radius;
                
                return (
                  <div
                    key={index}
                    className="compass-point"
                    style={{
                      left: `calc(50% + ${x}px)`,
                      top: `calc(50% + ${y}px)`,
                      backgroundColor: getConfidenceColor(zone.confidence),
                    }}
                    title={`${zone.area}: ${zone.confidence}`}
                  >
                    <span className="compass-point-label">{zone.area.substring(0, 2)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {!confidenceData && !loading && !error && (
        <div className="empty-state">
          <div className="empty-icon">🗺️</div>
          <p>Check prediction confidence for your current area</p>
        </div>
      )}
    </div>
  );
};

export default ConfidenceMapPanel;
