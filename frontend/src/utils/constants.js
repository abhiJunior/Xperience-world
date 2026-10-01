// ── Event ──────────────────────────────────────────────────────────────────────
export const EVENT_TYPES = ['wedding', 'corporate', 'conference', 'other'];
export const EVENT_STATUSES = ['planning', 'confirmed', 'live', 'completed'];

export const EVENT_TYPE_LABELS = {
  wedding: 'Wedding',
  corporate: 'Corporate',
  conference: 'Conference',
  other: 'Other',
};

export const EVENT_STATUS_COLORS = {
  planning: 'info',
  confirmed: 'success',
  live: 'warning',
  completed: 'slate',
};

// ── Task ───────────────────────────────────────────────────────────────────────
export const TASK_STATUSES = ['todo', 'in_progress', 'blocked', 'done'];
export const TASK_PRIORITIES = ['low', 'medium', 'high', 'critical'];
export const TASK_CATEGORIES = [
  'venue', 'catering', 'decor', 'photography', 'entertainment',
  'accommodation', 'transport', 'invitations', 'branding', 'activities', 'other',
];

export const TASK_STATUS_LABELS = {
  todo: 'To Do',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  done: 'Done',
};

export const TASK_STATUS_COLORS = {
  todo: 'slate',
  in_progress: 'info',
  blocked: 'danger',
  done: 'success',
};

export const TASK_PRIORITY_COLORS = {
  low: 'slate',
  medium: 'info',
  high: 'warning',
  critical: 'danger',
};

// ── Vendor ─────────────────────────────────────────────────────────────────────
export const VENDOR_STATUSES = ['shortlisted', 'negotiating', 'confirmed', 'unavailable', 'cancelled'];
export const VENDOR_CATEGORIES = [
  'venue', 'catering', 'decor', 'photography', 'entertainment',
  'accommodation', 'transport', 'invitations', 'branding', 'activities', 'other',
];

export const VENDOR_STATUS_LABELS = {
  shortlisted: 'Shortlisted',
  negotiating: 'Negotiating',
  confirmed: 'Confirmed',
  unavailable: 'Unavailable',
  cancelled: 'Cancelled',
};

export const VENDOR_STATUS_COLORS = {
  shortlisted: 'info',
  negotiating: 'warning',
  confirmed: 'success',
  unavailable: 'danger',
  cancelled: 'slate',
};

// ── Risk ───────────────────────────────────────────────────────────────────────
export const RISK_SEVERITIES = ['low', 'medium', 'high', 'critical'];
export const RISK_STATUSES = ['open', 'acknowledged', 'resolved', 'dismissed'];

export const RISK_SEVERITY_COLORS = {
  low: 'success',
  medium: 'info',
  high: 'warning',
  critical: 'danger',
};

export const RISK_STATUS_LABELS = {
  open: 'Open',
  acknowledged: 'Acknowledged',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
};

// ── SubEvent ───────────────────────────────────────────────────────────────────
export const SUBEVENT_STATUSES = ['planning', 'confirmed', 'live', 'completed', 'cancelled'];
export const SUBEVENT_STATUS_COLORS = {
  planning: 'info',
  confirmed: 'success',
  live: 'warning',
  completed: 'slate',
  cancelled: 'danger',
};

// ── Suggestion ─────────────────────────────────────────────────────────────────
export const SUGGESTION_STATUSES = ['pending', 'accepted', 'dismissed'];

// ── Activity actors ────────────────────────────────────────────────────────────
export const ACTOR_LABELS = {
  user: 'You',
  ai: 'AI',
  system: 'System',
  cron: 'Scheduler',
};

export const ACTOR_COLORS = {
  user: 'accent',
  ai: 'info',
  system: 'slate',
  cron: 'warning',
};

// ── Sidebar nav ────────────────────────────────────────────────────────────────
export const NAV_ITEMS = [
  { label: 'Dashboard', path: 'dashboard', icon: 'LayoutDashboard' },
  { label: 'Tasks', path: 'tasks', icon: 'CheckSquare' },
  { label: 'Vendors', path: 'vendors', icon: 'Building2' },
  { label: 'Guests', path: 'guests', icon: 'Users' },
  { label: 'Risks', path: 'risks', icon: 'ShieldAlert' },
  { label: 'Timeline', path: 'timeline', icon: 'Calendar' },
  { label: 'Activity', path: 'activity', icon: 'Activity' },
];

// ── Suggestion chips ───────────────────────────────────────────────────────────
export const SUGGESTION_CHIPS = [
  "What's at risk?",
  "Daily briefing",
  "What's overdue?",
  "Summarize vendors",
  "Guest status",
];

// ── Empty state copy ───────────────────────────────────────────────────────────
export const EMPTY_STATES = {
  events: {
    title: 'No events yet',
    description: 'Create your first event and let AI help you plan it from scratch.',
    action: 'Create Event',
  },
  tasks: {
    title: 'No tasks found',
    description: 'Create tasks manually or ask the AI assistant to generate a plan.',
    action: 'Add Task',
  },
  vendors: {
    title: 'No vendors added',
    description: 'Track vendors, contacts, and costs for your event.',
    action: 'Add Vendor',
  },
  guests: {
    title: 'No guest groups yet',
    description: 'Organise guests into groups to track accommodation and transport needs.',
    action: 'Add Group',
  },
  risks: {
    title: 'No risks detected',
    description: 'Great news! Run a scan to check for potential issues.',
    action: 'Run Scan',
  },
  activity: {
    title: 'No activity yet',
    description: 'All changes to this event will be logged here.',
  },
  chat: {
    title: 'Start a conversation',
    description: 'Ask anything about your event. The AI will help you plan, track, and optimize.',
  },
};
