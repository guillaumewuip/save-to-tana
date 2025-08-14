import cron from 'node-cron';
import * as Log from 'log';
import * as Store from 'store';
import * as Tana from 'tana';
import { fetchRecentActivities, exchangeCodeForToken, hasTokens } from './strava.js';
import { StravaActivitySchema } from './zod-schemas.js';

async function processActivities() {
  Log.info('Fetch strava activities...');

  const activities = await fetchRecentActivities();

  console.log(activities);

  if (!activities || activities.length === 0) {
    Log.info('No new Strava activities found.');
    return;
  }
}

async function start() {
  Log.info('Starting Strava to Tana service...');

  await Store.initialize();

  if (!(await hasTokens())) {
    Log.info('No tokens available. Trying to use provided code');

    const STRAVA_OAUTH2_CODE = process.env.STRAVA_OAUTH2_CODE;

    if (!STRAVA_OAUTH2_CODE) {
      Log.error('No authorization code provided.');
      process.exit(1);
    }

    try {
      await exchangeCodeForToken(STRAVA_OAUTH2_CODE);
    } catch (error) {
      Log.error('Error exchanging code for tokens:', error);
      process.exit(1);
    }
  }

  Log.info('Strava to Tana service started successfully!');
  
  await processActivities();
  
  cron.schedule('0 * * * *', () => { // TODO update
    Log.info('Running scheduled task...');
    processActivities();  
  });
}

start();