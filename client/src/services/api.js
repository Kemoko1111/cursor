import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any auth tokens here if needed
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors here
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.warn('Unauthorized access');
    } else if (error.response?.status >= 500) {
      // Handle server errors
      console.error('Server error:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

// API service methods
export const apiService = {
  // Health check
  health: () => api.get('/health'),

  // QR Code services
  qr: {
    scan: (qrId) => api.get(`/qr/scan/${qrId}`),
    logService: (data) => api.post('/qr/log-service', data),
    generateStation: (data) => api.post('/qr/generate-station', data),
    generateSticker: (data) => api.post('/qr/generate-sticker', data),
  },

  // Customer services
  customers: {
    getAll: (params) => api.get('/customers', { params }),
    getById: (id) => api.get(`/customers/${id}`),
    getByPhone: (phone) => api.get(`/customers/phone/${phone}`),
    create: (data) => api.post('/customers', data),
    update: (id, data) => api.put(`/customers/${id}`, data),
    delete: (id) => api.delete(`/customers/${id}`),
    getStats: (id) => api.get(`/customers/${id}/stats`),
  },

  // Mechanic services
  mechanics: {
    getAll: () => api.get('/mechanics'),
    getById: (id) => api.get(`/mechanics/${id}`),
    create: (data) => api.post('/mechanics', data),
    update: (id, data) => api.put(`/mechanics/${id}`, data),
    delete: (id) => api.delete(`/mechanics/${id}`),
    getStats: (id) => api.get(`/mechanics/${id}/stats`),
    getQRCodes: (id) => api.get(`/mechanics/${id}/qr-codes`),
  },

  // Service services
  services: {
    getAll: (params) => api.get('/services', { params }),
    getById: (id) => api.get(`/services/${id}`),
    getByCustomerPhone: (phone) => api.get(`/services/customer/${phone}`),
    update: (id, data) => api.put(`/services/${id}`, data),
    delete: (id) => api.delete(`/services/${id}`),
    getOverdue: () => api.get('/services/status/overdue'),
    getUpcoming: () => api.get('/services/status/upcoming'),
  },

  // Statistics services
  stats: {
    dashboard: () => api.get('/stats/dashboard'),
    revenue: (params) => api.get('/stats/revenue', { params }),
    serviceTypes: () => api.get('/stats/service-types'),
    topCustomers: (params) => api.get('/stats/top-customers', { params }),
    mechanicsPerformance: () => api.get('/stats/mechanics-performance'),
    trends: () => api.get('/stats/trends'),
    reminders: () => api.get('/stats/reminders'),
    export: (type, params) => api.get(`/stats/export/${type}`, { params }),
  },
};

// Export the api instance as default for direct use
export { api };
export default api;