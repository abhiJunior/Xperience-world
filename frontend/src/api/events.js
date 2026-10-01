import api from './index';

export const eventsApi = {
  list: (params) => api.get('/events', { params }),
  get: (id) => api.get(`/events/${id}`),
  create: (body) => api.post('/events', body),
  update: (id, body) => api.patch(`/events/${id}`, body),
  delete: (id) => api.delete(`/events/${id}`),
  dashboard: (id) => api.get(`/events/${id}/dashboard`),
  readiness: (id) => api.get(`/events/${id}/readiness`),
  impact: (id, body) => api.post(`/events/${id}/impact`, body),
};
