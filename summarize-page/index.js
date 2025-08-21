import { z } from 'zod';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';

export async function summarizePageContent(pageContent, apiKey) {
  const google = createGoogleGenerativeAI({
    apiKey: apiKey
  });
  const model = google('gemini-2.5-flash');

  const SummarySchema = z.object({
    summary: z.object({
      oneLine: z.string().describe('One line summary of what the page is about'),
      details: z.array(z.string()).describe('List of key details about the page content ')
    }),
    rating: z.object({
      value: z.enum(['Excellent', 'Good', 'Average', 'Poor']).describe('Overall rating of the page content'),
      reason: z.string().describe('Reason for the rating')
    }),
    peopleMentioned: z.array(z.string()).optional().describe('List of people mentioned in the content, if any')
  });

  const { object: summaryResult } = await generateObject({
      model,
      schema: SummarySchema,
      prompt: `# Persona
You are a highly efficient webpage summarization API. Your sole purpose is to process raw webpage content. You are meticulous about following the specified output format and adhering to all guidelines.

# Task
Analyze the provided webpage content and generate a concise, structured summary. The summary must capture the key information, main ideas, and any actionable items, while filtering out irrelevant details like advertisements, navigation links, and boilerplate text.

# Instructions
1.  **Analyze Content:** Read the entire content to understand its primary topic and purpose.
2.  **Filter Noise:** Ignore any content that is not part of the main article or body, such as headers, footers, ads, and sidebars.
3.  **Summarize:** Create a one-line summary (oneLine) and a more detailed summary (details).
4.  **Extract Key Information:**
    * Identify and list key takeaways in the actionItems array.
    * If specific individuals are named and are relevant to the content, list their names in the peopleMentioned array. If no one is mentioned, **DO NOT** include the peopleMentioned property in the output.
5.  **Rate the Content:** Provide an overall rating for the content's quality (Excellent, Good, Average, Poor) by comparing it to other pages on similar topics. 
    Explain the rating given in maximum ~30 words. Explain what's missing to be an excellent content.
    Be honest and critical in your assessment - only 1 out of 20 articles published is truelly excellent.
6.  **Language Consistency:** The entire JSON output, including all string values, must be in the same language as the original content.
7.  **Formatting Rules:**
    * Ensure all string values in the JSON are properly escaped.
    * The oneLine and details values must be single-line strings without any \n newline characters.
    * The final output must be a single, valid JSON object and nothing else. Do not include any explanatory text before or after the JSON.

Webpage content to summarize:
${pageContent.slice(0, 10000)}` // Limit content to avoid token limits
    });

  return summaryResult
}

export function summaryToNodes(data) {
  const result = [
    {
      name: `${data.rating.value} content`,
      children: [
        {
          name: data.rating.reason
        }
      ]
    },
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
  let result = `- ${data.rating.value} content
  - ${data.rating.reason}
- ${data.summary.oneLine}
${data.summary.details.map(detail => ` - ${detail}`).join('\n')}
`;

  if (data.peopleMentioned && data.peopleMentioned.length > 0) {
    result += `- People Mentioned:\n${data.peopleMentioned.map(person => `  - ${person}`).join('\n')}`;
  }

  return result;
}
