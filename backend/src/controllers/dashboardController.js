import * as readinessEngine from '../services/engine/readinessEngine.js';
import * as impactEngine from '../services/engine/impactEngine.js';
import * as riskEngine from '../services/engine/riskEngine.js';
import Event from '../models/Event.js';
import SubEvent from '../models/SubEvent.js';
import Task from '../models/Task.js';
import Vendor from '../models/Vendor.js';
import Risk from '../models/Risk.js';
import Suggestion from '../models/Suggestion.js';
import assertEventOwnership from '../utils/assertEventOwnership.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const getEventReadiness = asyncHandler(async (req, res) => {
  const readiness = await readinessEngine.calculateEventReadiness(req.user._id, req.params.eventId);
  sendSuccess(res, 200, readiness);
});

export const analyzeImpact = asyncHandler(async (req, res) => {
  const impact = await impactEngine.analyzeImpact(req.user._id, req.params.eventId, req.body);
  sendSuccess(res, 200, impact, 'Impact analysis completed');
});

export const getEventDashboard = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user._id;

  const event = await assertEventOwnership(eventId, userId);

  // Run risk scan to ensure fresh state
  await riskEngine.evaluateEventRisks(userId, eventId);

  // Parallel fetch of all dashboard elements
  const [readiness, subEvents, pendingTasks, topRisks, vendors, pendingSuggestions] = await Promise.all([
    readinessEngine.calculateEventReadiness(userId, eventId),
    SubEvent.find({ event: eventId }).sort({ date: 1, startTime: 1 }).limit(5).lean(),
    Task.find({ event: eventId, status: { $ne: 'done' } })
      .sort({ priority: 1, dueDate: 1 })
      .limit(10)
      .lean(),
    Risk.find({ event: eventId, status: 'open' })
      .sort({ severity: 1, createdAt: -1 })
      .limit(5)
      .lean(),
    Vendor.find({ event: eventId }).lean(),
    Suggestion.find({ event: eventId, status: 'pending' }).limit(5).lean(),
  ]);

  const dashboard = {
    event: {
      id: event._id,
      title: event.title,
      type: event.type,
      status: event.status,
      startDate: event.startDate,
      endDate: event.endDate,
      city: event.city,
      budget: event.budget,
    },
    readiness,
    subEvents,
    pendingTasks,
    topRisks,
    vendorSummary: {
      total: vendors.length,
      confirmed: vendors.filter((v) => v.status === 'confirmed').length,
      shortlisted: vendors.filter((v) => v.status === 'shortlisted').length,
      negotiating: vendors.filter((v) => v.status === 'negotiating').length,
      unavailable: vendors.filter((v) => v.status === 'unavailable' || v.status === 'cancelled').length,
    },
    pendingSuggestions,
  };

  sendSuccess(res, 200, dashboard, 'Dashboard data retrieved successfully');
});
