import axios from 'axios';

const api = axios.create();

api.interceptors.request.use((config) => {
  const key = localStorage.getItem('admin_api_key') || '';
  if (key) {
    config.headers['X-Admin-Key'] = key;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('admin_api_key');
      window.location.href = '/admin';
    }
    return Promise.reject(err);
  }
);

export default api;
