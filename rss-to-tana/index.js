import Fastify from 'fastify';

import * as Feeds from './feeds/index.js';
import * as Log from './log.js';
import { summarizePage } from './fetcher.js';

const fastify = Fastify({ logger: true });

function toTanaPaste(nodes) {
  return '%%tana%%\n' + nodes.map(node => {
    let result = `- ${node.name}`;
    if (node.children && node.children.length > 0) {
      result += '\n' + node.children.map(child => `  - ${child.name}`).join('\n');
    }
    return result;
  }).join('\n') ;
}

fastify.get('/health', async (req, reply) => {
  return reply.status(200).send({ status: 'ok' });
})

fastify.post('/summarize-for-tana-paste', async (req, reply) => {
  const { url } = req.body;
  if (!url) {
    return reply.status(400).send({ error: 'Missing url in request body' });
  }

  try {
    Log.info(`Received URL to summarize: ${url}`);

    const summary = await summarizePage(url);
    const tanaPaste = toTanaPaste(summary);

    return reply.status(200).send(tanaPaste);
  } catch (err) {
    Log.error('Error processing url:', err);
    return reply.status(400).send({ error: 'Invalid url' });
  }
});

const start = async () => {
  try {
    await fastify.listen({ port: 8080, host: '0.0.0.0' });

    if (process.env.SYNC_FEEDS === 'true') {
      await Feeds.start();
    }
  } catch (error) {
    Log.error('Error starting application:', error);
    process.exit(1);
  }
}

start();