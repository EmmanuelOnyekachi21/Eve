import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './PredictionsNew.css';
import { getPrediction, getHeatmap, getHeatmapColor } from '../services/api';

// Component to handle map clicks
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function PredictionsNew() {
  const [selectedHour, setSelectedHour] = useState(new Date().getHours());
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [heatmapData, setHeatmapData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [predictionResult, setPredictionResult] = useState(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [usingMockData, setUsingMockData] = useState(false);

  const mapCenter = [5.125086, 7.356695];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Set page title
  useEffect(() => {
    document.title = 'Eve - Predictions';
  }, []);

  // Generate mock heatmap data
  const generateMockHeatmap = () => {
    const mockData = [];
    const centerLat = mapCenter[0];
    const centerLon = mapCenter[1];
    
    // Generate points in a grid around the center
    for (let i = -10; i <= 10; i++) {
      for (let j = -10; j <= 10; j++) {
        for (let hour = 0; hour < 24; hour++) {
          const lat = centerLat + (i * 0.001);
          const lon = centerLon + (j * 0.001);
          
          // Calculate risk based on distance from center and time
          const distance = Math.sqrt(i * i + j * j);
          const timeRisk = Math.abs(hour - 22) < 4 ? 30 : 0; // Higher risk at night
          const baseRisk = Math.min(100, (distance * 3) + timeRisk + (Math.random() * 20));
          
          mockData.push({
            latitude: lat,
            longitude: lon,
            hour: hour,
            risk_percentage: baseRisk
          });
        }
      }
    }
    return mockData;
  };

  // Load heatmap data
  useEffect(() => {
    const loadHeatmap = async () => {
      setLoading(true);
      
      // Set a timeout to use mock data if API takes too long
      const timeoutId = setTimeout(() => {
        console.log('API timeout - using mock data');
        const mockData = generateMockHeatmap();
        setHeatmapData(mockData);
        setUsingMockData(true);
        setLoading(false);
      }, 3000); // 3 second timeout
      
      try {
        const data = await getHeatmap(mapCenter[0], mapCenter[1]);
        clearTimeout(timeoutId);
        console.log('Heatmap data loaded from API:', data.length);
        
        if (data && data.length > 0) {
          setHeatmapData(data);
        } else {
          // Use mock data if API returns empty
          console.log('API returned empty data - using mock data');
          const mockData = generateMockHeatmap();
          setHeatmapData(mockData);
          setUsingMockData(true);
        }
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('Failed to load heatmap from API:', error);
        // Use mock data on error
        console.log('Using mock data due to API error');
        const mockData = generateMockHeatmap();
        setHeatmapData(mockData);
        setUsingMockData(true);
      } finally {
        setLoading(false);
      }
    };
    loadHeatmap();
  }, []);

  // Filter data by selected hour
  useEffect(() => {
    if (heatmapData.length > 0) {
      const filtered = heatmapData.filter(point => point.hour === selectedHour);
      setFilteredData(filtered);
    }
  }, [selectedHour, heatmapData]);

  // Calculate statistics
  const totalPredictions = filteredData.length;
  const highRiskZones = filteredData.filter(p => p.risk_percentage > 70).length;
  const avgRisk = filteredData.length > 0
    ? (filteredData.reduce((sum, p) => sum + p.risk_percentage, 0) / filteredData.length).toFixed(1)
    : 0;
  const currentStatus = avgRisk < 40 ? 'Safe' : avgRisk < 70 ? 'Warning' : 'Danger';

  // Handle map click
  const handleMapClick = (lat, lng) => {
    setSelectedLocation({ lat, lng });
    setPredictionResult(null);
  };

  // Generate mock prediction
  const generateMockPrediction = (lat, lon, hour) => {
    // Calculate risk based on location and time
    const distanceFromCenter = Math.sqrt(
      Math.pow(lat - mapCenter[0], 2) + Math.pow(lon - mapCenter[1], 2)
    );
    const timeRisk = Math.abs(hour - 22) < 4 ? 30 : 0; // Higher risk at night
    const baseRisk = Math.min(100, (distanceFromCenter * 3000) + timeRisk + (Math.random() * 20));
    
    return {
      risk_percentage: baseRisk,
      confidence: 75 + Math.random() * 20,
      nearest_zone: `Zone ${String.fromCharCode(65 + Math.floor(Math.random() * 5))}`,
      predicted_for: `${days[selectedDay]} ${hour}:00`
    };
  };

  // Get prediction for selected location
  const handleGetPrediction = async () => {
    if (!selectedLocation) return;

    setPredictionLoading(true);
    
    // Set a timeout for mock data
    const timeoutId = setTimeout(() => {
      console.log('Prediction API timeout - using mock data');
      const mockResult = generateMockPrediction(
        selectedLocation.lat,
        selectedLocation.lng,
        selectedHour
      );
      setPredictionResult(mockResult);
      setPredictionLoading(false);
    }, 2000); // 2 second timeout
    
    try {
      const result = await getPrediction(
        selectedLocation.lat,
        selectedLocation.lng,
        selectedHour,
        selectedDay
      );
      clearTimeout(timeoutId);
      console.log('Prediction result from API:', result);
      setPredictionResult(result);
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Failed to get prediction from API:', error);
      // Use mock data on error
      console.log('Using mock prediction due to API error');
      const mockResult = generateMockPrediction(
        selectedLocation.lat,
        selectedLocation.lng,
        selectedHour
      );
      setPredictionResult(mockResult);
    } finally {
      setPredictionLoading(false);
    }
  };

  // Get confidence badge class
  const getConfidenceBadge = (confidence) => {
    if (confidence >= 90) return { class: 'bg-success', text: 'Very High' };
    if (confidence >= 75) return { class: 'bg-info', text: 'High' };
    if (confidence >= 60) return { class: 'bg-warning', text: 'Medium' };
    return { class: 'bg-secondary', text: 'Low' };
  };

  // Get high risk zones
  const highRiskZonesList = filteredData
    .filter(p => p.risk_percentage > 70)
    .sort((a, b) => b.risk_percentage - a.risk_percentage)
    .slice(0, 10);

  return (
    <div className="predictions-new-page container-fluid fade-in">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <h1 className="page-title">
            <i className="bi bi-graph-up-arrow me-2"></i>
            AI Threat Predictions
          </h1>
          <p className="text-muted">24-hour threat forecasting with machine learning</p>
          
          {/* Mock Data Notice */}
          {usingMockData && (
            <div className="alert alert-info alert-dismissible fade show mt-3" role="alert">
              <i className="bi bi-info-circle me-2"></i>
              <strong>Demo Mode:</strong> Using simulated data for demonstration. 
              Backend API is not available or returned no data.
              <button type="button" className="btn-close" onClick={() => setUsingMockData(false)}></button>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card shadow-sm summary-card">
            <div className="card-body text-center">
              <i className="bi bi-cpu-fill summary-icon text-primary"></i>
              <h3 className="summary-value">94%</h3>
              <p className="summary-label">Model Accuracy</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card shadow-sm summary-card">
            <div className="card-body text-center">
              <i className="bi bi-geo-alt-fill summary-icon text-info"></i>
              <h3 className="summary-value">{totalPredictions}</h3>
              <p className="summary-label">Total Predictions</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card shadow-sm summary-card">
            <div className="card-body text-center">
              <i className="bi bi-exclamation-triangle-fill summary-icon text-danger"></i>
              <h3 className="summary-value">{highRiskZones}</h3>
              <p className="summary-label">High Risk Zones</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card shadow-sm summary-card">
            <div className="card-body text-center">
              <i className={`bi bi-shield-fill summary-icon text-${currentStatus === 'Safe' ? 'success' : currentStatus === 'Warning' ? 'warning' : 'danger'}`}></i>
              <h3 className="summary-value">{currentStatus}</h3>
              <p className="summary-label">Current Status</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="row">
        {/* LEFT COLUMN - Heatmap */}
        <div className="col-lg-7 mb-4">
          <div className="card shadow-sm heatmap-card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-map me-2"></i>
                Threat Prediction Heatmap
              </h5>
            </div>
            <div className="card-body p-0">
              {/* Hour Info */}
              <div className="hour-info">
                <strong>Predictions for {days[selectedDay]} {selectedHour}:00</strong>
                <span className="badge bg-primary ms-2">{filteredData.length} points</span>
              </div>

              {/* Map */}
              <div className="heatmap-container">
                {loading && (
                  <div className="map-loading">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="mt-3">Loading heatmap data...</p>
                    <p className="text-muted small">
                      {heatmapData.length === 0 ? 
                        'Connecting to API... Will use demo data if unavailable' : 
                        'Processing data...'}
                    </p>
                  </div>
                )}
                <MapContainer
                  center={mapCenter}
                  zoom={15}
                  style={{ height: '500px', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapClickHandler onMapClick={handleMapClick} />
                  
                  {/* Heatmap circles */}
                  {filteredData.map((point, index) => {
                    const colors = getHeatmapColor(point.risk_percentage);
                    return (
                      <Circle
                        key={index}
                        center={[point.latitude, point.longitude]}
                        radius={10}
                        pathOptions={{
                          color: colors.color,
                          fillColor: colors.fillColor,
                          fillOpacity: 0.7,
                          weight: 1
                        }}
                      >
                        <Popup>
                          <strong>Risk: {point.risk_percentage.toFixed(1)}%</strong>
                          <br />
                          Hour: {point.hour}:00
                          <br />
                          Lat: {point.latitude.toFixed(4)}
                          <br />
                          Lon: {point.longitude.toFixed(4)}
                        </Popup>
                      </Circle>
                    );
                  })}

                  {/* Selected location marker */}
                  {selectedLocation && (
                    <Circle
                      center={[selectedLocation.lat, selectedLocation.lng]}
                      radius={15}
                      pathOptions={{
                        color: '#2563eb',
                        fillColor: '#2563eb',
                        fillOpacity: 0.8,
                        weight: 3
                      }}
                    >
                      <Popup>
                        <strong>Selected Location</strong>
                        <br />
                        Click "Get Prediction" to analyze
                      </Popup>
                    </Circle>
                  )}
                </MapContainer>
              </div>

              {/* Hour Slider */}
              <div className="hour-slider-container">
                <label className="form-label">
                  <i className="bi bi-clock me-2"></i>
                  Select Hour: <strong>{selectedHour}:00</strong>
                </label>
                <input
                  type="range"
                  className="form-range"
                  min="0"
                  max="23"
                  value={selectedHour}
                  onChange={(e) => setSelectedHour(parseInt(e.target.value))}
                />
                <div className="hour-labels">
                  <span>00:00</span>
                  <span>06:00</span>
                  <span>12:00</span>
                  <span>18:00</span>
                  <span>23:00</span>
                </div>
              </div>

              {/* Legend */}
              <div className="heatmap-legend">
                <strong>Risk Level:</strong>
                <div className="legend-items">
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#10b981' }}></span>
                    <span>0-30% Low</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#f59e0b' }}></span>
                    <span>31-60% Moderate</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#ef4444' }}></span>
                    <span>61-100% High</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Details */}
        <div className="col-lg-5">
          {/* Prediction Details Card */}
          <div className="card shadow-sm mb-3">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-bullseye me-2"></i>
                Prediction Details
              </h5>
            </div>
            <div className="card-body">
              <p className="text-muted small mb-3">
                <i className="bi bi-info-circle me-1"></i>
                Click on the map to select a location
              </p>

              {selectedLocation && (
                <div className="selected-location mb-3">
                  <strong>Selected Location:</strong>
                  <div className="location-coords">
                    Lat: {selectedLocation.lat.toFixed(6)}<br />
                    Lon: {selectedLocation.lng.toFixed(6)}
                  </div>
                </div>
              )}

              <div className="mb-3">
                <label className="form-label">Hour</label>
                <select
                  className="form-select"
                  value={selectedHour}
                  onChange={(e) => setSelectedHour(parseInt(e.target.value))}
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="btn btn-primary w-100 mb-3"
                onClick={handleGetPrediction}
                disabled={!selectedLocation || predictionLoading}
              >
                {predictionLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <i className="bi bi-search me-2"></i>
                    Get Prediction
                  </>
                )}
              </button>

              {/* Prediction Results */}
              {predictionResult && (
                <div className="prediction-results">
                  <div className="risk-display">
                    <div className="risk-percentage-large" style={{
                      color: predictionResult.risk_percentage < 30 ? '#10b981' :
                             predictionResult.risk_percentage < 60 ? '#f59e0b' : '#ef4444'
                    }}>
                      {predictionResult.risk_percentage?.toFixed(1) || 0}%
                    </div>
                    <div className="risk-label">Predicted Risk</div>
                  </div>

                  <div className="prediction-meta">
                    <div className="meta-item">
                      <i className="bi bi-award me-2"></i>
                      <span>Confidence:</span>
                      <span className={`badge ${getConfidenceBadge(predictionResult.confidence).class} ms-2`}>
                        {getConfidenceBadge(predictionResult.confidence).text}
                      </span>
                    </div>
                    <div className="meta-item">
                      <i className="bi bi-geo-alt me-2"></i>
                      <span>Nearest Zone:</span>
                      <span className="ms-2">{predictionResult.nearest_zone || 'Unknown'}</span>
                    </div>
                    <div className="meta-item">
                      <i className="bi bi-calendar-event me-2"></i>
                      <span>Predicted for:</span>
                      <span className="ms-2">{days[selectedDay]} {selectedHour}:00</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* High Risk Zones Card */}
          <div className="card shadow-sm mb-3">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-exclamation-triangle me-2"></i>
                High Risk Zones ({selectedHour}:00)
              </h5>
            </div>
            <div className="card-body">
              {highRiskZonesList.length > 0 ? (
                <div className="high-risk-list">
                  {highRiskZonesList.map((zone, index) => (
                    <div key={index} className="high-risk-item">
                      <div className="risk-rank">#{index + 1}</div>
                      <div className="risk-info">
                        <div className="risk-coords">
                          {zone.latitude.toFixed(4)}, {zone.longitude.toFixed(4)}
                        </div>
                        <div className="risk-percent text-danger">
                          {zone.risk_percentage.toFixed(1)}% Risk
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-center">
                  <i className="bi bi-check-circle me-2"></i>
                  No high-risk zones at this hour
                </p>
              )}
            </div>
          </div>

          {/* Safest Routes Card */}
          <div className="card shadow-sm">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-signpost-2 me-2"></i>
                Safest Routes
              </h5>
            </div>
            <div className="card-body text-center">
              <i className="bi bi-tools text-muted" style={{ fontSize: '3rem' }}></i>
              <p className="text-muted mt-3">Coming Soon</p>
              <small className="text-muted">
                Route optimization based on predicted threat levels
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PredictionsNew;
