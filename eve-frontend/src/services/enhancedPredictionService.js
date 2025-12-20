import { getAccessToken } from './authService';

const BASE_URL = 'http://localhost:8000/api/v1';

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
 * Get safe route suggestions between two points
 * @param {number} startLat - Start latitude
 * @param {number} startLon - Start longitude
 * @param {number} endLat - End latitude
 * @param {number} endLon - End longitude
 * @param {string} departureTime - Optional departure time (ISO format)
 * @returns {Promise<object>} Route analysis with safety recommendations
 */
export const getSafeRoute = async (startLat, startLon, endLat, endLon, departureTime = null) => {
  try {
    const body = {
      start_lat: startLat,
      start_lon: startLon,
      end_lat: endLat,
      end_lon: endLon,
    };
    
    if (departureTime) {
      body.departure_time = departureTime;
    }
    
    const response = await fetch(`${BASE_URL}/safety/suggest-route/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting safe route:', error);
    throw error;
  }
};

/**
 * Find nearby safe zones for emergency escape
 * @param {number} lat - Current latitude
 * @param {number} lon - Current longitude
 * @param {number} radius - Search radius in meters (default: 500)
 * @returns {Promise<object>} Nearby safe zones with directions
 */
export const getNearbySafeZones = async (lat, lon, radius = 500) => {
  try {
    const response = await fetch(
      `${BASE_URL}/safety/safe-zones-nearby/?lat=${lat}&lon=${lon}&radius=${radius}`,
      {
        method: 'GET',
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting nearby safe zones:', error);
    throw error;
  }
};

/**
 * Get prediction confidence map for an area
 * @param {number} lat - Center latitude
 * @param {number} lon - Center longitude
 * @returns {Promise<object>} Confidence levels by direction
 */
export const getConfidenceMap = async (lat, lon) => {
  try {
    const response = await fetch(
      `${BASE_URL}/safety/confidence-map/?lat=${lat}&lon=${lon}`,
      {
        method: 'GET',
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting confidence map:', error);
    throw error;
  }
};

/**
 * Get color for confidence level
 * @param {string} confidence - Confidence level (Very High, High, Medium, Low)
 * @returns {string} Color hex code
 */
export const getConfidenceColor = (confidence) => {
  const colors = {
    'Very High': '#10b981',
    'High': '#3b82f6',
    'Medium': '#f59e0b',
    'Low': '#ef4444',
  };
  return colors[confidence] || '#6b7280';
};

/**
 * Get icon for confidence level
 * @param {string} confidence - Confidence level
 * @returns {string} Emoji icon
 */
export const getConfidenceIcon = (confidence) => {
  const icons = {
    'Very High': '✅',
    'High': '👍',
    'Medium': '⚠️',
    'Low': '❓',
  };
  return icons[confidence] || '❓';
};

/**
 * Format distance for display
 * @param {number} meters - Distance in meters
 * @returns {string} Formatted distance string
 */
export const formatDistance = (meters) => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  } else {
    return `${(meters / 1000).toFixed(1)}km`;
  }
};

/**
 * Get direction arrow for bearing
 * @param {string} direction - Direction name (North, Northeast, etc.)
 * @returns {string} Arrow emoji
 */
export const getDirectionArrow = (direction) => {
  const arrows = {
    'North': '⬆️',
    'Northeast': '↗️',
    'East': '➡️',
    'Southeast': '↘️',
    'South': '⬇️',
    'Southwest': '↙️',
    'West': '⬅️',
    'Northwest': '↖️',
  };
  return arrows[direction] || '📍';
};

/**
 * Get safety score color
 * @param {number} score - Safety score (0-100)
 * @returns {string} Color hex code
 */
export const getSafetyScoreColor = (score) => {
  if (score >= 70) return '#10b981'; // Green
  if (score >= 50) return '#3b82f6'; // Blue
  if (score >= 30) return '#f59e0b'; // Orange
  return '#ef4444'; // Red
};

/**
 * Get safety score label
 * @param {number} score - Safety score (0-100)
 * @returns {string} Label text
 */
export const getSafetyScoreLabel = (score) => {
  if (score >= 70) return 'Very Safe';
  if (score >= 50) return 'Safe';
  if (score >= 30) return 'Moderate';
  return 'Unsafe';
};
