import { z } from 'zod';

export const StravaActivitySchema = z.object({
  id: z.number(),
  name: z.string(),
  distance: z.number(),
  moving_time: z.number(),
  elapsed_time: z.number(),
  total_elevation_gain: z.number(),
  type: z.string(),
  sport_type: z.string(),
  start_date: z.string().datetime(),
  start_date_local: z.string().datetime(),
  timezone: z.string(),
  map: z.object({
    id: z.string(),
    summary_polyline: z.string().nullable(),
    resource_state: z.number(),
  }),
  average_speed: z.number(),
  max_speed: z.number(),
  average_cadence: z.number().optional(),
  average_watts: z.number().optional(),
  average_heartrate: z.number().optional(),
  max_heartrate: z.number().optional(),
});
