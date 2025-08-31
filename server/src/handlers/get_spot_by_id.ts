import { db } from '../db';
import { spotsTable } from '../db/schema';
import { type Spot } from '../schema';
import { eq } from 'drizzle-orm';

export const getSpotById = async (id: number): Promise<Spot | null> => {
  try {
    // Query database for the spot with the given ID
    const results = await db.select()
      .from(spotsTable)
      .where(eq(spotsTable.id, id))
      .execute();

    // Return null if no spot found
    if (results.length === 0) {
      return null;
    }

    const spot = results[0];

    // Convert numeric fields back to numbers and ensure proper typing
    return {
      id: spot.id,
      club_name: spot.club_name,
      date: spot.date,
      time: spot.time,
      court_number: spot.court_number,
      player_replaced: spot.player_replaced,
      cost: parseFloat(spot.cost), // Convert numeric string to number
      is_free: spot.is_free,
      location_lat: spot.location_lat ? parseFloat(spot.location_lat) : null, // Convert numeric string to number
      location_lng: spot.location_lng ? parseFloat(spot.location_lng) : null, // Convert numeric string to number
      existing_players: spot.existing_players.map(player => ({
        id: Math.floor(Math.random() * 1000000), // Generate ID for existing players since they're stored as JSON
        name: player.name,
        skill_level: player.skill_level as any, // Type assertion for skill level enum
      })),
      created_at: spot.created_at,
      updated_at: spot.updated_at,
    };
  } catch (error) {
    console.error('Failed to get spot by ID:', error);
    throw error;
  }
};