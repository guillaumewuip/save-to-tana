const cron = require('node-cron');

const Store = require('./store');
const Item = require('./item');
const Tana = require('./tana');
const RSS = require('./rss');

const schedules = {
  twiceAtNight: '0 0 23,4 * * *', // 23:00 and 04:00 every day
  everyHour: '0 0 * * * *', // every hour every day
}

const rssFeeds = [
  // Music
  {
    url: 'https://lesoreillescurieuses.com/feed/',
    cron: schedules.twiceAtNight,
    toTana: Item.tana.album,
  },
  {
    url: 'https://cmd.wuips.com/rss/feed.xml',
    cron: schedules.everyHour,
    toTana: Item.tana.music,
  },
  {
    url: 'http://pitchfork.com/rss/reviews/best/albums/',
    cron: schedules.twiceAtNight,
    toTana: Item.tana.album,
  },
  {
    url: 'https://www.prun.net/emission/8MNV-iss/rss',
    cron: schedules.twiceAtNight,
    toTana: Item.tana.music,
  },
  {
    url: 'https://stnt.org/rss.xml',
    cron: schedules.twiceAtNight,
    toTana: Item.tana.album,
  },
  {
    url: 'https://www.tsugi.fr/feed/',
    cron: schedules.twiceAtNight,
    toTana: Item.tana.album,
  },

  // Tech
  {
    // Codrops
    url: 'http://feeds2.feedburner.com/tympanus',
    cron: schedules.everyHour,
    toTana: Item.tana.website,
  },
  {
    url: 'https://leaddev.com/content-piece-and-series/rss.xml',
    cron: schedules.everyHour,
    toTana: Item.tana.website,
  },
  {
    // Thoughtworks Technology Podcast
    url: 'http://feeds.soundcloud.com/users/soundcloud:users:94605026/sounds.rss',
    cron: schedules.everyHour,
    toTana: Item.tana.website,
  },

  // Design
  {
    url: 'http://minimalissimo.com/feed/',
    cron: schedules.twiceAtNight,
    toTana: Item.tana.website,
  },

  // Personal Development
  {
    url: 'http://feeds.feedburner.com/zenhabits',
    cron: schedules.twiceAtNight,
    toTana: Item.tana.website,
  },

  // Others
  {
    url: 'http://www.lesothers.com/feed/',
    cron: schedules.twiceAtNight,
    toTana: Item.tana.website,
  },
  {
    url: 'https://worksinprogress.substack.com/feed/',
    cron: schedules.twiceAtNight,
    toTana: Item.tana.website,
  }
];

function dateDiffInDays(a, b) {
  const _MS_PER_DAY = 1000 * 60 * 60 * 24;
  // Discard the time and time-zone information.
  const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

  return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}

async function extractItems(feed) {
  console.log(feed.url, '- parsing')
  try {
    const items = await RSS.parse(feed.url);

    return items.map(rssItem => Item.create(rssItem, feed))
  } catch (error) {
    console.error(feed.url, `parsing error`, error);

    return []
  }
}

// removes items older than 3 days
async function filterOlderItems(items) {
  const now = new Date()
  return items.filter(item => dateDiffInDays(item.publishedAt, now) < 3)
}

async function filterSavedItems(items) {
  const newItems = []

  for (const item of items) {
    const itemSavedAlready = await Store.savedAlready(item.id)

    if (!itemSavedAlready) {
      newItems.push(item)
    }
  }

  return newItems
}

async function parseFeed(feed) {
  const items = await extractItems(feed)
  console.log(feed.url, `- ${items.length} items in feed`)

  const notOldItems = await filterOlderItems(items)
  console.log(feed.url, `- ${notOldItems.length} items young enough`)

  const notAlreadySaved = await filterSavedItems(notOldItems)
  console.log(feed.url, `- ${notAlreadySaved.length} new items`)

  Tana.saveItems(notAlreadySaved);
}

// 1. Parses feed to retrive their items
// 2. Filters out those that
//    - either are older than 3 days
//    - are in the redis
//    Items left are considered new items
// 3. Pushes the new items to the save queue
// 4. Once saved, saves the items in the redis
(async () => {
  await Store.initialize()

  for (const feed of rssFeeds) {
    /**
     * We can use FORCE=true env var to run the feeds parsing directly, without
     * cron schedule
     */
    if (process.env.FORCE === 'true') {
      await parseFeed(feed)
    } else {
      console.log('Scheduling', feed.url, 'on', feed.cron)

      if (!cron.validate(feed.cron)) {
        throw new Error(`${feed.cron} not a valid cron expression`)
      }

      cron.schedule(feed.cron, () => parseFeed(feed))
    }
  }
})();
