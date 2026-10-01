import api from './index';

export const chatApi = {
  sendMessage: (eventId, body) => api.post(`/events/${eventId}/chat`, body),
  getHistory: (eventId, params) => api.get(`/events/${eventId}/chat`, { params }),
  confirmAction: (eventId, actionId, body) =>
    api.post(`/events/${eventId}/chat/actions/${actionId}/confirm`, body),
  rejectAction: (eventId, actionId, body) =>
    api.post(`/events/${eventId}/chat/actions/${actionId}/reject`, body),
  whatIf: (eventId, body) => api.post(`/events/${eventId}/chat/what-if`, body),
};
