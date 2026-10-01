import crypto from 'crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import env from '../../config/env.js';
import llmConfig from '../../config/llm.js';
import logger from '../../utils/logger.js';

/**
 * Intelligent heuristic fallback parser that handles event planning messages
 * when no LLM API key is present or when remote LLM service is unavailable.
 */
/**
 * Intelligent heuristic fallback parser that handles event planning messages
 * when no LLM API key is present or when remote LLM service is unavailable.
 */
const heuristicFallbackParser = (userMessage, eventContext = '', rawContext = {}) => {
  const text = userMessage.toLowerCase().trim();
  const proposedActions = [];
  const replyParts = [];

  const {
    event = {},
    subEvents = [],
    tasks = [],
    vendors = [],
    guestGroups = [],
    requirements = [],
    risks = [],
  } = rawContext;

  const totalGuests = guestGroups.reduce((s, g) => s + (g.count || 0), 0) || event.expectedGuests || 0;
  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const confirmedVendors = vendors.filter((v) => v.status === 'confirmed').length;

  // 1. "What's at risk?" / "risks" / "any risks" / "risk status"
  if (
    text.includes('risk') ||
    text.includes("what's at risk") ||
    text.includes('issues') ||
    text.includes('problems') ||
    text.includes('threats')
  ) {
    const openRisks = risks.filter((r) => r.status === 'open' || !r.status);
    if (openRisks.length === 0) {
      replyParts.push(
        `✅ **No critical risks detected!** All vendor agreements, timelines, and capacities currently align with your targets. The system is actively monitoring your event.`
      );
    } else {
      replyParts.push(
        `⚠️ **Active Risk Assessment (${openRisks.length} item${openRisks.length > 1 ? 's' : ''} detected):**\n\n` +
          openRisks
            .map(
              (r, idx) =>
                `**${idx + 1}. [${r.severity?.toUpperCase() || 'HIGH'}] ${r.title}**\n   • ${r.description || 'Action required to mitigate this risk.'}`
            )
            .join('\n\n')
      );
      // For each open risk, suggest a remediation task
      for (const r of openRisks.slice(0, 2)) {
        proposedActions.push({
          actionId: crypto.randomUUID(),
          type: 'create_task',
          description: `Resolve risk: ${r.title}`,
          payload: {
            title: `Resolve risk: ${r.title.slice(0, 100)}`,
            category: r.category || 'other',
            priority: r.severity === 'critical' ? 'critical' : 'high',
          },
        });
      }
    }
    return {
      reply:
        replyParts.join('\n\n') +
        (proposedActions.length > 0 ? '\n\nI have prepared suggested mitigation actions for you below:' : ''),
      proposedActions,
      tokenUsage: { promptTokens: 60, completionTokens: 120, totalTokens: 180 },
    };
  }

  // 2. "Daily briefing" / "briefing" / "summary" / "overview" / "status"
  if (
    text.includes('briefing') ||
    text.includes('daily briefing') ||
    text.includes('overview') ||
    (text.includes('summary') && !text.includes('vendor')) ||
    text === 'status'
  ) {
    replyParts.push(
      `📋 **Event Briefing: ${event.title || 'Your Event'}**\n\n` +
        `• **Dates:** ${event.startDate ? new Date(event.startDate).toLocaleDateString() : 'TBD'} to ${event.endDate ? new Date(event.endDate).toLocaleDateString() : 'TBD'}\n` +
        `• **City:** ${event.city || 'Not specified'}\n` +
        `• **Sub-Events:** ${subEvents.length} scheduled\n` +
        `• **Tasks:** ${doneTasks}/${tasks.length} completed (${tasks.length - doneTasks} pending)\n` +
        `• **Vendors:** ${confirmedVendors}/${vendors.length} confirmed\n` +
        `• **Guests:** ${totalGuests} expected across ${guestGroups.length} groups\n` +
        `• **Open Risks:** ${risks.length} items flagged`
    );
    return {
      reply: replyParts.join('\n\n'),
      proposedActions: [],
      tokenUsage: { promptTokens: 50, completionTokens: 100, totalTokens: 150 },
    };
  }

  // 3. "What's overdue?" / "overdue" / "pending tasks" / "deadlines"
  if (text.includes('overdue') || text.includes('late') || text.includes('deadline')) {
    const now = new Date();
    const overdueTasks = tasks.filter(
      (t) => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < now
    );
    const todoTasks = tasks.filter((t) => t.status === 'todo' || t.status === 'in_progress');

    if (overdueTasks.length > 0) {
      replyParts.push(
        `🚨 **${overdueTasks.length} Overdue Task(s):**\n\n` +
          overdueTasks
            .map(
              (t, idx) =>
                `**${idx + 1}. ${t.title}** (Priority: ${t.priority}, Due: ${new Date(t.dueDate).toLocaleDateString()})`
            )
            .join('\n')
      );
    } else if (todoTasks.length > 0) {
      replyParts.push(
        `✅ **No tasks are past due!** Here are your upcoming pending tasks:\n\n` +
          todoTasks.slice(0, 5).map((t, idx) => `• **${t.title}** [${t.priority}]`).join('\n')
      );
    } else {
      replyParts.push(`✅ **All tasks are completed!** No overdue or pending tasks on the timeline.`);
    }
    return {
      reply: replyParts.join('\n\n'),
      proposedActions: [],
      tokenUsage: { promptTokens: 50, completionTokens: 80, totalTokens: 130 },
    };
  }

  // 4. "Summarize vendors" / "vendors" / "vendor status"
  if (text.includes('vendor') || text.includes('vendors') || text.includes('supplier')) {
    if (vendors.length > 0 && !text.includes('add') && !text.includes('create') && !text.includes('book')) {
      const byStatus = {
        confirmed: vendors.filter((v) => v.status === 'confirmed'),
        negotiating: vendors.filter((v) => v.status === 'negotiating'),
        shortlisted: vendors.filter((v) => v.status === 'shortlisted'),
        unavailable: vendors.filter((v) => v.status === 'unavailable'),
      };
      replyParts.push(
        `🏢 **Vendor Status Summary (${vendors.length} total):**\n\n` +
          `• **Confirmed (${byStatus.confirmed.length}):** ${byStatus.confirmed.map((v) => v.name).join(', ') || 'None'}\n` +
          `• **Negotiating (${byStatus.negotiating.length}):** ${byStatus.negotiating.map((v) => v.name).join(', ') || 'None'}\n` +
          `• **Shortlisted (${byStatus.shortlisted.length}):** ${byStatus.shortlisted.map((v) => v.name).join(', ') || 'None'}\n` +
          (byStatus.unavailable.length > 0
            ? `• **Unavailable (${byStatus.unavailable.length}):** ${byStatus.unavailable.map((v) => v.name).join(', ')}\n`
            : '')
      );
      return {
        reply: replyParts.join('\n\n'),
        proposedActions: [],
        tokenUsage: { promptTokens: 50, completionTokens: 100, totalTokens: 150 },
      };
    }
  }

  // 5. "Guest status" / "guests" / "headcount"
  if (
    text.includes('guest') ||
    text.includes('guests') ||
    text.includes('headcount') ||
    text.includes('attendees')
  ) {
    if (!text.includes('add') && !text.includes('create') && !text.includes('update')) {
      replyParts.push(
        `👥 **Guest & Accommodation Overview:**\n\n` +
          `• **Total Expected Guests:** ${totalGuests || 0}\n` +
          `• **Guest Groups (${guestGroups.length}):**\n` +
          (guestGroups.length > 0
            ? guestGroups
                .map(
                  (g) =>
                    `  - **${g.label}:** ${g.count} guests (Needs stay: ${g.needsAccommodation ? 'Yes' : 'No'}, Transport: ${g.needsTransport ? 'Yes' : 'No'})`
                )
                .join('\n')
            : '  - No guest groups added yet.')
      );
      return {
        reply: replyParts.join('\n\n'),
        proposedActions: [],
        tokenUsage: { promptTokens: 50, completionTokens: 80, totalTokens: 130 },
      };
    }
  }

  // 6. Sub-Event scheduling intent (e.g. "schedule a sub-events", "schedule sub event", "add sangeet", "add haldi")
  const standardWeddingCeremonies = [
    { name: 'Haldi Ceremony', time: '10:00', endTime: '13:00', dayOffset: 0 },
    { name: 'Sangeet & Cocktail Night', time: '18:30', endTime: '23:30', dayOffset: 1 },
    { name: 'Wedding Ceremony (Pheras)', time: '16:00', endTime: '20:00', dayOffset: 2 },
    { name: 'Grand Reception', time: '20:00', endTime: '23:59', dayOffset: 2 },
  ];

  if (
    text.includes('sub-event') ||
    text.includes('sub event') ||
    text.includes('subevent') ||
    text.includes('schedule') ||
    text.includes('ceremony') ||
    text.includes('sangeet') ||
    text.includes('haldi') ||
    text.includes('mehendi') ||
    text.includes('reception')
  ) {
    const existingNames = subEvents.map((s) => s.name.toLowerCase());
    const baseDate = event.startDate ? new Date(event.startDate) : new Date(Date.now() + 7 * 86400000);

    for (const ceremony of standardWeddingCeremonies) {
      const alreadyExists = existingNames.some((n) =>
        n.includes(ceremony.name.split(' ')[0].toLowerCase())
      );
      const specificallyMentioned = text.includes(ceremony.name.split(' ')[0].toLowerCase());
      const generalSchedule =
        text.includes('schedule a sub-event') ||
        text.includes('schedule sub') ||
        text.includes('schedule a sub-events') ||
        text.includes('add sub') ||
        text.includes('plan ceremonies');

      if (!alreadyExists && (specificallyMentioned || generalSchedule)) {
        const cDate = new Date(baseDate.getTime() + ceremony.dayOffset * 86400000);
        proposedActions.push({
          actionId: crypto.randomUUID(),
          type: 'create_sub_event',
          description: `Schedule ${ceremony.name}`,
          payload: {
            name: ceremony.name,
            date: cDate.toISOString().split('T')[0],
            startTime: ceremony.time,
            endTime: ceremony.endTime,
            expectedGuests: event.expectedGuests || 300,
          },
        });
      }
    }

    if (proposedActions.length > 0) {
      replyParts.push(
        `I have prepared schedule proposals for **${proposedActions.length} sub-event(s)** based on your event timeline. Please review and confirm below:`
      );
      return {
        reply: replyParts.join('\n\n'),
        proposedActions,
        tokenUsage: { promptTokens: 80, completionTokens: 120, totalTokens: 200 },
      };
    }
  }

  // 7. General multi-entity extractor for custom paragraphs (e.g. Wedding with decor, venue, photography, catering, transport)
  const vendorCategories = [
    'decor',
    'catering',
    'photography',
    'venue',
    'sound',
    'entertainment',
    'transport',
    'accommodation',
    'invitations',
  ];
  for (const cat of vendorCategories) {
    if (text.includes(cat)) {
      const isConfirmed =
        text.includes('confirmed') ||
        text.includes('finalised') ||
        text.includes('finalized') ||
        text.includes('booked');
      const isUnavailable =
        text.includes('unavailable') || text.includes('cancelled') || text.includes('backed out');
      const status = isUnavailable ? 'unavailable' : isConfirmed ? 'confirmed' : 'shortlisted';
      const vendorName = `${cat.charAt(0).toUpperCase() + cat.slice(1)} Specialist`;

      const existingVendor = vendors.find((v) => v.category === cat);
      if (!existingVendor) {
        proposedActions.push({
          actionId: crypto.randomUUID(),
          type: 'create_vendor',
          description: `Add ${cat} vendor "${vendorName}" (${status})`,
          payload: {
            name: vendorName,
            category: cat === 'sound' ? 'entertainment' : cat,
            status,
            notes: `Extracted from manager note: "${userMessage.slice(0, 100)}"`,
          },
        });
      }
    }
  }

  // Detect Capacity
  const transportMatch = text.match(/(\d+)\s*(people|guests|seats|vehicles|passengers)/i);
  if (
    text.includes('transport') ||
    text.includes('vehicle') ||
    text.includes('bus') ||
    text.includes('cab')
  ) {
    const capacity = transportMatch ? parseInt(transportMatch[1], 10) : 150;
    proposedActions.push({
      actionId: crypto.randomUUID(),
      type: 'create_requirement',
      description: `Set vehicle capacity requirement (${capacity} seats)`,
      payload: {
        type: 'vehicle_capacity',
        required: totalGuests || 200,
        provided: capacity,
        sourceRef: 'Manager transport note',
      },
    });
    replyParts.push(`Recorded transport vehicle capacity limit at **${capacity}** seats.`);
  }

  // Detect Guest Group / Headcount
  const guestMatch = text.match(/(\d+)\s*(guests|people|attendees|invitees|headcount)/i);
  if (guestMatch) {
    const count = parseInt(guestMatch[1], 10);
    if (count > 0 && guestGroups.length === 0) {
      proposedActions.push({
        actionId: crypto.randomUUID(),
        type: 'create_guest_group',
        description: `Add Guest Group "General Attendees" (${count} guests)`,
        payload: {
          label: 'General Attendees',
          count,
          needsAccommodation: text.includes('accommodation') || text.includes('hotel') || text.includes('stay'),
          needsTransport: text.includes('transport') || text.includes('vehicle'),
        },
      });
      proposedActions.push({
        actionId: crypto.randomUUID(),
        type: 'update_event',
        description: `Set expected event guests to ${count}`,
        payload: {
          expectedGuests: count,
          confirmedGuests: count,
        },
      });
    }
  }

  // Detect Tasks
  if (
    text.includes('need to') ||
    text.includes('arrange') ||
    text.includes('task') ||
    text.includes('send invitations') ||
    text.includes('finalize') ||
    text.includes('finalise')
  ) {
    let cleanTitle = userMessage;
    const actionPhraseMatch = userMessage.match(
      /(?:need to|arrange|finalize|finalise|prepare|setup|organize)\s+([^.!?\n]+)/i
    );
    if (actionPhraseMatch) {
      cleanTitle = `Finalize ${actionPhraseMatch[1].trim()}`;
    } else {
      cleanTitle = userMessage
        .replace(/^(we are planning|planning|we need to|need to|please|we should|i need to)\s+/i, '')
        .trim();
    }
    if (cleanTitle.length > 120) {
      cleanTitle = cleanTitle.slice(0, 117) + '...';
    }

    proposedActions.push({
      actionId: crypto.randomUUID(),
      type: 'create_task',
      description: `Action item: ${cleanTitle}`,
      payload: {
        title: cleanTitle,
        category: text.includes('invitation')
          ? 'invitations'
          : text.includes('airport')
            ? 'transport'
            : 'other',
        priority: 'medium',
      },
    });
  }

  if (proposedActions.length === 0) {
    replyParts.push(
      `I analyzed your message regarding **"${event.title || 'this event'}"**.\n\n` +
        `Current event status: **${subEvents.length} sub-events**, **${vendors.length} vendors**, **${tasks.length - doneTasks} open tasks**, and **${risks.length} open risks**.\n\n` +
        `How would you like to proceed? You can click the query chips below (e.g. **"What's at risk?"**, **"Daily briefing"**, **"Summarize vendors"**) or ask me to **"schedule a sub-event"**!`
    );
  } else {
    replyParts.push(
      `I processed your request and prepared **${proposedActions.length} proposed action(s)** for your review below. Please confirm them to apply to the event database.`
    );
  }

  return {
    reply: replyParts.join('\n\n'),
    proposedActions,
    tokenUsage: { promptTokens: 100, completionTokens: 120, totalTokens: 220 },
  };
};

