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

async function postNodesTo(targetNodeId, nodes) {
  const payload = {
    targetNodeId,
    nodes,
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

async function postNodesToInbox(nodes) {
  return postNodesTo('INBOX', nodes.map(node => 
    Node.encode(Node.addSupertags(node, [
      'hNwXd-0aYDVj' // Inbox
    ]))
  ))
}

async function postNodesToActivity(nodes) {
  return postNodesTo('Z_Kt8BKJ5Rrd', nodes.map(node => 
    Node.encode(node)
  ))
}

const BATCH_SIZE = 100;
const inboxQueue = []
const activityQueue = []

async function enqueue(queue, post, saveNode = true) {
  if (queue.length) {
    Log.debug(`Posting ${Math.min(queue.length, BATCH_SIZE)} items to Tana with ${post.name}`);

    console.log({queue})
    
    const nodes = queue.splice(0, BATCH_SIZE);

    try {
      const nonSavedNodes = await filterSavedNodes(nodes)
      
      Log.debug(`${nonSavedNodes.length} new nodes to post`);

      if (nonSavedNodes.length > 0) {
        await post(nonSavedNodes)
      }

      if (saveNode) {
        await Store.saveItemsSaved(nonSavedNodes.map(node => node.externalId))
      }
    } catch (error) {
      Log.error('Error in saving items', error);
      // in case of failure, we put back items at the beginning of the queue
      queue.unshift(...nodes);
    }
  }
}

// every 20s, we post the queues
setInterval(
  () => {
    enqueue(inboxQueue, postNodesToInbox);
    enqueue(activityQueue, postNodesToActivity, false);
  },
  20 * 1000
);

export function saveNodesToInbox(nodes) {
  if (nodes.length) {
    inboxQueue.push(...nodes)
    Log.info(`Added ${nodes.length} nodes to inbox queue (${inboxQueue.length} nodes)`)
  }
}

export function saveNodesToActivity(nodes) {
  if (nodes.length) {
    activityQueue.push(...nodes)
    Log.info(`Added ${nodes.length} nodes to activity queue (${activityQueue.length} nodes)`)
  }
}
