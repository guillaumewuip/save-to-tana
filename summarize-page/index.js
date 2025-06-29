function summaryToObject(data) {
  try {
    const parsedData = JSON.parse(data);
    return {
      type: "success",
      oneLine: parsedData.summary.oneLine,
      details: parsedData.summary.details,
      peopleMentioned: parsedData.peopleMentioned || []
    };
  } catch (error) {
    return { type: "error", error };
  }
}

export function summaryToNodes(data) {
  return [
    {
      name: data.oneLine,
      children: data.details.map(detail => ({ name: detail }))
    },
    {
      name: "People Mentioned",
      children: data.peopleMentioned.map(person => ({ name: person }))
    }
  ];
}

export function summaryToTanaPaste(data) {
  return `%%tana%%
- ${data.oneLine}
${data.details.map(detail => `  - ${detail}`).join('\n')}
${data.peopleMentioned.length > 0 ? `- People Mentioned:\n${data.peopleMentioned.map(person => `  - ${person}`).join('\n')}` : ''}
`;
}

async function generateContent(apiKey, prompt) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
    })
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();

  return data.candidates[0].content.parts[0].text;
}

export async function summarizeWebPage(apiKey, pageContent) {
  const prompt = `
You are a webpage summarization API that MUST return valid JSON. Your response will be parsed programmatically.

CRITICAL: Your response must be ONLY valid JSON - no explanations, no markdown formatting, no text before or after the JSON.

Guidelines for summarization:
- Filter out irrelevant details, focus on main content
- Extract key points and make them action-oriented when relevant
- Write in the same language as the webpage
- No subheadings, HTML tags, or markdown formatting
- No double spaces or excessive indentation
- Keep "oneLine" and "details" values as single lines without line breaks

Required JSON format (copy this structure exactly, with children as arrays of any length):
{
"summary": {
  "oneLine": "One line summary of what the page is about",
  "details": [
    "Key detail about the page content",
    "Another important detail",
    "Additional relevant information"
  ]
},
"peopleMentioned": [
  "Person Name 1",
  "Person Name 2"
]
}

IMPORTANT RULES:
1. ONLY include the "peopleMentioned" property if relevant people are actually mentioned in the content
2. Your entire response must be valid JSON object that can be parsed by JSON.parse()
3. Do not wrap the JSON in code blocks or add any explanatory text
4. Ensure all quotes are properly escaped
5. Do not include comments in the JSON

Webpage content to summarize:
${pageContent}

Return only the JSON object:`;

  try {
    const content = await generateContent(apiKey, prompt);
    const summary = summaryToObject(content);

    return summary
  } catch (error) {
    if (error.message.includes("SAFETY")) {
      return { type: "error", error: "Content may violate content policy." };
    } else if (error.message.includes("overloaded")) {
      return { type: "error", error: "The model is overloaded." };
    } else {
      return { type: "error", error: `Unexpected error: ${error.message}` };
    }
  }
}