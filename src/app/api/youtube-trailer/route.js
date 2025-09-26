import { NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const movieTitleQuery = searchParams.get('query');
  const contextMovieId = searchParams.get('movieId');

  if (!movieTitleQuery) {
    return NextResponse.json({ error: 'Query parameter "query" is required.' }, { status: 400 });
  }
  if (!GOOGLE_API_KEY) {
    return NextResponse.json({ error: 'Server configuration error: YouTube API key missing.' }, { status: 500 });
  }

  const cacheKey = movieTitleQuery.toLowerCase();
  const cachedData = cache.get(cacheKey);

  if (cachedData && cachedData.expiry > Date.now()) {
    return NextResponse.json({ youtubeUrl: cachedData.youtubeUrl });
  } else if (cachedData) {
    cache.delete(cacheKey);
  }

  const youtubeSearchUrl = new URL(`${YOUTUBE_API_BASE_URL}/search`);
  youtubeSearchUrl.searchParams.append('part', 'snippet');
  youtubeSearchUrl.searchParams.append('q', `${movieTitleQuery} trailer`);
  youtubeSearchUrl.searchParams.append('type', 'video');
  youtubeSearchUrl.searchParams.append('key', GOOGLE_API_KEY);
  youtubeSearchUrl.searchParams.append('maxResults', '1');

  const response = await fetch(youtubeSearchUrl.toString());

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error from YouTube API' }));
    return NextResponse.json({ error: `Failed to fetch trailer from YouTube. Status: ${response.status}.` }, { status: response.status });
  }

  const data = await response.json();

  if (data.items && data.items.length > 0) {
    const videoId = data.items[0].id.videoId;
    const youtubeUrl = `https://www.youtube.com/embed/${videoId}`;

    cache.set(cacheKey, {
      youtubeUrl: youtubeUrl,
      expiry: Date.now() + CACHE_TTL,
    });
    // console.log(`[Cache Set] Stored YouTube URL for "${movieTitleQuery}"`);
    // --- End Caching Logic ---

    return NextResponse.json({ youtubeUrl });
  } else {
    return NextResponse.json({ youtubeUrl: null, message: 'No relevant trailer video found for this query.' }, { status: 404 });
  }


}