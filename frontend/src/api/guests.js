import api from './index';

export const guestsApi = {
  list: (eventId) => api.get(`/events/${eventId}/guest-groups`),
  get: (eventId, id) => api.get(`/events/${eventId}/guest-groups/${id}`),
  create: (eventId, body) => api.post(`/events/${eventId}/guest-groups`, body),
  update: (eventId, id, body) => api.patch(`/events/${eventId}/guest-groups/${id}`, body),
  delete: (eventId, id) => api.delete(`/events/${eventId}/guest-groups/${id}`),
};
