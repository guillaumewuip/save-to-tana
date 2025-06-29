import Fastify from 'fastify';

import { summaryToTanaPaste } from 'summarize-page';


import * as Feeds from './feeds/index.js';
import * as Log from './log.js';
import { summarizePage } from './fetcher.js';

const fastify = Fastify({ logger: true });

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

    if (summary.type === 'error') {
      Log.error(`Error summarizing page: ${summary.error}`);
      return reply.status(400).send({ error: summary.error });
    }

    const tanaPaste = summaryToTanaPaste(summary);
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