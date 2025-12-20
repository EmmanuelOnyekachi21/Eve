import { getAccessToken } from './authService';
import { MOCK_CRIME_ZONES, MOCK_HEATMAP_DATA, MOCK_PREDICTION } from './mockData';

const BASE_URL = 'http://localhost:8000/api/v1';
const USE_MOCK = true; // Set to true for demo/hosting without backend

/**
 * Get headers with authentication token
 * @returns {object} Headers object
 */
const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };

  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Fetch all crime zones from the backend
 * @returns {Promise<Array>} Array of crime zone objects
 */
export const fetchCrimeZones = async () => {
  try {
    if (USE_MOCK) return MOCK_CRIME_ZONES;

    const response = await fetch(`${BASE_URL}/safety/zones/`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching crime zones:', error);
    throw error;
  }
};

/**
 * Fetch nearby crime zones based on location
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} radius - Search radius in meters (default: 5000)
 * @returns {Promise<Array>} Array of nearby crime zone objects
 */
export const fetchNearbyZones = async (lat, lon, radius = 5000) => {
  try {
    if (USE_MOCK) return MOCK_CRIME_ZONES;

    const response = await fetch(
      `${BASE_URL}/safety/zones/nearby/?lat=${lat}&lon=${lon}&radius=${radius}`,
      {
        method: 'GET',
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching nearby zones:', error);
    throw error;
  }
};

/**
 * Send location data to backend for tracking
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} speed - Speed in km/h
 * @param {number} battery - Battery percentage (optional)
 * @returns {Promise<object>} Response from server
 */
export const sendLocation = async (lat, lon, speed, battery = 100) => {
  try {
    if (USE_MOCK) return { status: 'success', message: 'Location updated' };

    const response = await fetch(`${BASE_URL}/safety/location/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        latitude: lat,
        longitude: lon,
        speed: speed,
        battery_level: battery,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending location:', error);
    throw error;
  }
};

/**
 * Calculate risk based on current location and speed
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} speed - Speed in km/h
 * @returns {Promise<object>} Risk calculation result
 */
export const calculateRisk = async (lat, lon, speed) => {
  try {
    if (USE_MOCK) return { risk_level: 30, message: 'Low risk area' };

    const response = await fetch(`${BASE_URL}/safety/risk/calculate/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        latitude: lat,
        longitude: lon,
        speed: speed,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calculating risk:', error);
    throw error;
  }
};

/**
 * Get AI prediction for specific location and time
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} hour - Hour of day (0-23)
 * @param {number} dayOfWeek - Day of week (0-6, 0=Monday)
 * @returns {Promise<object>} Prediction result
 */
export const getPrediction = async (lat, lon, hour, dayOfWeek) => {
  try {
    if (USE_MOCK) return MOCK_PREDICTION;

    const response = await fetch(`${BASE_URL}/safety/predict/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        latitude: lat,
        longitude: lon,
        hour: hour,
        day_of_week: dayOfWeek,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting prediction:', error);
    throw error;
  }
};

/**
 * Get heatmap data for predictions
 * @param {number} centerLat - Center latitude
 * @param {number} centerLon - Center longitude
 * @returns {Promise<Array>} Array of heatmap points
 */
export const getHeatmap = async (centerLat = 5.125086, centerLon = 7.356695) => {
  try {
    if (USE_MOCK) return MOCK_HEATMAP_DATA;

    const response = await fetch(
      `${BASE_URL}/safety/heatmap/?lat=${centerLat}&lon=${centerLon}`,
      {
        method: 'GET',
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching heatmap:', error);
    throw error;
  }
};

/**
 * Get risk color based on risk level
 * @param {number} riskLevel - Risk level (0-100)
 * @returns {object} Object with color and fillColor
 */
export const getRiskColor = (riskLevel) => {
  if (riskLevel <= 40) {
    return {
      color: '#10b981',
      fillColor: 'rgba(16, 185, 129, 0.3)',
    };
  } else if (riskLevel <= 70) {
    return {
      color: '#f59e0b',
      fillColor: 'rgba(245, 158, 11, 0.3)',
    };
  } else {
    return {
      color: '#ef4444',
      fillColor: 'rgba(239, 68, 68, 0.3)',
    };
  }
};

/**
 * Get heatmap color based on risk percentage
 * @param {number} riskPercentage - Risk percentage (0-100)
 * @returns {object} Object with color and fillColor
 */
export const getHeatmapColor = (riskPercentage) => {
  if (riskPercentage <= 30) {
    return {
      color: '#10b981',
      fillColor: `rgba(16, 185, 129, ${0.3 + (riskPercentage / 30) * 0.4})`,
    };
  } else if (riskPercentage <= 60) {
    return {
      color: '#f59e0b',
      fillColor: `rgba(245, 158, 11, ${0.3 + ((riskPercentage - 30) / 30) * 0.4})`,
    };
  } else {
    return {
      color: '#ef4444',
      fillColor: `rgba(239, 68, 68, ${0.3 + ((riskPercentage - 60) / 40) * 0.4})`,
    };
  }
};

/**
 * Report an incident to help train the AI model
 * @param {object} incidentData - Incident details
 * @param {string} incidentData.incident_type - Type of incident (Robbery, Assault, etc.)
 * @param {number} incidentData.latitude - Latitude where incident occurred
 * @param {number} incidentData.longitude - Longitude where incident occurred
 * @param {string} incidentData.occurred_at - ISO timestamp (optional)
 * @param {number} incidentData.severity - Severity 1-10 (optional)
 * @param {string} incidentData.description - Description (optional)
 * @param {boolean} incidentData.anonymous - Submit anonymously (optional)
 * @returns {Promise<object>} Response from server
 */
export const reportIncident = async (incidentData) => {
  try {
    if (USE_MOCK) return { id: 123, status: 'submitted', message: 'Incident reported successfully' };

    const response = await fetch(`${BASE_URL}/safety/report-incident/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(incidentData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error reporting incident:', error);
    throw error;
  }
};

/**
 * Analyze audio for crisis detection
 * @param {Blob} audioBlob - Audio file blob
 * @returns {Promise<object>} Analysis result with crisis detection
 */
export const analyzeAudio = async (audioBlob) => {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');

    const token = getAccessToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (USE_MOCK) return { is_crisis: false, confidence: 0.1, message: 'No crisis detected in audio' };

    const response = await fetch(`${BASE_URL}/safety/audio/analyze/`, {
      method: 'POST',
      headers: headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error analyzing audio:', error);
    throw error;
  }
};
