function source(feedUrl) {
  return {
    /* Source */
    type: "field",
    attributeId: "SalqarOgiv",
    children: [
      {
        name: `RSS to Tana - ${feedUrl}`
      }
    ]
  }
}

function title(item) {
  return {
    /* Title */
    type: 'field',
    attributeId: 'ksBOEhsvfu',
    children: [
      {
        name: item.title,
      }
    ]
  }
}

function url(item) {
  return {
    /* URL */
    type: 'field',
    attributeId: 'S4UUISQkxn2X',
    children: [
      {
        dataType: 'url',
        name: item.link
      }
    ]
  }
}

function album(feedUrl, item) {
  return {
    name: item.title,
    supertags: [
      {
        /* Album */
        id: 'eWlghv3V42SH'
      },
    ],
    children: [
      title(item),
      url(item),
      source(feedUrl)
    ]
  }
}

function music(feedUrl, item) {
  return {
    name: item.title,
    supertags: [
      {
        /* Music */
        id: 'VI7FwJEpFAqY'
      },
    ],
    children: [
      title(item),
      url(item),
      source(feedUrl)
    ]
  }
}

function website(feedUrl, item) {
  return {
    name: item.title,
    supertags: [
      {
        /* Website */
        id: 'G3E1S3l-dk0v'
      }
    ],
    children: [
      url(item),
      source(feedUrl)
    ]
  }
}

const create = (rssItem, feed) => ({
  id: rssItem.link,
  title: rssItem.title,
  publishedAt: new Date(rssItem.isoDate),
  tanaNode: feed.toTana(feed.url, rssItem),
  feed,
})


module.exports = {
  tana: {
    album,
    music,
    website,
  },
  create,
}
