import { summaryToNodes } from 'summarize-page';
import { summarizePage } from '../fetcher.js';

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

async function album(feedUrl, item) {
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

async function music(feedUrl, item) {
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

async function website(feedUrl, item) {
  const summary = await summarizePage(item.link);


  const node = {
    name: item.title,
    supertags: [
      {
        /* Website */
        id: 'G3E1S3l-dk0v'
      }
    ],
    children: [
      url(item),
      source(feedUrl),    
    ]
  }

  if (summary.type === "success") {
    node.children.push({
      /* Summary */
      type: "field",
      attributeId: "fvfamJjU6oY5",
      children: summaryToNodes(summary),
    })
  }
  
  return node;
}

export const create = async (rssItem, feed) => ({
  id: rssItem.link,
  title: rssItem.title,
  publishedAt: rssItem.publishedAt,
  tanaNode: await feed.toTana(feed.url, rssItem),
  feed,
})

export const tana = {
    album,
    music,
    website,
}
