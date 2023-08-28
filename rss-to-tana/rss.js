const htmlparser2 = require('htmlparser2')

function parsePubDate(pubDateString) {
  return new Date(pubDateString)
}

async function parse(feedUrl) {
  const response = await fetch(feedUrl)

  if (!response.ok) {
    throw new Error(`Error fetching ${feedUrl}: ${response.status} ${response.statusText}`)
  }

  const content = await response.text()

  const feed = htmlparser2.parseFeed(content);
  const items = feed.items || []

  try {
    return items.map((item) => ({
      title: item.title,
      link: item.link,
      publishedAt: parsePubDate(item.pubDate || item.date),
    }))
  } catch (err) {
    console.log(err)
    return []
  }
}

module.exports = {
  parse,
}
