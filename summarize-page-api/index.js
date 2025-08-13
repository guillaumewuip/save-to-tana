import Fastify from 'fastify';

import { z } from 'zod';
import { fetchPageContent } from 'fetcher';
import { summarizePageContent, summaryToTanaPaste } from 'summarize-page';

const fastify = Fastify({
  logger: true
});

const RequestBodySchema = z.object({
  url: z.string().url('Must be a valid URL')
});

fastify.get('/health', async (_, reply) => {
  return reply.send({ status: 'ok' });
});

fastify.post('/summarize-page-to-tana', async (request, reply) => {
  try {
    const validation = RequestBodySchema.safeParse(request.body);
    if (!validation.success) {
      return reply.status(400).send({
        error: 'Invalid request body',
        details: validation.error.errors
      });
    }

    const { url } = validation.data;

    const page = await fetchPageContent(url);
    const summary = await summarizePageContent(page, process.env.GEMINI_API_KEY);

    return reply.send(summaryToTanaPaste(summary));
  } catch (error) {
    fastify.log.error(error);

    return reply.status(500).send({
      error: `Internal server error occurred while processing the request: ${error.message}`
    });
  }
});

const start = async () => {
  try {
    // Check if API key is provided
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY environment variable is required');
      process.exit(1);
    }

    await fastify.listen({ port: 5000, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
