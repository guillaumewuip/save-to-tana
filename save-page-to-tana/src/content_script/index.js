(() => {
  function parseJSONLD(content) {
    try {
      return JSON.parse(content)
    } catch(error) {
      // something we need to remove some excessive escaping
      // specially on Youtube
      return JSON.parse(content.replaceAll('\\', ''))
    }
  }

  function parseGeneric() {
    const pageUrl = window.location.href;
    const pageTitle = document.title;

    const selection = window.getSelection().toString();
    const content = selection ? selection : document.body.innerText;

    return {
      type: 'save_generic',
      url: pageUrl,
      title: pageTitle,
      content,
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

    const ldContent = parseJSONLD(ldScript.textContent)

    if (ldContent['@type'] === 'MusicRecording') {
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

    if (ldContent['@type'] === 'MusicAlbum') {
      // not using ldContent to use the reald xxx.bandcamp.com url
      const url = document.querySelector('meta[property="og:url"]')?.getAttribute('content')

      if (!url) {
        return{ type: 'nothing' }
      }

      return {
        type: 'save_album',
        url: url,
        title: ldContent.name,
        artist: ldContent.byArtist.name,
      }
    }

    return { type: 'nothing' }
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
      .map(element => parseJSONLD(element.textContent))
      .filter(ld => ld['@type'] === 'VideoObject')

    if (!lds.length) {
      return { type: 'nothing' }
    }

    const ld = lds[0]

    if (!ld.author || !ld.name) {
      return {
        type: 'save_generic',
        url: window.location.href,
        title: document.title,
        content,
      };
    }

    const artist = ld.author
      .replace(' - Topic', '')
      .trim()

    const title = ld.name
      .replace(new RegExp(`${artist}\\s[-–]\\s`), '')
      .replace(new RegExp(`\\s[-–]\\s${artist}`), '')
      .replace(/\s?\(Official Video\)/, '')
      .replace(/\s?\(Video Lyric\)/, '')
      .trim()

    return {
      type: 'save_track',
      url: window.location.href,
      title,
      artist,
    }
  }

  function parseSoundcloud() {
    if (!window.location.href.includes('soundcloud.com/')) {
      return {
        type: 'save_nothing',
      }
    }

    return {
      type: 'save_music',
      url: window.location.href,
      title: document.title,
      artist: undefined,
    }
  }

  function parseSpotify() {
    if (window.location.href.includes('open.spotify.com/album')) {
      return {
        type: 'save_album',
        url: window.location.href,
        title: document.title,
        artist: undefined,
      }
    }

    if (window.location.href.includes('open.spotify.com')) {
      return {
        type: 'save_music',
        url: window.location.href,
        title: document.title,
        artist: undefined,
      }
    }

    return {
      type: 'nothing'
    }
  }

  try {
    const parsers = [
      parseBandcamp,
      parseYoutubeMusic,
      parseYoutube,
      parseSoundcloud,
      parseSpotify,
      parseGeneric,
    ]

    for (const parser of parsers) {
      const result = parser()

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

        case 'save_album': {
          chrome.runtime.sendMessage({
            type: 'saveAlbum',
            url: result.url,
            title: result.title,
            artist: result.artist,
          });
          return;
        }

        case 'save_music': {
          chrome.runtime.sendMessage({
            type: 'saveMusic',
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
            content: result.content,
          });
          return;
        }

        default:
          continue;
      }
    }
  } catch (error) {
    console.error(error)
    chrome.runtime.sendMessage({
      type: 'SAVE_ERROR',
      error,
    });
  }
})();
