const RSSParser = require('rss-parser');
const cron = require('node-cron');

const { saveItem } = require('./item');
const { run } = require('./runner')
const Tana = require('./tana');

const parser = new RSSParser();

const rssFeeds = [
  {
    url: 'https://lesoreillescurieuses.com/feed/',
    cron: '0 0 23,6 * * *', // 23:00 and 06:00 every day
    toTana: Tana.album,
  },
  {
    url: 'https://cmd.wuips.com/rss/feed.xml',
    cron: '0 0 * * * *', // every hour every day
    toTana: Tana.website,
  },

];

function parseFeed(feed) {
  return async function (lastRunDate) {
    try {
      console.log(feed.url, `parsing for items published after ${lastRunDate.toISOString()}`)
      const parsedFeed = await parser.parseURL(feed.url);

      for (const item of parsedFeed.items) {
        const pubDate = new Date(item.pubDate);
        if (pubDate > lastRunDate) {
          console.log(feed.url, `new ${item.title} detected`);

          const tanaNode = feed.toTana(item)
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
