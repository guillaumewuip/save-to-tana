import * as Log from 'log';
import * as Store from 'store';
import { Mutex } from 'async-mutex';

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const oauthMutex = new Mutex(); 

function getOAuthUrl() {
  if (!STRAVA_CLIENT_ID) {
    throw new Error('STRAVA_CLIENT_ID environment variable is not set.');
  }

  const redirect_uri = `${BASE_URL}/oauth2-callback`;

  const url = new URL('https://www.strava.com/oauth/authorize');
  url.searchParams.append('client_id', STRAVA_CLIENT_ID);
  url.searchParams.append('redirect_uri', redirect_uri);
  url.searchParams.append('response_type', 'code');
  url.searchParams.append('scope', 'activity:read_all');
  
  return url.toString();
}

export async function askOauth2() {
  await oauthMutex.acquire();

  const oauthUrl = getOAuthUrl();

  console.log('\n' + '='.repeat(80));
  console.log('🔐 STRAVA AUTHENTICATION REQUIRED');
  console.log('='.repeat(80));
  console.log('Please open the following URL in your browser to authenticate with Strava:');
  console.log('\n' + oauthUrl + '\n');
  console.log('After authentication, you will be redirected back to this application.');
  console.log('='.repeat(80) + '\n');
}

export async function exchangeCodeForToken(code) {
  if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET) {
    throw new Error('STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET environment variables are not set.');
  }

  const url = new URL('https://www.strava.com/api/v3/oauth/token');

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to exchange code for Strava access token: ${response.status} ${response.statusText}. ${await response.text()}`);
  }

  const data = await response.json();

  await Store.save('strava_refresh_token', data.refresh_token);

  await oauthMutex.release();

  return data;
}

export async function waitForOauth2() {
  await oauthMutex.waitForUnlock();

  if (!isAuthenticated()) {
    throw new Error('No Strava tokens found. Please complete OAuth2 authentication first.');
  }
}

async function refreshTokens() {
  const currentRefreshToken = await Store.read('strava_refresh_token');

  const url = new URL('https://www.strava.com/api/v3/oauth/token');

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      refresh_token: currentRefreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to refresh Strava tokens: ${response.status} ${response.statusText}. ${await response.text()}`);
  }

  const data = await response.json();

  Log.info('Successfully refreshed Strava tokens');

  await Store.save('strava_refresh_token', data.refresh_token);

  return { access_token: data.access_token };
}

export async function isAuthenticated() {
  return await Store.read('strava_refresh_token');
}

export async function fetchRecentActivities() {
  const { access_token } = await refreshTokens();

  const fifteenDaysAgoTimestamp = Math.floor(Date.now() / 1000) - 86400 * 15;

  const url = new URL('https://www.strava.com/api/v3/athlete/activities');
  url.searchParams.append('after', fifteenDaysAgoTimestamp);
  url.searchParams.append('per_page', 100);

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Strava activities: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}
