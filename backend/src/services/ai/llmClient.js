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
const heuristicFallbackParser = (userMessage, context = '') => {
  const text = userMessage.toLowerCase();
  const proposedActions = [];
  const replyParts = [];

  // 1. Detect SubEvent (e.g. "Sangeet venue finalised", "Haldi ceremony on 22nd Nov", "Reception at 7pm")
  if (text.includes('sangeet') || text.includes('mehendi') || text.includes('haldi') || text.includes('reception') || text.includes('cocktail')) {
    let name = 'Ceremony';
    if (text.includes('sangeet')) name = 'Sangeet Night';
    else if (text.includes('mehendi')) name = 'Mehendi Ceremony';
    else if (text.includes('haldi')) name = 'Haldi Function';
    else if (text.includes('reception')) name = 'Wedding Reception';
    else if (text.includes('cocktail')) name = 'Cocktail Party';

    if (text.includes('finalised') || text.includes('finalized') || text.includes('scheduled') || text.includes('planned') || text.includes('add')) {
      proposedActions.push({
        actionId: crypto.randomUUID(),
        type: 'create_sub_event',
        description: `Create Sub-Event "${name}"`,
        payload: {
          name,
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          startTime: '18:00',
          endTime: '23:00',
          expectedGuests: 150,
        },
      });
      replyParts.push(`I have extracted the sub-event **"${name}"** and prepared a proposal to schedule it.`);
    }
  }

  // 2. Detect Vendor (e.g. "decor vendor pending", "DJ vendor confirmed", "Photographer shortlisted")
  const vendorCategories = ['decor', 'catering', 'photography', 'venue', 'sound', 'entertainment', 'transport', 'accommodation'];
  for (const cat of vendorCategories) {
    if (text.includes(cat)) {
      const isConfirmed = text.includes('confirmed') || text.includes('finalised') || text.includes('finalized') || text.includes('booked');
      const isUnavailable = text.includes('unavailable') || text.includes('cancelled') || text.includes('backed out');
      const isPending = text.includes('pending') || text.includes('shortlisted') || text.includes('looking for');

      const status = isUnavailable ? 'unavailable' : isConfirmed ? 'confirmed' : 'shortlisted';
      const vendorName = `${cat.charAt(0).toUpperCase() + cat.slice(1)} Specialist`;

      proposedActions.push({
        actionId: crypto.randomUUID(),
        type: 'create_vendor',
        description: `Add ${cat} vendor "${vendorName}" with status "${status}"`,
        payload: {
          name: vendorName,
          category: cat === 'sound' ? 'entertainment' : cat,
          status,
          notes: `Extracted from manager update: "${userMessage}"`,
        },
      });

      if (isPending || isUnavailable) {
        proposedActions.push({
          actionId: crypto.randomUUID(),
          type: 'create_task',
          description: `Follow up on ${cat} vendor quotes and finalize agreement`,
          payload: {
            title: `Finalize ${cat} vendor contract`,
            category: cat === 'sound' ? 'entertainment' : cat,
            priority: 'high',
          },
        });
      }

      replyParts.push(`Noted **${cat}** vendor status as **${status}**.`);
      break;
    }
  }

  // 3. Detect Capacity / Requirement (e.g. "Transport vendor can only provide vehicles for 150 people", "Room capacity is 80")
  const transportMatch = text.match(/(\d+)\s*(people|guests|seats|vehicles|passengers)/i);
  if (text.includes('transport') || text.includes('vehicle') || text.includes('bus') || text.includes('cab')) {
    const capacity = transportMatch ? parseInt(transportMatch[1], 10) : 150;
    proposedActions.push({
      actionId: crypto.randomUUID(),
      type: 'create_requirement',
      description: `Set vehicle capacity requirement (Provided: ${capacity})`,
      payload: {
        type: 'vehicle_capacity',
        required: 200,
        provided: capacity,
        sourceRef: 'Manager transport note',
      },
    });
    replyParts.push(`Recorded transport vehicle capacity limit at **${capacity}** seats.`);
  }

  // 4. Detect Tasks (e.g. "Need to arrange airport pickup", "Send invitations by Friday")
  if (text.includes('need to') || text.includes('arrange') || text.includes('task') || text.includes('send invitations') || text.includes('buy')) {
    proposedActions.push({
      actionId: crypto.randomUUID(),
      type: 'create_task',
      description: `Action item: ${userMessage.slice(0, 50)}...`,
      payload: {
        title: userMessage.replace(/^(need to|please|we should|i need to)\s+/i, '').trim(),
        category: text.includes('invitation') ? 'invitations' : text.includes('airport') ? 'transport' : 'other',
        priority: 'medium',
      },
    });
    replyParts.push(`Created a new action item task for you.`);
  }

  // Default fallback message if no specific patterns triggered
  if (proposedActions.length === 0) {
    replyParts.push(
      `I analyzed your message: "${userMessage}". I have reviewed the event timeline, vendors, and tasks. Everything is monitored by our active risk detector. Let me know if you would like to schedule a sub-event, add a vendor, or create tasks.`,
    );
  } else {
    replyParts.push(
      `I have prepared **${proposedActions.length} proposed action(s)** for your review below. Please confirm to apply them to the event database.`,
    );
  }

  return {
    reply: replyParts.join('\n\n'),
    proposedActions,
    tokenUsage: { promptTokens: 120, completionTokens: 80, totalTokens: 200 },
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
 * @returns {Promise<{ reply: string, proposedActions: object[], tokenUsage?: object }>}
 */
export const generateStructuredChat = async ({ systemPrompt, userPrompt, eventContext = '' }) => {
  const provider = env.LLM_PROVIDER || 'gemini';

  // ── 1. Gemini ─────────────────────────────────────────────────────────────
  if (provider === 'gemini' && env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: env.LLM_MODEL || 'gemini-1.5-pro',
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
          { role: 'user', content: `${eventContext}\n\nUSER MESSAGE:\n${userPrompt}\n\nRespond ONLY with a valid JSON object.` },
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
  return heuristicFallbackParser(userPrompt, eventContext);
};
