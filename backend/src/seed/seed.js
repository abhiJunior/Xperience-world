import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Event from '../models/Event.js';
import SubEvent from '../models/SubEvent.js';
import Task from '../models/Task.js';
import Vendor from '../models/Vendor.js';
import GuestGroup from '../models/GuestGroup.js';
import Requirement from '../models/Requirement.js';
import Risk from '../models/Risk.js';
import Conversation from '../models/Conversation.js';
import Suggestion from '../models/Suggestion.js';
import ActivityLog from '../models/ActivityLog.js';
import Notification from '../models/Notification.js';
import * as riskEngine from '../services/engine/riskEngine.js';
import * as readinessEngine from '../services/engine/readinessEngine.js';
import logger from '../utils/logger.js';

export const seedDatabase = async () => {
  logger.info('Starting database seeding...');
  await connectDB();

  // 1. Clear existing seed data for demo user
  const demoEmail = 'demo@xperience.com';
  let demoUser = await User.findOne({ email: demoEmail });

  if (demoUser) {
    const existingEvents = await Event.find({ owner: demoUser._id }).lean();
    const eventIds = existingEvents.map((e) => e._id);

    await Promise.all([
      Event.deleteMany({ owner: demoUser._id }),
      SubEvent.deleteMany({ event: { $in: eventIds } }),
      Task.deleteMany({ event: { $in: eventIds } }),
      Vendor.deleteMany({ event: { $in: eventIds } }),
      GuestGroup.deleteMany({ event: { $in: eventIds } }),
      Requirement.deleteMany({ event: { $in: eventIds } }),
      Risk.deleteMany({ event: { $in: eventIds } }),
      Conversation.deleteMany({ event: { $in: eventIds } }),
      Suggestion.deleteMany({ event: { $in: eventIds } }),
      ActivityLog.deleteMany({ event: { $in: eventIds } }),
      Notification.deleteMany({ event: { $in: eventIds } }),
    ]);
  } else {
    const passwordHash = await bcrypt.hash('Password123!', 12);
    demoUser = await User.create({
      name: 'Aditi Sharma',
      email: demoEmail,
      passwordHash,
      role: 'manager',
    });
  }

  logger.info('Demo user prepared', { userId: demoUser._id, email: demoEmail });

  const now = new Date();
  const baseDate = new Date(now.getTime() + 18 * 24 * 60 * 60 * 1000); // 18 days from now

  // ───────────────────────────────────────────────────────────────────────────
  // EVENT 1: Royal Destination Wedding (Jaipur)
  // ───────────────────────────────────────────────────────────────────────────
  const weddingStartDate = new Date(baseDate);
  const weddingEndDate = new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000);

  const wedding = await Event.create({
    owner: demoUser._id,
    title: 'The Royal Jaipur Wedding: Aarav & Ananya',
    type: 'wedding',
    status: 'planning',
    startDate: weddingStartDate,
    endDate: weddingEndDate,
    city: 'Jaipur, Rajasthan',
    expectedGuests: 350,
    confirmedGuests: 290,
    budget: {
      total: 6500000,
      spent: 4200000,
      currency: 'INR',
    },
    summary: 'A 3-day luxury destination wedding at Jai Mahal Palace with 350 guests across 4 royal ceremonies.',
  });

  // Vendors
  const venueVendor = await Vendor.create({
    event: wedding._id,
    name: 'Jai Mahal Palace & Heritage Gardens',
    category: 'venue',
    status: 'confirmed',
    contact: { name: 'Vikramaditya Singh', phone: '+91 98290 12345', email: 'banquets@jaimahal.com' },
    notes: 'Courtyard + Grand Ballroom reserved for 3 days. Deposit paid.',
  });

  const cateringVendor = await Vendor.create({
    event: wedding._id,
    name: 'Royal Rajputana Culinary Masters',
    category: 'catering',
    status: 'confirmed',
    contact: { name: 'Chef Sanjeev Rathore', phone: '+91 98290 54321', email: 'catering@rajputana.in' },
    notes: 'Multi-cuisine menu with Rajasthani live stations and continental banquet.',
  });

  const decorVendor = await Vendor.create({
    event: wedding._id,
    name: 'Marigold & Silk Decor Studio',
    category: 'decor',
    status: 'negotiating',
    contact: { name: 'Priya Mehra', phone: '+91 98111 22334', email: 'priya@marigolddecor.com' },
    notes: 'Awaiting revised lighting and floral stage quote.',
  });

  const photoVendor = await Vendor.create({
    event: wedding._id,
    name: 'The Heritage Lens Wedding Photography',
    category: 'photography',
    status: 'confirmed',
    contact: { name: 'Arjun Kulkarni', phone: '+91 98200 99887', email: 'arjun@heritagelens.com' },
    notes: 'Team of 6 photographers + 2 drone pilots booked.',
  });

  const djVendor = await Vendor.create({
    event: wedding._id,
    name: 'Desert Beats DJ & Live Ensemble',
    category: 'entertainment',
    status: 'shortlisted',
    contact: { name: 'DJ Rohan', phone: '+91 99887 66554' },
    notes: 'Proposed set for Sangeet night with Sufi opening act.',
  });

  const transportVendor = await Vendor.create({
    event: wedding._id,
    name: 'Jaipur Heritage Fleet & Shuttles',
    category: 'transport',
    status: 'shortlisted',
    contact: { name: 'Ramesh Choudhary', phone: '+91 94140 11223' },
    notes: 'Can currently provide 4 luxury tempo travelers (80 capacity max).',
  });

  // SubEvents
  const sangeetDate = new Date(weddingStartDate);
  const mehendiDate = new Date(weddingStartDate.getTime() - 24 * 60 * 60 * 1000);
  const pherasDate = new Date(weddingStartDate.getTime() + 24 * 60 * 60 * 1000);
  const receptionDate = new Date(weddingStartDate.getTime() + 48 * 60 * 60 * 1000);

  const mehendi = await SubEvent.create({
    event: wedding._id,
    name: 'Mehendi & Welcome Brunch',
    date: mehendiDate,
    startTime: '11:00',
    endTime: '16:00',
    expectedGuests: 200,
    venueId: venueVendor._id,
  });

  const sangeet = await SubEvent.create({
    event: wedding._id,
    name: 'Sangeet & Cocktail Gala',
    date: sangeetDate,
    startTime: '19:00',
    endTime: '01:00',
    expectedGuests: 350,
    venueId: venueVendor._id,
  });

  const pheras = await SubEvent.create({
    event: wedding._id,
    name: 'Vedic Pheras & Wedding Ceremony',
    date: pherasDate,
    startTime: '17:00',
    endTime: '21:30',
    expectedGuests: 350,
    venueId: venueVendor._id,
  });

  const reception = await SubEvent.create({
    event: wedding._id,
    name: 'Royal Reception Dinner',
    date: receptionDate,
    startTime: '20:00',
    endTime: '00:00',
    expectedGuests: 400,
    venueId: venueVendor._id,
  });

  // Guest Groups
  const brideGroup = await GuestGroup.create({
    event: wedding._id,
    label: 'Bride Family & Relatives (Delhi)',
    count: 120,
    arrivalCity: 'Jaipur',
    needsAccommodation: true,
    needsTransport: true,
    arrivalInfo: 'Arriving by Vande Bharat & Air India flights on Mehendi morning.',
    subEventsAttending: [mehendi._id, sangeet._id, pheras._id, reception._id],
  });

  const groomGroup = await GuestGroup.create({
    event: wedding._id,
    label: 'Groom Family & Relatives (Mumbai)',
    count: 140,
    arrivalCity: 'Jaipur',
    needsAccommodation: true,
    needsTransport: true,
    arrivalInfo: 'Charter flight and group trains arriving Thursday afternoon.',
    subEventsAttending: [mehendi._id, sangeet._id, pheras._id, reception._id],
  });

  const friendsGroup = await GuestGroup.create({
    event: wedding._id,
    label: 'College & Corporate Friends',
    count: 90,
    arrivalCity: 'Jaipur',
    needsAccommodation: false,
    needsTransport: true,
    arrivalInfo: 'Self-arranged stay at nearby hotels; shuttle required for venue transfers.',
    subEventsAttending: [sangeet._id, reception._id],
  });

  // Requirements
  await Requirement.create({
    event: wedding._id,
    type: 'vehicle_capacity',
    required: 350,
    provided: 160, // Deficit: 190 seats
    sourceRef: 'Guest group transport requests vs Jaipur Heritage Fleet quote',
  });

  await Requirement.create({
    event: wedding._id,
    type: 'room_capacity',
    required: 260,
    provided: 260,
    sourceRef: 'Jai Mahal Palace room blocks',
  });

  await Requirement.create({
    event: wedding._id,
    type: 'catering_headcount',
    required: 350,
    provided: 350,
    sourceRef: 'Royal Rajputana Catering contract',
  });

  // Tasks
  const taskVenueLayout = await Task.create({
    event: wedding._id,
    subEvent: sangeet._id,
    title: 'Approve Sangeet Stage & Dancefloor Layout',
    category: 'venue',
    status: 'done',
    priority: 'high',
    dueDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    assignee: 'Vikram / Aditi',
  });

  const taskSoundQuote = await Task.create({
    event: wedding._id,
    subEvent: sangeet._id,
    title: 'Finalize DJ & Sound Tech Rider for Sangeet',
    category: 'entertainment',
    status: 'in_progress',
    priority: 'high',
    dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
    assignee: 'DJ Rohan',
    dependsOn: [taskVenueLayout._id],
  });

  const taskTransport = await Task.create({
    event: wedding._id,
    title: 'Book 4 Additional Tempo Travelers for Airport Shuttles',
    category: 'transport',
    status: 'blocked',
    priority: 'critical',
    dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
    assignee: 'Ramesh Transport',
    blockedReason: 'Awaiting confirmed flight roster from Groom side family coordinator.',
  });

  const taskDecorContract = await Task.create({
    event: wedding._id,
    title: 'Sign Mandap & Floral Decor Agreement',
    category: 'decor',
    status: 'in_progress',
    priority: 'high',
    dueDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
    assignee: 'Priya Mehra',
  });

  const taskDietary = await Task.create({
    event: wedding._id,
    title: 'Collate Special Dietary Requests (Jain & Vegan)',
    category: 'catering',
    status: 'todo',
    priority: 'medium',
    dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    assignee: 'Aditi Sharma',
  });

  // Pre-seed Conversation & Chat Turn
  const conv = await Conversation.create({
    event: wedding._id,
    messages: [
      {
        role: 'user',
        content: 'Hi! Jai Mahal venue is locked in for 3 days. Decor vendor Priya is still negotiating. Also transport fleet can only give 160 seats right now.',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
      {
        role: 'assistant',
        content: 'I have logged your updates:\n- **Venue**: Confirmed at **Jai Mahal Palace**.\n- **Decor**: Marked **Marigold & Silk Decor Studio** as negotiating.\n- **Transport Warning**: Current transport capacity (160 seats) has a **190 guest deficit** against the total 350 guests requiring transit.\n\nI have generated action proposals below for your confirmation.',
        proposedActions: [
          {
            actionId: crypto.randomUUID(),
            type: 'create_task',
            description: 'Source additional transport vendors to cover 190 guest deficit',
            payload: {
              title: 'Source backup transport vendor for 190 seats',
              category: 'transport',
              priority: 'critical',
            },
            status: 'accepted',
            impact: {
              severity: 'critical',
              summary: 'Resolves the major airport transit capacity bottleneck before arrival day.',
            },
          },
        ],
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000 + 1000),
      },
    ],
  });

  // Evaluate initial risks and readiness
  await riskEngine.evaluateEventRisks(demoUser._id, wedding._id);
  const readiness = await readinessEngine.calculateEventReadiness(demoUser._id, wedding._id);

  // Seed Activity Logs
  await ActivityLog.create({
    event: wedding._id,
    actor: 'user',
    actorId: demoUser._id,
    action: 'event.created',
    entityKind: 'Event',
    entityId: wedding._id,
    summary: 'Created event "The Royal Jaipur Wedding: Aarav & Ananya"',
    createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
  });

  await ActivityLog.create({
    event: wedding._id,
    actor: 'user',
    actorId: demoUser._id,
    action: 'vendor.confirmed',
    entityKind: 'Vendor',
    entityId: venueVendor._id,
    summary: 'Confirmed venue vendor "Jai Mahal Palace & Heritage Gardens"',
    createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
  });

  // Seed Notifications
  await Notification.create({
    event: wedding._id,
    type: 'risk_alert',
    title: 'Transport Capacity Deficit: 190 guests unallocated',
    body: 'Current fleet covers 160 of 350 guests. Urgent backup vendor booking required.',
    read: false,
    createdAt: new Date(now.getTime() - 30 * 60 * 1000),
  });

  await Notification.create({
    event: wedding._id,
    type: 'deadline_reminder',
    title: 'Task Due in 2 Days: "Book 4 Additional Tempo Travelers"',
    body: 'Task is currently marked as BLOCKED.',
    read: false,
    createdAt: new Date(now.getTime() - 15 * 60 * 1000),
  });

  // Seed Proactive Suggestions
  await Suggestion.create({
    event: wedding._id,
    title: 'Recommendation: Contract 2 Supplemental Bus Operators',
    reason: 'Transport capacity is currently short by 190 seats.',
    proposedActions: [
      {
        actionId: crypto.randomUUID(),
        type: 'create_task',
        description: 'Send RFQ to Rajasthan State Tourism luxury coach operators',
        payload: {
          title: 'Send RFQ for 4 x 45-seater luxury coaches',
          category: 'transport',
          priority: 'high',
        },
      },
    ],
    status: 'pending',
    createdBy: 'rule_engine',
  });

  logger.info('Scenario 1 (Royal Jaipur Wedding) seeded successfully', {
    eventId: wedding._id,
    readinessScore: readiness.score,
  });

  // ───────────────────────────────────────────────────────────────────────────
  // EVENT 2: Global Tech Summit (Bengaluru)
  // ───────────────────────────────────────────────────────────────────────────
  const summitStart = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);
  const summitEnd = new Date(now.getTime() + 47 * 24 * 60 * 60 * 1000);

  const summit = await Event.create({
    owner: demoUser._id,
    title: 'NextGen AI & Cloud Summit 2026',
    type: 'conference',
    status: 'planning',
    startDate: summitStart,
    endDate: summitEnd,
    city: 'Bengaluru, Karnataka',
    expectedGuests: 600,
    confirmedGuests: 450,
    budget: {
      total: 3500000,
      spent: 1800000,
      currency: 'INR',
    },
    summary: 'Premier annual enterprise AI and cloud engineering conference with 600 technical leaders.',
  });

  const summitVenue = await Vendor.create({
    event: summit._id,
    name: 'Bengaluru International Exhibition Centre (BIEC)',
    category: 'venue',
    status: 'confirmed',
    contact: { name: 'Manish Hegde', phone: '+91 80 2345 6789' },
  });

  const summitCatering = await Vendor.create({
    event: summit._id,
    name: 'TechBite Corporate Catering',
    category: 'catering',
    status: 'confirmed',
    contact: { name: 'Kavita Rao', phone: '+91 98450 11223' },
  });

  const summitAV = await Vendor.create({
    event: summit._id,
    name: 'PixelGrid Live AV & Keynote Streaming',
    category: 'entertainment',
    status: 'confirmed',
    contact: { name: 'Sunil Nair', phone: '+91 98455 33445' },
  });

  await SubEvent.create({
    event: summit._id,
    name: 'Keynote & AI Breakthrough Track',
    date: summitStart,
    startTime: '09:00',
    endTime: '13:00',
    expectedGuests: 600,
    venueId: summitVenue._id,
  });

  await SubEvent.create({
    event: summit._id,
    name: 'Deep-Dive Engineering Workshops',
    date: summitStart,
    startTime: '14:00',
    endTime: '18:00',
    expectedGuests: 400,
    venueId: summitVenue._id,
  });

  await Task.create({
    event: summit._id,
    title: 'Deliver Badge Printing Station to Venue',
    category: 'branding',
    status: 'todo',
    priority: 'medium',
    dueDate: new Date(summitStart.getTime() - 24 * 60 * 60 * 1000),
  });

  await Task.create({
    event: summit._id,
    title: 'Conduct Dry Run for 4K Keynote Livestream',
    category: 'entertainment',
    status: 'in_progress',
    priority: 'high',
    dueDate: new Date(summitStart.getTime() - 12 * 60 * 60 * 1000),
  });

  await riskEngine.evaluateEventRisks(demoUser._id, summit._id);
  const summitReadiness = await readinessEngine.calculateEventReadiness(demoUser._id, summit._id);

  logger.info('Scenario 2 (NextGen AI Summit) seeded successfully', {
    eventId: summit._id,
    readinessScore: summitReadiness.score,
  });

  console.log(`
================================================================================
🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!
================================================================================
Demo Credentials:
  Email:    ${demoEmail}
  Password: Password123!

Seeded Events:
  1. "${wedding.title}" (${wedding._id})
     - Type: ${wedding.type} | Readiness Score: ${readiness.score}/100 [${readiness.level}]
     - Sub-Events: 4 | Vendors: 6 | Tasks: 5 | Guest Groups: 3 | Requirements: 3
  2. "${summit.title}" (${summit._id})
     - Type: ${summit.type} | Readiness Score: ${summitReadiness.score}/100 [${summitReadiness.level}]
     - Sub-Events: 2 | Vendors: 3 | Tasks: 2
================================================================================
`);
};

// If run directly via CLI (node backend/src/seed/seed.js)
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error('Seed script failed', { error: err.message, stack: err.stack });
      process.exit(1);
    });
}
