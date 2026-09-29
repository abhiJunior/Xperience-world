import crypto from 'crypto';
import Event from '../../models/Event.js';
import SubEvent from '../../models/SubEvent.js';
import Task from '../../models/Task.js';
import Vendor from '../../models/Vendor.js';
import GuestGroup from '../../models/GuestGroup.js';
import Requirement from '../../models/Requirement.js';
import Risk from '../../models/Risk.js';
import Suggestion from '../../models/Suggestion.js';
import logger from '../../utils/logger.js';
import assertEventOwnership from '../../utils/assertEventOwnership.js';

/**
 * Generates a deterministic SHA-256 fingerprint for a risk.
 * Prevents duplicates when scans run repeatedly.
 *
 * @param {string} eventId
 * @param {string} type
 * @param {string} key
 * @returns {string}
 */
const generateFingerprint = (eventId, type, key) => {
  return crypto
    .createHash('sha256')
    .update(`${eventId}:${type}:${key}`)
    .digest('hex');
};

/**
 * Evaluates all deterministic rule checks for an event and synchronizes the Risk collection.
 *
 * @param {string} userId
 * @param {string} eventId
 * @returns {Promise<{ detectedRisks: object[], resolvedCount: number, openCount: number }>}
 */
export const evaluateEventRisks = async (userId, eventId) => {
  const event = await assertEventOwnership(eventId, userId);

  // Load all event resources in parallel
  const [subEvents, tasks, vendors, guestGroups, requirements] = await Promise.all([
    SubEvent.find({ event: eventId }).lean(),
    Task.find({ event: eventId }).lean(),
    Vendor.find({ event: eventId }).lean(),
    GuestGroup.find({ event: eventId }).lean(),
    Requirement.find({ event: eventId }).lean(),
  ]);

  const detected = [];
  const now = new Date();
  const eventStartDate = new Date(event.startDate);
  const daysUntilEvent = Math.ceil((eventStartDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // ─── Rule 1: Capacity & Resource Deficits ─────────────────────────────────
  const totalGuests = guestGroups.reduce((sum, g) => sum + (g.count || 0), 0);
  const transportNeeded = guestGroups
    .filter((g) => g.needsTransport)
    .reduce((sum, g) => sum + (g.count || 0), 0);
  const accommodationNeeded = guestGroups
    .filter((g) => g.needsAccommodation)
    .reduce((sum, g) => sum + (g.count || 0), 0);

  // Check transport requirements
  const transportReqs = requirements.filter((r) => r.type === 'vehicle_capacity');
  const totalTransportProvided = transportReqs.reduce((sum, r) => sum + (r.provided || 0), 0);

  if (transportNeeded > 0 && totalTransportProvided < transportNeeded) {
    const deficit = transportNeeded - totalTransportProvided;
    const key = `transport_deficit_${transportNeeded}_${totalTransportProvided}`;
    detected.push({
      event: eventId,
      type: 'capacity_gap',
      severity: deficit > 50 || daysUntilEvent < 14 ? 'critical' : 'high',
      title: `Transport Capacity Deficit: ${deficit} guests unallocated`,
      explanation: `${transportNeeded} guests require transportation, but current vehicle capacity only covers ${totalTransportProvided}. Deficit is ${deficit} seats.`,
      affectedEntities: guestGroups
        .filter((g) => g.needsTransport)
        .map((g) => ({ kind: 'GuestGroup', id: g._id })),
      suggestedActions: [
        `Book additional transport vendors to cover ${deficit} seats`,
        'Update vehicle capacity in event requirements once booked',
      ],
      detectedBy: 'rule',
      fingerprint: generateFingerprint(eventId, 'capacity_gap', 'transport'),
    });
  }

  // Check accommodation requirements
  const roomReqs = requirements.filter((r) => r.type === 'room_capacity');
  const totalRoomsProvided = roomReqs.reduce((sum, r) => sum + (r.provided || 0), 0);

  if (accommodationNeeded > 0 && totalRoomsProvided < accommodationNeeded) {
    const deficit = accommodationNeeded - totalRoomsProvided;
    detected.push({
      event: eventId,
      type: 'capacity_gap',
      severity: daysUntilEvent < 14 ? 'critical' : 'high',
      title: `Accommodation Shortage: ${deficit} guests without rooms`,
      explanation: `${accommodationNeeded} guests require accommodation, but confirmed room capacity is ${totalRoomsProvided}.`,
      affectedEntities: guestGroups
        .filter((g) => g.needsAccommodation)
        .map((g) => ({ kind: 'GuestGroup', id: g._id })),
      suggestedActions: [
        `Secure additional hotel room blocks for ${deficit} guests`,
        'Confirm check-in dates with accommodation vendor',
      ],
      detectedBy: 'rule',
      fingerprint: generateFingerprint(eventId, 'capacity_gap', 'accommodation'),
    });
  }

  // ─── Rule 2: Missing Core Vendors ─────────────────────────────────────────
  const confirmedVendors = vendors.filter((v) => v.status === 'confirmed');
  const hasConfirmedVenue = confirmedVendors.some((v) => v.category === 'venue');
  const hasConfirmedCatering = confirmedVendors.some((v) => v.category === 'catering');

  if (!hasConfirmedVenue) {
    detected.push({
      event: eventId,
      type: 'missing_vendor',
      severity: daysUntilEvent < 30 ? 'critical' : 'high',
      title: 'No Confirmed Venue Vendor',
      explanation: `The event starts in ${daysUntilEvent} days, but no venue vendor has been marked as confirmed.`,
      affectedEntities: vendors.filter((v) => v.category === 'venue').map((v) => ({ kind: 'Vendor', id: v._id })),
      suggestedActions: [
        'Review shortlisted venue vendors and finalize contracts',
        'Confirm venue booking dates and deposit terms',
      ],
      detectedBy: 'rule',
      fingerprint: generateFingerprint(eventId, 'missing_vendor', 'venue'),
    });
  }

  if (!hasConfirmedCatering && totalGuests > 0) {
    detected.push({
      event: eventId,
      type: 'missing_vendor',
      severity: daysUntilEvent < 21 ? 'critical' : 'high',
      title: 'No Confirmed Catering Vendor',
      explanation: `Expected ${totalGuests} guests, but no catering vendor has been confirmed yet.`,
      affectedEntities: vendors.filter((v) => v.category === 'catering').map((v) => ({ kind: 'Vendor', id: v._id })),
      suggestedActions: [
        'Finalize headcount tasting and confirm catering vendor',
        'Specify dietary requirements and menu options',
      ],
      detectedBy: 'rule',
      fingerprint: generateFingerprint(eventId, 'missing_vendor', 'catering'),
    });
  }

  // ─── Rule 3: Vendor Status Issues ─────────────────────────────────────────
  const unavailableVendors = vendors.filter((v) => v.status === 'unavailable' || v.status === 'cancelled');
  for (const v of unavailableVendors) {
    detected.push({
      event: eventId,
      type: 'vendor_unavailable',
      severity: ['venue', 'catering', 'decor'].includes(v.category) ? 'critical' : 'high',
      title: `Vendor Unavailable: ${v.name} (${v.category})`,
      explanation: `Vendor "${v.name}" for category "${v.category}" is marked as ${v.status}. Immediate replacement needed.`,
      affectedEntities: [{ kind: 'Vendor', id: v._id }],
      suggestedActions: [
        `Search and shortlist alternative vendors for ${v.category}`,
        `Reassign pending ${v.category} tasks to a replacement vendor`,
      ],
      detectedBy: 'rule',
      fingerprint: generateFingerprint(eventId, 'vendor_unavailable', String(v._id)),
    });
  }

  // ─── Rule 4: Blocked & Overdue Tasks ──────────────────────────────────────
  const blockedTasks = tasks.filter((t) => t.status === 'blocked');
  for (const t of blockedTasks) {
    detected.push({
      event: eventId,
      type: 'task_blocked',
      severity: t.priority === 'critical' ? 'critical' : t.priority === 'high' ? 'high' : 'medium',
      title: `Blocked Task: ${t.title}`,
      explanation: `Task "${t.title}" (${t.category}) is marked as blocked. ${t.blockedReason ? `Reason: ${t.blockedReason}` : 'No reason provided.'}`,
      affectedEntities: [{ kind: 'Task', id: t._id }],
      suggestedActions: [
        'Resolve blocker dependencies and unblock assignee',
        'Escalate to event manager or reassign task',
      ],
      detectedBy: 'rule',
      fingerprint: generateFingerprint(eventId, 'task_blocked', String(t._id)),
    });
  }

  const overdueTasks = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done',
  );
  for (const t of overdueTasks) {
    const daysOverdue = Math.ceil((now.getTime() - new Date(t.dueDate).getTime()) / (1000 * 60 * 60 * 24));
    detected.push({
      event: eventId,
      type: 'task_overdue',
      severity: daysOverdue > 7 || t.priority === 'critical' ? 'high' : 'medium',
      title: `Overdue Task: ${t.title} (${daysOverdue}d late)`,
      explanation: `Task "${t.title}" was due on ${new Date(t.dueDate).toLocaleDateString()} and is still ${t.status}.`,
      affectedEntities: [{ kind: 'Task', id: t._id }],
      suggestedActions: [
        'Complete task or update expected completion date',
        'Verify if dependent tasks are delayed as a result',
      ],
      detectedBy: 'rule',
      fingerprint: generateFingerprint(eventId, 'task_overdue', String(t._id)),
    });
  }

  // ─── Rule 5: Task Due After Sub-Event ─────────────────────────────────────
  const subEventMap = new Map(subEvents.map((s) => [String(s._id), s]));
  for (const t of tasks) {
    if (t.subEvent && t.dueDate && t.status !== 'done') {
      const sub = subEventMap.get(String(t.subEvent));
      if (sub && new Date(t.dueDate) > new Date(sub.date)) {
        detected.push({
          event: eventId,
          type: 'timeline_conflict',
          severity: 'high',
          title: `Timeline Mismatch: Task due after sub-event "${sub.name}"`,
          explanation: `Task "${t.title}" is due on ${new Date(t.dueDate).toLocaleDateString()}, which is after sub-event "${sub.name}" on ${new Date(sub.date).toLocaleDateString()}.`,
          affectedEntities: [
            { kind: 'Task', id: t._id },
            { kind: 'SubEvent', id: sub._id },
          ],
          suggestedActions: [
            `Adjust task due date to before ${new Date(sub.date).toLocaleDateString()}`,
          ],
          detectedBy: 'rule',
          fingerprint: generateFingerprint(eventId, 'timeline_conflict', `${t._id}:${sub._id}`),
        });
      }
    }
  }

  // ─── Rule 6: Budget Overrun ───────────────────────────────────────────────
  const totalBudget = event.budget?.total || 0;
  const spentBudget = event.budget?.spent || 0;
  if (totalBudget > 0 && spentBudget > totalBudget) {
    const overrun = spentBudget - totalBudget;
    detected.push({
      event: eventId,
      type: 'budget_overrun',
      severity: 'critical',
      title: `Budget Exceeded by ${overrun} ${event.budget?.currency || 'INR'}`,
      explanation: `Total budget is ${totalBudget} ${event.budget?.currency || 'INR'}, but total recorded spend is ${spentBudget}.`,
      affectedEntities: [{ kind: 'Event', id: event._id }],
      suggestedActions: [
        'Review itemized vendor expenses to identify overrun areas',
        'Negotiate discounts or increase overall budget allocation',
      ],
      detectedBy: 'rule',
      fingerprint: generateFingerprint(eventId, 'budget_overrun', 'total'),
    });
  } else if (totalBudget > 0 && spentBudget > 0.9 * totalBudget) {
    detected.push({
      event: eventId,
      type: 'budget_warning',
      severity: 'medium',
      title: `Budget Warning: 90% Allocated`,
      explanation: `Current spend is ${spentBudget} of ${totalBudget} ${event.budget?.currency || 'INR'} (>${Math.round((spentBudget / totalBudget) * 100)}%).`,
      affectedEntities: [{ kind: 'Event', id: event._id }],
      suggestedActions: ['Monitor remaining vendor contracts carefully'],
      detectedBy: 'rule',
      fingerprint: generateFingerprint(eventId, 'budget_warning', 'total'),
    });
  }

  // ─── Synchronize detected risks with MongoDB ──────────────────────────────
  const activeFingerprints = new Set(detected.map((d) => d.fingerprint));

  // Upsert all detected risks
  const upsertOps = detected.map((risk) => ({
    updateOne: {
      filter: { event: eventId, fingerprint: risk.fingerprint },
      update: {
        $set: {
          type: risk.type,
          severity: risk.severity,
          title: risk.title,
          explanation: risk.explanation,
          affectedEntities: risk.affectedEntities,
          suggestedActions: risk.suggestedActions,
          detectedBy: 'rule',
        },
        $setOnInsert: {
          event: eventId,
          fingerprint: risk.fingerprint,
          status: 'open',
        },
      },
      upsert: true,
    },
  }));

  if (upsertOps.length > 0) {
    await Risk.bulkWrite(upsertOps);
  }

  // Auto-resolve any rule-detected risks that are no longer present
  const resolveResult = await Risk.updateMany(
    {
      event: eventId,
      detectedBy: 'rule',
      status: 'open',
      fingerprint: { $nin: Array.from(activeFingerprints) },
    },
    {
      $set: { status: 'resolved' },
    },
  );

  const openCount = await Risk.countDocuments({ event: eventId, status: 'open' });

  logger.info('Risk evaluation complete', {
    eventId,
    detected: detected.length,
    autoResolved: resolveResult.modifiedCount,
    openTotal: openCount,
  });

  return {
    detectedRisks: detected,
    resolvedCount: resolveResult.modifiedCount,
    openCount,
  };
};

/**
 * List risks for an event with filtering and pagination.
 *
 * @param {string} userId
 * @param {string} eventId
 * @param {object} query
 */
export const listRisks = async (userId, eventId, query = {}) => {
  await assertEventOwnership(eventId, userId);
  const { severity, status, detectedBy, page = 1, limit = 50 } = query;

  const filter = { event: eventId };
  if (severity) filter.severity = severity;
  if (status) filter.status = status;
  if (detectedBy) filter.detectedBy = detectedBy;

  const skip = (page - 1) * limit;
  const [risks, total] = await Promise.all([
    Risk.find(filter)
      .sort({ severity: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Risk.countDocuments(filter),
  ]);

  return { risks, total, page, pages: Math.ceil(total / limit) };
};

/**
 * Update the status of a specific risk (e.g. acknowledge, resolve, dismiss).
 *
 * @param {string} userId
 * @param {string} eventId
 * @param {string} riskId
 * @param {'open'|'acknowledged'|'resolved'|'dismissed'} status
 * @param {string} [note]
 */
export const updateRiskStatus = async (userId, eventId, riskId, status, note = '') => {
  await assertEventOwnership(eventId, userId);

  const risk = await Risk.findOneAndUpdate(
    { _id: riskId, event: eventId },
    { $set: { status } },
    { new: true },
  );

  if (!risk) {
    throw new ApiError(404, 'Risk not found');
  }

  logger.info('Risk status updated', { eventId, riskId, status, note });
  return risk;
};
