import { fetchPageContent } from 'fetcher';
import { summarizePageContent, summaryToNodes } from 'summarize-page';

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

function createTitle(item) {
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

export async function createAlbum(externalId, item) {
  return {
    externalId,
    name: item.title,
    supertags: [
      {
        /* Album */
        id: 'eWlghv3V42SH'
      },
    ],
    children: [
      createTitle(item),
      createUrl(item.url),
      createSource()
    ]
  }
}

export async function createMusic(externalId, item) {
  return {
    externalId,
    name: item.title,
    supertags: [
      {
        /* Music */
        id: 'VI7FwJEpFAqY'
      },
    ],
    children: [
      createTitle(item),
      createUrl(item.url),
      createSource()
    ]
  }
}

export async function createWebsite(externalId, item) {
  const node = {
    externalId,
    name: item.title,
    supertags: [
      {
        /* Website */
        id: 'G3E1S3l-dk0v'
      }
    ],
    children: [
      createUrl(item.url),
      createSource()
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

export async function createActivity(externalId, activity) {
  return {
    externalId,
    name: activity.name,
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
