import api from './index';

export const vendorsApi = {
  list: (eventId, params) => api.get(`/events/${eventId}/vendors`, { params }),
  get: (eventId, id) => api.get(`/events/${eventId}/vendors/${id}`),
  create: (eventId, body) => api.post(`/events/${eventId}/vendors`, body),
  update: (eventId, id, body) => api.patch(`/events/${eventId}/vendors/${id}`, body),
  updateStatus: (eventId, id, body) => api.patch(`/events/${eventId}/vendors/${id}/status`, body),
  delete: (eventId, id) => api.delete(`/events/${eventId}/vendors/${id}`),
};
