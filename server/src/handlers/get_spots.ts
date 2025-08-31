import { db } from '../db';
import { spotsTable } from '../db/schema';
import { type SpotFilter, type SpotWithDistance } from '../schema';
import { sql, and, gte, lte, like, eq, SQL, desc } from 'drizzle-orm';

// Helper function to calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function getSpots(filter?: SpotFilter): Promise<SpotWithDistance[]> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (filter) {
      // Filter by club name (case-insensitive partial match)
      if (filter.club_name) {
        conditions.push(like(spotsTable.club_name, `%${filter.club_name}%`));
      }

      // Filter by date range
      if (filter.date_from) {
        const fromDate = new Date(filter.date_from);
        conditions.push(gte(spotsTable.date, fromDate));
      }

      if (filter.date_to) {
        const toDate = new Date(filter.date_to);
        // Set to end of day for inclusive range
        toDate.setHours(23, 59, 59, 999);
        conditions.push(lte(spotsTable.date, toDate));
      }

      // Filter by free spots
      if (filter.is_free !== undefined) {
        conditions.push(eq(spotsTable.is_free, filter.is_free));
      }

      // Filter by maximum cost
      if (filter.max_cost !== undefined) {
        conditions.push(lte(spotsTable.cost, filter.max_cost.toString()));
      }
    }

    // Build and execute the query
    let results;
    if (conditions.length === 0) {
      results = await db.select()
        .from(spotsTable)
        .orderBy(spotsTable.date, desc(spotsTable.created_at))
        .execute();
    } else if (conditions.length === 1) {
      results = await db.select()
        .from(spotsTable)
        .where(conditions[0])
        .orderBy(spotsTable.date, desc(spotsTable.created_at))
        .execute();
    } else {
      results = await db.select()
        .from(spotsTable)
        .where(and(...conditions))
        .orderBy(spotsTable.date, desc(spotsTable.created_at))
        .execute();
    }

    // Convert results to proper types and calculate distances
    const spots: SpotWithDistance[] = results.map(spot => {
      let distance_km: number | null = null;

      // Calculate distance if both user location and spot location are provided
      if (filter?.location_lat && filter?.location_lng && 
          spot.location_lat && spot.location_lng) {
        const spotLat = parseFloat(spot.location_lat);
        const spotLng = parseFloat(spot.location_lng);
        distance_km = calculateDistance(
          filter.location_lat,
          filter.location_lng,
          spotLat,
          spotLng
        );
      }

      return {
        id: spot.id,
        club_name: spot.club_name,
        date: spot.date,
        time: spot.time,
        court_number: spot.court_number,
        player_replaced: spot.player_replaced,
        cost: parseFloat(spot.cost), // Convert numeric to number
        is_free: spot.is_free,
        location_lat: spot.location_lat ? parseFloat(spot.location_lat) : null,
        location_lng: spot.location_lng ? parseFloat(spot.location_lng) : null,
        existing_players: (spot.existing_players as Array<{ name: string; skill_level: string }>).map((player, index) => ({
          id: index + 1, // Generate IDs for existing players since they're stored as JSON
          name: player.name,
          skill_level: player.skill_level as any, // Type assertion for skill level enum
        })),
        distance_km,
        created_at: spot.created_at,
        updated_at: spot.updated_at,
      };
    });

    // Filter by location radius if coordinates are provided
    let filteredSpots = spots;
    if (filter?.location_lat && filter?.location_lng && filter?.radius_km) {
      filteredSpots = spots.filter(spot => 
        spot.distance_km === null || spot.distance_km <= filter.radius_km!
      );
    }

    // Filter by skill level (check if any existing player matches the skill level)
    if (filter?.skill_level) {
      filteredSpots = filteredSpots.filter(spot =>
        spot.existing_players.some(player => player.skill_level === filter.skill_level)
      );
    }

    // Sort by distance if location filtering is enabled
    if (filter?.location_lat && filter?.location_lng) {
      filteredSpots.sort((a, b) => {
        // Spots without location go to the end
        if (a.distance_km === null && b.distance_km === null) return 0;
        if (a.distance_km === null) return 1;
        if (b.distance_km === null) return -1;
        return a.distance_km - b.distance_km;
      });
    }

    return filteredSpots;
  } catch (error) {
    console.error('Get spots failed:', error);
    throw error;
  }
}