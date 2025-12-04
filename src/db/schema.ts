import { pgTable, text, integer, boolean, timestamp, uuid } from 'drizzle-orm/pg-core';

export const salesReps = pgTable('sales_reps', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    email: text('email'),
    createdAt: timestamp('created_at').defaultNow(),
});

export const audits = pgTable('audits', {
    id: uuid('id').defaultRandom().primaryKey(),

    // Identification (Clés de regroupement)
    managerEmail: text('manager_email').notNull(),
    salesRepName: text('sales_rep_name').notNull(), // Keep for backward compatibility
    salesRepId: uuid('sales_rep_id').references(() => salesReps.id),

    // Step 1: KPIs
    prospectingActions: integer('prospecting_actions').notNull(),
    discoveryMeetings: integer('discovery_meetings').notNull(),
    proposalsSent: integer('proposals_sent').notNull(),
    signedProposals: integer('signed_proposals').default(0),
    revenue: integer('revenue').default(0), // in euros

    // Step 2: Flash Test
    flashTestObjection: text('flash_test_objection'),
    flashTestPassed: boolean('flash_test_passed').default(false),

    // Step 3: Recognition
    recognitionNote: text('recognition_note'),

    // Result
    totalScore: integer('total_score').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
});
