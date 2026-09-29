import Event from '../../models/Event.js';
import Task from '../../models/Task.js';
import Vendor from '../../models/Vendor.js';
import Risk from '../../models/Risk.js';
import SubEvent from '../../models/SubEvent.js';
import GuestGroup from '../../models/GuestGroup.js';
import assertEventOwnership from '../../utils/assertEventOwnership.js';
import logger from '../../utils/logger.js';

/**
 * Calculates a comprehensive Event Readiness Score (0-100) and readiness breakdown.
 *
 * @param {string} userId
 * @param {string} eventId
 * @returns {Promise<{
 *   score: number,
 *   level: 'On Track' | 'Needs Attention' | 'At Risk',
 *   breakdown: {
 *     tasks: { score: number, max: 30, completed: number, total: number, blocked: number, overdue: number },
 *     vendors: { score: number, max: 30, confirmed: number, total: number, coreCoverage: string[] },
 *     risks: { score: number, max: 25, openTotal: number, critical: number, high: number, medium: number },
 *     budget: { score: number, max: 15, total: number, spent: number, utilizationPercent: number }
 *   },
 *   keyGaps: string[],
 *   nextMilestones: string[]
 * }>}
 */
export const calculateEventReadiness = async (userId, eventId) => {
  const event = await assertEventOwnership(eventId, userId);

  const [tasks, vendors, risks, subEvents] = await Promise.all([
    Task.find({ event: eventId }).lean(),
    Vendor.find({ event: eventId }).lean(),
    Risk.find({ event: eventId, status: 'open' }).lean(),
    SubEvent.find({ event: eventId }).lean(),
  ]);

  const now = new Date();

  // ─── 1. Task Score (Max 30) ────────────────────────────────────────────────
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const blockedTasks = tasks.filter((t) => t.status === 'blocked').length;
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done',
  ).length;

  let taskScore = 30;
  if (totalTasks > 0) {
    const completionRate = completedTasks / totalTasks;
    taskScore = Math.round(completionRate * 30);
    // Deduct penalties for blocked and overdue tasks
    taskScore = Math.max(0, taskScore - blockedTasks * 3 - overdueTasks * 2);
  }

  // ─── 2. Vendor Score (Max 30) ──────────────────────────────────────────────
  const coreCategories = ['venue', 'catering', 'decor', 'photography', 'entertainment'];
  const confirmedVendors = vendors.filter((v) => v.status === 'confirmed');
  const coveredCore = coreCategories.filter((cat) =>
    confirmedVendors.some((v) => v.category === cat),
  );

  let vendorScore = 0;
  if (vendors.length > 0) {
    const corePoints = (coveredCore.length / coreCategories.length) * 20;
    const ratioPoints = (confirmedVendors.length / vendors.length) * 10;
    vendorScore = Math.round(corePoints + ratioPoints);
  } else {
    vendorScore = 5; // Starting baseline
  }

  // ─── 3. Risk Score (Max 25) ────────────────────────────────────────────────
  const criticalRisks = risks.filter((r) => r.severity === 'critical').length;
  const highRisks = risks.filter((r) => r.severity === 'high').length;
  const mediumRisks = risks.filter((r) => r.severity === 'medium').length;

  let riskScore = 25;
  riskScore -= criticalRisks * 10;
  riskScore -= highRisks * 5;
  riskScore -= mediumRisks * 2;
  riskScore = Math.max(0, riskScore);

  // ─── 4. Budget Score (Max 15) ──────────────────────────────────────────────
  const totalBudget = event.budget?.total || 0;
  const spentBudget = event.budget?.spent || 0;
  let budgetScore = 15;
  let utilizationPercent = 0;

  if (totalBudget > 0) {
    utilizationPercent = Math.round((spentBudget / totalBudget) * 100);
    if (spentBudget > totalBudget) {
      const overrunPercent = (spentBudget - totalBudget) / totalBudget;
      budgetScore = Math.max(0, Math.round(15 - overrunPercent * 30));
    }
  }

  // ─── Overall Score & Level ─────────────────────────────────────────────────
  const overallScore = Math.min(100, Math.max(0, taskScore + vendorScore + riskScore + budgetScore));

  let level = 'On Track';
  if (overallScore < 50) {
    level = 'At Risk';
  } else if (overallScore < 80) {
    level = 'Needs Attention';
  }

  // ─── Key Gaps and Next Milestones ─────────────────────────────────────────
  const keyGaps = [];
  const nextMilestones = [];

  const missingCore = coreCategories.filter((cat) => !coveredCore.includes(cat));
  if (missingCore.length > 0) {
    keyGaps.push(`Unconfirmed core vendors: ${missingCore.join(', ')}`);
  }
  if (blockedTasks > 0) {
    keyGaps.push(`${blockedTasks} task(s) currently blocked`);
  }
  if (overdueTasks > 0) {
    keyGaps.push(`${overdueTasks} task(s) overdue`);
  }
  if (criticalRisks > 0) {
    keyGaps.push(`${criticalRisks} critical risk(s) requiring immediate mitigation`);
  }
  if (spentBudget > totalBudget && totalBudget > 0) {
    keyGaps.push(`Budget overrun of ${spentBudget - totalBudget} ${event.budget?.currency || 'INR'}`);
  }

  if (subEvents.length > 0) {
    nextMilestones.push(`Coordinate logistics for upcoming sub-event: "${subEvents[0].name}"`);
  }
  if (missingCore.length > 0) {
    nextMilestones.push(`Finalize and confirm ${missingCore[0]} vendor contract`);
  }
  if (totalTasks - completedTasks > 0) {
    nextMilestones.push(`Complete ${totalTasks - completedTasks} pending planning tasks`);
  }

  logger.info('Readiness calculated', {
    eventId,
    overallScore,
    level,
  });

  return {
    score: overallScore,
    level,
    breakdown: {
      tasks: {
        score: taskScore,
        max: 30,
        completed: completedTasks,
        total: totalTasks,
        blocked: blockedTasks,
        overdue: overdueTasks,
      },
      vendors: {
        score: vendorScore,
        max: 30,
        confirmed: confirmedVendors.length,
        total: vendors.length,
        coreCoverage: coveredCore,
      },
      risks: {
        score: riskScore,
        max: 25,
        openTotal: risks.length,
        critical: criticalRisks,
        high: highRisks,
        medium: mediumRisks,
      },
      budget: {
        score: budgetScore,
        max: 15,
        total: totalBudget,
        spent: spentBudget,
        utilizationPercent,
      },
    },
    keyGaps,
    nextMilestones,
  };
};
