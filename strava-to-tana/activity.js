import * as Tana from 'tana';
import { z } from 'zod';

const StravaActivitySchema = z.object({
  id: z.number(),
  name: z.string(),
  distance: z.number(),
  moving_time: z.number(),
  total_elevation_gain: z.number(),
  sport_type: z.enum(['Run', 'TrailRun', 'Walk', 'GravelRide', 'Ride']).catch('unknown'),
  start_date: z.string().datetime(),
  average_cadence: z.number().optional(),
  average_watts: z.number().optional(),
  average_heartrate: z.number().optional(),
});

const StravaActivitiesSchema = z.array(StravaActivitySchema);

export const parseActivities = (data) => {
  const result = StravaActivitiesSchema.safeParse(data);

  if (!result.success) {
    throw new Error(`Invalid Strava activity data: ${JSON.stringify(result.error.issues)}`);
  }

  return result.data;
};

export const toTanaNode = (activity) =>  Tana.Node.createActivity(
  `strava-${activity.id}`, 
    {
    name: activity.name,
    distance: activity.distance,
    date: activity.start_date, 
    url: `https://www.strava.com/activities/${activity.id}`,
    elevation: activity.total_elevation_gain,
    moving_time: activity.moving_time,
    watts: activity.average_watts,
    heart_rate: activity.average_heartrate,
    cadence: activity.average_cadence,
  }
)