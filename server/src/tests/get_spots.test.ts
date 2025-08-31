import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { spotsTable } from '../db/schema';
import { type SpotFilter } from '../schema';
import { getSpots } from '../handlers/get_spots';

// Test data
const testSpots = [
  {
    club_name: 'Padel Club Madrid',
    date: new Date('2024-01-20T14:30:00Z'),
    time: '14:30',
    court_number: 'Court 3',
    player_replaced: 'Carlos Rodriguez',
    cost: '0',
    is_free: true,
    location_lat: '40.4168',
    location_lng: '-3.7038',
    existing_players: [
      { name: 'Ana Garcia', skill_level: 'intermediate' },
      { name: 'Miguel Torres', skill_level: 'advanced' },
    ],
  },
  {
    club_name: 'Barcelona Padel Center',
    date: new Date('2024-01-21T16:00:00Z'),
    time: '16:00',
    court_number: 'Court 1',
    player_replaced: 'Laura Fernandez',
    cost: '25.00',
    is_free: false,
    location_lat: '41.3851',
    location_lng: '2.1734',
    existing_players: [
      { name: 'David Lopez', skill_level: 'beginner' },
      { name: 'Sofia Martinez', skill_level: 'intermediate' },
    ],
  },
  {
    club_name: 'Valencia Sports Club',
    date: new Date('2024-01-22T18:00:00Z'),
    time: '18:00',
    court_number: 'Court 2',
    player_replaced: 'Pablo Sanchez',
    cost: '15.50',
    is_free: false,
    location_lat: null,
    location_lng: null,
    existing_players: [
      { name: 'Carmen Ruiz', skill_level: 'professional' },
      { name: 'Roberto Vega', skill_level: 'advanced' },
    ],
  },
];

