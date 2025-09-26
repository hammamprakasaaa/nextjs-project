import { NextResponse } from 'next/server';

import { getVidsrcEmbedUrl } from "@/lib/vidsrc"; 

export async function GET(request) {
  try {
    const { pathname, searchParams } = request.nextUrl;

    const pathSegments = pathname.split('/').slice(3);
    const [media, tmdbId] = pathSegments;

    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (!media || !tmdbId) {
      return NextResponse.json({ 
        error: 'Missing required parameters: media type and TMDB ID.' 
      }, { status: 400, headers });
    }

    const options = {
      subUrl: searchParams.get('sub_url'),
      autoplay: searchParams.get('autoplay') === '1',
      dsLang: searchParams.get('ds_lang'),
      season: searchParams.get('season'),
      episode: searchParams.get('episode'),
      media: media 
    };

    const vidsrcUrl = getVidsrcEmbedUrl(tmdbId, options);

    if (!vidsrcUrl) {
      return NextResponse.json({ 
        error: 'Failed to generate Vidsrc URL.' 
      }, { status: 500, headers });
    }

    return NextResponse.json({ url: vidsrcUrl }, { headers });

  } catch (error) {
    console.error('Vidsrc API Error:', error);
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    return NextResponse.json({
      error: 'An internal server error occurred.',
      details: error.message,
    }, { status: 500, headers });
  }
}

export async function OPTIONS(request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  return new NextResponse(null, { status: 204, headers });
}