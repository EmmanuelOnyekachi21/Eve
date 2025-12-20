import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './SafeZonesMap.css';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const createCustomIcon = (emoji, color) => {
  return L.divIcon({
    className: 'custom-zone-marker',
    html: `
      <div style="
        background: ${color};
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
      ">${emoji}</div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

const currentLocationIcon = createCustomIcon('📍', '#3b82f6');
const safeZoneIcon = createCustomIcon('✅', '#10b981');

const SafeZonesMap = ({ currentLocation, safeZones = [], currentRisk = 0 }) => {
  if (!currentLocation) {
    return (
      <div className="map-placeholder">
        <div className="placeholder-icon">🗺️</div>
        <p>Waiting for location...</p>
      </div>
    );
  }

  const center = [currentLocation.latitude, currentLocation.longitude];

  // Get color based on risk
  const getRiskColor = (risk) => {
    if (risk <= 30) return '#10b981';
    if (risk <= 60) return '#f59e0b';
    return '#ef4444';
  };

  // Create direction lines from current location to safe zones
  const getDirectionLines = () => {
    return safeZones.slice(0, 3).map(zone => ({
      positions: [
        [currentLocation.latitude, currentLocation.longitude],
        [zone.latitude, zone.longitude]
      ],
      color: '#3b82f6',
      zone: zone
    }));
  };

  const directionLines = getDirectionLines();

  return (
    <div className="safe-zones-map-container">
      {/* Map Legend */}
      <div className="zones-map-legend">
        <div className="legend-title">Map Legend</div>
        <div className="legend-items">
          <div className="legend-item">
            <span style={{ fontSize: '1.2rem' }}>📍</span>
            <span>Your Location</span>
          </div>
          <div className="legend-item">
            <span style={{ fontSize: '1.2rem' }}>✅</span>
            <span>Safe Zone</span>
          </div>
          <div className="legend-item">
            <div className="legend-line"></div>
            <span>Escape Route</span>
          </div>
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={14}
        style={{ height: '450px', width: '100%', borderRadius: '12px' }}
        className="zones-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Current Location with Risk Circle */}
        <Circle
          center={center}
          radius={50}
          fillColor={getRiskColor(currentRisk)}
          fillOpacity={0.4}
          color={getRiskColor(currentRisk)}
          weight={3}
        >
          <Popup>
            <strong>📍 Your Location</strong>
            <br />
            Current Risk: {currentRisk}%
            <br />
            {currentRisk > 70 ? '🚨 High Risk - Find Safe Zone!' :
             currentRisk > 40 ? '⚠️ Moderate Risk' :
             '✅ Low Risk'}
          </Popup>
        </Circle>

        <Marker position={center} icon={currentLocationIcon}>
          <Popup>
            <strong>You are here</strong>
            <br />
            Risk: {currentRisk}%
          </Popup>
        </Marker>

        {/* Direction Lines to Safe Zones */}
        {directionLines.map((line, index) => (
          <Polyline
            key={`line-${index}`}
            positions={line.positions}
            color={line.color}
            weight={3}
            opacity={0.6}
            dashArray="10, 10"
          >
            <Popup>
              <strong>Escape Route to {line.zone.name}</strong>
              <br />
              Distance: {line.zone.distance_meters.toFixed(0)}m
              <br />
              Direction: {line.zone.direction}
            </Popup>
          </Polyline>
        ))}

        {/* Safe Zones */}
        {safeZones.map((zone, index) => (
          <React.Fragment key={index}>
            {/* Safe zone circle */}
            <Circle
              center={[zone.latitude, zone.longitude]}
              radius={150}
              fillColor="#10b981"
              fillOpacity={0.15}
              color="#10b981"
              weight={2}
            >
              <Popup>
                <strong>✅ {zone.name}</strong>
                <br />
                Risk: {zone.risk_level}%
                <br />
                Distance: {zone.distance_meters.toFixed(0)}m
                <br />
                Direction: {zone.direction}
                <br />
                <strong>{zone.directions}</strong>
              </Popup>
            </Circle>

            {/* Safe zone marker */}
            <Marker 
              position={[zone.latitude, zone.longitude]}
              icon={safeZoneIcon}
            >
              <Popup>
                <div style={{ minWidth: '200px' }}>
                  <strong style={{ fontSize: '1.1rem' }}>✅ {zone.name}</strong>
                  <br /><br />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span>Risk Level:</span>
                    <strong style={{ color: getRiskColor(zone.risk_level) }}>
                      {zone.risk_level}%
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span>Distance:</span>
                    <strong>{zone.distance_meters.toFixed(0)}m</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span>Direction:</span>
                    <strong>{zone.direction}</strong>
                  </div>
                  <div style={{ 
                    padding: '8px', 
                    background: '#eff6ff', 
                    borderRadius: '6px',
                    marginTop: '10px'
                  }}>
                    <strong>🧭 {zone.directions}</strong>
                  </div>
                  <button
                    onClick={() => {
                      const url = `https://www.google.com/maps/dir/?api=1&destination=${zone.latitude},${zone.longitude}`;
                      window.open(url, '_blank');
                    }}
                    style={{
                      width: '100%',
                      marginTop: '10px',
                      padding: '8px',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    Navigate →
                  </button>
                </div>
              </Popup>
            </Marker>

            {/* Rank badge */}
            {index < 3 && (
              <Marker
                position={[zone.latitude, zone.longitude]}
                icon={L.divIcon({
                  className: 'rank-badge',
                  html: `
                    <div style="
                      background: #3b82f6;
                      color: white;
                      width: 24px;
                      height: 24px;
                      border-radius: 50%;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      font-weight: bold;
                      font-size: 12px;
                      border: 2px solid white;
                      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                      margin-left: 20px;
                      margin-top: -20px;
                    ">#{index + 1}</div>
                  `,
                  iconSize: [24, 24],
                  iconAnchor: [12, 12],
                })}
              />
            )}
          </React.Fragment>
        ))}
      </MapContainer>

      {/* Map Info */}
      <div className="zones-map-info">
        <div className="info-item">
          <span className="info-icon">📍</span>
          <span className="info-text">
            Current Risk: <strong style={{ color: getRiskColor(currentRisk) }}>
              {currentRisk}%
            </strong>
          </span>
        </div>
        {safeZones.length > 0 && (
          <>
            <div className="info-item">
              <span className="info-icon">✅</span>
              <span className="info-text">{safeZones.length} safe zones shown</span>
            </div>
            <div className="info-item">
              <span className="info-icon">🧭</span>
              <span className="info-text">
                Nearest: {safeZones[0].distance_meters.toFixed(0)}m {safeZones[0].direction}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SafeZonesMap;
