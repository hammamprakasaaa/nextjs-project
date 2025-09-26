import { getExternalApi } from "@/lib/api";
import { format, parseISO } from "date-fns";
import { getVidsrcEmbedUrl } from "@/lib/vidsrc";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import MediaDetailClientView from "@/components/MediaDetailClientView";
import MovieCarousel from "@/components/MovieCarousel";
import slugify from "slugify";

async function getTrendingData(mediaType, timeWindow, limit) {
  try {
    const genreResponse = await getExternalApi(`/genre/${mediaType}/list`, {
      language: "en-US",
    });
    const genresMap = new Map(genreResponse.genres.map((g) => [g.id, g.name]));
    const data = await getExternalApi(`/trending/${mediaType}/${timeWindow}`, {
      language: "en-US",
    });
    const itemsWithGenres = data.results.map((item) => ({
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
async function getHomeCarouselData() {
  try {
    const data = await getExternalApi("/trending/all/week", {
      language: "en-US",
      page: 1,
    });
    return data.results.slice(0, 10) || [];
  } catch (error) {
    console.error(`Failed to fetch carousel data:`, error);
    return [];
  }
}
async function getMediaDetails(id, media, title = null) {
  try {
    const details = await getExternalApi(`/${media}/${id}`, {
      language: "id-ID",
    });
    const credits = await getExternalApi(`/${media}/${id}/credits`, {
      language: "id-ID",
    });
    return { ...details, credits };
  } catch (error) {
    console.error(`Failed to fetch details for ${media} ID ${id}:`, error);
    return null;
  }
}

async function getSeoMetaFromApi(id) {
  try {
    const backendBaseUrl =
      process.env.NEXT_PUBLIC_ADS_URL || "https://play8movie.com";
    const seoApiUrl = `${backendBaseUrl}/api/seometa/${id}`;

    const seoResponse = await fetch(seoApiUrl, { cache: "no-store" });
    const seoData = await seoResponse.json();

    if (seoData.success && seoData.data) {
      return seoData.data;
    }

    return null;
  } catch (error) {
    console.error(`Error fetching SEO metadata for ID ${id}:`, error);
    return null;
  }
}
function createSlug(title) {
  if (!title) return "";
  let slug = slugify(title, {
    lower: true,
    strict: true,
    locale: "en",
  });
  return slug || title.trim().replace(/\s+/g, "-");
}

export async function generateMetadata({ params }) {
  const { id, media } = await params;
  const headersList = await headers();
  const host = headersList.get("host");
  const baseUrl = `https://${host}`;

  const defaultTitle = "Content Not Found";
  const defaultDescription =
    "Nonton film dan serial TV gratis, full movie dengan subtitle Indonesia online. Kualitas HD hanya di Play8Movies.";

  try {
    const [seoData, movieDetails] = await Promise.all([
      getSeoMetaFromApi(id),
      getExternalApi(`/${media}/${id}`, { language: "en-US" }),
    ]);

    let movietitle = movieDetails?.title || movieDetails?.name || defaultTitle;
    let canonicalPath = `/stream/${media}/${id}/${createSlug(movietitle)}`;

    if (!movieDetails) {
      console.log("movieDetails");
      return {
        title: defaultTitle,
        description: defaultDescription,
        alternates: {
          canonical: baseUrl,
        },
      };
    }

    if (seoData) {
      console.log("seoData");
      const { meta_title, meta_description } = seoData;
      return {
        title: meta_title,
        description: meta_description,
        alternates: {
          canonical: `${baseUrl}${canonicalPath}`,
        },
      };
    }

    const releaseDate =
      movieDetails.release_date || movieDetails.first_air_date;
    const formattedReleaseDate = releaseDate
      ? new Intl.DateTimeFormat("en-US", { year: "numeric" }).format(
          parseISO(releaseDate)
        )
      : "";

    const metaDescription =
      movieDetails.overview ||
      `Nonton film ${movietitle} (${formattedReleaseDate}) full movie dengan subtitle Indonesia online. Gratis & kualitas HD di Play8Movies: alternatif LK21 & Rebahin.`;

    return {
      title: `Nonton ${movietitle} Full-Sub Indo | Play8movies`,
      description: metaDescription,
      alternates: {
        canonical: `${baseUrl}${canonicalPath}`,
      },
    };
  } catch (error) {
    console.error(`Error generating metadata for ID ${id}:`, error);

    return {
      title: defaultTitle,
      description: defaultDescription,
      alternates: {
        canonical: baseUrl,
      },
    };
  }
}

export default async function MediaDetailPage({ params }) {
  const { media, id, title } = await params;

  const _mediaDetails = await getExternalApi(`/${media}/${id}`, {
    language: "en-US",
  });
  const movietitle = _mediaDetails.title || _mediaDetails.name || "not-found";
  const mtitle = createSlug(movietitle);

  if (title !== mtitle) {
    redirect(`/stream/${media}/${id}/${mtitle}`);
  }

  const [mediaDetails, trendingMovies, trendingTv, carouselData, seoData] =
    await Promise.all([
      getMediaDetails(id, media),
      getTrendingData("movie", "day", 7),
      getTrendingData("tv", "day", 7),
      getHomeCarouselData(),
      getSeoMetaFromApi(id),
    ]);

  if (!mediaDetails) {
    notFound();
  }

  let initialSeason = null;
  let initialEpisode = null;
  let seasonsData = [];

  if (
    media === "tv" &&
    mediaDetails.seasons &&
    mediaDetails.seasons.length > 0
  ) {
    seasonsData = mediaDetails.seasons
      .filter(
        (s) =>
          s.season_number > 0 || (s.season_number === 0 && s.episode_count > 0)
      )
      .sort((a, b) => a.season_number - b.season_number);

    if (seasonsData.length > 0) {
      initialSeason = seasonsData[0].season_number;
      initialEpisode = 1;
    }
  }

  const streamUrl = getVidsrcEmbedUrl(id, {
    autoplay: true,
    dsLang: "id",
    media: media,
    season: initialSeason,
    episode: initialEpisode,
  });

  return (
    <MediaDetailClientView
      mediaDetails={mediaDetails}
      streamUrl={streamUrl}
      mediaType={media}
      initialSeason={initialSeason}
      initialEpisode={initialEpisode}
      seasonsData={seasonsData}
      initialTrendingMovies={trendingMovies}
      initialTrendingTv={trendingTv}
      initialCarousel={carouselData}
      initialSEOData={seoData}
    />
  );
}
