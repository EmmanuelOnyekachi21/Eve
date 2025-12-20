import { getAccessToken, handle401Error } from './authService';

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
 * Get current user's profile
 */
export const getUserProfile = async () => {
  try {
    const response = await fetch(`${BASE_URL}/users/profile/`, {
      method: 'GET',
      headers: getHeaders(),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

/**
 * Update current user's profile
 */
export const updateUserProfile = async (profileData) => {
  try {
    const response = await fetch(`${BASE_URL}/users/profile/`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData));
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Get emergency contacts for current user
 */
export const getEmergencyContacts = async () => {
  try {
    const response = await fetch(`${BASE_URL}/users/emergency-contacts/`, {
      method: 'GET',
      headers: getHeaders(),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching emergency contacts:', error);
    throw error;
  }
};

/**
 * Add emergency contact
 */
export const addEmergencyContact = async (contactData) => {
  try {
    const response = await fetch(`${BASE_URL}/users/emergency-contacts/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(contactData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData));
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error adding emergency contact:', error);
    throw error;
  }
};

/**
 * Update emergency contact
 */
export const updateEmergencyContact = async (contactId, contactData) => {
  try {
    const response = await fetch(`${BASE_URL}/users/emergency-contacts/${contactId}/`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(contactData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData));
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating emergency contact:', error);
    throw error;
  }
};

/**
 * Delete emergency contact
 */
export const deleteEmergencyContact = async (contactId) => {
  try {
    const response = await fetch(`${BASE_URL}/users/emergency-contacts/${contactId}/`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Error deleting emergency contact:', error);
    throw error;
  }
};
