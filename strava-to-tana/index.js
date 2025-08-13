import cron from 'node-cron';
import Fastify from 'fastify';
import * as Log from 'log';
import * as Store from 'store';
import * as Tana from 'tana';
import { fetchRecentActivities, exchangeCodeForToken, getOAuthUrl, hasTokens } from './strava.js';
import { StravaActivitySchema } from './zod-schemas.js';

const fastify = Fastify({
  logger: true
});

fastify.get('/oauth2-callback', async (request, reply) => {
  try {
    const { code } = request.query;
    
    if (!code) {
      return reply.status(400).send({ error: 'Missing code parameter' });
    }

    Log.info('Received OAuth2 callback with code, exchanging for tokens...');
    
    await exchangeCodeForToken(code);
    
    Log.info('OAuth2 flow completed successfully!');

    await processActivities()  // TODO remove
    
    return reply.send({ 
      success: true, 
      message: 'OAuth2 authentication completed successfully! You can close this window.',
    });
  } catch (error) {
    Log.error('Error in OAuth2 callback:', error.message);
    return reply.status(500).send({ error: 'Failed to exchange code for tokens' });
  }
});

async function processActivities() {
  Log.info('Fetch strava activities...');

  if (!hasTokens()) {
    Log.warn('No tokens available. Please complete OAuth2 authentication first.');
    return;
  }

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

  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    
    const oauthUrl = getOAuthUrl();
    console.log('\n' + '='.repeat(80));
    console.log('🔐 STRAVA AUTHENTICATION REQUIRED');
    console.log('='.repeat(80));
    console.log('Please open the following URL in your browser to authenticate with Strava:');
    console.log('\n' + oauthUrl + '\n');
    console.log('After authentication, you will be redirected back to this application.');
    console.log('='.repeat(80) + '\n');
  
    cron.schedule('0 * * * *', () => {
      console.log('Running scheduled task...');
      //processActivities();  
    });

  } catch (error) {
    Log.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

start();