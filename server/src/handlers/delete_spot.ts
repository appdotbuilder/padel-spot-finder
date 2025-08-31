import { db } from '../db';
import { spotsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteSpot(id: number): Promise<boolean> {
  try {
    // Check if the spot exists before attempting to delete
    const existingSpots = await db.select()
      .from(spotsTable)
      .where(eq(spotsTable.id, id))
      .execute();

    if (existingSpots.length === 0) {
      return false; // Spot not found
    }

    // Delete the spot from the database
    const result = await db.delete(spotsTable)
      .where(eq(spotsTable.id, id))
      .returning({ id: spotsTable.id })
      .execute();

    // Return true if a record was deleted
    return result.length > 0;
  } catch (error) {
    console.error('Spot deletion failed:', error);
    throw error;
  }
}