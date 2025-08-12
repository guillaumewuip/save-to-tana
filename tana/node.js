import { fetchPageContent } from 'fetcher';
import { summarizePageContent, summaryToNodes } from 'summarize-page';

function source(url) {
  return {
    /* Source */
    type: "field",
    attributeId: "SalqarOgiv",
    children: [
      {
        name: `RSS to Tana - ${url}`
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

export async function createAlbum(url, item) {
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
      source(url)
    ]
  }
}

export async function createMusic(url, item) {
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
      source(url)
    ]
  }
}

export async function createWebsite(url, item) {
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
      source(url),
    ]
  }

  try {
    const page = await fetchPageContent(item.link);
    const summary = await summarizePageContent(page, process.env.GEMINI_API_KEY);

    node.children.push({
      /* Summary */
      type: 'field',
      attributeId: 'fvfamJjU6oY5', 
       children: summaryToNodes(summary),
    })

    return node
  } catch (error) {
    node.children.push({
      type: 'field',
      attributeId: 'fvfamJjU6oY5',
      children: [{name: `Error summarizing page: ${error.message}`}]
    });

    return node
  }
}
