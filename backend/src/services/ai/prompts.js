/**
 * Prompt engineering templates for the Xperience Assistant.
 */

export const SYSTEM_PROMPT = `You are "The Xperience Assistant", an expert AI event management architect and co-pilot for event managers.
Your core goal is to parse event manager notes, conversations, and updates into structured event data, analyze consequences, detect risks, and recommend concrete next actions.

CRITICAL RULES:
1. THE LLM PROPOSES, THE ENGINE DISPOSES. You DO NOT mutate the database. You return a structured JSON response containing:
   - "reply": A friendly, professional message explaining what you extracted, highlighting any immediate concerns or capacity gaps.
   - "proposedActions": An array of concrete structured actions to be confirmed by the human event manager.
2. Supported action types in "proposedActions":
   - "create_sub_event": payload { name, date, startTime, endTime, expectedGuests, venueId }
   - "update_sub_event": payload { subEventId, name?, date?, startTime?, endTime?, expectedGuests?, venueId? }
   - "create_task": payload { title, category, priority, dueDate, subEvent, assignee, description }
   - "update_task": payload { taskId, status?, priority?, dueDate?, blockedReason? }
   - "create_vendor": payload { name, category, status, contact: { name, email, phone }, notes }
   - "update_vendor": payload { vendorId, status?, notes?, category? }
   - "create_guest_group": payload { label, count, arrivalCity, needsAccommodation, needsTransport, arrivalInfo }
   - "update_guest_group": payload { groupId, label?, count?, needsAccommodation?, needsTransport? }
   - "create_requirement": payload { type, required, provided, sourceRef }
   - "update_requirement": payload { reqId, required?, provided?, sourceRef? }
   - "update_event": payload { title?, startDate?, endDate?, budget: { total?, spent? }, expectedGuests? }
3. Always check event context (existing sub-events, vendors, tasks, guest counts, budget) before proposing duplicates.
4. If the user mentions a vendor is unavailable, propose updating the vendor status to "unavailable" AND creating a task to find a backup vendor.
5. If the user mentions a capacity constraint (e.g. "bus only seats 150 people but we have 200 guests"), propose updating or creating the requirement and creating a task to resolve the deficit.

Always output valid JSON conforming strictly to the requested schema.`;

/**
 * Builds a compact, rich context string representing the current state of an event.
 */
export const buildEventContextPrompt = ({
  event,
  subEvents = [],
  tasks = [],
  vendors = [],
  guestGroups = [],
  requirements = [],
  risks = [],
}) => {
  const totalGuests = guestGroups.reduce((s, g) => s + (g.count || 0), 0);
  const completedTasks = tasks.filter((t) => t.status === 'done').length;

  return `
=== CURRENT EVENT CONTEXT ===
Event: "${event.title}" (${event.type})
Dates: ${new Date(event.startDate).toLocaleDateString()} to ${new Date(event.endDate).toLocaleDateString()}
City: ${event.city || 'Not specified'}
Total Budget: ${event.budget?.total || 0} ${event.budget?.currency || 'INR'} (Spent: ${event.budget?.spent || 0})
Total Registered Guests: ${totalGuests} across ${guestGroups.length} groups

Sub-Events (${subEvents.length}):
${
  subEvents.length === 0
    ? '  (None yet)'
    : subEvents
        .map(
          (s) =>
            `  - [ID: ${s._id}] "${s.name}" on ${new Date(s.date).toLocaleDateString()} (${s.startTime} - ${s.endTime}), Guests: ${s.expectedGuests || 0}`,
        )
        .join('\n')
}

Vendors (${vendors.length}):
${
  vendors.length === 0
    ? '  (None yet)'
    : vendors
        .map(
          (v) =>
            `  - [ID: ${v._id}] "${v.name}" (${v.category}) -> Status: ${v.status}`,
        )
        .join('\n')
}

Tasks (${tasks.length} total, ${completedTasks} completed):
${
  tasks.length === 0
    ? '  (None yet)'
    : tasks
        .slice(0, 15)
        .map(
          (t) =>
            `  - [ID: ${t._id}] "${t.title}" (${t.category}) -> Status: ${t.status}, Priority: ${t.priority}${t.dueDate ? `, Due: ${new Date(t.dueDate).toLocaleDateString()}` : ''}`,
        )
        .join('\n')
}

Guest Groups (${guestGroups.length}):
${
  guestGroups.length === 0
    ? '  (None yet)'
    : guestGroups
        .map(
          (g) =>
            `  - [ID: ${g._id}] "${g.label}" (Count: ${g.count}, Transport: ${g.needsTransport ? 'YES' : 'NO'}, Accomm: ${g.needsAccommodation ? 'YES' : 'NO'})`,
        )
        .join('\n')
}

Requirements & Capacities (${requirements.length}):
${
  requirements.length === 0
    ? '  (None yet)'
    : requirements
        .map(
          (r) =>
            `  - [ID: ${r._id}] ${r.type}: Provided ${r.provided} / Required ${r.required}`,
        )
        .join('\n')
}

Active Open Risks (${risks.length}):
${
  risks.length === 0
    ? '  (No active risks)'
    : risks.map((r) => `  - [${r.severity.toUpperCase()}] ${r.title}`).join('\n')
}
=== END CONTEXT ===
`;
};
