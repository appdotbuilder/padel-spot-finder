import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { spotsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteSpot } from '../handlers/delete_spot';

// Test spot data
const testSpotData = {
  club_name: 'Test Padel Club',
  date: new Date('2024-12-20T14:30:00Z'),
  time: '14:30',
  court_number: '1',
  player_replaced: 'John Doe',
  cost: '25.00',
  is_free: false,
  location_lat: '40.7128',
  location_lng: '-74.0060',
  existing_players: [
    { name: 'Alice Smith', skill_level: 'intermediate' },
    { name: 'Bob Johnson', skill_level: 'advanced' }
  ]
};

describe('deleteSpot', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing spot and return true', async () => {
    // Create a test spot first
    const insertResult = await db.insert(spotsTable)
      .values(testSpotData)
      .returning({ id: spotsTable.id })
      .execute();
    
    const spotId = insertResult[0].id;

    // Delete the spot
    const result = await deleteSpot(spotId);

    // Verify deletion was successful
    expect(result).toBe(true);

    // Verify the spot no longer exists in the database
    const remainingSpots = await db.select()
      .from(spotsTable)
      .where(eq(spotsTable.id, spotId))
      .execute();

    expect(remainingSpots).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent spot', async () => {
    const nonExistentId = 99999;

    // Attempt to delete non-existent spot
    const result = await deleteSpot(nonExistentId);

    // Verify deletion returned false
    expect(result).toBe(false);
  });

  it('should only delete the specified spot when multiple spots exist', async () => {
    // Create multiple test spots
    const spot1Data = { ...testSpotData, club_name: 'Club One' };
    const spot2Data = { ...testSpotData, club_name: 'Club Two' };
    const spot3Data = { ...testSpotData, club_name: 'Club Three' };

    const insertResults = await db.insert(spotsTable)
      .values([spot1Data, spot2Data, spot3Data])
      .returning({ id: spotsTable.id })
      .execute();

    const [spot1Id, spot2Id, spot3Id] = insertResults.map(r => r.id);

    // Delete only the middle spot
    const result = await deleteSpot(spot2Id);

    // Verify deletion was successful
    expect(result).toBe(true);

    // Verify only the correct spot was deleted
    const remainingSpots = await db.select()
      .from(spotsTable)
      .execute();

    expect(remainingSpots).toHaveLength(2);
    
    const remainingIds = remainingSpots.map(spot => spot.id);
    expect(remainingIds).toContain(spot1Id);
    expect(remainingIds).toContain(spot3Id);
    expect(remainingIds).not.toContain(spot2Id);
  });

  it('should handle deletion of spot with complex existing_players data', async () => {
    // Create spot with complex existing players data
    const complexSpotData = {
      ...testSpotData,
      existing_players: [
        { name: 'Player One', skill_level: 'beginner' },
        { name: 'Player Two', skill_level: 'intermediate' },
        { name: 'Player Three', skill_level: 'advanced' },
        { name: 'Player Four', skill_level: 'professional' }
      ]
    };

    const insertResult = await db.insert(spotsTable)
      .values(complexSpotData)
      .returning({ id: spotsTable.id })
      .execute();
    
    const spotId = insertResult[0].id;

    // Delete the spot
    const result = await deleteSpot(spotId);

    // Verify deletion was successful
    expect(result).toBe(true);

    // Verify the spot no longer exists
    const remainingSpots = await db.select()
      .from(spotsTable)
      .where(eq(spotsTable.id, spotId))
      .execute();

    expect(remainingSpots).toHaveLength(0);
  });

  it('should handle deletion of free spot correctly', async () => {
    // Create a free spot
    const freeSpotData = {
      ...testSpotData,
      cost: '0.00',
      is_free: true,
      club_name: 'Free Club'
    };

    const insertResult = await db.insert(spotsTable)
      .values(freeSpotData)
      .returning({ id: spotsTable.id })
      .execute();
    
    const spotId = insertResult[0].id;

    // Delete the free spot
    const result = await deleteSpot(spotId);

    // Verify deletion was successful
    expect(result).toBe(true);

    // Verify the spot no longer exists
    const remainingSpots = await db.select()
      .from(spotsTable)
      .where(eq(spotsTable.id, spotId))
      .execute();

    expect(remainingSpots).toHaveLength(0);
  });

  it('should handle deletion of spot with null location data', async () => {
    // Create spot with null location data
    const spotWithoutLocation = {
      ...testSpotData,
      location_lat: null,
      location_lng: null,
      club_name: 'No Location Club'
    };

    const insertResult = await db.insert(spotsTable)
      .values(spotWithoutLocation)
      .returning({ id: spotsTable.id })
      .execute();
    
    const spotId = insertResult[0].id;

    // Delete the spot
    const result = await deleteSpot(spotId);

    // Verify deletion was successful
    expect(result).toBe(true);

    // Verify the spot no longer exists
    const remainingSpots = await db.select()
      .from(spotsTable)
      .where(eq(spotsTable.id, spotId))
      .execute();

    expect(remainingSpots).toHaveLength(0);
  });
});