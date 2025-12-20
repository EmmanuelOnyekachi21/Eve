import React, { useState, useEffect } from 'react';
import { getNearbySafeZones, formatDistance, getDirectionArrow, getConfidenceColor } from '../services/enhancedPredictionService';
import SafeZonesMap from './SafeZonesMap';
import './SafeZonesPanel.css';

const SafeZonesPanel = ({ currentLocation, autoRefresh = false }) => {
  const [safeZones, setSafeZones] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [radius, setRadius] = useState(500);

  const fetchSafeZones = async () => {
    if (!currentLocation) {
      setError('Current location not available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getNearbySafeZones(
        currentLocation.latitude,
        currentLocation.longitude,
        radius
      );
      setSafeZones(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch safe zones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentLocation && autoRefresh) {
      fetchSafeZones();
    }
  }, [currentLocation, autoRefresh]);

  const getRiskColor = (risk) => {
    if (risk <= 30) return '#10b981';
    if (risk <= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getRiskLabel = (risk) => {
    if (risk <= 30) return 'Low Risk';
    if (risk <= 60) return 'Medium Risk';
    return 'High Risk';
  };

  return (
    <div className="safe-zones-panel">
      <div className="panel-header">
        <h3>🏃 Emergency Safe Zones</h3>
        <p className="panel-subtitle">Nearest safe areas for quick escape</p>
      </div>

      <div className="search-controls">
        <div className="radius-control">
          <label>Search Radius</label>
          <select value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
            <option value={300}>300m</option>
            <option value={500}>500m</option>
            <option value={1000}>1km</option>
            <option value={2000}>2km</option>
          </select>
        </div>

        <button
          className="btn-primary btn-search"
          onClick={fetchSafeZones}
          disabled={loading || !currentLocation}
        >
          {loading ? 'Searching...' : '🔍 Find Safe Zones'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {/* Interactive Map */}
      <SafeZonesMap
        currentLocation={currentLocation}
        safeZones={safeZones?.safe_zones || []}
        currentRisk={safeZones?.current_location?.current_risk || 0}
      />

      {safeZones && (
        <div className="safe-zones-results">
          {/* Current Location Risk */}
          <div className="current-risk-card">
            <div className="risk-header">
              <span className="risk-label">Current Location Risk</span>
              <span
                className="risk-value"
                style={{ color: getRiskColor(safeZones.current_location.current_risk) }}
              >
                {safeZones.current_location.current_risk}%
              </span>
            </div>
            <div className="risk-status" style={{ color: getRiskColor(safeZones.current_location.current_risk) }}>
              {getRiskLabel(safeZones.current_location.current_risk)}
            </div>
            <div className="confidence-indicator">
              Confidence: <span style={{ color: getConfidenceColor(safeZones.current_location.confidence) }}>
                {safeZones.current_location.confidence}
              </span>
            </div>
          </div>

          {/* Escape Recommendation */}
          {safeZones.escape_recommendation && (
            <div className="escape-recommendation">
              <div className="recommendation-icon">🚨</div>
              <div className="recommendation-text">
                {safeZones.escape_recommendation}
              </div>
            </div>
          )}

          {/* Safe Zones List */}
          {safeZones.safe_zones && safeZones.safe_zones.length > 0 ? (
            <div className="zones-list">
              <h4>
                ✅ {safeZones.zones_found} Safe Zone{safeZones.zones_found !== 1 ? 's' : ''} Found
              </h4>
              {safeZones.safe_zones.map((zone, index) => (
                <div key={index} className="zone-card">
                  <div className="zone-header">
                    <div className="zone-rank">#{index + 1}</div>
                    <div className="zone-main-info">
                      <div className="zone-name">{zone.name}</div>
                      <div className="zone-distance">
                        {getDirectionArrow(zone.direction)} {formatDistance(zone.distance_meters)} {zone.direction}
                      </div>
                    </div>
                  </div>

                  <div className="zone-details">
                    <div className="zone-risk">
                      <span className="detail-label">Risk Level:</span>
                      <span
                        className="detail-value"
                        style={{ color: getRiskColor(zone.risk_level) }}
                      >
                        {zone.risk_level}%
                      </span>
                    </div>
                    <div className="zone-confidence">
                      <span className="detail-label">Confidence:</span>
                      <span
                        className="detail-value"
                        style={{ color: getConfidenceColor(zone.confidence) }}
                      >
                        {zone.confidence}
                      </span>
                    </div>
                  </div>

                  <div className="zone-directions">
                    <div className="directions-icon">🧭</div>
                    <div className="directions-text">{zone.directions}</div>
                  </div>

                  <button
                    className="btn-navigate"
                    onClick={() => {
                      // Open in maps app
                      const url = `https://www.google.com/maps/dir/?api=1&destination=${zone.latitude},${zone.longitude}`;
                      window.open(url, '_blank');
                    }}
                  >
                    Navigate →
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-zones-message">
              <div className="no-zones-icon">📍</div>
              <div className="no-zones-text">
                No safe zones found within {formatDistance(radius)}.
                <br />
                Try increasing the search radius.
              </div>
            </div>
          )}

          {/* Search Info */}
          <div className="search-info">
            Searched within {formatDistance(safeZones.search_radius_meters)} of your location
          </div>
        </div>
      )}

      {!safeZones && !loading && !error && (
        <div className="empty-state">
          <div className="empty-icon">🗺️</div>
          <p>Click "Find Safe Zones" to discover nearby safe areas</p>
        </div>
      )}
    </div>
  );
};

export default SafeZonesPanel;
