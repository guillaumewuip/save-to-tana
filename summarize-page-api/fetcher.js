import * as htmlparser2 from 'htmlparser2';
import * as domutils from 'domutils';

import { summarizeWebPage } from 'summarize-page';

export async function summarizePage(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return [{ name: `Error fetching page: ${response.status} ${response.statusText}` }];
    }

    const html = await response.text();
    const dom = htmlparser2.parseDocument(html);
    const textContent = domutils.innerText(dom.children);
    const cleanedContent = textContent.replace(/\s+/g, ' ').trim();

    return await summarizeWebPage(process.env.GEMINI_API_KEY, cleanedContent);
  } catch (error) {
    if (error.name === 'AbortError') {
      return [{ name: "Request timed out" }];
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return [{ name: `Network error: ${error.message}` }];
    } else {
      return [{ name: `Unexpected error: ${error.message}` }];
    }
  }
}
