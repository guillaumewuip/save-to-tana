import Fastify from 'fastify';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { summarizePage } from './fetcher.js';

const fastify = Fastify({
  logger: true
});

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY
});
const model = google('gemini-2.5-flash');
const SummarySchema = z.object({
  summary: z.string().describe('A concise summary of the web page content')
});

const RequestBodySchema = z.object({
  url: z.string().url('Must be a valid URL')
});

fastify.post('/summarize-page', async (request, reply) => {
  try {
    const validation = RequestBodySchema.safeParse(request.body);
    if (!validation.success) {
      return reply.status(400).send({
        error: 'Invalid request body',
        details: validation.error.errors
      });
    }

    const { url } = validation.data;

    // Fetch and parse the web page content
    const pageContent = await summarizePage(url);

    const { object: summaryResult } = await generateObject({
      model,
      schema: SummarySchema,
      prompt: `Please provide a concise and informative summary of the following web page content. Focus on the main points and key information:

${pageContent.slice(0, 10000)}` // Limit content to avoid token limits
    });

    return reply.send({
      summary: summaryResult.summary
    });

  } catch (error) {
    fastify.log.error(error);
    
    return reply.status(500).send({
      error: `Internal server error occurred while processing the request: ${error.message}`
    });
  }
});

// Start the server
const start = async () => {
  try {
    // Check if API key is provided
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY environment variable is required');
      process.exit(1);
    }

    await fastify.listen({ port: 3000, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();