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
    console.log('API response:', data);

    return data.candidates[0].output;
  }

  async function summarizeWebPage(pageContent) {
    const prompt = `
I will provide the content of a webpage and you will summarize it. Here are some guidelines for you to follow:

- Since this is a webpage, make sure to filter out any irrelevant details and include only the main content.
- Do not include any information that is not relevant to the main content of the webpage.
- Include emojis to make it more engaging. Only include the emojis in the headings; they should NOT be in the body points. They should be relevant to the content of the heading.
- Only have headings and body points. Make sure to have multiple headings and body points.
- Utilize bulleted lists. Use "-" bullet instead of "*". Only include the bullet icon for the body points, not the heading. Make headings bold. Only use ** for bold.
- Only write in English.

Here are some things that I told you not to do but you did them anyway. If you do them now, I will be very disappointed:
- Do NOT make a multi-level outline.
- Do NOT include subheadings.
- Do NOT use <h2>, <h3>, etc. tags.
- Do NOT use ##, ###, etc. in the text.
- Do NOT use indentation of any kind.
- Do NOT put two or more spaces in succession.
- Do NOT use the same emoji more than once.
- Do NOT use the same emoji twice in the same heading (before and after the heading text). Again, Do NOT use the same emoji twice in the same heading.
- Do NOT add lines between headings and body points as well as between body points and other body points.
- Do NOT put the emoji (in the heading) in parenthesis. Just put the actual emoji icon after the heading text (followed by a space).

Here is the general format that you should follow in your response. For the things that are in <> you should replace them with the actual content. For example, <emoji> should be replaced with the actual emoji icon. The same goes for the headings and body points. Here is the format: {

**Heading 1<space><1 emoji>**
- Body point 1
- Body point 2
- <use as many body points as you want>
<empty line>
<empty line>
**Heading 2<space><1 emoji>**
- Body point 1
- Body point 2
- <use as many body points as you want>
<empty line>
<empty line>
<use as many headings as you want>

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

function savePage({ title, url }) {
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
      ]
    }
  ]

  webpageSummarizer.summarizeWebPage(title)
    .then(console.log)
    .catch(console.error)

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
  console.log({ message })

  switch (message.type) {
    case 'popupOpened': {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        const activeTab = tabs[0];

        chrome.scripting
          .executeScript({
            target : {tabId : activeTab.id},
            files : [ "content_script.js" ],
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
      })
      return
    }
  }
});

console.log('Starting service worker')
