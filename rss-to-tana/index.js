const RSSParser = require('rss-parser');
const cron = require('node-cron');

const { handleNewRSSItem } = require('./item');
const Tana = require('./tana');

const parser = new RSSParser();

const rssFeeds = [
  {
    url: 'https://lesoreillescurieuses.com/feed/',
    // cron: '0 0 23,6 * * *', // 23:00 and 06:00 every day
    cron: '0 * * * * *', // 23:00 and 06:00 every day
    toTana: Tana.album,
  },
  {
    url: 'https://cmd.wuips.com/rss/feed.xml',
    // cron: '0 0 * * * *', // every hour every day
    cron: '0 * * * * *', // every hour every day
    toTana: Tana.website,
  },

];

const startTime = new Date('2022-09-27 18:00:00.000.');

async function parseFeed(feed) {
  try {
    console.log(feed.url, 'parsing')
    const parsedFeed = await parser.parseURL(feed.url);

    for (const item of parsedFeed.items) {
      const pubDate = new Date(item.pubDate);
      if (pubDate > startTime) {
        const tanaNode = feed.toTana(item)
        handleNewRSSItem(feed.url, item, tanaNode);
      }
    }
  } catch (error) {
    console.error(feed.url, `parsing error`, error);
  }
}


for (const feed of rssFeeds) {
  console.log('Scheduling', feed.url, 'on', feed.cron)

  cron.schedule(feed.cron, () => parseFeed(feed))
}
