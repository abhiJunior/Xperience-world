import * as riskEngine from '../services/engine/riskEngine.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const runRiskScan = asyncHandler(async (req, res) => {
  const result = await riskEngine.evaluateEventRisks(req.user._id, req.params.eventId);
  sendSuccess(res, 200, result, 'Risk evaluation scan completed successfully');
});

export const listRisks = asyncHandler(async (req, res) => {
  const result = await riskEngine.listRisks(req.user._id, req.params.eventId, req.query);
  sendSuccess(res, 200, result);
});

export const updateRiskStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const risk = await riskEngine.updateRiskStatus(
    req.user._id,
    req.params.eventId,
    req.params.id,
    status,
    note
  );
  sendSuccess(res, 200, risk, `Risk marked as ${status}`);
});
