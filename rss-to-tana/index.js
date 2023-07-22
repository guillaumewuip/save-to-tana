const RSSParser = require('rss-parser');
const cron = require('node-cron');

const { saveItem } = require('./item');
const { run } = require('./runner')
const Tana = require('./tana');

const parser = new RSSParser();

const schedules = {
  twiceAtNight: '0 0 23,4 * * *', // 23:00 and 04:00 every day
  everyHour: '0 0 * * * *', // every hour every day
}

const rssFeeds = [
  // Music
  {
    url: 'https://lesoreillescurieuses.com/feed/',
    cron: schedules.twiceAtNight,
    toTana: Tana.album,
  },
  {
    url: 'https://cmd.wuips.com/rss/feed.xml',
    cron: schedules.everyHour,
    toTana: Tana.music,
  },
  {
    url: 'http://pitchfork.com/rss/reviews/best/albums/',
    cron: schedules.twiceAtNight,
    toTana: Tana.album,
  },
  {
    url: 'https://www.prun.net/emission/8MNV-iss/rss',
    cron: schedules.twiceAtNight,
    toTana: Tana.music,
  },
  {
    url: 'https://stnt.org/rss.xml',
    cron: schedules.twiceAtNight,
    toTana: Tana.album,
  },
  {
    url: 'https://www.tsugi.fr/feed/',
    cron: schedules.twiceAtNight,
    toTana: Tana.album,
  },

  // Tech
  {
    // Codrops
    url: 'http://feeds2.feedburner.com/tympanus',
    cron: schedules.everyHour,
    toTana: Tana.website,
  },
  {
    url: 'https://leaddev.com/content-piece-and-series/rss.xml',
    cron: schedules.everyHour,
    toTana: Tana.website,
  },
  {
    // Thoughtworks Technology Podcast
    url: 'http://feeds.soundcloud.com/users/soundcloud:users:94605026/sounds.rss',
    cron: schedules.everyHour,
    toTana: Tana.website,
  },

  // Design
  {
    url: 'http://minimalissimo.com/feed/',
    cron: schedules.twiceAtNight,
    toTana: Tana.website,
  },

  // Personal Development
  {
    url: 'http://feeds.feedburner.com/zenhabits',
    cron: schedules.twiceAtNight,
    toTana: Tana.website,
  },

  // Others
  {
    url: 'http://www.lesothers.com/feed/',
    cron: schedules.twiceAtNight,
    toTana: Tana.website,
  },
  {
    url: 'https://worksinprogress.substack.com/feed/',
    cron: schedules.twiceAtNight,
    toTana: Tana.website,
  }
];

function parseFeed(feed) {
  return async function (lastRunDate) {
    try {
      console.log(feed.url, `parsing for items published after ${lastRunDate.toISOString()}`)
      const parsedFeed = await parser.parseURL(feed.url);

      for (const item of parsedFeed.items) {
        const publishedAt = new Date(item.isoDate);
        if (publishedAt > lastRunDate) {
          console.log(feed.url, `new ${item.title} detected`);

          const tanaNode = feed.toTana(feed.url, item)
          saveItem(tanaNode);
        }
      }
    } catch (error) {
      console.error(feed.url, `parsing error`, error);
    }
  }
}


for (const feed of rssFeeds) {
  /**
   * We can use FORCE=true env var to run the feeds parsing directly, without
   * cron schedule
   */
  if (process.env.FORCE === 'true') {
    run(parseFeed(feed))()
  } else {
    console.log('Scheduling', feed.url, 'on', feed.cron)

    if (!cron.validate(feed.cron)) {
      throw new Error(`${feed.cron} not a valid cron expression`)
    }

    cron.schedule(feed.cron, run(parseFeed(feed)))
  }
}
