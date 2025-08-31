import { db } from '../db';
import { spotsTable } from '../db/schema';
import { type UpdateSpotInput, type Spot } from '../schema';
import { eq } from 'drizzle-orm';

export const updateSpot = async (input: UpdateSpotInput): Promise<Spot | null> => {
  try {
    // First check if the spot exists
    const existingSpot = await db.select()
      .from(spotsTable)
      .where(eq(spotsTable.id, input.id))
      .execute();

    if (existingSpot.length === 0) {
      return null;
    }

    // Build update object with only provided fields
    const updateData: Record<string, any> = {
      updated_at: new Date() // Always update the timestamp
    };

    if (input.club_name !== undefined) {
      updateData['club_name'] = input.club_name;
    }
    
    if (input.date !== undefined) {
      updateData['date'] = new Date(input.date);
    }
    
    if (input.time !== undefined) {
      updateData['time'] = input.time;
    }
    
    if (input.court_number !== undefined) {
      updateData['court_number'] = input.court_number;
    }
    
    if (input.player_replaced !== undefined) {
      updateData['player_replaced'] = input.player_replaced;
    }
    
    if (input.cost !== undefined) {
      updateData['cost'] = input.cost.toString(); // Convert number to string for numeric column
    }
    
    if (input.is_free !== undefined) {
      updateData['is_free'] = input.is_free;
    }
    
    if (input.location_lat !== undefined) {
      updateData['location_lat'] = input.location_lat?.toString() || null; // Convert number to string for numeric column
    }
    
    if (input.location_lng !== undefined) {
      updateData['location_lng'] = input.location_lng?.toString() || null; // Convert number to string for numeric column
    }

    // Update the spot in the database
    const result = await db.update(spotsTable)
      .set(updateData)
      .where(eq(spotsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      return null;
    }

    // Convert numeric fields back to numbers before returning
    const updatedSpot = result[0];
    return {
      ...updatedSpot,
      date: updatedSpot.date, // Already a Date object
      cost: parseFloat(updatedSpot.cost), // Convert string back to number
      location_lat: updatedSpot.location_lat ? parseFloat(updatedSpot.location_lat) : null,
      location_lng: updatedSpot.location_lng ? parseFloat(updatedSpot.location_lng) : null,
      existing_players: (updatedSpot.existing_players as any[]).map((player, index) => ({
        id: index + 1, // Generate IDs for existing players array
        name: player.name,
        skill_level: player.skill_level as any
      }))
    };
  } catch (error) {
    console.error('Spot update failed:', error);
    throw error;
  }
};