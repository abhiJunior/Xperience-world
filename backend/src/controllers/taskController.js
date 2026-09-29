import * as taskService from '../services/taskService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(req.user._id, req.params.eventId, req.body);
  sendSuccess(res, 201, task, 'Task created successfully');
});

export const listTasks = asyncHandler(async (req, res) => {
  const tasks = await taskService.listTasks(req.user._id, req.params.eventId, req.query);
  sendSuccess(res, 200, tasks);
});

export const getTask = asyncHandler(async (req, res) => {
  const task = await taskService.getTask(req.user._id, req.params.eventId, req.params.id);
  sendSuccess(res, 200, task);
});

export const updateTask = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(req.user._id, req.params.eventId, req.params.id, req.body);
  sendSuccess(res, 200, task, 'Task updated successfully');
});

export const deleteTask = asyncHandler(async (req, res) => {
  await taskService.deleteTask(req.user._id, req.params.eventId, req.params.id);
  sendSuccess(res, 200, null, 'Task deleted successfully');
});

export const bulkUpdateStatus = asyncHandler(async (req, res) => {
  const { taskIds, status } = req.body;
  const result = await taskService.bulkUpdateStatus(req.user._id, req.params.eventId, taskIds, status);
  sendSuccess(res, 200, result, 'Tasks status updated successfully');
});
