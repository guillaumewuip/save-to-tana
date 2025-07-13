import { z } from 'zod';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY
});
const model = google('gemini-2.5-flash');

const SummarySchema = z.object({
  summary: z.object({
    oneLine: z.string().describe('One line summary of what the page is about'),
    details: z.array(z.string()).describe('List of key details about the page content')
  }),
  peopleMentioned: z.array(z.string()).optional().describe('List of people mentioned in the content, if any')
});

export async function summarizePageContent(pageContent) {
  const { object: summaryResult } = await generateObject({
      model,
      schema: SummarySchema,
      prompt: `
  You are a webpage summarization API Your response will be parsed programmatically.

  Guidelines for summarization:
  - Filter out irrelevant details, focus on main content
  - Extract key points and make them action-oriented when relevant
  - Write in the same language as the webpage
  - No subheadings, HTML tags, or markdown formatting
  - No double spaces or excessive indentation
  - Keep "oneLine" and "details" values as single lines without line breaks

  IMPORTANT RULES:
  1. ONLY include the "peopleMentioned" property if relevant people are actually mentioned in the content
  2. Your entire response must be valid JSON object that can be parsed by JSON.parse()
  3. Do not wrap the JSON in code blocks or add any explanatory text
  4. Ensure all quotes are properly escaped
  5. Do not include comments in the JSON

  Webpage content to summarize:
  ${pageContent.slice(0, 10000)}` // Limit content to avoid token limits
    });

  return summaryResult
}

export function summaryToNodes(data) {
  const result = [
    {
      name: data.summary.oneLine,
      children: data.summary.details.map(detail => ({ name: detail }))
    },
    
  ];

  if (data.peopleMentioned && data.peopleMentioned.length > 0) {
    result.push({
      name: 'People Mentioned',
      children: data.peopleMentioned.map(person => ({ name: person }))
    });
  }

  return result
}

export function summaryToTanaPaste(data) {
  let result = `%%tana%%
  - ${data.summary.oneLine}
${data.summary.details.map(detail => `   - ${detail}`).join('\n')}
`;

  if (data.peopleMentioned && data.peopleMentioned.length > 0) {
    result += `  - People Mentioned:\n${data.peopleMentioned.map(person => `    - ${person}`).join('\n')}`;
  }

  return result;
}