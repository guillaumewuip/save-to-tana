import { z } from "zod";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";

export async function summarizePageContent(pageContent, apiKey) {
	const google = createGoogleGenerativeAI({
		apiKey: apiKey,
	});
	const model = google("gemini-2.5-flash");

	const SummarySchema = z.object({
		summary: z.object({
			oneLine: z
				.string()
				.describe("One line summary of what the page is about"),
			details: z
				.array(z.string())
				.describe("List of key details about the page content "),
		}),
		rating: z.object({
			value: z
				.enum(["Excellent", "Good", "Average", "Poor"])
				.describe("Overall rating of the page content"),
			reason: z.string().describe("Reason for the rating"),
		}),
		peopleMentioned: z
			.array(z.string())
			.optional()
			.describe("List of people mentioned in the content, if any"),
	});

	const { object: summaryResult } = await generateObject({
		model,
		schema: SummarySchema,
		prompt: `You are an expert AI content analyst with a highly critical eye, specializing in software engineering, management, and leadership. Your task is to analyze the provided HTML content and generate a structured, unbiased summary.

IMPORTANT: Focus solely on the core article content. Ignore boilerplate HTML like navigation menus, sidebars, advertisements, footers, and script tags. Extract the meaningful text before you begin the analysis.

Based on the article's content, provide the following information:

1.  **Summary**:
    * oneLine: Distill the absolute essence of the article into a single, compelling sentence.
    * details: Extract a list of the key arguments, takeaways, findings or actionable items. Each item in the list should be a clear and concise point..

2.  **Rating**:
    * value: Critically evaluate the content against the rubric below and assign ONE rating: 'Excellent', 'Good', 'Average', or 'Poor'. **Assume a baseline of 'Average'** and only deviate if the content strongly merits it.
    * reason: In ~30 words, justify your rating by explicitly referencing the rubric criteria. Point to specific aspects of the text (or their absence) that support your decision. What's missing to get an Excellent rating?

3.  **People Mentioned**:
    * Identify and list the full names of any specific individuals mentioned in the text. If no people are named, this field should be empty.
---

**EVALUATION RUBRIC**

* **Excellent**: Reserved for the top 10% of content. It must present novel insights, be exceptionally well-written, provide deep, non-obvious analysis, and offer highly practical advice that is not common knowledge. It should be a definitive resource on its specific topic.
* **Good**: The content is accurate, well-structured, and provides clear value. It is a solid and worthwhile read but doesn't necessarily break new ground. It might be a very good explanation of existing concepts.
* **Average**: This is the default for most content. The article covers the topic adequately but is largely derivative. It may state common knowledge, lack depth, or feel like a generic summary of other sources. It is not bad, but not memorable or essential.
* **Poor**: The content has significant flaws. It may be poorly written, confusing, contain factual inaccuracies, be superficial clickbait, or offer no real value or actionable advice.

---

Here is the HTML content to analyze:
${pageContent.slice(0, 10000)}`, // Limit content to avoid token limit
	});

	return summaryResult;
}

export function summaryToNodes(data) {
	const result = [
		{
			name: `${data.rating.value} content`,
			children: [
				{
					name: data.rating.reason,
				},
			],
		},
		{
			name: data.summary.oneLine,
			children: data.summary.details.map((detail) => ({ name: detail })),
		},
	];

	if (data.peopleMentioned && data.peopleMentioned.length > 0) {
		result.push({
			name: "People Mentioned",
			children: data.peopleMentioned.map((person) => ({ name: person })),
		});
	}

	return result;
}

export function summaryToTanaPaste(data) {
	let result = `- ${data.rating.value} content
  - ${data.rating.reason}
- ${data.summary.oneLine}
${data.summary.details.map((detail) => ` - ${detail}`).join("\n")}
`;

	if (data.peopleMentioned && data.peopleMentioned.length > 0) {
		result += `- People Mentioned:\n${data.peopleMentioned.map((person) => `  - ${person}`).join("\n")}`;
	}

	return result;
}
