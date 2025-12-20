import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './SafeRouteMap.css';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const createCustomIcon = (color, label) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
      ">${label}</div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

const startIcon = createCustomIcon('#10b981', '🏁');
const endIcon = createCustomIcon('#ef4444', '🎯');

// Component to fit map bounds
function MapBounds({ waypoints }) {
  const map = useMap();
  
  useEffect(() => {
    if (waypoints && waypoints.length > 0) {
      const bounds = L.latLngBounds(
        waypoints.map(w => [w.latitude, w.longitude])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [waypoints, map]);
  
  return null;
}

const SafeRouteMap = ({ 
  currentLocation, 
  destination, 
  waypoints = [], 
  safeZones = [],
  onMapClick 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Get color based on risk level
  const getRiskColor = (risk) => {
    if (risk <= 30) return '#10b981'; // Green
    if (risk <= 60) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  };

  // Auto-search as user types (debounced)
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Don't search if query is too short
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    // Set new timeout for search
    searchTimeoutRef.current = setTimeout(() => {
      handleAutoSearch();
    }, 500); // Wait 500ms after user stops typing

    // Cleanup
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Auto-search function
  const handleAutoSearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;
    
    setSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=8&countrycodes=ng`
      );
      const data = await response.json();
      setSearchResults(data);
      setShowSuggestions(data.length > 0);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setShowSuggestions(false);
    } finally {
      setSearching(false);
    }
  };

  // Manual search (when user presses Enter or clicks button)
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=8&countrycodes=ng`
      );
      const data = await response.json();
      setSearchResults(data);
      setShowSuggestions(data.length > 0);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchSelect = (result) => {
    if (onMapClick) {
      onMapClick({
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        name: result.display_name
      });
    }
    setSearchResults([]);
    setSearchQuery(result.display_name);
    setShowSuggestions(false);
  };

  // Handle input change
  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
    if (e.target.value.trim().length >= 2) {
      setShowSuggestions(true);
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (searchResults.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Handle input blur (with delay to allow click on results)
  const handleInputBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  // Create route line segments with colors based on risk
  const getRouteSegments = () => {
    if (!waypoints || waypoints.length < 2) return [];
    
    const segments = [];
    for (let i = 0; i < waypoints.length - 1; i++) {
      const start = waypoints[i];
      const end = waypoints[i + 1];
      const avgRisk = (start.risk_percentage + end.risk_percentage) / 2;
      
      segments.push({
        positions: [
          [start.latitude, start.longitude],
          [end.latitude, end.longitude]
        ],
        color: getRiskColor(avgRisk),
        risk: avgRisk
      });
    }
    return segments;
  };

  const routeSegments = getRouteSegments();
  const center = currentLocation 
    ? [currentLocation.latitude, currentLocation.longitude]
    : [5.125086, 7.356695];

  return (
    <div className="safe-route-map-container">
      {/* Search Bar */}
      <div className="map-search-bar">
        <div className="search-input-group">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Type location name (e.g., 'Abuja', 'Market')..."
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="search-input"
            />
            {searching && (
              <div className="search-loading">
                <div className="spinner"></div>
              </div>
            )}
            {searchQuery && (
              <button
                className="clear-button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setShowSuggestions(false);
                }}
              >
                ✕
              </button>
            )}
          </div>
          <button 
            onClick={handleSearch} 
            disabled={searching || !searchQuery.trim()}
            className="search-button"
          >
            🔍
          </button>
        </div>
        
        {showSuggestions && searchResults.length > 0 && (
          <div className="search-suggestions">
            <div className="suggestions-header">
              <span className="suggestions-title">
                {searchResults.length} location{searchResults.length !== 1 ? 's' : ''} found
              </span>
              {searchQuery.length >= 2 && (
                <span className="suggestions-hint">Click to select</span>
              )}
            </div>
            {searchResults.map((result, index) => (
              <div
                key={index}
                className="suggestion-item"
                onClick={() => handleSearchSelect(result)}
              >
                <div className="suggestion-icon">📍</div>
                <div className="suggestion-content">
                  <div className="suggestion-name">
                    {result.display_name.split(',')[0]}
                  </div>
                  <div className="suggestion-address">
                    {result.display_name.split(',').slice(1).join(',').trim()}
                  </div>
                </div>
                <div className="suggestion-arrow">→</div>
              </div>
            ))}
          </div>
        )}
        
        {showSuggestions && searchQuery.trim().length >= 2 && searchResults.length === 0 && !searching && (
          <div className="search-no-results">
            <div className="no-results-icon">🔍</div>
            <div className="no-results-text">
              No locations found for "{searchQuery}"
              <br />
              <small>Try a different search term</small>
            </div>
          </div>
        )}
      </div>

      {/* Map Legend */}
      <div className="map-legend">
        <div className="legend-title">Risk Levels</div>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#10b981' }}></div>
            <span>Low (0-30%)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#f59e0b' }}></div>
            <span>Medium (30-60%)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#ef4444' }}></div>
            <span>High (60-100%)</span>
          </div>
        </div>
      </div>

      {/* Map */}
      <MapContainer
        center={center}
        zoom={14}
        style={{ height: '500px', width: '100%', borderRadius: '12px' }}
        className="route-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Current Location */}
        {currentLocation && (
          <Marker 
            position={[currentLocation.latitude, currentLocation.longitude]}
            icon={startIcon}
          >
            <Popup>
              <strong>📍 Your Location</strong>
              <br />
              {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
            </Popup>
          </Marker>
        )}

        {/* Destination */}
        {destination && (
          <Marker 
            position={[destination.lat, destination.lon]}
            icon={endIcon}
          >
            <Popup>
              <strong>🎯 Destination</strong>
              <br />
              {destination.lat.toFixed(6)}, {destination.lon.toFixed(6)}
            </Popup>
          </Marker>
        )}

        {/* Route Segments with Color Coding */}
        {routeSegments.map((segment, index) => (
          <Polyline
            key={index}
            positions={segment.positions}
            color={segment.color}
            weight={6}
            opacity={0.8}
          >
            <Popup>
              <strong>Route Segment {index + 1}</strong>
              <br />
              Risk: {segment.risk.toFixed(1)}%
            </Popup>
          </Polyline>
        ))}

        {/* Waypoints */}
        {waypoints.map((waypoint, index) => (
          <Circle
            key={index}
            center={[waypoint.latitude, waypoint.longitude]}
            radius={30}
            fillColor={getRiskColor(waypoint.risk_percentage)}
            fillOpacity={0.6}
            color={getRiskColor(waypoint.risk_percentage)}
            weight={2}
          >
            <Popup>
              <strong>Waypoint {index + 1}</strong>
              <br />
              Risk: {waypoint.risk_percentage}%
              <br />
              Confidence: {waypoint.confidence}
            </Popup>
          </Circle>
        ))}

        {/* Safe Zones */}
        {safeZones.map((zone, index) => (
          <Circle
            key={`safe-${index}`}
            center={[zone.latitude, zone.longitude]}
            radius={100}
            fillColor="#10b981"
            fillOpacity={0.2}
            color="#10b981"
            weight={2}
            dashArray="5, 5"
          >
            <Popup>
              <strong>✅ {zone.name}</strong>
              <br />
              Risk: {zone.risk_level}%
              <br />
              Distance: {zone.distance_meters.toFixed(0)}m
            </Popup>
          </Circle>
        ))}

        {/* Fit bounds to show all waypoints */}
        {waypoints.length > 0 && <MapBounds waypoints={waypoints} />}
      </MapContainer>

      {/* Route Info */}
      {waypoints.length > 0 && (
        <div className="route-info-bar">
          <div className="info-item">
            <span className="info-icon">📍</span>
            <span className="info-text">{waypoints.length} waypoints</span>
          </div>
          {safeZones.length > 0 && (
            <div className="info-item">
              <span className="info-icon">✅</span>
              <span className="info-text">{safeZones.length} safe zones</span>
            </div>
          )}
          <div className="info-item">
            <span className="info-icon">🛣️</span>
            <span className="info-text">Color-coded by risk</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SafeRouteMap;
