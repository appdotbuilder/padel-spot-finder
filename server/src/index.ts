import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createSpotInputSchema, 
  updateSpotInputSchema, 
  spotFilterSchema 
} from './schema';

// Import handlers
import { createSpot } from './handlers/create_spot';
import { getSpots } from './handlers/get_spots';
import { getSpotById } from './handlers/get_spot_by_id';
import { updateSpot } from './handlers/update_spot';
import { deleteSpot } from './handlers/delete_spot';
import { getNearbySpots } from './handlers/get_nearby_spots';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Spot management endpoints
  createSpot: publicProcedure
    .input(createSpotInputSchema)
    .mutation(({ input }) => createSpot(input)),

  getSpots: publicProcedure
    .input(spotFilterSchema)
    .query(({ input }) => getSpots(input)),

  getSpotById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getSpotById(input.id)),

  updateSpot: publicProcedure
    .input(updateSpotInputSchema)
    .mutation(({ input }) => updateSpot(input)),

  deleteSpot: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteSpot(input.id)),

  getNearbySpots: publicProcedure
    .input(z.object({
      userLat: z.number().min(-90).max(90),
      userLng: z.number().min(-180).max(180),
      radiusKm: z.number().positive().default(10),
    }))
    .query(({ input }) => getNearbySpots(input.userLat, input.userLng, input.radiusKm)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC Padel Spots API server listening at port: ${port}`);
}

start();