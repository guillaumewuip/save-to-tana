function savePage({ url, title }) {
  chrome.runtime.sendMessage({ type: 'PAGE_SAVING' });

  chrome.storage.sync.get(['API_KEY', 'API_ENDPOINT'], (result) => {
    const apiKey = result.API_KEY;
    const apiEndpoint = result.API_ENDPOINT;

    const body = JSON.stringify({
      targetNodeId: 'INBOX',
      nodes: [
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

chrome.runtime.onMessage.addListener((message) => {
  console.log({ message })

  if (message.type === 'popupOpened') {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      console.log({ tabs })
      var activeTab = tabs[0];
      savePage({ url: activeTab.url, title: activeTab.title })
    });
  }
});

console.log('Starting service worker')
