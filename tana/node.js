import { fetchPageContent } from 'fetcher';
import { summarizePageContent, summaryToNodes } from 'summarize-page';

export function addSupertags(node, tags) {
  return {
    ...node,
    supertags: [
      ...(node.supertags ?? []),
      ...tags.map(tag => ({
        id: tag
      }))
    ]
  }
}

function createSource() {
  return {
    /* Source */
    type: "field",
    attributeId: "SalqarOgiv",
    children: [
      {
        name: `XXX to Tana`
      }
    ]
  }
}

function createTitle(title) {
  return {
    /* Title */
    type: 'field',
    attributeId: 'ksBOEhsvfu',
    children: [
      {
        name: title,
      }
    ]
  }
}

function createUrl(url) {
  return {
    /* URL */
    type: 'field',
    attributeId: 'S4UUISQkxn2X',
    children: [
      {
        dataType: 'url',
        name: url
      }
    ]
  }
}

export async function createAlbum(externalId, { name, url }) {
  return addSupertags({
    externalId,
    name,
    children: [
      createTitle(name),
      createUrl(url),
      createSource()
    ]
  }, [
    'eWlghv3V42SH', // Album
  ])
}

export async function createMusic(externalId, { name, url }) {
  return addSupertags({
    externalId,
    name,
    children: [
      createTitle(name),
      createUrl(url),
      createSource()
    ]
  }, [
    'VI7FwJEpFAqY' // Music
  ])
}

export async function createWebsite(externalId, { name, url }) {
  const node = addSupertags({
    externalId,
    name,
    children: [
      createUrl(url),
      createSource()
    ]
  }, [
    'G3E1S3l-dk0v' // Website
  ])

  try {
    const page = await fetchPageContent(url);
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

export async function createActivity(externalId, { name, url }) {
  return {
    externalId,
    name,
    // supertags: [
    //   {
    //     /* Activity */
    //     id: 'TODO'
    //   },
    // ],
    // children: [
    //    createUrl(item.url),
    //    createSource(),
    //   {
    //     /* Name */
    //     type: 'field',
    //     attributeId: 'TODO',
    //     children: [
    //       {
    //         name: activity.name,
    //       }
    //     ]
    //   },
    //   {
    //     /* Distance */
    //     type: 'field',
    //     attributeId: 'TODO',
    //     children: [
    //       {
    //         name: activity.distance,
    //       }
    //     ]
    //   },
    //   {
    //     /* Moving Time */
    //     type: 'field',
    //     attributeId: 'TODO',
    //     children: [
    //       {
    //         name: activity.moving_time,
    //       }
    //     ]
    //   },
    //   {
    //     /* Start Date */
    //     type: 'field',
    //     attributeId: 'TODO',
    //     children: [
    //       {
    //         name: activity.start_date,
    //       }
    //     ]
    //   },
    // ]
  }
}

export function encode({ externalId, ...node }) {
  return node
}