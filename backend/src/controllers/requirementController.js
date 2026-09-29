import * as requirementService from '../services/requirementService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const createRequirement = asyncHandler(async (req, res) => {
  const requirement = await requirementService.createRequirement(req.user._id, req.params.eventId, req.body);
  sendSuccess(res, 201, requirement, 'Requirement created successfully');
});

export const listRequirements = asyncHandler(async (req, res) => {
  const requirements = await requirementService.listRequirements(req.user._id, req.params.eventId);
  sendSuccess(res, 200, requirements);
});

export const getRequirement = asyncHandler(async (req, res) => {
  const requirement = await requirementService.getRequirement(req.user._id, req.params.eventId, req.params.id);
  sendSuccess(res, 200, requirement);
});

export const updateRequirement = asyncHandler(async (req, res) => {
  const requirement = await requirementService.updateRequirement(
    req.user._id,
    req.params.eventId,
    req.params.id,
    req.body
  );
  sendSuccess(res, 200, requirement, 'Requirement updated successfully');
});

export const deleteRequirement = asyncHandler(async (req, res) => {
  await requirementService.deleteRequirement(req.user._id, req.params.eventId, req.params.id);
  sendSuccess(res, 200, null, 'Requirement deleted successfully');
});