describe('getSpots', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  beforeEach(async () => {
    // Insert test data
    await db.insert(spotsTable).values(testSpots).execute();
  });

  it('should return all spots without filters', async () => {
    const result = await getSpots();

    expect(result).toHaveLength(3);
    expect(result[0].club_name).toEqual('Padel Club Madrid');
    expect(result[0].cost).toEqual(0);
    expect(typeof result[0].cost).toBe('number');
    expect(result[0].is_free).toBe(true);
    expect(result[0].existing_players).toHaveLength(2);
    expect(result[0].existing_players[0].name).toEqual('Ana Garcia');
    expect(result[0].distance_km).toBe(null);
  });

  it('should filter by club name', async () => {
    const filter: SpotFilter = {
      club_name: 'Barcelona',
      radius_km: 10,
    };

    const result = await getSpots(filter);

    expect(result).toHaveLength(1);
    expect(result[0].club_name).toEqual('Barcelona Padel Center');
  });

  it('should filter by date range', async () => {
    const filter: SpotFilter = {
      date_from: '2024-01-21',
      date_to: '2024-01-22',
      radius_km: 10,
    };

    const result = await getSpots(filter);

    expect(result).toHaveLength(2);
    expect(result[0].club_name).toEqual('Barcelona Padel Center');
    expect(result[1].club_name).toEqual('Valencia Sports Club');
  });

  it('should filter by free spots only', async () => {
    const filter: SpotFilter = {
      is_free: true,
      radius_km: 10,
    };

    const result = await getSpots(filter);

    expect(result).toHaveLength(1);
    expect(result[0].is_free).toBe(true);
    expect(result[0].cost).toEqual(0);
  });

  it('should filter by maximum cost', async () => {
    const filter: SpotFilter = {
      max_cost: 20,
      radius_km: 10,
    };

    const result = await getSpots(filter);

    expect(result).toHaveLength(2);
    expect(result.every(spot => spot.cost <= 20)).toBe(true);
  });

  it('should filter by skill level', async () => {
    const filter: SpotFilter = {
      skill_level: 'beginner',
      radius_km: 10,
    };

    const result = await getSpots(filter);

    expect(result).toHaveLength(1);
    expect(result[0].club_name).toEqual('Barcelona Padel Center');
    expect(result[0].existing_players.some(p => p.skill_level === 'beginner')).toBe(true);
  });

  it('should calculate distance and sort by proximity', async () => {
    // Madrid coordinates (close to first spot)
    const filter: SpotFilter = {
      location_lat: 40.4000,
      location_lng: -3.7000,
      radius_km: 1000, // Large radius to include all spots with coordinates
    };

    const result = await getSpots(filter);

    // Should include spots with coordinates, sorted by distance
    const spotsWithCoordinates = result.filter(s => s.distance_km !== null);
    expect(spotsWithCoordinates.length).toBeGreaterThanOrEqual(2);
    
    // First result should be Madrid (closer)
    expect(spotsWithCoordinates[0].club_name).toEqual('Padel Club Madrid');
    expect(spotsWithCoordinates[0].distance_km).toBeLessThan(10); // Should be very close
    
    // Second result should be Barcelona (farther)
    expect(spotsWithCoordinates[1].club_name).toEqual('Barcelona Padel Center');
    expect(spotsWithCoordinates[1].distance_km).toBeGreaterThan(400); // Should be much farther
    
    // Valencia spot should be included but at the end (null distance)
    const valenciaSpot = result.find(s => s.club_name === 'Valencia Sports Club');
    expect(valenciaSpot).toBeDefined();
    expect(valenciaSpot!.distance_km).toBe(null);
  });

  it('should filter by radius', async () => {
    // Use very small radius to exclude distant spots
    const filter: SpotFilter = {
      location_lat: 40.4000,
      location_lng: -3.7000,
      radius_km: 100, // Small radius to only include Madrid
    };

    const result = await getSpots(filter);

    // Should only include Madrid spot within radius, plus Valencia (no coordinates)
    expect(result.length).toBeGreaterThanOrEqual(1);
    
    const madridSpot = result.find(s => s.club_name === 'Padel Club Madrid');
    expect(madridSpot).toBeDefined();
    expect(madridSpot!.distance_km).toBeLessThan(100);
    
    // Barcelona should be excluded (too far)
    const barcelonaSpot = result.find(s => s.club_name === 'Barcelona Padel Center');
    expect(barcelonaSpot).toBeUndefined();
  });

  it('should handle spots without location coordinates', async () => {
    const filter: SpotFilter = {
      location_lat: 40.4000,
      location_lng: -3.7000,
      radius_km: 1000, // Large radius to include all spots
    };

    const result = await getSpots(filter);

    // Should still include Valencia spot (no coordinates) but at the end
    expect(result).toHaveLength(3);
    
    // Valencia should be last (distance_km is null)
    const valenciaSpot = result.find(s => s.club_name === 'Valencia Sports Club');
    expect(valenciaSpot).toBeDefined();
    expect(valenciaSpot!.distance_km).toBe(null);
  });

  it('should handle combined filters', async () => {
    const filter: SpotFilter = {
      is_free: false,
      max_cost: 30, // Increase to include Barcelona spot (cost: 25)
      skill_level: 'intermediate',
      radius_km: 10,
    };

    const result = await getSpots(filter);

    expect(result).toHaveLength(1);
    expect(result[0].club_name).toEqual('Barcelona Padel Center');
    expect(result[0].is_free).toBe(false);
    expect(result[0].cost).toBeLessThanOrEqual(30);
    expect(result[0].existing_players.some(p => p.skill_level === 'intermediate')).toBe(true);
  });

  it('should handle numeric field conversions correctly', async () => {
    const result = await getSpots();

    // Verify cost conversion
    expect(typeof result[0].cost).toBe('number');
    expect(typeof result[1].cost).toBe('number');
    
    // Verify location coordinate conversions
    expect(typeof result[0].location_lat).toBe('number');
    expect(typeof result[0].location_lng).toBe('number');
    
    // Verify null handling
    expect(result[2].location_lat).toBe(null);
    expect(result[2].location_lng).toBe(null);
  });

  it('should handle empty results', async () => {
    const filter: SpotFilter = {
      club_name: 'Nonexistent Club',
      radius_km: 10,
    };

    const result = await getSpots(filter);

    expect(result).toHaveLength(0);
  });
});