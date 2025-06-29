import Fastify from 'fastify';

import * as Feeds from './feeds/index.js';
import * as Log from './log.js';

const fastify = Fastify({ logger: true });

fastify.get('/', async () => {
  return { hello: 'world' }
})

fastify.get('/health', async (req, reply) => {
  return reply.status(200).send({ status: 'ok' });
})

const start = async () => {
  try {
    await fastify.listen({ port: 3000 });

    if (process.env.SYNC_FEEDS === 'true') {
      await Feeds.start();
    }
  } catch (error) {
    Log.error('Error starting application:', error);
    process.exit(1);
  }
}

start();