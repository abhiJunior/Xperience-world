import Event from '../../models/Event.js';
import SubEvent from '../../models/SubEvent.js';
import Task from '../../models/Task.js';
import Vendor from '../../models/Vendor.js';
import GuestGroup from '../../models/GuestGroup.js';
import Requirement from '../../models/Requirement.js';
import assertEventOwnership from '../../utils/assertEventOwnership.js';
import logger from '../../utils/logger.js';

/**
 * Computes cascading dependencies and downstream impact when an entity or scenario changes.
 *
 * @param {string} userId
 * @param {string} eventId
 * @param {object} change
 * @param {'vendor_change'|'guest_count_change'|'sub_event_change'|'task_blocked'|'budget_change'|'generic'} change.type
 * @param {object} [change.payload]
 * @returns {Promise<{ severity: string, summary: string, affectedEntities: object[], cascadingRisks: string[], suggestedActions: string[] }>}
 */
export const analyzeImpact = async (userId, eventId, change) => {
  const event = await assertEventOwnership(eventId, userId);

  const [subEvents, tasks, vendors, guestGroups, requirements] = await Promise.all([
    SubEvent.find({ event: eventId }).lean(),
    Task.find({ event: eventId }).lean(),
    Vendor.find({ event: eventId }).lean(),
    GuestGroup.find({ event: eventId }).lean(),
    Requirement.find({ event: eventId }).lean(),
  ]);

  const affectedEntities = [];
  const cascadingRisks = [];
  const suggestedActions = [];
  let severity = 'low';
  let summary = '';

  const { type, payload = {} } = change;

  switch (type) {
    case 'vendor_change': {
      const { vendorId, newStatus, category } = payload;
      const targetVendor = vendors.find((v) => String(v._id) === String(vendorId)) || {
        name: 'Vendor',
        category: category || 'other',
      };

      if (newStatus === 'unavailable' || newStatus === 'cancelled') {
        severity = ['venue', 'catering', 'decor'].includes(targetVendor.category) ? 'critical' : 'high';
        summary = `Vendor "${targetVendor.name}" (${targetVendor.category}) is ${newStatus}. This affects all dependent tasks and sub-events relying on this vendor.`;

        // Affected tasks in the same category
        const affectedTasks = tasks.filter(
          (t) => t.category === targetVendor.category && t.status !== 'done',
        );
        for (const t of affectedTasks) {
          affectedEntities.push({
            kind: 'Task',
            id: t._id,
            name: t.title,
            impact: `Blocked because ${targetVendor.category} vendor is unavailable`,
          });
        }

        // Sub-events where this vendor is assigned as venue
        const affectedSubs = subEvents.filter(
          (s) => String(s.venueId) === String(vendorId),
        );
        for (const s of affectedSubs) {
          affectedEntities.push({
            kind: 'SubEvent',
            id: s._id,
            name: s.name,
            impact: `Sub-event venue "${targetVendor.name}" is no longer available`,
          });
        }

        cascadingRisks.push(`Missing replacement vendor for ${targetVendor.category}`);
        if (affectedTasks.length > 0) {
          cascadingRisks.push(`${affectedTasks.length} pending tasks are now stalled`);
        }
        suggestedActions.push(`Identify and contact 2-3 backup vendors for ${targetVendor.category}`);
        suggestedActions.push(`Mark affected tasks as blocked pending new vendor selection`);
      }
      break;
    }

    case 'guest_count_change': {
      const { delta = 0, newCount } = payload;
      const currentTotal = guestGroups.reduce((s, g) => s + (g.count || 0), 0);
      const effectiveTotal = newCount !== undefined ? newCount : currentTotal + delta;

      summary = `Guest count changed by ${delta >= 0 ? '+' : ''}${delta} (New total: ${effectiveTotal} guests).`;

      // Check transport capacity
      const transportReqs = requirements.filter((r) => r.type === 'vehicle_capacity');
      const totalTransportProvided = transportReqs.reduce((s, r) => s + (r.provided || 0), 0);
      const transportNeeded = guestGroups
        .filter((g) => g.needsTransport)
        .reduce((s, g) => s + (g.count || 0), 0) + (delta > 0 ? Math.round(delta * 0.5) : 0);

      if (transportNeeded > totalTransportProvided) {
        severity = 'high';
        const deficit = transportNeeded - totalTransportProvided;
        cascadingRisks.push(`Transport deficit: ${deficit} guests without transport`);
        suggestedActions.push(`Increase vehicle booking capacity by at least ${deficit} seats`);
      }

      // Check catering requirement
      const cateringReq = requirements.find((r) => r.type === 'catering_headcount');
      if (cateringReq && effectiveTotal > cateringReq.provided) {
        const foodDeficit = effectiveTotal - cateringReq.provided;
        cascadingRisks.push(`Catering headcount shortage of ${foodDeficit} plates`);
        suggestedActions.push(`Notify catering vendor to revise headcount to ${effectiveTotal}`);
      }

      for (const g of guestGroups) {
        affectedEntities.push({
          kind: 'GuestGroup',
          id: g._id,
          name: g.label,
          impact: `Headcount updated to reflect guest group changes`,
        });
      }
      break;
    }

    case 'sub_event_change': {
      const { subEventId, newDate, newStartTime } = payload;
      const targetSub = subEvents.find((s) => String(s._id) === String(subEventId));
      const subName = targetSub ? targetSub.name : 'Sub-event';

      summary = `Sub-event "${subName}" rescheduled to ${newDate || 'new date'} at ${newStartTime || 'new time'}.`;

      // Find tasks linked to this sub-event
      const linkedTasks = tasks.filter(
        (t) => String(t.subEvent) === String(subEventId) && t.status !== 'done',
      );

      for (const t of linkedTasks) {
        if (newDate && t.dueDate && new Date(t.dueDate) > new Date(newDate)) {
          severity = 'high';
          affectedEntities.push({
            kind: 'Task',
            id: t._id,
            name: t.title,
            impact: `Task due date (${new Date(t.dueDate).toLocaleDateString()}) is after new sub-event date (${new Date(newDate).toLocaleDateString()})`,
          });
          cascadingRisks.push(`Task "${t.title}" deadline violates new event timeline`);
        }
      }

      suggestedActions.push(`Update schedules with all vendors assigned to "${subName}"`);
      suggestedActions.push(`Shift task due dates to align with the new timeline`);
      break;
    }

    case 'task_blocked': {
      const { taskId, reason } = payload;
      const rootTask = tasks.find((t) => String(t._id) === String(taskId));
      const rootTitle = rootTask ? rootTask.title : 'Task';

      summary = `Task "${rootTitle}" is blocked. ${reason ? `Reason: ${reason}` : ''}`;
      severity = rootTask?.priority === 'critical' ? 'critical' : 'high';

      // Traverse task dependency tree (find all tasks that depend on this task)
      const findDependentTasks = (parentId) => {
        const direct = tasks.filter((t) =>
          (t.dependsOn || []).some((depId) => String(depId) === String(parentId)),
        );
        let all = [...direct];
        for (const d of direct) {
          all = all.concat(findDependentTasks(d._id));
        }
        return all;
      };

      const cascadingBlocked = findDependentTasks(taskId);
      for (const t of cascadingBlocked) {
        affectedEntities.push({
          kind: 'Task',
          id: t._id,
          name: t.title,
          impact: `Cascade-blocked by dependency on "${rootTitle}"`,
        });
      }

      if (cascadingBlocked.length > 0) {
        cascadingRisks.push(`${cascadingBlocked.length} downstream tasks are blocked`);
      }
      suggestedActions.push(`Prioritize resolving blocker for "${rootTitle}"`);
      suggestedActions.push(`Reassign resources to unblock downstream tasks`);
      break;
    }

    case 'budget_change': {
      const { newSpend, addedCost } = payload;
      const totalBudget = event.budget?.total || 0;
      const currentSpend = event.budget?.spent || 0;
      const projectedSpend = addedCost ? currentSpend + addedCost : newSpend;

      if (totalBudget > 0 && projectedSpend > totalBudget) {
        severity = 'critical';
        const overrun = projectedSpend - totalBudget;
        summary = `Projected spend of ${projectedSpend} exceeds budget (${totalBudget}) by ${overrun} ${event.budget?.currency || 'INR'}.`;
        cascadingRisks.push(`Budget overrun of ${overrun} ${event.budget?.currency || 'INR'}`);
        suggestedActions.push(`Review vendor quotes and identify cost optimization areas`);
        suggestedActions.push(`Request formal budget increase approval from event owner`);
      } else {
        severity = 'medium';
        summary = `Budget spend projected at ${projectedSpend} of ${totalBudget} ${event.budget?.currency || 'INR'}.`;
      }
      break;
    }

    default: {
      summary = `Impact evaluation complete for event "${event.title}".`;
      break;
    }
  }

  logger.info('Impact analysis completed', {
    eventId,
    changeType: type,
    severity,
    affectedCount: affectedEntities.length,
  });

  return {
    severity,
    summary,
    affectedEntities,
    cascadingRisks,
    suggestedActions,
  };
};
