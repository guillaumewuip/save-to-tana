import * as htmlparser2 from 'htmlparser2';

function parsePubDate(pubDateString) {
  return new Date(pubDateString)
}

// Streaming RSS parser to limit memory usage of loading large feeds all at once
export async function parseStream(feedUrl) {
  const response = await fetch(feedUrl);
  
  if (!response.ok) {
    throw new Error(`Error fetching ${feedUrl}: ${response.status} ${response.statusText}`);
  }

  return new Promise((resolve, reject) => {
    const items = [];
    let currentItem = {};
    let currentTag = '';
    let isInItem = false;

    const parser = new htmlparser2.Parser({
      onopentag(name) {
        currentTag = name;
        if (name === 'item') {
          isInItem = true;
          currentItem = {};
        }
      },
      ontext(text) {
        if (isInItem) {
          switch (currentTag) {
            case 'title':
              currentItem.title = (currentItem.title || '') + text;
              break;
            case 'link':
              currentItem.link = (currentItem.link || '') + text;
              break;
            case 'pubdate':
            case 'date':
              currentItem.pubDate = (currentItem.pubDate || '') + text;
              break;
          }
        }
      },
      onclosetag(name) {
        if (name === 'item' && isInItem) {
          items.push({
            title: currentItem.title?.trim(),
            link: currentItem.link?.trim(),
            publishedAt: parsePubDate(currentItem.pubDate),
          });
          currentItem = {};
          isInItem = false;
        }
        currentTag = '';
      },
      onerror(error) {
        reject(error);
      },
      onend() {
        resolve(items);
      }
    });

    // Stream the response body
    const reader = response.body.getReader();
    
    function pump() {
      return reader.read().then(({ done, value }) => {
        if (done) {
          parser.end();
          return;
        }
        parser.write(new TextDecoder().decode(value));
        return pump();
      });
    }
    
    pump().catch(reject);
  });
}

export async function parse(feedUrl) {
  try {
    return parseStream(feedUrl);
  } catch (err) {
    return []
  }
}
