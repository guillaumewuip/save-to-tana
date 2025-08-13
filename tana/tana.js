import * as Log from 'log';

import * as Store from 'store';
import * as Node from './node.js'

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
    nodes: nodes.map(node => 
      Node.encode(Node.addSupertags(node, [
        'hNwXd-0aYDVj' // Inbox
      ]))
    )
  };

  const body = JSON.stringify(payload)

  return fetch('https://europe-west1-tagr-prod.cloudfunctions.net/addToNodeV2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body
  })
    .then(async response => {
      if(response.ok) {
        Log.info(`${nodes.length} items saved to Tana`)
      }

      if (!response.ok || response.status !== 200) {
        throw new Error(`Error saving nodes in Tana: ${response.status} ${response.statusText} (${await response.text()}) for ${body}`)
      }
    })
}

const BATCH_SIZE = 100;
const inboxQueue = []

// every 20s, we post the queue
setInterval(
  () => {
    if (inboxQueue.length) {
      Log.debug(`Posting ${Math.min(inboxQueue.length, BATCH_SIZE)} items to Tana`)

      // extracting items from the queue in batches
      const nodes = inboxQueue.splice(0, BATCH_SIZE)

      filterSavedNodes(nodes)
        .then(postNodes)
        .then(() => Store.saveItemsSaved(nodes.map(node => node.externalId)))
        // in case of failure, we put back items at the beginning of the queue
        .catch(error => {
          Log.error('Error in saving items', error);
          inboxQueue.unshift(...nodes)
        });
    }
  },
  20 * 1000
)

export function saveNodesToInbox(nodes) {
  if (nodes.length) {
    inboxQueue.push(...nodes)
    Log.info(`Added ${nodes.length} nodes to queue (${inboxQueue.length} nodes)`)
  }
}
