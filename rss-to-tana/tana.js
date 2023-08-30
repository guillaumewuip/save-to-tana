const Log = require('./log');
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
      throw new Error(`Error saving nodes in Tana: ${response.status} ${response.statusText}`)
    }
  })
}

const queue = []

// every 20s, we post the queue
setInterval(
  () => {
    if (queue.length) {
      Log.debug(`Posting ${queue.length} items to Tana`)

      // extracting all items from the queue
      const items = queue.splice(0, Infinity)

      postItems(items)
        .then(() => Log.info(`${items.length} items saved to Tana`))
        .then(() => Store.saveItemsSaved(items.map(item => item.id)))
        // in case of failure, we put back items in the queue
        .catch(error => {
          Log.error('Error in saving items', error);
          queue.push(...items)
        });
    }
  },
  20 * 1000
)

function saveItems(items) {
  if (items.length) {
    queue.push(...items)
    Log.info(`Added ${items.length} items to queue (${queue.length} items)`)
  }
}

module.exports = { saveItems };
