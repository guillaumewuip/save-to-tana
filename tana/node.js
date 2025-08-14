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

export function createActivity(externalId, { name, distance, date, url, elevation, moving_time, watts, heart_rate, cadence }) {
  const node = {
    externalId,
    name,
    supertags: [
      {
        /* Activity */
        id: 'X2iB4SHCm_Lz'
      },
    ],
    children: [
       createUrl(url),
       createSource(),
      {
        /* Distance */
        type: 'field',
        attributeId: 'HLjYjL1bLZTG',
        children: [
          {
            name: distance,
          }
        ]
      },
      {
        /* When */
        type: 'field',
        attributeId: 'l4_Tr_0fV7rQ',
        children: [
          {
            dataType: 'date',
            name: date,
          }
        ]
      },
      {
        /* Elevation */
        type: 'field',
        attributeId: 'j7foFAsn-bMh', 
        children: [
          {
            name: elevation,
          }
        ]
      },
      {
      /* Moving time */
        type: 'field',
        attributeId: 'nhpKOKoGwkqz',
        children: [
          {
            name: moving_time,
          }
        ]
      },
    ]
  }

  if (cadence) { 
    node.children.push({
      /* Cadence (min/km) */
      type: 'field',
      attributeId: 'L9W5kZLNPs2a',
      children: [
        {
          name: cadence,
        }
      ],
    });
  }

  if (watts) {
    node.children.push({
      /* Watts */
      type: 'field',
      attributeId: 'ssiKiq1m_VVk',
      children: [{
        name: watts,
      }]
    });
  }

  if (heart_rate) {
    node.children.push({
      /* Heart rate (bpm) */
      type: 'field',
      attributeId: 'qDBhxqnV9Nea',
      children: [{
        name: heart_rate,
      }]
    });
  }

  return node
}

export function encode({ externalId, ...node }) {
  return node
}