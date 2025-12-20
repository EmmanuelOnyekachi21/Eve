import { getAccessToken, handle401Error } from './authService';

const BASE_URL = 'http://localhost:8000/api/v1/safety';

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
 * Handle fetch response and check for 401
 */
const handleResponse = async (response) => {
  if (response.status === 401) {
    handle401Error();
    throw new Error('Session expired');
  }
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
};

/**
 * Get active alerts for current user
 */
export const getActiveAlerts = async () => {
  try {
    const response = await fetch(`${BASE_URL}/alerts/active/`, {
      method: 'GET',
      headers: getHeaders(),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching active alerts:', error);
    throw error;
  }
};

/**
 * Get alert history
 */
export const getAlertHistory = async (limit = 20, statusFilter = null) => {
  try {
    let url = `${BASE_URL}/alerts/history/?limit=${limit}`;
    if (statusFilter) {
      url += `&status=${statusFilter}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching alert history:', error);
    throw error;
  }
};

/**
 * Confirm user is safe
 */
export const confirmSafe = async (alertId = null, context = '', latitude = null, longitude = null) => {
  try {
    const response = await fetch(`${BASE_URL}/alerts/confirm/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        is_safe: true,
        alert_id: alertId,
        context: context,
        latitude: latitude,
        longitude: longitude,
      }),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error confirming safe:', error);
    throw error;
  }
};

/**
 * Trigger emergency SOS
 */
export const triggerEmergency = async (context = '', latitude = null, longitude = null) => {
  try {
    const response = await fetch(`${BASE_URL}/alerts/confirm/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        is_safe: false,
        context: context,
        latitude: latitude,
        longitude: longitude,
      }),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error triggering emergency:', error);
    throw error;
  }
};

/**
 * Poll for active alerts (for real-time checking)
 */
export const startAlertPolling = (callback, interval = 30000) => {
  const pollAlerts = async () => {
    try {
      const data = await getActiveAlerts();
      callback(data);
    } catch (error) {
      console.error('Error polling alerts:', error);
    }
  };

  // Initial call
  pollAlerts();

  // Set up interval
  const intervalId = setInterval(pollAlerts, interval);

  // Return cleanup function
  return () => clearInterval(intervalId);
};
