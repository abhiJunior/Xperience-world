import api from './index';

export const tasksApi = {
  list: (eventId, params) => api.get(`/events/${eventId}/tasks`, { params }),
  get: (eventId, id) => api.get(`/events/${eventId}/tasks/${id}`),
  create: (eventId, body) => api.post(`/events/${eventId}/tasks`, body),
  update: (eventId, id, body) => api.patch(`/events/${eventId}/tasks/${id}`, body),
  delete: (eventId, id) => api.delete(`/events/${eventId}/tasks/${id}`),
  bulkUpdateStatus: (eventId, body) => api.patch(`/events/${eventId}/tasks/bulk-status`, body),
};
