export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
export const SERVER_URL = API_BASE_URL.replace(/\/api\/?$/, '')

console.log("VITE_API_URL =", import.meta.env.VITE_API_URL)
console.log("API_BASE_URL =", API_BASE_URL) 


import { getAuthToken } from './authStorage'

const handleApiError = async (response) => {
  if (!response) {
    throw new Error('Unable to connect to the server. Please check your internet connection or try again later.');
  }
  
  try {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || data?.message || 'An error occurred while processing your request.');
    }
    return data;
  } catch (error) {
    if (error.name === 'SyntaxError') {
      throw new Error('The server is currently unavailable. Please try again later.');
    }
    throw error;
  }
};

export const fetchWithErrorHandling = async (url, options = {}) => {
  try {
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    const response = await fetch(fullUrl, options);
    return await handleApiError(response);
  } catch (error) {
    if (!error.response && !window.navigator.onLine) {
      throw new Error('Please check your internet connection and try again.');
    }
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Unable to connect to the server. Please ensure the backend service is running.');
    }
    throw error;
  }
};

// API helper object for making requests
const api = {
  get: async (endpoint, options = {}) => {
    const token = getAuthToken()
    return fetchWithErrorHandling(endpoint, {
      ...options,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });
  },

  post: async (endpoint, data, options = {}) => {
    const token = getAuthToken()
    return fetchWithErrorHandling(endpoint, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      body: JSON.stringify(data),
    });
  },

  put: async (endpoint, data, options = {}) => {
    const token = getAuthToken()
    return fetchWithErrorHandling(endpoint, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      body: JSON.stringify(data),
    });
  },

  delete: async (endpoint, options = {}) => {
    const token = getAuthToken()
    return fetchWithErrorHandling(endpoint, {
      ...options,
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });
  },
};

export default api;