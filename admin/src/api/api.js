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
      const key = prompt('Admin kalitni kiriting:');
      if (key) {
        localStorage.setItem('admin_api_key', key);
        err.config.headers['X-Admin-Key'] = key;
        return api.request(err.config);
      }
    }
    return Promise.reject(err);
  }
);

export default api;
