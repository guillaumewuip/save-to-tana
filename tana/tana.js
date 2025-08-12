import * as Log from 'log';

import * as Store from 'store';

const API_KEY = process.env.TANA_API_KEY

async function filterSavedNodes(nodes) {
  const newNodes = []

  try {
    for (const node of nodes) {
      const savedAlready = await Store.isSavedAlready(node.externalId)

      if (!savedAlready) {
        newNodes.push(node)
      }
    }
  } catch (error) {
    Log.error(`Error filtering items saved already`, error);

    return []
  }

  return newNodes
}

function postNodes(nodes) {
  // Sending all given nodes at once as we think we won't have more than 100
  // nodes here
  // @see https://github.com/tanainc/tana-input-api-samples
  //
  // We're also adding the #inbox super tag on all node
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
      if(response.ok) {
        Log.info(`${nodes.length} items saved to Tana`)
      }

      if (!response.ok || response.status !== 200) {
        throw new Error(`Error saving nodes in Tana: ${response.status} ${response.statusText}`)
      }
    })
}

const BATCH_SIZE = 100;
const queue = []

// every 20s, we post the queue
setInterval(
  () => {
    if (queue.length) {
      Log.debug(`Posting ${Math.min(queue.length, BATCH_SIZE)} items to Tana`)

      // extracting items from the queue in batches
      const nodes = queue.splice(0, BATCH_SIZE)

      filterSavedNodes(nodes)
        .then(postNodes)
        .then(() => Store.saveItemsSaved(nodes.map(node => node.externalId)))
        // in case of failure, we put back items at the beginning of the queue
        .catch(error => {
          Log.error('Error in saving items', error);
          queue.unshift(...nodes)
        });
    }
  },
  20 * 1000
)

export function saveNodes(nodes) {
  if (nodes.length) {
    queue.push(...nodes)
    Log.info(`Added ${nodes.length} nodes to queue (${queue.length} nodes)`)
  }
}
