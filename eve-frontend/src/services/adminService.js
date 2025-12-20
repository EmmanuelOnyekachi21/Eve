import { getAccessToken } from './authService';

const BASE_URL = 'http://localhost:8000/api/v1';

/**
 * Get headers with authentication token
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
 * Get admin dashboard alerts
 * @param {boolean} criticalOnly - Only get critical alerts
 * @param {number} limit - Number of alerts to fetch
 * @returns {Promise<object>} Alerts data
 */
export const getAdminAlerts = async (criticalOnly = false, limit = 50) => {
  try {
    const url = `${BASE_URL}/safety/admin/alerts/dashboard/?critical_only=${criticalOnly}&limit=${limit}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching admin alerts:', error);
    throw error;
  }
};

/**
 * Get admin statistics
 * @returns {Promise<object>} Statistics data
 */
export const getAdminStatistics = async () => {
  try {
    const response = await fetch(`${BASE_URL}/safety/admin/alerts/statistics/`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching admin statistics:', error);
    throw error;
  }
};

/**
 * Get detailed alert information
 * @param {number} alertId - Alert ID
 * @returns {Promise<object>} Alert details
 */
export const getAlertDetails = async (alertId) => {
  try {
    const response = await fetch(`${BASE_URL}/safety/admin/alerts/${alertId}/`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching alert details:', error);
    throw error;
  }
};

/**
 * Resolve an alert
 * @param {number} alertId - Alert ID
 * @param {string} notes - Admin notes
 * @returns {Promise<object>} Response data
 */
export const resolveAlert = async (alertId, notes = '') => {
  try {
    const response = await fetch(`${BASE_URL}/safety/admin/alerts/${alertId}/resolve/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ notes }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error resolving alert:', error);
    throw error;
  }
};

/**
 * Mark alert as false alarm
 * @param {number} alertId - Alert ID
 * @param {string} notes - Admin notes
 * @returns {Promise<object>} Response data
 */
export const markFalseAlarm = async (alertId, notes = '') => {
  try {
    const response = await fetch(`${BASE_URL}/safety/admin/alerts/${alertId}/false-alarm/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ notes }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error marking false alarm:', error);
    throw error;
  }
};

/**
 * Manually check for expired alerts
 * @returns {Promise<object>} Response data
 */
export const checkExpiredAlerts = async () => {
  try {
    const response = await fetch(`${BASE_URL}/safety/admin/alerts/check-expired/`, {
      method: 'POST',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking expired alerts:', error);
    throw error;
  }
};
