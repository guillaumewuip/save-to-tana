function postNodes(nodes) {
  chrome.runtime.sendMessage({ type: 'PAGE_SAVING' });

  chrome.storage.sync.get(['API_KEY', 'API_ENDPOINT'], (result) => {
    const apiKey = result.API_KEY;
    const apiEndpoint = result.API_ENDPOINT;

    const body = JSON.stringify({
      targetNodeId: 'INBOX',
      nodes,
    })

    console.log('Sending payload', {
      apiEndpoint,
      body,
    })

    fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body,
    })
      .then((response) => {
        console.log('Response:', response)
        if (response.ok) {
          chrome.runtime.sendMessage({ type: 'PAGE_SAVED' });
        } else {
          chrome.runtime.sendMessage({ type: 'SAVE_ERROR' });
        }
      })
      .catch((error) => {
        console.error('Error:', error)
        chrome.runtime.sendMessage({ type: 'SAVE_ERROR' });
      });
  });
}

function savePage({ title, url }) {
  const nodes = [
    {
      name: title,
      supertags: [
        {
          /* website */
          id: 'G3E1S3l-dk0v'
        }
      ],
      children: [
        {
          /* URL */
          type: 'field',
          attributeId: 'SYS_A78',
          children: [
            {
              dataType: 'url',
              name: url
            }
          ]
        },
      ]
    }
  ]

  return postNodes(nodes)
}

function saveTrack({ title, artist, url }) {
  const nodes = [{
    name: title,
    supertags: [{
      /* Track */
      id: 'xensjMe1ew'
    }],
    children: [
      {
        /* Title */
        type: 'field',
        attributeId: 'ksBOEhsvfu',
        children: [{
          name: title,
        }]
      },
      {
        /* Artist */
        type: 'field',
        attributeId: 'eO2mvMPoRI',
        children: [{
          name: artist,
          supertags: [{
            /* Artist */
            id: 'JJfoxjPWqa'
          }]
        }]
      },
      {
        /* Source */
        type: 'field',
        attributeId: 'SalqarOgiv',
        children: [{
          dataType: 'url',
          name: url
        }],
      },
    ]
  }]

  return postNodes(nodes)
}

chrome.runtime.onMessage.addListener((message) => {
  console.log({ message })

  if (message.type === 'popupOpened') {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const activeTab = tabs[0];

      chrome.scripting
        .executeScript({
          target : {tabId : activeTab.id},
          files : [ "content_script.js" ],
        })
    });
  }

  if (message.type === 'saveTrack') {
    saveTrack({
      url: message.url,
      title: message.title,
      artist: message.artist,
    })
  }

  if (message.type === 'savePage') {
    savePage({
      title: message.title,
      url: message.url,
    })
  }
});

console.log('Starting service worker')
