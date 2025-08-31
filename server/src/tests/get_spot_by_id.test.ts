import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { spotsTable } from '../db/schema';
import { getSpotById } from '../handlers/get_spot_by_id';

describe('getSpotById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a spot when found', async () => {
    // Create a test spot in the database
    const testSpot = {
      club_name: 'Test Padel Club',
      date: new Date('2024-01-15T14:30:00Z'),
      time: '14:30',
      court_number: 'Court 1',
      player_replaced: 'John Doe',
      cost: '25.50', // Stored as string for numeric column
      is_free: false,
      location_lat: '40.4168', // Stored as string for numeric column
      location_lng: '-3.7038', // Stored as string for numeric column
      existing_players: [
        { name: 'Alice Johnson', skill_level: 'intermediate' },
        { name: 'Bob Smith', skill_level: 'beginner' }
      ],
    };

    const [createdSpot] = await db.insert(spotsTable)
      .values(testSpot)
      .returning()
      .execute();

    // Test the handler
    const result = await getSpotById(createdSpot.id);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toBe(createdSpot.id);
    expect(result!.club_name).toBe('Test Padel Club');
    expect(result!.date).toEqual(new Date('2024-01-15T14:30:00Z'));
    expect(result!.time).toBe('14:30');
    expect(result!.court_number).toBe('Court 1');
    expect(result!.player_replaced).toBe('John Doe');
    expect(result!.cost).toBe(25.50); // Converted back to number
    expect(typeof result!.cost).toBe('number');
    expect(result!.is_free).toBe(false);
    expect(result!.location_lat).toBe(40.4168); // Converted back to number
    expect(result!.location_lng).toBe(-3.7038); // Converted back to number
    expect(typeof result!.location_lat).toBe('number');
    expect(typeof result!.location_lng).toBe('number');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should handle existing players correctly', async () => {
    // Create a test spot with multiple existing players
    const testSpot = {
      club_name: 'Players Test Club',
      date: new Date('2024-01-20T16:00:00Z'),
      time: '16:00',
      court_number: 'Court 2',
      player_replaced: 'Maria Garcia',
      cost: '0', // Free spot
      is_free: true,
      location_lat: null,
      location_lng: null,
      existing_players: [
        { name: 'Carlos Rodriguez', skill_level: 'advanced' },
        { name: 'Ana Martinez', skill_level: 'professional' },
        { name: 'Luis Fernandez', skill_level: 'intermediate' }
      ],
    };

    const [createdSpot] = await db.insert(spotsTable)
      .values(testSpot)
      .returning()
      .execute();

    const result = await getSpotById(createdSpot.id);

    expect(result).not.toBeNull();
    expect(result!.existing_players).toHaveLength(3);
    
    // Check each player has proper structure
    result!.existing_players.forEach(player => {
      expect(player.id).toBeTypeOf('number');
      expect(player.name).toBeTypeOf('string');
      expect(player.skill_level).toBeTypeOf('string');
    });

    // Check specific player data
    expect(result!.existing_players[0].name).toBe('Carlos Rodriguez');
    expect(result!.existing_players[0].skill_level).toBe('advanced');
    expect(result!.existing_players[1].name).toBe('Ana Martinez');
    expect(result!.existing_players[1].skill_level).toBe('professional');
    expect(result!.existing_players[2].name).toBe('Luis Fernandez');
    expect(result!.existing_players[2].skill_level).toBe('intermediate');
  });

  it('should handle null location coordinates', async () => {
    // Create a spot without location data
    const testSpot = {
      club_name: 'No Location Club',
      date: new Date('2024-01-25T10:00:00Z'),
      time: '10:00',
      court_number: 'Court 3',
      player_replaced: 'Test Player',
      cost: '15.00',
      is_free: false,
      location_lat: null,
      location_lng: null,
      existing_players: [],
    };

    const [createdSpot] = await db.insert(spotsTable)
      .values(testSpot)
      .returning()
      .execute();

    const result = await getSpotById(createdSpot.id);

    expect(result).not.toBeNull();
    expect(result!.location_lat).toBeNull();
    expect(result!.location_lng).toBeNull();
    expect(result!.existing_players).toHaveLength(0);
    expect(result!.cost).toBe(15.00);
    expect(typeof result!.cost).toBe('number');
  });

  it('should return null when spot not found', async () => {
    // Test with a non-existent ID
    const result = await getSpotById(99999);

    expect(result).toBeNull();
  });

  it('should handle edge cases with numeric conversions', async () => {
    // Create a spot with zero cost and precise coordinates
    const testSpot = {
      club_name: 'Edge Case Club',
      date: new Date('2024-02-01T08:15:00Z'),
      time: '08:15',
      court_number: 'Court A',
      player_replaced: 'Edge Case Player',
      cost: '0.00', // Zero cost
      is_free: true,
      location_lat: '0.123456', // Precise latitude
      location_lng: '-0.987654', // Precise longitude
      existing_players: [
        { name: 'Single Player', skill_level: 'beginner' }
      ],
    };

    const [createdSpot] = await db.insert(spotsTable)
      .values(testSpot)
      .returning()
      .execute();

    const result = await getSpotById(createdSpot.id);

    expect(result).not.toBeNull();
    expect(result!.cost).toBe(0);
    expect(typeof result!.cost).toBe('number');
    expect(result!.location_lat).toBe(0.123456);
    expect(result!.location_lng).toBe(-0.987654);
    expect(typeof result!.location_lat).toBe('number');
    expect(typeof result!.location_lng).toBe('number');
    expect(result!.existing_players).toHaveLength(1);
    expect(result!.existing_players[0].name).toBe('Single Player');
  });
});