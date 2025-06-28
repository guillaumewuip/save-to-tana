const htmlparser2 = require('htmlparser2');
const domutils = require('domutils');

/**
 * Fetches a page URL and returns the text content
 * @param {string} url - The URL to fetch
 * @returns {Promise<{type: "success", content: string} | {type: "error", error: Error}>}
 */
async function fetchPageContent(url) {
  try {
    // Validate URL
    if (!url || typeof url !== 'string') {
      return { type: "error", error: new Error('Invalid URL provided') };
    }

    // Fetch the page with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    clearTimeout(timeoutId);

    // Check if response is ok
    if (!response.ok) {
      return { 
        type: "error", 
        error: new Error(`HTTP ${response.status}: ${response.statusText}`) 
      };
    }

    const html = await response.text();
    const dom = htmlparser2.parseDocument(html);
    const textContent = domutils.innerText(dom.children);
    const cleanedContent = textContent.replace(/\s+/g, ' ').trim(); // Clean up whitespace

    return { type: "success", content: cleanedContent };
  } catch (error) {
    // Handle various error types
    if (error.name === 'AbortError') {
      return { type: "error", error: new Error('Request timeout') };
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return { type: "error", error: new Error(`Network error: ${error.message}`) };
    } else {
      return { type: "error", error: new Error(`Unexpected error: ${error.message}`) };
    }
  }
}

module.exports = { fetchPageContent };
