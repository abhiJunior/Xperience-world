import api from './index';

export const risksApi = {
  list: (eventId, params) => api.get(`/events/${eventId}/risks`, { params }),
  scan: (eventId) => api.post(`/events/${eventId}/risks/scan`),
  updateStatus: (eventId, id, body) => api.patch(`/events/${eventId}/risks/${id}/status`, body),
};
