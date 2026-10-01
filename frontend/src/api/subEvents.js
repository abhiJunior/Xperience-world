import api from './index';

export const subEventsApi = {
  list: (eventId, params) => api.get(`/events/${eventId}/sub-events`, { params }),
  get: (eventId, id) => api.get(`/events/${eventId}/sub-events/${id}`),
  create: (eventId, body) => api.post(`/events/${eventId}/sub-events`, body),
  update: (eventId, id, body) => api.patch(`/events/${eventId}/sub-events/${id}`, body),
  delete: (eventId, id) => api.delete(`/events/${eventId}/sub-events/${id}`),
};