/**
 * Unified JSON generation function that calls the configured LLM provider
 * (Gemini, OpenAI, Anthropic) or falls back smoothly if keys are unset.
 *
 * @param {object} params
 * @param {string} params.systemPrompt
 * @param {string} params.userPrompt
 * @param {string} [params.eventContext]
 * @param {object} [params.rawContext]
 * @returns {Promise<{ reply: string, proposedActions: object[], tokenUsage?: object }>}
 */
export const generateStructuredChat = async ({
  systemPrompt,
  userPrompt,
  eventContext = '',
  rawContext = {},
}) => {
  const provider = env.LLM_PROVIDER || 'gemini';

  // ── 1. Gemini ─────────────────────────────────────────────────────────────
  if (provider === 'gemini' && env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: env.LLM_MODEL || 'gemini-1.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: llmConfig.defaults.temperature,
        },
        systemInstruction: systemPrompt,
      });

      const fullPrompt = `${eventContext}\n\nUSER MESSAGE:\n${userPrompt}\n\nReturn JSON in format: { "reply": string, "proposedActions": [ { "actionId": string, "type": string, "description": string, "payload": object } ] }`;

      const result = await model.generateContent(fullPrompt);
      const rawText = result.response.text();
      const parsed = JSON.parse(rawText);

      // Ensure every proposed action has an actionId
      if (Array.isArray(parsed.proposedActions)) {
        parsed.proposedActions = parsed.proposedActions.map((a) => ({
          ...a,
          actionId: a.actionId || crypto.randomUUID(),
        }));
      }

      return {
        reply: parsed.reply || 'Update processed.',
        proposedActions: parsed.proposedActions || [],
        tokenUsage: {
          promptTokens: result.response.usageMetadata?.promptTokenCount || 0,
          completionTokens: result.response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: result.response.usageMetadata?.totalTokenCount || 0,
        },
      };
    } catch (err) {
      logger.warn('Gemini LLM call failed, falling back to heuristic parser', { error: err.message });
    }
  }

  // ── 2. OpenAI ─────────────────────────────────────────────────────────────
  if (provider === 'openai' && env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: env.LLM_MODEL || 'gpt-4o',
        response_format: { type: 'json_object' },
        temperature: llmConfig.defaults.temperature,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `${eventContext}\n\nUSER MESSAGE:\n${userPrompt}` },
        ],
      });

      const parsed = JSON.parse(completion.choices[0].message.content);
      if (Array.isArray(parsed.proposedActions)) {
        parsed.proposedActions = parsed.proposedActions.map((a) => ({
          ...a,
          actionId: a.actionId || crypto.randomUUID(),
        }));
      }

      return {
        reply: parsed.reply || 'Update processed.',
        proposedActions: parsed.proposedActions || [],
        tokenUsage: {
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0,
        },
      };
    } catch (err) {
      logger.warn('OpenAI LLM call failed, falling back to heuristic parser', { error: err.message });
    }
  }

  // ── 3. Anthropic ──────────────────────────────────────────────────────────
  if (provider === 'anthropic' && env.ANTHROPIC_API_KEY) {
    try {
      const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
      const message = await anthropic.messages.create({
        model: env.LLM_MODEL || 'claude-3-5-sonnet-20241022',
        max_tokens: llmConfig.defaults.maxTokens,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `${eventContext}\n\nUSER MESSAGE:\n${userPrompt}\n\nRespond ONLY with a valid JSON object.`,
          },
        ],
      });

      const text = message.content[0].text;
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed.proposedActions)) {
        parsed.proposedActions = parsed.proposedActions.map((a) => ({
          ...a,
          actionId: a.actionId || crypto.randomUUID(),
        }));
      }

      return {
        reply: parsed.reply || 'Update processed.',
        proposedActions: parsed.proposedActions || [],
        tokenUsage: {
          promptTokens: message.usage?.input_tokens || 0,
          completionTokens: message.usage?.output_tokens || 0,
          totalTokens: (message.usage?.input_tokens || 0) + (message.usage?.output_tokens || 0),
        },
      };
    } catch (err) {
      logger.warn('Anthropic LLM call failed, falling back to heuristic parser', { error: err.message });
    }
  }

  // ── Heuristic Fallback ────────────────────────────────────────────────────
  logger.info('Using intelligent heuristic event parser for chat processing');
  return heuristicFallbackParser(userPrompt, eventContext, rawContext);
};
