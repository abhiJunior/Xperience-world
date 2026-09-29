/**
 * Models barrel — import all Mongoose models in one place so that
 * Mongoose registers their schemas before any query runs.
 *
 * Usage:  import { Event, Task, Vendor } from '../models/index.js';
 */
export { default as User } from './User.js';
export { default as Event } from './Event.js';
export { default as SubEvent } from './SubEvent.js';
export { default as Task } from './Task.js';
export { default as Vendor } from './Vendor.js';
export { default as GuestGroup } from './GuestGroup.js';
export { default as Requirement } from './Requirement.js';
export { default as Risk } from './Risk.js';
export { default as Suggestion } from './Suggestion.js';
export { default as Conversation } from './Conversation.js';
export { default as ActivityLog } from './ActivityLog.js';
export { default as Notification } from './Notification.js';
