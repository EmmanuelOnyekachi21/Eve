import React, { useState } from 'react';
import { getSafeRoute, getSafetyScoreColor, getSafetyScoreLabel, formatDistance } from '../services/enhancedPredictionService';
import SafeRouteMap from './SafeRouteMap';
import './SafeRoutePanel.css';

const SafeRoutePanel = ({ currentLocation }) => {
  const [destination, setDestination] = useState({ lat: '', lon: '' });
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleAnalyzeRoute = async () => {
    if (!destination.lat || !destination.lon) {
      setError('Please enter destination coordinates');
      return;
    }

    if (!currentLocation) {
      setError('Current location not available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getSafeRoute(
        currentLocation.latitude,
        currentLocation.longitude,
        parseFloat(destination.lat),
        parseFloat(destination.lon)
      );
      setRouteData(data);
    } catch (err) {
      setError(err.message || 'Failed to analyze route');
    } finally {
      setLoading(false);
    }
  };

  const handleUseHomeLocation = () => {
    // You can integrate with user profile to get home location
    setDestination({ lat: '5.130000', lon: '7.360000' });
  };

  const handleMapLocationSelect = (location) => {
    setDestination({ 
      lat: location.lat.toString(), 
      lon: location.lon.toString() 
    });
  };

  const handleSearchLocation = async () => {
    if (!searchQuery.trim()) {
      return;
    }

    setSearching(true);
    setError(null);

    try {
      // Using Nominatim (OpenStreetMap) geocoding API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`,
        {
          headers: {
            'User-Agent': 'EVE-SafetyApp/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const results = await response.json();
      setSearchResults(results);

      if (results.length === 0) {
        setError('No locations found. Try a different search term.');
      }
    } catch (err) {
      setError('Failed to search location. Please try again.');
      console.error('Location search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectSearchResult = (result) => {
    setDestination({
      lat: result.lat,
      lon: result.lon
    });
    setSearchQuery(result.display_name);
    setSearchResults([]);
  };

  return (
    <div className="safe-route-panel">
      <div className="panel-header">
        <h3>🛣️ Safe Route Planner</h3>
        <p className="panel-subtitle">Find the safest path to your destination</p>
      </div>

      <div className="route-input-section">
        <div className="location-display">
          <label>From (Current Location)</label>
          <div className="location-value">
            {currentLocation ? (
              <>
                📍 {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </>
            ) : (
              <span className="text-muted">Waiting for GPS...</span>
            )}
          </div>
        </div>

        <div className="destination-input">
          <label>To (Destination)</label>
          
          {/* Location Search */}
          <div className="location-search">
            <div className="search-input-group">
              <input
                type="text"
                className="search-input"
                placeholder="Search for a location (e.g., 'University of Port Harcourt')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchLocation()}
              />
              <button
                className="btn-search"
                onClick={handleSearchLocation}
                disabled={searching || !searchQuery.trim()}
              >
                {searching ? '🔄' : '🔍'}
              </button>
            </div>

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="search-results-dropdown">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    className="search-result-item"
                    onClick={() => handleSelectSearchResult(result)}
                  >
                    <div className="result-icon">📍</div>
                    <div className="result-info">
                      <div className="result-name">{result.display_name}</div>
                      <div className="result-coords">
                        {parseFloat(result.lat).toFixed(6)}, {parseFloat(result.lon).toFixed(6)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Manual Coordinate Input */}
          <div className="coordinate-inputs">
            <input
              type="number"
              step="0.000001"
              placeholder="Latitude"
              value={destination.lat}
              onChange={(e) => setDestination({ ...destination, lat: e.target.value })}
            />
            <input
              type="number"
              step="0.000001"
              placeholder="Longitude"
              value={destination.lon}
              onChange={(e) => setDestination({ ...destination, lon: e.target.value })}
            />
          </div>
          <button className="btn-secondary btn-sm" onClick={handleUseHomeLocation}>
            Use Home Location
          </button>
        </div>

        <button
          className="btn-primary btn-analyze"
          onClick={handleAnalyzeRoute}
          disabled={loading || !currentLocation}
        >
          {loading ? 'Analyzing...' : '🔍 Analyze Route'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {/* Interactive Map */}
      <SafeRouteMap
        currentLocation={currentLocation}
        destination={destination.lat && destination.lon ? {
          lat: parseFloat(destination.lat),
          lon: parseFloat(destination.lon)
        } : null}
        waypoints={routeData?.waypoints || []}
        safeZones={routeData?.safe_zones_nearby || []}
        onMapClick={handleMapLocationSelect}
      />

      {routeData && (
        <div className="route-results">
          {/* Safety Score */}
          <div className="safety-score-card">
            <div className="score-circle" style={{ borderColor: getSafetyScoreColor(routeData.overall_safety_score) }}>
              <div className="score-value" style={{ color: getSafetyScoreColor(routeData.overall_safety_score) }}>
                {routeData.overall_safety_score}
              </div>
              <div className="score-label">Safety Score</div>
            </div>
            <div className="score-info">
              <div className="score-status" style={{ color: getSafetyScoreColor(routeData.overall_safety_score) }}>
                {getSafetyScoreLabel(routeData.overall_safety_score)}
              </div>
              <div className="score-details">
                <div>Distance: {routeData.route_analysis.distance_km} km</div>
                <div>Est. Time: {routeData.estimated_travel_time_minutes} min</div>
              </div>
            </div>
          </div>

          {/* Risk Analysis */}
          <div className="risk-analysis">
            <h4>Risk Analysis</h4>
            <div className="risk-stats">
              <div className="risk-stat">
                <span className="stat-label">Average Risk</span>
                <span className="stat-value">{routeData.route_analysis.average_risk}%</span>
              </div>
              <div className="risk-stat">
                <span className="stat-label">Maximum Risk</span>
                <span className="stat-value danger">{routeData.route_analysis.maximum_risk}%</span>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {routeData.recommendations && routeData.recommendations.length > 0 && (
            <div className="recommendations">
              <h4>💡 Recommendations</h4>
              <ul>
                {routeData.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Safe Zones */}
          {routeData.safe_zones_nearby && routeData.safe_zones_nearby.length > 0 && (
            <div className="safe-zones-list">
              <h4>✅ Safe Zones Along Route</h4>
              {routeData.safe_zones_nearby.map((zone, index) => (
                <div key={index} className="safe-zone-item">
                  <div className="zone-name">{zone.name}</div>
                  <div className="zone-distance">{formatDistance(zone.distance_meters)}</div>
                </div>
              ))}
            </div>
          )}

          {/* Waypoints */}
          <div className="waypoints-section">
            <h4>📍 Route Waypoints</h4>
            <div className="waypoints-list">
              {routeData.waypoints.map((waypoint, index) => (
                <div key={index} className="waypoint-item">
                  <div className="waypoint-number">{index + 1}</div>
                  <div className="waypoint-info">
                    <div className="waypoint-coords">
                      {waypoint.latitude.toFixed(6)}, {waypoint.longitude.toFixed(6)}
                    </div>
                    <div className="waypoint-risk">
                      <span
                        className="risk-badge"
                        style={{
                          backgroundColor: waypoint.risk_percentage > 70 ? '#fee2e2' :
                                         waypoint.risk_percentage > 40 ? '#fef3c7' : '#d1fae5',
                          color: waypoint.risk_percentage > 70 ? '#991b1b' :
                                waypoint.risk_percentage > 40 ? '#92400e' : '#065f46'
                        }}
                      >
                        {waypoint.risk_percentage}% risk
                      </span>
                      <span className="confidence-badge">{waypoint.confidence}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SafeRoutePanel;
