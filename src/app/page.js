import { headers } from "next/headers";
import HomeClient from '@/components/HomeClient';
import { getExternalApi } from "@/lib/api";
import { getBaseUrl } from '@/lib/getBaseUrl';


async function getTrendingData(mediaType, timeWindow) {
  try {
    const genreResponse = await getExternalApi(`/genre/${mediaType}/list`, { language: "en-US" });
    const genresMap = new Map(genreResponse.genres.map(g => [g.id, g.name]));

    const page1Data = await getExternalApi(`/trending/${mediaType}/${timeWindow}`, {
      language: "en-US",
      page: 1
    });

    const page2Data = await getExternalApi(`/trending/${mediaType}/${timeWindow}`, {
      language: "en-US",
      page: 2
    });

    const combinedResults = [...page1Data.results, ...page2Data.results];

    const uniqueMovieIds = new Set();
    const uniqueItems = combinedResults.filter(item => {
      const isDuplicate = uniqueMovieIds.has(item.id);
      uniqueMovieIds.add(item.id);
      return !isDuplicate;
    });

    const first25Items = uniqueItems.slice(0, 25);

    const itemsWithGenres = first25Items.map((item) => ({
      ...item,
      genreNames: (item.genre_ids || [])
        .map((id) => genresMap.get(id))
        .filter(Boolean)
        .join(", "),
    }));

    return itemsWithGenres;
  } catch (error) {
    console.error(`Failed to fetch trending data for ${mediaType}:`, error);
    return [];
  }
}

async function getCategoryData(mediaType, category, limit) {
  try {
    const genreResponse = await getExternalApi(`/genre/${mediaType}/list`, { language: "en-US" });
    const genresMap = new Map(genreResponse.genres.map(g => [g.id, g.name]));

    const data1 = await getExternalApi(`/${mediaType}/${category}`, {
      language: "en-US",
      page: 1
    });

    const data2 = await getExternalApi(`/${mediaType}/${category}`, {
      language: "en-US",
      page: 2
    });

    const combinedResults = [...data1.results, ...data2.results];

    const uniqueMovieIds = new Set();
    const uniqueItems = combinedResults.filter(item => {
      const isDuplicate = uniqueMovieIds.has(item.id);
      uniqueMovieIds.add(item.id);
      return !isDuplicate;
    });

    const first25Items = uniqueItems.slice(0, 25);

    const itemsWithGenres = first25Items.map((item) => ({
      ...item,
      genreNames: (item.genre_ids || [])
        .map((id) => genresMap.get(id))
        .filter(Boolean)
        .join(", "),
    }));

    return itemsWithGenres;
  } catch (error) {
    console.error(`Failed to fetch category data for ${mediaType}/${category}:`, error);
    return [];
  }
}

async function getHeroData() {
  try {
    const data = await getExternalApi("/trending/all/day", {
      language: "en-US",
      page: 1,
    });

    if (data?.results && Array.isArray(data.results)) {
      return data.results.slice(0, 5);
    }
    return [];
  } catch (error) {
    console.error(`Failed to fetch carousel data:`, error);
    return [];
  }
}
async function getCarouselData() {
  try {
    const data = await getExternalApi("/trending/all/week", { language: "en-US", page: 1 });
    return data.results.slice(0, 10) || [];
  } catch (error) {
    console.error(`Failed to fetch carousel data:`, error);
    return [];
  }
}
async function fetchPageAds() {
  const requests = [
    { page: "Home", adsSize: "Horizontal", adsLocation: "Top" },
    { page: "Home", adsSize: "Horizontal", adsLocation: "Bottom" },
  ];

  try {
  
    const headersList = await headers();
    const host = headersList.get('host');
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const domain = `${protocol}://${host}`;

    const params = new URLSearchParams({ requests: JSON.stringify(requests) });
    const response = await fetch(`${domain}/api/movie-ads?${params.toString()}`);


    if (!response.ok) {
      throw new Error('Failed to fetch ads from API route');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'API result indicates failure');
    }

    const topAds = result.results.filter(r => r.criteria.adsLocation === "Top").flatMap(r => r.data || []);
    const bottomAds = result.results.filter(r => r.criteria.adsLocation === "Bottom").flatMap(r => r.data || []);

    return { topAds, bottomAds };

  } catch (error) {
    console.error("Server-side ad fetch failed:", error);
    return { topAds: [], bottomAds: [] };
  }
}

export async function generateMetadata() {
  return {
    title: 'Play8Movies: Situs Nonton Film & Series Online Sub Indo Free',
    description: 'Play8Movies: Situs Nonton Film & Series Online HD Gratis Subtitle Indonesia. Alternatif LK21, Rebahin, & Indoxxi. Lengkap: Drama Korea, film barat, & Animasi.',
    alternates: { canonical: '/' },
  };
}

export default async function Home() {

  const limitTrending = 15;
  const limitCategory = 7;

  const [
    carouselData,
    heroData,
    trendingMovies,
    trendingTv,
    nowPlayingMovies,
    popularMovies,
    topRatedMovies,
    upcomingMovies,
    airingTodayTv,
    onTheAirTv,
    popularTv,
    topRatedTv,
    pageAds,
  ] = await Promise.all([
    getCarouselData(),
    getHeroData(),
    getTrendingData("movie", "day", limitTrending),
    getTrendingData("tv", "day", limitTrending),
    getCategoryData("movie", "now_playing", limitCategory),
    getCategoryData("movie", "popular", limitCategory),
    getCategoryData("movie", "top_rated", limitCategory),
    getCategoryData("movie", "upcoming", limitCategory),
    getCategoryData("tv", "airing_today", limitCategory),
    getCategoryData("tv", "on_the_air", limitCategory),
    getCategoryData("tv", "popular", limitCategory),
    getCategoryData("tv", "top_rated", limitCategory),
    fetchPageAds(),
  ]);

  return (
    <HomeClient
      initialCarousel={carouselData}
      initialHero={heroData}
      initialTrendingMovies={trendingMovies}
      initialTrendingTv={trendingTv}
      initialNowPlaying={nowPlayingMovies}
      initialPopularMovies={popularMovies}
      initialTopRatedMovies={topRatedMovies}
      initialUpcomingMovies={upcomingMovies}
      initialAiringToday={airingTodayTv}
      initialOnTheAir={onTheAirTv}
      initialPopularTv={popularTv}
      initialTopRatedTv={topRatedTv}
      initialTopAds={pageAds.topAds}
      initialBottomAds={pageAds.bottomAds}
    />
  );
}
