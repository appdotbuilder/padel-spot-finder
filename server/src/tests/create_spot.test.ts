import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { spotsTable } from '../db/schema';
import { type CreateSpotInput } from '../schema';
import { createSpot } from '../handlers/create_spot';
import { eq } from 'drizzle-orm';

// Complete test input with all required fields
const testInput: CreateSpotInput = {
  club_name: 'Padel Center Madrid',
  date: '2024-01-15T14:30:00Z',
  time: '14:30',
  court_number: 'Court 1',
  player_replaced: 'John Doe',
  cost: 25.50,
  is_free: false,
  location_lat: 40.4168,
  location_lng: -3.7038,
  existing_players: [
    { name: 'Alice Smith', skill_level: 'intermediate' },
    { name: 'Bob Johnson', skill_level: 'advanced' }
  ]
};

// Test input for free spot
const freeSpotInput: CreateSpotInput = {
  club_name: 'Community Padel Club',
  date: '2024-01-20T10:00:00Z',
  time: '10:00',
  court_number: 'Court 2',
  player_replaced: 'Jane Doe',
  cost: 0,
  is_free: true,
  location_lat: null,
  location_lng: null,
  existing_players: []
};

describe('createSpot', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a spot with all fields', async () => {
    const result = await createSpot(testInput);

    // Basic field validation
    expect(result.club_name).toEqual('Padel Center Madrid');
    expect(result.date).toBeInstanceOf(Date);
    expect(result.date.toISOString()).toEqual('2024-01-15T14:30:00.000Z');
    expect(result.time).toEqual('14:30');
    expect(result.court_number).toEqual('Court 1');
    expect(result.player_replaced).toEqual('John Doe');
    expect(typeof result.cost).toBe('number');
    expect(result.cost).toEqual(25.50);
    expect(result.is_free).toEqual(false);
    expect(typeof result.location_lat).toBe('number');
    expect(result.location_lat).toEqual(40.4168);
    expect(typeof result.location_lng).toBe('number');
    expect(result.location_lng).toEqual(-3.7038);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should handle existing players correctly', async () => {
    const result = await createSpot(testInput);

    expect(result.existing_players).toHaveLength(2);
    expect(result.existing_players[0]).toEqual({
      id: 1,
      name: 'Alice Smith',
      skill_level: 'intermediate'
    });
    expect(result.existing_players[1]).toEqual({
      id: 2,
      name: 'Bob Johnson',
      skill_level: 'advanced'
    });
  });

  it('should save spot to database correctly', async () => {
    const result = await createSpot(testInput);

    // Query using proper drizzle syntax
    const spots = await db.select()
      .from(spotsTable)
      .where(eq(spotsTable.id, result.id))
      .execute();

    expect(spots).toHaveLength(1);
    const savedSpot = spots[0];
    
    expect(savedSpot.club_name).toEqual('Padel Center Madrid');
    expect(savedSpot.date).toBeInstanceOf(Date);
    expect(savedSpot.time).toEqual('14:30');
    expect(savedSpot.court_number).toEqual('Court 1');
    expect(savedSpot.player_replaced).toEqual('John Doe');
    expect(parseFloat(savedSpot.cost)).toEqual(25.50);
    expect(savedSpot.is_free).toEqual(false);
    expect(parseFloat(savedSpot.location_lat!)).toEqual(40.4168);
    expect(parseFloat(savedSpot.location_lng!)).toEqual(-3.7038);
    expect(savedSpot.existing_players).toHaveLength(2);
    expect(savedSpot.created_at).toBeInstanceOf(Date);
    expect(savedSpot.updated_at).toBeInstanceOf(Date);
  });

  it('should create free spot with null location', async () => {
    const result = await createSpot(freeSpotInput);

    expect(result.club_name).toEqual('Community Padel Club');
    expect(result.cost).toEqual(0);
    expect(result.is_free).toEqual(true);
    expect(result.location_lat).toBeNull();
    expect(result.location_lng).toBeNull();
    expect(result.existing_players).toHaveLength(0);
  });

  it('should handle empty existing players array', async () => {
    const result = await createSpot(freeSpotInput);

    expect(result.existing_players).toEqual([]);
  });

  it('should convert date string to Date object', async () => {
    const result = await createSpot(testInput);

    expect(result.date).toBeInstanceOf(Date);
    expect(result.date.getFullYear()).toEqual(2024);
    expect(result.date.getMonth()).toEqual(0); // January is 0
    expect(result.date.getDate()).toEqual(15);
  });

  it('should handle numeric conversions correctly', async () => {
    const result = await createSpot(testInput);

    // Verify cost is returned as number
    expect(typeof result.cost).toBe('number');
    expect(result.cost).toEqual(25.50);

    // Verify location coordinates are returned as numbers
    expect(typeof result.location_lat).toBe('number');
    expect(typeof result.location_lng).toBe('number');
    expect(result.location_lat).toEqual(40.4168);
    expect(result.location_lng).toEqual(-3.7038);

    // Verify database stores them as strings (numeric columns)
    const spots = await db.select()
      .from(spotsTable)
      .where(eq(spotsTable.id, result.id))
      .execute();

    const savedSpot = spots[0];
    expect(typeof savedSpot.cost).toBe('string');
    expect(typeof savedSpot.location_lat).toBe('string');
    expect(typeof savedSpot.location_lng).toBe('string');
  });

  it('should assign proper IDs to existing players', async () => {
    const inputWithManyPlayers: CreateSpotInput = {
      ...testInput,
      existing_players: [
        { name: 'Player 1', skill_level: 'beginner' },
        { name: 'Player 2', skill_level: 'intermediate' },
        { name: 'Player 3', skill_level: 'advanced' }
      ]
    };

    const result = await createSpot(inputWithManyPlayers);

    expect(result.existing_players).toHaveLength(3);
    expect(result.existing_players[0].id).toEqual(1);
    expect(result.existing_players[1].id).toEqual(2);
    expect(result.existing_players[2].id).toEqual(3);
    expect(result.existing_players[0].name).toEqual('Player 1');
    expect(result.existing_players[1].name).toEqual('Player 2');
    expect(result.existing_players[2].name).toEqual('Player 3');
  });
});