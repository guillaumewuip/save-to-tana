function createWebPageSummarizer(apiKey) {
  async function generateContent(prompt) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 1.0,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();

    return data.candidates[0].content.parts[0].text;
  }

  async function summarizeWebPage(pageContent) {
    const prompt = `
I will provide the content of a webpage and you will summarize it. Here are some guidelines for you to follow:

- Since this is a webpage, make sure to filter out any irrelevant details and include only the main content.
- Make sure to extract the key points, and if relevant for the content, make it action-oriented.
- Do not include any information that is not relevant to the main content of the webpage.
- Utilize bulleted lists. Use "-" bullet instead of "*".
- Write the summary in the language the page is written in

Here are some things that I told you not to do but you did them anyway. If you do them now, I will be very disappointed:
- Do NOT include subheadings.
- Do NOT use <h2>, <h3>, etc. tags.
- Do NOT use ##, ###, etc. in the text.
- Do NOT put two or more spaces in succession.
- DO NOT introduce more than one level of indentation
- Do NOT add lines between headings and body points as well as between body points and other body points.
- DO NOT surrounds the response with { and }

Here is the general format that you should follow in your response. 
- For the things that are in <> you should replace them with the actual content. 
- It should be a valid JSON array of objects.
- "name" values should not contain any new lines

Here is the format: 

[
  {
    "name": "<One line summary - what is the page about?>",
    "children": [
      { "name: "<a bit more detail about the page>" },
      { "name: "<a bit more detail about the page>" },
      { "name: "<use as many objects as you need to summarize the page>" }
    ]
  },
  {
    "name": "People mentioned", // This is optional, only if the page mentions relevant people
    "children": [
      { "name": "<person 1 name>" },
      { "name": "<person 2 name>" },
      { "name": "<add as many person as needed>" }
    ]
  }
]
  
Here is the content of the webpage. Be thorough:
${pageContent}
    `;

    try {
      const rawSummary = await generateContent(prompt);

      return rawSummary;
    } catch (error) {
      if (error.message.includes("SAFETY")) {
        return "Content may violate content policy.";
      } else if (error.message.includes("overloaded")) {
        return "The model is overloaded. Please try again later.";
      } else {
        return `Error: ${error.message}`;
      }
    }
  }

  return { summarizeWebPage }
}

function summaryToChildren(data) {
  try {
    return JSON.parse(data)
  } catch (error) {
    return [{ name: "Error parsing JSON summary" }];
  }
}

const webpageSummarizer = createWebPageSummarizer("AIzaSyBqOeoZSvMNXcu8hWoTFmIswhOfBFZYtzY");

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
  const summary = await webpageSummarizer.summarizeWebPage(`
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
          children: summaryToChildren(summary),
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
