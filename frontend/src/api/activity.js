import api from './index';

export const activityApi = {
  list: (eventId, params) => api.get(`/events/${eventId}/activity`, { params }),
};
