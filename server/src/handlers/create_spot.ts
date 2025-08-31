import { db } from '../db';
import { spotsTable } from '../db/schema';
import { type CreateSpotInput, type Spot } from '../schema';

export const createSpot = async (input: CreateSpotInput): Promise<Spot> => {
  try {
    // Insert spot record
    const result = await db.insert(spotsTable)
      .values({
        club_name: input.club_name,
        date: new Date(input.date), // Convert string to Date object
        time: input.time,
        court_number: input.court_number,
        player_replaced: input.player_replaced,
        cost: input.cost.toString(), // Convert number to string for numeric column
        is_free: input.is_free,
        location_lat: input.location_lat ? input.location_lat.toString() : null, // Convert number to string for numeric column
        location_lng: input.location_lng ? input.location_lng.toString() : null, // Convert number to string for numeric column
        existing_players: input.existing_players, // JSON array - no conversion needed
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers and format existing_players before returning
    const spot = result[0];
    return {
      ...spot,
      cost: parseFloat(spot.cost), // Convert string back to number
      location_lat: spot.location_lat ? parseFloat(spot.location_lat) : null, // Convert string back to number
      location_lng: spot.location_lng ? parseFloat(spot.location_lng) : null, // Convert string back to number
      existing_players: spot.existing_players.map((player, index) => ({
        id: index + 1, // Generate sequential IDs for existing players
        name: player.name,
        skill_level: player.skill_level as any, // Type assertion for enum
      })),
    };
  } catch (error) {
    console.error('Spot creation failed:', error);
    throw error;
  }
};