import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:5006/api'; // ✅ Fixed to port 5006

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

console.log('🔵 API_URL:', API_URL); // ✅ ADDED

// Request interceptor - Add token
api.interceptors.request.use(
  (config) => {
    console.log('🟡 Request interceptor:', config.method.toUpperCase(), config.url); // ✅ ADDED
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => {
    console.log('🟢 Response interceptor:', response.status, response.config.url); // ✅ ADDED
    return response;
  },
  (error) => {
    console.error('🔴 Response error:', error); // ✅ ADDED
    const { response } = error;
    
    if (response) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        toast.error('Session expired. Please login again.');
      } else if (response.status === 403) {
        toast.error('You do not have permission to perform this action');
      } else if (response.status === 404) {
        toast.error('Resource not found');
      } else if (response.status === 400) {
        const message = response.data?.message || 'Validation error';
        toast.error(message);
      } else if (response.status >= 500) {
        toast.error('Server error. Please try again later.');
      } else {
        const message = response.data?.message || 'An error occurred';
        toast.error(message);
      }
    } else {
      toast.error('Network error. Please check your connection.');
    }
    
    return Promise.reject(error);
  }
);

export default api;