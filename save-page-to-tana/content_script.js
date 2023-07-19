function parseGeneric() {
  const pageUrl = window.location.href;
  const pageTitle = document.title;

  return {
    type: 'save_generic',
    url: pageUrl,
    title: pageTitle
  };
}

function parseBandcamp() {
  if (!document.querySelector('meta[content="Bandcamp"]')) {
    return { type: 'nothing' }
  }

  const ldScript = document.querySelector('script[type="application/ld+json"]')

  if (!ldScript) {
    return { type: 'nothing' }
  }

  const ldContent = JSON.parse(ldScript.textContent)

  if (ldContent['@type'] !== 'MusicRecording') {
    return { type: 'nothing' }
  }

  // not using ldContent to use the reald xxx.bandcamp.com url
  const url = document.querySelector('meta[property="og:url"]')?.getAttribute('content')

  if (!url) {
    return{ type: 'nothing' }
  }

  return {
    type: 'save_track',
    url: url,
    title: ldContent.name,
    artist: ldContent.byArtist.name,
  }
}

function parseYoutubeMusic() {
  if (!window.location.href.includes('music.youtube.com')) {
    return { type: 'nothing' }
  }

  // redirect to classic youtube
  return {
    type: 'redirect',
    url: window.location.href.replace('//music.', '//www.')
  }
}

function parseYoutube() {
  if (!window.location.href.includes('www.youtube.com')) {
    return { type: 'nothing' }
  }

  const lds = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
    .map(element => JSON.parse(element.textContent))
    .filter(ld => ld['@type'] === 'VideoObject')

  console.log({ lds })

  if (!lds.length) {
    return { type: 'nothing' }
  }

  const ld = lds[0]

  const artist = ld.author
    .replace(' - Topic', '')
    .trim()

  const title = ld.name
    .replace(new RegExp(`${artist}\\s[-–]\\s`), '')
    .replace(new RegExp(`\\s[-–]\\s${artist}`), '')
    .replace(/\s?\(Official Video\)/, '')
    .trim()

  return {
    type: 'save_track',
    url: window.location.href,
    title,
    artist,
  }
}

const parsers = [
  parseBandcamp,
  parseYoutubeMusic,
  parseYoutube,
  parseGeneric,
]

function parsePage() {
  for (const parser of parsers) {
    const result = parser()

    console.log({ parser, result })

    switch (result.type) {
      case 'redirect': {
        window.location.assign(result.url)
        return
      }

      case 'save_track': {
        chrome.runtime.sendMessage({
          type: 'saveTrack',
          url: result.url,
          title: result.title,
          artist: result.artist,
        });
        return;
      }

      case 'save_generic': {
        chrome.runtime.sendMessage({
          type: 'savePage',
          title: result.title,
          url: result.url,
        });
        return;
      }

      default:
        continue;
    }
  }
}

parsePage()
