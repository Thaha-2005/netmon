import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 130000, // Long timeout for nmap scans
});

// Response interceptor for consistent error handling
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message =
      err.response?.data?.error ||
      err.message ||
      'An unexpected error occurred.';
    return Promise.reject(new Error(message));
  }
);

export const deviceApi = {
  /**
   * Trigger network discovery scan.
   */
  discover: (ipRange) =>
    api.post('/discover', { ipRange }),

  /**
   * Get all stored devices.
   */
  getDevices: () =>
    api.get('/devices'),

  /**
   * Ping a device by IP.
   */
  ping: (ip) =>
    api.get(`/ping/${ip}`),

  /**
   * Port scan a device by IP.
   */
  scan: (ip) =>
    api.get(`/scan/${ip}`),

  /**
   * Delete a device from the database.
   */
  deleteDevice: (ip) =>
    api.delete(`/devices/${ip}`),

  /**
   * Get device history.
   */
  getHistory: (ip) =>
    api.get(`/devices/${ip}/history`),

  /**
   * Trigger CSV export (returns URL).
   */
  exportCsvUrl: () => '/api/export/csv',
};

export default api;
