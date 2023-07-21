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
          chrome.runtime.sendMessage({ type: 'SAVE_ERROR', response });
        }
      })
      .catch((error) => {
        console.error(error)
        chrome.runtime.sendMessage({ type: 'SAVE_ERROR', error });
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
