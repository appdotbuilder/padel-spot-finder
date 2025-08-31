import { z } from 'zod';

// Skill level enum
export const skillLevelSchema = z.enum(['beginner', 'intermediate', 'advanced', 'professional']);
export type SkillLevel = z.infer<typeof skillLevelSchema>;

// Player schema for existing players in a spot
export const playerSchema = z.object({
  id: z.number(),
  name: z.string(),
  skill_level: skillLevelSchema,
});
export type Player = z.infer<typeof playerSchema>;

// Spot schema with proper numeric handling
export const spotSchema = z.object({
  id: z.number(),
  club_name: z.string(),
  date: z.coerce.date(), // Automatically converts string timestamps to Date objects
  time: z.string(), // Time stored as string (e.g., "14:30")
  court_number: z.string(),
  player_replaced: z.string(), // Name of the cancelled player
  cost: z.number().nonnegative(), // 0 for free spots, positive for paid
  is_free: z.boolean(), // Helper field to quickly identify free spots
  location_lat: z.number().nullable(), // GPS latitude for location-based filtering
  location_lng: z.number().nullable(), // GPS longitude for location-based filtering
  existing_players: z.array(playerSchema), // List of confirmed players
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});
export type Spot = z.infer<typeof spotSchema>;

// Input schema for creating spots
export const createSpotInputSchema = z.object({
  club_name: z.string().min(1, "Club name is required"),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid date format"),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format"),
  court_number: z.string().min(1, "Court number is required"),
  player_replaced: z.string().min(1, "Player replaced name is required"),
  cost: z.number().nonnegative(),
  is_free: z.boolean().default(true),
  location_lat: z.number().min(-90).max(90).nullable(),
  location_lng: z.number().min(-180).max(180).nullable(),
  existing_players: z.array(z.object({
    name: z.string(),
    skill_level: skillLevelSchema,
  })).default([]),
});
export type CreateSpotInput = z.infer<typeof createSpotInputSchema>;

// Input schema for updating spots
export const updateSpotInputSchema = z.object({
  id: z.number(),
  club_name: z.string().optional(),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid date format").optional(),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format").optional(),
  court_number: z.string().optional(),
  player_replaced: z.string().optional(),
  cost: z.number().nonnegative().optional(),
  is_free: z.boolean().optional(),
  location_lat: z.number().min(-90).max(90).nullable().optional(),
  location_lng: z.number().min(-180).max(180).nullable().optional(),
});
export type UpdateSpotInput = z.infer<typeof updateSpotInputSchema>;

// Filter schema for browsing spots
export const spotFilterSchema = z.object({
  club_name: z.string().optional(),
  date_from: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid date format").optional(),
  date_to: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid date format").optional(),
  skill_level: skillLevelSchema.optional(),
  is_free: z.boolean().optional(),
  max_cost: z.number().nonnegative().optional(),
  location_lat: z.number().min(-90).max(90).optional(), // User's location for nearby search
  location_lng: z.number().min(-180).max(180).optional(), // User's location for nearby search
  radius_km: z.number().positive().default(10), // Search radius in kilometers
}).optional();
export type SpotFilter = z.infer<typeof spotFilterSchema>;

// Response schema for spot listings with distance
export const spotWithDistanceSchema = spotSchema.extend({
  distance_km: z.number().nullable(), // Distance from user's location in kilometers
});
export type SpotWithDistance = z.infer<typeof spotWithDistanceSchema>;