import api from './index';

export const suggestionsApi = {
  list: (eventId) => api.get(`/events/${eventId}/suggestions`),
  accept: (eventId, id) => api.post(`/events/${eventId}/suggestions/${id}/accept`),
  dismiss: (eventId, id) => api.post(`/events/${eventId}/suggestions/${id}/dismiss`),
};
