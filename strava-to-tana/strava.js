import * as Log from 'log';
import * as Store from 'store';

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;

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
      code,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to exchange code for Strava access token: ${response.status} ${response.statusText}. ${await response.text()}`);
  }

  const data = await response.json();

  Log.info('Successfully exchanged code for tokens');

  await Store.save('strava_refresh_token', data.refresh_token);

  return data;
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

export async function hasTokens() {
  return await Store.read('strava_access_token') && await Store.read('strava_refresh_token');
}

export async function fetchRecentActivities() {
  const { access_token } = await refreshTokens();

  const tenDaysAgoTimestamp = Math.floor(Date.now() / 1000) - 86400 * 10;

  const url = new URL('https://www.strava.com/api/v3/athlete/activities');
  url.searchParams.append('after', tenDaysAgoTimestamp);
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
