
const VIDSRC_EMBED_BASE_URL = process.env.NEXT_PUBLIC_VIDSRC_EMBED_URL;

export function getVidsrcEmbedUrl(tmdbId, options = {}) {
  const { subUrl = '', autoplay = false, dsLang = '', media = 'movie', season, episode } = options;

  if (!tmdbId) {
    console.error("TMDB ID is required to generate vidsrc embed URL.");
    return '';
  }

  if (!VIDSRC_EMBED_BASE_URL) {
    console.error("NEXT_PUBLIC_VIDSRC_EMBED_URL is not defined in environment variables.");
    return '';
  }

  const params = new URLSearchParams();

  params.append('tmdb', tmdbId);

  if (media === 'tv') {
    if (season !== undefined && season !== null) { 
      params.append('season', season.toString());
    }
    if (episode !== undefined && episode !== null) { 
      params.append('episode', episode.toString());
    }
 
    if ((season === undefined || season === null) || (episode === undefined || episode === null)) {
        console.warn("Vidsrc Embed Warning: Season and episode are recommended for TV series, but not provided. URL generated may default to first episode.");
    }
  }

  if (subUrl) {
    params.append('sub_url', subUrl);
  }
  if (autoplay) {
    params.append('autoplay', '1'); 
  }
  if (dsLang) {
    params.append('ds_lang', dsLang); 
  }

  return `${VIDSRC_EMBED_BASE_URL}/embed/${media}?${params.toString()}`;
}

