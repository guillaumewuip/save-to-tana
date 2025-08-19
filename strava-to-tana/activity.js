import * as Tana from 'tana';
import { z } from 'zod';
import { format, intervalToDuration, formatDuration } from 'date-fns'

const StravaActivitySchema = z.object({
  id: z.number(),
  name: z.string(),
  sport_type: z.enum(['Run', 'TrailRun', 'Walk', 'GravelRide', 'Ride', 'WeightTraining']).catch('unknown'),
  start_date: z.string().datetime(),
  distance: z.number().optional(),
  moving_time: z.number().optional(),
  total_elevation_gain: z.number().optional(),
  average_speed: z.number().optional(),
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

export const toTanaNode = (activity) => {
  const cadence = activity.average_speed ? (16.6667 / activity.average_speed).toFixed(2) : undefined

  const node = Tana.Node.createActivity(
    `strava-${activity.id}`, 
    {
      name: activity.name,
      type: activity.sport_type,
      distance: (activity.distance / 1000).toFixed(2),
      date: format(activity.start_date, 'yyyy-MM-dd HH:mm:ss'),
      url: `https://www.strava.com/activities/${activity.id}`,
      elevation: activity.total_elevation_gain,
      moving_time: format(activity.moving_time * 1000, 'HH:mm:ss'),
      watts: activity.average_watts,
      heart_rate: activity.average_heartrate,
      cadence,
    }
  )

  return node
}