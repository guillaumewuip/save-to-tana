function handleNewRSSItem(feedURL, item, node) {
  console.log(feedURL, `new ${item.title} detected`);

  const payload = {
    targetNodeId: 'INBOX',
    nodes: [
      {
        ...node,
        supertags: [
          ...node.supertags,
          {
            /* inbox */
            id: 'hNwXd-0aYDVj'
          }
        ]
      }
    ]
  };

  const API_KEY = process.env.TANA_API_KEY

  fetch('https://europe-west1-tagr-prod.cloudfunctions.net/addToNodeV2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify(payload)
  })
  .then(response => {
    if (response.ok) {
      console.log(feedURL, `${item.title} saved`);
    } else {
      console.error(feedURL, `error saving ${item.title} item: ${response.status} ${response.statusText}`);
    }
  })
  .catch(error => {
    console.error(feedURL, 'error making HTTP POST request', error);
  });
}

module.exports = { handleNewRSSItem };
