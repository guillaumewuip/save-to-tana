import cron from 'node-cron';

import * as Log from 'log';

import * as Store from 'store';
import * as Tana from 'tana';
import * as RSS from './rss.js';

const schedules = {
  twiceAtNight: '0 0 23,4 * * *', // 23:00 and 04:00 every day
  everyHour: '0 0 * * * *', // every hour every day
}

const rssFeeds = [
  // Music
  {
    url: 'https://cmd.wuips.com/rss/feed.xml',
    cron: schedules.everyHour,
    createNode: Tana.Node.createMusic,
  },
  {
    url: 'https://pitchfork.com/feed/reviews/best/albums/rss',
    cron: schedules.twiceAtNight,
    createNode: Tana.Node.createAlbum,
  },
  {
    url: 'https://pitchfork.com/feed/reviews/best/reissues/rss',
    cron: schedules.twiceAtNight,
    createNode: Tana.Node.createAlbum,
  },
  {
    url: 'https://stnt.org/rss.xml',
    cron: schedules.twiceAtNight,
    createNode: Tana.Node.createAlbum,
  },

  // Tech
  {
    url: 'https://leaddev.com/content-piece-and-series/rss.xml',
    cron: schedules.twiceAtNight,
    createNode: Tana.Node.createWebsite,
  },
  {
    // Thoughtworks Technology Podcast
    url: 'http://feeds.soundcloud.com/users/soundcloud:users:94605026/sounds.rss',
    cron: schedules.twiceAtNight,
    createNode: Tana.Node.createWebsite,
  },
  {
    url: 'https://lethain.com/feeds.xml',
    cron: schedules.everyHour,
    createNode: Tana.Node.createWebsite,
  },
];

function dateDiffInDays(a, b) {
  const _MS_PER_DAY = 1000 * 60 * 60 * 24;
  // Discard the time and time-zone information.
  const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

  return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}

async function extractItems(feed) {
  Log.debug(feed.url, '- parsing')

  const now = new Date()

  try {
    const items = await RSS.parse(feed.url);

    return await Promise.all(items
        .filter(rssItem => dateDiffInDays(rssItem.publishedAt, now) < 3) // keep only recent items
        .map(async rssItem => ({
          node: await feed.createNode(rssItem.link, {
            name: rssItem.title,
            url: rssItem.link
          }),
        })))
  } catch (error) {
    Log.error(`Error extracting items`, feed.url, error);

    return []
  }
}

async function parseFeed(feed) {
  try {
    const items = await extractItems(feed)
    Log.debug(feed.url, `- ${items.length} items extracted from feed`)

    const nodes = items.map(item => item.node)
    Tana.saveNodes(nodes);
  } catch (error) {
    Log.error('Error in parsing feed', feed.url, error)
  }
}

async function parseFeeds() {
  // Process feeds sequentially to reduce memory pressure
  // instead of Promise.all which would load all feeds simultaneously
  for (const feed of rssFeeds) {
    await parseFeed(feed);

    // Small delay between feeds to allow garbage collection
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

async function scheduleFeeds() {
  for (const feed of rssFeeds) {
    Log.info('Scheduling', feed.url, 'on', feed.cron)

    if (!cron.validate(feed.cron)) {
      throw new Error(`${feed.cron} not a valid cron expression`)
    }

    cron.schedule(feed.cron, () => parseFeed(feed))
  }
}

// 1. Parses feed to retrive their items
// 2. Filters out those that
//    - either are older than 3 days
//    - are in the redis
//    Items left are considered new items
// 3. Pushes the new items to the save queue
// 4. Once saved, saves the items in the redis
async function start() {
  // Check if API key is provided
  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY environment variable is required');
    process.exit(1);
  }

  await Store.initialize()

  await scheduleFeeds()

  // we parse all feeds at app startup
  await parseFeeds()
}

start()
