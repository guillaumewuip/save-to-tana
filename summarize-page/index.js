function summaryToChildren(data) {
  try {
    return JSON.parse(data)
  } catch (error) {
    console.error('Error parsing JSON summary:', error);
    return [{ name: "Error parsing JSON summary" }];
  }
}

function createWebPageSummarizer(apiKey) {
  async function generateContent(prompt) {
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

  async function summarizeWebPage(pageContent) {
    const prompt = `
You are a webpage summarization API that MUST return valid JSON. Your response will be parsed programmatically.

CRITICAL: Your response must be ONLY valid JSON - no explanations, no markdown formatting, no text before or after the JSON.

Guidelines for summarization:
- Filter out irrelevant details, focus on main content
- Extract key points and make them action-oriented when relevant
- Write in the same language as the webpage
- No subheadings, HTML tags, or markdown formatting
- No double spaces or excessive indentation
- Keep "name" values as single lines without line breaks

Required JSON format (copy this structure exactly, with children as arrays of any length):
[
  {
    "name": "One line summary of what the page is about",
    "children": [
      { "name": "Key detail about the page content" },
      { "name": "Another important detail" },
      { "name": "Additional relevant information" }
    ]
  },
  {
    "name": "People mentioned",
    "children": [
      { "name": "Person Name 1" },
      { "name": "Person Name 2" }
    ]
  }
]

IMPORTANT RULES:
1. ONLY include the "People mentioned" section if people are actually mentioned in the content
2. Your entire response must be valid JSON that can be parsed by JSON.parse()
3. Do not wrap the JSON in code blocks or add any explanatory text
4. Ensure all quotes are properly escaped
5. Do not include comments in the JSON

Webpage content to summarize:
${pageContent}

Return only the JSON array:`;

    try {
      const rawSummary = await generateContent(prompt);

      return summaryToChildren(rawSummary);
    } catch (error) {
      if (error.message.includes("SAFETY")) {
        return "Content may violate content policy.";
      } else if (error.message.includes("overloaded")) {
        return "The model is overloaded. Please try again later.";
      } else {
        return `Error: ${error.message}`;
      }
    }
  }

  return { summarizeWebPage }
}

export { createWebPageSummarizer };