import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { spotsTable } from '../db/schema';
import { type UpdateSpotInput, type CreateSpotInput } from '../schema';
import { updateSpot } from '../handlers/update_spot';
import { eq } from 'drizzle-orm';

// Helper function to create a test spot
const createTestSpot = async () => {
  const testSpotData = {
    club_name: 'Test Club',
    date: new Date('2024-12-15T14:30:00Z'),
    time: '14:30',
    court_number: 'Court 1',
    player_replaced: 'Original Player',
    cost: '25.50', // Stored as string in database
    is_free: false,
    location_lat: '40.7128', // Stored as string in database
    location_lng: '-74.0060', // Stored as string in database
    existing_players: [
      { name: 'Player 1', skill_level: 'intermediate' },
      { name: 'Player 2', skill_level: 'advanced' }
    ],
    created_at: new Date(),
    updated_at: new Date()
  };

  const result = await db.insert(spotsTable)
    .values(testSpotData)
    .returning()
    .execute();

  return result[0];
};

describe('updateSpot', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a spot with all fields', async () => {
    // Create a test spot first
    const originalSpot = await createTestSpot();

    const updateInput: UpdateSpotInput = {
      id: originalSpot.id,
      club_name: 'Updated Club',
      date: '2024-12-16T15:30:00Z',
      time: '15:30',
      court_number: 'Court 2',
      player_replaced: 'Updated Player',
      cost: 30.75,
      is_free: true,
      location_lat: 41.8781,
      location_lng: -87.6298
    };

    const result = await updateSpot(updateInput);

    // Verify the result
    expect(result).toBeDefined();
    expect(result!.id).toEqual(originalSpot.id);
    expect(result!.club_name).toEqual('Updated Club');
    expect(result!.date).toEqual(new Date('2024-12-16T15:30:00Z'));
    expect(result!.time).toEqual('15:30');
    expect(result!.court_number).toEqual('Court 2');
    expect(result!.player_replaced).toEqual('Updated Player');
    expect(result!.cost).toEqual(30.75);
    expect(typeof result!.cost).toEqual('number');
    expect(result!.is_free).toEqual(true);
    expect(result!.location_lat).toEqual(41.8781);
    expect(result!.location_lng).toEqual(-87.6298);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at > originalSpot.updated_at).toBe(true);
  });

  it('should update only provided fields', async () => {
    // Create a test spot first
    const originalSpot = await createTestSpot();

    const updateInput: UpdateSpotInput = {
      id: originalSpot.id,
      club_name: 'Partially Updated Club',
      cost: 35.00
    };

    const result = await updateSpot(updateInput);

    // Verify only specified fields were updated
    expect(result).toBeDefined();
    expect(result!.club_name).toEqual('Partially Updated Club');
    expect(result!.cost).toEqual(35.00);
    expect(typeof result!.cost).toEqual('number');
    
    // Verify other fields remained unchanged
    expect(result!.time).toEqual('14:30');
    expect(result!.court_number).toEqual('Court 1');
    expect(result!.player_replaced).toEqual('Original Player');
    expect(result!.is_free).toEqual(false);
    expect(result!.location_lat).toEqual(40.7128);
    expect(result!.location_lng).toEqual(-74.0060);
    
    // Verify updated_at was changed
    expect(result!.updated_at > originalSpot.updated_at).toBe(true);
  });

  it('should handle null location values', async () => {
    // Create a test spot first
    const originalSpot = await createTestSpot();

    const updateInput: UpdateSpotInput = {
      id: originalSpot.id,
      location_lat: null,
      location_lng: null
    };

    const result = await updateSpot(updateInput);

    // Verify location fields were set to null
    expect(result).toBeDefined();
    expect(result!.location_lat).toBeNull();
    expect(result!.location_lng).toBeNull();
  });

  it('should return null for non-existent spot', async () => {
    const updateInput: UpdateSpotInput = {
      id: 99999, // Non-existent ID
      club_name: 'Non-existent Spot'
    };

    const result = await updateSpot(updateInput);

    expect(result).toBeNull();
  });

  it('should save updated spot to database', async () => {
    // Create a test spot first
    const originalSpot = await createTestSpot();

    const updateInput: UpdateSpotInput = {
      id: originalSpot.id,
      club_name: 'Database Updated Club',
      cost: 40.25,
      is_free: true
    };

    await updateSpot(updateInput);

    // Query the database directly to verify changes
    const spots = await db.select()
      .from(spotsTable)
      .where(eq(spotsTable.id, originalSpot.id))
      .execute();

    expect(spots).toHaveLength(1);
    const updatedSpotFromDb = spots[0];
    expect(updatedSpotFromDb.club_name).toEqual('Database Updated Club');
    expect(parseFloat(updatedSpotFromDb.cost)).toEqual(40.25);
    expect(updatedSpotFromDb.is_free).toEqual(true);
    expect(updatedSpotFromDb.updated_at > originalSpot.updated_at).toBe(true);
  });

  it('should preserve existing_players array structure', async () => {
    // Create a test spot first
    const originalSpot = await createTestSpot();

    const updateInput: UpdateSpotInput = {
      id: originalSpot.id,
      club_name: 'Updated with Players'
    };

    const result = await updateSpot(updateInput);

    // Verify existing_players array is properly structured
    expect(result).toBeDefined();
    expect(result!.existing_players).toHaveLength(2);
    expect(result!.existing_players[0]).toHaveProperty('id');
    expect(result!.existing_players[0]).toHaveProperty('name');
    expect(result!.existing_players[0]).toHaveProperty('skill_level');
    expect(result!.existing_players[0].name).toEqual('Player 1');
    expect(result!.existing_players[0].skill_level).toEqual('intermediate');
    expect(result!.existing_players[1].name).toEqual('Player 2');
    expect(result!.existing_players[1].skill_level).toEqual('advanced');
  });

  it('should handle zero cost correctly', async () => {
    // Create a test spot first
    const originalSpot = await createTestSpot();

    const updateInput: UpdateSpotInput = {
      id: originalSpot.id,
      cost: 0,
      is_free: true
    };

    const result = await updateSpot(updateInput);

    // Verify zero cost is handled properly
    expect(result).toBeDefined();
    expect(result!.cost).toEqual(0);
    expect(typeof result!.cost).toEqual('number');
    expect(result!.is_free).toEqual(true);
  });

  it('should handle date string conversion correctly', async () => {
    // Create a test spot first
    const originalSpot = await createTestSpot();

    const dateString = '2024-12-20T18:00:00Z';
    const updateInput: UpdateSpotInput = {
      id: originalSpot.id,
      date: dateString,
      time: '18:00'
    };

    const result = await updateSpot(updateInput);

    // Verify date conversion
    expect(result).toBeDefined();
    expect(result!.date).toEqual(new Date(dateString));
    expect(result!.time).toEqual('18:00');
  });
});