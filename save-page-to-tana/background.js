import { createWebPageSummarizer  } from './summarize-page.js';

async function addItemsToQueue(items, queueName) {
  const result = await chrome.storage.local.get([queueName])

  const queue = result[queueName] || [];
  queue.push(...items);

  await chrome.storage.local.set({ [queueName]: queue });
}

async function take10FromQueue(queueName) {
  const result = await chrome.storage.local.get([queueName]);
  const queue = result[queueName] || [];
  const items = queue.slice(0, 10);
  const remaining = queue.slice(10);

  await chrome.storage.local.set({ [queueName]: remaining });

  return items;
}

async function processQueue() {
  const items = await take10FromQueue('saveQueue');

  if (items.length === 0) {
    return;
  }

  const { API_KEY, API_ENDPOINT } = await chrome.storage.sync.get(['API_KEY', 'API_ENDPOINT'])

  if (!API_KEY || !API_ENDPOINT) {
    throw new Error('API_KEY or API_ENDPOINT not set')
  }

  const body = JSON.stringify({
    targetNodeId: 'INBOX',
    nodes: items.map(item => item.node),
  });

  console.log('Saving nodes', { API_ENDPOINT, body })

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body,
    });

    if (!response.ok) {
      throw new Error(`API error in saving nodes: ${response.status} ${response.statusText}`);
    }

    console.info('Nodes saved successfully');
  } catch (error) {
    console.error('Error saving nodes:', error);

    const itemsWithError = items
      .map(item => ({
        ...item,
        retry: item.retry + 1
      }))

    const itemsToRetry = itemsWithError.filter(item => item.retry <= 5);
    const deadItems = itemsWithError.filter(item => item.retry > 5);

    console.warn('Items to retry:', itemsToRetry);
    await addItemsToQueue(itemsToRetry, 'saveQueue');

    console.warn('Dead items:', deadItems);
    await addItemsToQueue(deadItems, 'deadQueue');
  }
}

async function postNodes(nodes) {
  // Add item to queue and immediately respond as "saved"
  await addItemsToQueue(nodes.map(node => ({
    node,
    retry: 0
  })), 'saveQueue');
}

async function savePage({ title, url, content }) {
  const { GEMINI_API_KEY } = await chrome.storage.sync.get(['GEMINI_API_KEY'])

  const webpageSummarizer = createWebPageSummarizer(GEMINI_API_KEY);

  console.log('GEMINI_API_KEY', GEMINI_API_KEY)

  const summaryChildren = await webpageSummarizer.summarizeWebPage(`
PAGE TITLE: ${title}
PAGE URL: ${url}
PAGE CONTENT: 
${content}
`);

  const nodes = [
    {
      name: title,
      supertags: [
        {
          /* website */
          id: 'G3E1S3l-dk0v'
        },
        {
          /* inbox */
          id: 'hNwXd-0aYDVj'
        }
      ],
      children: [
        {
          /* URL */
          type: 'field',
          attributeId: 'S4UUISQkxn2X',
          children: [
            {
              dataType: 'url',
              name: url
            }
          ]
        },
        {
          /* Source */
          type: "field",
          attributeId: "SalqarOgiv",
          children: [
            {
              name: "Save To Tana browser extension"
            }
          ]
        },
        {
          /* Summary */
          type: "field",
          attributeId: "fvfamJjU6oY5",
          children: summaryChildren,
        }
      ]
    }
  ]

  return postNodes(nodes)
}


function saveMusicRelatedItem(supertag) {
  return function ({ title, artist, url }) {
    const nodes = [{
      name: title,
      supertags: [
        {
          /* Track */
          id: supertag
        },
        {
          /* inbox */
          id: 'hNwXd-0aYDVj'
        }
      ],
      children: [
        {
          /* Title */
          type: 'field',
          attributeId: 'ksBOEhsvfu',
          children: title ? [{
            name: title,
          }] : []
        },
        {
          /* Artist */
          type: 'field',
          attributeId: 'eO2mvMPoRI',
          children: artist ? [{
            name: artist,
            supertags: [{
              /* Artist */
              id: 'JJfoxjPWqa'
            }]
          }] : []
        },
        {
          /* URL */
          type: 'field',
          attributeId: 'S4UUISQkxn2X',
          children: url ? [{
            dataType: 'url',
            name: url
          }] : [],
        },
        {
          /* Discogs */
          type: 'field',
          attributeId: 'SY7_uZ5wViRp',
          children: [{
            dataType: 'url',
            name: `https://www.discogs.com/search/?${new URLSearchParams({ q: `${artist} ${title}` }).toString()}`,
          }]
        },
        {
          /* Source */
          type: "field",
          attributeId: "SalqarOgiv",
          children: [
            {
              name: "Save To Tana browser extension"
            }
          ]
        },
      ]
    }]

    return postNodes(nodes)
  }
}

function saveTrack(data) {
  return saveMusicRelatedItem('xensjMe1ew')(data)
}

function saveAlbum(data) {
  return saveMusicRelatedItem('eWlghv3V42SH')(data)
}

function saveMusic(data) {
  return saveMusicRelatedItem('VI7FwJEpFAqY')(data)
}

// Set up recurring queue processor
chrome.runtime.onInstalled.addListener(() => {
  // Create alarm for queue processing every 5 seconds
  chrome.alarms.create('processQueue', { 
    delayInMinutes: 0.1, // Start after 6 seconds
    periodInMinutes: 0.1 // Repeat every 6 seconds
  });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'processQueue') {
    processQueue();
  }
});

chrome.runtime.onMessage.addListener((message) => {
  console.info('Received message', message)

  switch (message.type) {
    case 'popupOpened': {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        const activeTab = tabs[0];

        chrome.scripting
          .executeScript({
            target: { tabId: activeTab.id },
            files: ["content_script.js"],
          })
      });
      return
    }

    case 'saveTrack': {
      saveTrack({
        url: message.url,
        title: message.title,
        artist: message.artist,
      })
      return
    }

    case 'saveAlbum': {
      saveAlbum({
        url: message.url,
        title: message.title,
        artist: message.artist,
      })
      return
    }

    case 'saveMusic': {
      saveMusic({
        url: message.url,
        title: message.title,
        artist: message.artist,
      })
      return
    }

    case 'savePage': {
      savePage({
        title: message.title,
        url: message.url,
        content: message.content,
      })
      return
    }
  }
});

console.log('Starting service worker')