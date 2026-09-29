import * as chatOrchestrator from '../services/ai/chatOrchestrator.js';
import * as actionExecutor from '../services/ai/actionExecutor.js';
import * as whatIfSimulator from '../services/ai/whatIfSimulator.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const sendMessage = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const result = await chatOrchestrator.processChatMessage(req.user._id, req.params.eventId, message);
  sendSuccess(res, 200, result);
});

export const getHistory = asyncHandler(async (req, res) => {
  const result = await chatOrchestrator.getChatHistory(req.user._id, req.params.eventId, req.query);
  sendSuccess(res, 200, result);
});

export const confirmAction = asyncHandler(async (req, res) => {
  const { note } = req.body;
  const result = await actionExecutor.confirmAction(
    req.user._id,
    req.params.eventId,
    req.params.actionId,
    note
  );
  sendSuccess(res, 200, result, 'Action confirmed and applied to event successfully');
});

export const rejectAction = asyncHandler(async (req, res) => {
  const { note } = req.body;
  const result = await actionExecutor.rejectAction(
    req.user._id,
    req.params.eventId,
    req.params.actionId,
    note
  );
  sendSuccess(res, 200, result, 'Action rejected');
});

export const runWhatIf = asyncHandler(async (req, res) => {
  const { scenario } = req.body;
  const result = await whatIfSimulator.simulateWhatIf(
    req.user._id,
    req.params.eventId,
    scenario
  );
  sendSuccess(res, 200, result, 'What-if simulation completed');
});
