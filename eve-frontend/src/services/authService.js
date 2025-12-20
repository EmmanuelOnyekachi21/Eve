import { MOCK_USER } from './mockData';

const BASE_URL = 'http://localhost:8000/api/v1';
const USE_MOCK = true; // Set to true for demo/hosting without backend

/**
 * Authentication Service
 * Handles user registration, login, logout, and token management
 */

// Token management
export const getAccessToken = () => localStorage.getItem('accessToken');
export const getRefreshToken = () => localStorage.getItem('refreshToken');
export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const setTokens = (accessToken, refreshToken, user) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  localStorage.setItem('user', JSON.stringify(user));
};

export const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('profile_completed');
};

export const isAuthenticated = () => {
  return !!getAccessToken();
};

/**
 * Register a new user
 * @param {object} userData - User registration data
 * @returns {Promise<object>} Registration response
 */
export const register = async (userData) => {
  try {
    if (USE_MOCK) {
      console.log("Mock Register:", userData);
      await new Promise(r => setTimeout(r, 1000)); // Simulate delay
      return {
        message: "Registration successful",
        user: { ...MOCK_USER, ...userData }
      };
    }

    const response = await fetch(`${BASE_URL}/auth/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || JSON.stringify(data) || 'Registration failed');
    }

    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<object>} Login response with tokens
 */
export const login = async (email, password) => {
  try {
    if (USE_MOCK) {
      console.log("Mock Login:", email);
      await new Promise(r => setTimeout(r, 1000));
      const mockResponse = {
        access: "mock-access-token-" + Date.now(),
        refresh: "mock-refresh-token-" + Date.now(),
        user: MOCK_USER,
        profile_completed: true
      };

      // Store tokens and user data immediately for mock
      setTokens(mockResponse.access, mockResponse.refresh, mockResponse.user);
      if (mockResponse.profile_completed !== undefined) {
        localStorage.setItem('profile_completed', mockResponse.profile_completed);
      }
      return mockResponse;
    }

    const response = await fetch(`${BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Login failed');
    }

    // Store tokens and user data
    setTokens(data.access, data.refresh, data.user);

    // Store profile completion status
    if (data.profile_completed !== undefined) {
      localStorage.setItem('profile_completed', data.profile_completed);
    }

    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Logout user
 */
export const logout = () => {
  clearTokens();
};

/**
 * Refresh access token
 * @returns {Promise<string>} New access token
 */
export const refreshAccessToken = async () => {
  try {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    if (USE_MOCK) {
      return "mock-refreshed-access-token-" + Date.now();
    }

    const response = await fetch(`${BASE_URL}/auth/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh: refreshToken,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    // Update access token
    localStorage.setItem('accessToken', data.access);

    return data.access;
  } catch (error) {
    console.error('Token refresh error:', error);
    clearTokens();
    throw error;
  }
};

/**
 * Make authenticated API request with automatic token refresh
 * @param {string} url - API endpoint
 * @param {object} options - Fetch options
 * @returns {Promise<object>} Response data
 */
export const authenticatedFetch = async (url, options = {}) => {
  const accessToken = getAccessToken();

  if (!accessToken) {
    clearTokens();
    window.location.href = '/login';
    throw new Error('No access token available');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
    ...options.headers,
  };

  try {
    let response = await fetch(url, {
      ...options,
      headers,
    });

    // If token expired, try to refresh
    if (response.status === 401) {
      console.log('Token expired, attempting refresh...');
      try {
        const newAccessToken = await refreshAccessToken();
        headers.Authorization = `Bearer ${newAccessToken}`;

        // Retry the request with new token
        response = await fetch(url, {
          ...options,
          headers,
        });

        // If still 401, logout
        if (response.status === 401) {
          clearTokens();
          window.location.href = '/login';
          throw new Error('Session expired. Please login again.');
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        console.error('Token refresh failed:', refreshError);
        clearTokens();
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('Authenticated fetch error:', error);
    throw error;
  }
};

/**
 * Handle 401 errors globally
 * Call this when you get a 401 response
 */
export const handle401Error = () => {
  console.log('Handling 401 error - logging out');
  clearTokens();
  window.location.href = '/login';
};
