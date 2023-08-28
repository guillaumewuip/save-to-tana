const API_KEY = process.env.TANA_API_KEY

const Store = require('./store');

function postItems(items) {
  // Sending all given nodes at once as we think we won't have more than 100
  // nodes here
  // @see https://github.com/tanainc/tana-input-api-samples
  //
  // We're also adding the #inbox super tag on all node
  const nodes = items.map(item => item.tanaNode)

  const payload = {
    targetNodeId: 'INBOX',
    nodes: nodes.map(node => ({
      ...node,
      supertags: [
        ...node.supertags,
        {
          /* inbox */
          id: 'hNwXd-0aYDVj'
        }
      ]
    }))
  };

  return fetch('https://europe-west1-tagr-prod.cloudfunctions.net/addToNodeV2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify(payload)
  })
  .then(response => {
    if (!response.ok || response.status !== 200) {
      throw new Error(`Error saving nodes: ${response.status} ${response.statusText}`)
    }
  })
}

const queue = []

// every 20s, we post the queue
setInterval(
  () => {
    if (queue.length) {
      console.log(`Posting ${queue.length} items to Tana`)

      // extracting all items from the queue
      const items = queue.splice(0, Infinity)

      postItems(items)
        .then(() => Store.saveItemsSaved(items.map(item => item.id)))
        .then(() => {
          console.log(`${items.length} items saved`);
        })
        // in case of failure, we put back items in the queue
        .catch(error => {
          console.error(error);
          queue.push(...items)
        });
    }
  },
  20 * 1000
)

function saveItems(items) {
  queue.push(...items)
  console.log(`Added ${items.length} items to queue (${queue.length} items)`)
}

module.exports = { saveItems };
