import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum, jsonb } from 'drizzle-orm/pg-core';

// Skill level enum for PostgreSQL
export const skillLevelEnum = pgEnum('skill_level', ['beginner', 'intermediate', 'advanced', 'professional']);

// Players table - for storing player information
export const playersTable = pgTable('players', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  skill_level: skillLevelEnum('skill_level').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Spots table - main table for padel spot posts
export const spotsTable = pgTable('spots', {
  id: serial('id').primaryKey(),
  club_name: text('club_name').notNull(),
  date: timestamp('date').notNull(), // Date and time of the match
  time: text('time').notNull(), // Time stored as string (e.g., "14:30")
  court_number: text('court_number').notNull(),
  player_replaced: text('player_replaced').notNull(), // Name of cancelled player
  cost: numeric('cost', { precision: 10, scale: 2 }).notNull(), // Use numeric for monetary values
  is_free: boolean('is_free').default(true).notNull(),
  location_lat: numeric('location_lat', { precision: 10, scale: 8 }), // GPS latitude (nullable)
  location_lng: numeric('location_lng', { precision: 11, scale: 8 }), // GPS longitude (nullable)
  existing_players: jsonb('existing_players').notNull().$type<Array<{ name: string; skill_level: string }>>(), // JSON array of existing players
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types for the table schemas
export type Player = typeof playersTable.$inferSelect; // For SELECT operations
export type NewPlayer = typeof playersTable.$inferInsert; // For INSERT operations

export type Spot = typeof spotsTable.$inferSelect; // For SELECT operations
export type NewSpot = typeof spotsTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { 
  players: playersTable, 
  spots: spotsTable 
};