import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap, ScaleControl, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './LiveMapComponent.css';
import { fetchCrimeZones, getRiskColor } from '../services/api';

// Component to update map center when location changes
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom blue marker for user location
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function LiveMapComponent({ userLocation: propUserLocation }) {
  // Default center: latitude 5.125086, longitude 7.356695 (crime zones area)
  const [userLocation, setUserLocation] = useState(propUserLocation || [5.125086, 7.356695]);
  const [isLoading, setIsLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);
  const [crimeZones, setCrimeZones] = useState([]);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [zonesError, setZonesError] = useState(null);
  const [manualMode, setManualMode] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Update location when prop changes
  useEffect(() => {
    if (propUserLocation) {
      setUserLocation(propUserLocation);
      setManualMode(true);
    }
  }, [propUserLocation]);

  // Fetch crime zones from API
  const loadCrimeZones = async () => {
    setZonesLoading(true);
    setZonesError(null);
    try {
      const zones = await fetchCrimeZones();
      console.log('Loaded crime zones:', zones.length);
      setCrimeZones(zones);
    } catch (error) {
      console.error('Failed to load crime zones:', error);
      setZonesError('Cannot connect to backend. Make sure Django server is running at localhost:8000');
    } finally {
      setZonesLoading(false);
    }
  };

  useEffect(() => {
    // Load crime zones
    loadCrimeZones();

    // Request user's actual location
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Success - got user's location
          const { latitude, longitude } = position.coords;
          console.log('Got user location:', latitude, longitude);
          setUserLocation([latitude, longitude]);
          setIsLoading(false);
          setLocationError(null);
        },
        (error) => {
          // Error or user denied permission
          console.error('Geolocation error:', error);
          setLocationError(error.message);
          setIsLoading(false);
          // Keep default location
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      // Geolocation not supported
      setLocationError('Geolocation is not supported by your browser');
      setIsLoading(false);
    }
  }, []);

  // Manual location setter
  const setManualLocation = () => {
    setShowLocationPicker(true);
  };

  const applyManualLocation = (lat, lng) => {
    setUserLocation([parseFloat(lat), parseFloat(lng)]);
    setManualMode(true);
    setShowLocationPicker(false);
  };

  // Quick location presets for testing
  const locationPresets = [
    { name: 'Crime Zone Center', lat: 5.125086, lng: 7.356695 },
    { name: 'North Area', lat: 5.130, lng: 7.360 },
    { name: 'South Area', lat: 5.120, lng: 7.350 },
    { name: 'East Area', lat: 5.125, lng: 7.365 },
  ];

  return (
    <div className="map-wrapper">
      {isLoading && (
        <div className="map-loading-overlay">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Requesting location access...</p>
        </div>
      )}
      
      {locationError && (
        <div className="map-error-banner">
          <i className="bi bi-exclamation-triangle me-2"></i>
          Location access denied. Showing default location.
        </div>
      )}

      {/* Manual Location Control */}
      <div className="location-control">
        <button 
          className="btn btn-sm btn-primary"
          onClick={() => setShowLocationPicker(!showLocationPicker)}
        >
          <i className="bi bi-pin-map me-2"></i>
          {manualMode ? 'Manual Location' : 'Set Test Location'}
        </button>
      </div>

      {/* Location Picker Dropdown */}
      {showLocationPicker && (
        <div className="location-picker-panel">
          <div className="location-picker-header">
            <strong>Choose Test Location</strong>
            <button 
              className="btn-close btn-sm"
              onClick={() => setShowLocationPicker(false)}
            ></button>
          </div>
          <div className="location-presets">
            {locationPresets.map((preset, idx) => (
              <button
                key={idx}
                className="btn btn-sm btn-outline-primary w-100 mb-2"
                onClick={() => applyManualLocation(preset.lat, preset.lng)}
              >
                <i className="bi bi-geo-alt me-2"></i>
                {preset.name}
                <br />
                <small className="text-muted">
                  {preset.lat.toFixed(4)}, {preset.lng.toFixed(4)}
                </small>
              </button>
            ))}
          </div>
          <div className="location-custom mt-3">
            <small className="text-muted">Or enter custom coordinates:</small>
            <div className="input-group input-group-sm mt-2">
              <input 
                type="number" 
                className="form-control" 
                placeholder="Latitude"
                id="custom-lat"
                step="0.0001"
                defaultValue="5.125086"
              />
              <input 
                type="number" 
                className="form-control" 
                placeholder="Longitude"
                id="custom-lng"
                step="0.0001"
                defaultValue="7.356695"
              />
              <button 
                className="btn btn-primary"
                onClick={() => {
                  const lat = document.getElementById('custom-lat').value;
                  const lng = document.getElementById('custom-lng').value;
                  applyManualLocation(lat, lng);
                }}
              >
                Go
              </button>
            </div>
          </div>
        </div>
      )}

      {zonesError && (
        <div className="map-error-banner" style={{ top: '60px' }}>
          <i className="bi bi-exclamation-circle me-2"></i>
          {zonesError}
          <button 
            className="btn btn-sm btn-warning ms-3" 
            onClick={loadCrimeZones}
            disabled={zonesLoading}
          >
            {zonesLoading ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      )}

      {!zonesLoading && !zonesError && crimeZones.length > 0 && (
        <div className="zones-badge">
          <i className="bi bi-geo-alt-fill me-2"></i>
          {crimeZones.length} zones loaded
        </div>
      )}
      
      <MapContainer
        center={userLocation}
        zoom={16}
        style={{ height: '600px', width: '100%' }}
        className="leaflet-map"
        zoomControl={false}
      >
        <MapUpdater center={userLocation} />
        <ZoomControl position="topright" />
        <ScaleControl position="bottomleft" />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* User Location Marker */}
        <Marker position={userLocation} icon={userIcon}>
          <Popup>
            <strong>Your Location</strong>
            <br />
            Lat: {userLocation[0].toFixed(4)}
            <br />
            Lng: {userLocation[1].toFixed(4)}
            <br />
            {manualMode ? (
              <span className="text-info">
                <i className="bi bi-pin-map me-1"></i>
                Manual Test Location
              </span>
            ) : locationError ? (
              <span className="text-warning">
                <i className="bi bi-exclamation-triangle me-1"></i>
                Using default location
              </span>
            ) : (
              <span className="text-success">
                <i className="bi bi-check-circle me-1"></i>
                GPS Active
              </span>
            )}
          </Popup>
        </Marker>
        
        {/* Crime Zones from API */}
        {crimeZones.map(zone => {
          const colors = getRiskColor(zone.risk_level);
          return (
            <Circle
              key={zone.id}
              center={[zone.latitude, zone.longitude]}
              radius={zone.radius}
              pathOptions={{
                color: colors.color,
                fillColor: colors.fillColor,
                fillOpacity: 0.3,
                weight: 2
              }}
            >
              <Popup>
                <strong>{zone.name}</strong>
                <br />
                Risk Level: <span style={{ color: colors.color, fontWeight: 'bold' }}>
                  {zone.risk_level}
                </span>
              </Popup>
            </Circle>
          );
        })}
      </MapContainer>
    </div>
  );
}

export default LiveMapComponent;
